'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthService } from '@/service/auth.service';
import Link from 'next/link';

function LoginContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get('userCode');

  // Checking redirect state prevents flash of login screen content
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Calculate the Google Login URL
  // If userCode is present, we want to return to /cli/verify?userCode=...
  const googleLoginUrl = useMemo(() => {
    const returnPath = userCode
      ? `/cli/verify?userCode=${encodeURIComponent(userCode)}`
      : '/dashboard';

    return AuthService.startGoogleLogin(returnPath);
  }, [userCode]);

  // Handle successful authentication redirection
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setIsRedirecting(true);
      if (userCode) {
        // If we have a userCode, go to verification page
        router.replace(`/cli/verify?userCode=${encodeURIComponent(userCode)}`);
      } else {
        // Otherwise go to dashboard
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, userCode, router]);

  // Loading state (initial check or redirecting)
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-emerald-400 font-mono text-sm">
            {isRedirecting ? 'Redirecting...' : 'Checking authentication...'}
          </div>
        </div>
      </div>
    );
  }

  // At this point: !isLoading && !isAuthenticated
  // Show Login UI
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-black">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome</h1>
          <p className="mt-3 text-sm text-neutral-400">
            {userCode
              ? 'Sign in to authorize your CLI device'
              : 'Sign in to manage your Orca account'}
          </p>
        </div>

        <a
          href={googleLoginUrl}
          className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </a>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="animate-pulse text-neutral-500 font-mono text-sm">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

