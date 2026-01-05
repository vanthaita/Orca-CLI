
"use client";

import { useEffect, useState } from "react";
import { TerminalWindow } from "./TerminalWindow";

interface TextSegment {
    text: string;
    className?: string;
}

type Line = TextSegment[];

const TERMINAL_CONTENT: Line[] = [
    // Line 1: Prompt + Command
    [
        { text: "➜ ", className: "text-green-400" },
        { text: "~/projects/orca ", className: "text-cyan-400" },
        { text: "git:(main) ", className: "text-neutral-400" },
        { text: "orca commit", className: "text-white" },
    ],
    // Line 2
    [{ text: "== orca: commit ==", className: "text-neutral-500" }],
    // Line 3
    [{ text: "AI plan received", className: "text-emerald-400" }],
    // Line 4 (Empty)
    [{ text: "", className: "" }],
    // Line 5
    [{ text: "Proposed plan", className: "underline decoration-neutral-700 underline-offset-4" }],
    // Line 6
    [{ text: "Commit #1 (2 file(s))", className: "text-blue-400 font-bold" }],
    // Line 7
    [
        { text: "  message: ", className: "text-neutral-500" },
        { text: "feat(installer): Add Windows MSI build and release pipeline", className: "text-emerald-300" }
    ],
    // Line 8
    [
        { text: "  files:", className: "text-neutral-500" }
    ],
    // Line 9
    [{ text: "    - .github/workflows/release.yml", className: "text-neutral-400" }],
    // Line 10
    [{ text: "    - installer/", className: "text-neutral-400" }],
    // Line 11 (Empty)
    [{ text: "", className: "" }],
    // Line 12
    [
        { text: "Apply this plan? This will run git add/commit commands: ", className: "text-white" },
        { text: "yes", className: "text-emerald-400 font-bold" }
    ],
    // Line 13
    [{ text: "Commits created", className: "text-emerald-500" }]
];

export const TerminalTypewriter = () => {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);

    // Derived state
    const isFinished = currentLineIndex >= TERMINAL_CONTENT.length;

    // Flatten the current line into a single string to simplify char tracking
    const getLineText = (line: Line) => line.map((s) => s.text).join("");

    useEffect(() => {
        if (isFinished) return;



        const currentLineSegments = TERMINAL_CONTENT[currentLineIndex];
        const fullLineText = getLineText(currentLineSegments);

        const timeoutId = setTimeout(() => {
            if (currentCharIndex < fullLineText.length) {
                setCurrentCharIndex((prev) => prev + 1);
            } else {
                // Line finished, move to next
                setCurrentLineIndex((prev) => prev + 1);
                setCurrentCharIndex(0);
            }
        }, 30); // Typing speed in ms

        return () => clearTimeout(timeoutId);
    }, [currentCharIndex, currentLineIndex, isFinished]);

    // Helper to render a partially typed line with segments
    const renderPartialLine = (line: Line, charCount: number) => {
        let charsRemaining = charCount;
        const result: React.ReactNode[] = [];

        for (let i = 0; i < line.length; i++) {
            const segment = line[i];
            if (charsRemaining <= 0) break;

            const textToRender = segment.text.slice(0, charsRemaining);
            result.push(
                <span key={i} className={segment.className}>
                    {textToRender}
                </span>
            );
            charsRemaining -= segment.text.length;
        }
        return result;
    };

    return (
        <TerminalWindow title="User@Orca-Dev: ~/projects/orca">
            <div className="flex flex-col gap-1 min-h-[360px]">
                {TERMINAL_CONTENT.map((line, idx) => {
                    if (idx > currentLineIndex) return null;

                    // If it's a past line, render fully
                    if (idx < currentLineIndex) {
                        return (
                            <div key={idx} className="whitespace-pre-wrap break-all min-h-[1.5em]">
                                {line.map((seg, sIdx) => (
                                    <span key={sIdx} className={seg.className}>
                                        {seg.text}
                                    </span>
                                ))}
                            </div>
                        );
                    }

                    // If it's the current line, render partially
                    return (
                        <div key={idx} className="whitespace-pre-wrap break-all min-h-[1.5em]">
                            {renderPartialLine(line, currentCharIndex)}
                            <span className="animate-pulse inline-block w-2 h-4 bg-emerald-500 align-middle ml-1" />
                        </div>
                    );
                })}
            </div>
        </TerminalWindow>
    );
};
