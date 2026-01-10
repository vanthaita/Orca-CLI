# Orca CLI Guide (Tiếng Việt)

Tài liệu này mô tả **đầy đủ các lệnh/flags** của `orca` dựa trên định nghĩa CLI trong `cli/src/cli.rs` (clap).

## Cài đặt / chạy từ source (trong repo này)

Yêu cầu: Rust (stable).

```bash
cargo build
./target/debug/orca --help
```

Hoặc cài vào máy:

```bash
cargo install --path .
orca --help
```

## Cú pháp chung

```bash
orca [GLOBAL FLAGS] <COMMAND> [COMMAND FLAGS]
```

## Global flags

Các flag này dùng được với mọi lệnh.

- `-V`, `--version`
  - In version (Orca đã tắt version flag mặc định của clap và tự xử lý flag này).
  - Có thể chạy **mà không cần subcommand**.
- `-y`, `--yes`
  - Tự động đồng ý các prompt xác nhận (áp dụng ở các flow có hỏi confirm).
- `--yes-pr`
  - Tự động đồng ý prompt liên quan đến PR (được truyền vào một số flow).

## Danh sách command cấp 1

- `commit`
- `plan`
- `apply`
- `publish-current`
- `publish`
- `setup`
- `login`
- `menu`
- `doctor`
- `update`
- `git` (alias: `g`)
- `branch` (alias: `br`)
- `flow` (alias: `fl`)
- `tidy` (alias: `td`)
- `conflict` (alias: `cf`)
- `release` (alias: `rl`)
- `stack` (alias: `sk`)
- `safe`

---

# 1) `orca commit`

Phân tích thay đổi trong repo và tạo commit theo nhóm.

```bash
orca commit [--confirm <bool>] [--dry-run <bool>] [--model <MODEL>]
```

- `--confirm` (default: `true`)
  - Hiển thị plan commit và hỏi xác nhận trước khi chạy git commands.
- `--dry-run` (default: `false`)
  - Không chạy git commands; chỉ in plan.
- `--model` (default: `gemini-2.5-flash`)

Ví dụ:

```bash
orca commit
orca commit --dry-run
orca commit --confirm=false
orca commit --model gemini-2.5-flash
```

---

# 2) `orca plan`

Tạo “commit plan” (JSON), không chạy `git add/commit`.

```bash
orca plan [--model <MODEL>] [--json-only] [--out <PATH>]
```

- `--model` (default: `gemini-2.5-flash`)
- `--json-only` (default: `false`)
  - Chỉ in JSON (phù hợp script/pipeline).
- `--out <PATH>`
  - Ghi JSON plan ra file.

Ví dụ:

```bash
orca plan
orca plan --out plan.json
orca plan --json-only
```

---

# 3) `orca apply`

Áp dụng plan JSON đã có.

```bash
orca apply --file <PLAN.json> [--confirm <bool>] [--dry-run <bool>] [--push] [--publish] [--branch <NAME>] [--base <BRANCH>] [--pr <bool>]
```

- `--file <PATH>`
  - Bắt buộc: đường dẫn tới plan JSON.
- `--confirm` (default: `true`)
- `--dry-run` (default: `false`)
- `--push` (default: `false`)
  - Sau khi commit xong, prompt để push.
- `--publish` (default: `false`)
  - Flow publish chuyên nghiệp: tạo/chuyển branch, push `-u`, và đề xuất tạo PR.
- `--branch <NAME>`
  - Tên branch khi `--publish` (ví dụ `feat/my-change`).
- `--base <BRANCH>` (default: `main`)
  - Base branch cho PR khi `--publish`.
- `--pr` (default: `true`)
  - Khi `--publish`, tạo PR qua `gh` nếu có (không có thì in URL).

Ví dụ:

```bash
orca apply --file plan.json
orca apply --file plan.json --dry-run
orca apply --file plan.json --push
orca apply --file plan.json --publish --branch feat/user-auth --base main --pr=true
```

---

# 4) `orca publish-current`

Publish các commit hiện tại: tạo/chuyển branch, push `-u`, và tạo PR.

```bash
orca publish-current [--branch <NAME>] [--base <BRANCH>] [--pr <bool>]
```

- `--branch <NAME>`
  - Nếu bỏ trống: derived từ commit message gần nhất.
- `--base <BRANCH>` (default: `main`)
- `--pr` (default: `true`)

Ví dụ:

```bash
orca publish-current
orca publish-current --branch feat/user-auth --base main
orca publish-current --pr=false
```

---

# 5) `orca publish`

Áp dụng plan và publish lên GitHub (tạo/chuyển branch, push `-u`, tạo PR).

```bash
orca publish <PLAN.json> [--confirm <bool>] [--dry-run <bool>] [--branch <NAME>] [--base <BRANCH>] [--pr <bool>]
```

- `file: <PLAN.json>`
  - Positional argument (bắt buộc).
- `--confirm` (default: `true`)
- `--dry-run` (default: `false`)
- `--branch <NAME>`
  - Nếu bỏ trống: derived từ commit message đầu tiên trong plan.
- `--base <BRANCH>` (default: `main`)
- `--pr` (default: `true`)

Ví dụ:

```bash
orca publish plan.json
orca publish plan.json --dry-run
orca publish plan.json --branch feat/user-auth --base main
```

---

# 6) `orca setup`

Setup git identity và check tool cần thiết.

```bash
orca setup [--provider <NAME>] [--api-key <KEY>] [--name <GIT_NAME>] [--email <GIT_EMAIL>] [--local]
```

- `--provider <NAME>`
  - Provider để cấu hình/switch (trong help: `gemini, openai, zai, deepseek`).
