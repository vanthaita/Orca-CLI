use crate::git::{
    checkout_branch, ensure_git_repo, github_repo_slug_from_remote, origin_url,
    run_git,
};
use anyhow::{Context, Result};
use console::style;
use super::flows_spinner::spinner;
use super::{flows_error, flows_setup, pr_template, pr_workflow};
use std::process::Command;
use std::fs;

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

pub(crate) async fn run_publish_current_flow(
    branch: Option<&str>,
    base: &str,
    pr: bool,
    mode: Option<&str>,
) -> Result<()> {
    // Check if user has Pro/Team plan for auto-publish feature
    crate::plan_guard::require_feature(crate::plan_types::FeaturePermission::AutoPublish).await?;

    ensure_git_repo()?;

    flows_error::print_flow_header("[orca publish-current]");

    if !flows_error::ensure_has_git_remote()? {
        return Ok(());
    }

    // Get commits to publish
    let commits = pr_template::get_commits_since_base(base)?;

    // If no new commits, check if we just want to create PR for current branch
    if commits.is_empty() {
        // Check if current branch is different from base
        let current = crate::git::current_branch()?;
        if current == base {
            eprintln!(
                "{} {}",
                style("[ℹ]").blue().bold(),
                style(format!("Already on base branch '{}'. No PR needed.", base)).blue()
            );
            return Ok(());
        }
        
        // Branch exists but no new commits - still allow PR creation
        eprintln!(
            "{} {}",
            style("[ℹ]").yellow().bold(),
            style("No new commits since base, but will create PR for current branch state").yellow()
        );
        
        // If PR flag is false, just push and exit
        if !pr {
            eprintln!(
                "{} {}",
                style("[ℹ]").blue().bold(),
                style("Use with --pr to create pull request").blue()
            );
            return Ok(());
        }
        
        // Create PR for current branch even without new commits
        let current_branch = crate::git::current_branch()?;
        create_single_pr(&current_branch, base, &[current_branch.clone()]).await?;
        return Ok(());
    }

    // Determine workflow mode
    let workflow_mode = if let Some(mode_str) = mode {
        pr_workflow::PrWorkflowMode::from_str(mode_str)
            .ok_or_else(|| anyhow::anyhow!("Invalid mode: {}. Use 'single' or 'stack'", mode_str))?
    } else {
        // Load config to check for default mode
        let config = crate::config::load_config()?;
        if let Some(default_mode) = &config.pr_workflow.default_mode {
            pr_workflow::PrWorkflowMode::from_str(default_mode)
                .unwrap_or_else(|| pr_workflow::prompt_workflow_mode(commits.len()).unwrap())
        } else {
            // Interactive prompt
            pr_workflow::prompt_workflow_mode(commits.len())?
        }
    };

    // Execute workflow based on mode
    match workflow_mode {
        pr_workflow::PrWorkflowMode::Single => {
            run_single_pr_workflow(branch, base, pr, &commits).await
        }
        pr_workflow::PrWorkflowMode::Stack => {
            run_stack_pr_workflow(base, pr, &commits).await
        }
    }
}

/// Run single PR workflow (all commits in one PR)
async fn run_single_pr_workflow(
    branch: Option<&str>,
    base: &str,
    pr: bool,
    commits: &[String],
) -> Result<()> {
    let head_msg = commits.first().map(|s| s.as_str()).unwrap_or("work");

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
    eprintln!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Branch pushed to origin").green()
    );

    if pr {
        create_single_pr(&target_branch, base, commits).await?;
    }

    Ok(())
}

/// Create a single PR
async fn create_single_pr(branch: &str, base: &str, commits: &[String]) -> Result<()> {
    // Check for existing PR first to avoid duplicates
    if let Some(existing_url) = pr_template::check_existing_pr(branch, base)? {
        eprintln!(
            "{} {}",
            style("[ℹ]").blue().bold(),
            style(format!("PR already exists: {}", existing_url)).blue()
        );
        return Ok(());
    }

    if !flows_setup::gh_available() {
        print_github_pr_url(branch, base)?;
        return Ok(());
    }

    let pb = spinner("Generating PR description...");

    // Generate PR description from template
    let description = match pr_template::generate_pr_description(base) {
        Ok(desc) => desc,
        Err(e) => {
            pb.finish_and_clear();
            eprintln!(
                "{} {}",
                style("Warning:").yellow().bold(),
                style(format!("Failed to generate PR description: {}", e)).yellow()
            );
            // Fall back to simple --fill
            let status = Command::new("gh")
                .args(["pr", "create", "--fill", "--base", base, "--head", branch])
                .status()
                .context("Failed to run gh pr create")?;

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
                print_github_pr_url(branch, base)?;
            }
            return Ok(());
        }
    };

    pb.finish_and_clear();

    // Generate smart title
    let title = pr_template::generate_pr_title(commits);

    // Write description to temporary file
    let temp_file =
        std::env::temp_dir().join(format!("orca-pr-{}.md", branch.replace('/', "-")));
    fs::write(&temp_file, description).context("Failed to write PR description to temp file")?;

    let pb = spinner("Creating GitHub PR via gh...");
    let status = Command::new("gh")
        .args([
            "pr",
            "create",
            "--body-file",
            temp_file.to_str().unwrap(),
            "--base",
            base,
            "--head",
            branch,
            "--title",
            &title,
        ])
        .status()
        .context("Failed to run gh pr create")?;
    pb.finish_and_clear();

    // Clean up temp file
    let _ = fs::remove_file(temp_file);

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
        print_github_pr_url(branch, base)?;
    }

    Ok(())
}

