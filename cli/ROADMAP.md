# Orca CLI Roadmap — Wrap Git + AI Workflow Engine

Git is powerful, but noisy. It requires you to manually stage, commit, and push hundreds of times.

Orca changes this by introducing an agentic layer between you and Git.

Instead of micro-managing commits, you describe your intent or let Orca infer it. Orca analyzes your changes, groups them semantically using advanced AI models, and generates clean, meaningful history that tells a story.

It's not just a wrapper; it's a workflow engine designed for the era of AI-assisted coding.

---

## 1) Scope & Principles

### 1.1 Goals
- **Reduce Git toil**
  - Fewer repetitive `git add/commit/push` cycles.
- **Guardrails by default**
  - Validate repo state and print actionable guidance.
- **AI-assisted, not AI-autonomous**
  - AI proposes; user confirms for destructive/mutating operations.

### 1.2 Default AI behavior
- AI is **enabled by default** when an API key is available.
- Use `--no-ai` (or `--plain`) to disable AI on any command.
- If AI is not configured, Orca should fall back to non-AI behavior with a clear hint (`orca setup`).

### 1.3 Non-Goals (for now)
- Re-implement full Git.
- Force a single branching model for every team.

---

## 2) Current State (baseline)

Orca CLI already has:
- `commit / plan / apply / publish / publish-current / setup / doctor`
- `git` utilities (`ensure_git_repo`, `run_git`, `current_branch`, ...)
- friendly error printing with hints
- AI integration for generating commit plans

This roadmap extends the existing flow-driven style (subcommands -> `flows::*`).

---

## 2.1 Why Orca when Git already exists?

Git already supports everything (rebase, conflict resolution, tags, release notes, worktrees). Orca exists to add a workflow layer:

- **Less noise, fewer footguns**
  - Git exposes sharp primitives; Orca bundles them into guided flows with preflight checks.
- **Guardrails for common mistakes**
  - Prevent accidental force-push patterns.
  - Block obvious secret leaks (e.g. `.env`, private keys) before pushing.
  - Warn when pushing directly to protected branches.
- **Higher-level intent**
  - Instead of remembering the right sequence of commands, you run one task-level command.
- **AI as a co-pilot**
  - AI summarizes diffs/logs, proposes branch names, and generates release notes.
  - AI is proposal-only; destructive operations still require confirmation.

In short: Git is the engine; Orca is the cockpit + autopilot checklist.

---

## 3) Proposed Command Tree (Draft)

### 3.1 Thin Git wrappers (high-signal)
- `orca git status`
- `orca git log [--n <N>] [--oneline] [--graph] [--since <date>]`
- `orca git sync [--rebase]`

### 3.2 History cleanup (rebase / squash / tidy commits)
- `orca tidy rebase [--onto <base>] [--autosquash]`
- `orca tidy squash [--base <branch>]` (squash current branch into 1 commit)
- `orca tidy fixup <commit>` (create fixup commit)
- `orca tidy amend [--no-edit]` (amend last commit safely)

### 3.3 Branch control (workflow-oriented)
- `orca branch current`
- `orca branch list [--remote]`
- `orca branch new <feat|fix|chore|hotfix|release> <name> [--base <branch>]`
- `orca branch publish [--yes]`

### 3.4 Flow orchestration
- `orca flow start [--type <...>] [--name <...>] [--base <branch>]`
- `orca flow finish [--push] [--pr]`

### 3.5 Conflict helper (guided resolution)
- `orca conflict status` (show conflicted files and current state)
- `orca conflict guide` (print step-by-step instructions; optionally AI explains)
- `orca conflict continue` (continue rebase/merge when resolved)
- `orca conflict abort` (abort rebase/merge safely)

### 3.6 Release / Tag
- `orca release tag <version> [--message <msg>] [--push]`
- `orca release notes [--from <tag>] [--to <ref>] [--ai]`
- `orca release create <version> [--notes <file>]` (via `gh` if available)

### 3.7 Stacked branches / parallel feature work
When feature A already has a PR but is not merged yet, feature B should be based on feature A to avoid conflicts.
- `orca stack start <branch>` (create a child branch based on current or specified parent)
- `orca stack list` (show parent/child relationships)
- `orca stack rebase [--onto <base>]` (rebase the stack when base moves)
- `orca stack publish [--pr]` (publish stack branches in order)

