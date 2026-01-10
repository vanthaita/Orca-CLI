use anyhow::{Context, Result};
use serde::de::DeserializeOwned;

use crate::plan_types::{UserFeaturesResponse, UserPlanInfo};

pub struct OrcaApiClient {
    base_url: String,
    token: String,
    client: reqwest::Client,
}

impl OrcaApiClient {
    pub fn new() -> Result<Self> {
        let base_url = crate::config::get_orca_base_url()?;
        let token = crate::config::get_orca_token()?;
        let client = reqwest::Client::new();
        Ok(Self {
            base_url,
            token,
            client,
        })
    }

    #[allow(dead_code)]
    pub async fn get_user_plan(&self) -> Result<UserPlanInfo> {
        let url = format!(
            "{}/{}/user/plan",
            self.base_url.trim_end_matches('/'),
            crate::config::ORCA_API_PREFIX
        );

        self.get_json(&url).await
    }

    pub async fn get_user_features(&self) -> Result<Vec<String>> {
        let url = format!(
            "{}/{}/user/features",
            self.base_url.trim_end_matches('/'),
            crate::config::ORCA_API_PREFIX
        );

        let response: UserFeaturesResponse = self.get_json(&url).await?;
        Ok(response.features)
    }

    async fn get_json<T: DeserializeOwned>(&self, url: &str) -> Result<T> {
        let resp = self
            .client
            .get(url)
            .header("authorization", format!("Bearer {}", self.token))
            .send()
            .await
            .context("Failed to connect to Orca server")?;

        let status = resp.status();
        let text = resp
            .text()
            .await
            .context("Failed to read server response")?;

        if !status.is_success() {
            return Err(handle_api_error(status, &text));
        }

        self.parse_api_json(&text)
            .with_context(|| format!("Failed to parse server response: {}", text))
    }

    fn parse_api_json<T: DeserializeOwned>(&self, text: &str) -> Result<T> {
        let value: serde_json::Value =
            serde_json::from_str(text).context("Failed to parse JSON")?;

        if let Some(data) = value.get("data") {
            return serde_json::from_value::<T>(data.clone())
                .context("Failed to parse JSON.data");
        }

        serde_json::from_value::<T>(value).context("Failed to parse JSON")
    }
}

pub fn handle_api_error(status: reqwest::StatusCode, text: &str) -> anyhow::Error {
    if status.as_u16() == 401 {
        return anyhow::anyhow!("Authentication failed. Please run 'orca login' to sign in again.");
    }

    if let Ok(json) = serde_json::from_str::<serde_json::Value>(text) {
        // Check for nested message object like { "message": { "message": "...", "error": "..." } }
        if let Some(msg_obj) = json.get("message").and_then(|m| m.as_object()) {
            if let Some(inner_msg) = msg_obj.get("message").and_then(|m| m.as_str()) {
                if !inner_msg.is_empty() {
                    return anyhow::anyhow!("{}", inner_msg);
                }
            }
        }
        
        // Check for simple message string { "message": "..." }
        if let Some(msg_str) = json.get("message").and_then(|m| m.as_str()) {
             if !msg_str.is_empty() {
                return anyhow::anyhow!("{}", msg_str);
            }
        }
        
        // Check for error string { "error": "..." }
        if let Some(err_str) = json.get("error").and_then(|e| e.as_str()) {
             if !err_str.is_empty() {
                return anyhow::anyhow!("{}", err_str);
            }
        }
    }

    anyhow::anyhow!("Server returned {}: {}", status, text)
}
