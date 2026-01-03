use crate::git::{
    checkout_branch, current_branch, ensure_git_repo, github_repo_slug_from_remote, has_git_remote,
    origin_url, run_git, upstream_ahead_behind, upstream_ref,
};
use crate::plan::{apply_plan, files_from_status_porcelain, normalize_plan_files, print_plan_human, CommitPlan, PlannedCommit};
use anyhow::{Context, Result};
use console::style;
use dialoguer::Confirm;
use indicatif::{ProgressBar, ProgressDrawTarget, ProgressStyle};
use std::path::PathBuf;
use std::process::Command;

pub(crate) async fn generate_plan(
    model: &str,
    status: &str,
    diff: &str,
    log: &str,
) -> Result<CommitPlan> {
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
"
    )
}

pub(crate) fn print_no_remote_guidance() {
    // ... function content (unchanged, just ensuring context match)
    eprintln!(
        "\n{} {}",
        style("[!]").yellow().bold(),
        style("No git remote configured, so nothing to push yet.")
            .yellow()
    );
     eprintln!(
        "\n{}\n  - VS Code: Source Control -> Publish to GitHub (recommended)\n\n{}\n  1) Create a new repository on https://github.com/new\n  2) Add remote:\n     git remote add origin <repo-url>\n  3) Push first time:\n     git push -u origin <branch>",
        style("Option A (VS Code):").cyan().bold(),
        style("Option B (Git CLI):").cyan().bold(),
    );
}

fn spinner(msg: &str) -> ProgressBar {
    let pb = ProgressBar::new_spinner();
    pb.set_draw_target(ProgressDrawTarget::stderr());
    pb.set_style(
        ProgressStyle::with_template("{spinner} {msg}")
            .unwrap()
            .tick_chars("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"),
    );
    pb.enable_steady_tick(std::time::Duration::from_millis(120));
    pb.set_message(msg.to_string());
    pb
}

