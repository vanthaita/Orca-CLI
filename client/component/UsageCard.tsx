import type { UsageStats } from '@/interface/plan';

interface UsageCardProps {
    usage: UsageStats;
}

export function UsageCard({ usage }: UsageCardProps) {
    const isUnlimited = usage.dailyLimit === null;
    const percentage = isUnlimited ? 100 : Math.min((usage.requestCount / (usage.dailyLimit || 1)) * 100, 100);
    const remaining = usage.remaining || 0;

    return (
        <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-6">AI Usage Today</h2>

            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutral-500 uppercase tracking-wide">Commits Used</span>
                        <span className="text-white font-bold">
                            {usage.requestCount}{!isUnlimited && ` / ${usage.dailyLimit}`}
                        </span>
                    </div>

                    {!isUnlimited && (
                        <>
                            <div className="w-full h-3 bg-black/40 border-2 border-dashed border-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${percentage >= 90
                                            ? 'bg-red-500'
                                            : percentage >= 70
                                                ? 'bg-yellow-500'
                                                : 'bg-emerald-500'
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="mt-2 text-sm text-neutral-400">
                                {remaining > 0 ? (
                                    <>{remaining} commits remaining today</>
                                ) : (
                                    <span className="text-red-400 font-semibold">Daily limit reached</span>
                                )}
                            </div>
                        </>
                    )}

                    {isUnlimited && (
                        <div className="w-full h-3 bg-gradient-to-r from-emerald-500 to-cyan-500 border-2 border-dashed border-emerald-500/50 rounded-full animate-pulse" />
                    )}
                </div>

                <div className="pt-4 border-t-2 border-dashed border-white/10">
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Reset Time</div>
                    <div className="text-neutral-300">
                        {isUnlimited ? (
                            'No daily limit (Pro/Team plan)'
                        ) : (
                            <>
                                Resets at midnight UTC
                                <span className="text-neutral-500 ml-2">({usage.day})</span>
                            </>
                        )}
                    </div>
                </div>

                {!isUnlimited && remaining === 0 && (
                    <div className="mt-4 p-4 border-2 border-dashed border-yellow-500/50 bg-yellow-500/10 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <div className="text-sm font-bold text-yellow-400 mb-1">Daily Limit Reached</div>
                                <p className="text-sm text-neutral-400">
                                    Upgrade to Pro for unlimited AI commits.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
