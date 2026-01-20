
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TerminalWindow } from "./TerminalWindow";
import { BookIcon } from "./icons";

export const GuideSection = () => {
    const toc = [
        { id: "quickstart", title: "Quickstart" },
        { id: "install", title: "Install" },
        { id: "setup", title: "Setup (BYOK)" },
        { id: "commit", title: "orca commit" },
        { id: "publish", title: "orca publish" },
        { id: "planning", title: "Planning (plan/apply)" },
        { id: "tips", title: "Troubleshooting & Tips" },
        { id: "reference", title: "Command Reference" },
    ] as const;

    return (
        <section id="guides" className="grid gap-16 py-10 border-t-2 border-dashed border-white/20">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-4 uppercase inline-flex items-center gap-2 justify-center">
                    <BookIcon className="h-5 w-5 text-emerald-400" />
                    Documentation
                </h2>
                <p className="text-neutral-400">
                    Practical docs for Orca CLI: commit messages, semantic commits, and publishing Pull Requests.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_2.5fr]">
                {/* Sidebar Navigation */}
                <div className="flex flex-col gap-2">
                    <div className="rounded-xl border-2 border-dashed border-white/20 bg-neutral-900/30 p-4">
                        <div className="mb-3 text-xs font-mono uppercase tracking-widest text-neutral-500">On this page</div>
                        <div className="grid gap-2">
                            {toc.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white"
                                >
                                    {item.title}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] border-2 border-dashed border-white/20 bg-neutral-900/30 rounded-xl p-8 lg:p-12">
                    <div className="grid gap-14">
                        <DocSection id="quickstart" title="Quickstart">
                            <p className="text-neutral-400 leading-relaxed">
                                The fastest path: install Orca, run <code className="text-emerald-300">orca commit</code>, then publish a Pull Request with <code className="text-emerald-300">orca publish</code>.
                            </p>
                            <TerminalWindow title="Quickstart">
                                <div className="space-y-2">
                                    <div><span className="text-green-400">➜</span> npm install -g orcacli</div>
                                    <div><span className="text-green-400">➜</span> orca setup</div>
                                    <div><span className="text-green-400">➜</span> orca commit</div>
                                    <div className="text-neutral-500">== orca: commit ==</div>
                                    <div className="text-emerald-400">AI plan received</div>
                                    <div className="text-neutral-500">Proposed plan: 2 commits</div>
                                    <div className="text-emerald-500">Commits created</div>
                                    <br />
                                    <div><span className="text-green-400">➜</span> orca publish --pr</div>
                                    <div className="text-emerald-500">✔ PR Created</div>
                                </div>
                            </TerminalWindow>
                        </DocSection>

                        <DocSection id="install" title="Install">
                            <div className="grid gap-4">
                                <div>
                                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">Node (recommended)</div>
                                    <div className="mt-2 bg-black/50 p-4 rounded border-2 border-dashed border-white/20 font-mono text-sm text-neutral-300">
                                        npm install -g orcacli
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">Bun</div>
                                    <div className="mt-2 bg-black/50 p-4 rounded border-2 border-dashed border-white/20 font-mono text-sm text-neutral-300">
                                        bun install -g orcacli
                                    </div>
                                </div>
                            </div>
                        </DocSection>

                        <DocSection id="setup" title="Setup (BYOK)">
                            <p className="text-neutral-400 leading-relaxed">
                                Orca is open-source and works best with BYOK (Bring Your Own Key). Your code stays local; only diffs are sent for analysis.
                            </p>
                            <TerminalWindow title="Setup">
                                <div className="space-y-2">
                                    <div><span className="text-green-400">➜</span> orca setup --name "Your Name" --email "you@example.com"</div>
                                    <div><span className="text-green-400">➜</span> orca setup --provider openai --api-key sk-...</div>
                                    <div className="text-neutral-500">Saved config.</div>
                                </div>
                            </TerminalWindow>
                        </DocSection>

                        <DocSection id="commit" title="orca commit">
                            <p className="text-neutral-400 leading-relaxed">
                                <code className="text-emerald-300">orca commit</code> groups your changes into semantic commits and writes clean messages automatically.
                            </p>
                            <TerminalWindow title="orca commit">
                                <div className="space-y-2">
                                    <div><span className="text-green-400">➜</span> orca commit</div>
                                    <div className="text-neutral-500">== orca: commit ==</div>
                                    <div className="text-emerald-400">AI plan received</div>
                                    <div className="underline decoration-neutral-700 underline-offset-4">Proposed plan</div>
                                    <div className="text-blue-400 font-bold">Commit #1 (3 file(s))</div>
                                    <div className="pl-4 border-l-2 border-dashed border-white/20">
                                        <div><span className="text-neutral-500">message:</span> <span className="text-emerald-300">feat(auth): add OAuth callback + session storage</span></div>
                                    </div>
                                    <div className="text-blue-400 font-bold">Commit #2 (2 file(s))</div>
                                    <div className="pl-4 border-l-2 border-dashed border-white/20">
                                        <div><span className="text-neutral-500">message:</span> <span className="text-emerald-300">fix(ui): align header + update hero layout</span></div>
                                    </div>
                                    <div className="text-neutral-500">Apply this plan? (yes/no)</div>
                                    <div className="text-emerald-500">Commits created</div>
                                </div>
                            </TerminalWindow>
                        </DocSection>

                        <DocSection id="publish" title="orca publish">
                            <p className="text-neutral-400 leading-relaxed">
                                <code className="text-emerald-300">orca publish</code> automates branch creation, push, and PR creation (via GitHub CLI).
                            </p>
                            <TerminalWindow title="orca publish">
                                <div className="space-y-2">
                                    <div><span className="text-green-400">➜</span> orca publish --pr</div>
                                    <div className="text-neutral-500">Checking branch status... OK</div>
                                    <div className="text-neutral-500">Pushing to origin/feat/your-branch... Done</div>
                                    <div className="text-neutral-500">Creating Pull Request...</div>
                                    <div className="text-emerald-500">✔ PR Created</div>
                                </div>
                            </TerminalWindow>
                            <p className="text-sm text-neutral-500">
                                Tip: install GitHub CLI first: <code className="text-neutral-300">gh auth login</code>
                            </p>
                        </DocSection>

                        <DocSection id="planning" title="Planning (plan/apply)">
                            <p className="text-neutral-400 leading-relaxed">
                                Use planning mode when you want reviewable artifacts. Generate a plan file, edit it, then apply.
                            </p>
                            <TerminalWindow title="Plan & Apply">
                                <div className="space-y-2">
                                    <div><span className="text-green-400">➜</span> orca plan --out plan.json</div>
                                    <div className="text-neutral-500">Plan saved to ./plan.json</div>
                                    <div><span className="text-green-400">➜</span> orca apply --file plan.json</div>
                                    <div className="text-emerald-500">Applied plan successfully.</div>
                                </div>
                            </TerminalWindow>
                        </DocSection>

                        <DocSection id="tips" title="Troubleshooting & Tips">
                            <div className="grid gap-4 text-neutral-400">
                                <div>
                                    <div className="text-sm font-semibold text-neutral-200">No changes detected</div>
                                    <div className="text-sm">Run <code className="text-neutral-200">git status</code> first; Orca only commits modified files in a git repo.</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-neutral-200">Rate limits / API errors</div>
                                    <div className="text-sm">Switch provider/model or use your own token (BYOK). Check your key and quota.</div>
                                </div>
                            </div>
                        </DocSection>

                        <DocSection id="reference" title="Command Reference">
                            <div className="grid gap-4">
                                <ReferenceItem
                                    command="orca commit"
                                    description="Analyze changes, propose semantic commits, and generate commit messages."
                                    examples={["orca commit", "orca commit --dry-run"]}
                                />
                                <ReferenceItem
                                    command="orca publish"
                                    description="Commit + push + open a Pull Request (GitHub CLI)."
                                    examples={["orca publish --pr", "orca publish --branch feat/x --base main --pr"]}
                                />
                                <ReferenceItem
                                    command="orca plan"
                                    description="Generate a plan file to review/edit before applying."
                                    examples={["orca plan --out plan.json"]}
                                />
                                <ReferenceItem
                                    command="orca apply"
                                    description="Apply an existing plan file (plan.json)."
                                    examples={["orca apply --file plan.json"]}
                                />
                                <ReferenceItem
                                    command="orca setup"
                                    description="Configure name/email, provider, model, and API keys (global or local)."
                                    examples={["orca setup", "orca setup --local --provider openai --api-key sk-..."]}
                                />
                                <ReferenceItem
                                    command="orca doctor"
                                    description="Check your environment and repository health."
                                    examples={["orca doctor"]}
                                />
                            </div>

                            <div className="mt-8 text-sm text-neutral-500">
                                Looking for more? Visit the repo on GitHub: <Link className="underline text-emerald-400" href="https://github.com/vanthaita/Orca-CLI" target="_blank" rel="noreferrer">vanthaita/Orca-CLI</Link>
                            </div>
                        </DocSection>
                    </div>
                </div>
            </div>
        </section>
    );
};

const DocSection = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
    <section id={id} className="scroll-mt-28">
        <div className="mb-4">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <div className="mt-2 h-px w-full bg-white/10" />
        </div>
        <div className="grid gap-5">{children}</div>
    </section>
);

const ReferenceItem = ({ command, description, examples }: { command: string; description: string; examples: string[] }) => (
    <div className="p-5 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-white/20 transition-colors">
        <div className="flex flex-wrap items-center gap-3 mb-3">
            <code className="text-emerald-400 font-bold bg-emerald-950/30 px-3 py-1 rounded text-sm">{command}</code>
        </div>
        <p className="text-sm text-neutral-300 mb-4 leading-relaxed">{description}</p>
        <div className="grid gap-2">
            {examples.map((ex) => (
                <div key={ex} className="bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-neutral-300 overflow-x-auto">
                    {ex}
                </div>
            ))}
        </div>
    </div>
);
