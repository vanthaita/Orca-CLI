'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    GitCommit,
    UploadCloud,
    GitMerge,
    FileText,
    Zap,
    Clock,
    Sparkles,
    LucideIcon
} from 'lucide-react';

import { useMe } from '@/hook/useMe';
import { useLogout } from '@/hook/useLogout';
import { usePlan } from '@/hook/usePlan';
import { useUsage } from '@/hook/useUsage';
import { useCliTokens, useRevokeToken, useRenameToken } from '@/hook/useCliTokens';
import { redirectToLogin } from '@/lib/auth-utils';
import TeamManagement from '@/component/TeamManagement';

const FEATURE_CONFIG: Record<string, { label: string; icon: LucideIcon; description: string }> = {
    'ai_commit': {
        label: 'AI Commit Messages',
        icon: GitCommit,
        description: 'Generate meaningful commit messages automatically'
    },
    'auto_publish': {
        label: 'Auto Publish',
        icon: UploadCloud,
        description: 'Seamlessly publish changes to remote repositories'
    },
    'ai_conflict_resolution': {
        label: 'Smart Conflict Resolve',
        icon: GitMerge,
        description: 'AI-assisted merge conflict resolution'
    },
    'ai_release_notes': {
        label: 'AI Release Notes',
        icon: FileText,
        description: 'Generate comprehensive release notes instantly'
    }
};

