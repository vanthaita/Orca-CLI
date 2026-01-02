use console::style;

pub(crate) fn print_version_table() {
    let name = env!("CARGO_PKG_NAME");
    let version = env!("CARGO_PKG_VERSION");
    let edition = option_env!("CARGO_PKG_EDITION").unwrap_or("unknown");
    let authors = env!("CARGO_PKG_AUTHORS");
    let description = env!("CARGO_PKG_DESCRIPTION");

    let rows = [
        ("Name", name.to_string()),
        ("Version", version.to_string()),
        ("Edition", edition.to_string()),
        ("Description", description.to_string()),
        ("Authors", authors.to_string()),
    ];

    let key_w = rows.iter().map(|(k, _)| k.len()).max().unwrap_or(0);
    let val_w = rows.iter().map(|(_, v)| v.len()).max().unwrap_or(0);
    let inner_w = key_w + 3 + val_w;

    let top = format!("┌{}┐", "─".repeat(inner_w + 2));
    let mid = format!("├{}┤", "─".repeat(inner_w + 2));
    let bot = format!("└{}┘", "─".repeat(inner_w + 2));

    let header = format!("{} {}", name, version)
        .chars()
        .take(inner_w + 2)
        .collect::<String>();
    let header = format!("{header:<width$}", width = inner_w + 2);

    println!("{}", style(top).cyan());
    println!(
        "{}",
        style(format!("│ {} │", header)).cyan().bold()
    );
    println!("{}", style(mid).cyan());

    for (k, v) in rows {
        let plain_len = k.len() + 3 + v.len();
        if plain_len < inner_w + 2 {
            let pad = " ".repeat(inner_w + 2 - plain_len);
            println!(
                "{}{}{}",
                style("│ ").cyan(),
                style(k).bold().white(),
                style(format!(" : {}{} │", v, pad)).cyan()
            );
        } else {
            println!("{}", style(format!("│ {} : {} │", k, v)).cyan());
        }
    }

    println!("{}", style(bot).cyan());

    if description.trim().is_empty() {
        let _ = description;
    }
}