/// Run stack PR workflow (one PR per commit, chained)
async fn run_stack_pr_workflow(base: &str, pr: bool, commits: &[String]) -> Result<()> {
    if !pr {
        eprintln!(
            "{} {}",
            style("Warning:").yellow().bold(),
            style("Stack workflow requires --pr flag").yellow()
        );
        return Ok(());
    }

    if !flows_setup::gh_available() {
        eprintln!(
            "{} {}",
            style("Error:").red().bold(),
            style("Stack workflow requires GitHub CLI (gh)").red()
        );
        return Ok(());
    }

    // Create stack plan
    let stack = pr_workflow::create_stack_plan(commits.to_vec(), base)?;

    eprintln!();
    eprintln!(
        "{} {}",
        style("📚 Stack Plan:").cyan().bold(),
        style(format!("{} PRs will be created (chained)", stack.len())).cyan()
    );
    eprintln!();

    let mut created_prs: Vec<(String, String)> = Vec::new(); // (branch, url)

    for (idx, stack_pr) in stack.iter().enumerate() {
        eprintln!(
            "{} {} Part {}/{}",
            style(format!("[{}/{}]", idx + 1, stack.len()))
                .cyan()
                .bold(),
            style("Creating PR:").cyan().bold(),
            stack_pr.part_number,
            stack_pr.total_parts
        );

        // Create branch for this commit
        let pb = spinner(&format!("Creating branch '{}'...", stack_pr.branch_name));
        
        // Cherry-pick this specific commit onto the base branch
        checkout_branch(&stack_pr.base_branch, false)?;
        checkout_branch(&stack_pr.branch_name, true)?;
        
        // Cherry-pick the commit (find the actual commit hash)
        let commit_hash = run_git(&[
            "log",
            &format!("{}..HEAD", base),
            "--pretty=format:%H",
            &format!("--skip={}", idx),
            "-1",
        ])?;
        
        if !commit_hash.is_empty() {
            run_git(&["cherry-pick", commit_hash.trim()])?;
        }
        
        pb.finish_and_clear();

        // Push branch
        let pb = spinner(&format!("Pushing '{}'...", stack_pr.branch_name));
        run_git(&["push", "-u", "origin", &stack_pr.branch_name])?;
        pb.finish_and_clear();

        // Generate PR description
        let base_description = pr_template::generate_pr_description(&stack_pr.base_branch)
            .unwrap_or_else(|_| pr_template::get_default_template());

        // Add stack info
        let prev_url = if idx > 0 {
            created_prs.get(idx - 1).map(|(_, url)| url.as_str())
        } else {
            None
        };

        let description = pr_workflow::add_stack_info_to_description(
            &base_description,
            stack_pr,
            prev_url,
            None, // Next URL will be added by updating previous PR
        );

        // Write to temp file
        let temp_file = std::env::temp_dir()
            .join(format!("orca-stack-pr-{}.md", stack_pr.part_number));
        fs::write(&temp_file, &description)?;

        // Create PR
        let pb = spinner("Creating PR...");
        let output = Command::new("gh")
            .args([
                "pr",
                "create",
                "--body-file",
                temp_file.to_str().unwrap(),
                "--base",
                &stack_pr.base_branch,
                "--head",
                &stack_pr.branch_name,
                "--title",
                &stack_pr.title,
            ])
            .output()
            .context("Failed to run gh pr create")?;
        pb.finish_and_clear();

        let _ = fs::remove_file(temp_file);

        if output.status.success() {
            let pr_url = String::from_utf8_lossy(&output.stdout).trim().to_string();
            eprintln!(
                "{} {}",
                style("  [✓]").green().bold(),
                style(&pr_url).green()
            );
            created_prs.push((stack_pr.branch_name.clone(), pr_url.clone()));

            // Update previous PR to add "Next" link
            if idx > 0 && created_prs.len() >= 2 {
                update_pr_with_next_link(idx - 1, &created_prs, &stack)?;
            }
        } else {
            eprintln!(
                "{} {}",
                style("  [×]").red().bold(),
                style("Failed to create PR").red()
            );
        }

        eprintln!();
    }

    eprintln!(
        "{} {}",
        style("🎉 Stack created:").green().bold(),
        style(format!("{} PRs", created_prs.len())).green()
    );

    Ok(())
}

/// Update a PR description to add the "Next" link
fn update_pr_with_next_link(
    _pr_idx: usize,
    _created_prs: &[(String, String)],
    _stack: &[pr_workflow::StackPr],
) -> Result<()> {
    // This would require editing PR description via gh API
    // For now, we skip this to keep implementation simpler
    // Future enhancement: use `gh pr edit` to update description
    Ok(())
}

