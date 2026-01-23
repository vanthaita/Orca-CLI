use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use dialoguer::MultiSelect;
use console::style;
use crate::plan::CommitDescription;

struct CommitRef {
    hash: Option<String>,
    message: String,
}

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

## Statistics

{stats}

## How to test

- [ ]

## Checklist

- [ ] I ran tests locally (if applicable)
- [ ] I added/updated documentation (if applicable)

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

/// Commit category information
#[derive(Debug)]
struct CommitCategory {
    name: String,
    emoji: String,
    commits: Vec<String>,
}

/// Analyze commits and extract metadata
fn analyze_commits(commits: &[String]) -> (Vec<CommitCategory>, Vec<String>) {
    use std::collections::HashMap;
    
    let mut categories: HashMap<String, Vec<String>> = HashMap::new();
    let mut issue_refs = Vec::new();
    
    for commit in commits {
        // Extract commit type (feat, fix, docs, etc.)
        let (commit_type, message) = if let Some((prefix, rest)) = commit.split_once(':') {
            (prefix.trim().to_lowercase(), rest.trim().to_string())
        } else {
            ("other".to_string(), commit.clone())
        };
        
        // Extract issue references (#123, GH-123, etc.)
        for word in commit.split_whitespace() {
            if word.starts_with('#') || word.starts_with("GH-") {
                issue_refs.push(word.to_string());
            }
        }
        
        categories.entry(commit_type).or_insert_with(Vec::new).push(message);
    }
    
    // Convert to structured categories with emojis
    let mut result = Vec::new();
    
    // Define category order and styling
    let category_info = [
        ("feat", "✨ Features"),
        ("feature", "✨ Features"),
        ("fix", "🐛 Bug Fixes"),
        ("bugfix", "🐛 Bug Fixes"),
        ("docs", "📝 Documentation"),
        ("doc", "📝 Documentation"),
        ("style", "💄 Styling"),
        ("refactor", "♻️ Refactoring"),
        ("perf", "⚡ Performance"),
        ("test", "✅ Tests"),
        ("build", "🔧 Build"),
        ("ci", "👷 CI/CD"),
        ("chore", "🔨 Chores"),
    ];
    
    for (key, display) in &category_info {
        if let Some(commits) = categories.remove(*key) {
            let parts: Vec<&str> = display.splitn(2, ' ').collect();
            result.push(CommitCategory {
                name: parts.get(1).unwrap_or(&"Other").to_string(),
                emoji: parts.get(0).unwrap_or(&"📌").to_string(),
                commits,
            });
        }
    }
    
    // Add any other categories not in the standard list
    for (key, commits) in categories {
        result.push(CommitCategory {
            name: key.chars().next().map(|c| c.to_uppercase().collect::<String>() + &key[1..]).unwrap_or(key),
            emoji: "📌".to_string(),
            commits,
        });
    }
    
    issue_refs.sort();
    issue_refs.dedup();
    
    (result, issue_refs)
}

/// Generate smart summary from commits
fn generate_smart_summary(commits: &[String], categories: &[CommitCategory]) -> String {
    if commits.is_empty() {
        return "No changes".to_string();
    }
    
    if commits.len() == 1 {
        // Single commit - use its message directly
        return commits[0].clone();
    }
    
    // Multiple commits - create intelligent summary
    if categories.len() == 1 {
        // All commits are same category
        let cat = &categories[0];
        let count = cat.commits.len();
        
        // Get common theme if possible
        if count <= 3 {
            // List them briefly
            let items = cat.commits.iter()
                .take(3)
                .map(|s| s.to_lowercase())
                .collect::<Vec<_>>()
                .join(", ");
            format!("{}: {}", cat.name, items)
        } else {
            format!("Multiple {} ({} changes)", cat.name.to_lowercase(), count)
        }
    } else {
        // Mixed categories - summarize by category
        let category_summary = categories.iter()
            .map(|cat| format!("{} {}", cat.commits.len(), cat.name.to_lowercase()))
            .collect::<Vec<_>>()
            .join(", ");
        
        format!("Multiple changes: {}", category_summary)
    }
}

/// Format changes by category
fn format_changes_by_category(categories: &[CommitCategory]) -> String {
    let mut result = Vec::new();
    
    for category in categories {
        result.push(format!("\n### {} {}", category.emoji, category.name));
        for commit in &category.commits {
            result.push(format!("- {}", commit));
        }
    }
    
    result.join("\n")
}

/// Get commit statistics
fn get_commit_stats(commits: &[String]) -> String {
    let count = commits.len();
    
    // Try to get file change stats from git
    let stats_output = crate::git::run_git(&["diff", "--shortstat", "@{u}..HEAD"])
        .ok()
        .and_then(|s| {
            if s.trim().is_empty() {
                None
            } else {
                Some(s.trim().to_string())
            }
        });
    
    let mut stats = vec![format!("- **Commits**: {}", count)];
    
    if let Some(stat_line) = stats_output {
        // Parse git shortstat output (e.g., "5 files changed, 120 insertions(+), 30 deletions(-)")
        stats.push(format!("- **Changes**: {}", stat_line));
    }
    
    stats.join("\n")
}

/// Populate template with commit data
pub fn populate_template(template: &str, commits: &[String]) -> String {
    if commits.is_empty() {
        return template
            .replace("{commit_summary}", "No commits found")
            .replace("{commit_list}", "- No changes")
            .replace("{stats}", "- **Commits**: 0");
    }

    let refs: Vec<CommitRef> = commits
        .iter()
        .map(|m| CommitRef {
            hash: None,
            message: m.clone(),
        })
        .collect();

    populate_template_with_refs(template, &refs)
}

