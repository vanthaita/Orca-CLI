use crate::git::{ensure_git_repo, run_git};
use anyhow::Result;
use console::style;
use std::process::Command;

pub(crate) async fn run_setup_flow(
    provider: Option<String>,
    api_key: Option<String>,
    name: Option<String>,
    email: Option<String>,
    local: bool,
) -> Result<()> {
    ensure_git_repo()?;

    println!("{}\n", style("[orca setup]").bold().cyan());

    let scope_args: [&str; 1] = ["--global"];
    let use_global = !local;

    // Load existing config or default
    let mut config = crate::config::load_config().unwrap_or_default();
    let mut config_changed = false;

    // 1. Handle Provider Switch
    if let Some(p) = provider {
        let p_lower = p.to_lowercase();
        // Validate provider
        match p_lower.as_str() {
            "orca" | "gemini" | "openai" | "zai" | "deepseek" => {
                config.api.provider = p_lower.clone();
                config_changed = true;
                println!(
                    "  {} Set active provider to: {}",
                    style("[✓]").green().bold(),
                    style(&p_lower).cyan()
                );
            }
            _ => {
                anyhow::bail!("Unknown provider '{}'. Supported: orca, gemini, openai, zai, deepseek", p);
            }
        }
    }

    // 2. Handle API Key
    if let Some(ref key) = api_key {
        // Determine which provider to set key for.
        // If --provider was passed, use that. Otherwise use the active provider.
        let target_provider = config.api.provider.clone();

        match target_provider.as_str() {
            "orca" => config.api.orca_token = Some(key.clone()),
            "openai" | "rest" => config.api.openai_api_key = Some(key.clone()),
            "zai" => config.api.zai_api_key = Some(key.clone()),
            "deepseek" => config.api.deepseek_api_key = Some(key.clone()),
            "gemini" | _ => config.api.gemini_api_key = Some(key.clone()),
        }
        config_changed = true;

        println!(
            "  {} API key for '{}' saved to config file",
            style("[✓]").green().bold(),
            style(&target_provider).cyan()
        );
    }

    if config_changed {
        crate::config::save_config(&config)?;
    }

    // Handle git configuration
    if let Some(ref n) = name {
        if use_global {
            run_git(&["config", scope_args[0], "user.name", n.as_str()])?;
        } else {
            run_git(&["config", "user.name", n.as_str()])?;
        }
        println!(
            "  {} Set user.name: {}",
            style("[✓]").green().bold(),
            style(n).cyan()
        );
    }

    if let Some(ref e) = email {
        if use_global {
            run_git(&["config", scope_args[0], "user.email", e.as_str()])?;
        } else {
            run_git(&["config", "user.email", e.as_str()])?;
        }
        println!(
            "  {} Set user.email: {}",
            style("[✓]").green().bold(),
            style(e).cyan()
        );
    }

    // Show config file location if we touched config
    if config_changed {
        if let Ok(config_path) = crate::config::config_file_path() {
            println!(
                "\n{} {}",
                style("Configuration saved to:").dim(),
                style(config_path.display()).cyan()
            );
        }
    }

    // Check GitHub CLI
    println!();
    if gh_available() {
        println!(
            "  {} {}",
            style("[✓]").green().bold(),
            style("GitHub CLI (gh) is installed").green()
        );
    } else {
        println!(
            "  {} {}",
            style("[!]").yellow().bold(),
            style("GitHub CLI (gh) not found - install for PR creation").yellow()
        );
    }

    Ok(())
}

pub(crate) fn gh_available() -> bool {
    Command::new("gh")
        .arg("--version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}
