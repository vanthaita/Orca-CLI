
"use client";

import { DashedCard } from "./DashedCard";
import { InfoIcon } from "./icons";

export const IntroductionSection = () => {
    return (
        <section id="introduction" className="grid gap-16 py-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-6 uppercase inline-flex items-center gap-2">
                        <InfoIcon className="h-5 w-5 text-emerald-400" />
                        A New Philosophy for Version Control
                    </h2>
                    <div className="space-y-6 text-lg text-neutral-400 leading-relaxed">
                        <p>
                            <strong className="text-emerald-400">Git is powerful, but noisy.</strong>{" "}
                            It requires you to manually stage, commit, and push hundreds of times.
                            Orca changes this by introducing an agentic layer between you and Git.
                        </p>
                        <p>
                            Instead of micro-managing commits, you describe your intent or let Orca infer it.
                            Orca analyzes your changes, groups them semantically using advanced AI models,
                            and generates clean, meaningful history that tells a story.
                        </p>
                        <p>
                            It&apos;s not just a wrapper; it&apos;s a workflow engine designed for the era of AI-assisted coding.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <DashedCard title="Privacy First" className="p-6">
                        <p className="text-neutral-400 text-sm">
                            Your code stays local. Only diffs are sent to the AI for analysis,
                            and they are never trained on. You control the keys.
                        </p>
                    </DashedCard>
                    <DashedCard title="Language Agnostic" className="p-6">
                        <p className="text-neutral-400 text-sm">
                            Whether you write Rust, TypeScript, or Python, Orca understands the context
                            and structure of your changes.
                        </p>
                    </DashedCard>
                    <DashedCard title="CI/CD Ready" className="p-6">
                        <p className="text-neutral-400 text-sm">
                            Generate plan artifacts that can be reviewed and executed in your CI pipeline
                            for automated, safe releases.
                        </p>
                    </DashedCard>
                </div>
            </div>
        </section>
    );
};
