import type { Metadata } from "next";
import { PricingCard, PricingTier } from "@/component/PricingCard";
import { FeatureComparison } from "@/component/FeatureComparison";
import { PLANS } from "@/config/plans";
import { SiteHeader } from "@/component/SiteHeader";
import { SiteFooter } from "@/component/SiteFooter";

export const metadata: Metadata = {
    title: "Pricing",
    description: "Simple pricing for individuals and teams.",
};

const TIERS: PricingTier[] = [
    PLANS.free,
    PLANS.pro,
    PLANS.team
];

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] selection:bg-emerald-500/30">
            <div className="mx-auto max-w-7xl px-4 py-8">
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

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {TIERS.map((tier) => (
                            <PricingCard key={tier.name} tier={tier} />
                        ))}
                    </div>

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
