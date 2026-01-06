use anyhow::{Context, Result};
use console::style;
use dialoguer::Select;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct UserMeResponse {
    email: Option<String>,
    #[serde(alias = "name")]
    full_name: Option<String>,
}

/// Get device name for display
fn get_device_name() -> String {
    hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "unknown".to_string())
}

/// Fetch user information from Orca API
async fn fetch_user_info() -> Result<UserMeResponse> {
    let base_url = crate::config::get_orca_base_url()?;
    let token = crate::config::get_orca_token()?;
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .context("Failed to build HTTP client")?;
    
    let paths = vec![
        format!("/{}/auth/me", crate::config::ORCA_API_PREFIX),
        "/auth/me".to_string(),
    ];
    
    let mut last_err = None;
    for path in paths {
        let url = format!("{}{}", base_url.trim_end_matches('/'), path);
        
        match client
            .get(&url)
            .bearer_auth(&token)
            .send()
            .await
        {
            Ok(resp) => {
                if resp.status().is_success() {
                    let text = resp.text().await.context("Failed to read response")?;
                    
                    // Try to parse from .data field first
                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                        if let Some(data) = value.get("data") {
                            if let Ok(user) = serde_json::from_value::<UserMeResponse>(data.clone()) {
                                return Ok(user);
                            }
                        }
                    }
                    
                    // Try direct parse
                    if let Ok(user) = serde_json::from_str::<UserMeResponse>(&text) {
                        return Ok(user);
                    }
                    
                    last_err = Some(anyhow::anyhow!("Failed to parse user info response"));
                } else if resp.status() == reqwest::StatusCode::NOT_FOUND {
                    continue;
                } else {
                    last_err = Some(anyhow::anyhow!("Server returned {}", resp.status()));
                }
            }
            Err(e) => {
                last_err = Some(anyhow::anyhow!(e));
            }
        }
    }
    
    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("Failed to fetch user info")))
}

/// Show account information
async fn show_account_info() -> Result<()> {
    let config = crate::config::load_config()?;
    let device_name = get_device_name();
    
    crate::ui::menu::print_section_header("ACCOUNT INFORMATION");
    println!();
    
    if config.api.provider == "orca" && config.api.orca_token.is_some() {
        // Try to fetch from API
        match fetch_user_info().await {
            Ok(user) => {
                if let Some(email) = user.email {
                    println!("  {} {}", style("📧 Email:").cyan().bold(), style(&email).green());
                }
                
                if let Some(name) = user.full_name {
                    println!("  {} {}", style("👤 Name:").cyan().bold(), style(&name).cyan());
                }
                
                println!("  {} {}", style("💻 Device:").cyan().bold(), style(&device_name).cyan());
                println!("  {} {}", style("🤖 Provider:").cyan().bold(), style(&config.api.provider).green().bold());
                println!();
                crate::ui::menu::print_success("✨ Account data synchronized from server");
            }
            Err(e) => {
                crate::ui::menu::print_warning(&format!("⚠️  Could not fetch account info: {}", e));
                println!();
                println!("  {} {}", style("💻 Device:").cyan().bold(), style(&device_name).cyan());
                println!("  {} {}", style("🤖 Provider:").cyan().bold(), style(&config.api.provider).cyan());
                println!("  {} {}", style("📊 Status:").cyan().bold(), style("Using local configuration").dim());
            }
        }
    } else {
        // Show local config info
        println!("  {} {}", style("💻 Device:").cyan().bold(), style(&device_name).cyan());
        println!("  {} {}", style("🤖 Provider:").cyan().bold(), style(&config.api.provider).cyan().bold());
        println!("  {} {}", style("🔑 Mode:").cyan().bold(), style("Local API Keys").cyan());
        println!();
        
        let has_key = match config.api.provider.as_str() {
            "gemini" => config.api.gemini_api_key.is_some(),
            "openai" => config.api.openai_api_key.is_some(),
            "zai" => config.api.zai_api_key.is_some(),
            "deepseek" => config.api.deepseek_api_key.is_some(),
            _ => false,
        };
        
        if has_key {
            crate::ui::menu::print_success(&format!("✓ {} API key configured", config.api.provider));
        } else {
            crate::ui::menu::print_warning(&format!("⚠️  No {} API key found", config.api.provider));
            println!();
            println!(
                "  {} {}",
                style("💡 Setup:").yellow().bold(),
                style(format!("orca setup --provider {} --api-key YOUR_KEY", config.api.provider)).cyan()
            );
        }
    }
    
    println!();
    Ok(())
}

