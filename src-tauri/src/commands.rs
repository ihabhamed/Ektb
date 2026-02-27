use crate::audio;
use crate::config::{self, AppConfig, HistoryEntry};
use crate::groq;
use crate::inject;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager, State};
use anyhow::Result;

#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};

pub struct RecordingState {
    pub samples: Arc<Mutex<Vec<f32>>>,
    pub is_recording: Arc<AtomicBool>,
    pub sample_rate: Arc<Mutex<u32>>,
    pub config: Arc<Mutex<AppConfig>>,
    /// HWND of the editor window focused when recording started (Windows only).
    /// Used to restore focus before text injection so Ctrl+V reaches the editor.
    pub editor_hwnd: Arc<Mutex<isize>>,
}

impl RecordingState {
    pub fn new() -> Self {
        let cfg = config::load_config();
        Self {
            samples: Arc::new(Mutex::new(Vec::new())),
            is_recording: Arc::new(AtomicBool::new(false)),
            sample_rate: Arc::new(Mutex::new(audio::get_default_sample_rate())),
            config: Arc::new(Mutex::new(cfg)),
            editor_hwnd: Arc::new(Mutex::new(0)),
        }
    }
}

#[tauri::command]
pub async fn start_recording(
    state: State<'_, RecordingState>,
    app: AppHandle,
) -> Result<(), String> {
    if state.is_recording.load(Ordering::SeqCst) {
        return Err("Already recording".to_string());
    }

    // Clear previous samples
    state.samples.lock().unwrap().clear();

    // Update sample rate
    let sr = audio::get_default_sample_rate();
    *state.sample_rate.lock().unwrap() = sr;

    audio::start_capture(
        Arc::clone(&state.samples),
        Arc::clone(&state.is_recording),
        app.clone(),
    )
    .map_err(|e| e.to_string())?;

    app.emit("recording-started", ()).ok();
    log::info!("Recording started");
    Ok(())
}

