"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 88"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203L0 12.402zm35.67 33.529l.028 34.453L.028 75.48.016 46.12l35.654-.189zM87.984 5.228l-48.46 6.604-.016 34.332 48.492-.284-.016-40.652zM88 49.955l-.016 40.817-48.508-6.837-.028-34.254 48.552.274z" />
    </svg>
  );
}

function LinuxIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/linux.svg"
      alt="Linux"
      width={300}
      height={300}
      className={className}
    />
  );
}

function MacIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/mac.svg"
      alt="Mac"
      width={300}
      height={300}
      className={className}
    />
  );
}

function TerminalWindow({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-white/10 bg-[#0c0c0c] shadow-2xl font-mono text-sm leading-relaxed flex flex-col ${className}`}>
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <div className="ml-4 text-xs font-medium text-white/40">{title}</div>
      </div>
      <div className="p-6 text-neutral-300 font-mono">
        {children}
      </div>
    </div>
  )
}

function DashedCard({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div
        className="h-full border-2 border-dashed border-white/20 bg-neutral-900/50 p-5 relative overflow-hidden transition-colors hover:border-emerald-500/30"
        style={{
          borderStyle: 'dashed',
          borderWidth: '2px',
          borderColor: 'rgba(255,255,255,0.2)'
        }}
      >
        {title && <div className="text-sm font-semibold mb-2">{title}</div>}
        {children}
      </div>
    </div>
  )
}

function ReleaseButton({ href, icon: Icon, label, subLabel }: { href: string; icon: any; label: string; subLabel?: string }) {
  return (
    <a
      href={href}
      className="group relative flex items-center justify-center gap-4 border-2 border-dashed border-white/20 bg-neutral-900/50 p-4 transition-all hover:bg-neutral-800 hover:border-emerald-500/40"
    >
      <Icon className="h-8 w-8 text-white group-hover:text-emerald-400 transition-colors" />
      <div className="text-left">
        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{label}</div>
        {subLabel && <div className="text-xs text-neutral-500">{subLabel}</div>}
      </div>
    </a>
  );
}

function CodeCard({
  label,
  helper,
  code,
}: {
  label: string;
  helper: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="group relative overflow-hidden bg-neutral-900/80 p-5 border-2 border-dashed border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-neutral-300">
            {label}
          </div>
          <div className="mt-1 text-sm text-neutral-300/90">{helper}</div>
        </div>
        <button
          type="button"
          className="shrink-0 border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-100 transition hover:bg-white/10"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="mt-4 overflow-x-auto border-t border-dashed border-white/10 bg-black/50 p-4 text-sm leading-6 text-neutral-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Home() {
  const repo = process.env.NEXT_PUBLIC_ORCA_REPO ?? "vanthaita/Orca";
  const repoUrl = useMemo(() => `https://github.com/${repo}`, [repo]);
  const releaseUrl = useMemo(() => `${repoUrl}/releases/latest`, [repoUrl]);
  const issuesUrl = useMemo(() => `${repoUrl}/issues`, [repoUrl]);
  const msiUrl = useMemo(
    () => `${repoUrl}/releases/latest/download/OrcaSetup.msi`,
    [repoUrl]
  );

  const [isWindows, setIsWindows] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsWindows(/Win/i.test(navigator.userAgent));
    }
  }, []);

  const quickStart = useMemo(
    () =>
      [
        "# Windows (recommended)",
        `# Download OrcaSetup.msi from ${releaseUrl}`,
        "# Install (Next → Next → Finish)",
        "orca --version",
        "",
        "# Portable option",
        `# Download the zip/tar from ${releaseUrl}`,
        "",
        "orca --help",
      ].join("\n"),
    [releaseUrl]
  );

  const dailyWorkflow = useMemo(
    () =>
      [
        "# Setup & Health Check",
        "orca setup --name \"Your Name\" --email \"you@example.com\"",
        "orca doctor",
        "",
        "# AI-Powered Commit Workflow",
        "orca commit                    # Intelligent commit grouping",
        "orca plan --out plan.json      # Generate execution plan",
        "orca apply --file plan.json    # Apply saved plan",
        "",
        "# Publish to GitHub",
        "orca publish-current --pr      # Push & create PR",
        "orca publish plan.json --pr    # Apply plan & publish",
      ].join("\n"),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-neutral-100 font-sans selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/2 h-[36rem] -translate-x-1/2 rounded-full bg-emerald-900/20 blur-[100px]" />
        <div className="absolute -bottom-44 left-1/3 h-[34rem] -translate-x-1/2 rounded-full bg-blue-900/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))]" />
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDQwIEw0MCAwIE0wIDAgTDQwIDQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-20"></div>
      </div>

      <div className="relative mx-auto max-w-[80rem] px-6 py-14 sm:py-20">
        <header className="flex items-center justify-between gap-4">
          <a className="flex items-center gap-3 group" href="#top">
            <div className="leading-tight">
              <div className="text-2xl font-black tracking-tighter text-white uppercase italic group-hover:text-emerald-400 transition-colors">
                Orca
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 sm:flex">
            <a
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              href="#how-it-works"
            >
              Overview
            </a>
            <a
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </header>

        <main className="mt-2 grid gap-16" id="top">
          <section className="grid gap-16">
            <div className="inline-flex w-fit items-center gap-3 border-b border-white/10 pb-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <span>v0.1.0</span>
              <span className="h-3 w-px bg-white/20"></span>
              <span>Rust CLI</span>
            </div>

            <div className="grid items-center gap-16 xl:grid-cols-[1.1fr_1.3fr]">
              <div className="grid gap-8">
                <h1 className="text-balance text-6xl font-bold leading-none tracking-tight sm:text-8xl">
                  Command the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Deep Work.</span>
                </h1>
                <p className="max-w-xl text-pretty text-xl leading-relaxed text-neutral-400">
                  Orca is an AI-powered CLI that intelligently groups your changes into semantic commits using Gemini.
                  Automate git workflows, generate execution plans, and streamline your GitHub releases.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <a
                    className="relative inline-flex items-center justify-center gap-3 bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-emerald-300 group overflow-hidden"
                    href={msiUrl}
                    style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                    <WindowsIcon className="h-5 w-5" />
                    <span>Download for Windows</span>
                  </a>
                  <a
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white transition hover:text-emerald-400"
                    href={releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View release notes →
                  </a>
                </div>
                {isWindows && (
                  <div className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider">
                    ★ Recommmended for your system
                  </div>
                )}
              </div>

              {/* Display Image instead of Quick Start Code */}
              <div id="hero-image" className="relative group perspective-1000">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur opacity-50"></div>
                <div className="relative border-2 border-dashed border-white/20 bg-neutral-900/50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767370505/pejzaqh8mx1yc076ncoz.png"
                    alt="Orca CLI Preview"
                    className="w-full h-auto shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* New Download Section */}
            <div className="grid gap-8 border-t border-dashed border-white/10 pt-16">
              <h2 className="text-xl font-bold tracking-tight uppercase text-neutral-300 mb-4">Install on your platform</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                <ReleaseButton
                  href={msiUrl}
                  icon={WindowsIcon}
                  label="Windows"
                  subLabel="MSI Installer (x64)"
                />
                <ReleaseButton
                  href={releaseUrl} // Linking to release page as generic direct link might be guessing
                  icon={LinuxIcon}
                  label="Linux"
                  subLabel="See Release Assets"
                />
                <ReleaseButton
                  href={releaseUrl}
                  icon={MacIcon}
                  label="macOS"
                  subLabel="See Release Assets"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-16 py-10">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Focus on the code, not the rituals</h2>
              <p className="text-neutral-400">Orca automates the tedious parts of git and release management.</p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Orca Commit Example */}
              <div className="grid gap-6 h-full">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-emerald-400 font-mono">01. orca commit</h3>
                  <p className="text-sm text-neutral-400">Intelligent context grouping and commit message generation.</p>
                </div>
                <TerminalWindow title="User@Orca-Dev: ~/projects/orca" className="h-full">
                  <div className="space-y-4">
                    <span className="text-green-400">➜</span> <span className="text-cyan-400">~/projects/orca</span> <span className="text-neutral-400">git:(main)</span> orca commit
                    <div className="text-neutral-500 mt-2">== orca: commit ==</div>
                    <div className="text-emerald-400">Gemini plan received</div>

                    <div className="underline decoration-neutral-700 underline-offset-4">Proposed plan</div>

                    {/* Commit #1 */}
                    <div>
                      <div className="text-blue-400 font-bold">Commit #1 (2 file(s))</div>
                      <div className="pl-4 border-l border-white/10 mt-1 space-y-1">
                        <div><span className="text-neutral-500">message:</span> <span className="text-emerald-300">feat(installer): Add Windows MSI build and release pipeline</span></div>
                        <div>
                          <span className="text-neutral-500">files:</span>
                          <div className="pl-4 text-neutral-400 text-xs">
                            - .github/workflows/release.yml<br />
                            - installer/
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      Apply this plan? This will run git add/commit commands: <span className="text-white font-bold">yes</span>
                    </div>
                    <div className="text-emerald-500">Commits created</div>
                  </div>
                </TerminalWindow>
              </div>

              <div className="grid gap-6 h-full">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-emerald-400 font-mono">02. orca publish</h3>
                  <p className="text-sm text-neutral-400">Automated branch creation, push, and PR flow.</p>
                </div>
                <TerminalWindow title="User@Orca-Dev: ~/projects/orca" className="h-full mb-24">
                  <div>
                    <span className="text-green-400">➜</span> <span className="text-cyan-400">~/projects/orca</span> <span className="text-neutral-400">git:(main)</span> orca publish
                  </div>
                  <div className="mt-4">
                    <span className="text-blue-400">ℹ</span> Checking branch status... <span className="text-green-500">OK</span>
                  </div>
                  <div>
                    <span className="text-blue-400">ℹ</span> Pushing to <span className="text-yellow-400">origin/feat/ui-update</span>... <span className="text-green-500">Done</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-blue-400">ℹ</span> Creating Pull Request...
                  </div>
                  <div className="mt-2 p-2 bg-emerald-900/20 text-emerald-300 rounded text-xs">
                    Title: feat(ui): update button component styles<br />
                    Body: Auto-generated by Orca
                  </div>
                  <div className="mt-4">
                    <span className="text-green-500">✔</span> PR Created: <a href="#" className="underline text-blue-400">https://github.com/.../pull/124</a>
                  </div>
                  <div className="mt-1 text-neutral-500">
                    Opening browser...
                  </div>
                </TerminalWindow>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="grid gap-8">
            <div className="border-t border-white/10 pt-10">
              <h2 className="text-2xl font-bold tracking-tight uppercase">Workflow</h2>
            </div>


            <div className="grid gap-6 sm:grid-cols-3">
              <DashedCard className="min-h-[200px] flex flex-col justify-between" title="">
                <div className="absolute top-4 right-4 text-4xl text-emerald-500/20 font-black group-hover:text-emerald-500/40 transition-colors">01</div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-2">Commit</div>
                  <div className="text-neutral-400 text-sm leading-relaxed">
                    Guided prompts. Semantic grouping. Clean history by default.
                  </div>
                </div>
              </DashedCard>

              <DashedCard className="min-h-[200px] flex flex-col justify-between" title="">
                <div className="absolute top-4 right-4 text-4xl text-emerald-500/20 font-black group-hover:text-emerald-500/40 transition-colors">02</div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-2">Plan</div>
                  <div className="text-neutral-400 text-sm leading-relaxed">
                    Generate JSON execution plans. CI/CD ready artifacts.
                  </div>
                </div>
              </DashedCard>

              <DashedCard className="min-h-[200px] flex flex-col justify-between" title="">
                <div className="absolute top-4 right-4 text-4xl text-emerald-500/20 font-black group-hover:text-emerald-500/40 transition-colors">03</div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-2">Publish</div>
                  <div className="text-neutral-400 text-sm leading-relaxed">
                    Zero-friction releases. Automated PR creation.
                  </div>
                </div>
              </DashedCard>
            </div>
          </section>

          <section className="relative overflow-hidden">
            {/* Daily Workflow Card Styled */}
            <div className="relative z-10">
              <CodeCard
                label="DAILY ROUTINE"
                helper="Your new muscle memory:"
                code={dailyWorkflow}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
              <div className="text-sm text-neutral-500 font-mono">
                REPO: <span className="text-neutral-300">{repo}</span>
              </div>
              <a
                className="text-sm font-bold text-white hover:text-emerald-400 transition-colors uppercase tracking-wider"
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Source Code →
              </a>
            </div>
          </section>

          <footer className="flex flex-col gap-6 border-t border-white/10 pt-12 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono uppercase tracking-widest text-xs">© {new Date().getFullYear()} Orca CLI</div>
            <div className="flex items-center gap-8 font-medium">
              <a
                className="hover:text-white transition-colors"
                href={releaseUrl}
                target="_blank"
                rel="noreferrer"
              >
                DL
              </a>
              <a className="hover:text-white transition-colors" href="https://github.com/vanthaita/Orca/blob/main/LICENSE" target="_blank">
                License
              </a>
              <a className="hover:text-white transition-colors" href={issuesUrl} target="_blank" rel="noreferrer">
                Issues
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
