use clap::{Parser, Subcommand};
use std::path::PathBuf;

fn default_model() -> String {
    "gemini-2.5-flash".to_string()
}

fn default_base_branch() -> String {
    "main".to_string()
}

#[derive(Parser, Debug)]
#[command(name = "orca")]
#[command(about = "AI-powered Git workflow automation and commit management", long_about = None)]
#[command(disable_version_flag = true, arg_required_else_help = true)]
pub(crate) struct Cli {
    #[arg(long, short = 'V', action = clap::ArgAction::SetTrue, global = true)]
    pub(crate) version: bool,

    #[arg(long, short = 'y', action = clap::ArgAction::SetTrue, global = true)]
    pub(crate) yes: bool,

    #[arg(long, action = clap::ArgAction::SetTrue, global = true)]
    pub(crate) yes_pr: bool,
    #[command(subcommand)]
    pub(crate) command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
pub(crate) enum Commands {
    // ============ CORE COMMANDS ============
    #[command(next_help_heading = "Core Commands")]
    /// Create AI-grouped commits from changes
    Commit {
        /// Generate plan only without committing (equivalent to old 'plan' command)
        #[arg(long, conflicts_with_all = ["from_plan", "confirm"])]
        plan_only: bool,

        /// Apply commits from a previously generated plan file (equivalent to old 'apply' command)
        #[arg(long, value_name = "FILE", conflicts_with = "plan_only")]
        from_plan: Option<PathBuf>,

        /// Show proposed commit groups and ask for confirmation before running git commands
        #[arg(long, default_value_t = true)]
        confirm: bool,

        /// Do not run any git commands (prints the plan only)
        #[arg(long, default_value_t = false)]
        dry_run: bool,

        /// Model name for AI (used when generating new plan)
        #[arg(long, default_value_t = default_model())]
        model: String,

        /// Print JSON only (when using --plan-only)
        #[arg(long, default_value_t = false, requires = "plan_only")]
        json_only: bool,

        /// Write JSON plan to a file (when using --plan-only)
        #[arg(long, requires = "plan_only")]
        out: Option<PathBuf>,

        /// After committing, prompt to git push (when using --from-plan)
        #[arg(long, default_value_t = false, requires = "from_plan")]
        push: bool,

        /// Professional GitHub flow: create/switch to a feature branch, push -u, and create PR (when using --from-plan)
        #[arg(long, default_value_t = false, requires = "from_plan")]
        publish: bool,

        /// Branch name to use when --publish is set (e.g. feat/my-change)
        #[arg(long, requires = "publish")]
        branch: Option<String>,

        /// Base branch for PR when --publish is set (default: main)
        #[arg(long, default_value_t = default_base_branch(), requires = "publish")]
        base: String,

        /// Create PR via GitHub CLI (gh) when --publish is set
        #[arg(long, default_value_t = true, requires = "publish")]
        pr: bool,
    },

    #[command(next_help_heading = "Core Commands")]
    /// Push commits and create PR (supports single PR or stacked PRs)
    Publish {
        /// Branch name to use (e.g. feat/my-change). If omitted, derived from the latest commit message.
        #[arg(short, long)]
        branch: Option<String>,

        /// Base branch for PR (default: main)
        #[arg(short = 'b', long, default_value_t = default_base_branch())]
        base: String,

        /// Skip creating PR (only push branch)
        #[arg(long = "no-pr")]
        no_pr: bool,

        /// Workflow mode: "single" (all commits in one PR) or "stack" (one PR per commit)
        #[arg(short, long)]
        mode: Option<String>,

        /// Interactively select specific commits to publish (default: all commits)
        #[arg(short = 's', long)]
        select: bool,
    },

    #[command(next_help_heading = "Core Commands")]
    /// Setup local git identity and check required tools (gh)
    Setup {
        /// Provider to configure or switch to (gemini, openai, zai, deepseek)
        #[arg(long)]
        provider: Option<String>,

        /// API key for the provider
        #[arg(long)]
        api_key: Option<String>,

        /// Git user.name
        #[arg(long)]
        name: Option<String>,

        /// Git user.email
        #[arg(long)]
        email: Option<String>,

        /// Write config to this repo only (default: global)
        #[arg(long, default_value_t = false)]
        local: bool,
    },

    // ============ WORKFLOW COMMANDS ============
    #[command(next_help_heading = "Workflow Commands")]
    /// Workflow orchestration (start/finish feature flows)
    #[command(alias = "fl", subcommand)]
    Flow(FlowCommands),

    #[command(next_help_heading = "Workflow Commands")]
    /// Branch management
    #[command(alias = "br", subcommand)]
    Branch(BranchCommands),

    #[command(next_help_heading = "Workflow Commands")]
    /// Clean up commit history (rebase, squash, fixup, amend)
    #[command(alias = "td", subcommand)]
    Tidy(TidyCommands),

