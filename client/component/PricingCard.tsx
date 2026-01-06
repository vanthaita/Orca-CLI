import { cn } from "@/lib/utils";
import Link from "next/link";

interface PricingFeature {
    text: string;
    included: boolean;
}

export interface PricingTier {
    name: string;
    price: string;
    description: string;
    features: PricingFeature[];
    highlighted?: boolean;
    ctaText: string;
    ctaLink: string;
}

interface PricingCardProps {
    tier: PricingTier;
    className?: string;
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const PricingCard = ({ tier, className }: PricingCardProps) => {
    return (
        <div className={cn(
            "flex flex-col rounded-xl border-2 border-dashed p-6 transition-all duration-300",
            tier.highlighted
                ? "border-emerald-400/50 bg-emerald-950/10 shadow-[0_0_40px_-10px_rgba(52,211,153,0.1)]"
                : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10",
            className
        )}>
            <div className="mb-4">
                <h3 className={cn("text-lg font-bold font-mono tracking-tight", tier.highlighted ? "text-emerald-400" : "text-neutral-200")}>
                    {tier.name}
                </h3>
                <p className="mt-2 text-sm text-neutral-400 h-10">{tier.description}</p>
            </div>

            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.price !== "Free" && <span className="text-sm text-neutral-500">/month</span>}
            </div>

            <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                            <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-600" />
                        )}
                        <span className={feature.included ? "text-neutral-300" : "text-neutral-600"}>
                            {feature.text}
                        </span>
                    </li>
                ))}
            </ul>

            <Link
                href={tier.ctaLink}
                className={cn(
                    "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    tier.highlighted
                        ? "bg-emerald-500 text-white hover:bg-emerald-400"
                        : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
                )}
            >
                {tier.ctaText}
            </Link>
        </div>
    );
};
