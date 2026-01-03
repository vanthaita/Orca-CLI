import Link from "next/link";
import { useState } from "react";

import { DownloadIcon, PackageIcon, TerminalIcon } from "./icons";

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
    const [viewMode, setViewMode] = useState<"download" | "cli" | "npm" | "bun" | "brew" | "winget">("download");

    if (!releases || releases.length === 0) return null;

    return (
        <div className={`w-full overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/5 ${className}`}>
            <div className="flex items-center justify-between border-b border-white/15 bg-white/5 px-4">
                <div className="flex flex-wrap">
                    <button
                        onClick={() => setViewMode("download")}
                        className={`px-4 py-3 text-sm font-medium transition-colors ${viewMode === "download"
                            ? "text-emerald-400 border-b-2 border-emerald-400"
                            : "text-neutral-400 hover:text-neutral-200"
                            }`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <DownloadIcon className="h-4 w-4" />
                            Downloads
                        </span>
                    </button>
                    <button
                        onClick={() => setViewMode("cli")}
                        className={`px-4 py-3 text-sm font-medium transition-colors ${viewMode === "cli"
                            ? "text-emerald-400 border-b-2 border-emerald-400"
                            : "text-neutral-400 hover:text-neutral-200"
                            }`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <TerminalIcon className="h-4 w-4" />
                            Command Line
                        </span>
                    </button>
                    <button
                        type="button"
                        disabled
                        className="px-4 py-3 text-sm font-medium text-neutral-500 cursor-not-allowed opacity-70"
                        title="Coming soon"
                    >
                        <span className="inline-flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            npm
                        </span>
                        <span className="ml-2 text-[10px] uppercase tracking-wider">Coming soon</span>
                    </button>
                    <button
                        type="button"
                        disabled
                        className="px-4 py-3 text-sm font-medium text-neutral-500 cursor-not-allowed opacity-70"
                        title="Coming soon"
                    >
                        <span className="inline-flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            bun
                        </span>
                        <span className="ml-2 text-[10px] uppercase tracking-wider">Coming soon</span>
                    </button>
                    <button
                        type="button"
                        disabled
                        className="px-4 py-3 text-sm font-medium text-neutral-500 cursor-not-allowed opacity-70"
                        title="Coming soon"
                    >
                        <span className="inline-flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            brew
                        </span>
                        <span className="ml-2 text-[10px] uppercase tracking-wider">Coming soon</span>
                    </button>
                    <button
                        type="button"
                        disabled
                        className="px-4 py-3 text-sm font-medium text-neutral-500 cursor-not-allowed opacity-70"
                        title="Coming soon"
                    >
                        <span className="inline-flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            winget
                        </span>
                        <span className="ml-2 text-[10px] uppercase tracking-wider">Coming soon</span>
                    </button>
                </div>
            </div>

            {viewMode === "download" ? (
                <div className="divide-y divide-white/15 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {releases.map((release) => {
                        const date = new Date(release.published_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        });

                        const msiAsset = release.assets.find((a) => a.name.endsWith(".msi"));
                        const downloadUrl = msiAsset?.browser_download_url || release.html_url;

                        return (
                            <div key={release.tag_name} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group">
                                <div className="flex flex-col gap-1">
                                    <span className="font-mono text-sm font-bold text-emerald-400 group-hover:text-emerald-300">
                                        {release.tag_name}
                                    </span>
                                    <span className="text-xs text-neutral-500">{date}</span>
                                </div>
                                <Link
                                    href={downloadUrl}
                                    target="_blank"
                                    className="text-xs bg-white/10 hover:bg-white/20 text-neutral-300 px-3 py-1.5 rounded-md transition-colors font-medium"
                                >
                                    {msiAsset ? "Download MSI" : "View Release"}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : viewMode === "cli" ? (
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Linux / macOS Install</h4>
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-lg blur-sm  transition-all" />
                            <div className="relative bg-black/40 border-2 border-dashed border-white/20 rounded-lg p-3 font-mono text-xs text-neutral-300 overflow-x-auto flex items-center justify-between gap-4">
                                <code className="whitespace-pre">curl -fsSL https://raw.githubusercontent.com/vanthaita/orca-releases/main/install.sh | sh</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText("curl -fsSL https://raw.githubusercontent.com/vanthaita/orca-releases/main/install.sh | sh");
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
        </div>
    );
};
