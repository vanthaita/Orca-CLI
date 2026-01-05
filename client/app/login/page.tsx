'use client';

import Link from 'next/link';
import { useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthService } from '@/service/auth.service';

function LoginContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const userCode = searchParams.get('userCode');

  const googleLoginUrl = useMemo(() => {
    // keep in sync with axios baseURL
    const state = userCode ? `/cli/verify?userCode=${encodeURIComponent(userCode)}` : undefined;
    return `${AuthService.startGoogleLogin(state)}`;
  }, [userCode]);

  // Redirect to dashboard or next url if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (userCode) {
        window.location.href = `/cli/verify?userCode=${userCode}`;
      } else {
        window.location.href = '/dashboard';
      }
    }
  }, [isAuthenticated, isLoading, userCode]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-pulse text-emerald-400 font-mono">Checking authentication...</div>
      </div>
    );
  }

  // Don't show login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border-2 border-dashed border-white/20 bg-black/20 backdrop-blur-sm p-8">
        <h1 className="text-3xl font-bold text-white">Login</h1>
        <p className="mt-3 text-sm text-neutral-400">
          Sign in to approve CLI device login and manage your Orca account.
        </p>

        <a
          href={googleLoginUrl}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-white/20 bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:border-white/40 hover:scale-[1.02]"
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

        <div className="mt-8 text-sm text-center">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors underline">
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-pulse text-emerald-400 font-mono">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

