use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use anyhow::{anyhow, Result};
use tauri::{AppHandle, Emitter};

pub struct AudioRecorder {
    pub samples: Arc<Mutex<Vec<f32>>>,
    pub is_recording: Arc<AtomicBool>,
}

impl AudioRecorder {
    pub fn new() -> Self {
        Self {
            samples: Arc::new(Mutex::new(Vec::new())),
            is_recording: Arc::new(AtomicBool::new(false)),
        }
    }
}

/// Start audio capture on a background thread.
/// Emits `audio-level` events (f32 RMS, 0–1) every ~50 ms so the overlay
/// can animate bars in response to actual microphone input.
pub fn start_capture(
    samples: Arc<Mutex<Vec<f32>>>,
    is_recording: Arc<AtomicBool>,
    app: AppHandle,
) -> Result<()> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or_else(|| anyhow!("No default input device found"))?;

    let config = device.default_input_config()?;
    let sample_rate = config.sample_rate().0;
    let channels = config.channels();

    log::info!(
        "Audio device: {}, sample_rate: {}, channels: {}",
        device.name().unwrap_or_default(),
        sample_rate,
        channels
    );

    let samples_clone = Arc::clone(&samples);
    is_recording.store(true, Ordering::SeqCst);
    let is_rec_clone = Arc::clone(&is_recording);

    std::thread::spawn(move || {
        let stream = device
            .build_input_stream(
                &config.into(),
                move |data: &[f32], _info: &cpal::InputCallbackInfo| {
                    if is_rec_clone.load(Ordering::SeqCst) {
                        // Mix down to mono
                        let mono: Vec<f32> = data
                            .chunks(channels as usize)
                            .map(|ch| ch.iter().sum::<f32>() / ch.len() as f32)
                            .collect();
                        samples_clone.lock().unwrap().extend_from_slice(&mono);
                    }
                },
                move |err| {
                    log::error!("Audio stream error: {}", err);
                },
                None,
            )
            .expect("Failed to build input stream");

        stream.play().expect("Failed to start audio stream");

        // Every 50 ms, calculate RMS and emit `audio-level` — release lock before emit
        let mut last_len: usize = 0;
        while is_recording.load(Ordering::SeqCst) {
            std::thread::sleep(std::time::Duration::from_millis(50));

            // Scope the lock so it's released before calling app.emit()
            let rms_opt = {
                let current = samples.lock().unwrap();
                let new_len = current.len();
                if new_len > last_len {
                    let chunk = &current[last_len..new_len];
                    let rms = (chunk.iter().map(|s| s * s).sum::<f32>() / chunk.len() as f32).sqrt();
                    last_len = new_len;
                    Some(rms)
                } else {
                    None
                }
            }; // lock released here

            if let Some(rms) = rms_opt {
                app.emit("audio-level", rms).ok();
            }
        }

        drop(stream);
    });

    Ok(())
}

/// Encode captured samples to WAV bytes (16-bit PCM, 16kHz mono — optimal for Whisper)
pub fn encode_to_wav(samples: &[f32], original_sample_rate: u32) -> Result<Vec<u8>> {
    use hound::{WavSpec, WavWriter, SampleFormat};
    use std::io::Cursor;

    // Resample to 16000 Hz (Whisper optimal)
    let target_rate: u32 = 16000;
    let resampled = if original_sample_rate != target_rate {
        resample(samples, original_sample_rate, target_rate)
    } else {
        samples.to_vec()
    };

    let spec = WavSpec {
        channels: 1,
        sample_rate: target_rate,
        bits_per_sample: 16,
        sample_format: SampleFormat::Int,
    };

    let mut buf = Vec::new();
    {
        let cursor = Cursor::new(&mut buf);
        let mut writer = WavWriter::new(cursor, spec)?;
        for &s in &resampled {
            let sample = (s.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
            writer.write_sample(sample)?;
        }
        writer.finalize()?;
    }

    Ok(buf)
}

/// Simple linear resampling
fn resample(samples: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
    if from_rate == to_rate {
        return samples.to_vec();
    }
    let ratio = from_rate as f64 / to_rate as f64;
    let out_len = (samples.len() as f64 / ratio) as usize;
    (0..out_len)
        .map(|i| {
            let src_pos = i as f64 * ratio;
            let src_idx = src_pos as usize;
            let frac = src_pos - src_idx as f64;
            let s0 = samples.get(src_idx).copied().unwrap_or(0.0);
            let s1 = samples.get(src_idx + 1).copied().unwrap_or(s0);
            s0 + (s1 - s0) * frac as f32
        })
        .collect()
}

/// Get the default input device's sample rate
pub fn get_default_sample_rate() -> u32 {
    cpal::default_host()
        .default_input_device()
        .and_then(|d| d.default_input_config().ok())
        .map(|c| c.sample_rate().0)
        .unwrap_or(44100)
}

/// Get the default input device name
pub fn get_default_input_device_name() -> String {
    cpal::default_host()
        .default_input_device()
        .and_then(|d| d.name().ok())
        .unwrap_or_else(|| "غير معروف".to_string())
}
