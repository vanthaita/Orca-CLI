'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hook/useMe';

export default function UpgradePage() {
    const me = useMe();
    const user = me.data?.user;
    const [selectedPlan, setSelectedPlan] = useState<'pro' | 'team'>('pro');
    const [selectedDuration, setSelectedDuration] = useState<'1M' | '12M'>('12M');
    const [copied, setCopied] = useState(false);

    const pricing = {
        pro: {
            monthly: 170000,
            yearly: 1700000,
        },
        team: {
            monthly: 480000,
            yearly: 4800000,
        },
    };

    const getPrice = () => {
        const plan = pricing[selectedPlan];
        return selectedDuration === '1M' ? plan.monthly : plan.yearly;
    };

    const getPaymentContent = () => {
        if (!user?.email) return '';
        return `ORCA ${user.email} ${selectedPlan.toUpperCase()} ${selectedDuration}`;
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(getPaymentContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (me.isLoading) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100">
            <div className="max-w-6xl mx-auto px-6 py-14">
                {/* Header */}
                <header className="flex items-center justify-between border-b-2 border-dashed border-white/20 pb-6 mb-10">
                    <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        Upgrade Your Plan
                    </h1>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 border-2 border-dashed border-white/20 bg-black/20 px-4 py-2 text-sm font-bold text-neutral-300 hover:text-white hover:border-emerald-500/50 transition-all"
                        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                    >
                        ← Back to Dashboard
                    </Link>
                </header>

                {/* Pricing Plans */}
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                    <button
                        onClick={() => setSelectedPlan('pro')}
                        className={`border-2 border-dashed p-8 rounded-xl transition-all text-left ${selectedPlan === 'pro'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-white/20 bg-black/20 hover:border-white/40'
                            }`}
                    >
                        <h2 className="text-2xl font-black text-white mb-2 uppercase">Pro Tier</h2>
                        <div className="text-emerald-400 font-bold mb-4">$7/month • $70/year</div>
                        <ul className="space-y-2 text-sm text-neutral-300">
                            <li>✅ Unlimited AI commits</li>
                            <li>✅ Auto-PR Workflow</li>
                            <li>✅ GPT-4o, Claude 3.5</li>
                            <li>✅ AI Conflict Resolution</li>
                            <li>✅ Auto Release Notes</li>
                        </ul>
                    </button>

                    <button
                        onClick={() => setSelectedPlan('team')}
                        className={`border-2 border-dashed p-8 rounded-xl transition-all text-left ${selectedPlan === 'team'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-white/20 bg-black/20 hover:border-white/40'
                            }`}
                    >
                        <h2 className="text-2xl font-black text-white mb-2 uppercase">Team Tier</h2>
                        <div className="text-emerald-400 font-bold mb-4">$20/month • $200/year</div>
                        <ul className="space-y-2 text-sm text-neutral-300">
                            <li>✅ All Pro features</li>
                            <li>✅ Shared Team Templates</li>
                            <li>✅ Team Dashboard</li>
                            <li>✅ Team Analytics</li>
                            <li>✅ Priority Support</li>
                        </ul>
                    </button>
                </div>

                {/* Duration Selection */}
                <div className="border-2 border-dashed border-white/20 bg-black/20 p-6 rounded-xl mb-10">
                    <h3 className="text-lg font-bold text-white mb-4">Select Duration</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedDuration('1M')}
                            className={`border-2 border-dashed p-4 rounded-lg transition-all ${selectedDuration === '1M'
                                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                    : 'border-white/20 text-neutral-400 hover:border-white/40'
                                }`}
                        >
                            <div className="font-bold text-lg">Monthly</div>
                            <div className="text-sm">{formatAmount(pricing[selectedPlan].monthly)}</div>
                        </button>
                        <button
                            onClick={() => setSelectedDuration('12M')}
                            className={`border-2 border-dashed p-4 rounded-lg transition-all relative ${selectedDuration === '12M'
                                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                    : 'border-white/20 text-neutral-400 hover:border-white/40'
                                }`}
                        >
                            <div className="absolute -top-3 right-4 bg-emerald-500 text-black px-2 py-1 text-xs font-bold rounded">
                                SAVE 17%
                            </div>
                            <div className="font-bold text-lg">Yearly</div>
                            <div className="text-sm">{formatAmount(pricing[selectedPlan].yearly)}</div>
                        </button>
                    </div>
                </div>

                {/* Payment Instructions */}
                <div className="border-2 border-dashed border-white/20 bg-black/20 p-8 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">
                        Payment Instructions
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="text-sm text-neutral-500 uppercase tracking-wide mb-2">Step 1: Transfer Amount</div>
                            <div className="bg-black/40 border-2 border-dashed border-emerald-500/30 rounded-lg p-4">
                                <div className="text-2xl font-black text-emerald-400">{formatAmount(getPrice())}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-neutral-500 uppercase tracking-wide mb-2">Step 2: Bank Account</div>
                            <div className="bg-black/40 border-2 border-dashed border-emerald-500/30 rounded-lg p-4">
                                <div className="text-white font-bold mb-2">Vietcombank</div>
                                <div className="text-neutral-300 font-mono">0123456789</div>
                                <div className="text-neutral-500 text-sm mt-2">Recipient: ORCA CLI</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-neutral-500 uppercase tracking-wide mb-2">
                                Step 3: Payment Content (Copy This)
                            </div>
                            <div className="bg-black/40 border-2 border-dashed border-emerald-500/30 rounded-lg p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <code className="text-emerald-400 font-mono text-sm flex-1">{getPaymentContent()}</code>
                                    <button
                                        onClick={handleCopy}
                                        className="border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold"
                                    >
                                        {copied ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-neutral-600 mt-2">
                                ⚠️ Important: Copy this content exactly as shown
                            </div>
                        </div>

                        <div className="bg-yellow-500/10 border-2 border-dashed border-yellow-500/50 rounded-lg p-4">
                            <div className="text-yellow-400 font-bold mb-2">📌 Important Notes:</div>
                            <ul className="text-neutral-300 text-sm space-y-1">
                                <li>• Payment will be processed automatically within a few minutes</li>
                                <li>• Your plan will be upgraded immediately after payment confirmation</li>
                                <li>• You can check payment status in Payment History</li>
                                <li>• For support, contact admin</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
