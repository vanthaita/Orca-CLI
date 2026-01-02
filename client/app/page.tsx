export default function Home() {
  const repo = process.env.NEXT_PUBLIC_ORCA_REPO ?? "OWNER/REPO";
  const repoUrl = `https://github.com/${repo}`;
  const releaseUrl = `${repoUrl}/releases/latest`;
  const issuesUrl = `${repoUrl}/issues`;
  const basics = "orca --help\norca --version\norca doctor";
  const installWindows = `# Tải binary từ GitHub Releases\n# ${releaseUrl}\n# thêm orca.exe vào PATH\n\n# Verify\norca --version`;
  const installMacLinux = `# Tải binary từ GitHub Releases\n# ${releaseUrl}\n\nchmod +x ./orca\nsudo mv ./orca /usr/local/bin\n\n# Verify\norca --version`;
  const daily = "orca commit\norca plan --out plan.json\norca publish-current --pr";

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[34rem]  -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[32rem]  -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <div className="h-2.5 w-2.5 rounded-full bg-white/80" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-neutral-100">
                Orca CLI
              </div>
              <div className="text-xs text-neutral-400">Tối giản hoá workflow Git</div>
            </div>
          </div>

          <nav className="hidden items-center gap-3 sm:flex">
            <a
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-neutral-100 transition hover:bg-white/10"
              href="#install"
            >
              Cài đặt
            </a>
            <a
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-neutral-100 transition hover:bg-white/10"
              href="#commands"
            >
              Commands
            </a>
            <a
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-neutral-100 transition hover:bg-white/10"
              href={releaseUrl}
              target="_blank"
              rel="noreferrer"
            >
              Releases
            </a>
          </nav>
        </header>

        <main className="mt-14 grid gap-10">
          <section className="grid gap-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Rust + Clap • Commit • Plan • Publish
            </div>

            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Commit rõ ràng hơn. Lên plan nhanh hơn. Publish gọn hơn.
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-7 text-neutral-300 sm:text-lg">
              Orca là CLI nhỏ gọn để hỗ trợ workflow Git hằng ngày: tạo commit theo nhóm,
              sinh plan JSON, publish branch/PR, và kiểm tra môi trường.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                className="inline-flex items-center justify-center rounded-full bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white"
                href={releaseUrl}
                target="_blank"
                rel="noreferrer"
              >
                Tải bản mới nhất
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-neutral-100 transition hover:bg-white/10"
                href="#install"
              >
                Xem cách cài đặt
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-neutral-300 transition hover:text-neutral-100"
                href={issuesUrl}
                target="_blank"
                rel="noreferrer"
              >
                Báo lỗi / góp ý
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium">Minimal</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Prompt sạch, ít bước thừa.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium">Fast feedback</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Rust CLI, phản hồi nhanh.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium">Workflow-ready</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Commit, plan, publish, doctor.
                </div>
              </div>
            </div>
          </section>

          <section
            id="install"
            className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Cài đặt</h2>
              <p className="text-sm leading-6 text-neutral-300">
                Nhanh nhất là tải binary ở GitHub Releases. Nếu bạn public dự án,
                bạn có thể phát hành qua Scoop/Homebrew để cài 1 lệnh.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-5">
                <div className="text-xs font-medium text-neutral-400">Windows</div>
                <pre className="mt-3 overflow-x-auto text-sm leading-6 text-neutral-100">
                  <code>{installWindows}</code>
                </pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-5">
                <div className="text-xs font-medium text-neutral-400">macOS / Linux</div>
                <pre className="mt-3 overflow-x-auto text-sm leading-6 text-neutral-100">
                  <code>{installMacLinux}</code>
                </pre>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-neutral-950/60 p-5">
              <div className="text-xs font-medium text-neutral-400">Gợi ý</div>
              <div className="mt-2 text-sm leading-6 text-neutral-300">
                Đặt biến môi trường <span className="font-mono">NEXT_PUBLIC_ORCA_REPO</span> (vd:
                <span className="font-mono"> yourname/orca</span>) để các link Releases/Issues trên
                trang này đúng repo của bạn.
              </div>
            </div>
          </section>

          <section
            id="commands"
            className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Commands</h2>
              <p className="text-sm leading-6 text-neutral-300">
                Một vài lệnh bạn sẽ dùng hằng ngày.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-5">
                <div className="text-xs font-medium text-neutral-400">Basics</div>
                <pre className="mt-3 overflow-x-auto text-sm leading-6 text-neutral-100">
                  <code>{basics}</code>
                </pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-5">
                <div className="text-xs font-medium text-neutral-400">Daily workflow</div>
                <pre className="mt-3 overflow-x-auto text-sm leading-6 text-neutral-100">
                  <code>{daily}</code>
                </pre>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-neutral-400">
                Repo: <span className="font-mono">{repo}</span>
              </div>
              <a
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-neutral-100 transition hover:bg-white/10"
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open GitHub
              </a>
            </div>
          </section>

          <footer className="flex flex-col gap-2 border-t border-white/10 pt-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Orca CLI</div>
            <div className="flex items-center gap-4">
              <a
                className="transition hover:text-neutral-300"
                href={releaseUrl}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
              <a className="transition hover:text-neutral-300" href="#install">
                Install
              </a>
              <a className="transition hover:text-neutral-300" href="#commands">
                Commands
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
