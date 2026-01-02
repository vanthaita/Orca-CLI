"use client";

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

// Sawtooth border utility using CSS background patterns
function SawtoothCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative bg-neutral-900 border-2 border-transparent ${className}`}
      style={{
        borderImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L10 10 L20 0' fill='none' stroke='%23333' stroke-width='2'/%3E%3C/svg%3E") 20 / 20px repeat`,
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))", // Corner cut effect for extra tech feel combined with sawtooth assumption, but user asked for sawtooth border specifically.
        // Let's stick to a cleaner implementation. The user asked for "border răng cưa".
        // A simple way is a border-image slice.
      }}
    >
      {/* 
        Actually, simpler implementation for "Sawtooth" without complex SVG data URIs that might fail CSP or look bad: 
        Just standard dashed for now? No, user explicitly asked for sawtooth.
        Let's try a CSS mask approach or just use the border-image.
        I will use a dashed border with a specific gap to simulate it, or a zigzag background. 
        Reverting to a simpler "Tech" border (cut corners) which is often synonymous with "rugged" 
        unless they explicitly mean ZIGZAG lines. 
        "Sawtooth" usually means zigzag. 
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
              linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%), 
              linear-gradient(225deg, rgba(255,255,255,0.1) 25%, transparent 25%), 
              linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), 
              linear-gradient(315deg, rgba(255,255,255,0.1) 25%, transparent 25%)
            `,
          backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
          backgroundSize: '20px 20px',
          backgroundRepeat: 'repeat'
        }}
      />
      {/* 
         Let's try a different approach: A dedicated border image is best. 
         I will use the `border-image` property with a zigzag SVG.
      */}
      <div
        className="absolute inset-0 -z-10 bg-black/40"
        style={{
          // Fallback or solid background
        }}
      />
      {children}
    </div>
  );
}

