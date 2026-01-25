use anyhow::Result;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Once, Mutex};

static INIT: Once = Once::new();
static TEST_LOCK: Mutex<()> = Mutex::new(());

/// Setup function to ensure we have a clean environment if needed
fn setup() {
    INIT.call_once(|| {
        // Init code usually goes here
    });
}

/// Helper to run git commands in a specific directory
fn git_cmd(dir: &Path, args: &[&str]) -> Result<()> {
    let output = Command::new("git")
        .current_dir(dir)
        .args(args)
        .output()?;
        
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("git command failed: {:?} - {}", args, err);
    }
    Ok(())
}

/// Create a temporary directory for testing
fn temp_dir() -> PathBuf {
    let mut dir = std::env::temp_dir();
    dir.push("orca_tests");
    let uuid = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    dir.push(format!("test_{}", uuid));
    fs::create_dir_all(&dir).unwrap();
    dir
}

/// Initialize a test repo with a commit
fn init_repo(dir: &Path) -> Result<()> {
    git_cmd(dir, &["init"])?;
    git_cmd(dir, &["config", "user.email", "you@example.com"])?;
    git_cmd(dir, &["config", "user.name", "Your Name"])?;
    
    // Initial commit
    let file_path = dir.join("README.md");
    fs::write(&file_path, "# Test Repo")?;
    git_cmd(dir, &["add", "."])?;
    git_cmd(dir, &["commit", "-m", "Initial commit"])?;
    Ok(())
}

/// Test case for 'orca commit --from-plan'
/// This simulates a user accepting a generated plan
#[tokio::test]
async fn test_commit_from_plan() -> Result<()> {
    let _guard = TEST_LOCK.lock().unwrap();
    let dir = temp_dir();
    init_repo(&dir)?;
    
    // Change working directory to the test repo
    // Note: This changes global state, so tests must run sequentially or in separate processes
    // Since 'orca' relies on std::env::current_dir(), we must change it.
    // However, changing CWD in tests is risky.
    // A better approach would be if `orca` functions accepted a `cwd` argument, 
    // but they call `run_git` which calls `get_repo_root` which uses `git rev-parse`.
    // We will try to mock the environment or just accept that we can't run parallel tests easily.
    // For this example properly, we'll try to set the current dir.
    std::env::set_current_dir(&dir)?;

    // 1. Make a change
    fs::write(dir.join("new_file.txt"), "Hello Orca")?;
    git_cmd(&dir, &["add", "."])?;

    // 2. Create a plan file manually (mocking the AI part)
    let plan = crate::plan::CommitPlan {
        commits: vec![
            crate::plan::PlannedCommit {
                message: "feat: add new file".to_string(),
                hash: None,
                files: vec!["new_file.txt".to_string()],
                commands: vec![],
                description: None,
            }
        ],
    };
    
    let plan_path = dir.join("plan.json");
    let plan_json = serde_json::to_string(&plan)?;
    fs::write(&plan_path, plan_json)?;

    // 3. Run apply flow
    // 3. Run apply flow
    eprintln!("Test CWD: {:?}", std::env::current_dir());
    crate::flow::flows::run_apply_flow(
        &plan_path,
        false, // confirm
        false, // dry_run
        false, // push
        false, // publish
        None, // branch
        "HEAD", // base
        false, // pr
        None, // style_preset
    ).await?;


    // 4. Verify commit
    let output = Command::new("git")
        .current_dir(&dir)
        .args(&["log", "-1", "--pretty=%s"])
        .output()?;
    let commit_msg = String::from_utf8(output.stdout)?.trim().to_string();
    
    assert_eq!(commit_msg, "feat: add new file");
    
    // Cleanup
    let _ = fs::remove_dir_all(dir);
    Ok(())
}

/// Test case for 'orca publish' basics
/// We verify that it detects the remote configuration issues or correctly identifies commits
#[tokio::test]
async fn test_publish_validation() -> Result<()> {
    let _guard = TEST_LOCK.lock().unwrap();
    let dir = temp_dir();
    init_repo(&dir)?;
    std::env::set_current_dir(&dir)?;

    // Setup a fake remote (another local dir)
    let remote_dir = temp_dir();
    git_cmd(&remote_dir, &["init", "--bare"])?;
    
    git_cmd(&dir, &["remote", "add", "origin", remote_dir.to_str().unwrap()])?;
    git_cmd(&dir, &["push", "-u", "origin", "master"])?;

    // Make a new commit on a new branch
    git_cmd(&dir, &["checkout", "-b", "feature/test"])?;
    fs::write(dir.join("change.txt"), "Modification")?;
    git_cmd(&dir, &["add", "."])?;
    git_cmd(&dir, &["commit", "-m", "feat: change thing"])?;

    // Attempt to publish
    // We expect this to try pushing. 
    // Since we don't have 'gh' mocked, it might fail at PR creation or succeed if it just prints url.
    // 'run_publish_current_flow' calls 'create_single_pr' which checks 'gh_available'.
    // If gh is not available, it prints URL.
    // So this test should succeed without erroring, effectively testing the git push part.

    crate::flow::flows::run_publish_current_flow(
        None, // branch
        "master", // base
        false, // pr (false means no PR creation? No, !no_pr. CLI passes !no_pr. So true means CREATE PR.)
        // In main.rs: run_publish_current_flow(..., !no_pr, ...)
        // So passing 'true' here means "Yes, create PR". 
        // Passing 'false' means "Don't create PR". 
        // Let's pass false to test just the Push + Branch detection part.
        Some("single"), // mode
        false, // select
        false, // should_fetch
    ).await?;

    // Verify remote has the branch
    let ls_remote = Command::new("git")
        .current_dir(&dir)
        .args(&["ls-remote", "--heads", "origin", "feature/test"])
        .output()?;
    
    assert!(ls_remote.status.success());
    let output = String::from_utf8(ls_remote.stdout)?;
    assert!(output.contains("refs/heads/feature/test"));

    let _ = fs::remove_dir_all(dir);
    let _ = fs::remove_dir_all(remote_dir);
    Ok(())
}
