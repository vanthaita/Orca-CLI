import { CodeCard } from "./CodeCard";

interface CommandItemProps {
    command: string;
    description: string;
    args?: { arg: string; desc: string }[];
}

const CommandItem = ({ command, description, args }: CommandItemProps) => {
    return (
        <div className="border-2 border-dashed border-white/10 bg-neutral-900/50 p-6 rounded-lg hover:border-emerald-500/30 transition-colors group">
            <div className="font-mono text-emerald-400 font-bold mb-2 text-lg">
                {command}
            </div>
            <p className="text-neutral-400 mb-4 text-sm leading-relaxed">
                {description}
            </p>
            {args && args.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                        Arguments
                    </div>
                    <ul className="space-y-1">
                        {args.map((arg, idx) => (
                            <li key={idx} className="grid grid-cols-[1fr_2fr] gap-4 text-sm font-mono">
                                <span className="text-neutral-300 bg-white/5 py-0.5 px-2 rounded w-fit h-fit">
                                    {arg.arg}
                                </span>
                                <span className="text-neutral-500">{arg.desc}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const HelpSection = () => {
    return (
        <section id="help" className="grid gap-16 py-10 border-t border-dashed border-white/10">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-4 uppercase">
                    Command Reference
                </h2>
                <p className="text-neutral-400">
                    Complete guide to the Orca CLI toolset.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <CommandItem
                    command="orca setup"
                    description="Initialize your local identity and configure global or local preferences."
                    args={[
                        { arg: "--name", desc: "Set your git user.name" },
                        { arg: "--email", desc: "Set your git user.email" },
                        { arg: "--local", desc: "Save to local repo config only" },
                    ]}
                />
                <CommandItem
                    command="orca doctor"
                    description="Diagnose your environment. Checks for git repo, API keys, and required tools."
                />
                <CommandItem
                    command="orca commit"
                    description="Analyze staged changes and generate semantic commit groups using Gemini."
                    args={[
                        { arg: "--model", desc: "Specify Gemini model (default: gemini-2.5-flash)" },
                        { arg: "--dry-run", desc: "Preview plan without applying" },
                    ]}
                />
                <CommandItem
                    command="orca plan"
                    description="Generate a commit plan and save it to a JSON file for later execution."
                    args={[
                        { arg: "--out", desc: "Output file path (e.g. plan.json)" },
                        { arg: "--json-only", desc: "Output raw JSON to stdout" },
                    ]}
                />
                <CommandItem
                    command="orca apply"
                    description="Execute a previously generated plan file."
                    args={[
                        { arg: "--file", desc: "Path to plan JSON file" },
                        { arg: "--push", desc: "Push changes after committing" },
                    ]}
                />
                <CommandItem
                    command="orca publish"
                    description="Professional workflow: apply commits, create branch, push, and open PR."
                    args={[
                        { arg: "--branch", desc: "Target branch name" },
                        { arg: "--base", desc: "Base branch for PR (default: main)" },
                    ]}
                />
            </div>
        </section>
    );
};
