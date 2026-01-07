mod cli;
mod config;
mod flow;
mod ai;
mod git;
mod plan;
mod ui;
mod api_client;
mod plan_types;
mod plan_guard;

use anyhow::Result;
use clap::Parser;
use crate::flow::flows as flows;

#[tokio::main]
async fn main() {
    if let Err(e) = run().await {
        flows::print_friendly_error(&e);
        std::process::exit(1);
    }
}

async fn run() -> Result<()> {
    let cli = crate::cli::Cli::parse();

    if cli.version {
        crate::ui::version::print_version_table();
        return Ok(());
    }

    let command = cli
        .command
        .expect("clap should require a subcommand unless --version is used");

    match command {
        crate::cli::Commands::Commit {
            confirm,
            dry_run,
            model,
        } => flows::run_commit_flow(confirm, dry_run, &model).await?,
        crate::cli::Commands::Plan {
            model,
            json_only,
            out,
        } => flows::run_plan_flow(&model, json_only, out).await?,
        crate::cli::Commands::PublishCurrent { branch, base, pr } => {
            flows::run_publish_current_flow(branch.as_deref(), &base, pr).await?
        }
        crate::cli::Commands::Apply {
            file,
            confirm,
            dry_run,
            push,
            publish,
            branch,
            base,
            pr,
        } => flows::run_apply_flow(&file, confirm, dry_run, push, publish, branch.as_deref(), &base, pr).await?,
        crate::cli::Commands::Publish {
            file,
            confirm,
            dry_run,
            branch,
            base,
            pr,
        } => {
            flows::run_apply_flow(&file, confirm, dry_run, false, true, branch.as_deref(), &base, pr).await?
        }
        crate::cli::Commands::Setup { provider, api_key, name, email, local } => {
            flows::run_setup_flow(provider, api_key, name, email, local).await?
        }
        crate::cli::Commands::Login => flows::run_login_flow().await?,
        crate::cli::Commands::Menu => flows::run_menu_flow().await?,
        crate::cli::Commands::Doctor => flows::run_doctor_flow().await?,
        crate::cli::Commands::Update => flows::run_update_flow().await?,
        
        // Git wrapper commands
        crate::cli::Commands::Git(git_cmd) => match git_cmd {
            crate::cli::GitCommands::Status => flows::run_git_status_flow().await?,
            crate::cli::GitCommands::Log { n, oneline, graph, since } => {
                flows::run_git_log_flow(n, oneline, graph, since).await?
            }
            crate::cli::GitCommands::Sync { rebase } => {
                flows::run_git_sync_flow(rebase, cli.yes).await?
            }
        },
        
        // Branch management commands
        crate::cli::Commands::Branch(branch_cmd) => match branch_cmd {
            crate::cli::BranchCommands::Current => flows::run_branch_current_flow().await?,
            crate::cli::BranchCommands::List { remote } => {
                flows::run_branch_list_flow(remote).await?
            }
            crate::cli::BranchCommands::New { branch_type, name, base } => {
                flows::run_branch_new_flow(&branch_type, &name, base.as_deref()).await?
            }
            crate::cli::BranchCommands::Publish => {
                flows::run_branch_publish_flow(cli.yes).await?
            }
        },
        
        // Flow orchestration commands
        crate::cli::Commands::Flow(flow_cmd) => match flow_cmd {
            crate::cli::FlowCommands::Start { r#type, name, base } => {
                flows::run_flow_start(r#type.as_deref(), name.as_deref(), base.as_deref()).await?
            }
            crate::cli::FlowCommands::Finish { push, pr } => {
                flows::run_flow_finish(push, pr, cli.yes, cli.yes_pr).await?
            }
        },
        
        // History cleanup (tidy) commands
        crate::cli::Commands::Tidy(tidy_cmd) => match tidy_cmd {
            crate::cli::TidyCommands::Rebase { onto, autosquash } => {
                flows::run_tidy_rebase_flow(onto.as_deref(), autosquash, cli.yes).await?
            }
            crate::cli::TidyCommands::Squash { base } => {
                flows::run_tidy_squash_flow(base.as_deref(), cli.yes).await?
            }
            crate::cli::TidyCommands::Fixup { commit } => {
                flows::run_tidy_fixup_flow(commit).await?
            }
            crate::cli::TidyCommands::Amend { no_edit } => {
                flows::run_tidy_amend_flow(no_edit, cli.yes).await?
            }
        },
        
        // Conflict resolution commands
        crate::cli::Commands::Conflict(conflict_cmd) => match conflict_cmd {
            crate::cli::ConflictCommands::Status => flows::run_conflict_status_flow().await?,
            crate::cli::ConflictCommands::Guide { ai } => {
                flows::run_conflict_guide_flow(ai).await?
            }
            crate::cli::ConflictCommands::Continue => flows::run_conflict_continue_flow().await?,
            crate::cli::ConflictCommands::Abort => flows::run_conflict_abort_flow(cli.yes).await?,
        },
        
        // Release and tag commands
        crate::cli::Commands::Release(release_cmd) => match release_cmd {
            crate::cli::ReleaseCommands::Tag { version, message, push } => {
                flows::run_release_tag_flow(version, message.as_deref(), push, cli.yes).await?
            }
            crate::cli::ReleaseCommands::Notes { from, to, ai } => {
                flows::run_release_notes_flow(from.as_deref(), to.as_deref(), ai).await?
            }
            crate::cli::ReleaseCommands::Create { version, notes, ai } => {
                flows::run_release_create_flow(version, notes.as_deref(), ai, cli.yes).await?
            }
        },
        
        // Stacked branches commands
        crate::cli::Commands::Stack(stack_cmd) => match stack_cmd {
            crate::cli::StackCommands::Start { branch } => {
                flows::run_stack_start_flow(branch, cli.yes).await?
            }
            crate::cli::StackCommands::List => flows::run_stack_list_flow().await?,
            crate::cli::StackCommands::Rebase { onto } => {
                flows::run_stack_rebase_flow(onto.as_deref(), cli.yes).await?
            }
            crate::cli::StackCommands::Publish { pr } => {
                flows::run_stack_publish_flow(pr, cli.yes, cli.yes_pr).await?
            }
        },
        
        // Safety commands
        crate::cli::Commands::Safe(safe_cmd) => match safe_cmd {
            crate::cli::SafeCommands::Scan { all } => {
                flows::run_safe_scan_flow(all).await?
            }
            crate::cli::SafeCommands::Preflight { operation, protection } => {
                flows::run_safe_preflight_flow(operation, protection.as_deref()).await?
            }
        },
    }

    Ok(())
}
