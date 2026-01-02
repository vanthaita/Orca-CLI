use crate::gemini::generate_plan_with_gemini;
use crate::git::{
    checkout_branch, current_branch, ensure_git_repo, github_repo_slug_from_remote, has_git_remote,
    origin_url, run_git, upstream_ahead_behind, upstream_ref,
};
use crate::plan::{apply_plan, files_from_status_porcelain, normalize_plan_files, print_plan_human, CommitPlan};
use anyhow::{Context, Result};
use console::style;
use dialoguer::Confirm;
use indicatif::{ProgressBar, ProgressDrawTarget, ProgressStyle};
use std::path::PathBuf;
use std::process::Command;

pub(crate) fn print_no_remote_guidance() {
    eprintln!(
        "{}",
        style("No git remote configured, so nothing to push yet.")
            .yellow()
            .bold()
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
            "\n{}\n  git init\n  git remote add origin <url>",
            style("Hint:").cyan().bold()
        );
        return;
    }

    if msg.contains("Missing GEMINI_API_KEY") || msg.contains("GEMINI_API_KEY") && msg.contains("MISSING") {
        eprintln!("\n{}\n  export GEMINI_API_KEY=...", style("Hint:").cyan().bold());
        return;
    }

    if msg.contains("Author identity unknown") || msg.contains("unable to auto-detect email address") {
        eprintln!(
            "\n{}\n  git config --global user.name \"Your Name\"\n  git config --global user.email \"you@example.com\"\n\n{}\n  git config user.name \"Your Name\"\n  git config user.email \"you@example.com\"",
            style("Fix (global):").cyan().bold(),
            style("Fix (this repo only):").cyan().bold(),
        );
        return;
    }

    if msg.contains("no upstream branch") || msg.contains("set the remote as upstream") {
        eprintln!(
            "\n{}\n  git push -u origin <branch>",
            style("Hint:").cyan().bold()
        );
        return;
    }

    if msg.contains("No configured push destination") {
        eprintln!(
            "\n{}\n  1) Create a GitHub repo (VS Code: Source Control -> Publish to GitHub)\n  2) Or via CLI:\n     - Create repo on github.com\n     - git remote add origin <repo-url>\n     - git push -u origin <branch>",
            style("Hint:").cyan().bold()
        );
        return;
    }

    if msg.contains("could not read Username")
        || msg.contains("Authentication failed")
        || msg.contains("Repository not found")
        || msg.contains("Permission denied")
    {
        eprintln!(
            "\n{}\n  - Ensure remote URL is correct: git remote -v\n  - If using HTTPS, use a GitHub PAT (not password)\n  - If using SSH, ensure your SSH key is added to GitHub",
            style("Hint:").cyan().bold()
        );
        return;
    }

    if msg.contains("pathspec") && msg.contains("did not match any file") {
        eprintln!(
            "\n{}\n  Re-generate the plan with: orca plan --out plan.json",
            style("Hint:").cyan().bold()
        );
        return;
    }

    if msg.contains("nothing to commit") || msg.contains("no changes added to commit") {
        eprintln!(
            "\n{}\n  - Run: git status\n  - Ensure the plan files are still modified\n  - If you already committed, regenerate plan: orca plan --out plan.json",
            style("Hint:").cyan().bold()
        );
        return;
    }

    if msg.contains("Gemini API") {
        eprintln!(
            "\n{}\n  - Check GEMINI_API_KEY\n  - Try another model: --model gemini-2.5-flash\n  - If rate limited, retry later",
            style("Hint:").cyan().bold()
        );
    }
}

