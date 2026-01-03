use console::style;

pub(crate) fn print_version_table() {
    let name = env!("CARGO_PKG_NAME");
    let version = env!("CARGO_PKG_VERSION");
    let description = env!("CARGO_PKG_DESCRIPTION");

    // Compact single-line version display
    println!(
        "{} {} - {}",
        style(name).bold().cyan(),
        style(format!("v{}", version)).bold().white(),
        style(description).dim()
    );
}