    // ============ ADVANCED COMMANDS ============
    #[command(next_help_heading = "Advanced Commands")]
    /// Git wrapper with enhanced output
    #[command(alias = "g", subcommand)]
    Git(GitCommands),

    #[command(next_help_heading = "Advanced Commands")]
    /// Stacked branch workflows
    #[command(alias = "sk", subcommand)]
    Stack(StackCommands),

    #[command(next_help_heading = "Advanced Commands")]
    /// Conflict resolution helpers
    #[command(alias = "cf", subcommand)]
    Conflict(ConflictCommands),

    #[command(next_help_heading = "Advanced Commands")]
    /// Release and tag management
    #[command(alias = "rl", subcommand)]
    Release(ReleaseCommands),

    #[command(next_help_heading = "Advanced Commands")]
    /// Git safety checks (secret scanning, preflight)
    #[command(subcommand)]
    Safe(SafeCommands),

    // ============ UTILITY COMMANDS ============
    #[command(next_help_heading = "Utility Commands")]
    /// Login via browser to obtain CLI token
    Login,

    #[command(next_help_heading = "Utility Commands")]
    /// Interactive menu for account management
    Menu,

    #[command(next_help_heading = "Utility Commands")]
    /// Check environment (git repo, working tree, API key)
    Doctor,

    #[command(next_help_heading = "Utility Commands")]
    /// Check for updates and auto-upgrade
    Update,

    // ============ BACKWARD COMPATIBILITY (HIDDEN) ============
    #[command(hide = true, alias = "publish-current")]
    /// (Deprecated: use 'publish' instead) Publish current commits
    PublishCurrent {
        #[arg(short, long)]
        branch: Option<String>,
        #[arg(short = 'b', long, default_value_t = default_base_branch())]
        base: String,
        #[arg(long = "no-pr")]
        no_pr: bool,
        #[arg(short, long)]
        mode: Option<String>,
        #[arg(short = 's', long)]
        select: bool,
    },

    #[command(hide = true)]
    /// (Deprecated: use 'commit --plan-only' instead) Generate a commit plan
    Plan {
        #[arg(long, default_value_t = default_model())]
        model: String,
        #[arg(long, default_value_t = false)]
        json_only: bool,
        #[arg(long)]
        out: Option<PathBuf>,
    },

    #[command(hide = true)]
    /// (Deprecated: use 'commit --from-plan' instead) Apply a plan JSON file
    Apply {
        #[arg(long)]
        file: PathBuf,
        #[arg(long, default_value_t = true)]
        confirm: bool,
        #[arg(long, default_value_t = false)]
        dry_run: bool,
        #[arg(long, default_value_t = false)]
        push: bool,
        #[arg(long, default_value_t = false)]
        publish: bool,
        #[arg(long)]
        branch: Option<String>,
        #[arg(long, default_value_t = default_base_branch())]
        base: String,
        #[arg(long, default_value_t = true)]
        pr: bool,
    },
}

#[derive(Subcommand, Debug)]
pub(crate) enum GitCommands {
    /// Show working tree status with enhanced output
    #[command(alias = "st")]
    Status,

    /// Show commit logs
    #[command(alias = "lg")]
    Log {
        /// Number of commits to show
        #[arg(long, short = 'n')]
        n: Option<u32>,

        /// Show in oneline format
        #[arg(long)]
        oneline: bool,

        /// Show commit graph
        #[arg(long)]
        graph: bool,

        /// Show commits since date (e.g., "2024-01-01", "1 week ago")
        #[arg(long)]
        since: Option<String>,
    },

    /// Sync with remote (fetch + merge/rebase)
    Sync {
        /// Use rebase instead of merge
        #[arg(long, default_value_t = false)]
        rebase: bool,
    },
}

#[derive(Subcommand, Debug)]
pub(crate) enum BranchCommands {
    /// Show current branch with status
    Current,

    /// List branches
    List {
        /// Show remote branches
        #[arg(long, short = 'r', default_value_t = false)]
        remote: bool,
    },

    /// Create new branch with naming convention
    New {
        /// Branch type (feat, fix, chore, hotfix, release)
        #[arg(value_name = "TYPE")]
        branch_type: String,

        /// Branch name (e.g., user-authentication)
        #[arg(value_name = "NAME")]
        name: String,

        /// Base branch to create from
        #[arg(long)]
        base: Option<String>,
    },

    /// Publish branch to remote with upstream tracking
    Publish,
}

#[derive(Subcommand, Debug)]
pub(crate) enum FlowCommands {
    /// Start a new feature/fix/chore flow
    Start {
        /// Flow type (feat, fix, chore, hotfix, release)
        #[arg(long)]
        r#type: Option<String>,

        /// Flow name (e.g., user-authentication)
        #[arg(long)]
        name: Option<String>,

        /// Base branch to create from (default: current branch)
        #[arg(long)]
        base: Option<String>,
    },

