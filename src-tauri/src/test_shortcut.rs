use tauri_plugin_global_shortcut::Shortcut;
use std::str::FromStr;

fn main() {
    let s = Shortcut::from_str("Ctrl+Shift+D").unwrap();
}
