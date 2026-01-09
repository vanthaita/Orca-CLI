'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/hook/useMe';
import { getSystemMetrics } from '@/lib/admin-api';
import { getPaymentStats } from '@/lib/subscription-api';
import { SystemMetrics, PaymentStats } from '@/interface/types';

export default function AdminMetricsPage() {
    const me = useMe();
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!me.data?.user || me.data.user.role !== 'admin') return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const [metricsData, paymentsData] = await Promise.all([
                    getSystemMetrics(),
                    getPaymentStats().catch(() => null), // Optional
                ]);
                setMetrics(metricsData);
                setPaymentStats(paymentsData);
            } catch (err) {
                console.error('Failed to load metrics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [me.data]);

    if (me.isLoading) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        );
    }

    if (!me.data?.user || me.data.user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="text-red-400">Access Denied - Admin Only</div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100">
            <div className="max-w-7xl mx-auto px-6 py-14">
                <header className="flex items-center justify-between border-b-2 border-dashed border-white/20 pb-6 mb-10">
                    <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        System Metrics
                    </h1>
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 border-2 border-dashed border-white/20 bg-black/20 px-4 py-2 text-sm font-bold text-neutral-300 hover:text-white hover:border-emerald-500/50 transition-all"
                    >
                        ← Back to Admin
                    </Link>
                </header>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-pulse text-neutral-500">Loading metrics...</div>
                    </div>
                ) : !metrics ? (
                    <div className="text-center py-12 text-red-400">Failed to load metrics</div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="border-2 border-dashed border-white/20 bg-black/20 p-6 rounded-xl">
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-2">Total Users</div>
                                <div className="text-4xl font-black text-white">{metrics.totalUsers}</div>
                            </div>

                            <div className="border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 p-6 rounded-xl">
                                <div className="text-sm text-emerald-500 uppercase tracking-wide mb-2">AI Requests Today</div>
                                <div className="text-4xl font-black text-emerald-400">{metrics.aiUsage.totalRequests}</div>
                                <div className="text-xs text-neutral-600 mt-2">{metrics.aiUsage.today}</div>
                            </div>

                            <div className="border-2 border-dashed border-blue-500/50 bg-blue-500/10 p-6 rounded-xl">
                                <div className="text-sm text-blue-500 uppercase tracking-wide mb-2">New Users (7 days)</div>
                                <div className="text-4xl font-black text-blue-400">{metrics.recentSignups.last7Days}</div>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-white/20 bg-black/20 p-8 rounded-xl">
                            <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">
                                Users by Plan
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {metrics.usersByPlan.map((item) => (
                                    <div key={item.plan} className="border border-dashed border-white/10 bg-black/20 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold uppercase text-neutral-400">{item.plan}</span>
                                            <span className="text-2xl font-black text-emerald-400">{item.count}</span>
                                        </div>
                                        <div className="mt-3 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                                                style={{ width: `${(item.count / metrics.totalUsers) * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-neutral-600 mt-1">
                                            {((item.count / metrics.totalUsers) * 100).toFixed(1)}% of total
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-white/20 bg-black/20 p-8 rounded-xl">
                            <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">
                                Users by Role
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {metrics.usersByRole.map((item) => (
                                    <div key={item.role} className="border border-dashed border-white/10 bg-black/20 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-bold uppercase ${item.role === 'admin' ? 'text-red-400' : 'text-neutral-400'}`}>
                                                {item.role}
                                            </span>
                                            <span className="text-2xl font-black text-white">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {paymentStats && (
                            <div className="border-2 border-dashed border-purple-500/50 bg-purple-500/10 p-8 rounded-xl">
                                <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-purple-500/20 pb-3">
                                    Payment Statistics
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center">
                                        <div className="text-sm text-purple-400 uppercase tracking-wide mb-2">Total</div>
                                        <div className="text-3xl font-black text-white">{paymentStats.total}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-emerald-400 uppercase tracking-wide mb-2">Processed</div>
                                        <div className="text-3xl font-black text-emerald-400">{paymentStats.processed}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-yellow-400 uppercase tracking-wide mb-2">Pending</div>
                                        <div className="text-3xl font-black text-yellow-400">{paymentStats.pending}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-red-400 uppercase tracking-wide mb-2">Failed</div>
                                        <div className="text-3xl font-black text-red-400">{paymentStats.failed}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-purple-400 uppercase tracking-wide mb-2">Revenue</div>
                                        <div className="text-lg font-black text-purple-400">{formatCurrency(paymentStats.totalRevenue)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
