use console::style;

pub(crate) fn print_no_remote_guidance() {
    eprintln!(
        "\n{} {}",
        style("[!]").yellow().bold(),
        style("No git remote configured, so nothing to push yet.")
            .yellow()
    );
    eprintln!(
        "\n{}\n  - VS Code: Source Control -> Publish to GitHub (recommended)\n\n{}\n  1) Create a new repository on https://github.com/new\n  2) Add remote:\n     git remote add origin <repo-url>\n  3) Push first time:\n     git push -u origin <branch>",
        style("Option A (VS Code):").cyan().bold(),
        style("Option B (Git CLI):").cyan().bold(),
    );
}

pub(crate) fn print_friendly_error(err: &anyhow::Error) {
    let msg = err.to_string();
    eprintln!("{} {}", style("Error:").red().bold(), style(&msg).red());

    let mut chain = err.chain();
    let _ = chain.next();
    let mut idx = 1;
    for cause in chain {
        eprintln!(
            "{} {}",
            style(format!("Cause #{idx}:"))
                .yellow()
                .bold(),
            style(cause.to_string()).yellow()
        );
        idx += 1;
    }

    if msg.contains("Not a git repository") {
        eprintln!(
            "\n{} {}\n  git init\n  git remote add origin <url>",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("GEMINI_API_KEY") {
        eprintln!(
            "\n{} {}\n  Option 1: orca setup --api-key YOUR_KEY\n  Option 2: export GEMINI_API_KEY=YOUR_KEY",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("Author identity unknown") || msg.contains("unable to auto-detect email address") {
        eprintln!(
            "\n{} {}\n  git config --global user.name \"Your Name\"\n  git config --global user.email \"you@example.com\"\n\n{} {}\n  git config user.name \"Your Name\"\n  git config user.email \"you@example.com\"",
            style("[i]").cyan().bold(),
            style("Fix (global):").cyan(),
            style("[i]").cyan().bold(),
            style("Fix (this repo only):").cyan(),
        );
        return;
    }

    if msg.contains("no upstream branch") || msg.contains("set the remote as upstream") {
        eprintln!(
            "\n{} {}\n  git push -u origin <branch>",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("No configured push destination") {
        eprintln!(
            "\n{} {}\n  1) Create a GitHub repo (VS Code: Source Control -> Publish to GitHub)\n  2) Or via CLI:\n     - Create repo on github.com\n     - git remote add origin <repo-url>\n     - git push -u origin <branch>",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("could not read Username")
        || msg.contains("Authentication failed")
        || msg.contains("Repository not found")
        || msg.contains("Permission denied")
    {
        eprintln!(
            "\n{} {}\n  - Ensure remote URL is correct: git remote -v\n  - If using HTTPS, use a GitHub PAT (not password)\n  - If using SSH, ensure your SSH key is added to GitHub",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("pathspec") && msg.contains("did not match any file") {
        eprintln!(
            "\n{} {}\n  Re-generate the plan with: orca plan --out plan.json",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("nothing to commit") || msg.contains("no changes added to commit") {
        eprintln!(
            "\n{} {}\n  - Run: git status\n  - Ensure the plan files are still modified\n  - If you already committed, regenerate plan: orca plan --out plan.json",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
        return;
    }

    if msg.contains("Gemini API") {
        eprintln!(
            "\n{} {}\n  - Check GEMINI_API_KEY\n  - Try another model: --model gemini-2.5-flash\n  - If rate limited, retry later",
            style("[i]").cyan().bold(),
            style("Hint:").cyan()
        );
    }
}
