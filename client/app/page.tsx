"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";

import {
  CodeCard,
  FaqSection,
  LinuxIcon,
  MacIcon,
  ModelShowcase,
  ReleaseButton,
  SocialProof,
  TerminalWindow,
  TerminalTypewriter,
  VersionList,
  WindowsIcon,
  IntroductionSection,
  SiteHeader,
  SiteFooter,
  WorkflowSection,
  PackageIcon,
} from "@/component";

const Home = () => {
  useAuth();
  const repo = "vanthaita/Orca-CLI";

  const [releases, setReleases] = useState<any[]>([]);
  const [latestRelease, setLatestRelease] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases`);
        if (!res.ok) throw new Error("Failed to fetch releases");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReleases(data);
          setLatestRelease(data[0]);
        }
      } catch (error) {
        console.error("Error fetching releases:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, [repo]);

  const msiUrl = useMemo(() => {
    if (!latestRelease) return "#";
    const asset = latestRelease.assets?.find((a: any) => a.name.endsWith(".msi"));
    return asset ? asset.browser_download_url : latestRelease.html_url;
  }, [latestRelease]);

  const linuxUrl = useMemo(() => {
    if (!latestRelease) return "#";
    const asset = latestRelease.assets?.find((a: any) => a.name.includes("linux") && a.name.endsWith(".tar.gz"));
    return asset ? asset.browser_download_url : latestRelease.html_url;
  }, [latestRelease]);

  const versionString = isLoading ? "..." : (latestRelease?.tag_name || "v0.1.2");

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
        <SiteHeader />

        <main className="mt-2 grid gap-16" id="top">
          <section className="grid gap-16">
            <div className="inline-flex w-fit items-center gap-3 border-b-2 border-dashed border-white/20 pb-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <span className={isLoading ? "animate-pulse" : ""}>{versionString}</span>
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
                  Orca is an AI-powered CLI that intelligently groups your changes into semantic commits using multiple AI models.
                  Automate git workflows, generate execution plans, and streamline your GitHub releases.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("npm install -g orcacli");
                      const btn = document.getElementById("npm-install-btn-text");
                      if (btn) {
                        const original = btn.innerText;
                        btn.innerText = "Copied!";
                        setTimeout(() => {
                          btn.innerText = original;
                        }, 2000);
                      }
                    }}
                    className={`relative inline-flex items-center justify-center gap-3 bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-emerald-300 group overflow-hidden cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                    <PackageIcon className="h-5 w-5" />
                    <span id="npm-install-btn-text">Install using NPM</span>
                  </button>

                  <Link
                    className="relative inline-flex items-center justify-center gap-3 bg-neutral-900 border border-neutral-800 px-8 py-4 text-sm font-bold text-neutral-300 transition hover:text-white hover:border-neutral-700 hover:bg-neutral-800 group overflow-hidden"
                    href={msiUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                    <WindowsIcon className="h-5 w-5 text-neutral-500 group-hover:text-white transition-colors" />
                    <span>Download Installer</span>
                  </Link>
                </div>
                {isWindows && (
                  <div className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider flex items-center gap-2">
                    <span>★ Recommmended for your system</span>
                    <span className="text-neutral-600">|</span>
                    <span className="text-neutral-500">v0.1.2</span>
                  </div>
                )}
              </div>

              <div id="hero-image" className="relative group perspective-1000">
                <TerminalTypewriter />
              </div>
            </div>

            <div className="grid gap-8 border-t-2 border-dashed border-white/20 pt-16">
              <h2 className="text-xl font-bold tracking-tight uppercase text-neutral-300 mb-4">Install on your platform</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                <ReleaseButton
                  href={msiUrl}
                  icon={WindowsIcon}
                  label="Windows"
                  subLabel="MSI Installer (x64)"
                  comingSoon={isLoading}
                />
                <ReleaseButton
                  href={linuxUrl}
                  icon={LinuxIcon}
                  label="Linux"
                  subLabel="x64 tar.gz"
                  comingSoon={isLoading}
                />
                <ReleaseButton
                  href={linuxUrl}
                  icon={MacIcon}
                  label="macOS"
                  subLabel="x64 tar.gz"
                  comingSoon={isLoading}
                />
              </div>

              {releases.length > 0 && (
                <div className="mt-8">
                  <VersionList releases={releases} />
                </div>
              )}
            </div>

          </section>

          <IntroductionSection />

          <ModelShowcase />


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
                    <div className="text-emerald-400">AI plan received</div>

                    <div className="underline decoration-neutral-700 underline-offset-4">Proposed plan</div>

                    <div>
                      <div className="text-blue-400 font-bold">Commit #1 (2 file(s))</div>
                      <div className="pl-4 border-l-2 border-dashed border-white/20 mt-1 space-y-1">
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
                <TerminalWindow title="User@Orca-Dev: ~/projects/orca" className="h-full mb-30">
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

          <WorkflowSection />

          <SocialProof />

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
                CLI Version: <span className={`text-neutral-300 ${isLoading ? "animate-pulse" : ""}`}>{versionString}</span>
              </div>
            </div>
          </section>
          <SiteFooter />
        </main>
      </div>
    </div>
  );
};

export default Home;