#[tauri::command]
pub async fn stop_and_process(
    state: State<'_, RecordingState>,
    app: AppHandle,
) -> Result<String, String> {
    if !state.is_recording.load(Ordering::SeqCst) {
        return Err("Not currently recording".to_string());
    }

    // Signal stop
    state.is_recording.store(false, Ordering::SeqCst);
    app.emit("recording-stopped", ()).ok();

    // Give audio thread time to flush
    tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;

    let samples = state.samples.lock().unwrap().clone();
    if samples.is_empty() {
        return Err("No audio captured".to_string());
    }

    // Check if audio is mostly silence (RMS energy below threshold)
    let rms = (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();
    log::info!("Audio RMS energy: {:.6}", rms);
    if rms < 0.005 {
        return Err("No speech detected".to_string());
    }

    let sample_rate = *state.sample_rate.lock().unwrap();
    let config = state.config.lock().unwrap().clone();

    if config.groq_api_key.is_empty() {
        return Err("No Groq API key configured. Please add it in Settings.".to_string());
    }

    // Encode to WAV
    app.emit("processing-status", "transcribing").ok();
    let wav_bytes = audio::encode_to_wav(&samples, sample_rate)
        .map_err(|e| e.to_string())?;

    // STT
    let raw_text = groq::transcribe_audio(wav_bytes, &config.groq_api_key, &config.stt_model)
        .await
        .map_err(|e| e.to_string())?;

    if raw_text.trim().is_empty() {
        return Err("No speech detected".to_string());
    }

    // LLM refinement
    app.emit("processing-status", "refining").ok();
    let vocab: Vec<(String, String)> = config
        .vocabulary
        .iter()
        .map(|v| (v.from.clone(), v.to.clone()))
        .collect();

    let refined = groq::refine_text(&raw_text, &config.groq_api_key, &config.system_prompt, &config.llm_model, &vocab)
        .await
        .map_err(|e| e.to_string())?;

    // Text injection — inject_text will restore focus internally right before Ctrl+V
    app.emit("processing-status", "injecting").ok();
    inject::inject_text(
        &refined,
        #[cfg(target_os = "windows")]
        *state.editor_hwnd.lock().unwrap(),
    ).map_err(|e| e.to_string())?;

    // Save to history
    let entry = HistoryEntry {
        id: uuid_simple(),
        timestamp: current_timestamp(),
        raw: raw_text,
        refined: refined.clone(),
        word_count: refined.split_whitespace().count(),
    };

    {
        let mut cfg = state.config.lock().unwrap();
        cfg.history.insert(0, entry);
        // Keep last 100 entries
        if cfg.history.len() > 100 {
            cfg.history.truncate(100);
        }
        config::save_config(&cfg).ok();
    }

    app.emit("processing-status", "done").ok();
    app.emit("transcription-complete", &refined).ok();

    Ok(refined)
}

#[tauri::command]
pub fn get_config(state: State<'_, RecordingState>) -> AppConfig {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_config_cmd(
    state: State<'_, RecordingState>,
    app: AppHandle,
    config: AppConfig,
) -> Result<(), String> {
    let mut cfg = state.config.lock().unwrap();
    let hotkey_changed = cfg.hotkey != config.hotkey;
    *cfg = config.clone();
    
    // Save to disk
    let result = config::save_config(&cfg).map_err(|e| e.to_string());
    
    // Dynamically re-register hotkey if it was changed
    if hotkey_changed {
        register_hotkey(&app, &config.hotkey);
    }
    
    result
}

/// Normalize the hotkey string from frontend format to Tauri-compatible format.
/// Frontend sends: "Ctrl+Space", "Alt+A", "Ctrl+Shift+Z"
/// Tauri expects:  "CTRL+SPACE", "ALT+A", "CTRL+SHIFT+Z"
fn normalize_hotkey(hotkey_str: &str) -> String {
    hotkey_str
        .split('+')
        .map(|part| -> String {
            match part.trim() {
                "Ctrl" | "ctrl" | "Control" | "control" => "CTRL".to_string(),
                "Alt" | "alt" => "ALT".to_string(),
                "Shift" | "shift" => "SHIFT".to_string(),
                "Super" | "super" | "Meta" | "meta" | "Win" | "win" => "SUPER".to_string(),
                "Space" | "space" => "SPACE".to_string(),
                "Enter" | "enter" | "Return" | "return" => "ENTER".to_string(),
                "Tab" | "tab" => "TAB".to_string(),
                "Escape" | "escape" | "Esc" | "esc" => "ESCAPE".to_string(),
                "Backspace" | "backspace" => "BACKSPACE".to_string(),
                "Delete" | "delete" | "Del" | "del" => "DELETE".to_string(),
                "ArrowUp" | "Up" => "UP".to_string(),
                "ArrowDown" | "Down" => "DOWN".to_string(),
                "ArrowLeft" | "Left" => "LEFT".to_string(),
                "ArrowRight" | "Right" => "RIGHT".to_string(),
                other => other.to_uppercase(),
            }
        })
        .collect::<Vec<String>>()
        .join("+")
}

pub fn register_hotkey(app: &AppHandle, hotkey_str: &str) {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
    use std::str::FromStr;

    let normalized = normalize_hotkey(hotkey_str);
    log::info!("Attempting to register hotkey: '{}' (normalized from '{}')", normalized, hotkey_str);

    if let Ok(shortcut) = Shortcut::from_str(&normalized) {
        let _ = app.global_shortcut().unregister_all();
        
        let handle = app.clone();
        match app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let state = handle.state::<RecordingState>();
                let is_rec = state.is_recording.load(Ordering::SeqCst);
                let handle2 = handle.clone();
                
                    if is_rec {
                    tauri::async_runtime::spawn(async move {
                        let state = handle2.state::<RecordingState>();
                        match stop_and_process(state, handle2.clone()).await {
                            Ok(text) => {
                                log::info!("Injected: {}", text);
                                // Brief pause so user sees the "done" animation, then hide overlay
                                tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
                                // Tell frontend to animate out and hide itself
                                handle2.emit("overlay-hide", ()).ok();
                                // Backend safety-net hide
                                tokio::time::sleep(tokio::time::Duration::from_millis(400)).await;
                                if let Some(overlay) = handle2.get_webview_window("overlay") {
                                    let _ = overlay.hide();
                                }
                            },
                            Err(e) => {
                                log::error!("Pipeline error: {}", e);
                                handle2.emit("error", &e).ok();
                                // Hide overlay after error delay
                                tokio::time::sleep(tokio::time::Duration::from_millis(3200)).await;
                                handle2.emit("overlay-hide", ()).ok();
                                tokio::time::sleep(tokio::time::Duration::from_millis(400)).await;
                                if let Some(overlay) = handle2.get_webview_window("overlay") {
                                    let _ = overlay.hide();
                                }
                            }
                        }
                    });
                } else {
                    // Capture the focused editor HWND synchronously — before any
                    // async work or overlay display can change the foreground window.
                    #[cfg(target_os = "windows")]
                    {
                        let hwnd = unsafe { GetForegroundWindow() };
                        *state.editor_hwnd.lock().unwrap() = hwnd;
                        log::info!("Captured editor HWND: {} (synchronous)", hwnd);
                    }

                    tauri::async_runtime::spawn(async move {
                        // Show overlay without stealing focus from active editor
                        if let Some(overlay) = handle2.get_webview_window("overlay") {
                            let _ = overlay.show();
                            let _ = overlay.set_ignore_cursor_events(true);
                        }

                        // Immediately give focus back to the editor
                        #[cfg(target_os = "windows")]
                        {
                            let hwnd = *handle2.state::<RecordingState>().editor_hwnd.lock().unwrap();
                            if hwnd != 0 {
                                unsafe { SetForegroundWindow(hwnd); }
                            }
                        }

                        handle2.emit("show-overlay", ()).ok();

                        let state = handle2.state::<RecordingState>();
                        if let Err(e) = start_recording(state, handle2.clone()).await {
                            log::error!("Start recording error: {}", e);
                            handle2.emit("error", &e).ok();
                            tokio::time::sleep(tokio::time::Duration::from_millis(3200)).await;
                            if let Some(overlay) = handle2.get_webview_window("overlay") {
                                let _ = overlay.hide();
                            }
                        }
                    });
                }
            }
        }) {
            Ok(_) => log::info!("Registered global hotkey: {}", normalized),
            Err(e) => {
                log::error!("Failed to register hotkey '{}': {}", normalized, e);
                app.emit("error", format!("فشل تسجيل الاختصار '{}'. جرب اختصاراً مختلفاً.", hotkey_str)).ok();
            }
        }
    } else {
        log::error!("Invalid hotkey format after normalization: '{}'", normalized);
        app.emit("error", format!("صيغة الاختصار '{}' غير صحيحة. جرب مثلاً: Ctrl+Space", hotkey_str)).ok();
    }
}

