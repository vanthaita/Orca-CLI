"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export const SiteFooter = () => {
    return (
        <footer className="border-t-2 border-dashed border-white/20 pt-12">
            <div className="grid gap-8 sm:grid-cols-2 sm:items-end">
                <div className="grid gap-2">
                    <div className="text-sm font-black tracking-tight text-white uppercase italic">
                        Orca CLI
                    </div>
                    <div className="text-xs text-neutral-500 leading-relaxed max-w-md">
                        AI-powered Git workflow that helps you ship clean commits and publish PRs faster.
                    </div>
                    <div className="pt-2 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                        © {new Date().getFullYear()} Orca CLI
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono uppercase tracking-widest text-neutral-400 transition hover:bg-white/10 hover:text-white"
                            href="/terms"
                        >
                            Terms
                        </Link>
                        <Link
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono uppercase tracking-widest text-neutral-400 transition hover:bg-white/10 hover:text-white"
                            href="/privacy"
                        >
                            Privacy
                        </Link>
                        <Link
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono uppercase tracking-widest text-neutral-400 transition hover:bg-white/10 hover:text-white"
                            href="/refund"
                        >
                            Refund
                        </Link>
                        <Link
                            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono uppercase tracking-widest text-neutral-400 transition hover:bg-white/10 hover:text-white"
                            href="https://github.com/vanthaita/Orca-CLI"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Github className="h-4 w-4" />
                            GitHub
                        </Link>
                    </div>
                    <div className="text-xs text-neutral-600">
                        Built with Rust. Free &amp; open-source.
                    </div>
                </div>
            </div>
        </footer>
    );
};
