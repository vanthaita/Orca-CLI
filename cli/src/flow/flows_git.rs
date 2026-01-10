use crate::git::{
    current_branch, ensure_git_repo, fetch_remote, get_remote_name, is_working_tree_clean,
    merge_upstream, rebase_upstream, run_git, upstream_ahead_behind, upstream_ref,
};
use anyhow::{Context, Result};
use console::style;
use super::flows_error;

/// Enhanced git status with colored output
pub(crate) async fn run_git_status_flow() -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca git status]");
    
    // Get current branch
    let branch = current_branch()?;
    println!("\n{} {}", 
        style("On branch:").bold(), 
        style(&branch).green().bold()
    );
    
    // Get upstream info if available
    if let Some(upstream) = upstream_ref()? {
        print!("{} {}", style("Upstream:").bold(), style(&upstream).cyan());
        
        if let Some((ahead, behind)) = upstream_ahead_behind()? {
            if ahead > 0 || behind > 0 {
                print!(" [");
                if ahead > 0 {
                    print!("{} {}", style("↑").green(), style(ahead).green());
                }
                if ahead > 0 && behind > 0 {
                    print!(" ");
                }
                if behind > 0 {
                    print!("{} {}", style("↓").yellow(), style(behind).yellow());
                }
                print!("]");
            } else {
                print!(" {}", style("[up to date]").dim());
            }
        }
        println!();
    } else {
        println!(
            "{} {}",
            style("Upstream:").bold(),
            style("(not set)").dim()
        );
    }
    
    println!();
    
    // Run git status
    let status_output = run_git(&["status", "--short"])?;
    
    if status_output.trim().is_empty() {
        println!("{}", style("Working tree clean ✓").green());
    } else {
        println!("{}", style("Changes:").bold());
        // Print status with colors
        for line in status_output.lines() {
            let trimmed = line.trim_end();
            if trimmed.starts_with("M ") || trimmed.starts_with(" M") || trimmed.starts_with("MM") {
                println!("  {}", style(trimmed).yellow());
            } else if trimmed.starts_with("A ") || trimmed.starts_with("?? ") {
                println!("  {}", style(trimmed).green());
            } else if trimmed.starts_with("D ") || trimmed.starts_with(" D") {
                println!("  {}", style(trimmed).red());
            } else {
                println!("  {}", trimmed);
            }
        }
    }
    
    Ok(())
}

/// Git log with various formatting options
pub(crate) async fn run_git_log_flow(
    n: Option<u32>,
    oneline: bool,
    graph: bool,
    since: Option<String>,
) -> Result<()> {
    ensure_git_repo()?;
    
    let mut args = vec!["log"];
    
    // Number of commits
    let count_str = n.unwrap_or(10).to_string();
    args.push("-n");
    args.push(&count_str);
    
    // Format
    if oneline {
        args.push("--oneline");
    } else {
        args.push("--pretty=format:%C(yellow)%h%Creset %C(bold blue)%an%Creset - %s %C(dim)(%cr)%Creset");
    }
    
    // Graph
    if graph {
        args.push("--graph");
    }
    
    // Date filter
    let since_str;
    if let Some(ref s) = since {
        args.push("--since");
        since_str = s.clone();
        args.push(&since_str);
    }
    
    println!("{}", style("[orca git log]").bold().cyan());
    println!();
    
    let output = run_git(&args)?;
    
    if output.trim().is_empty() {
        println!("{}", style("No commits found").dim());
    } else {
        println!("{}", output);
    }
    
    Ok(())
}

/// Sync current branch with remote (fetch + merge/rebase)
pub(crate) async fn run_git_sync_flow(rebase: bool, yes: bool) -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca git sync]");
    
    let branch = current_branch()?;
    println!("\n{} {}", style("Current branch:").bold(), style(&branch).green());
    
    // Check if working tree is clean
    if !is_working_tree_clean()? {
        println!(
            "\n{} {}",
            style("Warning:").yellow().bold(),
            style("You have uncommitted changes").yellow()
        );
        
        if !yes {
            if !flows_error::confirm_or_abort("Continue anyway?", false)? {
                return Ok(());
            }
        }
    }
    
    // Get remote name
    let remote = get_remote_name()?;
    println!("{} {}", style("Remote:").bold(), style(&remote).cyan());
    
    // Check if upstream is configured
    let upstream = upstream_ref()?;
    if upstream.is_none() {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style("No upstream branch configured").red()
        );
        println!(
            "\n{} {}",
            style("Hint:").cyan().bold(),
            style(format!("git push -u {} {}", remote, branch)).cyan()
        );
        anyhow::bail!("No upstream branch configured");
    }
    
    // Fetch from remote
    println!("\n{}", style("Fetching from remote...").dim());
    fetch_remote(&remote)?;
    println!("{} {}", style("[✓]").green().bold(), style("Fetched").green());
    
    // Check if we're ahead or behind
    if let Some((ahead, behind)) = upstream_ahead_behind()? {
        if ahead > 0 {
            println!(
                "{} {}",
                style("Local commits:").bold(),
                style(format!("{} commits ahead", ahead)).green()
            );
        }
        if behind > 0 {
            println!(
                "{} {}",
                style("Remote commits:").bold(),
                style(format!("{} commits behind", behind)).yellow()
            );
        }
        
        if behind == 0 {
            println!("\n{}", style("Already up to date ✓").green());
            return Ok(());
        }
    }
    
    // Perform merge or rebase
    let action = if rebase { "rebase" } else { "merge" };
    println!("\n{}", style(format!("Performing {}...", action)).dim());
    
    if rebase {
        rebase_upstream()?;
    } else {
        merge_upstream()?;
    }
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style(format!("Successfully synchronized via {}", action)).green()
    );
    
    Ok(())
}
