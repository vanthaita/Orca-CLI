use anyhow::{Context, Result};
use std::collections::HashSet;
use std::path::PathBuf;
use std::process::{Command, Output};

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
