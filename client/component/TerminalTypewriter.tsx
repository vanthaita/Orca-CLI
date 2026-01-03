"use client";

import React, { useEffect, useState } from "react";

interface TerminalTypewriterProps {
    className?: string;
}

export const TerminalTypewriter = ({ className = "" }: TerminalTypewriterProps) => {
    const [displayedLines, setDisplayedLines] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    const steps = [
        { type: "prompt", delay: 100 },
        { type: "typing", text: "orca commit", delay: 80 },
        { type: "pause", duration: 600 },
        { type: "newline", delay: 100 },
        { type: "output", content: <div className="text-neutral-500 mt-2">== orca: commit ==</div>, delay: 50 },
        { type: "output", content: <div className="text-emerald-400">AI plan received</div>, delay: 400 },
        { type: "pause", duration: 500 },
        { type: "output", content: <div className="underline decoration-neutral-700 underline-offset-4">Proposed plan</div>, delay: 100 },
        { type: "pause", duration: 400 },
        {
            type: "output",
            content: (
                <div>
                    <div className="text-blue-400 font-bold">Commit #1 (2 file(s))</div>
                    <div className="pl-4 border-l border-white/10 mt-1 space-y-1">
                        <div>
                            <span className="text-neutral-500">message:</span>{" "}
                            <span className="text-emerald-300">feat(installer): Add Windows MSI build and release pipeline</span>
                        </div>
                        <div>
                            <span className="text-neutral-500">files:</span>
                            <div className="pl-4 text-neutral-400 text-xs">
                                - .github/workflows/release.yml<br />
                                - installer/
                            </div>
                        </div>
                    </div>
                </div>
            ),
            delay: 600
        },
        { type: "pause", duration: 500 },
        {
            type: "output",
            content: (
                <div className="pt-2">
                    Apply this plan? This will run git add/commit commands: <span className="text-white font-bold">yes</span>
                </div>
            ),
            delay: 300
        },
        { type: "output", content: <div className="text-emerald-500">Commits created</div>, delay: 200 },
        { type: "pause", duration: 2500 },
        { type: "restart" },
    ];

    useEffect(() => {
        const step = steps[currentStep];
        if (!step) return;

        let timeout: NodeJS.Timeout;

        if (step.type === "prompt") {
            const promptLine = (
                <div key="prompt">
                    <span className="text-green-400">➜</span>{" "}
                    <span className="text-cyan-400">~/projects/orca</span>{" "}
                    <span className="text-neutral-400">git:(main)</span>{" "}
                </div>
            );
            setDisplayedLines([promptLine]);
            timeout = setTimeout(() => setCurrentStep(currentStep + 1), step.delay);
        } else if (step.type === "typing") {
            // Type out the command character by character
            let charIndex = 0;
            const typeChar = () => {
                if (charIndex <= (step.text?.length ?? 0)) {
                    const typedText = step.text?.substring(0, charIndex) ?? "";
                    const updatedPrompt = (
                        <div key="prompt">
                            <span className="text-green-400">➜</span>{" "}
                            <span className="text-cyan-400">~/projects/orca</span>{" "}
                            <span className="text-neutral-400">git:(main)</span>{" "}
                            {typedText}
                        </div>
                    );
                    setDisplayedLines([updatedPrompt]);

                    if (charIndex < (step.text?.length ?? 0)) {
                        charIndex++;
                        timeout = setTimeout(typeChar, step.delay);
                    } else {
                        timeout = setTimeout(() => setCurrentStep(currentStep + 1), 200);
                    }
                }
            };
            typeChar();
        } else if (step.type === "newline") {
            timeout = setTimeout(() => {
                setShowCursor(false);
                setCurrentStep(currentStep + 1);
            }, step.delay);
        } else if (step.type === "output") {
            timeout = setTimeout(() => {
                setDisplayedLines((prev) => [...prev, step.content]);
                setCurrentStep(currentStep + 1);
            }, step.delay);
        } else if (step.type === "pause") {
            timeout = setTimeout(() => setCurrentStep(currentStep + 1), step.duration);
        } else if (step.type === "restart") {
            timeout = setTimeout(() => {
                setDisplayedLines([]);
                setCurrentStep(0);
                setShowCursor(true);
            }, step.delay || 0);
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [currentStep]);

    return (
        <div
            className={`overflow-hidden rounded-lg border-2 border-dashed border-white/10 bg-[#0c0c0c] shadow-2xl font-mono text-sm leading-relaxed flex flex-col ${className}`}
        >
            {/* Terminal Header - matching TerminalWindow style */}
            <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3 shrink-0">
                <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 text-xs font-medium text-white/40">User@Orca-Dev: ~/projects/orca</div>
            </div>

            {/* Terminal Content */}
            <div className="p-6 text-neutral-300 font-mono min-h-[400px] space-y-4">
                {displayedLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                ))}
                {showCursor && currentStep < steps.length && (
                    <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />
                )}
            </div>
        </div>
    );
};
