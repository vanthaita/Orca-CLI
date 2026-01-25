use crate::git::{
    ahead_behind_between, checkout_branch, current_branch, ensure_git_repo, resolve_base_ref, run_git,
    upstream_ahead_behind, upstream_ref,
};
use crate::plan::{apply_plan, files_from_status_porcelain, normalize_plan_files, print_plan_human, CommitPlan};
use anyhow::{Context, Result};
use console::style;
use super::flows_spinner::spinner;
use super::{flows_error, flows_publish, flows_setup};
use std::path::PathBuf;
use std::process::Command;

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
    // Check if user has Pro/Team plan when using --publish
    if publish {
        crate::plan_guard::require_feature(crate::plan_types::FeaturePermission::AutoPublish).await?;
    }

    ensure_git_repo()?;

    flows_error::print_flow_header("[orca apply]");

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
        if !flows_error::confirm_or_abort(
            "Apply this plan? This will run git add/commit commands",
            false,
        )? {
            return Ok(());
        }
    }

    let pb = spinner("Applying plan (running git add and commit)...");
    apply_plan(&mut plan, None)?; // TODO: Pass style preset from plan metadata
    pb.finish_and_clear();
    eprintln!("{} {}", style("[✓]").green().bold(), style("Commits created successfully").green());

    let _ = crate::commit_cache::cache_latest_plan(&plan);

    if publish {
        if !flows_error::ensure_has_git_remote()? {
            return Ok(());
        }

        let current = current_branch().unwrap_or_else(|_| "<unknown>".to_string());
        if current == base {
            anyhow::bail!("Refusing to publish from base branch: {base}");
        }

        let target_branch = if let Some(b) = branch {
            b.to_string()
        } else {
            flows_publish::suggest_branch_from_plan(&plan)
        };

        // Warn if base branch is stale/diverged to reduce unexpected extra commits in PR
        let effective_base = resolve_base_ref(base);
        let local_base_exists = run_git(&["rev-parse", "--verify", base]).is_ok();
        if local_base_exists && effective_base != base {
            if let Ok((ahead, behind)) = ahead_behind_between(&effective_base, base) {
                if ahead > 0 || behind > 0 {
                    eprintln!();
                    eprintln!(
                        "{} {}",
                        style("Warning:").yellow().bold(),
                        style(format!(
                            "Local '{}' differs from '{}' (ahead {}, behind {}).",
                            base, effective_base, behind, ahead
                        ))
                        .yellow()
                    );
                    eprintln!(
                        "   {}",
                        style("Tip: update your local base branch before publishing (e.g. 'orca git sync --rebase' or 'git fetch' + 'git pull --rebase').").dim()
                    );
                }
            }
        }
        if let Ok((base_only, _head_only)) = ahead_behind_between(&effective_base, "HEAD") {
            if base_only > 0 {
                eprintln!();
                eprintln!(
                    "{} {}",
                    style("Warning:").yellow().bold(),
                    style(format!(
                        "Your branch is behind '{}' by {} commit(s) (base has commits not in HEAD).",
                        effective_base, base_only
                    ))
                    .yellow()
                );
                eprintln!(
                    "   {}",
                    style("Tip: rebase/merge the base branch into your branch before creating PR if you want a clean history.").dim()
                );
            }
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
                    eprintln!(
                        "{} {}",
                        style("[✓]").green().bold(),
                        style("Pull request created").green()
                    );
                } else {
                    eprintln!(
                        "{} {}",
                        style("Warning:").yellow().bold(),
                        style("gh pr create failed; printing PR URL instead").yellow()
                    );
                    flows_publish::print_github_pr_url(&target_branch, base)?;
                }
            } else {
                flows_publish::print_github_pr_url(&target_branch, base)?;
            }
        }

        return Ok(());
    }

    if push {
        if prompt_enter_to_push()? {
            if !flows_error::ensure_has_git_remote()? {
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
