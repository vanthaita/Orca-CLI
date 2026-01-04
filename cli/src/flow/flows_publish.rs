use crate::git::{
    checkout_branch, ensure_git_repo, github_repo_slug_from_remote, has_git_remote, origin_url,
    run_git,
};
use anyhow::{Context, Result};
use console::style;
use super::flows_spinner::spinner;
use super::{flows_error, flows_setup};
use std::process::Command;

fn suggest_branch_from_message_impl(msg: &str) -> String {
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

pub(crate) fn suggest_branch_from_message(msg: &str) -> String {
    suggest_branch_from_message_impl(msg)
}

pub(crate) fn suggest_branch_from_plan(plan: &crate::plan::CommitPlan) -> String {
    let msg = plan
        .commits
        .first()
        .map(|c| c.message.as_str())
        .unwrap_or("work");

    suggest_branch_from_message_impl(msg)
}

pub(crate) fn print_github_pr_url(branch: &str, base: &str) -> Result<()> {
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

pub(crate) async fn run_publish_current_flow(branch: Option<&str>, base: &str, pr: bool) -> Result<()> {
    ensure_git_repo()?;

    println!("{}", style("[orca publish-current]").bold().cyan());

    if !has_git_remote()? {
        flows_error::print_no_remote_guidance();
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
        if flows_setup::gh_available() {
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
