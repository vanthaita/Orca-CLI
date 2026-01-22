<div align="center">

  # ORCA CLI
  **AI-powered Git workflow for modern developers.**

  [![License](https://img.shields.io/github/license/vanthaita/Orca-CLI)](LICENSE)
  [![Release](https://img.shields.io/github/v/release/vanthaita/Orca-CLI)](https://github.com/vanthaita/Orca-CLI/releases)
  [![Rust](https://img.shields.io/badge/built_with-Rust-d09968.svg)](https://www.rust-lang.org)
</div>

<br />

## 🚀 What is Orca CLI?

Orca CLI is your AI pair programmer for Git. It stops you from writing boring commit messages and managing complex PR flows manually.

**Focus on coding. Let Orca handle the rest.**

## 📦 Install

```bash
npm i -g orcacli
```

*Compatible with Windows, macOS, and Linux.*  
*For Windows MSI or other methods, see [Releases](https://github.com/vanthaita/Orca-CLI/releases).*
*For From Web, see [orcacli.codes](https://orcacli.codes/).*

## 💸 Free With BYOK

**No subscriptions. No markup.**
Just bring your own API key and pay the provider directly (or use their free tiers!).

- **Google Gemini**
- **DeepSeek**
- **OpenAI GPT**
- **Z.AI**

**🔒 Security First:** Your API keys are stored encrypted on your local machine. Your code is sent directly to your chosen AI provider for analysis and never stored on our servers.

## 🔥 Top Features

### 1. Magic Commits (`orca commit`)
No more `git add .` or straining to write "fix: bug". Orca analyzes your code changes and writes semantic, conventional commit messages for you.

```bash
D:\Projects\2026\Orca Shell\orca>orca commit
[orca commit]
[✓] Plan received

Proposed Plan:

╭──────────────────────────────────────────────────────────╮
│   📋 Proposed Plan: 3 commits, 6 files
╰──────────────────────────────────────────────────────────╯

Commit #1 (3 files)
───────────────────────────────────────────────────────────
  📝 chore: Bump version and update license

  📄 Description:
  This commit updates the project version across `Cargo.toml`, `Cargo.lock`, and `package.json` to `0.1.30`. Additionally, it changes the project license in `package.json` from MIT to Apache-2.0, aligning with broader open-source licensing standards.

    • Incremented project version from `0.1.29` to `0.1.30` in `cli/Cargo.toml` and `cli/package.json`.
    • Updated `orca` package version in `cli/Cargo.lock` to reflect the new project version.
    • Changed the project license from `MIT` to `Apache-2.0` in `cli/package.json`.

     IMPACT: LOW   These are metadata and build configuration changes. They affect the project's release versioning and legal terms but do not alter application runtime behavior or functionality.
              Affected: Project metadata, Build dependencies, Licensing

  📂 Files:
    │ cli/Cargo.lock
    │ cli/Cargo.toml
    │ cli/package.json

  ⚙️  Commands:
    $ git add -- cli/Cargo.lock cli/Cargo.toml cli/package.json
    $ git commit -m "chore: Bump version and update license"

  • • •
```

### 2. Instant Publishing (`orca publish`)
Turn your local work into a Live Pull Request in seconds. Orca handles the entire chain automatically:
**Commit → Push → Create PR**

```bash
# Ship it!
orca publish
```

## 🛠️ Other Powerful Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `orca flow` | `fl` | Start (`start`) or ship (`finish`) feature branches. |
| `orca stack` | `sk` | Manage stacked branches/PRs without dependency hell. |
| `orca tidy` | `td` | Clean up history (interactive rebase, autosquash). |
| `orca plan` | | Generate detailed implementation plans. |
| `orca safe` | | Check for secrets and run preflight checks. |
| `orca setup` | | Configure your AI provider. |

## ⚙️ Quick Setup

First run? Tell Orca which AI to use:

```bash
orca setup --provider gemini --api-key YOUR_API_KEY
```

## 🤝 Contributing & License
See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSE](LICENSE).
