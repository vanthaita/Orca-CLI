'use client';

import { useMe } from '@/hook/useMe';
import { useLogout } from '@/hook/useLogout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const me = useMe();
    const logout = useLogout();
    const pathname = usePathname();
    const user = me.data?.user;

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

    const navItems = [
        {
            name: 'Overview', href: '/admin', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: 'Users', href: '/admin/users', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            name: 'System Logs', href: '/admin/logs', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-dashed border-white/10 p-6 flex flex-col fixed h-full bg-[#0c0c0c]/95 backdrop-blur-sm z-50">
                <div className="mb-10">
                    <Link href="/" className="text-2xl font-black text-white hover:text-emerald-400 transition-colors uppercase italic tracking-tighter block">
                        Orca CLI
                    </Link>
                    <p className="text-neutral-500 text-xs uppercase tracking-wide mt-1">Admin Dashboard</p>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border border-dashed rounded-lg group ${isActive
                                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="pt-6 border-t border-dashed border-white/10 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-neutral-400 transition-all hover:text-white hover:bg-white/5 rounded-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        User Dashboard
                    </Link>
                    <button
                        onClick={handleLogout}
                        disabled={logout.isPending}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10 rounded-lg disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {logout.isPending ? 'Logging out...' : 'Logout'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 min-h-screen relative">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none -z-10" />
                {children}
            </main>
        </div>
    );
}
