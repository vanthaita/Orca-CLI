use crate::plan::{
    files_from_status_porcelain, normalize_plan_files, print_plan_human, CommitPlan, PlannedCommit,
};
use anyhow::{Context, Result};
use console::style;
use super::flows_spinner::spinner;
use std::path::PathBuf;

pub(crate) async fn generate_plan(model: &str, status: &str, diff: &str, log: &str, commit_style: Option<String>) -> Result<CommitPlan> {
    let provider = crate::ai::create_provider().await?;

    let config = crate::config::load_config()?;
    let resolved_style = commit_style.or(config.git.commit_style);
    let language = config.git.language;

    let prompt = build_prompt(status, diff, log, resolved_style.as_deref(), language.as_deref());

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

fn build_prompt(status: &str, diff: &str, log: &str, style: Option<&str>, language: Option<&str>) -> String {
    let style_instruction = if let Some(s) = style {
        format!("- Commit Message Style: {}\n", s)
    } else {
        String::new()
    };

    let lang_instruction = language.unwrap_or("Vietnamese or English based on the changes");

    format!(
        r#"Task: Propose a detailed commit plan for the current git working tree.
    Rules:
    - Output ONLY valid JSON. No markdown. No commentary.
    - JSON schema: {{"commits":[{{"message":string,"files":[string],"commands":[string],"description":{{"summary":string,"changes":[string],"impact":{{"level":string,"explanation":string,"affected_areas":[string]}},"breaking_changes":[string]}}}}]}}
    - Group files into logical commits by feature/responsibility.
    - Commit messages should be concise, imperative, and conventional (e.g. feat:, fix:, refactor:, chore:).
    {style_instruction}    - For each commit, provide a detailed description:
      * summary: 2-3 sentences describing what changed and why (in {lang_instruction})
      * changes: Bullet point list of the main changes
      * impact: Assessment of impact level (low/medium/high) with explanation
      * breaking_changes: List of breaking changes if any (empty array if none)
    - Each file path must exist in git status output.
    - For each commit, commands must contain EXACTLY 2 commands in this order:
      1) git add -- <files...>
      2) git commit -m "<message>"

    Context:
    GIT_STATUS_PORCELAIN:
{status}

    GIT_DIFF:
{diff}

    RECENT_GIT_LOG (for style):
{log}
"#,
    )
}

pub(crate) async fn run_plan_flow(
    model: &str, 
    json_only: bool, 
    out: Option<PathBuf>, 
    commit_style: Option<String>,
    use_cache: bool,
    regenerate: bool,
) -> Result<()> {
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
    
    // Try to load from cache if requested and not regenerating
    let mut plan = if use_cache && !regenerate {
        if let Ok(Some(cached_plan)) = crate::commit_cache::load_cached_plan(&diff) {
            eprintln!(
                "{} {}",
                style("[✓]").green().bold(),
                style("Loaded plan from cache").green()
            );
            cached_plan
        } else {
            generate_and_cache_plan(model, &status, &diff, &log, commit_style).await?
        }
    } else {
        generate_and_cache_plan(model, &status, &diff, &log, commit_style).await?
    };
    
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

async fn generate_and_cache_plan(
    model: &str,
    status: &str,
    diff: &str,
    log: &str,
    commit_style: Option<String>,
) -> Result<CommitPlan> {
    let spinner_msg = if crate::config::get_provider() == "orca" {
        "Asking Orca Server to analyze changes and propose commit plan...".to_string()
    } else {
        format!(
            "Asking model '{}' to analyze changes and propose commit plan...",
            model
        )
    };
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
    
    let plan = generate_plan(model, status, &effective_diff, log, commit_style).await?;
    pb.finish_and_clear();
    
    if diff.len() > max_diff_len {
        eprintln!(
            "{} {}",
            style("[!]").yellow().bold(),
            style("Diff was truncated because it exceeded 20MB. This is extremely large!").yellow()
        );
    }
    
    eprintln!("{} {}", style("[✓]").green().bold(), style("Plan received").green());
    
    // Cache the plan
    if let Err(e) = crate::commit_cache::cache_plan(&plan, diff) {
        eprintln!(
            "{} {}",
            style("Warning:").yellow(),
            style(format!("Failed to cache plan: {}", e)).yellow()
        );
    }
    
    Ok(plan)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_prompt_with_language() {
        let prompt = build_prompt("status", "diff", "log", None, Some("French"));
        assert!(prompt.contains("in French"));
    }

    #[test]
    fn test_build_prompt_without_language() {
        let prompt = build_prompt("status", "diff", "log", None, None);
        assert!(prompt.contains("in Vietnamese or English based on the changes"));
    }
}
