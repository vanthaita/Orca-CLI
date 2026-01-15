use crate::git::{current_branch, ensure_git_repo, checkout_branch, run_git, branch_exists};
use anyhow::Result;
use console::style;
use super::flows_error;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
struct StackMetadata {
    stacks: HashMap<String, StackInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct StackInfo {
    parent: String,
    children: Vec<String>,
}

impl StackMetadata {
    fn load() -> Result<Self> {
        let stack_file = Self::stack_file_path()?;
        if !stack_file.exists() {
            return Ok(StackMetadata {
                stacks: HashMap::new(),
            });
        }
        
        let content = fs::read_to_string(&stack_file)?;
        Ok(serde_json::from_str(&content)?)
    }
    
    fn save(&self) -> Result<()> {
        let stack_file = Self::stack_file_path()?;
        if let Some(parent) = stack_file.parent() {
            fs::create_dir_all(parent)?;
        }
        
        let content = serde_json::to_string_pretty(self)?;
        fs::write(&stack_file, content)?;
        Ok(())
    }
    
    fn stack_file_path() -> Result<PathBuf> {
        let repo_root = crate::git::get_repo_root()?;
        Ok(repo_root.join(".git").join("orca-stack.json"))
    }
}

/// Create a child branch based on current branch
pub(crate) async fn run_stack_start_flow(branch_name: &str, yes: bool) -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca stack start]");
    
    let parent_branch = current_branch()?;
    println!("\n{} {}", style("Parent branch:").bold(), style(&parent_branch).cyan());
    println!("{} {}", style("New branch:").bold(), style(branch_name).green());
    
    // Check if branch already exists
    if branch_exists(branch_name)? {
        anyhow::bail!("Branch '{}' already exists", branch_name);
    }
    
    // Confirm
    if !yes {
        if !flows_error::confirm_or_abort(
            format!("Create '{}' stacked on '{}'?", branch_name, parent_branch),
            true,
        )? {
            return Ok(());
        }
    }
    
    // Create branch
    checkout_branch(branch_name, true)?;
    
    // Update stack metadata
    let mut metadata = StackMetadata::load()?;
    metadata.stacks.insert(
        branch_name.to_string(),
        StackInfo {
            parent: parent_branch.clone(),
            children: vec![],
        },
    );
    
    // Add to parent's children list
    if let Some(parent_info) = metadata.stacks.get_mut(&parent_branch) {
        if !parent_info.children.contains(&branch_name.to_string()) {
            parent_info.children.push(branch_name.to_string());
        }
    } else {
        metadata.stacks.insert(
            parent_branch.clone(),
            StackInfo {
                parent: String::new(),
                children: vec![branch_name.to_string()],
            },
        );
    }
    
    metadata.save()?;
    
    println!(
        "\n{} {}",
        style("[✓]").green().bold(),
        style(format!("Stacked branch '{}' created", branch_name)).green()
    );
    
    Ok(())
}

/// Show stack relationships
pub(crate) async fn run_stack_list_flow() -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca stack list]");
    
    let metadata = StackMetadata::load()?;
    
    if metadata.stacks.is_empty() {
        println!("\n{}", style("No stacked branches found").dim());
        return Ok(());
    }
    
    let current = current_branch()?;
    
    println!("\n{}", style("Stack Relationships:").bold());
    println!("{}", style("═".repeat(60)).dim());
    
    // Find root branches (those without parents or with empty parent)
    let roots: Vec<_> = metadata.stacks.iter()
        .filter(|(_, info)| info.parent.is_empty())
        .map(|(name, _)| name.clone())
        .collect();
    
    fn print_tree(
        branch: &str,
        metadata: &StackMetadata,
        current: &str,
        prefix: &str,
        is_last: bool,
    ) {
        let marker = if branch == current {
            style("*").green().bold().to_string()
        } else {
            " ".to_string()
        };
        
        let branch_style = if branch == current {
            style(branch).green().bold()
        } else {
            style(branch).white()
        };
        
        let connector = if is_last { "└─" } else { "├─" };
        println!("{}{} {} {}", prefix, connector, marker, branch_style);
        
        if let Some(info) = metadata.stacks.get(branch) {
            let child_prefix = format!("{}{}  ", prefix, if is_last { " " } else { "│" });
            let child_count = info.children.len();
            
            for (i, child) in info.children.iter().enumerate() {
                let is_last_child = i == child_count - 1;
                print_tree(child, metadata, current, &child_prefix, is_last_child);
            }
        }
    }
    
    for (i, root) in roots.iter().enumerate() {
        let is_last = i == roots.len() - 1;
        print_tree(root, &metadata, &current, "", is_last);
    }
    
    println!("{}", style("═".repeat(60)).dim());
    
    Ok(())
}

