use crate::git::{ensure_git_repo, run_git};
use crate::plan::{apply_plan, files_from_status_porcelain, normalize_plan_files, print_plan_human, CommitPlan};
use anyhow::{Context, Result};
use console::style;
use dialoguer::Confirm;
use std::path::PathBuf;

pub(crate) async fn generate_plan(
    model: &str,
    status: &str,
    diff: &str,
    log: &str,
) -> Result<CommitPlan> {
    super::flows_plan::generate_plan(model, status, diff, log).await
}

#[allow(dead_code)]
pub(crate) fn print_no_remote_guidance() {
    super::flows_error::print_no_remote_guidance();
}

fn spinner(msg: &str) -> super::flows_spinner::ProgressBar {
    super::flows_spinner::spinner(msg)
}

pub(crate) fn print_friendly_error(err: &anyhow::Error) {
    super::flows_error::print_friendly_error(err);
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

    let spinner_msg = if crate::config::get_provider() == "orca" {
        "Asking Orca Server to analyze changes and propose commit plan...".to_string()
    } else {
        format!(
            "Asking model '{}' to analyze changes and propose commit plan...",
            model
        )
    };
    let pb = spinner(&spinner_msg);
    let mut plan = generate_plan(model, &status, &diff, &log).await?;
    pb.finish_and_clear();
    eprintln!("{} {}", style("[✓]").green().bold(), style("Plan received").green());
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
    eprintln!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Commits created successfully").green()
    );
    Ok(())
}

pub(crate) async fn run_publish_current_flow(branch: Option<&str>, base: &str, pr: bool) -> Result<()> {
    super::flows_publish::run_publish_current_flow(branch, base, pr).await
}

pub(crate) async fn run_setup_flow(
    provider: Option<String>,
    api_key: Option<String>,
    name: Option<String>,
    email: Option<String>,
    local: bool,
) -> Result<()> {
    super::flows_setup::run_setup_flow(provider, api_key, name, email, local).await
}

pub(crate) async fn run_login_flow() -> Result<()> {
    super::flows_login::run_login_flow().await
}

pub(crate) async fn run_menu_flow() -> Result<()> {
    super::flows_menu::run_menu_flow().await
}

pub(crate) async fn run_plan_flow(model: &str, json_only: bool, out: Option<PathBuf>) -> Result<()> {
    super::flows_plan::run_plan_flow(model, json_only, out).await
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
    super::flows_apply::run_apply_flow(file, confirm, dry_run, push, publish, branch, base, pr).await
}

pub(crate) async fn run_doctor_flow() -> Result<()> {
    super::flows_doctor::run_doctor_flow().await
}

pub(crate) async fn run_update_flow() -> Result<()> {
    super::update::run_update_flow().await
}
