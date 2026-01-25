use crate::git::{patch_id_from_patch, recent_patch_ids, run_git};
use anyhow::Result;
use console::style;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct CommitPlan {
    pub(crate) commits: Vec<PlannedCommit>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct PlannedCommit {
    pub(crate) message: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) hash: Option<String>,
    pub(crate) files: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub(crate) commands: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) description: Option<CommitDescription>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct CommitDescription {
    /// Summary chi tiết về những thay đổi
    pub(crate) summary: String,
    /// Danh sách các thay đổi quan trọng
    pub(crate) changes: Vec<String>,
    /// Đánh giá tác động
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) impact: Option<ImpactAnalysis>,
    /// Breaking changes (nếu có)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub(crate) breaking_changes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct ImpactAnalysis {
    /// Mức độ tác động: low, medium, high
    pub(crate) level: String,
    /// Giải thích về tác động
    pub(crate) explanation: String,
    /// Các modules/components bị ảnh hưởng
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub(crate) affected_areas: Vec<String>,
}

pub(crate) fn print_plan_human(plan: &CommitPlan) {
    let total_commits = plan.commits.len();
    let total_files: usize = plan.commits.iter().map(|c| c.files.len()).sum();
    
    println!("\n{}", style("╭──────────────────────────────────────────────────────────╮").cyan());
    println!(
        "{}   {}", 
        style("│").cyan(),
        style(format!("📋 Proposed Plan: {} commits, {} files", total_commits, total_files)).bold().white()
    );
    println!("{}", style("╰──────────────────────────────────────────────────────────╯").cyan());

    for (i, c) in plan.commits.iter().enumerate() {
        let is_last = i == total_commits - 1;
        
        println!(
            "\n{} {}",
            style(format!("Commit #{}", i + 1)).bold().magenta(),
            style(format!("({} files)", c.files.len())).dim()
        );
        
        println!("{}", style("─".repeat(60)).dim());
        
        // Message
        println!("  {} {}", style("📝"), style(&c.message).bold().white());
        
        // Description
        if let Some(desc) = &c.description {
            println!("\n  {}", style("📄 Description:").dim());
            println!("  {}", style(&desc.summary).white());
            
            if !desc.changes.is_empty() {
                println!();
                for change in &desc.changes {
                    println!("    {} {}", style("•").blue(), style(change).white());
                }
            }
            
            if let Some(impact) = &desc.impact {
                println!();
                let level_badge = match impact.level.to_lowercase().as_str() {
                    "high" => style(" IMPACT: HIGH ").on_red().white().bold(),
                    "medium" => style(" IMPACT: MEDIUM ").on_yellow().black().bold(),
                    _ => style(" IMPACT: LOW ").on_green().white().bold(),
                };
                
                println!("    {}  {}", level_badge, style(&impact.explanation).dim());
                if !impact.affected_areas.is_empty() {
                    println!("             {}: {}", style("Affected").dim(), style(impact.affected_areas.join(", ")).dim());
                }
            }
            
            if !desc.breaking_changes.is_empty() {
                println!();
                println!("    {}", style("🚨 BREAKING CHANGES").red().bold());
                for bc in &desc.breaking_changes {
                    println!("      {} {}", style("!").red(), style(bc).red());
                }
            }
        }
        
        // Files
        println!("\n  {}", style("📂 Files:").dim());
        for f in &c.files {
            println!("    {} {}", style("│").dim(), style(f).cyan());
        }
        
        // Commands
        println!("\n  {}", style("⚙️  Commands:").dim());
        for cmd in &c.commands {
            println!("    {} {}", style("$").dim(), style(cmd).yellow());
        }
        
        if !is_last {
            println!("\n{}", style("  • • •").dim());
        }
    }
    println!();
}

pub(crate) fn files_from_status_porcelain(status: &str) -> Vec<String> {
    let mut out = Vec::new();
    for line in status.lines() {
        let l = line.trim_end();
        if l.len() < 4 {
            continue;
        }
        let rest = l[2..].trim();
        if let Some((_old, new)) = rest.split_once(" -> ") {
            out.push(new.trim().to_string());
        } else {
            out.push(rest.to_string());
        }
    }
    out.sort();
    out.dedup();
    out
}

pub(crate) fn normalize_plan_files(plan: &mut CommitPlan, changed_files: &[String]) {
    for c in &mut plan.commits {
        let mut normalized: Vec<String> = Vec::with_capacity(c.files.len());
        for raw in &c.files {
            let f = raw.trim();
            if f.is_empty() {
                continue;
            }

            if let Some(prefix) = f.strip_suffix('/') {
                // Preserve original behavior: directory expansion matches "prefix/".
                let prefix = format!("{prefix}/");
                normalized.extend(
                    changed_files
                        .iter()
                        .filter(|cf| cf.starts_with(&prefix))
                        .cloned(),
                );
                continue;
            }

            // Avoid allocating if already trimmed without changes.
            if raw.len() == f.len() {
                normalized.push(raw.clone());
            } else {
                normalized.push(f.to_string());
            }
        }
        normalized.sort();
        normalized.dedup();
        c.files = normalized;

        if c.commands.is_empty() {
            let msg = c.message.replace('"', "\\\"");
            c.commands = vec![
                format!("git add -- {}", c.files.join(" ")),
                format!("git commit -m \"{}\"", msg),
            ];
        }
    }
}