// Improved Sawtooth Implementation
function JaggedCard({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      {/* Border container */}
      <div className="absolute inset-0 bg-neutral-800"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 5% 0%, 5% 2%, 10% 0%, 15% 2%, 20% 0%, 25% 2%, 30% 0%, 35% 2%, 40% 0%, 45% 2%, 50% 0%, 55% 2%, 60% 0%, 65% 2%, 70% 0%, 75% 2%, 80% 0%, 85% 2%, 90% 0%, 95% 2%, 100% 0%)"
          // This is hard to maintain manually. 
          // Let's go with a specialized CSS class approach using linear-gradient for the zigzag pattern.
        }}>
      </div>

      {/* Actual content container with zigzag border */}
      <div className="relative h-full bg-black/40 p-1">
        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20"
          style={{
            // jagged border effect via multiple gradients
            mask: "conic-gradient(from -45deg at bottom, #0000, #000 1deg 90deg, #0000 91deg) 50% / 20px 100%"
          }}
        />

        {/* 
                Simpler approach for reliability:
                Use a background pattern that simulation a zigzag border on the edges.
             */}
        <div className="h-full border border-white/10 bg-neutral-900/50 p-5 relative overflow-hidden">
          {/* Sawtooth / Zigzag top border decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPHBhdGggZD0iTTAgMTAgTDEwIDAgTDIwIDEwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlLXdpZHRoPSIyIiAvPgo8L3N2Zz4=')] bg-repeat-x opacity-50"></div>

          {/* Sawtooth / Zigzag bottom border decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPHBhdGggZD0iTTAgMCBMMTAgMTAgTDIwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIiBzdHJva2Utd2lkdGg9IjIiIC8+Cjwvc3ZnPg==')] bg-repeat-x opacity-50"></div>

          {title && <div className="text-sm font-semibold mb-2">{title}</div>}
          {children}
        </div>
      </div>
    </div>
  )
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
    <div className="group relative overflow-hidden bg-neutral-900/80 p-5">
      {/* Sawtooth borders (Top/Bottom) */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCA1IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCA1IEw1IDAgTDEwIDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIiAvPjwvc3ZnPg==')] bg-repeat-x"></div>
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCA1IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCAwIEw1IDUgTDEwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIiAvPjwvc3ZnPg==')] bg-repeat-x"></div>

      {/* Side borders */}
      <div className="absolute top-0 bottom-0 left-0 w-px bg-white/10"></div>
      <div className="absolute top-0 bottom-0 right-0 w-px bg-white/10"></div>

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
          style={{ clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 100%, 0 25%)" }}
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

      <pre className="mt-4 overflow-x-auto border-t border-white/10 bg-black/50 p-4 text-sm leading-6 text-neutral-100">
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
        "orca commit",
        "orca plan --out plan.json",
        "orca publish-current --pr",
        "orca doctor",
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

      <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <header className="flex items-center justify-between gap-4">
          <a className="flex items-center gap-3 group" href="#top">
            {/* Logo simplified to just Text */}
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

        <main className="mt-20 grid gap-16" id="top">
          <section className="grid gap-10">
            <div className="inline-flex w-fit items-center gap-3 border-b border-white/10 pb-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <span>v0.1.0</span>
              <span className="h-3 w-px bg-white/20"></span>
              <span>Rust CLI</span>
            </div>

            <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-8">
                <h1 className="text-balance text-5xl font-bold leading-none tracking-tight sm:text-7xl">
                  Command the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Deep Work.</span>
                </h1>
                <p className="max-w-xl text-pretty text-lg leading-relaxed text-neutral-400">
                  Orca is a focused CLI for high-velocity engineering. Keep commits atomic,
                  plans visible, and deployments fluid.
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
                    View all downloads →
                  </a>
                </div>
                {isWindows && (
                  <div className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider">
                    ★ Recommmended for your system
                  </div>
                )}
              </div>

              <div id="download" className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur opacity-50"></div>
                <CodeCard
                  label="QUICK START"
                  helper="Get up and running in seconds."
                  code={quickStart}
                />
              </div>
            </div>
          </section>

          <section id="how-it-works" className="grid gap-8">
            <div className="border-t border-white/10 pt-10">
              <h2 className="text-2xl font-bold tracking-tight uppercase">Workflow</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="group relative bg-neutral-900/50 p-6 min-h-[200px] flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCA1IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCA1IEw1IDAgTDEwIDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIiAvPjwvc3ZnPg==')] bg-repeat-x"></div>
                <div className="absolute top-0 bottom-0 left-0 w-px bg-white/10"></div>
                <div className="absolute top-0 bottom-0 right-0 w-px bg-white/10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>

                <div className="text-4xl text-emerald-500/20 font-black absolute top-4 right-4 group-hover:text-emerald-500/40 transition-colors">01</div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-2">Commit</div>
                  <div className="text-neutral-400 text-sm leading-relaxed">
                    Guided prompts. Semantic grouping. Clean history by default.
                  </div>
                </div>
              </div>

              <div className="group relative bg-neutral-900/50 p-6 min-h-[200px] flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCA1IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCA1IEw1IDAgTDEwIDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIiAvPjwvc3ZnPg==')] bg-repeat-x"></div>
                <div className="absolute top-0 bottom-0 left-0 w-px bg-white/10"></div>
                <div className="absolute top-0 bottom-0 right-0 w-px bg-white/10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>

                <div className="text-4xl text-emerald-500/20 font-black absolute top-4 right-4 group-hover:text-emerald-500/40 transition-colors">02</div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-2">Plan</div>
                  <div className="text-neutral-400 text-sm leading-relaxed">
                    Generate JSON execution plans. CI/CD ready artifacts.
                  </div>
                </div>
              </div>

              <div className="group relative bg-neutral-900/50 p-6 min-h-[200px] flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCA1IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCA1IEw1IDAgTDEwIDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIiAvPjwvc3ZnPg==')] bg-repeat-x"></div>
                <div className="absolute top-0 bottom-0 left-0 w-px bg-white/10"></div>
                <div className="absolute top-0 bottom-0 right-0 w-px bg-white/10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>

                <div className="text-4xl text-emerald-500/20 font-black absolute top-4 right-4 group-hover:text-emerald-500/40 transition-colors">03</div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-2">Publish</div>
                  <div className="text-neutral-400 text-sm leading-relaxed">
                    Zero-friction releases. Automated PR creation.
                  </div>
                </div>
              </div>
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
