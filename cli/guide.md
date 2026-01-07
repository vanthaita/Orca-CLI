# 🐋 Orca CLI Guide (Tiếng Việt)

Orca CLI là một công cụ mạnh mẽ kết hợp Git workflow với trí tuệ nhân tạo (AI) giúp tự động hóa và tối ưu hóa quá trình phát triển phần mềm.

## 📦 Cài Đặt (Installation)

Chọn phương thức cài đặt phù hợp với bạn:

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

**Khuyến nghị cho người dùng Windows**

1. Tải xuống file `OrcaSetup-<version>.msi` mới nhất từ [Releases](https://github.com/vanthaita/orca-releases/releases/latest).
2. Chạy trình cài đặt.
3. Mở terminal mới và gõ `orca --help`.

### Portable Archive

Tải xuống file nén phù hợp với hệ điều hành của bạn từ [Releases](https://github.com/vanthaita/orca-releases/releases/latest):

- **Windows**: `orca-x86_64-pc-windows-msvc.zip`
- **macOS**: `orca-x86_64-apple-darwin.tar.gz`
- **Linux**: `orca-x86_64-unknown-linux-gnu.tar.gz`

Giải nén và thêm vào system PATH.

### Từ Source Code

Yêu cầu: [Rust](https://rustup.rs/) (stable)

```bash
# Clone repository
git clone https://github.com/vanthaita/Orca.git
cd Orca/cli

# Build và install
cargo install --path .
```

---

## 💰 Các Gói Dịch Vụ (Pricing Plans)

Orca CLI cung cấp các gói linh hoạt phù hợp với nhu cầu của bạn.

| Tính Năng | **Free Tier** (Miễn phí) | **Pro Tier** ($7/tháng) | **Team Tier** ($20/tháng - 5 users) |
| :--- | :--- | :--- | :--- |
| **Commit Limit** | **7 AI commits/ngày** | ✅ **Không giới hạn** | ✅ **Không giới hạn** |
| **Auto-PR Workflow** | ❌ (Thủ công) | ✅ `orca publish` | ✅ `orca publish` |
| **AI Model** | Gemini Flash | GPT-4o, Claude 3.5 Sonnet | GPT-4o, Claude 3.5 Sonnet |
| **Conflict Resolution** | ❌ (Tự sửa) | ✅ AI hướng dẫn sửa | ✅ AI hướng dẫn + Team share |
| **Release Notes** | ❌ | ✅ Tạo tự động | ✅ Tạo tự động |
| **Templates** | Cơ bản | Custom Instructions | Shared Team Templates |
| **Analytics** | ❌ | ❌ | ✅ Team Dashboard |
| **Support** | Cộng đồng | Email | Priority Support |

---

## 🌟 Tính Năng Cốt Lõi (Core AI Features)

Các tính năng có biểu tượng ✨ sử dụng AI và sẽ tính vào giới hạn request của gói (Quota).

### `orca commit` ✨
*(Tính vào AI Quota)*
Tự động phân tích các thay đổi (staged & unstaged), tạo commit message có ý nghĩa và nhóm các thay đổi một cách logic.
- **Tùy chọn:**
  - `--confirm`: Xem trước và xác nhận các commit (mặc định: `true`).
  - `--dry-run`: Chỉ in ra kế hoạch, không thực hiện commit.
  - `--model`: Chọn model AI (mặc định: `gemini-2.5-flash`).

### `orca plan` ✨
*(Tính vào AI Quota)*
Chỉ tạo một kế hoạch commit (file JSON) mà không thực hiện lệnh git nào. Hữu ích khi bạn muốn xem AI sẽ làm gì hoặc chỉnh sửa kế hoạch trước khi áp dụng.
- **Tùy chọn:**
  - `--out <file>`: Xuất kế hoạch ra file JSON.
  - `--json-only`: Chỉ in output JSON (dùng cho scripts).

### `orca apply`
Thực thi một kế hoạch commit đã được tạo từ trước (bằng `orca plan`).
- **Lưu ý**: Lệnh này **không trừ AI Quota** vì nó chỉ chạy kế hoạch đã có.
- **Tùy chọn:**
  - `--file <path>`: Đường dẫn đến file plan JSON.
  - `--push`: Tự động push sau khi commit.
  - `--publish`: Tạo branch mới, push và tạo Pull Request (PR).

### `orca publish` ✨
*(Yêu cầu gói **Pro** hoặc **Team**)*
Kết hợp `apply` và quy trình tạo PR chuyên nghiệp.
1. Commit theo plan.
2. Tạo/chuyển sang branch tính năng.
3. Push lên remote.
4. Tạo PR trên GitHub (sử dụng `gh` CLI).

### `orca publish-current`
Dùng cho trường hợp bạn đã có các commit và chỉ muốn đẩy code lên & tạo PR nhanh chóng.

---

## 🛠 Git Wrapper (`orca g` / `orca git`)
*(Miễn phí hoàn toàn - Không giới hạn)*

Các lệnh Git cơ bản được nâng cấp với giao diện đẹp hơn và thông tin hữu ích hơn.

- `orca g status` (hoặc `st`): Xem trạng thái working tree với format dễ đọc.
- `orca g log` (hoặc `lg`): Xem lịch sử commit.
  - `-n <number>`: Số lượng commit.
  - `--oneline`: Chế độ xem gọn.
  - `--graph`: Xem biểu đồ nhánh.
- `orca g sync`: Đồng bộ với remote (fetch + pull).
  - `--rebase`: Sử dụng rebase thay vì merge.

---

## 🌿 Quản Lý Branch (`orca br` / `orca branch`)
*(Miễn phí hoàn toàn - Không giới hạn)*

Quản lý nhánh thông minh theo chuẩn convention.

- `orca br current`: Xem nhánh hiện tại.
- `orca br list`: Liệt kê các branch.
  - `-r`: Bao gồm remote branch.
- `orca br new <type> <name>`: Tạo nhánh mới chuẩn format `<type>/<name>`.
  - Ví dụ: `orca br new feat user-auth` -> tạo branch `feat/user-auth`.
- `orca br publish`: Đẩy branch hiện tại lên remote và set tracking.

---

## 🌊 Flow Orchestration (`orca fl` / `orca flow`)
*(Miễn phí hoàn toàn - Không giới hạn)*

Quản lý vòng đời của một tính năng từ lúc bắt đầu đến khi kết thúc.

- `orca fl start`: Bắt đầu một flow mới (tạo branch chuẩn).
  - `--type`: Loại (feat, fix, chore...).
  - `--name`: Tên tính năng.
- `orca fl finish`: Kết thúc flow.
  - `--push`: Push code lên.
  - `--pr`: Tự động tạo PR.

---

## 🧹 Dọn Dẹp Lịch Sử (`orca td` / `orca tidy`)
*(Miễn phí hoàn toàn - Không giới hạn)*

Các công cụ giúp giữ lịch sử commit sạch đẹp (Clean Git History).

- `orca td rebase`: Interactive rebase thông minh (có auto-squash).
- `orca td squash`: Gộp tất cả commit trong nhánh hiện tại thành 1 commit duy nhất.
- `orca td fixup <commit-hash>`: Tạo fixup commit cho một commit cụ thể (để sau này autosquash).
- `orca td amend`: Sửa commit mới nhất (giữ nguyên message hoặc sửa đổi).

---

## ⚔️ Xử Lý Xung Đột (`orca cf` / `orca conflict`)

Hỗ trợ giải quyết merge/rebase conflict.

- `orca cf status`: Xem danh sách file đang bị conflict.
- `orca cf guide` ✨: Hướng dẫn giải quyết conflict từng bước.
  - `--ai`: Dùng AI để giải thích code conflict và đề xuất cách sửa (*Chỉ gói **Pro/Team***).
- `orca cf continue`: Tiếp tục rebase/merge sau khi đã sửa conflict.
- `orca cf abort`: Hủy bỏ quá trình rebase/merge.

---

## 📦 Phát Hành (`orca rl` / `orca release`)

Hỗ trợ quy trình release và đánh version.

- `orca rl tag <version>`: Tạo git tag.
  - `--push`: Push tag lên remote.
- `orca rl notes` ✨: Tạo release notes tự động từ lịch sử commit.
  - *(Chỉ gói **Pro/Team**)*
- `orca rl create <version>`: Tạo GitHub Release hoàn chỉnh (tag + notes).

---

## 📚 Stacked Branches (`orca sk` / `orca stack`)
*(Miễn phí hoàn toàn - Không giới hạn)*

Hỗ trợ quy trình làm việc "Stacked Diffs" (nhiều nhánh phụ thuộc nhau).

- `orca sk start <name>`: Tạo nhánh con (stacked) trên nhánh hiện tại.
- `orca sk list`: Xem danh sách các branch trong stack.
- `orca sk rebase`: Rebase lại toàn bộ stack khi nhánh gốc thay đổi.
- `orca sk publish`: Publish và tạo chuỗi PR phụ thuộc nhau (Stacked PRs).

---

## 🛡 An Toàn & Bảo Mật (`orca safe`)

Các tính năng kiểm tra an toàn trước khi đẩy code.

- `orca safe scan`: Quét các file (staged) để tìm thông tin nhạy cảm (secrets, keys...).
- `orca safe preflight`: Kiểm tra tổng thể trước khi push (check branch protection, trạng thái CI/CD...).

---

## ⚙️ Thiết Lập & Tiện Ích

- `orca setup`: Cấu hình tài khoản Git.
- `orca login`: Đăng nhập để kích hoạt gói **Pro/Team** và đồng bộ license.
- `orca doctor`: Kiểm tra môi trường (Git version, API status...).
- `orca update`: Kiểm tra và cập nhật phiên bản Orca CLI mới nhất.
- `orca menu`: Menu tương tác để quản lý cài đặt.
