mod audio;
mod commands;
mod config;
mod groq;
mod inject;

use commands::RecordingState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(RecordingState::new())
        .setup(|app| {
            let handle = app.handle().clone();
            let state = handle.state::<RecordingState>();
            let cfg = state.config.lock().unwrap().clone();
            
            commands::register_hotkey(&handle, &cfg.hotkey);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_recording,
            commands::stop_and_process,
            commands::get_config,
            commands::save_config_cmd,
            commands::get_history,
            commands::clear_history,
            commands::delete_history_entry,
            commands::is_recording,
            commands::get_mic_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
