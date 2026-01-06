use anyhow::{Context, Result};
use console::style;
use indicatif::{ProgressBar, ProgressStyle};
use serde::Deserialize;
use std::env;
use std::fs::File;
use std::io::Write;
use std::process::Command;

#[derive(Deserialize, Debug)]
struct ReleaseInfo {
    version: String,
    url: String,
    #[allow(dead_code)]
    notes: String,
}

#[derive(Deserialize, Debug)]
struct OrcaApiResponse<T> {
    data: T,
}

pub async fn run_update_flow() -> Result<()> {
    println!("{}", style("Checking for updates...").cyan());

    // 1. Fetch current version
    let current_version = env!("CARGO_PKG_VERSION");
    
    // 2. Fetch latest version from server
    let server_url = crate::config::get_orca_base_url()?;
    let api_prefix = crate::config::ORCA_API_PREFIX;
    let server_url = server_url.trim_end_matches('/');
    let api_prefix = api_prefix.trim_matches('/');

    let releases_url = if server_url.ends_with(&format!("/{api_prefix}")) {
        format!("{server_url}/releases/latest")
    } else {
        format!("{server_url}/{api_prefix}/releases/latest")
    };

    println!("Checking: {}", style(&releases_url).dim());
    let client = reqwest::Client::new();
    let resp = client
        .get(&releases_url)
        .send()
        .await
        .context("Failed to check for updates (server unreachable)")?;

    if !resp.status().is_success() {
        if resp.status() == reqwest::StatusCode::NOT_FOUND {
            anyhow::bail!(
                "Update endpoint not found (404). Tried: {}\n\nIf you set ORCA_API_BASE_URL or config.api.orca_base_url, ensure it points to the Orca API host (e.g. https://api.orcacli.codes) and that the server supports '{}/releases/latest'.",
                releases_url,
                api_prefix
            );
        }

        anyhow::bail!("Server returned error: {}", resp.status());
    }

    let body = resp.text().await.context("Failed to read update response body")?;

    let release_info: ReleaseInfo = match serde_json::from_str::<OrcaApiResponse<ReleaseInfo>>(&body) {
        Ok(v) => v.data,
        Err(_) => serde_json::from_str::<ReleaseInfo>(&body).with_context(|| {
            let snippet = body.chars().take(400).collect::<String>();
            format!(
                "Failed to parse release info (unexpected response schema). URL: {releases_url}\nResponse (first 400 chars): {snippet}"
            )
        })?,
    };

    println!("Current version: {}", style(current_version).yellow());
    println!("Latest version:  {}", style(&release_info.version).green());

    if release_info.version == current_version {
        println!("{}", style("You are already on the latest version.").green());
        return Ok(());
    }

    println!("\nRelease notes:\n{}", release_info.notes);

    if !cfg!(target_os = "windows") {
        println!(
            "\n{}\n{}\n{}",
            style("Automatic updates are currently only supported on Windows.").yellow().bold(),
            style("To update on this platform, download the latest release from:").yellow(),
            style(&release_info.url).cyan().underlined()
        );
        return Ok(());
    }
    
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
    let installer_path = temp_dir.join("Orca.msi");
    
    println!("Downloading update from {}...", release_info.url);
    
    let mut response = reqwest::get(&release_info.url).await?;
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
