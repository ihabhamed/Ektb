use anyhow::{anyhow, Result};
use reqwest::multipart;
use serde::Deserialize;

const GROQ_BASE: &str = "https://api.groq.com/openai/v1";

#[derive(Deserialize)]
struct TranscriptionResponse {
    text: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct ChatMessage {
    content: String,
}

/// Transcribe WAV audio bytes using Groq Whisper
pub async fn transcribe_audio(wav_bytes: Vec<u8>, api_key: &str, stt_model: &str) -> Result<String> {
    let client = reqwest::Client::new();

    let file_part = multipart::Part::bytes(wav_bytes)
        .file_name("audio.wav")
        .mime_str("audio/wav")?;

    let model = stt_model.to_string();
    let form = multipart::Form::new()
        .part("file", file_part)
        .text("model", model)
        .text("language", "ar")
        .text("response_format", "text");

    let resp = client
        .post(format!("{}/audio/transcriptions", GROQ_BASE))
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow!("Groq STT error {}: {}", status, body));
    }

    // Whisper with response_format=text returns plain text, not JSON
    let text = resp.text().await?.trim().to_string();
    log::info!("STT raw transcription: {}", text);
    Ok(text)
}

/// Refine raw transcription using Groq LLM — preserves Egyptian dialect
pub async fn refine_text(
    raw_text: &str,
    api_key: &str,
    system_prompt: &str,
    model: &str,
    vocabulary: &[(String, String)],
) -> Result<String> {
    let client = reqwest::Client::new();

    // Apply vocabulary overrides before sending to LLM
    let mut processed = raw_text.to_string();
    for (from, to) in vocabulary {
        if !from.is_empty() {
            processed = processed.replace(from.as_str(), to.as_str());
        }
    }

    // If model is "off", skip LLM and return processed text with vocab substitutions only
    if model == "off" {
        log::info!("LLM model is 'off', skipping refinement — using STT text with vocab applied.");
        return Ok(processed);
    }

    // If system_prompt is empty, skip LLM and return processed text directly
    if system_prompt.trim().is_empty() {
        log::info!("System prompt is empty, skipping LLM — using raw STT text.");
        return Ok(processed);
    }

    let messages = serde_json::json!([
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": processed
        }
    ]);

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 2048
    });

    let resp = client
        .post(format!("{}/chat/completions", GROQ_BASE))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow!("Groq LLM error {}: {}", status, body));
    }

    let chat_resp: ChatResponse = resp.json().await?;
    let refined = chat_resp
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content.trim().to_string())
        .ok_or_else(|| anyhow!("No LLM response choices"))?;

    log::info!("LLM refined text: {}", refined);
    Ok(refined)
}
