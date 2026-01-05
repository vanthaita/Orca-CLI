'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { useMe } from '@/hook/useMe';

export default function DashboardPage() {
    const me = useMe();
    const user = me.data?.user;

    useEffect(() => {
        if (me.isLoading) return;
        if (user) return;

        // Not authenticated or session invalid -> redirect to login
        setTimeout(() => {
            window.location.href = '/login';
        }, me.isError ? 2000 : 1000);
    }, [me.isLoading, me.isError, user]);

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
        // Clear cookies and redirect
        document.cookie = 'accessToken=; path=/; max-age=0';
        document.cookie = 'refreshToken=; path=/api/v1/auth; max-age=0';
        window.location.href = '/';
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
                        className="inline-flex items-center gap-2 border-2 border-dashed border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500"
                        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </header>

                {/* User Profile Card */}
                <div className="grid gap-8">
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
                                href="/cli/verify"
                                className="border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded-lg font-bold text-center"
                            >
                                Approve CLI Device
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
