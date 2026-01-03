
"use client";

import { InfoIcon } from "./icons";

interface FeedbackCardProps {
    user: string;
    handle: string;
    content: string;
    platform: "Twitter" | "GitHub" | "Discord";
    tag: string;
}

const FeedbackCard = ({ user, handle, content, platform, tag }: FeedbackCardProps) => {
    return (
        <div className="flex flex-col gap-3 rounded border-2 border-dashed border-white/20 bg-neutral-900/80 p-4 transition-all hover:border-emerald-500/50 group h-full cursor-default">
            <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium text-neutral-300 leading-snug group-hover:text-emerald-400 transition-colors">
                    "{content}"
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-900/50 border-2 border-dashed border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                        {user.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white leading-none">{user}</span>
                        <span className="text-[9px] text-neutral-500 font-mono leading-none">{handle}</span>
                    </div>
                </div>

                <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${platform === "Twitter" ? "bg-blue-400" :
                            platform === "GitHub" ? "bg-white" : "bg-indigo-400"
                        }`}></span>
                    {platform}
                </div>
            </div>

            <div className="flex gap-2 border-t-2 border-dashed border-white/15 pt-2 mt-1">
                <span className="px-1.5 py-0.5 rounded border-2 border-dashed border-white/20 text-[9px] text-emerald-500/80 font-mono bg-emerald-500/5">
                    {tag}
                </span>
            </div>
        </div>
    );
};

const KanbanColumn = ({ title, count, children }: { title: string, count: number, children: React.ReactNode }) => (
    <div className="flex flex-col gap-4 h-full p-2 rounded-xl bg-white/5 border-2 border-dashed border-white/20">
        <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
            <h3 className="text-sm font-bold text-neutral-300">{title}</h3>
            <span className="text-xs font-mono text-neutral-500 bg-black/40 px-1.5 rounded-full ml-auto">{count}</span>
        </div>
        <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 custom-scrollbar">
            {children}
        </div>
    </div>
);

export const SocialProof = () => {
    return (
        <section className="grid gap-12 border-t-2 border-dashed border-white/20 py-20">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl inline-flex items-center gap-2 justify-center">
                    <InfoIcon className="h-5 w-5 text-emerald-400" />
                    Community Feedback
                </h2>
                <p className="text-neutral-400 text-lg">
                    See what developers are building and saying about Orca.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto w-full px-4 items-stretch">
                {/* Column 1 */}
                <KanbanColumn title="Workflow Wins" count={3}>
                    <FeedbackCard
                        user="Sarah Drasner"
                        handle="@sarah_edo"
                        content="The semantic grouping logic in Orca is scary good. It figured out I was refactoring auth just by looking at the diffs."
                        platform="Twitter"
                        tag="#Productivity"
                    />
                    <FeedbackCard
                        user="Guillermo Rauch"
                        handle="@rauchg"
                        content="Finally, a CLI that feels like it was built for the AI era. The 'plan' command is essential."
                        platform="Twitter"
                        tag="#DX"
                    />
                    <FeedbackCard
                        user="Discord User"
                        handle="dev_notes"
                        content="Just merged a massive PR without headaches. Orca handled the description and grouping perfectly."
                        platform="Discord"
                        tag="#Release"
                    />
                </KanbanColumn>

                {/* Column 2 */}
                <KanbanColumn title="Feature Love" count={3}>
                    <FeedbackCard
                        user="Kent C. Dodds"
                        handle="@kentcdodds"
                        content="I love that it is local-first. I can use my own API keys and nothing leaves my machine except the diffs."
                        platform="Twitter"
                        tag="#Privacy"
                    />
                    <FeedbackCard
                        user="Theo Browne"
                        handle="@t3dotgg"
                        content="The terminal UI is clean. Fast, responsive, and actually helpful error messages."
                        platform="GitHub"
                        tag="#UI/UX"
                    />
                    <FeedbackCard
                        user="Developer"
                        handle="@dev_feedback"
                        content="The confirm + dry-run flags make it safe to adopt. I can inspect everything before Orca touches git."
                        platform="GitHub"
                        tag="#Safety"
                    />
                </KanbanColumn>

                {/* Column 3 */}
                <KanbanColumn title="Adoption" count={3}>
                    <FeedbackCard
                        user="Vercel Eng"
                        handle="@vercel_eng"
                        content="We've started using Orca for our internal tooling scripts. It saves us hours on documentation."
                        platform="Twitter"
                        tag="#Enterprise"
                    />
                    <FeedbackCard
                        user="Rustacean"
                        handle="@rust_fan"
                        content="Blazing fast. The Rust implementation makes the AI interactions feel instantaneous."
                        platform="GitHub"
                        tag="#Performance"
                    />
                    <FeedbackCard
                        user="Alex"
                        handle="@alex_code"
                        content="Replaced my custom git aliases with Orca. It's just better."
                        platform="Discord"
                        tag="#Workflow"
                    />
                </KanbanColumn>
            </div>
        </section>
    );
};
