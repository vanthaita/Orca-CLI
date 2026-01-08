'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hook/useMe';
import PaymentButton from '@/component/PaymentButton';

export default function UpgradePage() {
    const me = useMe();
    const user = me.data?.user;
    const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'TEAM'>('PRO');
    const [selectedDuration, setSelectedDuration] = useState<'1M' | '12M'>('12M');
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const pricing = {
        PRO: {
            monthly: 170000,
            yearly: 1700000,
        },
        TEAM: {
            monthly: 480000,
            yearly: 4800000,
        },
    };

    const getPrice = () => {
        const plan = pricing[selectedPlan];
        return selectedDuration === '1M' ? plan.monthly : plan.yearly;
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
                        onClick={() => setSelectedPlan('PRO')}
                        className={`border-2 border-dashed p-8 rounded-xl transition-all text-left ${selectedPlan === 'PRO'
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
                        onClick={() => setSelectedPlan('TEAM')}
                        className={`border-2 border-dashed p-8 rounded-xl transition-all text-left ${selectedPlan === 'TEAM'
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

                {/* Payment Section */}
                <div className="border-2 border-dashed border-white/20 bg-black/20 p-8 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">
                        Complete Payment
                    </h3>

                    <div className="space-y-6">
                        {/* Payment Amount Display */}
                        <div className="bg-black/40 border-2 border-dashed border-emerald-500/30 rounded-lg p-6 text-center">
                            <div className="text-sm text-neutral-500 uppercase tracking-wide mb-2">Total Amount</div>
                            <div className="text-3xl font-black text-emerald-400">{formatAmount(getPrice())}</div>
                            <div className="text-sm text-neutral-400 mt-2">
                                {selectedPlan} Plan • {selectedDuration === '1M' ? 'Monthly' : 'Yearly'}
                            </div>
                        </div>

                        {/* Error Message */}
                        {paymentError && (
                            <div className="bg-red-500/10 border-2 border-dashed border-red-500/50 rounded-lg p-4">
                                <div className="text-red-400 font-bold">⚠️ Payment Error</div>
                                <div className="text-neutral-300 text-sm mt-1">{paymentError}</div>
                            </div>
                        )}

                        {/* Payment Button */}
                        <PaymentButton
                            plan={selectedPlan}
                            duration={selectedDuration}
                            amount={getPrice()}
                            onError={setPaymentError}
                        />

                        {/* Payment Info */}
                        <div className="bg-blue-500/10 border-2 border-dashed border-blue-500/50 rounded-lg p-4">
                            <div className="text-blue-400 font-bold mb-2">🔒 Secure Payment Process</div>
                            <ul className="text-neutral-300 text-sm space-y-1">
                                <li>• You will be redirected to SePay secure payment page</li>
                                <li>• Scan the QR code with your banking app to complete payment</li>
                                <li>• Your plan will be upgraded automatically after payment confirmation</li>
                                <li>• Payment typically processes within 1-2 minutes</li>
                            </ul>
                        </div>

                        {/* Support Notice */}
                        <div className="text-center text-neutral-500 text-sm">
                            Having issues? <Link href="/dashboard" className="text-emerald-400 hover:underline">Contact support</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
