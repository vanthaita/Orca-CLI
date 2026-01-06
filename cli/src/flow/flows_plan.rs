use crate::plan::{
    files_from_status_porcelain, normalize_plan_files, print_plan_human, CommitPlan, PlannedCommit,
};
use anyhow::{Context, Result};
use console::style;
use super::flows_spinner::spinner;
use std::path::PathBuf;

pub(crate) async fn generate_plan(model: &str, status: &str, diff: &str, log: &str) -> Result<CommitPlan> {
    let provider = crate::ai::create_provider().await?;
    let prompt = build_prompt(status, diff, log);

    // Default system prompt. You can customize this or make it configurable.
    let system_prompt = "You are a senior software engineer. Your task is to propose a commit plan.";

    let resp_text = provider.generate_content(model, system_prompt, &prompt).await?;
    let json_text = extract_json(&resp_text).unwrap_or_else(|| resp_text.clone());

    if let Ok(plan) = serde_json::from_str::<CommitPlan>(&json_text) {
        return Ok(plan);
    }

    if let Ok(commits) = serde_json::from_str::<Vec<PlannedCommit>>(&json_text) {
        return Ok(CommitPlan { commits });
    }

    anyhow::bail!(
        "Failed to parse provider response as JSON. Raw response: {}",
        resp_text
    );
}

fn extract_json(input: &str) -> Option<String> {
    let mut s = input.trim();

    if s.starts_with("```") {
        if let Some(idx) = s.find('\n') {
            s = &s[idx + 1..];
        } else {
            return None;
        }

        if let Some(end) = s.rfind("```") {
            s = &s[..end];
        }
        s = s.trim();
    }

    let start_obj = s.find('{');
    let start_arr = s.find('[');
    let start = match (start_obj, start_arr) {
        (Some(o), Some(a)) => Some(o.min(a)),
        (Some(o), None) => Some(o),
        (None, Some(a)) => Some(a),
        (None, None) => None,
    }?;

    let end_obj = s.rfind('}');
    let end_arr = s.rfind(']');
    let end = match (end_obj, end_arr) {
        (Some(o), Some(a)) => Some(o.max(a)),
        (Some(o), None) => Some(o),
        (None, Some(a)) => Some(a),
        (None, None) => None,
    }?;

    if end <= start {
        return None;
    }

    Some(s[start..=end].trim().to_string())
}

fn build_prompt(status: &str, diff: &str, log: &str) -> String {
    format!(
        "Task: Propose a commit plan for the current git working tree.
    Rules:
    - Output ONLY valid JSON. No markdown. No commentary.
    - JSON schema: {{\"commits\":[{{\"message\":string,\"files\":[string],\"commands\":[string]}}]}}
    - Group files into logical commits by feature/responsibility.
    - Commit messages should be concise, imperative, and conventional (e.g. feat:, fix:, refactor:, chore:).
    - Each file path must exist in git status output.
    - For each commit, commands must contain EXACTLY 2 commands in this order:
      1) git add -- <files...>
      2) git commit -m \"<message>\"

    Context:
    GIT_STATUS_PORCELAIN:
{status}

    GIT_DIFF:
{diff}

    RECENT_GIT_LOG (for style):
{log}
",
    )
}

pub(crate) async fn run_plan_flow(model: &str, json_only: bool, out: Option<PathBuf>) -> Result<()> {
    crate::git::ensure_git_repo()?;

    println!("{}", style("[orca plan]").bold().cyan());

    let status = crate::git::run_git(&["status", "--porcelain"])?;
    let diff = crate::git::run_git(&["diff"])?;
    let log = match crate::git::run_git(&["log", "-n", "20", "--pretty=oneline"]) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Warning: unable to read git log (continuing without it): {e}");
            String::new()
        }
    };

    if status.trim().is_empty() {
        println!("No changes detected (git status is clean). Nothing to plan.");
        return Ok(());
    }

    let changed_files = files_from_status_porcelain(&status);
    let spinner_msg = format!(
        "Asking model '{}' to analyze changes and propose commit plan...",
        model
    );
    let pb = spinner(&spinner_msg);
    
    // Truncate diff if it's extremely large (safety limit ~20MB)
    // Server now supports up to 50MB
    let max_diff_len = 20_000_000;
    let effective_diff = if diff.len() > max_diff_len {
        let truncated = diff.chars().take(max_diff_len).collect::<String>();
        format!("{}\n\n... (Diff truncated due to extreme size > 20MB)", truncated)
    } else {
        diff.to_string()
    };
    
    let mut plan = generate_plan(model, &status, &effective_diff, &log).await?;
    pb.finish_and_clear();
    
    if diff.len() > max_diff_len {
        eprintln!(
            "{} {}",
            style("[!]").yellow().bold(),
            style("Diff was truncated because it exceeded 20MB. This is extremely large!").yellow()
        );
    }
    
    eprintln!("{} {}", style("[✓]").green().bold(), style("Plan received").green());
    normalize_plan_files(&mut plan, &changed_files);

    let plan_json = serde_json::to_string_pretty(&plan)?;

    if !json_only {
        println!("\n{}", style("Proposed Plan:").bold().cyan());
        print_plan_human(&plan);
        println!("\n{}\n{}", style("JSON Output:").bold().cyan(), plan_json);
    } else {
        println!("{}", plan_json);
    }

    if let Some(path) = out {
        std::fs::write(&path, plan_json)
            .with_context(|| format!("Failed to write plan to {}", path.display()))?;
        println!(
            "{} {}",
            style("Saved plan to:").green(),
            style(path.display()).cyan()
        );
    }

    Ok(())
}
