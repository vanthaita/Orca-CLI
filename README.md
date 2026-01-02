# Orca Cli

Orca Cli is a command-line toolset for helping with day-to-day Git workflows (commit message generation, planning, publishing, and utilities).

## Repository structure

- `cli-commit/`
  - Rust CLI (the actual Orca CLI)
- `orca/`
  - Next.js app (UI / companion project)

## Requirements

- Rust toolchain (stable)
- Node.js (LTS recommended) + npm

## Getting started

### Rust CLI (`cli-commit/`)

```bash
cargo build
cargo run -- --help
```

### Next.js app (`orca/`)

```bash
npm ci
npm run dev
```

## Common scripts

### Next.js (`orca/`)

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

### Rust (`cli-commit/`)

- `cargo fmt` (if rustfmt installed)
- `cargo clippy` (if clippy installed)
- `cargo test`

## CI

GitHub Actions runs CI for:

- Rust (build + test)
- Node/Next.js (install + lint + build)

## License

TBD
