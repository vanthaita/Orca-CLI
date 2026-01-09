'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hook/useMe';
import { getPaymentHistory } from '@/lib/subscription-api';
import { PaymentTransaction } from '@/interface/types';

export default function PaymentHistoryPage() {
    const me = useMe();
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!me.data?.user) return;

        const fetchHistory = async () => {
            try {
                setLoading(true);
                const data = await getPaymentHistory();
                setTransactions(data.transactions);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load payment history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [me.data?.user]);

    if (me.isLoading) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        );
    }

    if (!me.data?.user) {
        return null;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'processed': return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
            case 'failed': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'pending': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            default: return 'text-neutral-400 border-neutral-500/50 bg-neutral-500/10';
        }
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100">
            <div className="max-w-6xl mx-auto px-6 py-14">
                <header className="flex items-center justify-between border-b-2 border-dashed border-white/20 pb-6 mb-10">
                    <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        Payment History
                    </h1>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 border-2 border-dashed border-white/20 bg-black/20 px-4 py-2 text-sm font-bold text-neutral-300 hover:text-white hover:border-emerald-500/50 transition-all"
                        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                    >
                        ← Back to Dashboard
                    </Link>
                </header>

                <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-pulse text-neutral-500">Loading transactions...</div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-400 mb-4">{error}</div>
                            <button
                                onClick={() => window.location.reload()}
                                className="border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-6 py-2 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-neutral-500 mb-4">No payment history yet</p>
                            <Link
                                href="/dashboard/upgrade"
                                className="inline-block border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-6 py-3 text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold"
                            >
                                Upgrade Your Plan
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-sm text-neutral-500 mb-6">
                                Total Transactions: {transactions.length}
                            </div>

                            {transactions.map((txn) => (
                                <div
                                    key={txn.id}
                                    className="border border-dashed border-white/20 bg-black/20 p-6 rounded-lg hover:border-emerald-500/30 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white uppercase">
                                                    {txn.plan || 'Unknown'} - {txn.duration || 'N/A'}
                                                </h3>
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase border border-dashed ${getStatusColor(txn.status)}`}>
                                                    {txn.status}
                                                </span>
                                            </div>
                                            <div className="text-2xl font-black text-emerald-400 mb-2">
                                                {formatAmount(txn.amount)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <div className="text-neutral-600 uppercase text-xs mb-1">Gateway</div>
                                            <div className="text-neutral-300 font-mono">{txn.gateway}</div>
                                        </div>
                                        <div>
                                            <div className="text-neutral-600 uppercase text-xs mb-1">Date</div>
                                            <div className="text-neutral-300">
                                                {new Date(txn.transactionDate).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                        {txn.referenceCode && (
                                            <div className="col-span-2">
                                                <div className="text-neutral-600 uppercase text-xs mb-1">Reference</div>
                                                <div className="text-neutral-300 font-mono text-xs">{txn.referenceCode}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
