use anyhow::{Context, Result};
use console::style;
use indicatif::{ProgressBar, ProgressStyle};
use serde::Deserialize;
use std::env;
use std::fs::File;
use std::io::Write;
use std::process::Command;

#[derive(Deserialize, Debug)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

#[derive(Deserialize, Debug)]
struct GithubRelease {
    tag_name: String,
    body: String,
    assets: Vec<GithubAsset>,
}

pub async fn run_update_flow() -> Result<()> {
    println!("{}", style("Checking for updates...").cyan());

    // 1. Fetch current version
    let current_version = env!("CARGO_PKG_VERSION");
    
    // 2. Fetch latest version from GitHub
    let releases_url = "https://api.github.com/repos/vanthaita/Orca/releases/latest";

    println!("Checking: {}", style(releases_url).dim());
    let client = reqwest::Client::new();
    let resp = client
        .get(releases_url)
        .header("User-Agent", "orca-cli") // GitHub API requires User-Agent
        .send()
        .await
        .context("Failed to check for updates (GitHub API unreachable)")?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        anyhow::bail!("Failed to fetch release info. Status: {}. Response: {}", status, text);
    }

    let body = resp.text().await.context("Failed to read update response body")?;

    let release_info: GithubRelease = serde_json::from_str(&body)
        .context("Failed to parse GitHub release info")?;

    // Parse version from tag_name (e.g., "v0.1.27" -> "0.1.27")
    let latest_version = release_info.tag_name.trim_start_matches('v');

    println!("Current version: {}", style(current_version).yellow());
    println!("Latest version:  {}", style(latest_version).green());

    if latest_version == current_version {
        println!("{}", style("You are already on the latest version.").green());
        return Ok(());
    }

    println!("\nRelease notes:\n{}", release_info.body);

    if !cfg!(target_os = "windows") {
        println!(
            "\n{}\n{}\n{}",
            style("Update on this platform will run the official installer script:").yellow().bold(),
            style("curl -fsSL https://raw.githubusercontent.com/vanthaita/Orca/main/install.sh | sh").cyan(),
            style("This will modify files on your system.").yellow()
        );

        if !dialoguer::Confirm::new()
            .with_prompt("Do you want to update now?")
            .default(true)
            .interact()?
        {
            println!("Update cancelled.");
            return Ok(());
        }

        let status = Command::new("sh")
            .args([
                "-c",
                "curl -fsSL https://raw.githubusercontent.com/vanthaita/Orca/main/install.sh | sh",
            ])
            .status()
            .context("Failed to run installer script (requires: sh, curl)")?;

        if status.success() {
            println!("{}", style("Update completed.").green());
            return Ok(());
        }

        anyhow::bail!("Installer script failed with status: {}", status);
    }
    
    // Windows Logic
    // Find MSI asset
    let msi_asset = release_info.assets.iter()
        .find(|a| a.name.ends_with(".msi"))
        .context("No .msi installer found in the latest release assets")?;

    if !dialoguer::Confirm::new()
        .with_prompt("Do you want to update now?")
        .default(true)
        .interact()?
    {
        println!("Update cancelled.");
        return Ok(());
    }

    // 3. Download the MSI installer
    let temp_dir = env::temp_dir();
    let installer_path = temp_dir.join(&msi_asset.name);
    
    println!("Downloading update from {}...", msi_asset.browser_download_url);
    
    let mut response = reqwest::get(&msi_asset.browser_download_url).await?;
    let total_size = response.content_length().unwrap_or(0);
    
    let pb = ProgressBar::new(total_size);
    pb.set_style(ProgressStyle::default_bar()
        .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({eta})")?
        .progress_chars("#>-"));

    let mut file = File::create(&installer_path)?;
    
    while let Some(chunk) = response.chunk().await? {
        file.write_all(&chunk)?;
        pb.inc(chunk.len() as u64);
    }
    
    pb.finish_with_message("Download complete");
    println!("Saved installer to: {}", installer_path.display());

    // 4. Run the installer
    // Use /passive to show progress but not require interaction (except UAC)
    println!("starting installer...");
    
    let status = Command::new("msiexec")
        .args(["/i", &installer_path.to_string_lossy(), "/passive"])
        .status()
        .context("Failed to launch installer")?;

    if status.success() {
        println!("{}", style("Update process started. The CLI will close now.").green());
    } else {
        anyhow::bail!("Installer failed with status: {}", status);
    }

    Ok(())
}
