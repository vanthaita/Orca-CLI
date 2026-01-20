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
    select_commits: bool,
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

    // If no new commits, we can't create a PR
    if commits.is_empty() {
        let current = crate::git::current_branch()?;
        
        if current == base {
            eprintln!(
                "{} {}",
                style("[ℹ]").blue().bold(),
                style(format!("Already on base branch '{}'. Nothing to publish.", base)).blue()
            );
        } else {
            eprintln!(
                "{} {}",
                style("[ℹ]").blue().bold(),
                style(format!(
                    "Branch '{}' has no new commits compared to '{}'. Cannot create PR.",
                    current, base
                ))
                .blue()
            );
            eprintln!(
                "   {}",
                style("Tip: Make some changes and commit them first!").dim()
            );
        }
        
        return Ok(());
    }

    // Handle selective commit selection if requested
    let (selected_commits, selected_hashes) = if select_commits {
        let commits_with_hashes = pr_template::get_commits_with_hashes_since_base(base)?;
        let selected = pr_template::prompt_select_commits(&commits_with_hashes)?;
        
        let commit_messages: Vec<String> = selected.iter().map(|(_, msg)| msg.clone()).collect();
        let commit_hashes: Vec<String> = selected.iter().map(|(hash, _)| hash.clone()).collect();
        
        (commit_messages, Some(commit_hashes))
    } else {
        (commits, None)
    };

    // Determine workflow mode
    let workflow_mode = if let Some(mode_str) = mode {
        pr_workflow::PrWorkflowMode::from_str(mode_str)
            .ok_or_else(|| anyhow::anyhow!("Invalid mode: {}. Use 'single' or 'stack'", mode_str))?
    } else {
        // Load config to check for default mode
        let config = crate::config::load_config()?;
        if let Some(default_mode) = &config.pr_workflow.default_mode {
            pr_workflow::PrWorkflowMode::from_str(default_mode)
                .unwrap_or_else(|| pr_workflow::prompt_workflow_mode(selected_commits.len()).unwrap())
        } else {
            // Show info about commits
            eprintln!();
            eprintln!(
                "{} {}",
                style("ℹ️  Info:").cyan().bold(),
                style(format!(
                    "Your branch has {} commit(s) since '{}'",
                    selected_commits.len(),
                    base
                ))
                .cyan()
            );
            eprintln!(
                "   {}",
                style("(GitHub PR will show commits not yet on remote)").dim()
            );
            
            // Interactive prompt
            pr_workflow::prompt_workflow_mode(selected_commits.len())?
        }
    };

    // Execute workflow based on mode
    match workflow_mode {
        pr_workflow::PrWorkflowMode::Single => {
            run_single_pr_workflow(branch, base, pr, &selected_commits, selected_hashes.as_deref()).await
        }
        pr_workflow::PrWorkflowMode::Stack => {
            run_stack_pr_workflow(base, pr, &selected_commits, selected_hashes.as_deref()).await
        }
    }
}

