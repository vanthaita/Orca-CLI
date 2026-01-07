use crate::git::{ensure_git_repo, run_git};
use anyhow::Result;
use console::style;

/// Show conflicted files and current state
pub(crate) async fn run_conflict_status_flow() -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca conflict status]").bold().cyan());
    
    // Check if in rebase/merge
    let repo_root = crate::git::get_repo_root()?;
    let rebase_merge = repo_root.join(".git/rebase-merge");
    let rebase_apply = repo_root.join(".git/rebase-apply");
    let merge_head = repo_root.join(".git/MERGE_HEAD");
    
    let in_rebase = rebase_merge.exists() || rebase_apply.exists();
    let in_merge = merge_head.exists();
    
    if !in_rebase && !in_merge {
        println!("\n{}", style("✓ Not in a rebase or merge").green());
        return Ok(());
    }
    
    // Show state
    println!();
    if in_rebase {
        println!("{} {}", style("State:").bold(), style("REBASE").yellow());
        
        // Try to read rebase todo
        if let Ok(todo) = std::fs::read_to_string(rebase_merge.join("git-rebase-todo")) {
            let remaining: Vec<_> = todo.lines()
                .filter(|l| !l.starts_with('#') && !l.trim().is_empty())
                .collect();
            if !remaining.is_empty() {
                println!(
                    "{} {}",
                    style("Remaining:").bold(),
                    style(format!("{} commits", remaining.len())).yellow()
                );
            }
        }
    } else if in_merge {
        println!("{} {}", style("State:").bold(), style("MERGE").yellow());
    }
    
    // Get conflicted files
    let status = run_git(&["status", "--short"])?;
    let conflicted: Vec<_> = status.lines()
        .filter(|l| l.starts_with("UU") || l.starts_with("AA") || l.starts_with("DD"))
        .collect();
    
    if conflicted.is_empty() {
        println!("\n{}", style("✓ No conflicted files").green());
        println!(
            "\n{}\n  {}",
            style("Next step:").bold(),
            style("Run: orca conflict continue").dim()
        );
    } else {
        println!("\n{}", style("Conflicted files:").bold().red());
        for line in conflicted {
            println!("  {}", style(line).red());
        }
        
        println!(
            "\n{}\n  {}\n  {}",
            style("Next steps:").bold(),
            style("1. Resolve conflicts in the files above").dim(),
            style("2. Run: orca conflict continue").dim()
        );
    }
    
    Ok(())
}

/// Show step-by-step conflict resolution guide
pub(crate) async fn run_conflict_guide_flow(ai: bool) -> Result<()> {
    // Always require Pro/Team for AI conflict resolution
    crate::plan_guard::require_feature(crate::plan_types::FeaturePermission::AiConflictResolution).await?;

    ensure_git_repo()?;
    
    println!("{}", style("[orca conflict guide]").bold().cyan());
    
    // Get conflicted files
    let status = run_git(&["status", "--short"])?;
    let conflicted: Vec<_> = status.lines()
        .filter(|l| l.starts_with("UU") || l.starts_with("AA") || l.starts_with("DD"))
        .map(|l| l.split_whitespace().last().unwrap_or(""))
        .collect();
    
    if conflicted.is_empty() {
        println!("\n{}", style("✓ No conflicted files").green());
        return Ok(());
    }
    
    println!("\n{}", style("Conflict Resolution Guide").bold());
    println!("{}", style("═".repeat(50)).dim());
    
    println!("\n{}", style("Step 1: Review conflicted files").bold().cyan());
    for (i, file) in conflicted.iter().enumerate() {
        println!("  {}. {}", i + 1, style(file).yellow());
    }
    
    println!("\n{}", style("Step 2: Resolve conflicts").bold().cyan());
    println!("  Open each file and look for conflict markers:");
    println!("  {}", style("  <<<<<<< HEAD").red());
    println!("  {}", style("  (your changes)").dim());
    println!("  {}", style("  =======").yellow());
    println!("  {}", style("  (incoming changes)").dim());
    println!("  {}", style("  >>>>>>> branch-name").green());
    
    println!("\n{}", style("Step 3: Choose resolution").bold().cyan());
    println!("  • Keep your changes (remove incoming)");
    println!("  • Keep incoming changes (remove yours)");
    println!("  • Combine both changes");
    println!("  • Write a completely new solution");
    
    println!("\n{}", style("Step 4: Mark as resolved").bold().cyan());
    println!("  After editing, stage each file:");
    println!("  {}", style("  git add <file>").cyan());
    
    println!("\n{}", style("Step 5: Continue").bold().cyan());
    println!("  Once all conflicts are resolved:");
    println!("  {}", style("  orca conflict continue").cyan());
    
    println!("\n{}", style("Alternative: Abort").bold().yellow());
    println!("  To give up and go back:");
    println!("  {}", style("  orca conflict abort").cyan());
    
    if ai {
        println!(
            "\n{} {}",
            style("Note:").yellow().bold(),
            style("AI-powered conflict explanation coming in future update").yellow()
        );
    }
    
    Ok(())
}

