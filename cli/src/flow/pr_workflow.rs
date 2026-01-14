use anyhow::Result;
use console::style;
use dialoguer::Select;

#[derive(Debug, Clone, PartialEq)]
pub enum PrWorkflowMode {
    Single,  // One PR with all commits
    Stack,   // Multiple chained PRs
}

impl PrWorkflowMode {
    pub fn as_str(&self) -> &str {
        match self {
            PrWorkflowMode::Single => "single",
            PrWorkflowMode::Stack => "stack",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "single" => Some(PrWorkflowMode::Single),
            "stack" => Some(PrWorkflowMode::Stack),
            _ => None,
        }
    }
}

/// Prompt user to select workflow mode
pub fn prompt_workflow_mode(num_commits: usize) -> Result<PrWorkflowMode> {
    if num_commits <= 1 {
        return Ok(PrWorkflowMode::Single);
    }

    println!();
    println!(
        "{} {}",
        style("Found").cyan().bold(),
        style(format!("{} commits to publish", num_commits)).cyan()
    );
    println!();

    let options = vec![
        format!("📦 Single PR - All {} commits in one pull request", num_commits),
        format!("🔗 Stack workflow - {} separate PRs (chained)", num_commits),
    ];

    let selection = Select::new()
        .with_prompt("How would you like to publish?")
        .items(&options)
        .default(0)
        .interact()?;

    match selection {
        0 => Ok(PrWorkflowMode::Single),
        1 => Ok(PrWorkflowMode::Stack),
        _ => Ok(PrWorkflowMode::Single),
    }
}

/// Information for a single PR in a stack
#[derive(Debug, Clone)]
pub struct StackPr {
    pub branch_name: String,
    pub title: String,
    pub commit_message: String,
    pub base_branch: String,
    pub part_number: usize,
    pub total_parts: usize,
}

/// Sanitize commit message to create valid branch name
fn sanitize_branch_name(commit: &str) -> String {
    // Remove conventional commit prefix if present
    let without_prefix = if let Some((_, rest)) = commit.split_once(':') {
        rest.trim()
    } else {
        commit
    };

    // Convert to lowercase and replace special chars with hyphens
    let mut slug = without_prefix.to_lowercase();
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

    // Remove consecutive hyphens
    while slug.contains("--") {
        slug = slug.replace("--", "-");
    }

    slug = slug.trim_matches('-').to_string();

    // Limit length
    if slug.len() > 40 {
        slug.truncate(40);
        slug = slug.trim_matches('-').to_string();
    }

    if slug.is_empty() {
        slug = "change".to_string();
    }

    slug
}

/// Create a plan for stack workflow
pub fn create_stack_plan(commits: Vec<String>, base: &str) -> Result<Vec<StackPr>> {
    let total = commits.len();
    let mut stack = Vec::new();

    for (idx, commit) in commits.iter().enumerate() {
        let part_num = idx + 1;
        let slug = sanitize_branch_name(commit);
        
        let branch = format!("stack/{}-{}", slug, part_num);

        let base_for_this = if idx == 0 {
            base.to_string()
        } else {
            stack[idx - 1].branch_name.clone()
        };

        stack.push(StackPr {
            branch_name: branch,
            title: format!("Part {}/{}: {}", part_num, total, commit),
            commit_message: commit.clone(),
            base_branch: base_for_this,
            part_number: part_num,
            total_parts: total,
        });
    }

    Ok(stack)
}

/// Add stack navigation info to PR description
pub fn add_stack_info_to_description(
    description: &str,
    pr: &StackPr,
    previous_pr_url: Option<&str>,
    next_pr_url: Option<&str>,
) -> String {
    let mut result = description.to_string();

    // Add stack navigation section at the top
    let mut stack_section = format!("\n---\n\n## 📚 Stack Information\n\n");
    stack_section.push_str(&format!(
        "**Part {}/{}** in this PR stack\n\n",
        pr.part_number, pr.total_parts
    ));

    if let Some(prev) = previous_pr_url {
        stack_section.push_str(&format!("⬅️ **Previous**: {}\n\n", prev));
    }

    if let Some(next) = next_pr_url {
        stack_section.push_str(&format!("➡️ **Next**: {}\n\n", next));
    }

    stack_section.push_str("---\n\n");

    // Insert at the beginning
    result.insert_str(0, &stack_section);
    result
}
