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
➜ ~/projects/orca git:(main) orca commit
== orca: commit ==
AI plan received
Proposed plan
Commit #1 (2 file(s))
  message: feat(installer): Add Windows MSI build and release pipeline
  files:
    - .github/workflows/release.yml
    - installer/
Apply this plan? This will run git add/commit commands: yes
Commits created
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
