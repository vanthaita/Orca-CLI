'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hook/useMe';
import PaymentButton from '@/component/PaymentButton';
import { PLANS, PRICING_CONFIG } from '@/config/plans';
import { cn } from '@/lib/utils';

export default function UpgradePage() {
    const me = useMe();
    const user = me.data?.user;
    const [selectedPlan, setSelectedPlan] = useState<'pro' | 'team'>('pro');
    const [selectedDuration, setSelectedDuration] = useState<'1M' | '12M'>('12M');
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const pricing = PRICING_CONFIG;

    const getPrice = () => {
        const plan = pricing[selectedPlan];
        return selectedDuration === '1M' ? plan.monthly : plan.yearly;
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (me.isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-pulse text-emerald-500 font-medium">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-emerald-500/30">
            <div className="max-w-5xl mx-auto px-6 py-16">
                <header className="mb-12 text-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-sm text-neutral-500 hover:text-white transition-colors mb-6"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                        Upgrade Your Plan
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                        Unlock the full potential of Orca CLI with our Pro and Team plans.
                        Powerful AI features, automated workflows, and more.
                    </p>
                </header>

                <div className="flex justify-center mb-12">
                    <div className="bg-neutral-900 p-1 rounded-lg inline-flex items-center relative">
                        <button
                            onClick={() => setSelectedDuration('1M')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${selectedDuration === '1M'
                                ? 'bg-neutral-800 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setSelectedDuration('12M')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${selectedDuration === '12M'
                                ? 'bg-neutral-800 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Yearly
                            <span className="text-[10px] font-bold bg-emerald-500 text-emerald-950 px-1.5 py-0.5 rounded-full">
                                SAVE 17%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-7xl mx-auto">
                    <div className="relative rounded-2xl p-6 border-2 border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{PLANS.free.name}</h3>
                                <p className="text-neutral-400 text-sm">{PLANS.free.description}</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-white">Free</span>
                            <span className="text-neutral-500 text-sm font-medium ml-2">/ forever</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {PLANS.free.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start text-neutral-300 text-sm">
                                    <svg className={cn("w-5 h-5 mr-3 shrink-0", feature.included ? "text-emerald-500" : "text-neutral-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className={feature.included ? "" : "text-neutral-500 line-through"}>{feature.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div
                        onClick={() => setSelectedPlan('pro')}
                        className={`relative rounded-2xl p-6 border-2 transition-all cursor-pointer hover:border-emerald-500/50 ${selectedPlan === 'pro'
                            ? 'bg-neutral-900 border-emerald-500 shadow-xl shadow-emerald-500/10'
                            : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{PLANS.pro.name} Tier</h3>
                                <p className="text-neutral-400 text-sm">{PLANS.pro.description}</p>
                            </div>
                            {selectedPlan === 'pro' && (
                                <div className="bg-emerald-500 text-emerald-950 p-1 rounded-full">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-white">
                                {formatAmount(selectedDuration === '1M' ? pricing.pro.monthly : pricing.pro.yearly)}
                            </span>
                            <span className="text-neutral-500 text-sm font-medium ml-2">
                                / {selectedDuration === '1M' ? 'month' : 'year'}
                            </span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {PLANS.pro.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start text-neutral-300 text-sm">
                                    <svg className={cn("w-5 h-5 mr-3 shrink-0", feature.included ? "text-emerald-500" : "text-neutral-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className={feature.included ? "" : "text-neutral-500 line-through"}>{feature.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div
                        onClick={() => setSelectedPlan('team')}
                        className={`relative rounded-2xl p-6 border-2 transition-all cursor-pointer hover:border-emerald-500/50 ${selectedPlan === 'team'
                            ? 'bg-neutral-900 border-emerald-500 shadow-xl shadow-emerald-500/10'
                            : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{PLANS.team.name} Tier</h3>
                                <p className="text-neutral-400 text-sm">{PLANS.team.description}</p>
                            </div>
                            {selectedPlan === 'team' && (
                                <div className="bg-emerald-500 text-emerald-950 p-1 rounded-full">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-white">
                                {formatAmount(selectedDuration === '1M' ? pricing.team.monthly : pricing.team.yearly)}
                            </span>
                            <span className="text-neutral-500 text-sm font-medium ml-2">
                                / {selectedDuration === '1M' ? 'month' : 'year'}
                            </span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {PLANS.team.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start text-neutral-300 text-sm">
                                    <svg className={cn("w-5 h-5 mr-3 shrink-0", feature.included ? "text-emerald-500" : "text-neutral-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className={feature.included ? "" : "text-neutral-500 line-through"}>{feature.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto bg-neutral-900 rounded-xl p-8 border border-neutral-800">
                    <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-6">
                        <div>
                            <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider mb-1">
                                Summary
                            </div>
                            <div className="text-lg text-white font-medium">
                                Upgrade to <span className="text-emerald-400 font-bold">{selectedPlan === 'pro' ? 'Pro' : 'Team'} Tier</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider mb-1">
                                Total
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatAmount(getPrice())}
                            </div>
                        </div>
                    </div>

                    {paymentError && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm flex items-start">
                            <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {paymentError}
                        </div>
                    )}

                    <PaymentButton
                        plan={selectedPlan}
                        duration={selectedDuration}
                        amount={getPrice()}
                        onError={setPaymentError}
                    />

                    <div className="mt-6 flex items-center justify-center gap-2 text-neutral-500 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Secure payment via SePay. Activation is automatic.
                    </div>
                </div>
            </div>
        </div>
    );
}
