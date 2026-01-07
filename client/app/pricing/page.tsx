import { Metadata } from "next";
import { ComponentType } from "react";
import { PricingCard, PricingTier } from "@/component/PricingCard";
import { FeatureComparison } from "@/component/FeatureComparison";
import { SiteHeader } from "@/component/SiteHeader";
import { SiteFooter } from "@/component/SiteFooter";

export const metadata: Metadata = {
    title: "Pricing",
    description: "Simple pricing for individuals and teams.",
};

const TIERS: PricingTier[] = [
    {
        name: "Free",
        price: "Free",
        description: "Perfect for open source maintainers and hobbyists.",
        ctaText: "Get Started",
        ctaLink: "/login",
        features: [
            { text: "7 AI commits per day", included: true },
            { text: "Gemini Flash AI model", included: true },
            { text: "Core Git wrapper (unlimited)", included: true },
            { text: "Basic commit messages", included: true },
            { text: "Community Support", included: true },
            { text: "Auto-PR workflow", included: false },
            { text: "AI Conflict Resolution", included: false },
        ]
    },
    {
        name: "Pro",
        price: "$7",
        description: "For professional developers who want to move fast.",
        highlighted: true,
        ctaText: "Start 14-Day Free Trial",
        ctaLink: "/login?plan=pro",
        features: [
            { text: "Unlimited AI commits", included: true },
            { text: "Auto-PR workflow (orca publish)", included: true },
            { text: "AI Conflict Resolution", included: true },
            { text: "AI Release Notes", included: true },
            { text: "Custom Instructions", included: true },
            { text: "Email Support", included: true },
            { text: "Team Dashboard", included: false },
        ]
    },
    {
        name: "Team",
        price: "$20",
        description: "For teams that need collaboration and consistency.",
        ctaText: "Start 14-Day Free Trial",
        ctaLink: "/login?plan=team",
        features: [
            { text: "Everything in Pro", included: true },
            { text: "Up to 5 team members", included: true },
            { text: "Shared Team Templates", included: true },
            { text: "Team Analytics Dashboard", included: true },
            { text: "Priority Support", included: true },
        ]
    }
    // {
    //     name: "Team (Coming Soon)",
    //     price: "$29",
    //     description: "For teams that need consistency and control.",
    //     ctaText: "Contact Sales",
    //     ctaLink: "mailto:sales@orcacli.codes",
    //     features: [
    //         { text: "Core Git Wrapper", included: true },
    //         { text: "Local AI Commit Generation", included: true },
    //         { text: "Unlimited Repositories", included: true },
    //         { text: "Advanced Context Analysis", included: true },
    //         { text: "Priority Support", included: true },
    //         { text: "PR Description Generation", included: true },
    //         { text: "Team Governance & Audit", included: true },
    //     ]
    // }
];

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] selection:bg-emerald-500/30">
            <div className="container mx-auto px-4 py-8">
                <SiteHeader />

                <div className="py-16">
                    <div className="mb-16 text-center">
                        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                            Simple, transparent <span className="text-emerald-400">pricing</span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg text-neutral-400">
                            Start for free, upgrade when you need more power. No hidden fees.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                        {TIERS.map((tier) => (
                            <PricingCard key={tier.name} tier={tier} />
                        ))}
                    </div>

                    {/* Feature Comparison Table */}
                    <FeatureComparison />

                    <div className="mt-24 rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12 text-center">
                        <h3 className="mb-4 text-2xl font-bold text-white">Need a custom solution?</h3>
                        <p className="mb-8 text-neutral-400 max-w-2xl mx-auto">
                            For large enterprises with specific security and compliance requirements, we offer custom deployment options.
                        </p>
                        <a href="mailto:orcacli2026@gmail.com" className="inline-flex items-center justify-center rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-neutral-200 transition-colors">
                            Contact Enterprise Sales
                        </a>
                    </div>
                </div>

                <SiteFooter />
            </div>
        </main>
    );
}
