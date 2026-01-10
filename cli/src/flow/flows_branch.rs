use crate::git::{
    branch_exists, checkout_branch, current_branch, ensure_git_repo, get_remote_name,
    list_branches, list_remote_branches, run_git, upstream_ref,
};
use anyhow::{Context, Result};
use console::style;
use super::flows_error;

/// Show current branch with status
pub(crate) async fn run_branch_current_flow() -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca branch current]");
    
    let branch = current_branch()?;
    println!("\n{} {}", style("Current branch:").bold(), style(&branch).green().bold());
    
    if let Some(upstream) = upstream_ref()? {
        println!("{} {}", style("Upstream:").bold(), style(&upstream).cyan());
    } else {
        println!(
            "{} {}",
            style("Upstream:").bold(),
            style("(not configured)").dim()
        );
    }
    
    Ok(())
}

/// List local or remote branches
pub(crate) async fn run_branch_list_flow(remote: bool) -> Result<()> {
    ensure_git_repo()?;
    
    println!(
        "{}",
        style(format!("[orca branch list{}]", if remote { " --remote" } else { "" }))
            .bold()
            .cyan()
    );
    
    let current = current_branch()?;
    
    if remote {
        let remote_name = get_remote_name()?;
        let branches = list_remote_branches(&remote_name)?;
        
        if branches.is_empty() {
            println!("\n{}", style("No remote branches found").dim());
        } else {
            println!("\n{}", style("Remote branches:").bold());
            for branch in branches {
                println!("  {}", style(&branch).cyan());
            }
        }
    } else {
        let branches = list_branches()?;
        
        if branches.is_empty() {
            println!("\n{}", style("No branches found").dim());
        } else {
            println!("\n{}", style("Local branches:").bold());
            for branch in branches {
                if branch == current {
                    println!("  {} {}", style("*").green().bold(), style(&branch).green().bold());
                } else {
                    println!("    {}", style(&branch).dim());
                }
            }
        }
    }
    
    Ok(())
}

/// Create new branch with naming conventions
pub(crate) async fn run_branch_new_flow(
    branch_type: &str,
    name: &str,
    base: Option<&str>,
) -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca branch new]");
    
    // Validate branch type
    let valid_types = ["feat", "feature", "fix", "bugfix", "chore", "hotfix", "release"];
    if !valid_types.contains(&branch_type) {
        anyhow::bail!(
            "Invalid branch type '{}'. Valid types: {}",
            branch_type,
            valid_types.join(", ")
        );
    }
    
    // Normalize type (feature -> feat, bugfix -> fix)
    let normalized_type = match branch_type {
        "feature" => "feat",
        "bugfix" => "fix",
        _ => branch_type,
    };
    
    // Create branch name with convention
    let branch_name = format!("{}/{}", normalized_type, name);
    
    // Check if branch already exists
    if branch_exists(&branch_name)? {
        anyhow::bail!("Branch '{}' already exists", branch_name);
    }
    
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
        style(format!("Created and switched to branch '{}'", branch_name)).green()
    );
    
    Ok(())
}

/// Push current branch to remote with upstream tracking
pub(crate) async fn run_branch_publish_flow(yes: bool) -> Result<()> {
    // Check if user has Pro/Team plan for publish feature
    crate::plan_guard::require_feature(crate::plan_types::FeaturePermission::AutoPublish).await?;

    ensure_git_repo()?;

    flows_error::print_flow_header("[orca branch publish]");
    
    let branch = current_branch()?;
    let remote = get_remote_name()?;
    
    println!("\n{} {}", style("Current branch:").bold(), style(&branch).green());
    println!("{} {}", style("Remote:").bold(), style(&remote).cyan());
    
    // Check if upstream already exists
    if let Some(upstream) = upstream_ref()? {
        println!(
            "{} {}",
            style("Upstream:").bold(),
            style(&upstream).cyan()
        );
        println!(
            "\n{} {}",
            style("Note:").yellow().bold(),
            style("This branch already has an upstream configured").yellow()
        );
    }
    
    // Confirm
    if !yes {
        if !flows_error::confirm_or_abort(format!("Push '{}' to '{}'?", branch, remote), true)? {
            return Ok(());
        }
    }
    
    // Push with upstream tracking
    println!("\n{}", style("Pushing to remote...").dim());
    run_git(&["push", "-u", &remote, &branch])?;
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style(format!("Successfully pushed '{}' to '{}'", branch, remote)).green()
    );
    
    Ok(())
}
