use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use dialoguer::MultiSelect;
use console::style;

/// Find PR template in common locations
pub fn find_pr_template() -> Result<Option<PathBuf>> {
    let template_paths = [
        ".github/pull_request_template.md",
        ".github/PULL_REQUEST_TEMPLATE.md",
        ".github/PULL_REQUEST_TEMPLATE/pull_request_template.md",
        "docs/pull_request_template.md",
    ];

    for path in &template_paths {
        let p = PathBuf::from(path);
        if p.exists() && p.is_file() {
            return Ok(Some(p));
        }
    }

    // Check for any .md file in .github/PULL_REQUEST_TEMPLATE/ directory
    let pr_template_dir = PathBuf::from(".github/PULL_REQUEST_TEMPLATE");
    if pr_template_dir.exists() && pr_template_dir.is_dir() {
        if let Ok(entries) = fs::read_dir(&pr_template_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    return Ok(Some(path));
                }
            }
        }
    }

    Ok(None)
}

/// Read PR template content from file
pub fn read_pr_template(path: &Path) -> Result<String> {
    fs::read_to_string(path)
        .with_context(|| format!("Failed to read PR template: {}", path.display()))
}

/// Get professional default template when none exists
pub fn get_default_template() -> String {
    r#"## Summary

{commit_summary}

## Changes

{commit_list}

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] Manual testing completed
"#
    .to_string()
}

/// Populate template with commit data
pub fn populate_template(template: &str, commits: &[String]) -> String {
    if commits.is_empty() {
        return template
            .replace("{commit_summary}", "No commits found")
            .replace("{commit_list}", "- No changes");
    }

    // Use first commit as summary
    let summary = commits.first().map(|s| s.as_str()).unwrap_or("Changes");

    // Create list of all commits
    let commit_list = commits
        .iter()
        .map(|c| format!("- {}", c))
        .collect::<Vec<_>>()
        .join("\n");

    template
        .replace("{commit_summary}", summary)
        .replace("{commit_list}", &commit_list)
}

/// Generate smart PR title from multiple commits
pub fn generate_pr_title(commits: &[String]) -> String {
    if commits.is_empty() {
        return "Update".to_string();
    }

    if commits.len() == 1 {
        return commits[0].clone();
    }

    // Extract commit types (feat, fix, refactor, etc.)
    let types: Vec<&str> = commits
        .iter()
        .filter_map(|c| {
            if let Some((prefix, _)) = c.split_once(':') {
                Some(prefix.trim())
            } else {
                None
            }
        })
        .collect();

    // Determine common type
    let commit_type = if !types.is_empty() && types.iter().all(|t| t == &types[0]) {
        // All commits have same type
        types[0]
    } else if !types.is_empty() {
        // Mixed types - try to find most common
        let mut type_counts = std::collections::HashMap::new();
        for t in &types {
            *type_counts.entry(*t).or_insert(0) += 1;
        }
        type_counts
            .into_iter()
            .max_by_key(|(_, count)| *count)
            .map(|(t, _)| t)
            .unwrap_or("chore")
    } else {
        "chore"
    };

    // Extract common keywords from commit messages
    let keywords: Vec<String> = commits
        .iter()
        .filter_map(|c| {
            if let Some((_, rest)) = c.split_once(':') {
                let trimmed = rest.trim();
                // Take first few words
                let words: Vec<&str> = trimmed.split_whitespace().take(3).collect();
                if !words.is_empty() {
                    Some(words.join(" "))
                } else {
                    None
                }
            } else {
                None
            }
        })
        .collect();

    // Generate title
    if !keywords.is_empty() {
        // Use first commit's subject as base
        let base_subject = keywords[0].clone();
        format!("{}: {} ({} commits)", commit_type, base_subject, commits.len())
    } else {
        format!("{}: Multiple changes ({} commits)", commit_type, commits.len())
    }
}

/// Check if a PR already exists for the given branch and base
pub fn check_existing_pr(branch: &str, base: &str) -> Result<Option<String>> {
    let output = Command::new("gh")
        .args([
            "pr",
            "list",
            "--head",
            branch,
            "--base",
            base,
            "--json",
            "url",
            "--jq",
            ".[0].url",
        ])
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if url.is_empty() {
                    Ok(None)
                } else {
                    Ok(Some(url))
                }
            } else {
                // Command failed, likely not authenticated or no PRs found
                Ok(None)
            }
        }
        Err(_) => {
            // gh command not available or failed to execute
            Ok(None)
        }
    }
}
/// Get commit messages between base and current branch
pub fn get_commits_since_base(base: &str) -> Result<Vec<String>> {
    let effective_base = crate::git::resolve_base_ref(base);
    let output = crate::git::run_git(&[
        "log",
        &format!("{}..HEAD", effective_base),
        "--pretty=format:%s",
    ])?;

    let commits: Vec<String> = output
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    Ok(commits)
}

/// Get commit hashes and messages between base and current branch
/// Returns Vec<(hash, message)> in chronological order (newest first)
pub fn get_commits_with_hashes_since_base(base: &str) -> Result<Vec<(String, String)>> {
    let effective_base = crate::git::resolve_base_ref(base);
    let output = crate::git::run_git(&[
        "log",
        &format!("{}..HEAD", effective_base),
        "--pretty=format:%H@@@@%s",
    ])?;

    let commits: Vec<(String, String)> = output
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                return None;
            }
            
            // Split by custom delimiter
            if let Some((hash, message)) = trimmed.split_once("@@@@") {
                Some((hash.trim().to_string(), message.trim().to_string()))
            } else {
                None
            }
        })
        .collect();

    Ok(commits)
}

/// Prompt user to interactively select commits
/// Returns selected commits as Vec<(hash, message)>
pub fn prompt_select_commits(commits: &[(String, String)]) -> Result<Vec<(String, String)>> {
    if commits.is_empty() {
        anyhow::bail!("No commits available to select");
    }

    // Create display items with short hash and message
    let display_items: Vec<String> = commits
        .iter()
        .map(|(hash, message)| {
            let short_hash = &hash[..7.min(hash.len())];
            format!("[{}] {}", style(short_hash).cyan(), message)
        })
        .collect();

    eprintln!();
    eprintln!(
        "{} {}",
        style("📝 Select commits to publish:").cyan().bold(),
        style(format!("({} available)", commits.len())).dim()
    );
    eprintln!("   {}", style("Use Space to select, Enter to confirm").dim());
    eprintln!();

    let selections = MultiSelect::new()
        .with_prompt("Commits")
        .items(&display_items)
        .interact()?;

    if selections.is_empty() {
        anyhow::bail!("No commits selected. Aborting.");
    }

    // Return selected commits in the same order
    let selected: Vec<(String, String)> = selections
        .iter()
        .map(|&idx| commits[idx].clone())
        .collect();

    eprintln!();
    eprintln!(
        "{} {}",
        style("[✓]").green().bold(),
        style(format!("Selected {} commit(s)", selected.len())).green()
    );

    Ok(selected)
}

/// Generate PR description from template or default
pub fn generate_pr_description(base: &str) -> Result<String> {
    // Get commits
    let commits = get_commits_since_base(base)?;

    // Find template or use default
    let template = if let Some(template_path) = find_pr_template()? {
        read_pr_template(&template_path)?
    } else {
        get_default_template()
    };

    // Populate template with commit data
    Ok(populate_template(&template, &commits))
}
