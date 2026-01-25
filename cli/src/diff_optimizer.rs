use crate::git::run_git;
use anyhow::Result;
use std::path::Path;

/// Diff mode for AI processing
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiffMode {
    /// Full diff without filtering
    Full,
    /// Minimal diff with --minimal flag
    Minimal,
    /// Filtered diff (removes binary/large files)
    Filtered,
    /// Summary only (stats, no patches)
    Summary,
}

impl Default for DiffMode {
    fn default() -> Self {
        DiffMode::Filtered
    }
}

/// Get optimized diff for AI processing
pub fn get_diff_for_ai(mode: DiffMode) -> Result<String> {
    match mode {
        DiffMode::Full => run_git(&["diff"]),
        DiffMode::Minimal => run_git(&["diff", "--minimal", "--unified=3"]),
        DiffMode::Filtered => get_optimized_diff(),
        DiffMode::Summary => get_diff_summary(),
    }
}

/// Get diff with binary and large files filtered out
fn get_optimized_diff() -> Result<String> {
    use crate::plan::files_from_status_porcelain;
    
    // Get status first to see what changed
    let status = run_git(&["status", "--porcelain"])?;
    let files = files_from_status_porcelain(&status);
    
    // Filter out binary/large files
    let text_files: Vec<String> = files
        .into_iter()
        .filter(|f| !is_binary_or_large(f))
        .collect();
    
    if text_files.is_empty() {
        return Ok(String::new());
    }
    
    // Get diff only for text files, using minimal algorithm
    let mut diff_args = vec!["diff", "--minimal", "--unified=3", "--"];
    let file_refs: Vec<&str> = text_files.iter().map(|s| s.as_str()).collect();
    diff_args.extend(file_refs);
    
    run_git(&diff_args)
}

/// Get diff summary (stats only, no actual patches)
fn get_diff_summary() -> Result<String> {
    use crate::plan::files_from_status_porcelain;
    
    let status = run_git(&["status", "--porcelain"])?;
    let stats = run_git(&["diff", "--stat"])?;
    let file_list = files_from_status_porcelain(&status);
    
    Ok(format!(
        "Changed files:\n{}\n\nDiff stats:\n{}",
        file_list.join("\n"),
        stats
    ))
}

/// Check if a file should be excluded from diff (binary or too large)
fn is_binary_or_large(path: &str) -> bool {
    // Binary file extensions
    let binary_exts = [
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
        ".webp", ".pdf", ".zip", ".gz", ".tar", ".7z", ".rar",
        ".bin", ".exe", ".dll", ".so", ".dylib", ".a", ".o",
        ".wasm", ".pyc", ".class", ".jar", ".war",
        ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac",
        ".ttf", ".woff", ".woff2", ".eot",
        ".db", ".sqlite", ".sqlite3",
    ];
    
    // Lock files and generated files
    let lock_files = [
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "Cargo.lock",
        "Gemfile.lock",
        "poetry.lock",
        "composer.lock",
    ];
    
    // Large auto-generated files
    let generated_patterns = [
        "dist/",
        "build/",
        "node_modules/",
        "vendor/",
        ".min.js",
        ".min.css",
        "bundle.js",
        "bundle.css",
    ];
    
    // Check file extension
    let path_lower = path.to_lowercase();
    if binary_exts.iter().any(|ext| path_lower.ends_with(ext)) {
        return true;
    }
    
    // Check if it's a lock file
    let path_obj = Path::new(path);
    if let Some(filename) = path_obj.file_name() {
        let filename_str = filename.to_string_lossy();
        if lock_files.iter().any(|lock| filename_str == *lock) {
            return true;
        }
    }
    
    // Check generated patterns
    if generated_patterns.iter().any(|pattern| path.contains(pattern)) {
        return true;
    }
    
    // Check file size (if file exists)
    if let Ok(metadata) = std::fs::metadata(path) {
        // Files larger than 100KB are probably not good for diff
        if metadata.len() > 100_000 {
            return true;
        }
    }
    
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_binary_or_large_detects_images() {
        assert!(is_binary_or_large("logo.png"));
        assert!(is_binary_or_large("photo.jpg"));
        assert!(is_binary_or_large("icon.svg"));
    }

    #[test]
    fn test_is_binary_or_large_detects_lock_files() {
        assert!(is_binary_or_large("package-lock.json"));
        assert!(is_binary_or_large("Cargo.lock"));
        assert!(is_binary_or_large("yarn.lock"));
    }

    #[test]
    fn test_is_binary_or_large_allows_source_files() {
        assert!(!is_binary_or_large("main.rs"));
        assert!(!is_binary_or_large("index.ts"));
        assert!(!is_binary_or_large("README.md"));
    }

    #[test]
    fn test_is_binary_or_large_detects_generated() {
        assert!(is_binary_or_large("dist/bundle.js"));
        assert!(is_binary_or_large("node_modules/lodash/index.js"));
        assert!(is_binary_or_large("app.min.js"));
    }
}
