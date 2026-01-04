use anyhow::{Context, Result};
use console::style;
use serde::{Deserialize, Serialize};
use std::time::Duration;

enum CliStartError {
    Connect(reqwest::Error),
    Other(anyhow::Error),
}

async fn try_start(client: &reqwest::Client, base_url: &str, paths: &[&str]) -> std::result::Result<String, CliStartError> {
    let mut last_other: Option<anyhow::Error> = None;

    for path in paths {
        let url = format!("{}{}", base_url.trim_end_matches('/'), path);
        let resp = match client.get(&url).send().await {
            Ok(r) => r,
            Err(e) => {
                if e.is_connect() || e.is_timeout() {
                    return Err(CliStartError::Connect(e));
                }
                last_other = Some(anyhow::anyhow!(e).context("Failed to call /auth/cli/start"));
                continue;
            }
        };

        let status = resp.status();
        let text = resp
            .text()
            .await
            .context("Failed to read /auth/cli/start response")
            .map_err(CliStartError::Other)?;

        if status.is_success() {
            return Ok(text);
        }

        if status == reqwest::StatusCode::NOT_FOUND {
            continue;
        }

        return Err(CliStartError::Other(anyhow::anyhow!(
            "Server returned {}: {}",
            status,
            text
        )));
    }

    Err(CliStartError::Other(
        last_other.unwrap_or_else(|| anyhow::anyhow!("No compatible /auth/cli/start endpoint found")),
    ))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CliStartResponse {
    device_code: String,
    user_code: String,
    verification_url: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CliPollBody {
    device_code: String,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum CliPollResponse {
    AuthorizationPending { interval: u64 },
    Expired,
    Ok { access_token: String, expires_in: u64 },
}

pub(crate) async fn run_login_flow(server: Option<String>) -> Result<()> {
    println!("{}", style("[orca login]").bold().cyan());

    let mut config = crate::config::load_config().unwrap_or_default();

    if let Some(s) = server {
        config.api.orca_base_url = Some(s);
    }

    let base_url = crate::config::get_orca_base_url().or_else(|_| {
        config
            .api
            .orca_base_url
            .clone()
            .ok_or_else(|| anyhow::anyhow!("Missing Orca server URL. Set ORCA_API_BASE_URL or run: orca login --server <URL>"))
    })?;

    let current_base_url = base_url.clone();
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(2))
        .timeout(Duration::from_secs(10))
        .build()
        .context("Failed to build HTTP client")?;

    let start_paths = ["/api/v1/auth/cli/start", "/auth/cli/start"];
    let poll_paths = ["/api/v1/auth/cli/poll", "/auth/cli/poll"];
    
    // Try primary URL, then fallback if needed
    let (working_url, text) = match try_start(&client, &current_base_url, &start_paths).await {
        Ok(text) => (current_base_url, text),
        Err(e) => {
            let is_localhost =
                current_base_url.contains("localhost") || current_base_url.contains("127.0.0.1");
            if matches!(e, CliStartError::Connect(_)) && is_localhost {
                let fallback_urls = [
                    current_base_url
                        .replace("localhost", "host.docker.internal")
                        .replace("127.0.0.1", "host.docker.internal"),
                    current_base_url
                        .replace("localhost", "host.containers.internal")
                        .replace("127.0.0.1", "host.containers.internal"),
                    current_base_url
                        .replace("localhost", "172.17.0.1")
                        .replace("127.0.0.1", "172.17.0.1"),
                ];

                let mut successful: Option<(String, String)> = None;
                let mut last_connect: Option<(String, reqwest::Error)> = None;

                for fallback_url in fallback_urls {
                    println!(
                        "{}",
                        style(format!(
                            "Connection to {} failed. Retrying with {}...",
                            current_base_url, fallback_url
                        ))
                        .yellow()
                    );

                    match try_start(&client, &fallback_url, &start_paths).await {
                        Ok(text) => {
                            successful = Some((fallback_url, text));
                            break;
                        }
                        Err(CliStartError::Connect(err)) => {
                            last_connect = Some((fallback_url, err));
                            continue;
                        }
                        Err(CliStartError::Other(err)) => return Err(err),
                    }
                }

                if let Some((working_url, text)) = successful {
                    (working_url, text)
                } else {
                    let helpful_msg = format!(
                        "Failed to connect to Orca server at {}.\n\
                         Tried container host aliases: host.docker.internal, host.containers.internal, 172.17.0.1\n\
                         Possible causes:\n\
                         1. The server is not running (expected on port 8000).\n\
                         2. You are using the wrong port/URL.\n\
                         3. You are running in a container and trying to access a host-local server.\n\
                         4. The server may be using an API prefix (e.g. API_PREFIX=api/v1).\n\
                         If you are using Docker on Linux, ensure your devcontainer adds: `--add-host=host.docker.internal:host-gateway`\n\
                         Or set `ORCA_API_BASE_URL` to a reachable URL.",
                        current_base_url
                    );
                    if let Some((last_url, last_err)) = last_connect {
                        return Err(anyhow::anyhow!(last_err)
                            .context(format!("Last attempted URL: {}", last_url))
                            .context(helpful_msg));
                    }

                    let connect_err = match e {
                        CliStartError::Connect(e) => e,
                        CliStartError::Other(err) => return Err(err),
                    };
                    return Err(anyhow::anyhow!(connect_err).context(helpful_msg));
                }
            } else {
                return match e {
                    CliStartError::Connect(e) => Err(anyhow::anyhow!(e).context("Failed to call /auth/cli/start")),
                    CliStartError::Other(err) => Err(err),
                };
            }
        }
    };
    
    // Update base_url to the one that worked, so it gets saved to config later
    let base_url = working_url;

    let start: CliStartResponse = serde_json::from_str(&text)
        .with_context(|| format!("Failed to parse /auth/cli/start response: {}", text))?;

    println!(
        "{} {}",
        style("User code:").cyan().bold(),
        style(&start.user_code).bold().yellow()
    );
    println!(
        "{} {}",
        style("Open this URL to login and approve:").cyan().bold(),
        style(&start.verification_url).cyan()
    );

    try_open_browser(&start.verification_url);

    let poll_urls: Vec<String> = poll_paths
        .iter()
        .map(|p| format!("{}{}", base_url.trim_end_matches('/'), p))
        .collect();
    let device_code = start.device_code.clone();

    let deadline = std::time::Instant::now() + Duration::from_secs(start.expires_in);
    let mut interval = Duration::from_secs(start.interval.max(1));

    loop {
        if std::time::Instant::now() > deadline {
            anyhow::bail!("Login expired. Please run `orca login` again.");
        }

        let body = CliPollBody {
            device_code: device_code.clone(),
        };

        let mut last_err: Option<anyhow::Error> = None;
        let mut text: Option<String> = None;
        for poll_url in &poll_urls {
            match client
                .post(poll_url)
                .json(&body)
                .send()
                .await
            {
                Ok(resp) => {
                    let status = resp.status();
                    let resp_text = resp
                        .text()
                        .await
                        .context("Failed to read /auth/cli/poll response")?;
                    if status.is_success() {
                        text = Some(resp_text);
                        break;
                    }
                    last_err = Some(anyhow::anyhow!("Server returned {}: {}", status, resp_text));
                }
                Err(e) => {
                    last_err = Some(anyhow::anyhow!(e).context("Failed to call /auth/cli/poll"));
                }
            }
        }

        let text = match text {
            Some(t) => t,
            None => return Err(last_err.unwrap_or_else(|| anyhow::anyhow!("Failed to call /auth/cli/poll"))),
        };

        let poll: CliPollResponse = serde_json::from_str(&text)
            .with_context(|| format!("Failed to parse /auth/cli/poll response: {}", text))?;

        match poll {
            CliPollResponse::AuthorizationPending { interval: i } => {
                interval = Duration::from_secs(i.max(1));
                tokio::time::sleep(interval).await;
            }
            CliPollResponse::Expired => {
                anyhow::bail!("Login expired. Please run `orca login` again.");
            }
            CliPollResponse::Ok { access_token, .. } => {
                config.api.provider = "orca".to_string();
                config.api.orca_base_url = Some(base_url);
                config.api.orca_token = Some(access_token);
                crate::config::save_config(&config)?;

                println!(
                    "{} {}",
                    style("[✓]").green().bold(),
                    style("Logged in. Token saved to config.").green()
                );
                return Ok(());
            }
        }
    }
}

fn try_open_browser(url: &str) {
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", url])
            .spawn();
    }

    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(url).spawn();
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let _ = std::process::Command::new("xdg-open").arg(url).spawn();
    }
}
