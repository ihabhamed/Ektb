# Ektb - Your AI-powered voice-to-text typing assistant

![Ektb Logo](./ektb_logo.png)

Ektb is a modern, open-source software application built with **Rust (Tauri)** and **Next.js**. It leverages advanced AI models for voice-to-text, providing a seamless writing and dictation experience for users globally.

## ✨ Features
- **Multi-Model Support:** Choose from multiple AI models (Groq, etc.) directly from the settings.
- **Global Hotkeys:** Capture audio seamlessly anywhere on your OS.
- **Auto-Injection:** Automatically type the transcribed text into any active editor (VS Code, Notepad, etc.).
- **Modern UI:** A clean, professional Next.js interface wrapped in a high-performance Rust backend.
- **Cross-Platform:** Available for Windows, macOS, and Linux.

---

## 🚀 Quick Setup (For Users)
Ektb is designed to be **Plug and Play**. You do NOT need to be a developer to use it.

1. Go to the [Releases](https://github.com/ihabhamed/Ektb/releases) page.
2. Download the version for your operating system (e.g., `.exe` for Windows).
3. Install and open Ektb.
4. **Setup Wizard:** On your first launch, the app will ask for your AI API Key (e.g., Groq). Simply paste it in the stylish settings page, and it will be securely saved on your device.

*To update the app in the future, Ektb will automatically notify you when a new release is available!*

---

## 🛠️ Developer Setup (For Contributors)

Ektb is split into two parts: the frontend (Next.js) and the backend (Rust + Tauri).

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/tools/install)
- *(Windows only)* C++ Build Tools (via Visual Studio Build Tools).

### Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/ihabhamed/Ektb.git
   cd Ektb
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run tauri dev
   ```

## 🤝 Contributing
We welcome contributions! Please feel free to submit a Pull Request.
Make sure to format your code using `npm run lint` and `cargo fmt`.

## 📄 License
This project is open-source under the [MIT License](LICENSE).
