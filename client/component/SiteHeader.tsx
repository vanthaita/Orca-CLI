"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { BookIcon, HelpIcon, InfoIcon, PackageIcon } from "@/component/icons";

export const SiteHeader = () => {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    return (
        <header className="flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3 group" href="/">
                <div className="leading-tight">
                    <div className="text-2xl font-black tracking-tighter text-white uppercase italic group-hover:text-emerald-400 transition-colors">
                        Orca Cli
                    </div>
                </div>
            </Link>

            <nav className="hidden items-center gap-6 sm:flex">
                <Link
                    className="text-sm font-medium text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-2"
                    href="/guide#basics"
                >
                    <InfoIcon className="h-4 w-4" />
                    Overview
                </Link>
                <Link
                    className="text-sm font-medium text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-2"
                    href="/pricing"
                >
                    <PackageIcon className="h-4 w-4" />
                    Pricing
                </Link>
                <Link
                    className="text-sm font-medium text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-2"
                    href="/guide"
                >
                    <BookIcon className="h-4 w-4" />
                    Guide
                </Link>
                <Link
                    className="text-sm font-medium text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-2"
                    href="/#faq"
                >
                    <HelpIcon className="h-4 w-4" />
                    FAQ
                </Link>
                {!isAuthLoading && (
                    <Link
                        className="inline-flex items-center gap-2 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500"
                        href={isAuthenticated ? "/dashboard" : "/login"}
                        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        {isAuthenticated ? "Dashboard" : "Login"}
                    </Link>
                )}
            </nav>
        </header>
    );
};
