use anyhow::Result;
use console::style;

use crate::api_client::OrcaApiClient;
use crate::plan_types::FeaturePermission;

/// Check if user has access to a feature, show upgrade message if not
pub async fn require_feature(feature: FeaturePermission) -> Result<()> {
    // Try to check features
    #[cfg(test)]
    return Ok(());

    #[cfg(not(test))]
    match check_feature_access(&feature).await {
        Ok(true) => Ok(()),
        Ok(false) => {
            print_upgrade_message(&feature);
            anyhow::bail!("Feature requires Pro or Team plan");
        }
        Err(e) => {
            // Handle errors gracefully
            if is_auth_error(&e) {
                eprintln!("\n{}", style("❌ Authentication required").red().bold());
                eprintln!("   Please run 'orca login' to sign in.\n");
                anyhow::bail!("Not authenticated");
            } else if is_network_error(&e) {
                eprintln!("\n{}", style("⚠️  Network error").yellow().bold());
                eprintln!("   Could not verify your plan. Please check your internet connection.");
                eprintln!("   Server may be unreachable.\n");
                anyhow::bail!("Network error: {}", e);
            } else {
                eprintln!("\n{}", style("⚠️  Could not verify plan").yellow().bold());
                eprintln!("   {}\n", e);
                anyhow::bail!("Plan verification failed: {}", e);
            }
        }
    }
}

async fn check_feature_access(feature: &FeaturePermission) -> Result<bool> {
    let client = OrcaApiClient::new()?;
    let features = client.get_user_features().await?;
    Ok(features.contains(&feature.as_str().to_string()))
}

fn is_auth_error(error: &anyhow::Error) -> bool {
    error.to_string().contains("Authentication failed")
        || error.to_string().contains("401")
        || error.to_string().contains("orca login")
}

fn is_network_error(error: &anyhow::Error) -> bool {
    error
        .to_string()
        .to_lowercase()
        .contains("failed to connect")
        || error.to_string().contains("network")
        || error.to_string().contains("connection")
}

fn print_upgrade_message(feature: &FeaturePermission) {
    println!();
    println!("{}", style("❌ Feature Not Available").red().bold());
    println!();
    println!("This feature requires a {} plan.", style("Pro or Team").cyan().bold());
    println!();
    println!("  {} {}", style("Feature:").dim(), style(feature.display_name()).yellow());
    println!("  {} {}", style("Required:").dim(), "Pro ($7/month) or Team ($20/month)");
    println!();
    println!("{}", style("💡 What you get with Pro:").cyan().bold());
    println!("  {} Unlimited AI commits (vs 7/day on free)", style("✓").green());
    println!("  {} Auto-PR workflow (orca publish)", style("✓").green());
    println!("  {} AI conflict resolution", style("✓").green());
    println!("  {} AI-generated release notes", style("✓").green());
    println!();
    println!("  {} {}", style("Upgrade at:").bold(), style("https://orcacli.codes/pricing").cyan().underlined());
    println!();
    println!("  {} Run {} after upgrading to sync your plan.", 
        style("→").dim(),
        style("'orca login'").cyan()
    );
    println!();
}
