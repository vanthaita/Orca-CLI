
"use client";

import { InfoIcon, GitHubIcon, DiscordIcon, TwitterIcon } from "./icons";

interface FeedbackCardProps {
    user: string;
    handle: string;
    content: string;
    platform: "Twitter" | "GitHub" | "Discord";
    tag: string;
    verified?: boolean;
}

const FeedbackCard = ({ user, handle, content, platform, tag, verified = true }: FeedbackCardProps) => {
    return (
        <div className="flex flex-col gap-4 rounded-xl border-2 border-dashed border-white/10 bg-neutral-900/50 p-5 transition-all hover:border-emerald-500/30 hover:bg-neutral-900/80 group h-full cursor-default relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-black border border-white/10 flex items-center justify-center text-xs text-neutral-400 font-bold shadow-inner">
                        {user.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white leading-none">{user}</span>
                            {verified && (
                                <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                            )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono leading-none">{handle}</span>
                    </div>
                </div>

                <div className={`p-1.5 rounded-full border border-white/5 ${platform === "Twitter" ? "bg-blue-500/10 text-blue-400" :
                        platform === "GitHub" ? "bg-white/10 text-white" : "bg-indigo-500/10 text-indigo-400"
                    }`}>
                    {platform === "Twitter" && <TwitterIcon className="w-3 h-3" />}
                    {platform === "GitHub" && <GitHubIcon className="w-3 h-3" />}
                    {platform === "Discord" && <DiscordIcon className="w-3 h-3" />}
                </div>
            </div>

            {/* Content */}
            <div className="text-sm text-neutral-300 leading-relaxed group-hover:text-neutral-200 transition-colors relative z-10">
                &quot;{content}&quot;
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
                <span className="px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px] text-emerald-400 font-medium bg-emerald-500/5">
                    {tag}
                </span>
            </div>
        </div>
    );
};

const KanbanColumn = ({ title, count, children, color = "emerald" }: { title: string, count: number, children: React.ReactNode, color?: string }) => (
    <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2 px-1">
            <div className={`w-2 h-2 rounded-full bg-${color}-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></div>
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wide">{title}</h3>
            <span className="text-[10px] font-mono text-neutral-500 bg-white/5 border border-white/5 px-1.5 rounded-md ml-auto">{count}</span>
        </div>
        <div className="flex flex-col gap-4 h-full">
            {children}
        </div>
    </div>
);

export const SocialProof = () => {
    return (
        <section className="relative py-24 overflow-hidden">
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl inline-flex items-center gap-3 justify-center text-white">
                        Community Feedback
                    </h2>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                        Join thousands of developers who have accelerated their workflow with Orca.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto w-full items-start">
                    <KanbanColumn title="Workflow Wins" count={3} color="emerald">
                        <FeedbackCard
                            user="Alex M."
                            handle="@backend_guru"
                            content="The semantic grouping logic in Orca is genuinely impressive. It figured out I was refactoring auth just by looking at the diffs."
                            platform="Twitter"
                            tag="#Productivity"
                        />
                        <FeedbackCard
                            user="Jordan T."
                            handle="@tech_lead_99"
                            content="Finally, a CLI that feels like it was built for 2024. The 'plan' command is essential for our team code reviews."
                            platform="Twitter"
                            tag="#DX"
                        />
                        <div className="p-4 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:border-emerald-500/30 transition-colors cursor-pointer opacity-75 hover:opacity-100">
                            <span className="text-2xl">⚡</span>
                            <span className="text-sm font-bold text-neutral-300">Share your story</span>
                            <span className="text-xs text-neutral-500">Tag @orcacli on Twitter</span>
                        </div>
                    </KanbanColumn>

                    <KanbanColumn title="Feature Love" count={3} color="blue">
                        <FeedbackCard
                            user="Taylor S."
                            handle="@fullstack_dev"
                            content="I love that it is local-first. I can use my own API keys and nothing leaves my machine except the diffs."
                            platform="Twitter"
                            tag="#Privacy"
                        />
                        <FeedbackCard
                            user="Riley K."
                            handle="@sec_research"
                            content="The confirm + dry-run flags make it safe to adopt. I can inspect everything before Orca touches git."
                            platform="GitHub"
                            tag="#Safety"
                        />
                        <FeedbackCard
                            user="Jamie L."
                            handle="@devops_ninja"
                            content="The terminal UI is clean. Fast, responsive, and actually helpful error messages. Rust for the win."
                            platform="GitHub"
                            tag="#UI/UX"
                        />
                    </KanbanColumn>

                    {/* Column 3 */}
                    <KanbanColumn title="Adoption" count={3} color="purple">
                        <FeedbackCard
                            user="Enterprise Team"
                            handle="@Top500_Co"
                            content="We've started using Orca for our internal tooling scripts. It saves us hours on documentation."
                            platform="Twitter"
                            tag="#Enterprise"
                        />
                        <FeedbackCard
                            user="Rust Fan"
                            handle="@rust_contributor"
                            content="Blazing fast. The Rust implementation makes the AI interactions feel instantaneous."
                            platform="GitHub"
                            tag="#Performance"
                        />
                        <FeedbackCard
                            user="Sam D."
                            handle="@freelancer_sam"
                            content="Replaced my custom git aliases with Orca. It's just better."
                            platform="Discord"
                            tag="#Workflow"
                        />
                    </KanbanColumn>
                </div>
            </div>
        </section>
    );
};

