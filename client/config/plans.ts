import { PricingTier } from "@/component/PricingCard";

export const PLANS: Record<string, PricingTier & { id: string }> = {
    free: {
        id: 'free',
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
    free_byok: {
        id: 'free_byok',
        name: "Free (BYOK)",
        price: "Free",
        description: "Bring Your Own Key. Use your own API key for unlimited access.",
        ctaText: "Configure Key",
        ctaLink: "/dashboard/settings",
        features: [
            { text: "Unlimited AI commits", included: true },
            { text: "Gamini Flash/Pro AI model", included: true },
            { text: "Core Git wrapper (unlimited)", included: true },
            { text: "Advanced commit messages", included: true },
            { text: "Community Support", included: true },
            { text: "Auto-PR workflow", included: true },
            { text: "AI Conflict Resolution", included: true },
        ]
    },
    pro: {
        id: 'pro',
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
    team: {
        id: 'team',
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
};

export const PRICING_CONFIG = {
    pro: {
        monthly: 170000,
        yearly: 1700000,
        monthlyUSD: 7,
        yearlyUSD: 70
    },
    team: {
        monthly: 480000,
        yearly: 4800000,
        monthlyUSD: 20,
        yearlyUSD: 200
    },
};
