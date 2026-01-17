<div align="center">
  <!-- <img src="https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767689659/c0b0wna5zvcn2m0spkei.png" alt="Orca Logo" width="100%" /> -->

  # ORCA CLI

  **AI-powered Git workflow for modern developers.**

  [![License](https://img.shields.io/github/license/vanthaita/Orca-CLI)](LICENSE)
  [![Release](https://img.shields.io/github/v/release/vanthaita/Orca-CLI)](https://github.com/vanthaita/Orca-CLI/releases)
  [![Rust](https://img.shields.io/badge/built_with-Rust-d09968.svg)](https://www.rust-lang.org)
</div>

<br />

## 🌊 What is Orca?

Orca is a command-line toolset designed to remove friction from your daily development workflow. It uses advanced AI to understand your code changes, generate semantic commit messages, plan complex refactors, and automate the pull request process.

Instead of fighting with git commands and writing boilerplate descriptions, let Orca handle the choreography so you can focus on shipping features.

## A New Philosophy for Version Control
Git is powerful, but noisy. It requires you to manually stage, commit, and push hundreds of times. Orca changes this by introducing an agentic layer between you and Git.

Instead of micro-managing commits, you describe your intent or let Orca infer it. Orca analyzes your changes, groups them semantically using advanced AI models, and generates clean, meaningful history that tells a story.

It's not just a wrapper; it's a workflow engine designed for the era of AI-assisted coding.

## ✨ Features

- **🧠 Intelligent Commits**: Analyzes your diffs and generates conventional commit messages automatically.
- **🌊 Workflow Orchestration**: Manage feature branches and lifecycles with `orca flow`.
- **📚 Stacked Branches**: handle complex dependencies with `orca stack`.
- **🧹 History Tidying**: Clean up your commit history with interactive rebase and autosquash using `orca tidy`.
- **🛡️ Safety Checks**: Prevent secret leaks and run preflight checks with `orca safe`.
- **🗺️ Strategic Planning**: Generates a `plan.json` for complex tasks.
- **🚀 Zero-Friction Releases**: Handles the entire publish flow—commits, pushes, and creates a PR with a generated summary in one command.
- **🔒 Local-First Privacy**: Your code stays on your machine. Orca interacts with AI providers securely using your own API keys.
- **⚡ Blazing Fast**: Built with Rust for instant startup times and high performance.

## 📦 Installation

Choose your preferred installation method:

### npm (Cross-platform)

**Recommended for global installation:**

```bash
npm install -g @vanthaita/orca
```

> [!NOTE]
> Installing globally (`-g` flag) makes the `orca` command available system-wide. If you've previously installed via MSI or other methods, see the [Installation Notes](#-installation-notes) section below.

### Bun (Cross-platform)

```bash
bun install -g @vanthaita/orca
```

### Homebrew (macOS/Linux)

```bash
brew tap vanthaita/orca
brew install orca
```

### Winget (Windows)

```bash
winget install vanthaita.Orca
```

### Shell Script (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/vanthaita/orca-releases/main/install.sh | sh
```

### Windows MSI Installer

**Recommended for Windows users**

1. Download the latest `OrcaSetup-<version>.msi` from [Releases](https://github.com/vanthaita/orca-releases/releases/latest).
2. Run the installer.
3. Open a new terminal and type `orca --help`.

### From Source

Requirements: [Rust](https://rustup.rs/) (stable)

```bash
# Clone the repository
git clone https://github.com/vanthaita/Orca-CLI.git
cd Orca/cli

# Build and install
cargo install --path .
```

## 📝 Installation Notes

### Choosing the Right Installation Method

- **Windows users**: Use the [MSI Installer](#windows-msi-installer) for the best experience. It handles PATH configuration automatically.
- **npm/bun users**: Use the `-g` (global) flag to install system-wide. This makes `orca` available in any directory.
- **Homebrew/winget users**: These package managers handle global installation automatically.

### NPM Installation Tips

> [!IMPORTANT]
> **If you've installed via MSI or another method**, installing via npm may cause conflicts. Choose one installation method and stick with it.

**Prevent automatic updates:**

By default, npm may update packages automatically depending on your configuration. To lock to a specific version:

```bash
# Install a specific version
npm install -g @vanthaita/orca@0.1.27

# Check your installed version
orca --version
```

**Troubleshooting npm installation:**

```bash
# If the command is not found after installation:
which orca  # macOS/Linux
where orca  # Windows

# Reinstall if needed:
npm uninstall -g orcacli
npm install -g orcacli
```

### MSI and NPM Conflicts

> [!WARNING]
> If you installed Orca using the **Windows MSI installer**, do not install it again via npm. The MSI installer places the binary in your system PATH, and npm cannot update or manage it.

**If you need to switch from MSI to npm:**

1. Uninstall Orca via Windows Settings → Apps → Orca
2. Then install via npm: `npm install -g @vanthaita/orca`

**To update an MSI installation:**

Download and run the latest MSI installer from [Releases](https://github.com/vanthaita/orca-releases/releases/latest).

## 🛠️ Usage

### 1. Setup
Configure your preferred AI provider (Gemini, OpenAI, etc.) and API keys.

```bash
# Setup with Gemini (default)
orca setup --provider gemini --api-key YOUR_API_KEY

# Setup with OpenAI
orca setup --provider openai --api-key sk-...
```

### 2. The Daily Driver
Stage changes and generate a commit message in one go.

```bash
# Verify changes and commit
orca commit
```

### 3. Workflow Management
Start and finish features with ease.

```bash
# Start a new feature
orca flow start --type feat --name user-auth

# ... do work ...

# Finish the feature (push and create PR)
orca flow finish --push --pr
```

### 4. Stacked Branches
Manage dependent branches without the headache.

```bash
# Create a child branch
orca stack start my-child-branch

# Rebase the stack if the parent moves
orca stack rebase
```

### 5. Advanced Planning
For complex features, generate a plan first.

```bash
# Generate a plan
orca plan --out plan.json

# Execute the plan
orca apply --file plan.json
```

### 6. Publishing
Ship your changes to GitHub without leaving the terminal.

```bash
# Commits, pushes, and opens a PR
orca publish --branch feat/my-new-feature
```

## ⌨️ Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `orca commit` | | Analyze changes and create a commit. |
| `orca flow` | `fl` | Manage feature/fix workflows (`start`, `finish`). |
| `orca stack` | `sk` | Manage stacked branches (`start`, `list`, `rebase`, `publish`). |
| `orca tidy` | `td` | Clean up history (`rebase`, `squash`, `fixup`, `amend`). |
| `orca conflict` | `cf` | Resolve conflicts (`status`, `guide`, `continue`, `abort`). |
| `orca release` | `rl` | Manage releases (`tag`, `notes`, `create`). |
| `orca safe` | | Safety checks (`scan`, `preflight`). |
| `orca git` | `g` | Enhanced git wrappers (`status`, `log`, `sync`). |
| `orca branch` | `br` | Branch management (`current`, `list`, `new`, `publish`). |
| `orca plan` | | Generate a detailed execution plan. |
| `orca apply` | | Execute a plan file. |
| `orca publish` | | Commit, push, and create a PR. |
| `orca setup` | | Configure AI providers and settings. |
| `orca update` | | Update to the latest version. |
| `orca doctor` | | Check environment health. |

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
