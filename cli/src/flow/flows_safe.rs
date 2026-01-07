use crate::git::{ensure_git_repo, run_git};
use anyhow::Result;
use console::style;
use regex::Regex;
use std::collections::HashSet;

// Secret patterns to detect
const SECRET_PATTERNS: &[(&str, &str)] = &[
    (r"(?i)(api[_-]?key|apikey)\s*[:=]\s*['\"]?[a-z0-9]{20,}['\"]?", "API Key"),
    (r"(?i)(secret[_-]?key|secretkey)\s*[:=]\s*['\"]?[a-z0-9]{20,}['\"]?", "Secret Key"),
    (r"(?i)(access[_-]?token|accesstoken)\s*[:=]\s*['\"]?[a-z0-9]{20,}['\"]?", "Access Token"),
    (r"(?i)(auth[_-]?token|authtoken)\s*[:=]\s*['\"]?[a-z0-9]{20,}['\"]?", "Auth Token"),
    (r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"]?[^\s'\";]{8,}['\"]?", "Password"),
    (r"-----BEGIN (RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----", "Private Key"),
    (r"(?i)(aws_access_key_id|aws_secret_access_key)\s*[:=]", "AWS Credentials"),
    (r"(?i)(github|gitlab)_token\s*[:=]\s*['\"]?[a-z0-9]{20,}['\"]?", "GitHub/GitLab Token"),
    (r"(?i)Bearer\s+[a-zA-Z0-9\-._~+/]+=*", "Bearer Token"),
    (r"sk-[a-zA-Z0-9]{32,}", "OpenAI API Key"),
];

// Risky file patterns
const RISKY_FILES: &[&str] = &[
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    "id_rsa",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
    "*.kdb",
    "*.kdbx",
    "credentials.json",
    "service-account.json",
];

#[derive(Debug)]
struct SecretMatch {
    file: String,
    line_number: usize,
    pattern_name: String,
    context: String,
}

/// Scan staged files for secrets
pub(crate) async fn run_safe_scan_flow(all: bool) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style("[orca safe scan]").bold().cyan());
    
    // Get files to scan
    let files_output = if all {
        run_git(&["ls-files"])?
    } else {
        run_git(&["diff", "--cached", "--name-only"])?
    };
    
    let files: Vec<_> = files_output.lines()
        .filter(|l| !l.trim().is_empty())
        .collect();
    
    if files.is_empty() {
        println!("\n{}", style("No files to scan").dim());
        return Ok(());
    }
    
    println!(
        "\n{} {}",
        style("Scanning:").bold(),
        style(format!("{} files", files.len())).cyan()
    );
    
    let mut issues_found = vec![];
    let mut risky_files_found = vec![];
    
    // Compile regex patterns
    let patterns: Vec<_> = SECRET_PATTERNS.iter()
        .filter_map(|(pattern, name)| {
            Regex::new(pattern).ok().map(|r| (r, *name))
        })
        .collect();
    
    // Check for risky file names
    for file in &files {
        let file_name = file.to_lowercase();
        for risky_pattern in RISKY_FILES {
            let pattern_lower = risky_pattern.to_lowercase();
            if pattern_lower.contains('*') {
                // Simple wildcard matching
                let pattern_parts: Vec<&str> = pattern_lower.split('*').collect();
                if pattern_parts.len() == 2 {
                    if file_name.starts_with(pattern_parts[0]) && file_name.ends_with(pattern_parts[1]) {
                        risky_files_found.push(file.to_string());
                        break;
                    }
                }
            } else if file_name.contains(&pattern_lower) || file_name.ends_with(&pattern_lower) {
                risky_files_found.push(file.to_string());
                break;
            }
        }
    }
    
    // Scan file contents
    for file in &files {
        // Skip binary files (simple check)
        if file.ends_with(".png") || file.ends_with(".jpg") || file.ends_with(".gif") 
            || file.ends_with(".pdf") || file.ends_with(".zip") || file.ends_with(".exe") {
            continue;
        }
        
        // Get file content
        let content = match std::fs::read_to_string(file) {
            Ok(c) => c,
            Err(_) => continue, // Skip if can't read (likely binary)
        };
        
        // Check each pattern
        for (regex, pattern_name) in &patterns {
            for (line_num, line) in content.lines().enumerate() {
                if regex.is_match(line) {
                    issues_found.push(SecretMatch {
                        file: file.to_string(),
                        line_number: line_num + 1,
                        pattern_name: pattern_name.to_string(),
                        context: line.trim().to_string(),
                    });
                }
            }
        }
    }
    
    // Report findings
    if risky_files_found.is_empty() && issues_found.is_empty() {
        println!(
            "\n{} {}",
            style("[✓]").green().bold(),
            style("No security issues detected").green()
        );
        return Ok(());
    }
    
    // Show risky files
    if !risky_files_found.is_empty() {
        println!(
            "\n{} Risky files detected:",
            style("[!]").yellow().bold()
        );
        for file in &risky_files_found {
            println!("  {} {}", style("•").yellow(), style(file).yellow());
        }
    }
    
    // Show secret matches
    if !issues_found.is_empty() {
        println!(
            "\n{} Potential secrets detected:",
            style("[!]").red().bold()
        );
        
        for issue in &issues_found {
            println!(
                "  {} {} (Line {}) - {}",
                style("•").red(),
                style(&issue.file).red(),
                style(issue.line_number).dim(),
                style(&issue.pattern_name).yellow()
            );
            println!("    {}", style(&issue.context).dim());
        }
    }
    
    // Provide guidance
    println!("\n{}", style("Recommendations:").bold().cyan());
    if !risky_files_found.is_empty() {
        println!("  1. Add sensitive files to .gitignore");
        println!("  2. Remove them from staging:");
        println!("     {}", style("git reset HEAD <file>").cyan());
    }
    if !issues_found.is_empty() {
        println!("  3. Never commit secrets to version control");
        println!("  4. Use environment variables or secret management");
        println!("  5. If already committed, rotate the secrets immediately");
    }
    
    anyhow::bail!("Security issues detected. Aborting to prevent secret leaks.");
}

