use crate::git::{current_branch, ensure_git_repo, is_working_tree_clean, run_git};
use anyhow::{Context, Result};
use console::style;
use dialoguer::{Confirm, Input};

/// Interactive rebase with autosquash
pub(crate) async fn run_tidy_rebase_flow(
    onto: Option<&str>,
    autosquash: bool,
    yes: bool,
) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca tidy rebase]").bold().cyan());
    
    // Check working tree
    if !is_working_tree_clean()? {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style("Working tree must be clean before rebasing").red()
        );
        anyhow::bail!("Working tree has uncommitted changes");
    }
    
    let branch = current_branch()?;
    println!("\n{} {}", style("Current branch:").bold(), style(&branch).green());
    
    // Determine base
    let base = if let Some(b) = onto {
        b.to_string()
    } else {
        Input::<String>::new()
            .with_prompt("Rebase onto which branch?")
            .default("main".to_string())
            .interact_text()
            .context("Failed to read base branch")?
    };
    
    println!("{} {}", style("Base branch:").bold(), style(&base).cyan());
    
    // Confirm
    if !yes {
        let proceed = Confirm::new()
            .with_prompt(format!(
                "Start interactive rebase of '{}' onto '{}'?",
                branch, base
            ))
            .default(false)
            .interact()
            .context("Failed to read confirmation")?;
        
        if !proceed {
            println!("Aborted.");
            return Ok(());
        }
    }
    
    // Run rebase
    let mut args = vec!["rebase", "-i"];
    if autosquash {
        args.push("--autosquash");
    }
    args.push(&base);
    
    println!("\n{}", style("Starting interactive rebase...").dim());
    run_git(&args)?;
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Rebase completed successfully").green()
    );
    
    Ok(())
}

/// Squash all commits on current branch into one
pub(crate) async fn run_tidy_squash_flow(base: Option<&str>, yes: bool) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca tidy squash]").bold().cyan());
    
    // Check working tree
    if !is_working_tree_clean()? {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style("Working tree must be clean before squashing").red()
        );
        anyhow::bail!("Working tree has uncommitted changes");
    }
    
    let branch = current_branch()?;
    println!("\n{} {}", style("Current branch:").bold(), style(&branch).green());
    
    // Determine base
    let base_branch = base.unwrap_or("main");
    println!("{} {}", style("Base branch:").bold(), style(base_branch).cyan());
    
    // Count commits
    let log_output = run_git(&["log", &format!("{}..HEAD", base_branch), "--oneline"])?;
    let commit_count = log_output.lines().count();
    
    if commit_count == 0 {
        println!("\n{}", style("No commits to squash").yellow());
        return Ok(());
    }
    
    println!(
        "\n{} {}",
        style("Commits to squash:").bold(),
        style(commit_count).yellow()
    );
    
    // Show commits
    println!("\n{}", style("Commits:").bold());
    for line in log_output.lines() {
        println!("  {}", style(line).dim());
    }
    
    // Confirm
    if !yes {
        let proceed = Confirm::new()
            .with_prompt(format!(
                "Squash {} commits into one?",
                commit_count
            ))
            .default(false)
            .interact()
            .context("Failed to read confirmation")?;
        
        if !proceed {
            println!("Aborted.");
            return Ok(());
        }
    }
    
    // Get commit message
    let message = Input::<String>::new()
        .with_prompt("Enter squashed commit message")
        .interact_text()
        .context("Failed to read commit message")?;
    
    // Perform squash
    println!("\n{}", style("Squashing commits...").dim());
    run_git(&["reset", "--soft", base_branch])?;
    run_git(&["commit", "-m", &message])?;
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Commits squashed successfully").green()
    );
    
    Ok(())
}

/// Create a fixup commit for a specific commit
pub(crate) async fn run_tidy_fixup_flow(commit: &str) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca tidy fixup]").bold().cyan());
    
    // Verify commit exists
    let _ = run_git(&["rev-parse", commit])
        .context("Commit not found")?;
    
    // Get commit summary
    let summary = run_git(&["log", "-1", "--pretty=%s", commit])?;
    println!(
        "\n{} {}",
        style("Creating fixup for:").bold(),
        style(summary.trim()).yellow()
    );
    
    // Create fixup commit
    println!("\n{}", style("Creating fixup commit...").dim());
    run_git(&["commit", "--fixup", commit])?;
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Fixup commit created").green()
    );
    println!(
        "\n{}\n  {}",
        style("Next step:").bold(),
        style("Run: orca tidy rebase --autosquash").dim()
    );
    
    Ok(())
}

/// Amend the last commit safely
pub(crate) async fn run_tidy_amend_flow(no_edit: bool, yes: bool) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca tidy amend]").bold().cyan());
    
    // Get last commit
    let last_commit = run_git(&["log", "-1", "--pretty=%H %s"])?;
    println!(
        "\n{} {}",
        style("Last commit:").bold(),
        style(last_commit.trim()).yellow()
    );
    
    // Check for staged changes
    let status = run_git(&["diff", "--cached", "--name-only"])?;
    if status.trim().is_empty() {
        println!(
            "\n{} {}",
            style("Warning:").yellow().bold(),
            style("No staged changes to amend").yellow()
        );
        
        if !yes {
            let proceed = Confirm::new()
                .with_prompt("Continue anyway (will just update commit message)?")
                .default(false)
                .interact()
                .context("Failed to read confirmation")?;
            
            if !proceed {
                println!("Aborted.");
                return Ok(());
            }
        }
    } else {
        println!("\n{}", style("Staged changes:").bold());
        for line in status.lines() {
            println!("  {}", style(line).green());
        }
    }
    
    // Confirm
    if !yes {
        let proceed = Confirm::new()
            .with_prompt("Amend last commit?")
            .default(true)
            .interact()
            .context("Failed to read confirmation")?;
        
        if !proceed {
            println!("Aborted.");
            return Ok(());
        }
    }
    
    // Amend commit
    println!("\n{}", style("Amending commit...").dim());
    let mut args = vec!["commit", "--amend"];
    if no_edit {
        args.push("--no-edit");
    }
    run_git(&args)?;
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Commit amended successfully").green()
    );
    
    Ok(())
}
