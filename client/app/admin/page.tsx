'use client';

import { useAdminUsers } from '@/hook/useAdminUsers';
import { useAdminLogs } from '@/hook/useAdminLogs';
import { useMe } from '@/hook/useMe';
import { useLogout } from '@/hook/useLogout';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    const me = useMe();
    const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers();
    const [logLines, setLogLines] = useState(100);
    const { data: logs, isLoading: logsLoading, error: logsError } = useAdminLogs(logLines);
    const logout = useLogout();

    const user = me.data?.user;

    // Check if user is admin and redirect if not
    useEffect(() => {
        if (me.isLoading) return;
        if (!user || (user as any).role !== 'admin') {
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    }, [me.isLoading, user]);

    if (me.isLoading) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        );
    }

    if (!user || (user as any).role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="text-red-400 font-mono text-sm">Access Denied - Admin Only</div>
            </div>
        );
    }

    const handleLogout = () => {
        logout.mutate();
    };

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100">
            <div className="max-w-7xl mx-auto px-6 py-14">
                {/* Header */}
                <header className="flex items-center justify-between border-b-2 border-dashed border-white/20 pb-6 mb-10">
                    <div>
                        <Link href="/" className="text-2xl font-black text-white hover:text-emerald-400 transition-colors uppercase italic tracking-tighter inline-block mb-2">
                            Orca CLI
                        </Link>
                        <p className="text-neutral-500 text-sm uppercase tracking-wide">Admin Dashboard</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 border-2 border-dashed border-white/20 bg-black/20 px-4 py-2 text-sm font-bold text-neutral-300 transition-all hover:bg-white/5 hover:border-emerald-500/50"
                            style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            disabled={logout.isPending}
                            className="inline-flex items-center gap-2 border-2 border-dashed border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500 disabled:opacity-50"
                            style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {logout.isPending ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                </header>

                <div className="grid gap-8">
                    {/* Users Section */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">
                            Users Management
                        </h2>
                        {usersLoading && (
                            <div className="text-neutral-500 animate-pulse">Loading users...</div>
                        )}
                        {usersError && (
                            <div className="text-red-400 text-sm">
                                Error loading users: {(usersError as any)?.message || 'Unknown error'}
                            </div>
                        )}
                        {users && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b-2 border-dashed border-white/20">
                                            <th className="pb-3 pr-4 text-sm text-neutral-500 uppercase tracking-wide">Email</th>
                                            <th className="pb-3 pr-4 text-sm text-neutral-500 uppercase tracking-wide">Name</th>
                                            <th className="pb-3 pr-4 text-sm text-neutral-500 uppercase tracking-wide">Plan</th>
                                            <th className="pb-3 pr-4 text-sm text-neutral-500 uppercase tracking-wide">Role</th>
                                            <th className="pb-3 pr-4 text-sm text-neutral-500 uppercase tracking-wide">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-dashed border-white/10 hover:bg-white/5 transition-colors">
                                                <td className="py-3 pr-4 text-sm text-neutral-300">{user.email || 'N/A'}</td>
                                                <td className="py-3 pr-4 text-sm text-neutral-300">{user.name || 'N/A'}</td>
                                                <td className="py-3 pr-4">
                                                    <span className={`px-2 py-1 border border-dashed rounded text-xs font-bold uppercase ${user.plan === 'team'
                                                            ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                                                            : user.plan === 'pro'
                                                                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                                                                : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                                        }`}>
                                                        {user.plan}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span className={`px-2 py-1 border border-dashed rounded text-xs font-bold uppercase ${user.role === 'admin'
                                                            ? 'border-red-500/50 bg-red-500/10 text-red-400'
                                                            : 'border-neutral-500/50 bg-neutral-500/10 text-neutral-400'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-sm text-neutral-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-6 text-sm text-neutral-600">
                                    Total users: <span className="text-emerald-400 font-bold">{users.length}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logs Section */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-white/20 pb-3">
                            <h2 className="text-xl font-bold text-white">System Logs</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLogLines(50)}
                                    className={`px-3 py-1 text-sm font-bold transition-all border-2 border-dashed ${logLines === 50
                                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                            : 'border-white/20 bg-black/20 text-neutral-400 hover:border-emerald-500/30'
                                        }`}
                                    style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
                                >
                                    50
                                </button>
                                <button
                                    onClick={() => setLogLines(100)}
                                    className={`px-3 py-1 text-sm font-bold transition-all border-2 border-dashed ${logLines === 100
                                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                            : 'border-white/20 bg-black/20 text-neutral-400 hover:border-emerald-500/30'
                                        }`}
                                    style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
                                >
                                    100
                                </button>
                                <button
                                    onClick={() => setLogLines(200)}
                                    className={`px-3 py-1 text-sm font-bold transition-all border-2 border-dashed ${logLines === 200
                                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                            : 'border-white/20 bg-black/20 text-neutral-400 hover:border-emerald-500/30'
                                        }`}
                                    style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
                                >
                                    200
                                </button>
                            </div>
                        </div>
                        {logsLoading && (
                            <div className="text-neutral-500 animate-pulse">Loading logs...</div>
                        )}
                        {logsError && (
                            <div className="text-red-400 text-sm">
                                Error loading logs: {(logsError as any)?.message || 'Unknown error'}
                            </div>
                        )}
                        {logs && (
                            <div className="bg-black/40 border-2 border-dashed border-emerald-500/20 rounded-lg p-4 max-h-[600px] overflow-y-auto font-mono text-xs">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="mb-2 pb-2 border-b border-dashed border-white/5 last:border-0">
                                        <div className="flex gap-3 items-start flex-wrap">
                                            <span className={`px-2 py-0.5 border border-dashed rounded text-[10px] font-bold uppercase ${(log.level ?? 30) >= 50
                                                    ? 'border-red-500/50 bg-red-500/20 text-red-300'
                                                    : (log.level ?? 30) >= 40
                                                        ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300'
                                                        : 'border-green-500/50 bg-green-500/20 text-green-300'
                                                }`}>
                                                {(log.level ?? 30) >= 50 ? 'ERROR' : (log.level ?? 30) >= 40 ? 'WARN' : 'INFO'}
                                            </span>
                                            <span className="text-neutral-500 whitespace-nowrap">
                                                {log.time ? new Date(log.time).toLocaleTimeString() : ''}
                                            </span>
                                            {log.context && (
                                                <span className="text-emerald-400 font-bold">[{log.context}]</span>
                                            )}
                                            <span className="flex-1 text-neutral-300">{log.msg || JSON.stringify(log)}</span>
                                        </div>
                                        {log.req && (
                                            <div className="ml-20 mt-1 text-neutral-600 text-[10px]">
                                                <span className="text-blue-400">{log.req.method}</span> {log.req.url} →
                                                <span className={`ml-1 ${log.res?.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {log.res?.statusCode}
                                                </span>
                                                <span className="text-neutral-500"> ({log.responseTime}ms)</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 text-xs text-neutral-600">
                            Showing latest {logLines} log entries • Auto-refresh enabled
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">
                            Quick Statistics
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="border border-dashed border-emerald-500/30 bg-emerald-500/5 p-4 rounded-lg">
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Total Users</div>
                                <div className="text-3xl font-bold text-emerald-400">{users?.length || 0}</div>
                            </div>
                            <div className="border border-dashed border-blue-500/30 bg-blue-500/5 p-4 rounded-lg">
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Pro Users</div>
                                <div className="text-3xl font-bold text-blue-400">
                                    {users?.filter(u => u.plan === 'pro').length || 0}
                                </div>
                            </div>
                            <div className="border border-dashed border-purple-500/30 bg-purple-500/5 p-4 rounded-lg">
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Team Users</div>
                                <div className="text-3xl font-bold text-purple-400">
                                    {users?.filter(u => u.plan === 'team').length || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
