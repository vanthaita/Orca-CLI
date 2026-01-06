use console::style;

/// Print the ORCA ASCII logo with styling
pub(crate) fn print_orca_logo() {
    let logo = r#"
   ___  ____   ____    _    
  / _ \|  _ \ / ___|  / \   
 | | | | |_) | |     / _ \  
 | |_| |  _ <| |___ / ___ \ 
  \___/|_| \_\\____/_/   \_\
"#;
    
    println!("{}", style(logo).cyan().bold());
}

/// Print a styled section header
pub(crate) fn print_section_header(title: &str) {
    println!("\n{}", style(format!("━━━ {} ━━━", title)).cyan().bold());
}

/// Print a styled info line with label and value
pub(crate) fn print_info_line(label: &str, value: &str) {
    println!(
        "  {} {}",
        style(format!("{}:", label)).dim(),
        style(value).cyan()
    );
}

/// Print a styled success message
pub(crate) fn print_success(message: &str) {
    println!(
        "{} {}",
        style("[✓]").green().bold(),
        style(message).green()
    );
}

/// Print a styled warning message
pub(crate) fn print_warning(message: &str) {
    println!(
        "{} {}",
        style("[!]").yellow().bold(),
        style(message).yellow()
    );
}

/// Mask an API key/token, showing only first and last few characters
pub(crate) fn mask_token(token: &str) -> String {
    if token.len() <= 8 {
        return "***".to_string();
    }
    
    let start = &token[..4];
    let end = &token[token.len() - 4..];
    format!("{}...{}", start, end)
}

/// Print account information in a formatted way
#[allow(dead_code)]
pub(crate) fn print_account_info(email: Option<&str>, device_name: &str, provider: &str) {
    print_section_header("ACCOUNT INFORMATION");
    
    if let Some(email) = email {
        print_info_line("Email", email);
    } else {
        print_info_line("Email", "Not available");
    }
    
    print_info_line("Device", device_name);
    print_info_line("Provider", provider);
}

/// Print configuration information
pub(crate) fn print_config_info(config: &crate::config::OrcaConfig) {
    print_section_header("CONFIGURATION");
    
    print_info_line("Active Provider", &config.api.provider);
    
    if let Some(ref url) = config.api.orca_base_url {
        print_info_line("Orca Server", url);
    }
    
    if let Some(ref token) = config.api.orca_token {
        print_info_line("Orca Token", &mask_token(token));
    }
    
    if let Some(ref key) = config.api.gemini_api_key {
        print_info_line("Gemini API Key", &mask_token(key));
    }
    
    if let Some(ref key) = config.api.openai_api_key {
        print_info_line("OpenAI API Key", &mask_token(key));
    }
    
    if let Some(ref key) = config.api.zai_api_key {
        print_info_line("ZAI API Key", &mask_token(key));
    }
    
    if let Some(ref key) = config.api.deepseek_api_key {
        print_info_line("DeepSeek API Key", &mask_token(key));
    }
    
    if let Ok(config_path) = crate::config::config_file_path() {
        println!(
            "\n  {} {}",
            style("Config file:").dim(),
            style(config_path.display()).dim()
        );
    }
}
