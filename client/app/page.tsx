"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  CodeCard,
  DashedCard,
  LinuxIcon,
  MacIcon,
  ReleaseButton,
  TerminalWindow,
  WindowsIcon,
  HelpSection,
  FaqSection,
  DownloadLinks,
} from "../component";

const Home = () => {
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
    <div className="relative min-h-screen bg-[#0c0c0c] overflow-hidden text-neutral-100 font-sans selection:bg-emerald-500/30">
      <div className="relative mx-auto max-w-[80rem] px-6 py-14 sm:py-20">
        <header className="flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3 group" href="#top">
            <div className="leading-tight">
              <div className="text-2xl font-black tracking-tighter text-white uppercase italic group-hover:text-emerald-400 transition-colors">
                Orca
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              href="#how-it-works"
            >
              Overview
            </Link>
            <Link
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              href="#help"
            >
              Guide
            </Link>
            <Link
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              href="#faq"
            >
              FAQ
            </Link>
            <Link
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
          </nav>
        </header>

        <main className="mt-2 grid gap-16" id="top">
          <section className="grid gap-16">
            <div className="inline-flex w-fit items-center gap-3 border-b border-white/10 pb-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <span>v0.1.2</span>
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
                  <Link
                    className="relative inline-flex items-center justify-center gap-3 bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-emerald-300 group overflow-hidden"
                    href={msiUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                    <WindowsIcon className="h-5 w-5" />
                    <span>Download for Windows</span>
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white transition hover:text-emerald-400"
                    href={releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View release notes →
                  </Link>
                </div>
                {isWindows && (
                  <div className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider">
                    ★ Recommmended for your system
                  </div>
                )}
              </div>

              <div id="hero-image" className="relative group perspective-1000">
                <div className="relative border-2 border-dashed border-white/20 p-1">
                  <Image
                    src="https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767370505/pejzaqh8mx1yc076ncoz.png"
                    alt="Orca CLI Preview"
                    width={1200}
                    height={720}
                    className="w-full h-auto shadow-2xl"
                  />
                </div>
              </div>
            </div>

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
                  href={releaseUrl}
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
              <div className="mt-8 border-t border-dashed border-white/10 pt-8">
                <DownloadLinks />
              </div>
            </div>

          </section>

          <section className="grid gap-16 py-10">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Focus on the code, not the rituals</h2>
              <p className="text-neutral-400">Orca automates the tedious parts of git and release management.</p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
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
                    <span className="text-green-500">✔</span> PR Created: <Link href="#" className="underline text-blue-400">https://github.com/.../pull/124</Link>
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



          <HelpSection />

          <FaqSection />

          <section className="relative overflow-hidden">
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
              <Link
                className="text-sm font-bold text-white hover:text-emerald-400 transition-colors uppercase tracking-wider"
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Source Code →
              </Link>
            </div>
          </section>

          <footer className="flex flex-col gap-6 border-t border-white/10 pt-12 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono uppercase tracking-widest text-xs">© {new Date().getFullYear()} Orca CLI</div>
            <div className="flex items-center gap-8 font-medium">
              <Link
                className="hover:text-white transition-colors"
                href={releaseUrl}
                target="_blank"
                rel="noreferrer"
              >
                DL
              </Link>
              <Link className="hover:text-white transition-colors" href="https://github.com/vanthaita/Orca/blob/main/LICENSE" target="_blank" rel="noreferrer">
                License
              </Link>
              <Link className="hover:text-white transition-colors" href={issuesUrl} target="_blank" rel="noreferrer">
                Issues
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div >
  );
};

export default Home;
