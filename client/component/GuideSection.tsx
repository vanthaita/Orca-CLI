
"use client";

import { useState } from "react";
import { TerminalWindow } from "./TerminalWindow";
import { BookIcon } from "./icons";

type GuideKey = "basics" | "power" | "team" | "config";

export const GuideSection = () => {
    const [activeGuide, setActiveGuide] = useState<GuideKey>("basics");

    return (
        <section id="guides" className="grid gap-16 py-10 border-t-2 border-dashed border-white/20">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-4 uppercase inline-flex items-center gap-2 justify-center">
                    <BookIcon className="h-5 w-5 text-emerald-400" />
                    User Guides
                </h2>
                <p className="text-neutral-400">
                    Master the Orca workflow, from your first commit to team collaboration.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_2.5fr]">
                {/* Sidebar Navigation */}
                <div className="flex flex-col gap-2">
                    <GuideButton
                        active={activeGuide === "basics"}
                        onClick={() => setActiveGuide("basics")}
                        title="The Basics"
                        description="Everyday commit & push"
                    />
                    <GuideButton
                        active={activeGuide === "power"}
                        onClick={() => setActiveGuide("power")}
                        title="Power User"
                        description="Planning & Editing"
                    />
                    <GuideButton
                        active={activeGuide === "team"}
                        onClick={() => setActiveGuide("team")}
                        title="Team Workflow"
                        description="Publishing & PRs"
                    />
                    <GuideButton
                        active={activeGuide === "config"}
                        onClick={() => setActiveGuide("config")}
                        title="Configuration"
                        description="AI Models & Keys"
                    />
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] border-2 border-dashed border-white/20 bg-neutral-900/30 rounded-xl p-8 lg:p-12">
                    {activeGuide === "basics" && <BasicsGuide />}
                    {activeGuide === "power" && <PowerUserGuide />}
                    {activeGuide === "team" && <TeamWorkflowGuide />}
                    {activeGuide === "config" && <ConfigurationGuide />}
                </div>
            </div>
        </section>
    );
};

const GuideButton = ({ active, onClick, title, description }: { active: boolean, onClick: () => void, title: string, description: string }) => (
    <button
        onClick={onClick}
        className={`text-left p-4 rounded-lg border-2 border-dashed transition-all duration-200 group ${active ? "bg-emerald-500/10 border-emerald-500/50" : "bg-transparent border-white/20 hover:bg-white/5"}`}
    >
        <div className={`font-bold mb-1 ${active ? "text-emerald-400" : "text-neutral-300 group-hover:text-white"}`}>
            {title}
        </div>
        <div className="text-xs text-neutral-500 font-mono">
            {description}
        </div>
    </button>
);

const BasicsGuide = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div>
            <h3 className="text-2xl font-bold text-white mb-4">The Daily Driver</h3>
            <p className="text-neutral-400 leading-relaxed">
                For 90% of your work, you just want to save your progress without thinking too hard about message formatting.
            </p>
        </div>

        <div className="grid gap-6">
            <div className="grid gap-2">
                <div className="text-emerald-400 font-mono font-bold text-sm">STEP 01</div>
                <div className="font-medium text-white">Stage & Run</div>
                <p className="text-sm text-neutral-400">Make your changes, then run the commit command. Orca will detect all modified files.</p>
                <div className="mt-2 bg-black/50 p-4 rounded border-2 border-dashed border-white/20 font-mono text-sm text-neutral-300">
                    $ orca commit
                </div>
            </div>

            <div className="grid gap-2">
                <div className="text-emerald-400 font-mono font-bold text-sm">STEP 02</div>
                <div className="font-medium text-white">Review the Plan</div>
                <p className="text-sm text-neutral-400">Orca proposes a set of commits. You can say &apos;yes&apos; to apply them immediately.</p>
            </div>
        </div>
    </div>
);

const PowerUserGuide = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div>
            <h3 className="text-2xl font-bold text-white mb-4">Planning Mode</h3>
            <p className="text-neutral-400 leading-relaxed">
                Sometimes you need precise control. Generate a plan file, edit it manually, and then execute it.
            </p>
        </div>

        <div className="space-y-6">
            <TerminalWindow title="Planning Workflow">
                <div className="space-y-2">
                    <div><span className="text-green-400">➜</span> orca plan --out plan.json</div>
                    <div className="text-neutral-500">Analysis complete. Plan saved to ./plan.json</div>
                    <br />
                    <div><span className="text-green-400">➜</span> code plan.json <span className="text-neutral-500"># Edit manually</span></div>
                    <br />
                    <div><span className="text-green-400">➜</span> orca apply --file plan.json</div>
                    <div className="text-emerald-400">Successfully applied 3 commits.</div>
                </div>
            </TerminalWindow>

            <p className="text-sm text-neutral-400">
                The `plan.json` file contains an array of changes. You can move files between commits, rename messages, or even split commits down to the hunk level (coming soon).
            </p>
        </div>
    </div>
);

const TeamWorkflowGuide = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div>
            <h3 className="text-2xl font-bold text-white mb-4">Zero-Friction Releases</h3>
            <p className="text-neutral-400 leading-relaxed">
                Stop fighting with git branches and PR descriptions. Let Orca handle the choreography.
            </p>
        </div>

        <div className="grid gap-8">
            <div className="border-l-2 border-emerald-500/30 pl-6 py-2">
                <h4 className="font-bold text-white mb-2">The &quot;Publish&quot; Command</h4>
                <p className="text-neutral-400 text-sm mb-4">
                    `orca publish` is a macro that performs the following:
                </p>
                <ul className="list-disc list-inside text-sm text-neutral-400 space-y-1 font-mono">
                    <li>Checks out a new branch (if needed)</li>
                    <li>Commits any pending changes</li>
                    <li> pushes to origin</li>
                    <li>Uses `gh pr create` to open a Pull Request</li>
                    <li>Generates a PR summary from your commit history</li>
                </ul>
            </div>

            <div className="bg-black/40 rounded-lg p-4 border-2 border-dashed border-white/20">
                <code className="text-emerald-300">
                    orca publish --branch feat/user-auth --base main
                </code>
            </div>
        </div>
    </div>
);

const ConfigurationGuide = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div>
            <h3 className="text-2xl font-bold text-white mb-4">Configuration</h3>
            <p className="text-neutral-400 leading-relaxed">
                Configure your AI models, API keys, and local repository settings.
            </p>
        </div>

        <div className="grid gap-6">
            <div className="grid gap-2">
                <div className="text-emerald-400 font-mono font-bold text-sm">GLOBAL</div>
                <div className="font-medium text-white">Switch AI Provider</div>
                <p className="text-sm text-neutral-400">Set the default AI provider and API key globally.</p>
                <div className="mt-2 bg-black/50 p-4 rounded border-2 border-dashed border-white/20 font-mono text-sm text-neutral-300">
                    $ orca setup --provider openai --api-key sk-...
                </div>
            </div>

            <div className="grid gap-2">
                <div className="text-emerald-400 font-mono font-bold text-sm">LOCAL</div>
                <div className="font-medium text-white">Repository Config</div>
                <p className="text-sm text-neutral-400">Override settings for the current repository only.</p>
                <div className="mt-2 bg-black/50 p-4 rounded border-2 border-dashed border-white/20 font-mono text-sm text-neutral-300">
                    $ orca setup --local --model gpt-4
                </div>
            </div>
        </div>
    </div>
);