/// Show configuration
fn show_config() -> Result<()> {
    let config = crate::config::load_config()?;
    crate::ui::menu::print_config_info(&config);
    println!();
    Ok(())
}

/// Switch provider
fn switch_provider() -> Result<()> {
    let mut config = crate::config::load_config()?;
    let current = config.api.provider.clone();
    
    crate::ui::menu::print_section_header("SWITCH AI PROVIDER");
    println!();
    
    let providers = vec![
        ("orca", "🌐 Orca Server", "Remote AI with cloud features"),
        ("gemini", "🧠 Google Gemini", "Local API key required"),
        ("openai", "🤖 OpenAI", "Local API key required"),
        ("zai", "⚡ ZAI", "Local API key required"),
        ("deepseek", "🔍 DeepSeek", "Local API key required"),
    ];
    
    let items: Vec<String> = providers
        .iter()
        .map(|(id, name, desc)| {
            if *id == current {
                format!("{} {} {} {}", 
                    style("●").green().bold(),
                    style(name).green().bold(),
                    style("•").dim(),
                    style(desc).dim()
                )
            } else {
                format!("{} {} {} {}",
                    style("○").dim(),
                    style(name).bold(),
                    style("•").dim(),
                    style(desc).dim()
                )
            }
        })
        .collect();
    
    let selection = Select::new()
        .with_prompt("Choose your AI provider")
        .items(&items)
        .default(providers.iter().position(|(id, _, _)| *id == current).unwrap_or(0))
        .interact()
        .context("Failed to read selection")?;
    
    let (new_provider, _, _) = providers[selection];
    
    println!();
    
    if new_provider == current {
        crate::ui::menu::print_info_line("ℹ️  Info", "Provider unchanged");
    } else {
        config.api.provider = new_provider.to_string();
        crate::config::save_config(&config)?;
        crate::ui::menu::print_success(&format!("Switched to provider: {}", new_provider));
        
        if new_provider != "orca" {
            println!();
            println!(
                "  {} {}",
                style("💡 Next step:").yellow().bold(),
                style(format!("orca setup --provider {} --api-key YOUR_KEY", new_provider)).cyan()
            );
        } else if config.api.orca_token.is_none() {
            println!();
            println!(
                "  {} {}",
                style("💡 Next step:").yellow().bold(),
                style("orca login").cyan()
            );
        }
    }
    
    println!();
    Ok(())
}

/// Logout from Orca
fn logout() -> Result<()> {
    let mut config = crate::config::load_config()?;
    
    if config.api.orca_token.is_none() {
        crate::ui::menu::print_warning("Not logged in to Orca server");
        println!();
        return Ok(());
    }
    
    crate::ui::menu::print_section_header("LOGOUT");
    
    let confirm = dialoguer::Confirm::new()
        .with_prompt("Are you sure you want to logout from Orca?")
        .default(false)
        .interact()
        .context("Failed to read confirmation")?;
    
    if !confirm {
        crate::ui::menu::print_info_line("Info", "Logout cancelled");
        println!();
        return Ok(());
    }
    
    // Clear token
    config.api.orca_token = None;
    
    // Switch to local provider if currently using orca
    if config.api.provider == "orca" {
        config.api.provider = "gemini".to_string();
        crate::ui::menu::print_info_line("Info", "Switched to 'gemini' provider");
    }
    
    crate::config::save_config(&config)?;
    crate::ui::menu::print_success("Logged out successfully");
    
    println!();
    Ok(())
}

