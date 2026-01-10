use crate::git::{ensure_git_repo, run_git};
use anyhow::{Context, Result};
use console::style;
use dialoguer::{Editor, Input};
use super::flows_error;
use std::process::Command;

/// Create a git tag with message
pub(crate) async fn run_release_tag_flow(
    version: &str,
    message: Option<&str>,
    push: bool,
    yes: bool,
) -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca release tag]");
    
    // Validate version format (basic check)
    let tag_name = if version.starts_with('v') {
        version.to_string()
    } else {
        format!("v{}", version)
    };
    
    println!("\n{} {}", style("Tag name:").bold(), style(&tag_name).green());
    
    // Check if tag exists
    let tag_exists = Command::new("git")
        .args(&["rev-parse", &tag_name])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);
    
    if tag_exists {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style(format!("Tag '{}' already exists", tag_name)).red()
        );
        anyhow::bail!("Tag already exists");
    }
    
    // Get or prompt for message
    let tag_message = if let Some(msg) = message {
        msg.to_string()
    } else {
        Input::<String>::new()
            .with_prompt("Enter tag message")
            .interact_text()
            .context("Failed to read tag message")?
    };
    
    // Confirm
    if !yes {
        if !flows_error::confirm_or_abort(format!("Create tag '{}'?", tag_name), true)? {
            return Ok(());
        }
    }
    
    // Create tag
    println!("\n{}", style("Creating tag...").dim());
    run_git(&["tag", "-a", &tag_name, "-m", &tag_message])?;
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style(format!("Tag '{}' created", tag_name)).green()
    );
    
    // Push if requested
    if push {
        if !yes {
            if !flows_error::confirm_or_abort("Push tag to remote?", true)? {
                println!(
                    "\n{} {}",
                    style("Note:").yellow().bold(),
                    style(format!("To push later: git push origin {}", tag_name)).yellow()
                );
                return Ok(());
            }
        }
        
        println!("\n{}", style("Pushing tag to remote...").dim());
        run_git(&["push", "origin", &tag_name])?;
        
        println!(
            "{} {}",
            style("[✓]").green().bold(),
            style("Tag pushed to remote").green()
        );
    } else {
        println!(
            "\n{} {}",
            style("Note:").yellow().bold(),
            style(format!("To push: git push origin {}", tag_name)).yellow()
        );
    }
    
    Ok(())
}

/// Generate release notes from commits
pub(crate) async fn run_release_notes_flow(
    from: Option<&str>,
    to: Option<&str>,
    ai: bool,
) -> Result<()> {
    // Always require Pro/Team for AI release notes
    crate::plan_guard::require_feature(crate::plan_types::FeaturePermission::AiReleaseNotes).await?;

    ensure_git_repo()?;

    flows_error::print_flow_header("[orca release notes]");
    
    // Determine range
    let from_ref = if let Some(f) = from {
        f.to_string()
    } else {
        // Get latest tag
        let tags_output = run_git(&["tag", "--sort=-creatordate"])?;
        tags_output.lines().next()
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                println!("{} {}", 
                    style("Warning:").yellow().bold(),
                    style("No tags found, using all commits").yellow()
                );
                String::new()
            })
    };
    
    let to_ref = to.unwrap_or("HEAD");
    
    // Get commits
    let range = if from_ref.is_empty() {
        to_ref.to_string()
    } else {
        format!("{}..{}", from_ref, to_ref)
    };
    
    println!("\n{} {}", style("Range:").bold(), style(&range).cyan());
    
    // Get commit log
    let log = run_git(&["log", &range, "--pretty=format:- %s (%h)"])?;
    
    if log.trim().is_empty() {
        println!("\n{}", style("No commits in range").yellow());
        return Ok(());
    }
    
    if ai {
        // Use AI to generate release notes
        println!("\n{}", style("Generating AI-powered release notes...").dim());
        
        let from_tag = run_git(&["tag", "--sort=-creatordate"])
            .ok()
            .and_then(|s| s.lines().next().map(|l| l.to_string()));
        
        let range = if let Some(ref from) = from_tag {
            format!("{}..HEAD", from)
        } else {
            "HEAD".to_string()
        };
        
        let log = run_git(&["log", &range, "--pretty=format:- %s (%h)"])?;
        
        let prompt = format!(
            "Generate professional release notes from these commits. \
            Group changes by category (Features, Bug Fixes, Improvements, etc.). \
            Make it concise and user-friendly.\n\nCommits:\n{}",
            log
        );
        
        let provider = crate::ai::create_provider().await?;
        match provider.generate_content("gemini-2.0-flash-exp", "", &prompt).await {
            Ok(notes) => {
                println!("\n{}", style("Release Notes:").bold().green());
                println!("{}", style("═".repeat(60)).dim());
                println!("{}", notes);
                println!("{}", style("═".repeat(60)).dim());
            }
            Err(e) => {
                println!(
                    "\n{} {}",
                    style("Warning:").yellow().bold(),
                    style(format!("AI generation failed: {}", e)).yellow()
                );
                println!("\n{}", style("Falling back to commit list:").bold());
                println!("{}", log);
            }
        }
    } else {
        println!("\n{}", style("Release Notes:").bold());
        println!("{}", style("═".repeat(60)).dim());
        println!("{}", log);
        println!("{}", style("═".repeat(60)).dim());
    }
    
    Ok(())
}

