use crate::git::{patch_id_from_patch, recent_patch_ids, run_git};
use anyhow::Result;
use console::style;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct CommitPlan {
    pub(crate) commits: Vec<PlannedCommit>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct PlannedCommit {
    pub(crate) message: String,
    pub(crate) files: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub(crate) commands: Vec<String>,
}

pub(crate) fn print_plan_human(plan: &CommitPlan) {
    for (i, c) in plan.commits.iter().enumerate() {
        println!(
            "\n{} {} {}",
            style(format!("Commit #{}", i + 1)).bold().cyan(),
            style("•").dim(),
            style(format!("{} file(s)", c.files.len())).dim()
        );
        println!("  {} {}", style("Message:").bold(), style(&c.message).green());
        println!("  {}", style("Files:").bold());
        for f in &c.files {
            println!("    {} {}", style("→").cyan(), style(f).white());
        }
        println!("  {}", style("Commands:").bold());
        for cmd in &c.commands {
            println!("    {} {}", style("$").yellow(), style(cmd).yellow());
        }
    }
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
        let mut normalized: Vec<String> = Vec::new();
        for f in &c.files {
            let f = f.trim();
            if f.is_empty() {
                continue;
            }

            if f.ends_with('/') {
                let prefix = f;
                for cf in changed_files {
                    if cf.starts_with(prefix) {
                        normalized.push(cf.clone());
                    }
                }
                continue;
            }

            normalized.push(f.to_string());
        }
        normalized.sort();
        normalized.dedup();
        c.files = normalized;

        if c.commands.is_empty() {
            c.commands = vec![
                format!("git add -- {}", c.files.join(" ")),
                format!("git commit -m \"{}\"", c.message.replace('"', "\\\"")),
            ];
        }
    }
}

fn has_staged_changes() -> Result<bool> {
    let out = run_git(&["diff", "--cached", "--name-only", "--"])?;
    Ok(!out.trim().is_empty())
}

pub(crate) fn apply_plan(plan: &CommitPlan) -> Result<()> {
    let recent = recent_patch_ids(50)?;

    for (idx, c) in plan.commits.iter().enumerate() {
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

        run_git(&["commit", "-m", &c.message])?;
    }
    Ok(())
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
                files: vec!["src/".to_string(), "  ".to_string(), "docs/guide.md".to_string()],
                commands: vec![],
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
