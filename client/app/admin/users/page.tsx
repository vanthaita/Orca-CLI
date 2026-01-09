'use client';

import { useAdminUsers } from '@/hook/useAdminUsers';

export default function UsersPage() {
    const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                User Management
            </h1>

            <div className="border border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-1 rounded-xl">
                <div className="relative overflow-x-auto rounded-lg">
                    {usersLoading && (
                        <div className="p-12 text-center text-neutral-500 animate-pulse">
                            Loading users database...
                        </div>
                    )}

                    {usersError && (
                        <div className="p-12 text-center">
                            <div className="text-red-400 font-bold mb-2">Error loading users</div>
                            <div className="text-sm text-neutral-500 font-mono">{(usersError as any)?.message || 'Unknown network error'}</div>
                        </div>
                    )}

                    {users && (
                        <>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-neutral-400 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">User Details</th>
                                        <th className="px-6 py-4">Subscription</th>
                                        <th className="px-6 py-4">Access Level</th>
                                        <th className="px-6 py-4">Joined On</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{user.name || 'Anonymous'}</span>
                                                    <span className="text-xs text-neutral-500 font-mono mt-0.5">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 border border-dashed rounded text-[10px] font-bold uppercase tracking-wide ${user.plan === 'team'
                                                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                                                    : user.plan === 'pro'
                                                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                                                        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                                    }`}>
                                                    {user.plan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 border border-dashed rounded text-[10px] font-bold uppercase tracking-wide ${user.role === 'admin'
                                                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                                                    : 'border-neutral-500/50 bg-neutral-500/10 text-neutral-400'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-neutral-500 hover:text-white transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <div className="p-12 text-center text-neutral-500">
                                    No users found in the system.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            {users && (
                <div className="flex justify-between items-center text-sm text-neutral-600 px-2">
                    <div>Showing <strong className="text-white">{users.length}</strong> registered accounts</div>
                </div>
            )}
        </div>
    );
}