    /// Finish current flow (optionally push and create PR)
    Finish {
        /// Push to remote after finishing
        #[arg(long, default_value_t = false)]
        push: bool,

        /// Create PR after pushing (requires --push)
        #[arg(long, default_value_t = true)]
        pr: bool,
    },
}

#[derive(Subcommand, Debug)]
pub(crate) enum TidyCommands {
    /// Interactive rebase with autosquash
    Rebase {
        /// Rebase onto specific branch
        #[arg(long)]
        onto: Option<String>,

        /// Use autosquash
        #[arg(long, default_value_t = true)]
        autosquash: bool,
    },

    /// Squash all commits on current branch into one
    Squash {
        /// Base branch (commits between base and HEAD will be squashed)
        #[arg(long)]
        base: Option<String>,
    },

    /// Create a fixup commit for a specific commit
    Fixup {
        /// Commit hash to create fixup for
        commit: String,
    },

    /// Amend the last commit safely
    Amend {
        /// Don't edit commit message
        #[arg(long, default_value_t = false)]
        no_edit: bool,
    },
}

#[derive(Subcommand, Debug)]
pub(crate) enum ConflictCommands {
    /// Show conflicted files and current state
    Status,

    /// Show step-by-step conflict resolution guide
    Guide {
        /// Use AI to explain conflicts (future)
        #[arg(long, default_value_t = false)]
        ai: bool,
    },

    /// Continue rebase/merge after resolving conflicts
    Continue,

    /// Abort rebase/merge
    Abort,
}

#[derive(Subcommand, Debug)]
pub(crate) enum ReleaseCommands {
    /// Create a git tag
    Tag {
        /// Version number (e.g., 1.0.0 or v1.0.0)
        version: String,

        /// Tag message
        #[arg(long)]
        message: Option<String>,

        /// Push tag to remote
        #[arg(long, default_value_t = false)]
        push: bool,
    },

    /// Generate release notes from commits
    Notes {
        /// Starting ref (default: latest tag)
        #[arg(long)]
        from: Option<String>,

        /// Ending ref (default: HEAD)
        #[arg(long)]
        to: Option<String>,

        /// Use AI to generate release notes
        #[arg(long, default_value_t = true)]
        ai: bool,
    },

    /// Create GitHub release (requires gh CLI)
    Create {
        /// Version number
        version: String,

        /// Path to release notes file
        #[arg(long)]
        notes: Option<String>,

        /// Use AI to generate release notes
        #[arg(long, default_value_t = true)]
        ai: bool,
    },
}

#[derive(Subcommand, Debug)]
pub(crate) enum StackCommands {
    /// Create a child branch based on current branch
    Start {
        /// New branch name
        branch: String,
    },

    /// Show stack relationships
    List,

    /// Rebase stack when base branch moves
    Rebase {
        /// Rebase onto specific branch (default: parent branch)
        #[arg(long)]
        onto: Option<String>,
    },

    /// Publish stack branches in order
    Publish {
        /// Create PRs for each branch
        #[arg(long, default_value_t = true)]
        pr: bool,
    },
}

#[derive(Subcommand, Debug)]
pub(crate) enum SafeCommands {
    /// Scan staged files for secrets and sensitive data
    Scan {
        /// Scan all files instead of just staged
        #[arg(long, default_value_t = false)]
        all: bool,
    },

    /// Run preflight checks before push/tag/release
    Preflight {
        /// Operation being performed
        #[arg(long, default_value = "push")]
        operation: String,

        /// Protected branch to check against
        #[arg(long)]
        protection: Option<String>,
    },
}

#[cfg(test)]
mod tests {
    use super::{Cli, Commands};
    use clap::Parser;

    #[test]
    fn parses_version_flag_without_subcommand() {
        let cli = Cli::try_parse_from(["orca", "--version"]).expect("should parse");
        assert!(cli.version);
        assert!(cli.command.is_none());
    }

    #[test]
    fn parses_plan_subcommand_and_out() {
        let cli = Cli::try_parse_from(["orca", "plan", "--out", "plan.json"]).expect("should parse");
        match cli.command.expect("expected subcommand") {
            Commands::Plan { model, json_only, out } => {
                assert_eq!(model, "gemini-2.5-flash");
                assert!(!json_only);
                assert_eq!(out.unwrap().to_string_lossy(), "plan.json");
            }
            _ => panic!("expected Plan"),
        }
    }

    #[test]
    fn parses_apply_subcommand_with_file_and_flags() {
        let cli = Cli::try_parse_from([
            "orca",
            "apply",
            "--file",
            "plan.json",
            "--dry-run",
            "--push",
        ])
        .expect("should parse");

        match cli.command.expect("expected subcommand") {
            Commands::Apply {
                file,
                confirm,
                dry_run,
                push,
                publish,
                ..
            } => {
                assert_eq!(file.to_string_lossy(), "plan.json");
                assert!(confirm);
                assert!(dry_run);
                assert!(push);
                assert!(!publish);
            }
            _ => panic!("expected Apply"),
        }
    }
}
