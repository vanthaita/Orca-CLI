use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Orca CLI configuration structure
#[derive(Debug, Default, Serialize, Deserialize)]
pub(crate) struct OrcaConfig {
    #[serde(default)]
    pub(crate) api: ApiConfig,
    #[serde(default)]
    pub(crate) git: GitConfig,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub(crate) struct ApiConfig {
    pub(crate) gemini_api_key: Option<String>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub(crate) struct GitConfig {
    pub(crate) default_model: Option<String>,
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

/// Get the Gemini API key from config file or environment variable
/// Priority: Environment variable -> Config file -> Error
pub(crate) fn get_gemini_api_key() -> Result<String> {
    // First, try environment variable (allows override)
    if let Ok(key) = std::env::var("GEMINI_API_KEY") {
        if !key.trim().is_empty() {
            return Ok(key);
        }
    }
    
    // Second, try config file
    let config = load_config()?;
    if let Some(key) = config.api.gemini_api_key {
        if !key.trim().is_empty() {
            return Ok(key);
        }
    }
    
    // Neither found
    anyhow::bail!(
        "GEMINI_API_KEY not found. Set it with:\n  \
        1) orca setup --api-key YOUR_KEY (recommended)\n  \
        2) export GEMINI_API_KEY=YOUR_KEY"
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
            },
            git: GitConfig {
                default_model: Some("gemini-2.5-flash".to_string()),
            },
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
