'use client';

import { useAdminUsers } from '@/hook/useAdminUsers';
import { useAdminLogs } from '@/hook/useAdminLogs';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const { data: users, isLoading: usersLoading } = useAdminUsers();
    const { data: logs, isLoading: logsLoading } = useAdminLogs(10); // Only needed for quick preview

    const stats = [
        {
            label: 'Total Users',
            value: users?.length || 0,
            change: '+12%', // Mock data for visual 
            icon: (
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: 'emerald'
        },
        {
            label: 'Pro Subscribers',
            value: users?.filter(u => u.plan === 'pro').length || 0,
            change: '+5%',
            icon: (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'blue'
        },
        {
            label: 'Active Teams',
            value: users?.filter(u => u.plan === 'team').length || 0,
            change: '0%',
            icon: (
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'purple'
        },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Dashboard Overview
                </h1>
                <p className="text-neutral-500 text-sm">Welcome back, Admin. System is running optimally.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`relative overflow-hidden group p-6 border border-dashed rounded-xl bg-black/20 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-${stat.color}-500/50 ${stat.color === 'emerald' ? 'border-emerald-500/20' : stat.color === 'blue' ? 'border-blue-500/20' : 'border-purple-500/20'}`}>
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-${stat.color}-500 rounded-bl-3xl`}>
                            {stat.icon}
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                {stat.icon}
                            </div>
                            <span className="text-neutral-500 font-bold text-sm uppercase tracking-wide">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{stat.value}</span>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Activity / Logs Preview */}
                <div className="border border-dashed border-white/20 bg-black/20 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white">Live Activity</h2>
                        <Link href="/admin/logs" className="text-xs text-emerald-400 hover:underline">View All &rarr;</Link>
                    </div>

                    <div className="space-y-3">
                        {logsLoading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                            ))
                        ) : logs?.slice(0, 5).map((log, i) => (
                            <div key={i} className="flex gap-3 text-xs font-mono border-l-2 border-white/10 pl-3 py-1">
                                <span className={
                                    (log.level ?? 30) >= 50 ? 'text-red-400' :
                                        (log.level ?? 30) >= 40 ? 'text-yellow-400' : 'text-neutral-500'
                                }>
                                    {(log.level ?? 30) >= 50 ? 'ERR' : 'INF'}
                                </span>
                                <span className="text-neutral-300 truncate">{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="border border-dashed border-white/20 bg-black/20 backdrop-blur-sm rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin/users" className="group p-4 bg-white/5 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 rounded-lg transition-all text-center">
                            <div className="text-neutral-400 group-hover:text-emerald-400 mb-2 flex justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <span className="text-sm font-bold text-neutral-300 group-hover:text-white">View Users</span>
                        </Link>
                        <button className="group p-4 bg-white/5 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 rounded-lg transition-all text-center disabled:opacity-50 cursor-not-allowed" title="Coming Soon">
                            <div className="text-neutral-400 group-hover:text-purple-400 mb-2 flex justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="text-sm font-bold text-neutral-300 group-hover:text-white">Settings</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

