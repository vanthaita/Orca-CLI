use super::CompletionProvider;
use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

pub(crate) struct GeminiProvider {
    api_key: String,
}

impl GeminiProvider {
    pub(crate) fn new(api_key: String) -> Self {
        Self { api_key }
    }
}

#[async_trait]
impl CompletionProvider for GeminiProvider {
    async fn generate_content(
        &self,
        model: &str,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<String> {
        let model_path = if model.starts_with("models/") {
            model.to_string()
        } else {
            format!("models/{model}")
        };
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/{model_path}:generateContent"
        );

        // Gemini doesn't always strictly separate system/user in the same way as OpenAI,
        // but for 'generateContent', we can just concat or use specific fields if using the newer API.
        // For simplicity/compatibility with the previous implementation, we'll combine them 
        // or just put them in the parts.
        // However, standard Gemini practice often puts system instructions in 'system_instruction' 
        // or just prepends it. Let's prepend for robustness on older models/APIs.
        let full_prompt = format!("{}\n\n{}", system_prompt, user_prompt);

        let body = GeminiGenerateContentRequest {
            contents: vec![GeminiContent {
                parts: vec![GeminiPart {
                    text: full_prompt,
                }],
            }],
        };

        let client = reqwest::Client::new();
        let resp = client
            .post(url)
            .header("x-goog-api-key", &self.api_key)
            .json(&body)
            .send()
            .await
            .context("Gemini request failed")?;

        let status = resp.status();
        let text = resp
            .text()
            .await
            .context("Failed to read Gemini response")?;
        
        if !status.is_success() {
            anyhow::bail!("Gemini API returned {}: {}", status, text);
        }

        let parsed: GeminiGenerateContentResponse = serde_json::from_str(&text)
            .with_context(|| format!("Failed to parse Gemini response envelope: {}", text))?;

        let model_text = parsed
            .candidates
            .and_then(|mut c| c.pop())
            .and_then(|c| c.content)
            .and_then(|c| c.parts)
            .and_then(|mut p| p.pop())
            .and_then(|p| p.text)
            .unwrap_or_default();

        let trimmed = model_text.trim();
        if trimmed.is_empty() {
            anyhow::bail!("Gemini returned empty text. Raw envelope: {}", text);
        }
        Ok(trimmed.to_string())
    }
}

// Data structures (copied/adapted from previous implementation)
#[derive(Debug, Serialize)]
struct GeminiGenerateContentRequest {
    contents: Vec<GeminiContent>,
    // Optional: add config/safety settings here if needed
}

#[derive(Debug, Serialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiGenerateContentResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCandidate {
    content: Option<GeminiCandidateContent>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCandidateContent {
    parts: Option<Vec<GeminiCandidatePart>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCandidatePart {
    text: Option<String>,
}
