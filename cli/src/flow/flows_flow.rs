use crate::git::{checkout_branch, current_branch, ensure_git_repo, run_git};
use anyhow::{Context, Result};
use console::style;
use dialoguer::{Confirm, Input, Select};

/// Start a new feature/fix/chore flow
pub(crate) async fn run_flow_start(
    flow_type: Option<&str>,
    name: Option<&str>,
    base: Option<&str>,
) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca flow start]").bold().cyan());
    
    // Determine flow type (interactive if not provided)
    let selected_type = if let Some(t) = flow_type {
        t.to_string()
    } else {
        let types = vec!["feat", "fix", "chore", "hotfix", "release"];
        let selection = Select::new()
            .with_prompt("Select flow type")
            .items(&types)
            .default(0)
            .interact()
            .context("Failed to read selection")?;
        types[selection].to_string()
    };
    
    // Determine flow name (interactive if not provided)
    let flow_name = if let Some(n) = name {
        n.to_string()
    } else {
        Input::<String>::new()
            .with_prompt("Enter flow name (e.g., user-authentication)")
            .interact_text()
            .context("Failed to read flow name")?
    };
    
    // Create branch name
    let branch_name = format!("{}/{}", selected_type, flow_name);
    
    println!(
        "\n{} {}",
        style("Creating branch:").bold(),
        style(&branch_name).green()
    );
    
    // Checkout base branch if specified
    if let Some(base_branch) = base {
        println!(
            "{} {}",
            style("Base branch:").bold(),
            style(base_branch).cyan()
        );
        run_git(&["checkout", base_branch])?;
    }
    
    // Create and checkout new branch
    checkout_branch(&branch_name, true)?;
    
    println!(
        "\n{} {}",
        style("[✓]").green().bold(),
        style(format!("Flow started on branch '{}'", branch_name)).green()
    );
    println!(
        "\n{}\n  {}\n  {}\n  {}",
        style("Next steps:").bold(),
        style("1. Make your changes").dim(),
        style("2. Run: orca commit").dim(),
        style("3. Run: orca flow finish --pr").dim()
    );
    
    Ok(())
}

/// Finish current flow (optionally push and create PR)
pub(crate) async fn run_flow_finish(push: bool, pr: bool, yes: bool, _yes_pr: bool) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca flow finish]").bold().cyan());
    
    let branch = current_branch()?;
    println!("\n{} {}", style("Current branch:").bold(), style(&branch).green());
    
    // Check for uncommitted changes
    let status = run_git(&["status", "--porcelain"])?;
    if !status.trim().is_empty() {
        println!(
            "\n{} {}",
            style("Warning:").yellow().bold(),
            style("You have uncommitted changes").yellow()
        );
        
        if !yes {
            let proceed = Confirm::new()
                .with_prompt("Continue anyway?")
                .default(false)
                .interact()
                .context("Failed to read confirmation")?;
            
            if !proceed {
                println!("Aborted.");
                return Ok(());
            }
        }
    }
    
    if push {
        // Use the existing publish flow
        crate::flow::flows::run_publish_current_flow(None, "main", pr, None).await?;
    } else if pr {
        println!(
            "\n{} {}",
            style("Note:").yellow().bold(),
            style("--pr requires --push. Use: orca flow finish --push --pr").yellow()
        );
    } else {
        println!(
            "\n{} {}",
            style("[✓]").green().bold(),
            style("Flow completed").green()
        );
        println!(
            "\n{}\n  {}\n  {}",
            style("Next steps:").bold(),
            style("1. To publish: orca flow finish --push --pr").dim(),
            style("2. Or manually: orca publish-current").dim()
        );
    }
    
    Ok(())
}
