'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import type { CliVerifyResponse } from '@/interface/auth';

function CliVerifyContent() {
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [userCode, setUserCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Get userCode from URL params
        const codeFromUrl = searchParams.get('userCode');
        if (codeFromUrl) {
            setUserCode(codeFromUrl.toUpperCase());
        }
    }, [searchParams]);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isAuthLoading && !isAuthenticated) {
            const currentUserCode = searchParams.get('userCode');
            const loginUrl = currentUserCode
                ? `/login?userCode=${encodeURIComponent(currentUserCode)}`
                : '/login';

            window.location.href = loginUrl;
        }
    }, [isAuthLoading, isAuthenticated, searchParams]);

    const handleVerify = async () => {
        if (!userCode.trim()) {
            setErrorMessage('Please enter a user code');
            setVerifyStatus('error');
            return;
        }

        setIsVerifying(true);
        setVerifyStatus('idle');
        setErrorMessage('');

        try {
            await apiClient.post<CliVerifyResponse>('/auth/cli/verify', {
                userCode: userCode.trim(),
            });

            setVerifyStatus('success');
        } catch (error: any) {
            setVerifyStatus('error');
            setErrorMessage(error?.message || 'Failed to verify device. Please check the code and try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleUserCodeChange = (value: string) => {
        // Auto-format: uppercase and remove spaces
        const formatted = value.toUpperCase().replace(/\s/g, '');
        setUserCode(formatted);

        // Reset error state when user types
        if (verifyStatus === 'error') {
            setVerifyStatus('idle');
            setErrorMessage('');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !isVerifying) {
            handleVerify();
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-12">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-black text-white hover:text-emerald-400 transition-colors uppercase italic tracking-tighter mb-3">
                            Orca CLI
                        </h1>
                    </Link>
                    <p className="text-neutral-400">Approve CLI Device</p>
                </div>

                {/* Verification Card */}
                <div className="border-2 border-dashed border-white/20 bg-black/40 backdrop-blur-sm rounded-xl p-8">
                    {verifyStatus === 'success' ? (
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-dashed border-emerald-500/50">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Device Approved!</h2>
                                <p className="text-neutral-400">
                                    Your CLI device has been successfully authenticated. You can now close this window and return to your terminal.
                                </p>
                            </div>

                            <div className="bg-emerald-900/20 border-2 border-dashed border-emerald-500/30 rounded-lg p-4">
                                <p className="text-sm text-emerald-300 font-mono">
                                    ✓ Device code: {userCode}
                                </p>
                            </div>

                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500"
                                style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Verify Device</h2>
                                <p className="text-neutral-400 text-sm">
                                    Enter the code displayed in your terminal to authenticate the CLI device.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="userCode" className="block text-sm font-medium text-neutral-300 mb-2">
                                    Device Code
                                </label>
                                <input
                                    id="userCode"
                                    type="text"
                                    value={userCode}
                                    onChange={(e) => handleUserCodeChange(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter code (e.g., ABCD1234)"
                                    maxLength={8}
                                    className="w-full bg-black/60 border-2 border-dashed border-white/20 rounded-lg px-4 py-3 text-white font-mono text-lg tracking-widest text-center uppercase focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    disabled={isVerifying}
                                />
                                {verifyStatus === 'error' && errorMessage && (
                                    <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
                                )}
                            </div>

                            <button
                                onClick={handleVerify}
                                disabled={isVerifying || !userCode.trim()}
                                className="w-full relative inline-flex items-center justify-center gap-3 bg-emerald-500 px-6 py-4 text-base font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                            >
                                {isVerifying ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Approve Device</span>
                                    </>
                                )}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t-2 border-dashed border-white/20"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-black/40 px-2 text-neutral-500">Secure</span>
                                </div>
                            </div>

                            <div className="bg-blue-900/20 border-2 border-dashed border-blue-500/30 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-blue-300">
                                        <p className="font-semibold mb-1">Device Authentication</p>
                                        <p className="text-blue-300/80">
                                            This code is displayed in your terminal. Approving will grant CLI access to your account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Link */}
                {verifyStatus !== 'success' && (
                    <div className="mt-6 text-center">
                        <Link
                            href="/dashboard"
                            className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CliVerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
                <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
            </div>
        }>
            <CliVerifyContent />
        </Suspense>
    );
}
