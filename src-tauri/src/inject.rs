use anyhow::Result;
use std::thread;
use std::time::Duration;

#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, SetForegroundWindow, ShowWindow, SW_RESTORE,
};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL, VK_V,
};

pub fn inject_text(
    text: &str,
    #[cfg(target_os = "windows")] editor_hwnd: isize,
) -> Result<()> {
    let mut clipboard = arboard::Clipboard::new()
        .map_err(|e| anyhow::anyhow!("Failed to open clipboard: {}", e))?;
    clipboard.set_text(text)
        .map_err(|e| anyhow::anyhow!("Failed to set clipboard text: {}", e))?;
    drop(clipboard);

    #[cfg(target_os = "windows")]
    {
        let hwnd = editor_hwnd;
        let join_handle = thread::spawn(move || -> Result<()> {
            unsafe {
                if hwnd != 0 {
                    ShowWindow(hwnd, SW_RESTORE);
                    SetForegroundWindow(hwnd);
                    thread::sleep(Duration::from_millis(150));

                    let fg = GetForegroundWindow();
                    if fg != hwnd {
                        log::warn!(
                            "Focus not on target (expected {}, got {}), retrying...",
                            hwnd, fg
                        );
                        SetForegroundWindow(hwnd);
                        thread::sleep(Duration::from_millis(100));
                    }

                    send_ctrl_v();
                    thread::sleep(Duration::from_millis(50));
                } else {
                    log::warn!("No editor HWND saved, injecting into current foreground window");
                    thread::sleep(Duration::from_millis(200));
                    send_ctrl_v();
                }
            }
            Ok(())
        });

        join_handle
            .join()
            .map_err(|_| anyhow::anyhow!("Injection thread panicked"))??;
    }

    #[cfg(not(target_os = "windows"))]
    {
        thread::sleep(Duration::from_millis(300));
        use enigo::{Enigo, KeyboardControllable};
        let mut enigo = Enigo::new();
        enigo.key_down(enigo::Key::Control);
        thread::sleep(Duration::from_millis(30));
        enigo.key_click(enigo::Key::Layout('v'));
        thread::sleep(Duration::from_millis(30));
        enigo.key_up(enigo::Key::Control);
    }

    Ok(())
}

#[cfg(target_os = "windows")]
unsafe fn send_ctrl_v() {
    use std::mem;

    let mut inputs: [INPUT; 4] = mem::zeroed();

    inputs[0].r#type = INPUT_KEYBOARD;
    inputs[0].Anonymous.ki = KEYBDINPUT {
        wVk: VK_CONTROL,
        wScan: 0,
        dwFlags: 0,
        time: 0,
        dwExtraInfo: 0,
    };

    inputs[1].r#type = INPUT_KEYBOARD;
    inputs[1].Anonymous.ki = KEYBDINPUT {
        wVk: VK_V,
        wScan: 0,
        dwFlags: 0,
        time: 0,
        dwExtraInfo: 0,
    };

    inputs[2].r#type = INPUT_KEYBOARD;
    inputs[2].Anonymous.ki = KEYBDINPUT {
        wVk: VK_V,
        wScan: 0,
        dwFlags: KEYEVENTF_KEYUP,
        time: 0,
        dwExtraInfo: 0,
    };

    inputs[3].r#type = INPUT_KEYBOARD;
    inputs[3].Anonymous.ki = KEYBDINPUT {
        wVk: VK_CONTROL,
        wScan: 0,
        dwFlags: KEYEVENTF_KEYUP,
        time: 0,
        dwExtraInfo: 0,
    };

    let sent = SendInput(4, inputs.as_ptr(), mem::size_of::<INPUT>() as i32);
    log::info!("SendInput dispatched {} of 4 key events", sent);
    if sent == 0 {
        log::error!("SendInput failed — key events were blocked (UIPI or another issue)");
    }
}
