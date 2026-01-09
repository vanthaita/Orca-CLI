'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ORCA_API_BASE_URL, NEXT_PUBLIC_PREFIX_API } from '@/config/env';

function LoginContent() {
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (isAuthenticated && !isRedirecting) {
            setIsRedirecting(true);

            const userCode = searchParams.get('userCode');
            const redirect = searchParams.get('redirect');

            let destination = '/dashboard';

            if (userCode) {
                destination = `/cli/verify?userCode=${encodeURIComponent(userCode)}`;
            } else if (redirect) {
                destination = redirect;
            }

            window.location.href = destination;
        }
    }, [isAuthenticated, isRedirecting, searchParams]);

    const handleGoogleLogin = () => {
        const userCode = searchParams.get('userCode');
        const redirect = searchParams.get('redirect');

        let state = '/dashboard';

        if (userCode) {
            state = `/cli/verify?userCode=${encodeURIComponent(userCode)}`;
        } else if (redirect) {
            state = redirect;
        }

        const authUrl = `${ORCA_API_BASE_URL}/${NEXT_PUBLIC_PREFIX_API}/auth/google?state=${encodeURIComponent(state)}`;
        window.location.href = authUrl;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        );
    }

    if (isRedirecting) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="text-emerald-400 font-mono">Redirecting...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-black text-white hover:text-emerald-400 transition-colors uppercase italic tracking-tighter mb-3">
                            Orca CLI
                        </h1>
                    </Link>
                    <p className="text-neutral-400">Sign in to continue</p>
                </div>

                <div className="border-2 border-dashed border-white/20 bg-black/40 backdrop-blur-sm rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full relative inline-flex items-center justify-center gap-3 bg-white px-6 py-4 text-base font-bold text-black transition hover:bg-emerald-300 group overflow-hidden"
                            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Sign in with Google</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-dashed border-white/20"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black/40 px-2 text-neutral-500">Secure Authentication</span>
                            </div>
                        </div>

                        <div className="text-center text-sm text-neutral-500">
                            <p>By signing in, you agree to our</p>
                            <p className="text-emerald-400">Terms of Service and Privacy Policy</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