pub(crate) async fn run_commit_flow(confirm: bool, dry_run: bool, model: &str) -> Result<()> {
    ensure_git_repo()?;

    println!("{}", style("== orca: commit ==").bold());

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

    let pb = spinner("Asking Gemini to propose commit plan...");
    let mut plan = generate_plan_with_gemini(model, &status, &diff, &log).await?;
    pb.finish_and_clear();
    eprintln!("{}", style("Gemini plan received").green());
    normalize_plan_files(&mut plan, &changed_files);

    println!("\n{}", style("Proposed plan").bold().underlined());
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

    let pb = spinner("Applying plan (git add/commit)...");
    apply_plan(&plan)?;
    pb.finish_and_clear();
    eprintln!("{}", style("Commits created").green());
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

    println!("{}", style("== orca: publish-current ==").bold());

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

    let pb = spinner("Pushing branch (git push -u origin <branch>)...");
    run_git(&["push", "-u", "origin", &target_branch])?;
    pb.finish_and_clear();
    eprintln!("{}", style("Pushed branch to origin").green());

    if pr {
        if gh_available() {
            let pb = spinner("Creating GitHub PR via gh...");
            let status = Command::new("gh")
                .args(["pr", "create", "--fill", "--base", base, "--head", &target_branch])
                .status()
                .context("Failed to run gh pr create")?;
            pb.finish_and_clear();

            if status.success() {
                eprintln!("{}", style("Pull request created").green());
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

pub(crate) async fn run_setup_flow(name: Option<String>, email: Option<String>, local: bool) -> Result<()> {
    ensure_git_repo()?;

    println!("{}", style("== orca: setup ==").bold());

    let scope_args: [&str; 1] = ["--global"];
    let use_global = !local;

    let nothing_to_set = name.is_none() && email.is_none();

    if let Some(ref n) = name {
        if use_global {
            run_git(&["config", scope_args[0], "user.name", n.as_str()])?;
        } else {
            run_git(&["config", "user.name", n.as_str()])?;
        }
        println!("{} {}", style("Set user.name:").green(), style(n).cyan());
    }

    if let Some(ref e) = email {
        if use_global {
            run_git(&["config", scope_args[0], "user.email", e.as_str()])?;
        } else {
            run_git(&["config", "user.email", e.as_str()])?;
        }
        println!("{} {}", style("Set user.email:").green(), style(e).cyan());
    }

    if nothing_to_set {
        println!(
            "{} {}",
            style("Nothing to set.").yellow().bold(),
            style("Provide --name and/or --email.").yellow()
        );
    }

    if gh_available() {
        println!("{} {}", style("gh:").green().bold(), style("OK").green());
    } else {
        println!(
            "{} {}",
            style("gh:").yellow().bold(),
            style("MISSING (install GitHub CLI for PR creation)").yellow()
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

    println!("{}", style("== orca: plan ==").bold());

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
    let pb = spinner("Asking Gemini to propose commit plan...");
    let mut plan = generate_plan_with_gemini(model, &status, &diff, &log).await?;
    pb.finish_and_clear();
    eprintln!("{}", style("Gemini plan received").green());
    normalize_plan_files(&mut plan, &changed_files);

    let plan_json = serde_json::to_string_pretty(&plan)?;

    if !json_only {
        println!("\n{}", style("Proposed plan").bold().underlined());
        print_plan_human(&plan);
        println!("\n{}\n{}", style("JSON plan").bold().underlined(), plan_json);
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

    println!("{}", style("== orca: apply ==").bold());

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

    println!("\n{}", style("Plan to apply").bold().underlined());
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

    let pb = spinner("Applying plan (git add/commit)...");
    apply_plan(&plan)?;
    pb.finish_and_clear();
    eprintln!("{}", style("Commits created").green());

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

        let pb = spinner("Pushing branch (git push -u origin <branch>)...");
        run_git(&["push", "-u", "origin", &target_branch])?;
        pb.finish_and_clear();
        eprintln!("{}", style("Pushed branch to origin").green());

        if pr {
            if gh_available() {
                let pb = spinner("Creating GitHub PR via gh...");
                let status = Command::new("gh")
                    .args(["pr", "create", "--fill", "--base", base, "--head", &target_branch])
                    .status()
                    .context("Failed to run gh pr create")?;
                pb.finish_and_clear();

                if status.success() {
                    eprintln!("{}", style("Pull request created").green());
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

            let pb = spinner("Running git push...");
            run_git(&["push"])?;
            pb.finish_and_clear();
            eprintln!("{}", style("Pushed to remote").green());
        } else {
            println!("Skipped git push.");
        }
    }

    Ok(())
}

pub(crate) async fn run_doctor_flow() -> Result<()> {
    println!("{}", style("== orca: doctor ==").bold());
    if let Err(e) = ensure_git_repo() {
        println!(
            "{} {}",
            style("Not a git repository:").red().bold(),
            style(format!("FAIL ({e})")).red()
        );
        return Ok(());
    }
    println!("{} {}", style("git repo:").green().bold(), style("OK").green());

    match std::env::var("GEMINI_API_KEY") {
        Ok(_) => println!(
            "{} {}",
            style("GEMINI_API_KEY:").green().bold(),
            style("OK").green()
        ),
        Err(_) => println!(
            "{} {}",
            style("GEMINI_API_KEY:").yellow().bold(),
            style("MISSING (export GEMINI_API_KEY=...)").yellow()
        ),
    }

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
