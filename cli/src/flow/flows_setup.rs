use crate::git::{ensure_git_repo, run_git};
use anyhow::{Context, Result};
use console::style;
use dialoguer::Confirm;
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

        let install = Confirm::new()
            .with_prompt("Do you want to install GitHub CLI (gh) now?")
            .default(true)
            .interact()
            .context("Failed to read confirmation")?;

        if install {
            println!("\n{}", style("Installing GitHub CLI...").cyan());
            let ok = try_install_gh()?;
            if ok && gh_available() {
                println!(
                    "  {} {}",
                    style("[✓]").green().bold(),
                    style("GitHub CLI (gh) installed successfully").green()
                );
            } else {
                println!(
                    "  {} {}",
                    style("[!]").yellow().bold(),
                    style("Failed to install GitHub CLI automatically").yellow()
                );
                print_gh_install_guidance();
            }
        } else {
            println!(
                "  {} {}",
                style("[i]").cyan().bold(),
                style("Skipped GitHub CLI installation").cyan()
            );
        }
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

fn command_available(cmd: &str, args: &[&str]) -> bool {
    Command::new(cmd)
        .args(args)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn try_install_gh() -> Result<bool> {
    #[cfg(target_os = "windows")]
    {
        if command_available("winget", &["--version"]) {
            let status = Command::new("winget")
                .args([
                    "install",
                    "--id",
                    "GitHub.cli",
                    "-e",
                    "--source",
                    "winget",
                ])
                .status()
                .context("Failed to run winget (required to install gh)")?;
            return Ok(status.success());
        }

        return Ok(false);
    }

    #[cfg(target_os = "macos")]
    {
        if command_available("brew", &["--version"]) {
            let status = Command::new("brew")
                .args(["install", "gh"])
                .status()
                .context("Failed to run brew (required to install gh)")?;
            return Ok(status.success());
        }

        return Ok(false);
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if command_available("apt-get", &["--version"]) {
            let status = Command::new("sh")
                .args([
                    "-c",
                    "sudo apt-get update && sudo apt-get install -y gh",
                ])
                .status()
                .context("Failed to run apt-get (required to install gh)")?;
            return Ok(status.success());
        }

        return Ok(false);
    }
}

fn print_gh_install_guidance() {
    println!(
        "\n{}\n  {}\n  {}",
        style("Install GitHub CLI manually:").cyan().bold(),
        style("https://cli.github.com/").cyan(),
        style("After installation, restart your terminal and run: gh --version").dim()
    );
}
