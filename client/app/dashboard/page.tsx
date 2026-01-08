'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useMe } from '@/hook/useMe';
import { useLogout } from '@/hook/useLogout';
import { usePlan } from '@/hook/usePlan';
import { useUsage } from '@/hook/useUsage';
import { useCliTokens, useRevokeToken, useRenameToken } from '@/hook/useCliTokens';
import { redirectToLogin } from '@/lib/auth-utils';

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

        // If not authenticated, redirect immediately
        if (!user && (me.isError || me.isFetched)) {
            // eslint-disable-next-line no-console
            console.log('[Dashboard] User not authenticated, redirecting to login');
            redirectToLogin('/dashboard');
        }
    }, [me.isLoading, me.isError, me.isFetched, user]);

    useEffect(() => {
        if (user) {
            // Check if there is a pending redirect
            const redirect = localStorage.getItem('auth_redirect');
            if (redirect) {
                console.log('Found pending redirect, redirecting to:', redirect);
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
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        );
    }

    if (me.isError) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="text-red-400 font-mono text-sm">Failed to load user data</div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    const activeTokens = cliTokens.data?.filter(t => !t.revokedAt) || [];
    const revokedTokens = cliTokens.data?.filter(t => t.revokedAt) || [];

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100">
            <div className="max-w-6xl mx-auto px-6 py-14">
                {/* Header */}
                <header className="flex items-center justify-between border-b-2 border-dashed border-white/20 pb-6 mb-10">
                    <Link href="/" className="text-2xl font-black text-white hover:text-emerald-400 transition-colors uppercase italic tracking-tighter">
                        Orca CLI
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
                </header>

                <div className="grid gap-8">
                    {/* User Profile Card */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <div className="flex items-start gap-6">
                            {user.picture && (
                                <img
                                    src={user.picture}
                                    alt={user.name || 'User'}
                                    className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-500/50"
                                />
                            )}
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-2">{user.name || 'Anonymous'}</h1>
                                <p className="text-neutral-400 mb-4">{user.email || 'No email'}</p>
                                <div className="inline-flex items-center gap-2 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-400 uppercase">
                                    {user.plan}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plan Details */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">Plan Details</h2>
                        {plan.isLoading ? (
                            <div className="text-neutral-500 animate-pulse">Loading plan info...</div>
                        ) : plan.isError ? (
                            <div className="text-red-400 text-sm">Failed to load plan details</div>
                        ) : plan.data ? (
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Current Plan</div>
                                        <div className="text-emerald-400 font-bold text-lg uppercase">{plan.data.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Daily AI Limit</div>
                                        <div className="text-neutral-300 font-bold text-lg">
                                            {plan.data.dailyAiLimit === null ? '∞ Unlimited' : plan.data.dailyAiLimit}
                                        </div>
                                    </div>
                                    {plan.data.expiresAt && (
                                        <div>
                                            <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Expires At</div>
                                            <div className="text-neutral-300">{new Date(plan.data.expiresAt).toLocaleDateString()}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Status</div>
                                        <div className={`font-bold ${plan.data.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {plan.data.isActive ? 'Active' : 'Expired'}
                                        </div>
                                    </div>
                                </div>
                                {plan.data.features && plan.data.features.length > 0 && (
                                    <div className="mt-6">
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-3">Available Features</div>
                                        <div className="flex flex-wrap gap-2">
                                            {plan.data.features.map((feature) => (
                                                <div
                                                    key={feature}
                                                    className="border border-dashed border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-mono text-emerald-300 rounded"
                                                >
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Usage Statistics */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">AI Usage Statistics</h2>
                        {usage.isLoading ? (
                            <div className="text-neutral-500 animate-pulse">Loading usage stats...</div>
                        ) : usage.isError ? (
                            <div className="text-red-400 text-sm">Failed to load usage statistics</div>
                        ) : usage.data ? (
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Requests Today</div>
                                        <div className="text-2xl font-bold text-white">{usage.data.requestCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Daily Limit</div>
                                        <div className="text-2xl font-bold text-emerald-400">
                                            {usage.data.dailyLimit === null ? '∞' : usage.data.dailyLimit}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Remaining</div>
                                        <div className="text-2xl font-bold text-neutral-300">
                                            {usage.data.remaining === null ? '∞' : usage.data.remaining}
                                        </div>
                                    </div>
                                </div>
                                {usage.data.dailyLimit !== null && (
                                    <div className="mt-6">
                                        <div className="flex justify-between text-sm text-neutral-500 mb-2">
                                            <span>Usage Progress</span>
                                            <span>{Math.round((usage.data.requestCount / usage.data.dailyLimit) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-800 border-2 border-dashed border-white/10 rounded-full h-4">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all"
                                                style={{ width: `${Math.min((usage.data.requestCount / usage.data.dailyLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="text-xs text-neutral-600 mt-4">
                                    Resets daily at midnight UTC • Current day: {usage.data.day}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* CLI Tokens Management */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">CLI Tokens</h2>
                        {cliTokens.isLoading ? (
                            <div className="text-neutral-500 animate-pulse">Loading CLI tokens...</div>
                        ) : cliTokens.isError ? (
                            <div className="text-red-400 text-sm">Failed to load CLI tokens</div>
                        ) : (
                            <div className="space-y-6">
                                {activeTokens.length === 0 ? (
                                    <div className="text-neutral-500 text-center py-8">
                                        <p className="mb-2">No active CLI tokens</p>
                                        <p className="text-sm">Run <code className="bg-black/40 px-2 py-1 rounded text-emerald-400">orca login</code> to create one</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide">Active Tokens ({activeTokens.length})</div>
                                        {activeTokens.map((token) => (
                                            <div key={token.id} className="border border-dashed border-emerald-500/30 bg-emerald-500/5 p-4 rounded-lg">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        {editingTokenId === token.id ? (
                                                            <div className="flex gap-2 mb-2">
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
                                                                    className="flex-1 bg-black/40 border border-emerald-500/50 px-3 py-1 text-sm text-white rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                                    placeholder="Enter device name"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleRenameToken(token.id)}
                                                                    disabled={renameToken.isPending}
                                                                    className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm rounded hover:bg-emerald-500/30 disabled:opacity-50"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTokenId(null);
                                                                        setNewTokenName('');
                                                                    }}
                                                                    className="px-3 py-1 bg-neutral-700 text-neutral-300 text-sm rounded hover:bg-neutral-600"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="font-bold text-emerald-400 mb-1">
                                                                {token.deviceName || token.label || 'CLI Device'}
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
                                                            {token.ipAddress && (
                                                                <div>
                                                                    <span className="text-neutral-600">IP:</span> {token.ipAddress}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <span className="text-neutral-600">Created:</span> {new Date(token.createdAt).toLocaleDateString()}
                                                            </div>
                                                            {token.lastUsedAt && (
                                                                <div>
                                                                    <span className="text-neutral-600">Last Used:</span> {new Date(token.lastUsedAt).toLocaleString()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <span className="text-neutral-600">Expires:</span> {new Date(token.expiresAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {editingTokenId !== token.id && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTokenId(token.id);
                                                                    setNewTokenName(token.deviceName || token.label);
                                                                }}
                                                                className="px-3 py-1 text-xs bg-neutral-700 text-neutral-300 rounded hover:bg-neutral-600"
                                                            >
                                                                Rename
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRevokeToken(token.id)}
                                                            disabled={revokeToken.isPending}
                                                            className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50"
                                                        >
                                                            Revoke
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {revokedTokens.length > 0 && (
                                    <div className="space-y-3 mt-6">
                                        <div className="text-sm text-neutral-500 uppercase tracking-wide">Revoked Tokens ({revokedTokens.length})</div>
                                        {revokedTokens.map((token) => (
                                            <div key={token.id} className="border border-dashed border-neutral-700 bg-neutral-900/50 p-4 rounded-lg opacity-50">
                                                <div className="font-bold text-neutral-500 mb-1">
                                                    {token.deviceName || token.label || 'CLI Device'}
                                                </div>
                                                <div className="text-xs text-neutral-600">
                                                    Revoked: {token.revokedAt ? new Date(token.revokedAt).toLocaleDateString() : 'Unknown'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Account Info */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">Account Information</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">User ID</div>
                                <div className="text-neutral-300 font-mono text-sm">{user.id}</div>
                            </div>
                            <div>
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Member Since</div>
                                <div className="text-neutral-300">{new Date(user.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Plan</div>
                                <div className="text-emerald-400 font-bold uppercase">{user.plan}</div>
                            </div>
                            <div>
                                <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">Email</div>
                                <div className="text-neutral-300">{user.email || 'Not provided'}</div>
                            </div>
                        </div>
                    </div>

                    {/* CLI Integration */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">CLI Integration</h2>
                        <div className="space-y-4">
                            <p className="text-neutral-400">
                                You can now use the Orca CLI with your account. Run the following command to login:
                            </p>
                            <div className="bg-black/40 border-2 border-dashed border-emerald-500/30 rounded-lg p-4 font-mono text-sm text-emerald-300">
                                orca login
                            </div>
                            <p className="text-neutral-500 text-sm">
                                This will open a browser window to approve the CLI device login.
                            </p>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-dashed border-white/20 pb-3">Quick Links</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Link
                                href="/"
                                className="border-2 border-dashed border-white/20 bg-black/20 px-4 py-3 text-neutral-300 hover:text-white hover:border-emerald-500/50 transition-all rounded-lg"
                            >
                                ← Back to Home
                            </Link>
                            <Link
                                href="/dashboard/payments"
                                className="border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded-lg font-bold text-center"
                            >
                                💳 Payment History
                            </Link>
                            <Link
                                href="/dashboard/upgrade"
                                className="border-2 border-dashed border-blue-500/50 bg-blue-500/10 px-4 py-3 text-blue-400 hover:bg-blue-500/20 transition-all rounded-lg font-bold text-center"
                            >
                                ⬆️ Upgrade Plan
                            </Link>
                            <Link
                                href="/cli/verify"
                                className="border-2 border-dashed border-purple-500/50 bg-purple-500/10 px-4 py-3 text-purple-400 hover:bg-purple-500/20 transition-all rounded-lg font-bold text-center"
                            >
                                ✓ Approve CLI Device
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