/// Continue rebase/merge after resolving conflicts
pub(crate) async fn run_conflict_continue_flow() -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca conflict continue]").bold().cyan());
    
    // Check state
    let repo_root = crate::git::get_repo_root()?;
    let in_rebase = repo_root.join(".git/rebase-merge").exists() 
        || repo_root.join(".git/rebase-apply").exists();
    let in_merge = repo_root.join(".git/MERGE_HEAD").exists();
    
    if !in_rebase && !in_merge {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style("Not in a rebase or merge").red()
        );
        anyhow::bail!("Not in a rebase or merge");
    }
    
    // Check for unresolved conflicts
    let status = run_git(&["status", "--short"])?;
    let has_conflicts = status.lines()
        .any(|l| l.starts_with("UU") || l.starts_with("AA") || l.starts_with("DD"));
    
    if has_conflicts {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style("Conflicts still exist").red()
        );
        println!(
            "\n{}\n  {}",
            style("Hint:").cyan().bold(),
            style("Resolve all conflicts and stage files before continuing").cyan()
        );
        anyhow::bail!("Unresolved conflicts remain");
    }
    
    // Continue
    println!("\n{}", style("Continuing...").dim());
    
    if in_rebase {
        run_git(&["rebase", "--continue"])?;
        println!(
            "{} {}",
            style("[✓]").green().bold(),
            style("Rebase continued successfully").green()
        );
    } else {
        run_git(&["commit", "--no-edit"])?;
        println!(
            "{} {}",
            style("[✓]").green().bold(),
            style("Merge completed successfully").green()
        );
    }
    
    Ok(())
}

/// Abort rebase/merge
pub(crate) async fn run_conflict_abort_flow(yes: bool) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca conflict abort]").bold().cyan());
    
    // Check state
    let repo_root = crate::git::get_repo_root()?;
    let in_rebase = repo_root.join(".git/rebase-merge").exists() 
        || repo_root.join(".git/rebase-apply").exists();
    let in_merge = repo_root.join(".git/MERGE_HEAD").exists();
    
    if !in_rebase && !in_merge {
        println!(
            "\n{} {}",
            style("Error:").red().bold(),
            style("Not in a rebase or merge").red()
        );
        anyhow::bail!("Not in a rebase or merge");
    }
    
    // Confirm
    if !yes {
        use dialoguer::Confirm;
        let proceed = Confirm::new()
            .with_prompt("Abort and discard all conflict resolutions?")
            .default(false)
            .interact()?;
        
        if !proceed {
            println!("Cancelled.");
            return Ok(());
        }
    }
    
    // Abort
    println!("\n{}", style("Aborting...").dim());
    
    if in_rebase {
        run_git(&["rebase", "--abort"])?;
        println!(
            "{} {}",
            style("[✓]").green().bold(),
            style("Rebase aborted").green()
        );
    } else {
        run_git(&["merge", "--abort"])?;
        println!(
            "{} {}",
            style("[✓]").green().bold(),
            style("Merge aborted").green()
        );
    }
    
    Ok(())
}
