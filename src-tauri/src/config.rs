use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VocabularyEntry {
    pub from: String,
    pub to: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub timestamp: String,
    pub raw: String,
    pub refined: String,
    pub word_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub groq_api_key: String,
    pub hotkey: String,
    pub stt_model: String,
    pub llm_model: String,
    pub overlay_position: String,
    pub system_prompt: String,
    pub vocabulary: Vec<VocabularyEntry>,
    pub history: Vec<HistoryEntry>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            groq_api_key: String::new(),
            hotkey: "Alt+Space".to_string(),
            stt_model: "whisper-large-v3".to_string(),
            llm_model: "llama-3.3-70b-versatile".to_string(),
            overlay_position: "top".to_string(),
            system_prompt: default_system_prompt(),
            vocabulary: vec![
                VocabularyEntry { from: "بيتكوين".to_string(), to: "Bitcoin".to_string() },
                VocabularyEntry { from: "ايثيريوم".to_string(), to: "Ethereum".to_string() },
                VocabularyEntry { from: "سولانا".to_string(), to: "Solana".to_string() },
            ],
            history: Vec::new(),
        }
    }
}

fn default_system_prompt() -> String {
    r#"أنت مساعد متخصص في تحرير النصوص المنطوقة باللهجة المصرية العامية.

مهمتك:
1. حافظ على اللهجة المصرية العامية بالكامل، لا تحولها للفصحى أبداً.
2. أضف علامات الترقيم المناسبة (نقط، فواصل، علامات استفهام).
3. صحح الكلمات التقنية الإنجليزية: (Bitcoin، Ethereum، Solana، Next.js، Docker، API، React، TypeScript، GitHub، etc.) واكتبها بالإنجليزية داخل الجمل العربية.
4. صحح الأخطاء الإملائية الواضحة فقط.
5. لا تضيف أي كلمات جديدة أو تغير المعنى.
6. أرسل النص المحرر فقط بدون أي شرح أو تعليق.

مثال:
المدخل: "انا بعمل بروجيكت بي نيكست جي اس وعندي مشكلة في الاي بي اي"
المخرج: "أنا بعمل project بـ Next.js وعندي مشكلة في الـ API""#.to_string()
}

fn config_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("ektb")
        .join("config.json")
}

pub fn load_config() -> AppConfig {
    let path = config_path();
    if path.exists() {
        match std::fs::read_to_string(&path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => AppConfig::default(),
        }
    } else {
        AppConfig::default()
    }
}

pub fn save_config(config: &AppConfig) -> Result<()> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(config)?;
    std::fs::write(path, content)?;
    Ok(())
}