fn populate_template_with_refs(template: &str, commits: &[CommitRef]) -> String {
    if commits.is_empty() {
        return template
            .replace("{commit_summary}", "No commits found")
            .replace("{commit_list}", "- No changes")
            .replace("{stats}", "- **Commits**: 0");
    }

    let messages: Vec<String> = commits.iter().map(|c| c.message.clone()).collect();

    // Analyze commits to extract categories and metadata
    let (categories, issue_refs) = analyze_commits(&messages);
    
    // Generate smart summary
    let summary = generate_smart_summary(&messages, &categories);

    let cached_details = build_cached_commit_details(commits);
    let summary_with_details = if cached_details.trim().is_empty() {
        summary.clone()
    } else {
        format!("{}\n\n{}", summary, cached_details)
    };
    
    // Format changes by category
    let commit_list = if categories.is_empty() {
        messages
            .iter()
            .map(|c| format!("- {}", c))
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        format_changes_by_category(&categories)
    };
    
    // Get statistics
    let stats = get_commit_stats(&messages);
    
    // Build final description
    let mut result = template
        .replace("{commit_summary}", &summary_with_details)
        .replace("{commit_list}", &commit_list)
        .replace("{stats}", &stats);
    
    // Add related issues if found
    if !issue_refs.is_empty() {
        let issues_section = format!(
            "\n\n## Related Issues\n\n{}",
            issue_refs.iter().map(|i| format!("- {}", i)).collect::<Vec<_>>().join("\n")
        );
        result.push_str(&issues_section);
    }
    
    result
}

fn build_cached_commit_details(commits: &[CommitRef]) -> String {
    let plan = match crate::commit_cache::load_latest_cached_plan().ok().flatten() {
        Some(p) => p,
        None => return String::new(),
    };

    let mut lines: Vec<String> = Vec::new();
    for commit_msg in commits {
        let planned = commit_msg
            .hash
            .as_deref()
            .and_then(|h| plan.commits.iter().find(|c| c.hash.as_deref() == Some(h)))
            .or_else(|| {
                plan.commits
                    .iter()
                    .find(|c| c.message.trim() == commit_msg.message.trim())
            });
        let Some(planned) = planned else {
            continue;
        };
        let Some(desc) = planned.description.as_ref() else {
            continue;
        };

        if lines.is_empty() {
            lines.push("### Commit Details".to_string());
            lines.push(String::new());
        }

        lines.push(format!(
            "<details>\n<summary><code>{}</code></summary>",
            planned.message.trim()
        ));
        lines.push(String::new());
        lines.extend(format_commit_description_for_pr(desc));
        lines.push(String::new());
        lines.push("</details>".to_string());
        lines.push(String::new());
    }

    lines.join("\n")
}

fn format_commit_description_for_pr(desc: &CommitDescription) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();

    let summary = desc.summary.trim();
    if !summary.is_empty() {
        out.push(summary.to_string());
    }

    if !desc.changes.is_empty() {
        out.push(String::new());
        for change in &desc.changes {
            let c = change.trim();
            if !c.is_empty() {
                out.push(format!("- {}", c));
            }
        }
    }

    if let Some(impact) = &desc.impact {
        let level = impact.level.trim();
        let explanation = impact.explanation.trim();
        if !level.is_empty() || !explanation.is_empty() {
            out.push(String::new());
            if level.is_empty() {
                out.push(format!("Impact: {}", explanation));
            } else if explanation.is_empty() {
                out.push(format!("Impact: {}", level.to_uppercase()));
            } else {
                out.push(format!("Impact: {} - {}", level.to_uppercase(), explanation));
            }
        }

        if !impact.affected_areas.is_empty() {
            let areas = impact
                .affected_areas
                .iter()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect::<Vec<_>>();
            if !areas.is_empty() {
                out.push(format!("Affected areas: {}", areas.join(", ")));
            }
        }
    }

    if !desc.breaking_changes.is_empty() {
        let bcs = desc
            .breaking_changes
            .iter()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>();
        if !bcs.is_empty() {
            out.push(String::new());
            out.push("**BREAKING CHANGES**".to_string());
            for bc in bcs {
                out.push(format!("- {}", bc));
            }
        }
    }

    out
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
    let range_start = crate::git::merge_base(&effective_base, "HEAD").unwrap_or(effective_base);
    let output = crate::git::run_git(&[
        "log",
        &format!("{}..HEAD", range_start),
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
    let range_start = crate::git::merge_base(&effective_base, "HEAD").unwrap_or(effective_base);
    let output = crate::git::run_git(&[
        "log",
        &format!("{}..HEAD", range_start),
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

/// Generate PR description from explicit list of commits
/// This is useful when you already have the commits and don't want to query them again
pub fn generate_pr_description_from_commits(commits: &[String]) -> Result<String> {
    // Find template or use default
    let template = if let Some(template_path) = find_pr_template()? {
        read_pr_template(&template_path)?
    } else {
        get_default_template()
    };

    // Populate template with provided commit data
    Ok(populate_template(&template, commits))
}

pub fn generate_pr_description_from_commits_with_hashes(commits: &[(String, String)]) -> Result<String> {
    let template = if let Some(template_path) = find_pr_template()? {
        read_pr_template(&template_path)?
    } else {
        get_default_template()
    };

    let refs: Vec<CommitRef> = commits
        .iter()
        .map(|(hash, msg)| CommitRef {
            hash: Some(hash.clone()),
            message: msg.clone(),
        })
        .collect();

    Ok(populate_template_with_refs(&template, &refs))
}

/// Generate PR description from template or default
/// Queries commits from base..HEAD
pub fn generate_pr_description(base: &str) -> Result<String> {
    let commits = get_commits_with_hashes_since_base(base)?;
    generate_pr_description_from_commits_with_hashes(&commits)
}
