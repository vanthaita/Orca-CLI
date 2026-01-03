"use client";

import { useState } from "react";

interface FaqItemProps {
    question: string;
    answer: string;
}

const FaqItem = ({ question, answer }: FaqItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b-2 border-dashed border-white/10 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-emerald-400"
            >
                <span className="text-lg font-bold">{question}</span>
                <span
                    className={`ml-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 transition-transform ${isOpen ? "rotate-45 border-emerald-500/50 bg-emerald-500/10 text-emerald-500" : ""
                        }`}
                >
                    +
                </span>
            </button>
            <div
                className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] pb-0 opacity-0"
                    }`}
            >
                <div className="overflow-hidden text-neutral-400 leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    );
};

export const FaqSection = () => {
    const faqs = [
        {
            question: "Is my code safe?",
            answer: "Yes. Orca only sends the diffs (changes) of your staged files to the selected AI provider to generate commit messages. Your full codebase is never uploaded or stored persistently.",
        },
        {
            question: "Do I need an API key?",
            answer: "Yes. You’ll need an API key for the AI provider/model you choose. Configure it via environment variables (depending on the provider).",
        },
        {
            question: "Can I edit the commit messages before they are applied?",
            answer: "Absolutely. When you run 'orca commit', it presents an interactive plan. You can choose to accept it or cancel. For more control, use 'orca plan --out plan.json', edit the JSON file manually, and then run 'orca apply'.",
        },
        {
            question: "What platforms are supported?",
            answer: "Orca is written in Rust and supports Windows, macOS, and Linux. We provide pre-built binaries and MSI installers for Windows.",
        },
        {
            question: "How does 'orca publish' handle Pull Requests?",
            answer: "'orca publish' uses the GitHub CLI (gh) under the hood. It ensures your changes are on a fresh branch, pushes them, and then triggers 'gh pr create' with a summary generated from your commits.",
        },
    ];

    return (
        <section id="faq" className="grid gap-16 py-10 border-t border-dashed border-white/10">
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-4 uppercase sticky top-24">
                        FAQ
                    </h2>
                    <p className="text-neutral-400">
                        Common questions about Orca.
                    </p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 px-8">
                    {faqs.map((faq, idx) => (
                        <FaqItem key={idx} {...faq} />
                    ))}
                </div>
            </div>
        </section>
    );
};
