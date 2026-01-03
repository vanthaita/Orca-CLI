
"use client";

import Image from "next/image";

interface ModelItemProps {
    name: string;
    icon: string;
}

const ModelItem = ({ name, icon }: ModelItemProps) => {
    return (
        <div className="group flex items-center gap-4 rounded border-2 border-dashed border-white/20 bg-neutral-900/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded p-0.5">
                <Image
                    src={icon}
                    alt={name}
                    width={32}
                    height={32}
                    className="h-full w-full object-contain opacity-80 transition-opacity group-hover:opacity-100"
                    unoptimized
                />
            </div>
            <span className="font-mono text-sm font-medium text-neutral-300 group-hover:text-emerald-400">
                {name}
            </span>
        </div>
    );
};

export const ModelShowcase = () => {
    const models = [
        {
            name: "Claude Code",
            icon: "https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767428247/afcaw4zhiob0xlgmg8um.svg",
        },
        {
            name: "OpenAI",
            icon: "https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767428249/tan9tm21vyenfic85o0m.svg",
        },
        {
            name: "Gemini",
            icon: "https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767428251/qzrsdmghvpw8pjeyamhk.svg",
        },
        {
            name: "Zai",
            icon: "https://res.cloudinary.com/dq2z27agv/image/upload/q_auto,f_webp,w_1200/v1767428254/xl1be5fiepwlbtytyu8b.svg",
        },
    ];

    return (
        <section className="grid gap-16 border-t-2 border-dashed border-white/20 py-16">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:items-center">
                <div className="space-y-6">
                    <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                        Choose Your <br />
                        <span className="text-emerald-400">Intelligence.</span>
                    </h2>
                    <p className="max-w-md text-lg leading-relaxed text-neutral-400">
                        Orca is model-agnostic. Works seamlessly with all your favorite AI coding agents.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {models.map((model) => (
                        <ModelItem key={model.name} {...model} />
                    ))}
                </div>
            </div>
        </section>
    );
};