Optional (advanced): use `git worktree` to avoid constantly switching branches:
- `orca worktree add <branch> [--path <dir>]`
- `orca worktree list`
- `orca worktree remove <path>`

### 3.8 AI Assist (text-only proposals)
- `orca ai explain-log [--n <N>]`
- `orca ai suggest-branch`
- `orca ai release-notes [--from <tag>] [--to <ref>]`

### 3.9 Short commands (aliases)
Commands can be long; Orca should provide `clap` aliases so daily use is short:
- `orca br ...` -> `orca branch ...`
- `orca fl ...` -> `orca flow ...`
- `orca rl ...` -> `orca release ...`
- `orca lg ...` -> `orca git log ...`
- `orca st ...` -> `orca git status ...`

Additional suggested aliases:
- `orca td ...` -> `orca tidy ...`
- `orca cf ...` -> `orca conflict ...`
- `orca sk ...` -> `orca stack ...`

### 3.10 Git safety (newcomer-friendly guardrails)
- `orca safe scan` (check staged/changed files for common secret leaks)
- `orca safe preflight [--push] [--tag] [--release]` (run all checks before mutating operations)

---

## 3.11 Default Orca Flow (choose one)

This is user- and team-dependent. Orca should support selecting the default workflow at three levels:

- **Per-command**: override for the current run (e.g. `--stack` or `--worktree`).
- **Per-user (global)**: stored in Orca config (`%APPDATA%/orca/config.toml` on Windows).
- **Per-repo (local)**: stored in the repo (optional), so teams can standardize behavior per project.

Proposed config schema:

```toml
[flow]
# "stack" (recommended default) or "worktree"
default_mode = "stack"

# default base branch used by start/finish/release flows
default_base_branch = "main"
```

### Option A — Stack-first (recommended default)
Best when:
- your team uses PRs and often has multiple PRs pending review/merge
- you want feature B to build on feature A safely

Happy path scenario:
- Feature **A** has PR open (not merged yet)
- You must start feature **B** now

**Orca approach**
1) Start feature A (already done)
   - `orca flow start --type feat --name feature-a`
   - `orca commit` / `orca publish` (opens PR)

2) Start feature B *stacked on A*
   - `orca stack start feat/feature-b`
   - Orca should record: `feat/feature-b` depends on `feat/feature-a`

3) Publish feature B (PR depends on A)
   - `orca publish-current` (or `orca stack publish --pr`)
   - Orca should propose PR title/body like: "Depends on PR: feature-a"

4) When A finally merges into `main`
   - `orca stack rebase --onto main`
   - Orca runs preflight + guided conflict resolution if needed
   - `orca publish-current` to update PR B

**Git equivalent (manual)**
- `git checkout feat/feature-a`
- `git checkout -b feat/feature-b`
- work/commit/push
- when A merges:
  - `git fetch origin`
  - `git rebase origin/main` (resolve conflicts)
  - `git push --force-with-lease`

What Orca adds beyond raw Git:
- records dependency context (stack)
- preflight checks + safer defaults for push
- conflict helper (`orca conflict *`) + optional AI explanation

### Option B — Worktree-first (power users)
Best when:
- you frequently switch between multiple tasks in parallel
- you want isolated working directories per feature

Happy path scenario:
- Feature A PR open, start B without disturbing your A workspace

**Orca approach**
1) Create a second workspace for B
   - `orca worktree add feat/feature-b --path ../wt-feature-b`

2) Work inside that directory and publish
   - `orca commit`
   - `orca publish-current`

**Git equivalent (manual)**
- `git worktree add ../wt-feature-b -b feat/feature-b`
- manage multiple folders yourself

What Orca adds beyond raw Git:
- consistent naming, preflight, safe publish
- less cognitive overhead managing paths and branch state

## 4) Architecture Plan

### 4.1 Modules
- `src/cli.rs`
  - add new subcommands (`Git`, `Branch`, `Flow`, `Release`, `Ai`) or group them under one root command.