/// Main menu flow
pub(crate) async fn run_menu_flow() -> Result<()> {
    loop {
        // Clear screen and show logo
        print!("\x1B[2J\x1B[1;1H"); // ANSI clear screen
        crate::ui::menu::print_orca_logo();
        
        let config = crate::config::load_config().unwrap_or_default();
        let device_name = get_device_name();
        
        // Show device info header
        println!(
            "{}",
            style("═".repeat(50)).dim()
        );
        println!(
            "  {} {} {} {}",
            style("💻").cyan(),
            style("Device:").dim(),
            style(&device_name).cyan().bold(),
            style(format!("({})", std::env::consts::OS)).dim()
        );
        
        // Show authentication status with visual indicator
        let (status_icon, _status_text, status_style) = if config.api.provider == "orca" && config.api.orca_token.is_some() {
            ("🟢", "Connected to Orca Server", style("Connected to Orca Server").green())
        } else {
            ("🔵", "Using Local API Keys", style("Using Local API Keys").cyan())
        };
        
        println!(
            "  {} {} {}",
            status_icon,
            style("Status:").dim(),
            status_style
        );
        
        println!(
            "  {} {} {}",
            style("🤖").cyan(),
            style("Provider:").dim(),
            style(&config.api.provider).cyan().bold()
        );
        
        println!(
            "{}",
            style("═".repeat(50)).dim()
        );
        println!();
        
        // Organize menu into logical sections
        let account_section = style("ACCOUNT").cyan().bold().to_string();
        let settings_section = style("SETTINGS").cyan().bold().to_string();
        let system_section = style("SYSTEM").cyan().bold().to_string();
        
        let menu_items = vec![
            format!("{}  {}", account_section, style("───────────────").dim()),
            format!("  {} Account Information", style("📊").to_string()),
            if config.api.provider == "orca" && config.api.orca_token.is_some() {
                format!("  {} Logout from Orca", style("🚪").to_string())
            } else {
                format!("  {} Login to Orca", style("🔑").to_string())
            },
            format!("\n{}  {}", settings_section, style("───────────────").dim()),
            format!("  {} Switch AI Provider", style("🔄").to_string()),
            format!("  {} View Configuration", style("⚙️ ").to_string()),
            format!("\n{}  {}", system_section, style("───────────────").dim()),
            format!("  {} Exit Menu", style("❌").to_string()),
        ];
        
        let selection = Select::new()
            .with_prompt(style("Select an option").cyan().bold().to_string())
            .items(&menu_items)
            .default(1) // Default to "Account Information"
            .interact_opt()
            .context("Failed to read menu selection")?;
        
        match selection {
            Some(1) => {
                // Account Information
                print!("\x1B[2J\x1B[1;1H");
                crate::ui::menu::print_orca_logo();
                show_account_info().await?;
                wait_for_enter();
            }
            Some(2) => {
                // Logout or Login
                print!("\x1B[2J\x1B[1;1H");
                crate::ui::menu::print_orca_logo();
                if config.api.provider == "orca" && config.api.orca_token.is_some() {
                    logout()?;
                } else {
                    // Trigger login flow
                    println!("{}", style("Starting Orca login...").cyan());
                    println!();
                    if let Err(e) = super::flows_login::run_login_flow(None).await {
                        crate::ui::menu::print_warning(&format!("Login failed: {}", e));
                    } else {
                        crate::ui::menu::print_success("Successfully logged in!");
                    }
                    println!();
                }
                wait_for_enter();
            }
            Some(4) => {
                // Switch Provider
                print!("\x1B[2J\x1B[1;1H");
                crate::ui::menu::print_orca_logo();
                switch_provider()?;
                wait_for_enter();
            }
            Some(5) => {
                // View Configuration
                print!("\x1B[2J\x1B[1;1H");
                crate::ui::menu::print_orca_logo();
                show_config()?;
                wait_for_enter();
            }
            Some(7) | None => {
                // Exit
                print!("\x1B[2J\x1B[1;1H");
                println!();
                println!("  {}", style("╔═══════════════════════════════════════╗").cyan());
                println!("  {}", style("║                                       ║").cyan());
                println!("  {}  {}  {}", 
                    style("║").cyan(),
                    style("Thank you for using ORCA! 🐋").cyan().bold(),
                    style("║").cyan()
                );
                println!("  {}", style("║                                       ║").cyan());
                println!("  {}", style("╚═══════════════════════════════════════╝").cyan());
                println!();
                break;
            }
            _ => {}
        }
    }
    
    Ok(())
}

/// Wait for user to press Enter
fn wait_for_enter() {
    use std::io::{self, BufRead};
    println!();
    println!("{}", style("━".repeat(50)).dim());
    println!("{}", style("Press Enter to return to menu...").dim().italic());
    let stdin = io::stdin();
    let _ = stdin.lock().lines().next();
}