export default function DashboardPage() {
    const me = useMe();
    const plan = usePlan();
    const usage = useUsage();
    const cliTokens = useCliTokens();
    const logout = useLogout();
    const revokeToken = useRevokeToken();
    const renameToken = useRenameToken();

    const user = me.data?.user;
    const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
    const [newTokenName, setNewTokenName] = useState('');

    useEffect(() => {
        if (me.isLoading) return;

        if (!user && (me.isError || me.isFetched)) {
            redirectToLogin('/dashboard');
        }
    }, [me.isLoading, me.isError, me.isFetched, user]);

    useEffect(() => {
        if (user) {
            const redirect = localStorage.getItem('auth_redirect');
            if (redirect) {
                localStorage.removeItem('auth_redirect');
                window.location.href = redirect;
            }
        }
    }, [user]);

    const handleLogout = () => {
        logout.mutate();
    };

    const handleRevokeToken = (tokenId: string) => {
        if (confirm('Are you sure you want to revoke this CLI token? The device will need to login again.')) {
            revokeToken.mutate(tokenId);
        }
    };

    const handleRenameToken = (tokenId: string) => {
        if (newTokenName.trim()) {
            renameToken.mutate({ tokenId, name: newTokenName.trim() }, {
                onSuccess: () => {
                    setEditingTokenId(null);
                    setNewTokenName('');
                },
            });
        }
    };

    if (me.isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-pulse text-emerald-500 font-medium">Loading...</div>
            </div>
        );
    }

    if (me.isError) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-red-400 font-medium">Failed to load user data. Please refresh.</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const activeTokens = cliTokens.data?.filter(t => !t.revokedAt) || [];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-emerald-500/30">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <header className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-800">
                    <Link href="/" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors tracking-tight">
                        <div className="leading-tight">
                            <div className="text-2xl font-black tracking-tighter text-white uppercase italic group-hover:text-emerald-400 transition-colors">
                                Orca CLI <span className="text-emerald-500 ml-1.5 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium text-sm">BETA</span>
                            </div>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        disabled={logout.isPending}
                        className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                        {logout.isPending ? 'Logging out...' : 'Sign out'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </header>

                <div className="grid lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1 space-y-6">
                        <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                            <div className="flex items-center gap-4 mb-4">
                                {user.picture ? (
                                    <img
                                        src={user.picture}
                                        alt={user.name || 'User'}
                                        className="w-12 h-12 rounded-full border border-neutral-700"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-bold">
                                        {(user.name || 'U')[0]}
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-bold text-white">{user.name || 'Anonymous'}</h2>
                                    <p className="text-sm text-neutral-500 truncate max-w-[140px]">{user.email || 'No email'}</p>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg uppercase tracking-wide mb-4">
                                {user.plan} Plan
                            </div>
                            <div className="text-xs text-neutral-500 flex flex-col gap-1">
                                <div>User ID: <span className="font-mono text-neutral-400">{user.id.slice(0, 8)}...</span></div>
                                <div>Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-2">
                            <Link
                                href="/dashboard/upgrade"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-lg font-bold text-center transition-colors shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Upgrade Plan
                            </Link>
                            <Link
                                href="/dashboard/payments"
                                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 px-4 py-3 rounded-lg font-medium text-center transition-colors border border-neutral-800 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Payment History
                            </Link>
                            <Link
                                href="/cli/verify"
                                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 px-4 py-3 rounded-lg font-medium text-center transition-colors border border-neutral-800 sm:hidden"
                            >
                                Approve New Device
                            </Link>
                        </nav>
                    </aside>

                    <main className="lg:col-span-3 space-y-6">
                        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-white">Daily AI Usage</h2>
                                {usage.data && (
                                    <div className="text-xs text-neutral-500">Resets in: <span className="text-neutral-300 font-mono">24h</span></div>
                                )}
                            </div>
                            <div className="p-6">
                                {usage.isLoading ? (
                                    <div className="animate-pulse h-16 bg-neutral-800 rounded"></div>
                                ) : usage.data ? (
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <span className="text-3xl font-bold text-white">{usage.data.requestCount}</span>
                                                <span className="text-neutral-500 text-sm ml-2">requests today</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm text-neutral-400">Limit: {usage.data.dailyLimit === null ? '∞' : usage.data.dailyLimit}</span>
                                            </div>
                                        </div>
                                        {usage.data.dailyLimit !== null && (
                                            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min((usage.data.requestCount / usage.data.dailyLimit) * 100, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-red-400 text-sm">Unavailable</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-gradient-to-r from-neutral-900 to-neutral-900/50">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    Current Plan Details
                                </h2>
                                {plan.data && (
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${plan.data.isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {plan.data.isActive ? 'Active Plan' : 'Plan Expired'}
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                {plan.isLoading ? (
                                    <div className="space-y-4">
                                        <div className="animate-pulse h-24 bg-neutral-800 rounded-lg"></div>
                                        <div className="animate-pulse h-4 bg-neutral-800 rounded w-1/3"></div>
                                    </div>
                                ) : plan.data ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {plan.data.features?.map((featureKey) => {
                                                const config = FEATURE_CONFIG[featureKey] || {
                                                    label: featureKey,
                                                    icon: Zap,
                                                    description: 'Advanced feature unlocked'
                                                };
                                                const Icon = config.icon;

                                                return (
                                                    <div
                                                        key={featureKey}
                                                        className="group p-3 rounded-lg border border-neutral-800 bg-neutral-800/30 hover:bg-neutral-800/50 hover:border-emerald-500/30 transition-all duration-300 flex items-start gap-3"
                                                    >
                                                        <div className="p-2 rounded-md bg-neutral-900 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 text-neutral-400 transition-colors">
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white text-sm group-hover:text-emerald-400 transition-colors">
                                                                {config.label}
                                                            </div>
                                                            <div className="text-xs text-neutral-500 mt-0.5">
                                                                {config.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {plan.data.expiresAt && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-500 pt-4 border-t border-neutral-800">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>
                                                    Plan expires on <span className="text-neutral-300 font-medium">{new Date(plan.data.expiresAt).toLocaleDateString()}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-neutral-500">
                                        <p>No plan details available.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Team Management Section - Only for Team Plan */}
                        {user.plan === 'team' && (
                            <TeamManagement user={user} />
                        )}

                        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-white mb-1">Connect New Device</h3>
                                <p className="text-sm text-neutral-400">Run this command in your terminal to authenticate.</p>
                            </div>
                            <div className="bg-black/50 border border-neutral-800 rounded-lg px-4 py-2 font-mono text-sm text-emerald-400 whitespace-nowrap">
                                orca login
                            </div>
                        </div>


                        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                            <div className="p-6 border-b border-neutral-800">
                                <h2 className="text-lg font-bold text-white">Active Sessions</h2>
                            </div>
                            {cliTokens.isLoading ? (
                                <div className="p-6 animate-pulse space-y-4">
                                    <div className="h-12 bg-neutral-800 rounded"></div>
                                    <div className="h-12 bg-neutral-800 rounded"></div>
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-800">
                                    {activeTokens.length === 0 ? (
                                        <div className="p-8 text-center text-neutral-500">
                                            No active devices found.
                                        </div>
                                    ) : (
                                        activeTokens.map((token) => (
                                            <div key={token.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-800/50 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    {editingTokenId === token.id ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={newTokenName}
                                                                onChange={(e) => setNewTokenName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleRenameToken(token.id);
                                                                    if (e.key === 'Escape') {
                                                                        setEditingTokenId(null);
                                                                        setNewTokenName('');
                                                                    }
                                                                }}
                                                                className="bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white rounded focus:outline-none focus:border-emerald-500 w-full max-w-[200px]"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => handleRenameToken(token.id)} className="text-emerald-400 text-xs hover:underline">Save</button>
                                                            <button onClick={() => setEditingTokenId(null)} className="text-neutral-400 text-xs hover:underline">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-medium text-white truncate">
                                                                {token.deviceName || token.label || 'CLI Device'}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTokenId(token.id);
                                                                    setNewTokenName(token.deviceName || token.label);
                                                                }}
                                                                className="text-neutral-500 hover:text-neutral-300"
                                                                title="Rename"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-neutral-500 mt-1 flex gap-3">
                                                        <span>IP: {token.ipAddress || 'Unknown'}</span>
                                                        <span>•</span>
                                                        <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeToken(token.id)}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