/// Run single PR workflow (all commits in one PR)
async fn run_single_pr_workflow(
    branch: Option<&str>,
    base: &str,
    pr: bool,
    commits: &[String],
    selected_hashes: Option<&[String]>,
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

    // If we have selected hashes, we need to cherry-pick them onto a new branch
    if let Some(hashes) = selected_hashes {
        let pb = spinner(&format!("Creating branch '{}' from base '{}'...", target_branch, base));
        
        // Start from base branch
        checkout_branch(base, false)?;
        
        // Create and checkout new branch from base
        checkout_branch(&target_branch, true)?;
        pb.finish_and_clear();
        
        // Cherry-pick selected commits in order
        eprintln!(
            "{} {}",
            style("[ℹ]").blue().bold(),
            style(format!("Cherry-picking {} selected commit(s)...", hashes.len())).blue()
        );
        
        for (idx, hash) in hashes.iter().enumerate() {
            let pb = spinner(&format!("  [{}/{}] Cherry-picking {}...", idx + 1, hashes.len(), &hash[..7.min(hash.len())]));
            
            if let Err(e) = run_git(&["cherry-pick", hash]) {
                pb.finish_and_clear();
                eprintln!(
                    "{} {}",
                    style("[×]").red().bold(),
                    style(format!("Failed to cherry-pick {}: {}", hash, e)).red()
                );
                eprintln!("   {}", style("You may need to resolve conflicts manually").dim());
                return Err(e);
            }
            
            pb.finish_and_clear();
        }
        
        eprintln!(
            "{} {}",
            style("[✓]").green().bold(),
            style("All commits cherry-picked successfully").green()
        );
    } else {
        // Normal flow: just switch to target branch (existing behavior)
        let pb = spinner("Switching to publish branch...");
        checkout_branch(&target_branch, true)?;
        pb.finish_and_clear();
    }

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
        Ok(desc) => {
            pb.finish_and_clear();
            eprintln!(
                "{} {}",
                style("[✓]").green().bold(),
                style("PR description generated from template").green()
            );
            desc
        }
        Err(e) => {
            pb.finish_and_clear();
            eprintln!(
                "{} {}",
                style("Warning:").yellow().bold(),
                style(format!("Failed to generate PR description: {}", e)).yellow()
            );
            eprintln!(
                "   {}",
                style("Using default description instead").dim()
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
async fn run_stack_pr_workflow(base: &str, pr: bool, commits: &[String], selected_hashes: Option<&[String]>) -> Result<()> {
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

    // Warn if too many PRs
    if stack.len() > 10 {
        eprintln!();
        eprintln!(
            "{} {}",
            style("⚠️  Warning:").yellow().bold(),
            style(format!(
                "You're about to create {} PRs. This might be too many!",
                stack.len()
            ))
            .yellow()
        );
        eprintln!(
            "   {}",
            style("Consider using Single PR mode (--mode single) instead.").dim()
        );
        
        if !flows_error::confirm_or_abort("Continue with stack workflow?", false)? {
            return Ok(());
        }
    }

    eprintln!();
    eprintln!(
        "{} {}",
        style("📚 Stack Plan:").cyan().bold(),
        style(format!("{} PRs will be created (chained)", stack.len())).cyan()
    );
    eprintln!();

    // Get all commit hashes first (in reverse order - oldest first)
    let effective_base = crate::git::resolve_base_ref(base);
    let all_commits_output = run_git(&[
        "log",
        &format!("{}..HEAD", effective_base),
        "--pretty=format:%H",
        "--reverse",
    ])?;
    
    let all_commit_hashes: Vec<String> = all_commits_output
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    // Filter hashes if selective mode is enabled
    let commit_hashes: Vec<String> = if let Some(selected) = selected_hashes {
        // Only include selected hashes in the order they appear
        all_commit_hashes
            .into_iter()
            .filter(|hash| selected.iter().any(|sel| hash.starts_with(sel)))
            .collect()
    } else {
        all_commit_hashes
    };

    if commit_hashes.len() != stack.len() {
        anyhow::bail!(
            "Mismatch: found {} commit hashes but {} stack items",
            commit_hashes.len(),
            stack.len()
        );
    }

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

        // Checkout base branch for this PR
        let pb = spinner(&format!("Creating branch '{}'...", stack_pr.branch_name));
        checkout_branch(&stack_pr.base_branch, false)?;
        
        // Create new branch
        checkout_branch(&stack_pr.branch_name, true)?;
        
        // Cherry-pick this specific commit
        let commit_hash = &commit_hashes[idx];
        let cherry_result = run_git(&["cherry-pick", commit_hash]);
        
        if let Err(e) = cherry_result {
            pb.finish_and_clear();
            
            // Abort the cherry-pick to clean up
            let _ = run_git(&["cherry-pick", "--abort"]);
            
            eprintln!(
                "{} {}",
                style("  [×]").red().bold(),
                style(format!("Failed to cherry-pick commit: {}", e)).red()
            );
            eprintln!(
                "   {}",
                style("Aborting stack creation. Clean up may be needed.").dim()
            );
            return Err(e);
        }
        
        pb.finish_and_clear();

        // Push branch
        let pb = spinner(&format!("Pushing '{}'...", stack_pr.branch_name));
        if let Err(e) = run_git(&["push", "-u", "origin", &stack_pr.branch_name]) {
            pb.finish_and_clear();
            eprintln!(
                "{} {}",
                style("  [×]").red().bold(),
                style(format!("Failed to push: {}", e)).red()
            );
            continue; // Skip PR creation for this one
        }
        pb.finish_and_clear();

        // Generate PR description using the specific commit for this PR
        let commit_messages = vec![stack_pr.commit_message.clone()];
        let base_description = pr_template::generate_pr_description_from_commits(&commit_messages)
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
            None,
        );

        // Write to temp file
        let temp_file = std::env::temp_dir()
            .join(format!("orca-stack-pr-{}.md", stack_pr.part_number));
        
        if let Err(e) = fs::write(&temp_file, &description) {
            eprintln!(
                "{} {}",
                style("  [×]").red().bold(),
                style(format!("Failed to write description: {}", e)).red()
            );
            continue;
        }

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
            .output();
        
        pb.finish_and_clear();
        let _ = fs::remove_file(temp_file);

        match output {
            Ok(output) if output.status.success() => {
                let pr_url = String::from_utf8_lossy(&output.stdout).trim().to_string();
                eprintln!(
                    "{} {}",
                    style("  [✓]").green().bold(),
                    style(&pr_url).green()
                );
                created_prs.push((stack_pr.branch_name.clone(), pr_url));
            }
            Ok(output) => {
                let error = String::from_utf8_lossy(&output.stderr);
                eprintln!(
                    "{} {}",
                    style("  [×]").red().bold(),
                    style("Failed to create PR").red()
                );
                eprintln!("   {}", style(error.trim()).dim());
            }
            Err(e) => {
                eprintln!(
                    "{} {}",
                    style("  [×]").red().bold(),
                    style(format!("Failed to run gh: {}", e)).red()
                );
            }
        }

        eprintln!();
    }

    eprintln!(
        "{} {}",
        style("🎉 Stack completed:").green().bold(),
        style(format!("{} PRs created", created_prs.len())).green()
    );

    // Cleanup failed branches if needed
    if created_prs.len() < stack.len() {
        eprintln!();
        eprintln!(
            "{} {}",
            style("⚠️  Note:").yellow().bold(),
            style(format!(
                "{} PR(s) failed to create. {} leftover branches.",
                stack.len() - created_prs.len(),
                stack.len() - created_prs.len()
            ))
            .yellow()
        );

        // Find branches that were created but have no PR
        let created_pr_branches: std::collections::HashSet<_> = created_prs
            .iter()
            .map(|(branch, _)| branch.as_str())
            .collect();

        let failed_branches: Vec<_> = stack
            .iter()
            .filter(|pr| !created_pr_branches.contains(pr.branch_name.as_str()))
            .map(|pr| pr.branch_name.as_str())
            .collect();

        if !failed_branches.is_empty() {
            eprintln!();
            eprintln!("   Failed branches:");
            for branch in &failed_branches {
                eprintln!("     - {}", style(branch).dim());
            }

            eprintln!();
            if flows_error::confirm_or_abort(
                "Delete these leftover branches?",
                false,
            )? {
                for branch in &failed_branches {
                    eprintln!("   Deleting '{}'...", branch);
                    // Delete local branch
                    let _ = run_git(&["branch", "-D", branch]);
                    // Try to delete remote branch if it was pushed
                    let _ = run_git(&["push", "origin", "--delete", branch]);
                }
                eprintln!(
                    "{} {}",
                    style("[✓]").green().bold(),
                    style("Cleanup completed").green()
                );
            } else {
                eprintln!();
                eprintln!(
                    "   {}",
                    style("You can manually delete them later with:").dim()
                );
                for branch in &failed_branches {
                    eprintln!("     git branch -D {}", branch);
                    eprintln!("     git push origin --delete {}", branch);
                }
            }
        }
    }

    Ok(())
}

