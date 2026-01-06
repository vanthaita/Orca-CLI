use clap::{Parser, Subcommand};
use std::path::PathBuf;

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
    /// Analyze changes and create grouped commits
    Commit {
        /// Show proposed commit groups and ask for confirmation before running git commands
        #[arg(long, default_value_t = true)]
        confirm: bool,

        /// Do not run any git commands (prints the plan only)
        #[arg(long, default_value_t = false)]
        dry_run: bool,

        /// Gemini model name (used when no plan file is provided)
        #[arg(long, default_value = "gemini-2.5-flash")]
        model: String,
    },

    /// Generate a commit plan (no git add/commit)
    Plan {
        /// Gemini model name
        #[arg(long, default_value = "gemini-2.5-flash")]
        model: String,

        /// Print JSON only
        #[arg(long, default_value_t = false)]
        json_only: bool,

        /// Write JSON plan to a file
        #[arg(long)]
        out: Option<PathBuf>,
    },

    /// Apply a previously generated plan JSON file
    Apply {
        /// Path to plan JSON file
        #[arg(long)]
        file: PathBuf,

        /// Ask for confirmation before running git commands
        #[arg(long, default_value_t = true)]
        confirm: bool,

        /// Do not run any git commands (prints the plan only)
        #[arg(long, default_value_t = false)]
        dry_run: bool,

        /// After committing, prompt to git push (Enter = push)
        #[arg(long, default_value_t = false)]
        push: bool,

        /// Professional GitHub flow: create/switch to a feature branch, push -u, and propose creating a PR
        #[arg(long, default_value_t = false)]
        publish: bool,

        /// Branch name to use when --publish is set (e.g. feat/my-change)
        #[arg(long)]
        branch: Option<String>,

        /// Base branch for PR when --publish is set (default: main)
        #[arg(long, default_value = "main")]
        base: String,

        /// Create PR via GitHub CLI (gh) when --publish is set (if gh is not available, a URL will be printed)
        #[arg(long, default_value_t = true)]
        pr: bool,
    },

    /// Publish current commits: create/switch branch, push -u, and create PR
    PublishCurrent {
        /// Branch name to use (e.g. feat/my-change). If omitted, derived from the latest commit message.
        #[arg(long)]
        branch: Option<String>,

        /// Base branch for PR (default: main)
        #[arg(long, default_value = "main")]
        base: String,

        /// Create PR via GitHub CLI (gh) (if gh is not available, a URL will be printed)
        #[arg(long, default_value_t = true)]
        pr: bool,
    },

    /// Apply a plan and publish to GitHub (create/switch branch, push -u, create PR)
    Publish {
        /// Path to plan JSON file
        file: PathBuf,

        /// Ask for confirmation before running git commands
        #[arg(long, default_value_t = true)]
        confirm: bool,

        /// Do not run any git commands (prints the plan only)
        #[arg(long, default_value_t = false)]
        dry_run: bool,

        /// Branch name to use (e.g. feat/my-change). If omitted, derived from the first commit message.
        #[arg(long)]
        branch: Option<String>,

        /// Base branch for PR (default: main)
        #[arg(long, default_value = "main")]
        base: String,

        /// Create PR via GitHub CLI (gh) (if gh is not available, a URL will be printed)
        #[arg(long, default_value_t = true)]
        pr: bool,
    },

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

    /// Login via browser to obtain a CLI token (remote Orca server mode)
    Login {
        /// Orca server base URL (e.g. https://api.orcacli.codes)
        #[arg(long)]
        server: Option<String>,
    },

    /// Interactive menu for account management and settings
    Menu,

    /// Check environment (git repo, working tree, API key)
    Doctor,
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
