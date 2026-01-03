use super::CompletionProvider;
use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

pub(crate) struct OpenAIProvider {
    api_key: String,
    base_url: String,
}

impl OpenAIProvider {
    pub(crate) fn new(api_key: String, base_url: Option<String>) -> Self {
        Self {
            api_key,
            base_url: base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string()),
        }
    }
}

#[async_trait]
impl CompletionProvider for OpenAIProvider {
    async fn generate_content(
        &self,
        model: &str,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<String> {
        // Handle generic completion endpoint (chat/completions)
        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));

        let body = OpenAIChatRequest {
            model: model.to_string(),
            messages: vec![
                OpenAIMessage {
                    role: "system".to_string(),
                    content: system_prompt.to_string(),
                },
                OpenAIMessage {
                    role: "user".to_string(),
                    content: user_prompt.to_string(),
                },
            ],
            temperature: Some(0.7), 
            stream: Some(false),
        };

        let client = reqwest::Client::new();
        let resp = client
            .post(url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .context("OpenAI (or compatible) request failed")?;

        let status = resp.status();
        let text = resp
            .text()
            .await
            .context("Failed to read OpenAI response")?;

        if !status.is_success() {
            anyhow::bail!("Provider API returned {}: {}", status, text);
        }

        let parsed: OpenAIChatResponse = serde_json::from_str(&text)
            .with_context(|| format!("Failed to parse OpenAI response: {}", text))?;

        let content = parsed
            .choices
            .first()
            .and_then(|c| c.message.content.clone())
            .unwrap_or_default();

        let trimmed = content.trim();
        if trimmed.is_empty() {
             anyhow::bail!("Provider returned empty text. Raw: {}", text);
        }

        Ok(trimmed.to_string())
    }
}

#[derive(Debug, Serialize)]
struct OpenAIChatRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    temperature: Option<f32>,
    stream: Option<bool>,
}

#[derive(Debug, Serialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIChatResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoiceMessage {
    content: Option<String>,
}
