import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { PackageIcon, TerminalIcon } from "./icons";

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
}

export interface Release {
    tag_name: string;
    html_url: string;
    published_at: string;
    assets: ReleaseAsset[];
}

interface VersionListProps {
    releases: Release[];
    className?: string;
}


export const VersionList = ({ releases, className = "" }: VersionListProps) => {
    const [viewMode, setViewMode] = useState<"download" | "cli" | "npm" | "bun">("npm");

    if (!releases || releases.length === 0) return null;

    const latestRelease = [...releases].sort(
        (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )[0];

    const date = new Date(latestRelease.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const assets = latestRelease.assets || [];

    const windowsAsset =
        assets.find((a) => a.name.toLowerCase().endsWith(".msi")) ||
        assets.find((a) => a.name.toLowerCase().endsWith(".exe"));

    const macAsset =
        assets.find((a) => /mac|osx|darwin/i.test(a.name) && a.name.toLowerCase().endsWith(".dmg")) ||
        assets.find((a) => /mac|osx|darwin/i.test(a.name) && a.name.toLowerCase().endsWith(".pkg")) ||
        assets.find((a) => /mac|osx|darwin/i.test(a.name) && a.name.toLowerCase().endsWith(".zip"));

    const linuxAsset =
        assets.find((a) => /linux/i.test(a.name) && a.name.toLowerCase().endsWith(".tar.gz")) ||
        assets.find((a) => /linux/i.test(a.name) && a.name.toLowerCase().endsWith(".appimage")) ||
        assets.find((a) => /linux/i.test(a.name) && a.name.toLowerCase().endsWith(".deb")) ||
        assets.find((a) => /linux/i.test(a.name) && a.name.toLowerCase().endsWith(".rpm"));

    return (
        <div className={cn("w-full overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/5", className)}>
            <div className="flex items-center justify-between border-b border-white/15 bg-white/5 px-4">
                <div className="flex flex-wrap">
                    <button
                        onClick={() => setViewMode("npm")}
                        className={cn(
                            "px-4 py-3 text-sm font-medium transition-colors",
                            viewMode === "npm"
                                ? "text-emerald-400 border-b-2 border-emerald-400"
                                : "text-neutral-400 hover:text-neutral-200"
                        )}
                    >
                        <span className="inline-flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            npm
                        </span>
                    </button>
                    <button
                        onClick={() => setViewMode("bun")}
                        className={cn(
                            "px-4 py-3 text-sm font-medium transition-colors",
                            viewMode === "bun"
                                ? "text-emerald-400 border-b-2 border-emerald-400"
                                : "text-neutral-400 hover:text-neutral-200"
                        )}
                    >
                        <span className="inline-flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            bun
                        </span>
                    </button>

                    <button
                        onClick={() => setViewMode("cli")}
                        className={cn(
                            "px-4 py-3 text-sm font-medium transition-colors",
                            viewMode === "cli"
                                ? "text-emerald-400 border-b-2 border-emerald-400"
                                : "text-neutral-400 hover:text-neutral-200"
                        )}
                    >
                        <span className="inline-flex items-center gap-2">
                            <TerminalIcon className="h-4 w-4" />
                            CLI
                        </span>
                    </button>
                </div>
            </div>

            {viewMode === "npm" ? (
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">NPM Global Install</h4>
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-lg blur-sm transition-all" />
                            <div className="relative bg-black/40 border-2 border-dashed border-white/20 rounded-lg p-3 font-mono text-xs text-neutral-300 overflow-x-auto flex items-center justify-between gap-4">
                                <code className="whitespace-pre">npm install -g orcacli</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText("npm install -g orcacli");
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-neutral-400 hover:text-white"
                                    title="Copy command"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-neutral-500">
                            Requires Node.js. Install globally (-g) for system-wide access.
                        </p>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-neutral-300">Direct Downloads</h4>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="font-mono text-xs font-bold text-emerald-400">
                                    {latestRelease.tag_name}
                                </span>
                                <span className="text-[10px] text-neutral-500">{date}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <Link
                                href={windowsAsset?.browser_download_url || latestRelease.html_url}
                                target="_blank"
                                className="text-xs bg-white/10 hover:bg-white/20 text-neutral-300 px-3 py-2 rounded-md transition-colors font-medium text-center"
                            >
                                Windows
                            </Link>
                            <Link
                                href={macAsset?.browser_download_url || latestRelease.html_url}
                                target="_blank"
                                className="text-xs bg-white/10 hover:bg-white/20 text-neutral-300 px-3 py-2 rounded-md transition-colors font-medium text-center"
                            >
                                macOS
                            </Link>
                            <Link
                                href={linuxAsset?.browser_download_url || latestRelease.html_url}
                                target="_blank"
                                className="text-xs bg-white/10 hover:bg-white/20 text-neutral-300 px-3 py-2 rounded-md transition-colors font-medium text-center"
                            >
                                Linux
                            </Link>
                        </div>
                    </div>
                </div>
            ) : viewMode === "cli" ? (
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Linux / macOS Install</h4>
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-lg blur-sm  transition-all" />
                            <div className="relative bg-black/40 border-2 border-dashed border-white/20 rounded-lg p-3 font-mono text-xs text-neutral-300 overflow-x-auto flex items-center justify-between gap-4">
                                <code className="whitespace-pre">curl -fsSL https://raw.githubusercontent.com/vanthaita/Orca/main/install.sh | sh</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText("curl -fsSL https://raw.githubusercontent.com/vanthaita/Orca/main/install.sh | sh");
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-neutral-400 hover:text-white"
                                    title="Copy command"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-neutral-500">
                            Detects OS/Arch automatically. Installs to <code className="bg-white/5 px-1 rounded">/usr/local/bin</code>.
                        </p>
                    </div>
                </div>
            ) : viewMode === "bun" ? (
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Bun Global Install</h4>
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-lg blur-sm transition-all" />
                            <div className="relative bg-black/40 border-2 border-dashed border-white/20 rounded-lg p-3 font-mono text-xs text-neutral-300 overflow-x-auto flex items-center justify-between gap-4">
                                <code className="whitespace-pre">bun install -g orcacli</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText("bun install -g orcacli");
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-neutral-400 hover:text-white"
                                    title="Copy command"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-neutral-500">
                            Fast installation with Bun.
                        </p>
                    </div>
                </div>

            ) : (
                <div className="p-6">
                    <div className="rounded-lg border-2 border-dashed border-white/20 bg-black/30 p-4">
                        <div className="text-sm font-medium text-neutral-200">Coming soon</div>
                        <div className="mt-1 text-xs text-neutral-400">
                            This installer method is not available yet.
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
