'use client';

import { useSearchParams } from 'next/navigation';
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

  const didAutoApprove = useRef(false);

  const userCodeFromQuery = useMemo(() => {
    const fromQuery = searchParams.get('userCode') ?? searchParams.get('code') ?? '';
    return fromQuery.trim();
  }, [searchParams]);

  const [userCode, setUserCode] = useState(userCodeFromQuery);

  useEffect(() => {
    if (userCodeFromQuery && userCodeFromQuery !== userCode) {
      setUserCode(userCodeFromQuery);
    }
  }, [userCodeFromQuery, userCode]);

  useEffect(() => {
    console.log('[CliVerify] Auto-approve check:', {
      didAutoApprove: didAutoApprove.current,
      isLoading: me.isLoading,
      isError: me.isError,
      hasUser: !!me.data?.user,
      userCodeFromQuery,
      userCode,
      isPending: verify.isPending,
      isSuccess: verify.isSuccess,
    });

    if (didAutoApprove.current) {
      console.log('[CliVerify] Already approved, skipping');
      return;
    }
    if (me.isLoading) {
      console.log('[CliVerify] Still loading user data, waiting...');
      return;
    }
    if (me.isError) {
      console.log('[CliVerify] Error loading user, skipping');
      return;
    }
    if (!me.data?.user) {
      console.log('[CliVerify] No user data, skipping');
      return;
    }

    const codeToApprove = (userCodeFromQuery || userCode).trim();
    if (!codeToApprove) {
      console.log('[CliVerify] No user code to approve');
      return;
    }
    if (verify.isPending || verify.isSuccess) {
      console.log('[CliVerify] Verify already in progress or completed');
      return;
    }

    console.log('[CliVerify] ✅ All conditions met, triggering verify.mutate with code:', codeToApprove);
    didAutoApprove.current = true;
    verify.mutate(codeToApprove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.isLoading, me.isError, me.data?.user, userCodeFromQuery, userCode, verify.isPending, verify.isSuccess]);

  useEffect(() => {
    console.log('[CliVerify] Auth check:', {
      isLoading: me.isLoading,
      isError: me.isError,
      hasUser: !!me.data?.user,
      userData: me.data,
      userCodeFromQuery
    });

    if (!me.isLoading && !me.isError && !me.data?.user) {
      const codeForRedirect = userCodeFromQuery || userCode;
      if (!codeForRedirect) return;
      const redirectUrl = `/login?userCode=${encodeURIComponent(codeForRedirect)}`;
      console.log('[CliVerify] WOULD Redirect to:', redirectUrl);
      window.location.href = redirectUrl;
    }
  }, [me.isLoading, me.data, userCode, userCodeFromQuery, me.isError]);

  const statusText = useMemo(() => {
    if (me.isLoading) return 'Checking authentication...';
    if (!me.data?.user) return 'Redirecting to login...';

    if (verify.isPending) return 'Verifying...';
    if (verify.isSuccess) return 'Approved! You can close this tab and return to your terminal.';
    if (verify.isError) return 'Verification failed.';
    return '';
  }, [verify.isPending, verify.isSuccess, verify.isError, me.isLoading, me.data]);

  if (me.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-red-500 font-semibold mb-2">Connection Error</div>
          <div className="text-sm text-neutral-600 mb-4">
            Could not connect to the authentication server.
            <br />
            Backend URL: {process.env.NEXT_PUBLIC_ORCA_API_BASE_URL || 'http://localhost:8000'}
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

  if (me.isLoading || !me.data?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-pulse text-neutral-400 font-mono">
          {me.isLoading ? 'Checking authentication...' : 'Redirecting to login...'}
          <div className="text-xs mt-2 text-neutral-600">
            User: {JSON.stringify(me.data?.user)} <br />
            Error: {me.isError ? 'Yes' : 'No'} <br />
            Loading: {me.isLoading ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 p-6">
        {verify.isSuccess ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">Successfully Approved!</h2>
            <p className="mt-2 text-sm text-neutral-600">
              You can now safely close this tab and return to your terminal.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Approve CLI Login</h1>

            <div className="mt-2 text-sm text-neutral-600">
              Signed in as: <span className="font-medium">{me.data?.user?.email ?? '...'}</span>
            </div>

            <label className="mt-6 block text-sm font-medium">User code</label>
            <input
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="ABCD-EFGH"
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              disabled={verify.isPending || verify.isSuccess}
            />

            <button
              onClick={() => verify.mutate(userCode.trim())}
              disabled={!userCode.trim() || verify.isPending}
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:bg-neutral-800"
            >
              {verify.isPending ? 'Verifying...' : 'Approve'}
            </button>

            {statusText && !verify.isSuccess ? <div className="mt-4 text-sm text-center text-neutral-600">{statusText}</div> : null}
            {verify.isError ? (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {(verify.error as any)?.message ?? 'Verification failed. Please try again.'}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
