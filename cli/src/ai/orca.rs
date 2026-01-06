use super::CompletionProvider;
use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde::de::DeserializeOwned;

pub(crate) struct OrcaProvider {
    base_url: String,
    token: String,
}

impl OrcaProvider {
    pub(crate) fn new(base_url: String, token: String) -> Self {
        Self { base_url, token }
    }
}

#[async_trait]
impl CompletionProvider for OrcaProvider {
    async fn generate_content(
        &self,
        model: &str,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<String> {
        let url = format!(
            "{}/{}/ai/chat",
            self.base_url.trim_end_matches('/'),
            crate::config::ORCA_API_PREFIX
        );

        let body = OrcaChatRequest {
            provider: None,
            model: model.to_string(),
            system_prompt: system_prompt.to_string(),
            user_prompt: user_prompt.to_string(),
        };

        let client = reqwest::Client::new();
        let resp = client
            .post(url)
            .header("authorization", format!("Bearer {}", self.token))
            .json(&body)
            .send()
            .await
            .context("Orca server request failed")?;

        let status = resp.status();
        let text = resp.text().await.context("Failed to read Orca server response")?;

        if !status.is_success() {
            anyhow::bail!("Orca server returned {}: {}", status, text);
        }

        let parsed: OrcaChatResponse = parse_api_json(&text)
            .with_context(|| format!("Failed to parse Orca server response: {}", text))?;

        let trimmed = parsed.text.trim();
        if trimmed.is_empty() {
            anyhow::bail!("Orca server returned empty text. Raw: {}", text);
        }

        Ok(trimmed.to_string())
    }
}

fn parse_api_json<T: DeserializeOwned>(text: &str) -> Result<T> {
    let value: serde_json::Value = serde_json::from_str(text).context("Failed to parse JSON")?;

    if let Some(data) = value.get("data") {
        return serde_json::from_value::<T>(data.clone()).context("Failed to parse JSON.data");
    }

    serde_json::from_value::<T>(value).context("Failed to parse JSON")
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrcaChatRequest {
    provider: Option<String>,
    model: String,
    system_prompt: String,
    user_prompt: String,
}

#[derive(Debug, Deserialize)]
struct OrcaChatResponse {
    text: String,
}
