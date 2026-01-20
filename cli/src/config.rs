use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

pub(crate) const ORCA_API_HOST: &str = "https://api.orcacli.codes";
pub(crate) const ORCA_API_PREFIX: &str = "api/v1";

const DEFAULT_ORCA_BASE_URL: &str = match option_env!("ORCA_DEFAULT_API_BASE_URL") {
    Some(v) if !v.is_empty() => v,
    _ => ORCA_API_HOST,
};

/// Orca CLI configuration structure
#[derive(Debug, Default, Serialize, Deserialize)]
pub(crate) struct OrcaConfig {
    #[serde(default)]
    pub(crate) api: ApiConfig,
    #[serde(default)]
    pub(crate) git: GitConfig,
    #[serde(default)]
    pub(crate) pr_workflow: PrWorkflowConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct ApiConfig {
    /// Active provider: "gemini", "openai", "zai", "deepseek"
    #[serde(default = "default_provider")]
    pub(crate) provider: String,

    /// Optional base URL for OpenAI-compatible endpoints
    pub(crate) api_base_url: Option<String>,

    /// Orca server base URL (when provider = "orca")
    pub(crate) orca_base_url: Option<String>,

    /// Orca server token (when provider = "orca")
    pub(crate) orca_token: Option<String>,

    pub(crate) gemini_api_key: Option<String>,
    pub(crate) openai_api_key: Option<String>,
    pub(crate) zai_api_key: Option<String>,
    pub(crate) deepseek_api_key: Option<String>,
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            provider: default_provider(),
            api_base_url: None,
            orca_base_url: Some(DEFAULT_ORCA_BASE_URL.to_string()),
            orca_token: None,
            gemini_api_key: None,
            openai_api_key: None,
            zai_api_key: None,
            deepseek_api_key: None,
        }
    }
}

fn default_provider() -> String {
    "gemini".to_string()
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub(crate) struct GitConfig {
    pub(crate) default_model: Option<String>,
    pub(crate) commit_style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct PrWorkflowConfig {
    /// Default workflow mode: "single" or "stack"
    pub(crate) default_mode: Option<String>,
    /// Auto-number PRs in stack mode
    #[serde(default = "default_true")]
    pub(crate) auto_number: bool,
    /// Add cross-links between PRs in stack mode
    #[serde(default = "default_true")]
    pub(crate) link_prs: bool,
}

fn default_true() -> bool {
    true
}

impl Default for PrWorkflowConfig {
    fn default() -> Self {
        Self {
            default_mode: None,
            auto_number: true,
            link_prs: true,
        }
    }
}

/// Get the path to the Orca config file
/// - Windows: %APPDATA%\orca\config.toml
/// - Linux/macOS: ~/.config/orca/config.toml
pub(crate) fn config_file_path() -> Result<PathBuf> {
    let config_dir = dirs::config_dir()
        .context("Failed to determine config directory for this platform")?;
    
    let orca_dir = config_dir.join("orca");
    Ok(orca_dir.join("config.toml"))
}

/// Load the Orca configuration from disk
/// Returns default config if file doesn't exist
pub(crate) fn load_config() -> Result<OrcaConfig> {
    let path = config_file_path()?;
    
    if !path.exists() {
        return Ok(OrcaConfig::default());
    }
    
    let content = fs::read_to_string(&path)
        .with_context(|| format!("Failed to read config file: {}", path.display()))?;
    
    let config: OrcaConfig = toml::from_str(&content)
        .with_context(|| format!("Failed to parse config file: {}", path.display()))?;
    
    Ok(config)
}

/// Save the Orca configuration to disk
pub(crate) fn save_config(config: &OrcaConfig) -> Result<()> {
    let path = config_file_path()?;
    
    // Create parent directory if it doesn't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create config directory: {}", parent.display()))?;
    }
    
    let content = toml::to_string_pretty(config)
        .context("Failed to serialize config to TOML")?;
    
    fs::write(&path, content)
        .with_context(|| format!("Failed to write config file: {}", path.display()))?;
    
    Ok(())
}

fn env_var_name_for_provider(provider: &str) -> &'static str {
    match provider {
        "rest" | "openai" => "OPENAI_API_KEY",
        "zai" => "ZAI_API_KEY",
        "deepseek" => "DEEPSEEK_API_KEY",
        "gemini" | _ => "GEMINI_API_KEY",
    }
}

fn config_key_for_provider(config: &OrcaConfig, provider: &str) -> Option<String> {
    match provider {
        "rest" | "openai" => config.api.openai_api_key.clone(),
        "zai" => config.api.zai_api_key.clone(),
        "deepseek" => config.api.deepseek_api_key.clone(),
        "gemini" | _ => config.api.gemini_api_key.clone(),
    }
}

/// Get the API key for the requested provider (or currently active one)
pub(crate) fn get_api_key(provider: &str) -> Result<String> {
    // 1. Check environment variable first (specific to provider)
    let env_var_name = env_var_name_for_provider(provider);

    if let Ok(key) = std::env::var(env_var_name) {
        if !key.trim().is_empty() {
            return Ok(key);
        }
    }

    // 2. Check config file
    let config = load_config()?;
    let key = config_key_for_provider(&config, provider);

    if let Some(k) = key {
        if !k.trim().is_empty() {
            return Ok(k);
        }
    }

    anyhow::bail!(
        "API Key for '{}' not found. Set it via environment variable {} or `orca setup --api-key <KEY>`",
        provider,
        env_var_name
    )
}

/// Get the active provider name from config
pub(crate) fn get_provider() -> String {
    load_config()
        .map(|c| c.api.provider)
        .unwrap_or_else(|_| "gemini".to_string())
}

pub(crate) fn get_orca_base_url() -> Result<String> {
    validate_orca_base_url(DEFAULT_ORCA_BASE_URL.to_string())
}

fn validate_orca_base_url(v: String) -> Result<String> {
    let trimmed = v.trim();
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return Ok(trimmed.to_string());
    }

    anyhow::bail!(
        "Invalid Orca server URL: '{}'. It must be an absolute URL including scheme, e.g. https://api.orcacli.codes",
        trimmed
    )
}

pub(crate) fn get_orca_token() -> Result<String> {
    if let Ok(v) = std::env::var("ORCA_API_TOKEN") {
        if !v.trim().is_empty() {
            return Ok(v);
        }
    }

    let config = load_config()?;
    if let Some(v) = config.api.orca_token {
        if !v.trim().is_empty() {
            return Ok(v);
        }
    }

    anyhow::bail!(
        "Orca server token not found. Set ORCA_API_TOKEN or run `orca setup --provider orca --api-key <TOKEN>`"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_serialization_roundtrip() {
        let config = OrcaConfig {
            api: ApiConfig {
                gemini_api_key: Some("test-key".to_string()),
                ..Default::default()
            },
            git: GitConfig {
                default_model: Some("gemini-2.5-flash".to_string()),
            },
            pr_workflow: PrWorkflowConfig::default(),
        };

        let toml_str = toml::to_string(&config).unwrap();
        let parsed: OrcaConfig = toml::from_str(&toml_str).unwrap();

        assert_eq!(parsed.api.gemini_api_key, Some("test-key".to_string()));
        assert_eq!(parsed.git.default_model, Some("gemini-2.5-flash".to_string()));
    }

    #[test]
    fn config_file_path_returns_some_path() {
        let path = config_file_path();
        assert!(path.is_ok());
        assert!(path.unwrap().to_string_lossy().contains("orca"));
    }
}