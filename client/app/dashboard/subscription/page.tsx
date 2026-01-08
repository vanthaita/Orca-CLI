'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SubscriptionContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('payment');
    const orderId = searchParams.get('order');

    if (status === 'success') {
        return (
            <div className="max-w-md w-full bg-neutral-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-emerald-500/10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
                <p className="text-neutral-400 mb-6">
                    Thank you for your purchase. Your plan has been upgraded successfully.
                </p>
                {orderId && (
                    <div className="bg-neutral-800 rounded-lg p-3 mb-6">
                        <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Transaction ID</div>
                        <div className="font-mono text-sm text-emerald-400 break-all">{orderId}</div>
                    </div>
                )}
                <div>
                    <Link
                        href="/dashboard"
                        className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-500/10">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
                <p className="text-neutral-400 mb-6">
                    We couldn't process your payment. This might be due to a banking issue or timeout.
                </p>
                {orderId && (
                    <div className="bg-neutral-800 rounded-lg p-3 mb-6">
                        <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Transaction ID</div>
                        <div className="font-mono text-sm text-red-400 break-all">{orderId}</div>
                    </div>
                )}
                <div className="space-y-3">
                    <Link
                        href="/dashboard/upgrade"
                        className="block w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/dashboard"
                        className="block w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (status === 'cancel') {
        return (
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
                <p className="text-neutral-400 mb-6">
                    You cancelled the payment process. No charges have been made.
                </p>
                <div className="space-y-3">
                    <Link
                        href="/dashboard/upgrade"
                        className="block w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                        Return to Plans
                    </Link>
                    <Link
                        href="/dashboard"
                        className="block w-full text-neutral-500 hover:text-neutral-300 py-2"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Default state (no params)
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Subscription Status</h1>
            <p className="text-neutral-400 mb-8">
                View your payment history and current plan status in the dashboard.
            </p>
            <Link
                href="/dashboard"
                className="inline-flex items-center text-emerald-400 hover:text-emerald-300 hover:underline"
            >
                ← Back to Dashboard
            </Link>
        </div>
    );
}

export default function SubscriptionPage() {
    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
            <Suspense fallback={<div className="text-emerald-500 animate-pulse">Loading...</div>}>
                <SubscriptionContent />
            </Suspense>
        </div>
    );
}
