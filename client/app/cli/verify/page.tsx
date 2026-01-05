'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { useCliVerify } from '@/hook/useCliVerify';
import { useMe } from '@/hook/useMe';

export default function CliVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="animate-pulse text-neutral-400 font-mono">Loading...</div>
        </div>
      }
    >
      <CliVerifyInner />
    </Suspense>
  );
}

const CliVerifyInner = () => {
  const searchParams = useSearchParams();
  const me = useMe();
  const verify = useCliVerify();
  const router = useRouter(); // Import useRouter from next/navigation

  const didAutoApprove = useRef(false);

  const userCodeFromQuery = useMemo(() => {
    const fromQuery = searchParams.get('userCode') ?? searchParams.get('code') ?? '';
    return fromQuery.trim();
  }, [searchParams]);

  const [userCode, setUserCode] = useState(userCodeFromQuery);

  useEffect(() => {
    me.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state if query param changes late
  useEffect(() => {
    if (userCodeFromQuery && userCodeFromQuery !== userCode) {
      setUserCode(userCodeFromQuery);
    }
  }, [userCodeFromQuery, userCode]);

  // Auto-approve logic
  useEffect(() => {
    // If we already tried to auto-approve, don't try again automatically to avoid loops
    if (didAutoApprove.current) return;

    // Conditions to attempt auto-approve:
    // 1. We have a user (logged in)
    // 2. We have a user code
    // 3. We are not already verifying
    // 4. We haven't succeeded yet
    // 5. We are not loading user data
    const canAutoApprove =
      me.data?.user &&
      !me.isLoading &&
      userCodeFromQuery &&
      !verify.isPending &&
      !verify.isSuccess &&
      !verify.isError;

    if (canAutoApprove) {
      console.log('[CliVerify] Auto-approving code:', userCodeFromQuery);
      didAutoApprove.current = true;
      verify.mutate(userCodeFromQuery, {
        onError: () => {
          didAutoApprove.current = false;
        },
      });
    }
  }, [me.data?.user, me.isLoading, userCodeFromQuery, verify.isPending, verify.isSuccess, verify.isError, verify]);

  // Redirect if not logged in logic - handled by UI button instead for better UX, 
  // but we can auto-redirect if we have the code and definitely no user.
  useEffect(() => {
    if (!me.isLoading && !me.data?.user && userCodeFromQuery) {
      // Optional: Could auto-redirect here, but showing UI is often safer to avoid loops.
      // leaving it as manual action or "Redirecting..." UI for now to be safe.
    }
  }, [me.isLoading, me.data, userCodeFromQuery]);

  const handleLoginRedirect = () => {
    const code = userCodeFromQuery || userCode;
    const returnUrl = `/cli/verify?userCode=${encodeURIComponent(code)}`;
    // Use the auth service helper? Or just direct link. 
    // Usually standard login link wraps this.
    // For now, let's just go to /login passing userCode so it can redirect back.
    router.push(`/login?userCode=${encodeURIComponent(code)}`);
  };

  const statusText = useMemo(() => {
    if (me.isLoading) return 'Checking authentication...';
    if (!me.data?.user) return 'Sign in required to approve CLI login.';

    if (verify.isPending) return 'Verifying code...';
    if (verify.isSuccess) return 'Approved! You can close this tab.';
    if (verify.isError) return 'Verification failed.';

    if (!userCode.trim()) return 'Please enter the code displayed in your terminal.';

    return 'Ready to approve.';
  }, [verify.isPending, verify.isSuccess, verify.isError, me.isLoading, me.data, userCode]);

  if (me.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-red-500 font-semibold mb-2">Connection Error</div>
          <div className="text-sm text-neutral-600 mb-4">
            Could not connect to the authentication server.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-neutral-100 hover:bg-neutral-200 px-3 py-2 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">

        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${verify.isSuccess ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-600'
            }`}>
            {verify.isSuccess ? (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
          {verify.isSuccess ? 'Login Approved' : 'CLI Login Request'}
        </h1>

        <p className="text-center text-sm text-neutral-500 mb-8">
          {statusText}
        </p>

        {verify.isSuccess ? (
          <div className="bg-green-50 text-green-800 text-sm rounded-lg p-4 text-center">
            You have successfully logged in to the CLI. You can now close this window.
          </div>
        ) : (
          <div className="space-y-4">
            {me.data?.user ? (
              <div className="bg-neutral-50 rounded-lg p-3 text-sm text-center border border-neutral-100">
                Signed in as <span className="font-semibold">{me.data.user.email}</span>
              </div>
            ) : (
              <button
                onClick={handleLoginRedirect}
                className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Sign in to Approve
              </button>
            )}

            <div className="relative">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Confirmation Code
              </label>
              <input
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                placeholder="ABCD-EFGH"
                className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none uppercase"
                disabled={verify.isPending || verify.isSuccess}
                maxLength={9}
              />
            </div>

            {me.data?.user && (
              <button
                onClick={() => verify.mutate(userCode.trim())}
                disabled={!userCode.trim() || verify.isPending}
                className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verify.isPending ? 'Verifying...' : 'Approve Login'}
              </button>
            )}

            {verify.isError && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {(verify.error as any)?.message || 'Something went wrong. Please try again.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
