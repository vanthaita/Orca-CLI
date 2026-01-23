use anyhow::{Context, Result};
use std::collections::HashSet;
use std::path::PathBuf;
use std::process::{Command, Output};

/// Status of a remote branch relative to local branch
#[derive(Debug, Clone, PartialEq)]
pub enum RemoteBranchStatus {
    DoesNotExist,
    UpToDate,
    LocalAhead { ahead: u32 },
    LocalBehind { behind: u32 },
    Diverged { ahead: u32, behind: u32 },
}

/// Information about a remote branch
#[derive(Debug, Clone)]
pub struct RemoteBranchInfo {
    pub exists: bool,
    pub head_commit: Option<String>,
    pub status: RemoteBranchStatus,
}

/// Result of push safety validation
#[derive(Debug)]
pub struct PushValidation {
    pub can_push: bool,
    pub needs_force: bool,
    pub warnings: Vec<String>,
    pub remote_status: RemoteBranchStatus,
}

fn git_failed_error(args: &[&str], out: &Output) -> anyhow::Error {
    let code = out
        .status
        .code()
        .map(|c| c.to_string())
        .unwrap_or("<signal>".to_string());
    let stderr = String::from_utf8_lossy(&out.stderr);
    let stdout = String::from_utf8_lossy(&out.stdout);
    let stderr_t = stderr.trim();
    let stdout_t = stdout.trim();

    let details = if !stderr_t.is_empty() {
        stderr_t.to_string()
    } else if !stdout_t.is_empty() {
        stdout_t.to_string()
    } else {
        "<no output from git>".to_string()
    };

    anyhow::anyhow!(
        "git {} failed (exit code {}): {}",
        args.join(" "),
        code,
        details
    )
}

pub(crate) fn ensure_git_repo() -> Result<()> {
    let out = Command::new("git")
        .args(["rev-parse", "--is-inside-work-tree"])
        .output()
        .context("Failed to run git rev-parse")?;
    if !out.status.success() {
        anyhow::bail!("Not a git repository (or git not available)");
    }
    Ok(())
}

pub(crate) fn get_repo_root() -> Result<PathBuf> {
    let out = Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .output()
        .context("Failed to run git rev-parse --show-toplevel")?;
    
    if !out.status.success() {
        anyhow::bail!("Failed to get git repository root");
    }
    
    let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
    Ok(PathBuf::from(path_str))
}

