<div align="center">
  <img src="https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767689659/c0b0wna5zvcn2m0spkei.png" alt="Orca Logo" width="100%" />

  # ORCA CLI

  **AI-native Git workflow automation for modern developers.**

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Rust](https://img.shields.io/badge/built_with-Rust-d83018.svg)](https://www.rust-lang.org/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
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
- **🗺️ Strategic Planning**: Generates a `plan.json` for complex tasks, allowing you to review and edit the strategy before execution.
- **🚀 Zero-Friction Releases**: Handles the entire publish flow—commits, pushes, and creates a PR with a generated summary in one command.
- **🔒 Local-First Privacy**: Your code stays on your machine. Orca interacts with AI providers securely using your own API keys.
- **⚡ Blazing Fast**: Built with Rust for instant startup times and high performance.

## 📦 Installation

Choose your preferred installation method:

### npm (Cross-platform)

```bash
npm install -g @vanthaita/orca
```

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

### Portable Archive

Download the appropriate archive for your platform from [Releases](https://github.com/vanthaita/orca-releases/releases/latest):

- **Windows**: `orca-x86_64-pc-windows-msvc.zip`
- **macOS**: `orca-x86_64-apple-darwin.tar.gz`
- **Linux**: `orca-x86_64-unknown-linux-gnu.tar.gz`

Extract and add to your system PATH.

### From Source

Requirements: [Rust](https://rustup.rs/) (stable)

```bash
# Clone the repository
git clone https://github.com/vanthaita/Orca.git
cd Orca/cli

# Build and install
cargo install --path .
```

## 🛠️ Usage

### 1. Setup
Configure your preferred AI provider and API keys.

```bash
orca setup --provider openai --api-key sk-...
```

### 2. The Daily Driver
Stage changes and generate a commit message in one go.

```bash
# Verify changes and commit
orca commit
```

### 3. Advanced Planning
For complex features, generate a plan first.

```bash
# Generate a plan based on current changes or a prompt
orca plan --out plan.json

# ... Edit plan.json manually if needed ...

# Execute the plan
orca apply --file plan.json
```

### 4. Publishing
Ship your changes to GitHub without leaving the terminal.

```bash
# Commits, pushes, and opens a PR
orca publish --branch feat/my-new-feature
```

## ⌨️ Commands

| Command | Description |
|---------|-------------|
| `orca commit` | Analyze changes and create a commit. |
| `orca plan` | Generate a detailed execution plan. |
| `orca apply` | Execute a plan file. |
| `orca publish` | Commit, push, and create a PR. |
| `orca setup` | Configure AI providers and settings. |
| `orca login` | Authenticate with Orca Cloud. |
| `orca doctor` | Check environment health. |
| `orca update` | Update to the latest version. |

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
