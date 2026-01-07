"use client";

import Link from "next/link";

export const SiteFooter = () => {
    return (
        <footer className="flex flex-col gap-6 border-t-2 border-dashed border-white/20 pt-12 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono uppercase tracking-widest text-xs">© {new Date().getFullYear()} Orca CLI</div>
            <div className="flex items-center gap-6 font-medium">
                <Link className="hover:text-white transition-colors" href="/terms">
                    Terms
                </Link>
                <Link className="hover:text-white transition-colors" href="/privacy">
                    Privacy
                </Link>
                <Link className="hover:text-white transition-colors" href="/refund">
                    Refund
                </Link>
                <Link
                    className="hover:text-white transition-colors"
                    href="https://github.com/vanthaita/orca-releases"
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub (Releases)
                </Link>
            </div>
        </footer>
    );
};
