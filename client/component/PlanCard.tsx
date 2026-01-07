import Link from 'next/link';
import type { PlanInfo } from '@/interface/plan';

interface PlanCardProps {
    plan: PlanInfo;
}

export function PlanCard({ plan }: PlanCardProps) {
    const planColors = {
        free: 'border-neutral-500/50 bg-neutral-500/10 text-neutral-400',
        pro: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
        team: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    };

    const colorClass = planColors[plan.plan] || planColors.free;

    return (
        <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Current Plan</h2>
                <div className={`inline-flex items-center gap-2 border-2 border-dashed ${colorClass} px-3 py-1 text-sm font-bold uppercase`}>
                    {plan.name}
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Daily AI Limit</div>
                    <div className="text-white font-bold text-lg">
                        {plan.dailyAiLimit === null ? 'Unlimited' : `${plan.dailyAiLimit} commits/day`}
                    </div>
                </div>

                {plan.expiresAt && (
                    <div>
                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Expires</div>
                        <div className="text-neutral-300">
                            {new Date(plan.expiresAt).toLocaleDateString()}
                        </div>
                    </div>
                )}

                <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-2">Features</div>
                    <ul className="space-y-2">
                        {plan.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-neutral-300 text-sm capitalize">{feature.replace(/_/g, ' ')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {plan.plan === 'free' && (
                <Link
                    href="/pricing"
                    className="block w-full text-center border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded-lg font-bold"
                >
                    Upgrade to Pro
                </Link>
            )}

            {plan.plan !== 'free' && (
                <button
                    className="block w-full text-center border-2 border-dashed border-white/20 px-4 py-3 text-neutral-400 hover:text-white hover:border-white/40 transition-all rounded-lg font-semibold"
                    onClick={() => alert('Billing management coming soon')}
                >
                    Manage Billing
                </button>
            )}
        </div>
    );
}