pub(crate) fn run_git(args: &[&str]) -> Result<String> {
    let repo_root = get_repo_root()?;
    let out = Command::new("git")
        .current_dir(&repo_root)
        .args(args)
        .output()
        .with_context(|| format!("Failed to run git {}", args.join(" ")))?;

    if !out.status.success() {
        return Err(git_failed_error(args, &out));
    }

    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

pub(crate) fn run_git_with_input(args: &[&str], input: &str) -> Result<String> {
    use std::io::Write;

    let repo_root = get_repo_root()?;
    let mut child = Command::new("git")
        .current_dir(&repo_root)
        .args(args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .with_context(|| format!("Failed to spawn git {}", args.join(" ")))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(input.as_bytes())
            .with_context(|| format!("Failed to write stdin to git {}", args.join(" ")))?;
    }

    let out = child
        .wait_with_output()
        .with_context(|| format!("Failed to wait for git {}", args.join(" ")))?;

    if !out.status.success() {
        return Err(git_failed_error(args, &out));
    }

    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

pub(crate) fn has_git_remote() -> Result<bool> {
    let remotes = run_git(&["remote"])?;
    Ok(!remotes.trim().is_empty())
}

pub(crate) fn current_branch() -> Result<String> {
    let b = run_git(&["branch", "--show-current"])?;
    Ok(b.trim().to_string())
}

pub(crate) fn upstream_ref() -> Result<Option<String>> {
    let out = Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
        .output()
        .context("Failed to run git rev-parse @{u}")?;

    if !out.status.success() {
        return Ok(None);
    }

    Ok(Some(
        String::from_utf8_lossy(&out.stdout).trim().to_string(),
    ))
}

pub(crate) fn upstream_ahead_behind() -> Result<Option<(u32, u32)>> {
    let Some(upstream) = upstream_ref()? else {
        return Ok(None);
    };

    let out = run_git(&["rev-list", "--left-right", "--count", &format!("{upstream}...HEAD")])?;
    let t = out.trim();
    let mut parts = t.split_whitespace();
    let behind: u32 = parts
        .next()
        .unwrap_or("0")
        .parse()
        .unwrap_or(0);
    let ahead: u32 = parts
        .next()
        .unwrap_or("0")
        .parse()
        .unwrap_or(0);
    Ok(Some((ahead, behind)))
}

pub(crate) fn ahead_behind_between(left: &str, right: &str) -> Result<(u32, u32)> {
    let out = run_git(&["rev-list", "--left-right", "--count", &format!("{left}...{right}")])?;
    let t = out.trim();
    let mut parts = t.split_whitespace();
    let left_only: u32 = parts
        .next()
        .unwrap_or("0")
        .parse()
        .unwrap_or(0);
    let right_only: u32 = parts
        .next()
        .unwrap_or("0")
        .parse()
        .unwrap_or(0);
    Ok((left_only, right_only))
}

pub(crate) fn patch_id_from_patch(patch: &str) -> Result<Option<String>> {
    if patch.trim().is_empty() {
        return Ok(None);
    }

    let out = run_git_with_input(&["patch-id", "--stable"], patch)?;
    let first_line = out.lines().next().unwrap_or("").trim();
    if first_line.is_empty() {
        return Ok(None);
    }
    let patch_id = first_line.split_whitespace().next().unwrap_or("").trim();
    if patch_id.is_empty() {
        return Ok(None);
    }
    Ok(Some(patch_id.to_string()))
}

pub(crate) fn recent_patch_ids(limit: usize) -> Result<HashSet<String>> {
    let mut set = HashSet::new();
    let out = run_git(&["log", "-n", &limit.to_string(), "--pretty=%H"])?;
    for hash in out.lines().map(|l| l.trim()).filter(|l| !l.is_empty()) {
        let patch = run_git(&["show", hash, "--pretty=format:"])?;
        if let Some(pid) = patch_id_from_patch(&patch)? {
            set.insert(pid);
        }
    }
    Ok(set)
}

pub(crate) fn origin_url() -> Result<Option<String>> {
    let out = Command::new("git")
        .args(["remote", "get-url", "origin"])
        .output()
        .context("Failed to run git remote get-url origin")?;
    if !out.status.success() {
        return Ok(None);
    }
    let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if url.is_empty() {
        return Ok(None);
    }
    Ok(Some(url))
}

pub(crate) fn github_repo_slug_from_remote(url: &str) -> Option<String> {
    let mut s = url.trim().to_string();
    if s.ends_with('/') {
        s.pop();
    }
    if s.ends_with(".git") {
        s.truncate(s.len().saturating_sub(4));
    }

    if let Some(rest) = s.strip_prefix("git@github.com:") {
        return Some(rest.to_string());
    }

    if let Some(rest) = s.strip_prefix("https://github.com/") {
        return Some(rest.to_string());
    }
    if let Some(rest) = s.strip_prefix("http://github.com/") {
        return Some(rest.to_string());
    }
    None
}

pub(crate) fn branch_exists(branch: &str) -> Result<bool> {
    let out = Command::new("git")
        .args(["show-ref", "--verify", "--quiet", &format!("refs/heads/{branch}")])
        .output()
        .context("Failed to run git show-ref")?;
    Ok(out.status.success())
}

pub(crate) fn checkout_branch(branch: &str, create_if_missing: bool) -> Result<()> {
    if create_if_missing && !branch_exists(branch)? {
        run_git(&["checkout", "-b", branch])?;
        return Ok(());
    }
    run_git(&["checkout", branch])?;
    Ok(())
}

pub(crate) fn is_working_tree_clean() -> Result<bool> {
    let status = run_git(&["status", "--porcelain"])?;
    Ok(status.trim().is_empty())
}

pub(crate) fn get_remote_name() -> Result<String> {
    let remotes = run_git(&["remote"])?;
    let first_remote = remotes.lines().next().unwrap_or("origin").trim();
    if first_remote.is_empty() {
        anyhow::bail!("No git remote configured");
    }
    Ok(first_remote.to_string())
}

pub(crate) fn list_branches() -> Result<Vec<String>> {
    let output = run_git(&["branch", "--format=%(refname:short)"])?;
    Ok(output
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect())
}

pub(crate) fn list_remote_branches(remote: &str) -> Result<Vec<String>> {
    let output = run_git(&["branch", "-r", "--format=%(refname:short)"])?;
    Ok(output
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty() && l.starts_with(&format!("{}/", remote)))
        .collect())
}

pub(crate) fn fetch_remote(remote: &str) -> Result<()> {
    run_git(&["fetch", remote])?;
    Ok(())
}

pub(crate) fn merge_upstream() -> Result<()> {
    let upstream = upstream_ref()?
        .ok_or_else(|| anyhow::anyhow!("No upstream branch configured"))?;
    run_git(&["merge", &upstream])?;
    Ok(())
}

pub(crate) fn rebase_upstream() -> Result<()> {
    let upstream = upstream_ref()?
        .ok_or_else(|| anyhow::anyhow!("No upstream branch configured"))?;
    run_git(&["rebase", &upstream])?;
    Ok(())
}

pub(crate) fn merge_base(left: &str, right: &str) -> Result<String> {
    let out = run_git(&["merge-base", left, right])?;
    Ok(out.trim().to_string())
}

pub(crate) fn resolve_base_ref(base: &str) -> String {
    let remote = get_remote_name().unwrap_or_else(|_| "origin".to_string());
    let remote_ref = format!("{}/{}", remote, base);
    
    // Check if remote ref exists
    if run_git(&["rev-parse", "--verify", &remote_ref]).is_ok() {
        return remote_ref;
    }
    
    // Check if local branch exists
    if run_git(&["rev-parse", "--verify", base]).is_ok() {
        return base.to_string();
    }
    
    // If "main" doesn't exist, try "master"
    if base == "main" {
        let master_remote_ref = format!("{}/master", remote);
        if run_git(&["rev-parse", "--verify", &master_remote_ref]).is_ok() {
            return master_remote_ref;
        }
        if run_git(&["rev-parse", "--verify", "master"]).is_ok() {
            return "master".to_string();
        }
    }
    
    // Fall back to detecting the default branch from remote HEAD
    if let Ok(symbolic_ref) = run_git(&["symbolic-ref", &format!("refs/remotes/{}/HEAD", remote)]) {
        if let Some(branch_name) = symbolic_ref.trim().strip_prefix(&format!("refs/remotes/{}/", remote)) {
            return format!("{}/{}", remote, branch_name);
        }
    }
    
    // Last resort: return the original input
    base.to_string()
}

/// Get information about a remote branch
pub(crate) fn get_remote_branch_info(branch: &str, remote: &str) -> Result<RemoteBranchInfo> {
    let remote_ref = format!("{}/{}", remote, branch);
    
    // Check if remote branch exists by trying to get its commit
    let remote_commit = run_git(&["rev-parse", "--verify", &remote_ref]);
    
    let exists = remote_commit.is_ok();
    let head_commit = remote_commit.ok().map(|s| s.trim().to_string());
    
    // Calculate status if remote branch exists
    let status = if !exists {
        RemoteBranchStatus::DoesNotExist
    } else {
        // Check if local branch exists
        let local_exists = run_git(&["rev-parse", "--verify", branch]).is_ok();
        
        if !local_exists {
            // Local doesn't exist, remote does - we're behind
            RemoteBranchStatus::LocalBehind { behind: 1 }
        } else {
            // Both exist, calculate ahead/behind
            match ahead_behind_between(&remote_ref, branch) {
                Ok((remote_only, local_only)) => {
                    if remote_only == 0 && local_only == 0 {
                        RemoteBranchStatus::UpToDate
                    } else if remote_only == 0 {
                        RemoteBranchStatus::LocalAhead { ahead: local_only }
                    } else if local_only == 0 {
                        RemoteBranchStatus::LocalBehind { behind: remote_only }
                    } else {
                        RemoteBranchStatus::Diverged { ahead: local_only, behind: remote_only }
                    }
                }
                Err(_) => RemoteBranchStatus::DoesNotExist,
            }
        }
    };
    
    Ok(RemoteBranchInfo {
        exists,
        head_commit,
        status,
    })
}

/// Validate if it's safe to push to a branch
pub(crate) fn validate_push_safety(branch: &str, remote: &str) -> Result<PushValidation> {
    let mut warnings = Vec::new();
    
    // Check if working tree is clean
    if !is_working_tree_clean()? {
        warnings.push("Working tree has uncommitted changes".to_string());
    }
    
    // Get remote branch info
    let remote_info = get_remote_branch_info(branch, remote)?;
    
    let (can_push, needs_force) = match &remote_info.status {
        RemoteBranchStatus::DoesNotExist => {
            // New branch, safe to push
            (true, false)
        }
        RemoteBranchStatus::UpToDate => {
            warnings.push(format!("Branch '{}' is up to date with remote", branch));
            (true, false)
        }
        RemoteBranchStatus::LocalAhead { ahead } => {
            // We're ahead, safe to push
            warnings.push(format!("Will push {} new commit(s) to remote", ahead));
            (true, false)
        }
        RemoteBranchStatus::LocalBehind { behind } => {
            // We're behind, need to pull first
            warnings.push(format!(
                "Local branch is {} commit(s) behind remote. Consider pulling first.",
                behind
            ));
            (false, false)
        }
        RemoteBranchStatus::Diverged { ahead, behind } => {
            // Diverged, need force push
            warnings.push(format!(
                "Branch has diverged: {} ahead, {} behind remote. Force push required.",
                ahead, behind
            ));
            (true, true)
        }
    };
    
    Ok(PushValidation {
        can_push,
        needs_force,
        warnings,
        remote_status: remote_info.status,
    })
}

/// Safely push a branch with validation and optional force
pub(crate) fn safe_push(branch: &str, remote: &str, allow_force: bool) -> Result<()> {
    let validation = validate_push_safety(branch, remote)?;
    
    if !validation.can_push {
        anyhow::bail!(
            "Cannot push branch '{}': {}",
            branch,
            validation.warnings.join("; ")
        );
    }
    
    if validation.needs_force && !allow_force {
        anyhow::bail!(
            "Force push required for '{}' but not allowed. Use --force flag to override.",
            branch
        );
    }
    
    // Execute push
    let args = if validation.needs_force {
        vec!["push", "--force-with-lease", remote, branch]
    } else {
        vec!["push", "-u", remote, branch]
    };
    
    run_git(&args)?;
    Ok(())
}

/// Resolve base ref with fetch to ensure it's up-to-date
pub(crate) fn resolve_and_fetch_base_ref(base: &str) -> Result<String> {
    let remote = get_remote_name().unwrap_or_else(|_| "origin".to_string());
    
    // Fetch the remote to ensure we have latest refs
    let _ = fetch_remote(&remote); // Ignore errors, will fall back to local
    
    let resolved = resolve_base_ref(base);
    
    // Log what was resolved for transparency
    eprintln!("Resolved base '{}' to '{}'", base, resolved);
    
    Ok(resolved)
}

/// Get validated commit range between base and head
pub(crate) fn get_commit_range_with_validation(base: &str, head: &str) -> Result<Vec<String>> {
    // Find merge base
    let merge_base_commit = merge_base(base, head)?;
    
    // Get commits in range
    let output = run_git(&[
        "log",
        &format!("{}..{}", merge_base_commit, head),
        "--pretty=format:%s",
    ])?;
    
    let commits: Vec<String> = output
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    
    // Validate: warn if base has commits not in head
    let (base_only, _head_only) = ahead_behind_between(base, head)?;
    if base_only > 0 {
        eprintln!(
            "⚠️  Warning: Base '{}' has {} commit(s) not in '{}'",
            base, base_only, head
        );
    }
    
    Ok(commits)
}
