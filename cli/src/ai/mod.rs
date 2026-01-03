use anyhow::Result;
use async_trait::async_trait;
use crate::config::{get_api_key, get_provider};

pub(crate) mod gemini;
pub(crate) mod openai;

#[async_trait]
pub(crate) trait CompletionProvider {
    async fn generate_content(
        &self,
        model: &str,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<String>;
}

pub(crate) async fn create_provider() -> Result<Box<dyn CompletionProvider + Send + Sync>> {
    let provider_name = get_provider();
    let provider_name = provider_name.as_str();

    match provider_name {
        "gemini" => {
            let api_key = get_api_key("gemini")?;
            Ok(Box::new(gemini::GeminiProvider::new(api_key)))
        }
        "openai" | "rest" | "zai" | "deepseek" => {
            let api_key = get_api_key(provider_name)?;
            // Check for custom base URL if needed, but for now we trust the default or config
            // We might need to pass the base_url here if configured
            let base_url = crate::config::load_config()
                .ok()
                .and_then(|c| c.api.api_base_url)
                .or_else(|| match provider_name {
                    "zai" => Some("https://api.z.ai/api/paas/v4".to_string()),
                    "deepseek" => Some("https://api.deepseek.com".to_string()),
                    _ => None, // Default OpenAI is handled by the impl
                });
            
            Ok(Box::new(openai::OpenAIProvider::new(api_key, base_url)))
        }
        _ => anyhow::bail!("Unknown provider: {}", provider_name),
    }
}
