# Orca Cli

Orca Cli is a command-line toolset for helping with day-to-day Git workflows (commit message generation, planning, publishing, and utilities).

## Repository structure

- `cli/`
  - Rust CLI (the actual Orca CLI)
- `client/`
  - Next.js app (UI / companion project)

## Requirements

- Rust toolchain (stable)
- Node.js (LTS recommended) + npm

## Getting started

## Install Orca CLI (Windows)

1) Download the latest Windows build from GitHub Releases:

- https://github.com/vanthaita/Orca/releases/latest

2) Recommended: Install with MSI (Git Bash style)

- Download `OrcaSetup.msi`
- Run the installer (Next → Next → Finish)
- Open a new terminal and run:

```powershell
orca --version
```

Note: Windows SmartScreen may warn for unsigned installers. Code signing can reduce these warnings.

3) Fallback: Portable zip

- Extract `orca-x86_64-pc-windows-msvc.zip` and locate `orca.exe`

Run it from that folder (PowerShell):

```powershell
.\orca.exe --version
```

Optional: Add to PATH so you can run `orca` anywhere:

- Move `orca.exe` to `C:\Tools\orca\orca.exe`
- Add `C:\Tools\orca\` to your user/system `Path`
- Open a new terminal and run:

```powershell
orca --version
```

If you see errors like `VCRUNTIME140.dll was not found`, install **Microsoft Visual C++ Redistributable (x64)** for VS 2015-2022.

## Development

### Rust CLI (`cli/`)

```bash
cargo build
cargo run -- --help
```

### Next.js app (`client/`)

```bash
npm ci
npm run dev
```

## Common scripts

### Next.js (`client/`)

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

### Rust (`cli/`)

- `cargo fmt` (if rustfmt installed)
- `cargo clippy` (if clippy installed)
- `cargo test`

## CI

GitHub Actions runs CI for:

- Rust (build + test)
- Node/Next.js (install + lint + build)

## License

TBD