#[tauri::command]
pub fn get_history(state: State<'_, RecordingState>) -> Vec<HistoryEntry> {
    state.config.lock().unwrap().history.clone()
}

#[tauri::command]
pub fn clear_history(state: State<'_, RecordingState>) -> Result<(), String> {
    let mut cfg = state.config.lock().unwrap();
    cfg.history.clear();
    config::save_config(&cfg).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_history_entry(
    state: State<'_, RecordingState>,
    id: String,
) -> Result<(), String> {
    let mut cfg = state.config.lock().unwrap();
    cfg.history.retain(|e| e.id != id);
    config::save_config(&cfg).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_recording(state: State<'_, RecordingState>) -> bool {
    state.is_recording.load(Ordering::SeqCst)
}

#[tauri::command]
pub fn get_mic_name() -> String {
    audio::get_default_input_device_name()
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("{:x}", t)
}

fn current_timestamp() -> String {
    // Simple RFC3339 approximation using elapsed seconds
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Format as ISO 8601 date-time
    let s = secs;
    let sec = s % 60;
    let min = (s / 60) % 60;
    let hour = (s / 3600) % 24;
    let days = s / 86400;
    // Approximate date (from 1970-01-01)
    let year = 1970 + days / 365;
    let month = (days % 365) / 30 + 1;
    let day = (days % 365) % 30 + 1;
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", year, month, day, hour, min, sec)
}