/// Run preflight checks before push/tag/release
pub(crate) async fn run_safe_preflight_flow(
    operation: &str,
    protection: Option<&str>,
) -> Result<()> {
    ensure_git_repo()?;
    
    println!("{}", style(format!("[orca safe preflight: {}]", operation)).bold().cyan());
    
    let mut checks_passed = true;
    let mut warnings = vec![];
    
    // Check 1: Scan for secrets in staged files
    println!("\n{}", style("1. Scanning for secrets...").dim());
    match run_safe_scan_silently(false).await {
        Ok(issues) => {
            if issues > 0 {
                println!(
                    "  {} {} potential secret(s) found",
                    style("[!]").red().bold(),
                    issues
                );
                checks_passed = false;
            } else {
                println!("  {} No secrets detected", style("[✓]").green());
            }
        }
        Err(e) => {
            warnings.push(format!("Secret scan failed: {}", e));
        }
    }
    
    // Check 2: Verify branch protection
    if let Some(protected_branch) = protection {
        println!("\n{}", style("2. Checking branch protection...").dim());
        let current = crate::git::current_branch()?;
        if current == protected_branch {
            println!(
                "  {} Pushing directly to '{}'",
                style("[!]").yellow().bold(),
                protected_branch
            );
            warnings.push(format!(
                "Consider using a feature branch and PR instead of pushing to '{}'",
                protected_branch
            ));
        } else {
            println!("  {} Not pushing to protected branch", style("[✓]").green());
        }
    }
    
    // Check 3: Verify upstream configured (for push)
    if operation == "push" {
        println!("\n{}", style("3. Checking upstream configuration...").dim());
        match crate::git::upstream_ref()? {
            Some(upstream) => {
                println!("  {} Upstream: {}", style("[✓]").green(), upstream);
            }
            None => {
                println!(
                    "  {} No upstream configured",
                    style("[!]").yellow().bold()
                );
                warnings.push("Branch has no upstream. Will set with -u flag.".to_string());
            }
        }
    }
    
    // Summary
    println!("\n{}", style("═".repeat(60)).dim());
    
    if !checks_passed {
        println!(
            "{} {}",
            style("[✗]").red().bold(),
            style("Preflight checks FAILED").red().bold()
        );
        anyhow::bail!("Preflight checks failed");
    }
    
    if !warnings.is_empty() {
        println!(
            "{} {} with warnings",
            style("[!]").yellow().bold(),
            style("Preflight checks passed").yellow()
        );
        for warning in warnings {
            println!("  {} {}", style("⚠").yellow(), style(warning).yellow());
        }
    } else {
        println!(
            "{} {}",
            style("[✓]").green().bold(),
            style("All preflight checks passed").green()
        );
    }
    
    Ok(())
}

/// Run scan silently and return issue count
async fn run_safe_scan_silently(all: bool) -> Result<usize> {
    let files_output = if all {
        run_git(&["ls-files"])?
    } else {
        run_git(&["diff", "--cached", "--name-only"])?
    };
    
    let files: Vec<_> = files_output.lines()
        .filter(|l| !l.trim().is_empty())
        .collect();
    
    if files.is_empty() {
        return Ok(0);
    }
    
    let mut issue_count = 0;
    let mut risky_files = HashSet::new();
    
    // Check risky file names
    for file in &files {
        let file_name = file.to_lowercase();
        for risky_pattern in RISKY_FILES {
            let pattern_lower = risky_pattern.to_lowercase();
            if pattern_lower.contains('*') {
                let pattern_parts: Vec<&str> = pattern_lower.split('*').collect();
                if pattern_parts.len() == 2 {
                    if file_name.starts_with(pattern_parts[0]) && file_name.ends_with(pattern_parts[1]) {
                        risky_files.insert(file.to_string());
                        break;
                    }
                }
            } else if file_name.contains(&pattern_lower) || file_name.ends_with(&pattern_lower) {
                risky_files.insert(file.to_string());
                break;
            }
        }
    }
    
    issue_count += risky_files.len();
    
    // Compile patterns
    let patterns: Vec<_> = SECRET_PATTERNS.iter()
        .filter_map(|(pattern, _)| Regex::new(pattern).ok())
        .collect();
    
    // Scan contents
    for file in &files {
        if file.ends_with(".png") || file.ends_with(".jpg") || file.ends_with(".gif") 
            || file.ends_with(".pdf") || file.ends_with(".zip") || file.ends_with(".exe") {
            continue;
        }
        
        if let Ok(content) = std::fs::read_to_string(file) {
            for regex in &patterns {
                for line in content.lines() {
                    if regex.is_match(line) {
                        issue_count += 1;
                        break;
                    }
                }
            }
        }
    }
    
    Ok(issue_count)
}
