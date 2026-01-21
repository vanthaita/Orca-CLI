use crate::plan::CommitPlan;
use anyhow::{Context, Result};
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct CachedPlan {
    /// Timestamp khi cache được tạo
    timestamp: u64,
    /// Hash của diff để detect changes
    diff_hash: String,
    /// The cached plan
    plan: CommitPlan,
}

/// Lấy cache directory
fn get_cache_dir() -> Result<PathBuf> {
    let repo_root = crate::git::get_repo_root()?;
    let cache_dir = repo_root.join(".git").join("orca_cache");
    std::fs::create_dir_all(&cache_dir)?;
    Ok(cache_dir)
}

/// Cache file path
fn get_cache_file() -> Result<PathBuf> {
    Ok(get_cache_dir()?.join("commit_plan.json"))
}

/// Tính hash của diff
fn hash_diff(diff: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    diff.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Lưu plan vào cache
pub fn cache_plan(plan: &CommitPlan, diff: &str) -> Result<()> {
    let cache_file = get_cache_file()?;
    let cached = CachedPlan {
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs(),
        diff_hash: hash_diff(diff),
        plan: plan.clone(),
    };
    
    let json = serde_json::to_string_pretty(&cached)?;
    std::fs::write(&cache_file, json)
        .with_context(|| format!("Failed to write cache to {}", cache_file.display()))?;
    
    Ok(())
}

/// Load plan từ cache nếu hợp lệ
pub fn load_cached_plan(diff: &str) -> Result<Option<CommitPlan>> {
    let cache_file = get_cache_file()?;
    
    if !cache_file.exists() {
        return Ok(None);
    }
    
    let content = std::fs::read_to_string(&cache_file)?;
    let cached: CachedPlan = serde_json::from_str(&content)?;
    
    // Check if diff has changed
    if cached.diff_hash != hash_diff(diff) {
        return Ok(None);
    }
    
    // Check if cache is not too old (e.g., 1 hour)
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs();
    let age = now - cached.timestamp;
    if age > 3600 {
        return Ok(None);
    }
    
    Ok(Some(cached.plan))
}

/// Clear cache
#[allow(dead_code)]
pub fn clear_cache() -> Result<()> {
    let cache_file = get_cache_file()?;
    if cache_file.exists() {
        std::fs::remove_file(&cache_file)?;
    }
    Ok(())
}
