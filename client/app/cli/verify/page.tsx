'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthService } from '@/service/auth.service';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
    const searchParams = useSearchParams();
    const [userCode, setUserCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const code = searchParams.get('userCode');
        if (code) {
            setUserCode(code);
        }
    }, [searchParams]);

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
            setMessage(error?.response?.data?.message || 'Failed to verify code. Please try again.');
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Device Login
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Enter the code displayed on your device
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center text-green-600 dark:text-green-400 fade-in">
                        <CheckCircle2 className="h-16 w-16" />
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Success!</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                You have successfully signed in to the CLI.
                                <br />
                                You can now close this window.
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
                                className="block w-full rounded-md border-0 py-3 text-center text-2xl font-mono tracking-[0.5em] text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-950 dark:text-white dark:ring-gray-700 sm:text-2xl"
                                placeholder="ABCD-1234"
                                maxLength={9}
                            />
                        </div>

                        {status === 'error' && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            Verification Failed
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>{message}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading' || !userCode}
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Verify Device'
                            )}
                        </button>
                    </form>
                )}
            </div>
            <div className="mt-8">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}

export default function CliVerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
