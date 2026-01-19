"use client";

import { InfoIcon } from "./icons";

const KeyIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M14 11C14 12.6569 12.6569 14 11 14C9.34315 14 8 12.6569 8 11C8 9.34315 9.34315 8 11 8C12.6569 8 14 9.34315 14 11Z"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path
            d="M14 11L21 18M21 18L19 20M21 18L21 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M11 20C6.02944 20 2 15.9706 2 11C2 6.02944 6.02944 2 11 2C15.9706 2 20 6.02944 20 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const WalletIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M20 12V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V12ZM20 12H16C15.4477 12 15 12.4477 15 13C15 13.5523 15.4477 14 16 14H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ByokSection = () => {
    return (
        <section className="relative overflow-hidden py-20 lg:py-24">

            <div className="relative z-10 grid gap-12 lg:gap-16">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        100% Free Tool
                    </div>

                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                        Bring Your Own Key. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Pay Zero Markups.</span>
                    </h2>

                    <p className="text-lg text-neutral-400 leading-relaxed text-pretty">
                        Orca is completely free to use. We don't resell AI credits.
                        Simply plug in your API key from your favorite provider and pay them directly
                        (often with generous free tiers!).
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-8 transition-all hover:border-emerald-500/30">
                        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                            <WalletIcon className="h-6 w-6" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-white">Direct Billing</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            No middleman. No subscription fees. You only pay for what you use, directly to OpenAI, Google, or Anthropic.
                        </p>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-8 transition-all hover:border-emerald-500/30">
                        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                            <KeyIcon className="h-6 w-6" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-white">Model Agnostic</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            Switch between Gemini 1.5, DeepSeek V3, GPT-4o, or any local LLM via Ollama instantly. You are not locked in.
                        </p>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-8 transition-all hover:border-emerald-500/30">
                        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                            <LockIcon className="h-6 w-6" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-white">Security First</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            Your API keys are stored encrypted on your local machine's keychain. We never touch, see, or store your credentials.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
