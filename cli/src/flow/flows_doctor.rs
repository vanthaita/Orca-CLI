use anyhow::Result;
use console::style;

pub(crate) async fn run_doctor_flow() -> Result<()> {
    println!("{}", style("[orca doctor]").bold().cyan());

    // Check Config / Provider
    let config = crate::config::load_config().unwrap_or_default();
    let provider = config.api.provider.clone();
    println!(
        "{} Active Provider: {}",
        style("[*]").blue().bold(),
        style(&provider).cyan()
    );

    if provider == "orca" {
        let base_url = crate::config::get_orca_base_url().unwrap_or_default();
        println!(
             "{} Orca Server URL: {}",
             style("[*]").blue().bold(),
             style(&base_url).cyan()
        );

        let client = reqwest::Client::new();
        // Check if root endpoint is reachable (assuming API Global Prefix might be set)
        // If API_PREFIX is api/v1, then localhost:3000/api/v1/ should return something (e.g. hello)
        // If not, it might return 404, but connection should succeed.
        let check_url = format!("{}/api/v1", base_url.trim_end_matches('/')); 

        match client.get(&check_url).send().await {
            Ok(resp) => {
                if resp.status().is_success() {
                     println!(
                        "{} {}",
                        style("[✓]").green().bold(),
                        style("Orca Server is reachable").green()
                    );
                } else {
                     println!(
                        "{} Orca Server reachable but returned status: {}",
                        style("[!]").yellow().bold(),
                        resp.status()
                    );
                }
            }
            Err(e) => {
                 println!(
                    "{} Failed to connect to Orca Server ({})\n    {}",
                    style("[x]").red().bold(),
                    base_url,
                    style(e).red()
                );
            }
        }
    }

    // Check API Key for active provider
    if let Ok(key) = crate::config::get_api_key(&provider) {
        if !key.trim().is_empty() {
            println!(
                "{} {} API Key set",
                style("[✓]").green().bold(),
                provider
            );
        } else {
            println!(
                "{} {} API Key is empty",
                style("[!]").yellow().bold(),
                provider
            );
        }
    } else {
        println!(
            "{} {} API Key missing",
            style("[!]").yellow().bold(),
            provider
        );
    }

    if let Err(e) = crate::git::ensure_git_repo() {
        println!(
            "{} {}",
            style("Not a git repository:").red().bold(),
            style(format!("FAIL ({e})")).red()
        );
        return Ok(());
    }
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style("Git repository detected").green()
    );

    let status = crate::git::run_git(&["status", "--porcelain"])?;
    if status.trim().is_empty() {
        println!(
            "{} {}",
            style("working tree:").green().bold(),
            style("clean").green()
        );
    } else {
        println!(
            "{} {}",
            style("working tree:").yellow().bold(),
            style("has changes").yellow()
        );
        println!(
            "{} {}",
            style("changed files:").yellow().bold(),
            style(crate::plan::files_from_status_porcelain(&status).len()).yellow()
        );
    }

    Ok(())
}
