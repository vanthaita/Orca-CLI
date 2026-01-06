use crate::flow::flows_spinner::spinner;
use anyhow::{Context, Result};
use console::style;
use indicatif::ProgressBar;
use serde::{Deserialize, Serialize};
use serde::de::DeserializeOwned;
use std::time::Duration;

enum CliStartError {
    Connect(reqwest::Error),
    Other(anyhow::Error),
}

async fn try_start(
    client: &reqwest::Client,
    base_url: &str,
    paths: &[String],
) -> std::result::Result<String, CliStartError> {
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

fn parse_api_json<T: DeserializeOwned>(text: &str) -> Result<T> {
    let value: serde_json::Value = serde_json::from_str(text).context("Failed to parse JSON")?;

    if let Some(data) = value.get("data") {
        return serde_json::from_value::<T>(data.clone()).context("Failed to parse JSON.data");
    }

    serde_json::from_value::<T>(value).context("Failed to parse JSON")
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CliPollBody {
    device_code: String,
    device_name: Option<String>,
    device_fingerprint: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum CliPollResponse {
    AuthorizationPending { interval: u64 },
    SlowDown { interval: u64 },
    Expired,
    Ok { access_token: String, expires_in: u64 },
}

fn get_device_name() -> String {
    hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "cli".to_string())
}

fn generate_device_fingerprint() -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    
    // Include hostname
    if let Ok(hostname) = hostname::get() {
        hostname.hash(&mut hasher);
    }
    
    // Include username
    if let Ok(username) = std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
    {
        username.hash(&mut hasher);
    }
    
    format!("{:x}", hasher.finish())
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

    if !base_url.starts_with("http://") && !base_url.starts_with("https://") {
        anyhow::bail!(
            "Invalid Orca server URL: '{}'. It must be an absolute URL including scheme, e.g. https://api.orcacli.codes",
            base_url
        );
    }

    let current_base_url = base_url.clone();
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(2))
        .timeout(Duration::from_secs(10))
        .build()
        .context("Failed to build HTTP client")?;

    let start_paths = vec![
        format!("/{}/auth/cli/start", crate::config::ORCA_API_PREFIX),
        "/auth/cli/start".to_string(),
    ];
    let poll_paths = vec![
        format!("/{}/auth/cli/poll", crate::config::ORCA_API_PREFIX),
        "/auth/cli/poll".to_string(),
    ];
    
    // Try primary URL, then fallback if needed
    let (working_url, text) = match try_start(&client, &current_base_url, &start_paths).await {
        Ok(text) => (current_base_url, text),
        Err(e) => {
            return match e {
                CliStartError::Connect(e) => Err(anyhow::anyhow!(e).context("Failed to call /auth/cli/start")),
                CliStartError::Other(err) => Err(err),
            };
        }
    };
    
    // Update base_url to the one that worked, so it gets saved to config later
    let base_url = working_url;

    let start: CliStartResponse = parse_api_json(&text)
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

    println!(
        "\n{} {}\n",
        style("!").yellow().bold(),
        style("Please copy the code above and paste it into the browser window.").yellow()
    );

    try_open_browser(&start.verification_url);

    let poll_urls: Vec<String> = poll_paths
        .iter()
        .map(|p| format!("{}{}", base_url.trim_end_matches('/'), p))
        .collect();
    let device_code = start.device_code.clone();
    let device_name = get_device_name();
    let device_fingerprint = generate_device_fingerprint();

    println!(
        "{} {}",
        style("Device:").cyan().bold(),
        style(&device_name).green()
    );

    let deadline = std::time::Instant::now() + Duration::from_secs(start.expires_in);
    let mut interval = Duration::from_secs(start.interval.max(1));

    let pb = spinner("Waiting for approval...");

    loop {
        if std::time::Instant::now() > deadline {
            pb.finish_and_clear();
            anyhow::bail!("Login expired. Please run `orca login` again.");
        }

        let body = CliPollBody {
            device_code: device_code.clone(),
            device_name: Some(device_name.clone()),
            device_fingerprint: Some(device_fingerprint.clone()),
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
            None => {
                pb.finish_and_clear();
                 return Err(last_err.unwrap_or_else(|| anyhow::anyhow!("Failed to call /auth/cli/poll")));
            }
        };

        let poll: CliPollResponse = parse_api_json(&text)
            .with_context(|| format!("Failed to parse /auth/cli/poll response: {}", text))?;

        match poll {
            CliPollResponse::AuthorizationPending { interval: i } => {
                interval = Duration::from_secs(i.max(1));
                tokio::time::sleep(interval).await;
            }
            CliPollResponse::SlowDown { interval: i } => {
                pb.set_message("Slowing down requests...");
                interval = Duration::from_secs(i.max(2));
                tokio::time::sleep(interval).await;
            }
            CliPollResponse::Expired => {
                pb.finish_and_clear();
                anyhow::bail!("Login expired. Please run `orca login` again.");
            }
            CliPollResponse::Ok { access_token, .. } => {
                pb.finish_and_clear();
                config.api.provider = "orca".to_string();
                config.api.orca_base_url = Some(base_url);
                config.api.orca_token = Some(access_token);
                crate::config::save_config(&config)?;

                println!(
                    "{} {}",
                    style("[✓]").green().bold(),
                    style("Logged in successfully.").green()
                );
                println!(
                    "{} Device '{}' registered",
                    style("[✓]").green().bold(),
                    style(&device_name).green().bold()
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