fn has_staged_changes() -> Result<bool> {
    let out = run_git(&["diff", "--cached", "--name-only", "--"])?;
    Ok(!out.trim().is_empty())
}

pub(crate) fn apply_plan(plan: &mut CommitPlan, style_preset: Option<crate::cli::CommitStylePreset>) -> Result<()> {
    use crate::commit_validator::CommitMessageValidator;
    
    // Create validator based on style preset
    let validator = CommitMessageValidator::new(style_preset);
    
    // Sanitize and validate all commit messages first
    for (idx, c) in plan.commits.iter_mut().enumerate() {
        // Auto-sanitize message
        c.message = validator.auto_sanitize(&c.message);
        
        // Validate and show warnings (but don't block)
        let validation = validator.validate(&c.message);
        if !validation.warnings.is_empty() || !validation.errors.is_empty() {
            eprintln!();
            eprintln!("{} {}", 
                style(format!("Commit #{}:", idx + 1)).cyan().bold(),
                style(&c.message).white()
            );
            validator.print_validation(&c.message, &validation);
        }
    }
    
    let recent = recent_patch_ids(50)?;

    for (idx, c) in plan.commits.iter_mut().enumerate() {
        if c.files.is_empty() {
            anyhow::bail!("Commit #{} has no files; refusing to continue", idx + 1);
        }

        let mut add_args: Vec<String> = vec!["add".to_string(), "--".to_string()];
        add_args.extend(c.files.iter().cloned());
        let add_args_ref: Vec<&str> = add_args.iter().map(|s| s.as_str()).collect();
        run_git(&add_args_ref)?;

        if !has_staged_changes()? {
            eprintln!(
                "Skipping commit #{} (no staged changes for selected files)",
                idx + 1
            );
            continue;
        }

        let staged_patch = run_git(&["diff", "--cached"])?;
        if staged_patch.len() <= 200_000 {
            if let Some(pid) = patch_id_from_patch(&staged_patch)? {
                if recent.contains(&pid) {
                    run_git(&["reset"])?;
                    anyhow::bail!(
                        "Refusing to create commit #{}: staged diff matches a recent commit (duplicate patch detected)",
                        idx + 1
                    );
                }
            }
        }

        // Tạo commit message với body (description)
        if let Some(desc) = &c.description {
            let commit_body = format_commit_body(desc);
            let full_message = format!("{}\n\n{}", c.message, commit_body);
            run_git(&["commit", "-m", &full_message])?;
        } else {
            run_git(&["commit", "-m", &c.message])?;
        }

        let new_hash = run_git(&["rev-parse", "HEAD"])?;
        let new_hash = new_hash.trim().to_string();
        if !new_hash.is_empty() {
            c.hash = Some(new_hash);
        }
    }
    Ok(())
}

fn format_commit_body(desc: &CommitDescription) -> String {
    let mut body = vec![];
    
    body.push(desc.summary.clone());
    body.push(String::new());
    
    if !desc.changes.is_empty() {
        body.push("Changes:".to_string());
        for change in &desc.changes {
            body.push(format!("- {}", change));
        }
        body.push(String::new());
    }
    
    if let Some(impact) = &desc.impact {
        body.push(format!("Impact: {} - {}", impact.level.to_uppercase(), impact.explanation));
        if !impact.affected_areas.is_empty() {
            body.push(format!("Affected areas: {}", impact.affected_areas.join(", ")));
        }
        body.push(String::new());
    }
    
    if !desc.breaking_changes.is_empty() {
        body.push("BREAKING CHANGES:".to_string());
        for bc in &desc.breaking_changes {
            body.push(format!("- {}", bc));
        }
    }
    
    body.join("\n")
}

#[cfg(test)]
mod tests {
    use super::{files_from_status_porcelain, normalize_plan_files, CommitPlan, PlannedCommit};

    #[test]
    fn files_from_status_porcelain_parses_and_dedups_and_sorts() {
        let status = " M src/lib.rs\nA  README.md\nR  old.txt -> new.txt\n?? zzz.tmp\n";
        let files = files_from_status_porcelain(status);
        assert_eq!(files, vec!["README.md", "new.txt", "src/lib.rs", "zzz.tmp"]);
    }

    #[test]
    fn normalize_plan_files_expands_directories_and_generates_commands() {
        let changed_files = vec![
            "src/main.rs".to_string(),
            "src/lib.rs".to_string(),
            "docs/guide.md".to_string(),
        ];

        let mut plan = CommitPlan {
            commits: vec![PlannedCommit {
                message: "feat: add \"quoted\" message".to_string(),
                hash: None,
                files: vec!["src/".to_string(), "  ".to_string(), "docs/guide.md".to_string()],
                commands: vec![],
                description: None,
            }],
        };

        normalize_plan_files(&mut plan, &changed_files);

        assert_eq!(
            plan.commits[0].files,
            vec!["docs/guide.md", "src/lib.rs", "src/main.rs"]
        );
        assert_eq!(
            plan.commits[0].commands,
            vec![
                "git add -- docs/guide.md src/lib.rs src/main.rs".to_string(),
                "git commit -m \"feat: add \\\"quoted\\\" message\"".to_string(),
            ]
        );
    }
}