pub(crate) fn print_friendly_error(err: &anyhow::Error) {
    let msg = err.to_string();
    eprintln!("{} {}", style("Error:").red().bold(), style(&msg).red());

    let mut chain = err.chain();
    let _ = chain.next();
    let mut idx = 1;
    for cause in chain {
        eprintln!(
            "{} {}",
            style(format!("Cause #{idx}:"))
                .yellow()
                .bold(),
            style(cause.to_string()).yellow()
        );
        idx += 1;
    }

    if msg.contains("Not a git repository") {
        eprintln!(
            "\n{} {}\n  git init\n  git remote add origin <url>",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("GEMINI_API_KEY") {
        eprintln!(
            "\n{} {}\n  Option 1: orca setup --api-key YOUR_KEY\n  Option 2: export GEMINI_API_KEY=YOUR_KEY",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("Author identity unknown") || msg.contains("unable to auto-detect email address") {
        eprintln!(
            "\n{} {}\n  git config --global user.name \"Your Name\"\n  git config --global user.email \"you@example.com\"\n\n{} {}\n  git config user.name \"Your Name\"\n  git config user.email \"you@example.com\"",
            style("[i]").cyan().bold(),
            style("Fix (global):").cyan(),
            style("[i]").cyan().bold(),
            style("Fix (this repo only):").cyan(),
        );
        return;
    }

    if msg.contains("no upstream branch") || msg.contains("set the remote as upstream") {
        eprintln!(
            "\n{} {}\n  git push -u origin <branch>",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("No configured push destination") {
        eprintln!(
            "\n{} {}\n  1) Create a GitHub repo (VS Code: Source Control -> Publish to GitHub)\n  2) Or via CLI:\n     - Create repo on github.com\n     - git remote add origin <repo-url>\n     - git push -u origin <branch>",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("could not read Username")
        || msg.contains("Authentication failed")
        || msg.contains("Repository not found")
        || msg.contains("Permission denied")
    {
        eprintln!(
            "\n{} {}\n  - Ensure remote URL is correct: git remote -v\n  - If using HTTPS, use a GitHub PAT (not password)\n  - If using SSH, ensure your SSH key is added to GitHub",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("pathspec") && msg.contains("did not match any file") {
        eprintln!(
            "\n{} {}\n  Re-generate the plan with: orca plan --out plan.json",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("nothing to commit") || msg.contains("no changes added to commit") {
        eprintln!(
            "\n{} {}\n  - Run: git status\n  - Ensure the plan files are still modified\n  - If you already committed, regenerate plan: orca plan --out plan.json",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("Gemini API") {
        eprintln!(
            "\n{} {}\n  - Check GEMINI_API_KEY\n  - Try another model: --model gemini-2.5-flash\n  - If rate limited, retry later",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
    }
}

pub(crate) async fn run_commit_flow(confirm: bool, dry_run: bool, model: &str) -> Result<()> {
    ensure_git_repo()?;

    println!("{}", style("[orca commit]").bold().cyan());

    let status = run_git(&["status", "--porcelain"])?;
    let diff = run_git(&["diff"])?;
    let log = match run_git(&["log", "-n", "20", "--pretty=oneline"]) {
        Ok(v) => v,
        Err(e) => {
            eprintln!(
                "{} {}",
                style("Warning:").yellow().bold(),
                style(format!("unable to read git log (continuing without it): {e}")).yellow()
            );
            String::new()
        }
    };

    if status.trim().is_empty() {
        println!("No changes detected (git status is clean). Nothing to commit.");
        return Ok(());
    }

    let changed_files = files_from_status_porcelain(&status);

    let pb = spinner("Asking Gemini to analyze changes and propose commit plan...");
    let mut plan = generate_plan(model, &status, &diff, &log).await?;
    pb.finish_and_clear();
    eprintln!("{} {}", style("[✓]").green().bold(), style("Plan received from Gemini").green());
    normalize_plan_files(&mut plan, &changed_files);

    println!("\n{}", style("Proposed Plan:").bold().cyan());
    print_plan_human(&plan);

    if dry_run {
        return Ok(());
    }

    if confirm {
        let ok = Confirm::new()
            .with_prompt("Apply this plan? This will run git add/commit commands")
            .default(false)
            .interact()
            .context("Failed to read confirmation")?;
        if !ok {
            println!("Aborted.");
            return Ok(());
        }
    }

    let pb = spinner("Applying plan (running git add and commit)...");
    apply_plan(&plan)?;
    pb.finish_and_clear();
    eprintln!("{} {}", style("[✓]").green().bold(), style("Commits created successfully").green());
    Ok(())
}

fn suggest_branch_from_message(msg: &str) -> String {
    let msg = msg.trim();
    let (typ, rest) = msg.split_once(':').unwrap_or(("feat", msg));
    let typ = typ.trim();
    let mut slug = rest.trim().to_lowercase();
    slug = slug
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c
            } else if c.is_whitespace() || c == '-' || c == '_' {
                '-'
            } else {
                '-'
            }
        })
        .collect::<String>();
    while slug.contains("--") {
        slug = slug.replace("--", "-");
    }
    slug = slug.trim_matches('-').to_string();
    if slug.is_empty() {
        slug = "work".to_string();
    }

    format!("{typ}/{slug}")
}

pub(crate) async fn run_publish_current_flow(
    branch: Option<&str>,
    base: &str,
    pr: bool,
) -> Result<()> {
    ensure_git_repo()?;

    println!("{}", style("[orca publish-current]").bold().cyan());

    if !has_git_remote()? {
        print_no_remote_guidance();
        return Ok(());
    }

    let head_msg = run_git(&["log", "-1", "--pretty=%s"])?;
    let head_msg = head_msg.trim();

    let target_branch = if let Some(b) = branch {
        b.to_string()
    } else {
        suggest_branch_from_message(head_msg)
    };

    if target_branch == base {
        anyhow::bail!("Refusing to publish to base branch: {base}");
    }

    let pb = spinner("Switching to publish branch...");
    checkout_branch(&target_branch, true)?;
    pb.finish_and_clear();

    let pb = spinner(&format!("Pushing branch '{}' to origin...", target_branch));
    run_git(&["push", "-u", "origin", &target_branch])?;
    pb.finish_and_clear();
    eprintln!("{} {}", style("[✓]").green().bold(), style("Branch pushed to origin").green());

    if pr {
        if gh_available() {
            let pb = spinner("Creating GitHub PR via gh...");
            let status = Command::new("gh")
                .args(["pr", "create", "--fill", "--base", base, "--head", &target_branch])
                .status()
                .context("Failed to run gh pr create")?;
            pb.finish_and_clear();

            if status.success() {
                eprintln!("{} {}", style("[✓]").green().bold(), style("Pull request created").green());
            } else {
                eprintln!(
                    "{} {}",
                    style("Warning:").yellow().bold(),
                    style("gh pr create failed; printing PR URL instead").yellow()
                );
                print_github_pr_url(&target_branch, base)?;
            }
        } else {
            print_github_pr_url(&target_branch, base)?;
        }
    }

    Ok(())
}

pub(crate) async fn run_setup_flow(
    provider: Option<String>,
    api_key: Option<String>,
    name: Option<String>,
    email: Option<String>,
    local: bool,
) -> Result<()> {
    ensure_git_repo()?;

    println!("{}\n", style("[orca setup]").bold().cyan());

    let scope_args: [&str; 1] = ["--global"];
    let use_global = !local;

    // Load existing config or default
    let mut config = crate::config::load_config().unwrap_or_default();
    let mut config_changed = false;

    // 1. Handle Provider Switch
    if let Some(p) = provider {
        let p_lower = p.to_lowercase();
        // Validate provider
        match p_lower.as_str() {
            "gemini" | "openai" | "zai" | "deepseek" => {
                config.api.provider = p_lower.clone();
                config_changed = true;
                println!(
                    "  {} Set active provider to: {}",
                    style("[✓]").green().bold(),
                    style(&p_lower).cyan()
                );
            }
            _ => {
                anyhow::bail!("Unknown provider '{}'. Supported: gemini, openai, zai, deepseek", p);
            }
        }
    }

    // 2. Handle API Key
    if let Some(ref key) = api_key {
        // Determine which provider to set key for.
        // If --provider was passed, use that. Otherwise use the active provider.
        let target_provider = config.api.provider.clone();

        match target_provider.as_str() {
            "openai" | "rest" => config.api.openai_api_key = Some(key.clone()),
            "zai" => config.api.zai_api_key = Some(key.clone()),
            "deepseek" => config.api.deepseek_api_key = Some(key.clone()),
            "gemini" | _ => config.api.gemini_api_key = Some(key.clone()),
        }
        config_changed = true;

        println!(
            "  {} API key for '{}' saved to config file",
            style("[✓]").green().bold(),
            style(&target_provider).cyan()
        );
    }

    if config_changed {
        crate::config::save_config(&config)?;
    }

    // Handle git configuration
    if let Some(ref n) = name {
        if use_global {
            run_git(&["config", scope_args[0], "user.name", n.as_str()])?;
        } else {
            run_git(&["config", "user.name", n.as_str()])?;
        }
        println!(
            "  {} Set user.name: {}",
            style("[✓]").green().bold(),
            style(n).cyan()
        );
    }

    if let Some(ref e) = email {
        if use_global {
            run_git(&["config", scope_args[0], "user.email", e.as_str()])?;
        } else {
            run_git(&["config", "user.email", e.as_str()])?;
        }
        println!(
            "  {} Set user.email: {}",
            style("[✓]").green().bold(),
            style(e).cyan()
        );
    }

    // Show config file location if we touched config
    if config_changed {
        if let Ok(config_path) = crate::config::config_file_path() {
            println!(
                "\n{} {}",
                style("Configuration saved to:").dim(),
                style(config_path.display()).cyan()
            );
        }
    }

    // Check GitHub CLI
    println!();
    if gh_available() {
        println!(
            "  {} {}",
            style("[✓]").green().bold(),
            style("GitHub CLI (gh) is installed").green()
        );
    } else {
        println!(
            "  {} {}",
            style("[!]").yellow().bold(),
            style("GitHub CLI (gh) not found - install for PR creation").yellow()
        );
    }

    Ok(())
}

fn gh_available() -> bool {
    Command::new("gh")
        .arg("--version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn suggest_branch_from_plan(plan: &CommitPlan) -> String {
    let msg = plan
        .commits
        .first()
        .map(|c| c.message.as_str())
        .unwrap_or("work");

    let (typ, rest) = msg.split_once(':').unwrap_or(("feat", msg));
    let typ = typ.trim();
    let mut slug = rest.trim().to_lowercase();
    slug = slug
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c
            } else if c.is_whitespace() || c == '-' || c == '_' {
                '-'
            } else {
                '-'
            }
        })
        .collect::<String>();
    while slug.contains("--") {
        slug = slug.replace("--", "-");
    }
    slug = slug.trim_matches('-').to_string();
    if slug.is_empty() {
        slug = "work".to_string();
    }

    format!("{typ}/{slug}")
}

fn print_github_pr_url(branch: &str, base: &str) -> Result<()> {
    let Some(url) = origin_url()? else {
        eprintln!(
            "{} {}",
            style("Hint:").cyan().bold(),
            style("Install GitHub CLI (gh) to auto-create PR: https://cli.github.com/").cyan()
        );
        return Ok(());
    };
    let Some(slug) = github_repo_slug_from_remote(&url) else {
        eprintln!(
            "{} {}",
            style("Hint:").cyan().bold(),
            style("Unable to parse GitHub remote; create PR manually in browser").cyan()
        );
        return Ok(());
    };

    let pr_url = format!("https://github.com/{slug}/compare/{base}...{branch}?expand=1");
    println!("{} {pr_url}", style("Create PR:").cyan().bold());
    Ok(())
}

pub(crate) async fn run_plan_flow(model: &str, json_only: bool, out: Option<PathBuf>) -> Result<()> {
    ensure_git_repo()?;

    println!("{}", style("[orca plan]").bold().cyan());

    let status = run_git(&["status", "--porcelain"])?;
    let diff = run_git(&["diff"])?;
    let log = match run_git(&["log", "-n", "20", "--pretty=oneline"]) {
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
    let pb = spinner("Asking Gemini to analyze changes and propose commit plan...");
    let mut plan = generate_plan(model, &status, &diff, &log).await?;
    pb.finish_and_clear();
    eprintln!("{} {}", style("[✓]").green().bold(), style("Plan received from Gemini").green());
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

pub(crate) async fn run_apply_flow(
    file: &PathBuf,
    confirm: bool,
    dry_run: bool,
    push: bool,
    publish: bool,
    branch: Option<&str>,
    base: &str,
    pr: bool,
) -> Result<()> {
    ensure_git_repo()?;

    println!("{}", style("[orca apply]").bold().cyan());

    let raw = std::fs::read_to_string(file).with_context(|| {
        format!(
            "Failed to read plan file {}. Hint: run `orca plan --out plan.json` first",
            file.display()
        )
    })?;
    let mut plan: CommitPlan = serde_json::from_str(&raw)
        .with_context(|| format!("Failed to parse plan JSON from {}", file.display()))?;

    let status = run_git(&["status", "--porcelain"])?;
    let changed_files = files_from_status_porcelain(&status);
    normalize_plan_files(&mut plan, &changed_files);

    println!("\n{}", style("Plan to Apply:").bold().cyan());
    print_plan_human(&plan);

    if dry_run {
        return Ok(());
    }

    if confirm {
        let ok = Confirm::new()
            .with_prompt("Apply this plan? This will run git add/commit commands")
            .default(false)
            .interact()
            .context("Failed to read confirmation")?;
        if !ok {
            println!("Aborted.");
            return Ok(());
        }
    }

    let pb = spinner("Applying plan (running git add and commit)...");
    apply_plan(&plan)?;
    pb.finish_and_clear();
    eprintln!("{} {}", style("[✓]").green().bold(), style("Commits created successfully").green());

    if publish {
        if !has_git_remote()? {
            print_no_remote_guidance();
            return Ok(());
        }

        let current = current_branch().unwrap_or_else(|_| "<unknown>".to_string());
        if current == base {
            anyhow::bail!("Refusing to publish from base branch: {base}");
        }

        let target_branch = if let Some(b) = branch {
            b.to_string()
        } else {
            suggest_branch_from_plan(&plan)
        };

        let pb = spinner("Switching to publish branch...");
        checkout_branch(&target_branch, true)?;
        pb.finish_and_clear();

        let pb = spinner(&format!("Pushing branch '{}' to origin...", target_branch));
        run_git(&["push", "-u", "origin", &target_branch])?;
        pb.finish_and_clear();
        eprintln!("{} {}", style("[✓]").green().bold(), style("Branch pushed to origin").green());

        if pr {
            if gh_available() {
                let pb = spinner("Creating GitHub PR via gh...");
                let status = Command::new("gh")
                    .args(["pr", "create", "--fill", "--base", base, "--head", &target_branch])
                    .status()
                    .context("Failed to run gh pr create")?;
                pb.finish_and_clear();

                if status.success() {
                    eprintln!("{} {}", style("[✓]").green().bold(), style("Pull request created").green());
                } else {
                    eprintln!(
                        "{} {}",
                        style("Warning:").yellow().bold(),
                        style("gh pr create failed; printing PR URL instead").yellow()
                    );
                    print_github_pr_url(&target_branch, base)?;
                }
            } else {
                print_github_pr_url(&target_branch, base)?;
            }
        }

        return Ok(());
    }

    if push {
        if prompt_enter_to_push()? {
            if !has_git_remote()? {
                print_no_remote_guidance();
                return Ok(());
            }

            let branch = current_branch().unwrap_or_else(|_| "<unknown>".to_string());
            let upstream = upstream_ref()?;
            if upstream.is_none() {
                eprintln!(
                    "{} {}\n  {}\n  {}",
                    style("No upstream branch set for").yellow().bold(),
                    style(&branch).yellow().bold(),
                    style("Set upstream once:").cyan().bold(),
                    style(format!("git push -u origin {branch}")).cyan()
                );
                return Ok(());
            }

            if let Some((ahead, behind)) = upstream_ahead_behind()? {
                if behind > 0 {
                    anyhow::bail!(
                        "Your branch is behind upstream (behind={behind}, ahead={ahead}). Pull/rebase first to avoid duplicate or divergent history."
                    );
                }
                if ahead == 0 {
                    println!(
                        "{} (branch is up-to-date; nothing to push)",
                        style("Skipping git push").green().bold()
                    );
                    return Ok(());
                }
            }

            let pb = spinner("Pushing to remote...");
            run_git(&["push"])?;
            pb.finish_and_clear();
            eprintln!("{} {}", style("[✓]").green().bold(), style("Pushed to remote").green());
        } else {
            println!("Skipped git push.");
        }
    }

    Ok(())
}

pub(crate) async fn run_doctor_flow() -> Result<()> {
    println!("{}", style("[orca doctor]").bold().cyan());
    
    // Check Config / Provider
    let config = crate::config::load_config().unwrap_or_default();
    let provider = config.api.provider.clone();
    println!(
        "{} Active Provider: {}",
        style("[*]").blue().bold(),
        style(&provider).cyan()
    );

    // Check API Key for active provider
    if let Ok(key) = crate::config::get_api_key(&provider) {
         if !key.trim().is_empty() {
            println!(
                "{} {} API Key set",
                style("[✓]").green().bold(),
                provider
            );
         } else {
             println!(
                "{} {} API Key is empty",
                style("[!]").yellow().bold(),
                provider
            );
         }
    } else {
        println!(
            "{} {} API Key missing",
            style("[!]").yellow().bold(),
            provider
        );
    }


    if let Err(e) = ensure_git_repo() {
        println!(
            "{} {}",
            style("Not a git repository:").red().bold(),
            style(format!("FAIL ({e})")).red()
        );
        return Ok(());
    }
    println!("{} {}", style("[✓]").green().bold(), style("Git repository detected").green());

    let status = run_git(&["status", "--porcelain"])?;
    if status.trim().is_empty() {
        println!(
            "{} {}",
            style("working tree:").green().bold(),
            style("clean").green()
        );
    } else {
        println!(
            "{} {}",
            style("working tree:").yellow().bold(),
            style("has changes").yellow()
        );
        println!(
            "{} {}",
            style("changed files:").yellow().bold(),
            style(files_from_status_porcelain(&status).len()).yellow()
        );
    }

    Ok(())
}

fn prompt_enter_to_push() -> Result<bool> {
    use std::io::{self, Write};

    print!(
        "{} ",
        style("Press Enter to run 'git push', or type anything else to skip:")
            .bold()
            .cyan()
    );
    io::stdout().flush().ok();

    let mut line = String::new();
    io::stdin()
        .read_line(&mut line)
        .context("Failed to read input")?;
    Ok(line.trim().is_empty())
}

#[cfg(test)]
mod tests {
    use super::suggest_branch_from_message;

    #[test]
    fn suggest_branch_from_message_parses_type_and_slugs() {
        assert_eq!(
            suggest_branch_from_message("feat: Add new API"),
            "feat/add-new-api"
        );
        assert_eq!(
            suggest_branch_from_message("fix:   handle   spaces  "),
            "fix/handle-spaces"
        );
        assert_eq!(
            suggest_branch_from_message("chore: bump deps (#123)"),
            "chore/bump-deps-123"
        );
    }

    #[test]
    fn suggest_branch_from_message_defaults_to_feat_and_non_empty_slug() {
        assert_eq!(suggest_branch_from_message("Add things"), "feat/add-things");
        assert_eq!(suggest_branch_from_message("   !!!   "), "feat/work");
    }
}
