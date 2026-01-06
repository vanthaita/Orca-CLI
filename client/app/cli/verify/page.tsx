'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthService } from '@/service/auth.service';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading } = useAuth();

    const [userCode, setUserCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const didCheckAuth = useRef(false);

    // Initialize userCode from URL
    useEffect(() => {
        const code = searchParams.get('userCode');
        if (code) {
            setUserCode(code.toUpperCase());
        }
    }, [searchParams]);

    // Handle Authentication Enforce
    useEffect(() => {
        if (isLoading) return;
        if (didCheckAuth.current) return;

        if (!isAuthenticated) {
            didCheckAuth.current = true;
            // Redirect to login if not authenticated, carrying the userCode
            const code = searchParams.get('userCode');
            const loginUrl = code
                ? `/login?userCode=${encodeURIComponent(code)}`
                : '/login';
            router.replace(loginUrl);
        }
    }, [isAuthenticated, isLoading, router, searchParams]);

    const handleVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!userCode.trim()) return;

        setStatus('loading');
        setMessage('');

        try {
            await AuthService.cliVerify(userCode);
            setStatus('success');
        } catch (error: any) {
            setStatus('error');
            setMessage(error?.response?.data?.message || 'Failed to verify code. Please check the code and try again.');
        }
    };

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    // If not authenticated, we return null because we are redirecting
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black text-white">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
                        <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Device Confirmation
                    </h1>
                    <p className="mt-2 text-sm text-neutral-400">
                        Please confirm the code displayed on your CLI to continue.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center text-emerald-400 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="h-20 w-20" />
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-white">Authorization Successful!</h3>
                            <p className="text-sm text-neutral-400">
                                Your terminal is now authenticated.
                                <br />
                                You may close this window.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleVerify} className="mt-8 space-y-6">
                        <div>
                            <label htmlFor="user-code" className="sr-only">
                                User Code
                            </label>
                            <input
                                id="user-code"
                                name="code"
                                type="text"
                                required
                                value={userCode}
                                onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                                className="block w-full rounded-xl border-0 py-4 text-center text-3xl font-mono tracking-[0.5em] text-white bg-black/50 shadow-inner ring-1 ring-inset ring-white/10 placeholder:text-neutral-700 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-3xl transition-all"
                                placeholder="ABCDEF"
                                maxLength={9}
                                autoComplete="off"
                            />
                        </div>

                        {status === 'error' && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-400">
                                            Verification Failed
                                        </h3>
                                        <div className="mt-1 text-sm text-red-500/80">
                                            <p>{message}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading' || !userCode}
                            className="flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Confirm Device Logic'
                            )}
                        </button>
                    </form>
                )}
            </div>

            {!status.includes('success') && (
                <div className="mt-8">
                    <Link href="/" className="text-sm text-neutral-500 hover:text-white transition-colors">
                        Cancel
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function CliVerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