- `src/flow/*`
  - add `flows_git.rs`, `flows_branch.rs`, `flows_release.rs`, `flows_ai.rs`, `flows_flow.rs`.
- `src/git.rs`
  - extend with small helpers:
    - `is_working_tree_clean()`
    - `latest_tag()`
    - `ensure_remote()`
    - `ahead_behind()` (optional)

### 4.2 UX Rules
- **Default is safe**
  - Anything that mutates repo state should support `--dry-run` and require confirmation (unless `--yes`).
- **One-liners when possible**
  - Prefer high-signal output (summary tables) over raw Git spam.
- **AI by default**
  - When AI is available, commands should use it automatically.
  - Users can opt out with `--no-ai` (or `--plain`).
- **Actionable errors**
  - Keep adding patterns into `flows_error::print_friendly_error` for predictable failure cases.

### 4.3 Safety checks (what Orca should protect you from)
- **Force push accidents**
  - Default behavior: do not run `--force`.
  - If user requests force-like behavior (future): require an explicit flag and an extra confirmation.
- **Leaking secrets (e.g. `.env`, credentials, API keys)**
  - Preflight scan before `push`, `tag --push`, `release create`.
  - Detect risky filenames: `.env`, `.env.*`, `*.pem`, `id_rsa`, `*.p12`, `*.key`.
  - Detect common secret patterns in staged content (best-effort), then block with guidance.
  - Guidance: add to `.gitignore`, rotate key, use repo secrets.
- **Pushing to the wrong branch / wrong remote**
  - Show current branch + upstream + remote before push.
  - Warn if pushing directly to `main/master` without PR flow.
- **Dirty working tree / missing upstream**
  - Clearly prompt what will be committed/pushed.
  - When upstream missing: propose `git push -u origin <branch>`.

---

## 5) Milestones

### Milestone A — Foundation wrappers
- Add: `orca git status/log/sync`
- Add helpers in `git.rs` for common checks
- Success criteria:
  - Works in any git repo
  - Good errors when git missing / not a repo

### Milestone B — Branch control + publish
- Add: `orca branch current/list/new/publish`
- Reuse existing remote guidance for repos without `origin`
- Success criteria:
  - Safe naming + optional base branch
  - Push uses upstream when appropriate
  - Optional `--ai` proposes branch naming and preflight warnings

### Milestone C — Flow start/finish
- Add: `orca flow start/finish`
- Integrate PR creation (via `gh` when available)
- Success criteria:
  - Clean UX path to go from intent -> branch -> push -> PR

### Milestone D — Release/tag/notes
- Add: `orca release tag/notes/create`
- Support `gh release` when installed
- Success criteria:
  - Correct tag range handling
  - No crash if no tags exist
  - Optional `--ai` helps generate tag messages / release notes

### Milestone E — AI Assist expansion
- Add: `orca ai explain-log/suggest-branch/release-notes`
- Guardrails:
  - AI is proposal only; no silent mutation
- Success criteria:
  - AI outputs grounded summaries based on provided repo data (log/diff)

### Milestone F — Safety layer (newcomer guardrails)
- Add: `orca safe scan` and integrate `preflight` into push/tag/release flows
- Success criteria:
  - Clear, actionable blocking messages for secret leaks
  - Prevent accidental force-push by design
  - Encourage PR-based workflow for protected branches

---

## 6) Developer Setup

### 6.1 Build
From `orca/cli`:
- `cargo build`
- `cargo run -- --help`

### 6.2 Local configuration
- `orca setup --provider gemini --api-key <KEY>` (or set `GEMINI_API_KEY`)
- `orca setup --name "Your Name" --email "you@example.com"`

### 6.3 Tooling expectations
- Git must be installed and available in `PATH`.
- Optional: GitHub CLI (`gh`) for PR / release creation.

---

## 7) Open Questions (to finalize spec)
- Branching model: GitFlow vs GitHub Flow?
- Release mechanism priority: `gh release` first, or tag-only first?
- Naming conventions: enforce `feat/`, `fix/` prefixes? tag prefix `v` mandatory?
- AI behavior: proposal-only (recommended) vs generating command scripts that still require confirmation?