/// Create GitHub release via gh CLI
pub(crate) async fn run_release_create_flow(
    version: &str,
    notes_file: Option<&str>,
    ai: bool,
    yes: bool,
) -> Result<()> {
    // Always require Pro/Team for AI release creation
    crate::plan_guard::require_feature(crate::plan_types::FeaturePermission::AiReleaseNotes).await?;

    ensure_git_repo()?;

    flows_error::print_flow_header("[orca release create]");
    
    // Check if gh is available
    let gh_available = Command::new("gh")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);
    
    if !gh_available {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style("GitHub CLI (gh) is not installed").red()
        );
        println!(
            "\n{}\n  {}",
            style("Install gh:").cyan().bold(),
            style("https://cli.github.com/").cyan()
        );
        anyhow::bail!("gh CLI not available");
    }
    
    // Normalize version
    let tag_name = if version.starts_with('v') {
        version.to_string()
    } else {
        format!("v{}", version)
    };
    
    println!("\n{} {}", style("Release:").bold(), style(&tag_name).green());
    
    // Generate or read notes
    let notes = if let Some(file) = notes_file {
        std::fs::read_to_string(file)
            .context(format!("Failed to read notes file: {}", file))?
    } else if ai {
        // Generate with AI
        println!("\n{}", style("Generating release notes with AI...").dim());
        
        let from_tag = run_git(&["tag", "--sort=-creatordate"])
            .ok()
            .and_then(|s| s.lines().next().map(|l| l.to_string()));
        
        let range = if let Some(ref from) = from_tag {
            format!("{}..HEAD", from)
        } else {
            "HEAD".to_string()
        };
        
        let log = run_git(&["log", &range, "--pretty=format:- %s (%h)"])?;
        
        let prompt = format!(
            "Generate professional release notes for version {}. \
            Group changes by category. Make it concise.\n\nCommits:\n{}",
            tag_name, log
        );
        
        let provider = crate::ai::create_provider().await?;
        provider.generate_content("gemini-2.0-flash-exp", "", &prompt).await?
    } else {
        // Prompt user to edit
        Editor::new()
            .edit("# Enter release notes here\n")
            .context("Failed to open editor")?
            .unwrap_or_default()
    };
    
    if notes.trim().is_empty() {
        anyhow::bail!("Release notes cannot be empty");
    }
    
    println!("\n{}", style("Release notes:").bold());
    println!("{}", style("─".repeat(60)).dim());
    println!("{}", notes.trim());
    println!("{}", style("─".repeat(60)).dim());
    
    // Confirm
    if !yes {
        if !flows_error::confirm_or_abort(format!("Create GitHub release for '{}'?", tag_name), true)? {
            return Ok(());
        }
    }
    
    // Create release via gh
    println!("\n{}", style("Creating GitHub release...").dim());
    
    let output = Command::new("gh")
        .args(&[
            "release", "create", &tag_name,
            "--title", &tag_name,
            "--notes", &notes,
        ])
        .output()
        .context("Failed to run gh release create")?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("gh release create failed: {}", stderr);
    }
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style(format!("Release '{}' created successfully", tag_name)).green()
    );
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    if let Some(url) = stdout.lines().find(|l| l.contains("https://")) {
        println!("\n{} {}", style("URL:").bold(), style(url.trim()).cyan());
    }
    
    Ok(())
}