- `--api-key <KEY>`
- `--name <GIT_NAME>`
- `--email <GIT_EMAIL>`
- `--local` (default: `false`)
  - Ghi config cho repo hiện tại thay vì global.

Ví dụ:

```bash
orca setup --provider gemini --api-key "..."
orca setup --name "Your Name" --email "you@example.com"
orca setup --local
```

---

# 7) `orca login`

Login qua browser để lấy CLI token (remote Orca server mode).

```bash
orca login
```

---

# 8) `orca menu`

Menu tương tác quản lý tài khoản và settings.

```bash
orca menu
```

---

# 9) `orca doctor`

Kiểm tra môi trường (git repo, working tree, API key).

```bash
orca doctor
```

---

# 10) `orca update`

Check update và auto-upgrade.

```bash
orca update
```

---

# 11) `orca git` (alias: `g`)

```bash
orca git <SUBCOMMAND>
orca g <SUBCOMMAND>
```

## `orca git status` (alias: `st`)

```bash
orca git status
orca g st
```

## `orca git log` (alias: `lg`)

```bash
orca git log [--n <NUM>] [--oneline] [--graph] [--since <DATE>]
orca g lg -n 20 --oneline --graph
```

- `-n`, `--n <NUM>`
- `--oneline`
- `--graph`
- `--since <DATE>` (ví dụ: `"2024-01-01"`, `"1 week ago"`)

## `orca git sync`

```bash
orca git sync [--rebase]
orca g sync --rebase
```

- `--rebase` (default: `false`)

---

# 12) `orca branch` (alias: `br`)

```bash
orca branch <SUBCOMMAND>
orca br <SUBCOMMAND>
```

## `orca branch current`

```bash
orca br current
```

## `orca branch list`

```bash
orca br list [--remote]
orca br list -r
```

- `-r`, `--remote` (default: `false`)

## `orca branch new <TYPE> <NAME>`

```bash
orca br new <TYPE> <NAME> [--base <BRANCH>]
```

- `TYPE`: `feat`, `feature`, `fix`, `bugfix`, `chore`, `hotfix`, `release`
- `NAME`: ví dụ `user-authentication`
- `--base <BRANCH>`

Ví dụ:

```bash
orca br new feat user-authentication
orca br new fix login-bug --base main
```

## `orca branch publish`

```bash
orca br publish
orca br publish -y
```

---

# 13) `orca flow` (alias: `fl`)

## `orca flow start`

```bash
orca fl start [--type <TYPE>] [--name <NAME>] [--base <BRANCH>]
```

- `--type <TYPE>`
- `--name <NAME>`
- `--base <BRANCH>` (default: current branch)

## `orca flow finish`

```bash
orca fl finish [--push] [--pr <bool>]
```

- `--push` (default: `false`)
- `--pr` (default: `true`) (requires `--push`)

---

# 14) `orca tidy` (alias: `td`)

## `orca tidy rebase`

```bash
orca td rebase [--onto <BRANCH>] [--autosquash <bool>]
```

- `--onto <BRANCH>`
- `--autosquash` (default: `true`)

## `orca tidy squash`

```bash
orca td squash [--base <BRANCH>]
```

- `--base <BRANCH>`

## `orca tidy fixup <COMMIT>`

```bash
orca td fixup <COMMIT>
```

## `orca tidy amend`

```bash
orca td amend [--no-edit]
```

- `--no-edit` (default: `false`)

---

# 15) `orca conflict` (alias: `cf`)

## `orca conflict status`

```bash
orca cf status
```

## `orca conflict guide`

```bash
orca cf guide [--ai]
```

- `--ai` (default: `false`)

## `orca conflict continue`

```bash
orca cf continue
```

## `orca conflict abort`

```bash
orca cf abort
```

---

# 16) `orca release` (alias: `rl`)

## `orca release tag <VERSION>`

```bash
orca rl tag <VERSION> [--message <TEXT>] [--push]
```

- `<VERSION>`: ví dụ `1.0.0` hoặc `v1.0.0`
- `--message <TEXT>`
- `--push` (default: `false`)

## `orca release notes`

```bash
orca rl notes [--from <REF>] [--to <REF>] [--ai <bool>]
```

- `--from <REF>`
- `--to <REF>`
- `--ai` (default: `true`)

## `orca release create <VERSION>`

```bash
orca rl create <VERSION> [--notes <PATH>] [--ai <bool>]
```

- `--notes <PATH>`
- `--ai` (default: `true`)

---

# 17) `orca stack` (alias: `sk`)

## `orca stack start <BRANCH>`

```bash
orca sk start <BRANCH>
```

## `orca stack list`

```bash
orca sk list
```

## `orca stack rebase`

```bash
orca sk rebase [--onto <BRANCH>]
```

- `--onto <BRANCH>`

## `orca stack publish`

```bash
orca sk publish [--pr <bool>]
```

- `--pr` (default: `true`)

---

# 18) `orca safe`

## `orca safe scan`

```bash
orca safe scan [--all]
```

- `--all` (default: `false`)

## `orca safe preflight`

```bash
orca safe preflight [--operation <NAME>] [--protection <BRANCH>]
```

- `--operation <NAME>` (default: `push`)
- `--protection <BRANCH>`

---

# Troubleshooting nhanh

- Nếu `orca` báo không phải git repo:
  - Chạy trong thư mục có `.git` hoặc init repo.
- Nếu tạo PR không được:
  - Cài GitHub CLI `gh`, đăng nhập `gh auth login`, hoặc chạy với `--pr=false`.
- Xem help chi tiết:
  - `orca --help`
  - `orca <command> --help`
