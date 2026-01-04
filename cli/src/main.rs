mod cli;
mod config;
mod flow;
mod ai;
mod git;
mod plan;
mod ui;

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
        crate::cli::Commands::Login { server } => flows::run_login_flow(server).await?,
        crate::cli::Commands::Doctor => flows::run_doctor_flow().await?,
    }

    Ok(())
}
