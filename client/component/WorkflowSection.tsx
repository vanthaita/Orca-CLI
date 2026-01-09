'use client';

import { ArrowRight } from "lucide-react";


export const WorkflowSection = () => {
    const steps = [
        {
            number: '01',
            title: 'Commit',
            description: 'Guided prompts. Semantic grouping. Clean history by default.',
            command: 'orca commit',
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            border: 'border-emerald-400/20'
        },
        {
            number: '02',
            title: 'Plan',
            description: 'Generate JSON execution plans. CI/CD ready artifacts.',
            command: 'orca plan',
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/20'
        },
        {
            number: '03',
            title: 'Publish',
            description: 'Zero-friction releases. Automated PR creation.',
            command: 'orca publish',
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'border-purple-400/20'
        }
    ];

    return (
        <section id="how-it-works" className="relative">
            <div className="border-t-2 border-dashed border-white/20 pt-10 mb-12">
                <h2 className="text-2xl font-bold tracking-tight uppercase">Workflow</h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden lg:block absolute top-[2.5rem] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 -z-10" />

                {steps.map((step, index) => {
                    return (
                        <div
                            key={step.number}
                            className="group relative flex flex-col gap-6"
                        >
                            {/* Step Marker */}
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className={`text-5xl font-black ${step.color} opacity-20`}>{step.number}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="relative pl-2">
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neutral-800 lg:hidden" />

                                <div className="space-y-4">
                                    <div>
                                        <h3 className={`text-xl font-bold uppercase tracking-wider mb-2 ${step.color}`}>{step.title}</h3>
                                        <p className="text-neutral-400 leading-relaxed text-sm h-10">
                                            {step.description}
                                        </p>
                                    </div>

                                    <div className="bg-[#1a1a1a] rounded-lg border border-neutral-800 p-3 flex items-center justify-between group-hover:border-neutral-700 transition-colors">
                                        <code className="font-mono text-sm text-neutral-300">
                                            <span className="text-neutral-500 mr-2">$</span>
                                            {step.command}
                                        </code>
                                        {index < steps.length - 1 && (
                                            <ArrowRight className="w-4 h-4 text-neutral-600 lg:hidden" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
