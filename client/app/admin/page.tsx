'use client';

import { useAdminUsers } from '@/hook/useAdminUsers';
import { useAdminLogs } from '@/hook/useAdminLogs';
import { useMe } from '@/hook/useMe';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminPage() {
    const router = useRouter();
    const { data: meData, isLoading: meLoading } = useMe();
    const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers();
    const [logLines, setLogLines] = useState(100);
    const { data: logs, isLoading: logsLoading, error: logsError } = useAdminLogs(logLines);

    // Check if user is admin
    useEffect(() => {
        if (!meLoading && meData) {
            const user = meData.user as any;
            if (user.role !== 'admin') {
                router.push('/');
            }
        }
    }, [meData, meLoading, router]);

    if (meLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    const user = meData?.user as any;
    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-slate-300">System management and monitoring</p>
                </div>

                {/* Users Section */}
                <section className="mb-12">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h2 className="text-2xl font-semibold mb-4">Users</h2>
                        {usersLoading && <p className="text-slate-300">Loading users...</p>}
                        {usersError && <p className="text-red-400">Error loading users: {(usersError as any)?.message || 'Unknown error'}</p>}
                        {users && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/20">
                                            <th className="pb-3 pr-4">Email</th>
                                            <th className="pb-3 pr-4">Name</th>
                                            <th className="pb-3 pr-4">Plan</th>
                                            <th className="pb-3 pr-4">Role</th>
                                            <th className="pb-3 pr-4">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                                <td className="py-3 pr-4 text-sm">{user.email || 'N/A'}</td>
                                                <td className="py-3 pr-4 text-sm">{user.name || 'N/A'}</td>
                                                <td className="py-3 pr-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.plan === 'team' ? 'bg-purple-500/20 text-purple-300' :
                                                            user.plan === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                                                                'bg-slate-500/20 text-slate-300'
                                                        }`}>
                                                        {user.plan}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-red-500/20 text-red-300' : 'bg-slate-500/20 text-slate-300'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-sm text-slate-400">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* Logs Section */}
                <section>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">System Logs</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLogLines(50)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${logLines === 50 ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    50
                                </button>
                                <button
                                    onClick={() => setLogLines(100)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${logLines === 100 ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    100
                                </button>
                                <button
                                    onClick={() => setLogLines(200)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${logLines === 200 ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    200
                                </button>
                            </div>
                        </div>
                        {logsLoading && <p className="text-slate-300">Loading logs...</p>}
                        {logsError && <p className="text-red-400">Error loading logs: {(logsError as any)?.message || 'Unknown error'}</p>}
                        {logs && (
                            <div className="bg-black/30 rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono text-xs">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="mb-2 pb-2 border-b border-white/5">
                                        <div className="flex gap-3 items-start">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(log.level ?? 30) >= 50 ? 'bg-red-500/30 text-red-300' :
                                                    (log.level ?? 30) >= 40 ? 'bg-yellow-500/30 text-yellow-300' :
                                                        'bg-green-500/30 text-green-300'
                                                }`}>
                                                {(log.level ?? 30) >= 50 ? 'ERROR' : (log.level ?? 30) >= 40 ? 'WARN' : 'INFO'}
                                            </span>
                                            <span className="text-slate-400 whitespace-nowrap">
                                                {log.time ? new Date(log.time).toLocaleTimeString() : ''}
                                            </span>
                                            <span className="text-purple-300">{log.context || ''}</span>
                                            <span className="flex-1">{log.msg || JSON.stringify(log)}</span>
                                        </div>
                                        {log.req && (
                                            <div className="ml-20 mt-1 text-slate-400">
                                                {log.req.method} {log.req.url} - {log.res?.statusCode} ({log.responseTime}ms)
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