/// Rebase stack when base branch moves
pub(crate) async fn run_stack_rebase_flow(onto: Option<&str>, yes: bool) -> Result<()> {
    ensure_git_repo()?;

    flows_error::print_flow_header("[orca stack rebase]");
    
    let current = current_branch()?;
    let metadata = StackMetadata::load()?;
    
    // Get stack info
    let stack_info = metadata.stacks.get(&current)
        .ok_or_else(|| anyhow::anyhow!("Branch '{}' is not in a stack", current))?;
    
    let parent = &stack_info.parent;
    if parent.is_empty() {
        anyhow::bail!("Branch '{}' has no parent", current);
    }
    
    let rebase_onto = onto.unwrap_or(parent);
    
    println!("\n{} {}", style("Current branch:").bold(), style(&current).green());
    println!("{} {}", style("Rebase onto:").bold(), style(rebase_onto).cyan());
    
    // Confirm
    if !yes {
        if !flows_error::confirm_or_abort(format!("Rebase '{}' onto '{}'?", current, rebase_onto), true)? {
            return Ok(());
        }
    }
    
    // Perform rebase
    println!("\n{}", style("Rebasing...").dim());
    run_git(&["rebase", rebase_onto])?;
    
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Stack rebased successfully").green()
    );
    
    // Suggest rebasing children
    if !stack_info.children.is_empty() {
        println!(
            "\n{} {}",
            style("Note:").yellow().bold(),
            style(format!(
                "This branch has {} child branch(es). Consider rebasing them too.",
                stack_info.children.len()
            )).yellow()
        );
        
        for child in &stack_info.children {
            println!("  orca stack rebase --onto {} (on branch {})", current, child);
        }
    }
    
    Ok(())
}

/// Publish stack branches in order
pub(crate) async fn run_stack_publish_flow(pr: bool, yes: bool, _yes_pr: bool) -> Result<()> {
    // Check if user has Pro/Team plan when using --pr
    if pr {
        crate::plan_guard::require_feature(crate::plan_types::FeaturePermission::AutoPublish).await?;
    }

    ensure_git_repo()?;

    flows_error::print_flow_header("[orca stack publish]");
    
    let current = current_branch()?;
    let metadata = StackMetadata::load()?;
    
    // Build publish order (parent first, then current)
    let mut publish_order = vec![];
    let mut branch = current.clone();
    
    while let Some(info) = metadata.stacks.get(&branch) {
        if info.parent.is_empty() {
            break;
        }
        publish_order.push(branch.clone());
        branch = info.parent.clone();
    }
    
    publish_order.reverse();
    
    if publish_order.is_empty() {
        publish_order.push(current.clone());
    }
    
    println!("\n{}", style("Publish order:").bold());
    for (i, br) in publish_order.iter().enumerate() {
        let marker = if br == &current { "*" } else { " " };
        println!("  {}. {} {}", i + 1, marker, style(br).cyan());
    }
    
    // Confirm
    if !yes {
        if !flows_error::confirm_or_abort("Publish stack in this order?", true)? {
            return Ok(());
        }
    }
    
    // Publish each branch
    for branch_name in &publish_order {
        println!("\n{} {}", style("Publishing:").bold(), style(branch_name).cyan());
        
        // Checkout branch
        checkout_branch(branch_name, false)?;
        
        // Push with upstream
        let remote = crate::git::get_remote_name().unwrap_or_else(|_| "origin".to_string());
        run_git(&["push", "-u", &remote, branch_name])?;
        
        println!(
            "{} {}",
            style("[✓]").green(),
            style(format!("'{}' published", branch_name)).green()
        );
    }
    
    // Return to current branch
    checkout_branch(&current, false)?;
    
    // Optionally create PRs
    if pr {
        println!(
            "\n{} {}",
            style("Note:").yellow().bold(),
            style("Creating PRs for stacked branches...").yellow()
        );
        
        for branch_name in &publish_order {
            let stack_info = metadata.stacks.get(branch_name);
            let base = stack_info
                .and_then(|info| if info.parent.is_empty() { None } else { Some(info.parent.as_str()) })
                .unwrap_or("main");
            
            println!("\n{} {}", style("Creating PR for:").bold(), style(branch_name).cyan());
            println!("  {} {}", style("Base:").bold(), style(base).dim());
            
            // Use publish flow to create PR
            crate::flow::flows::run_publish_current_flow(
                Some(branch_name),
                base,
                true,
                None,  // No mode specified for stack publish
                false,
            ).await?;
        }
    }
    
    println!(
        "\n{} {}",
        style("[✓]").green().bold(),
        style("Stack published successfully").green()
    );
    
    Ok(())
}
