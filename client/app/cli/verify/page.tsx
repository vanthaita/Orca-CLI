'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

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

function CliVerifyInner() {
  const searchParams = useSearchParams();
  const me = useMe();
  const verify = useCliVerify();

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
    // If we finished loading checking me headers, and we are not logged in, we need to redirect to login
    // But if there was an error (e.g. network/CORS), we should show that instead of redirecting loop
    if (!me.isLoading && !me.isError && !me.data?.user) {
      const codeForRedirect = userCodeFromQuery || userCode;
      if (!codeForRedirect) return;
      const redirectUrl = `/login?userCode=${encodeURIComponent(codeForRedirect)}`;
      window.location.href = redirectUrl;
    }
  }, [me.isLoading, me.data, userCode, userCodeFromQuery, me.isError]);

  const statusText = useMemo(() => {
    if (me.isLoading) return 'Checking authentication...';
    if (!me.data?.user) return 'Redirecting to login...';

    if (verify.isPending) return 'Verifying...';
    if (verify.isSuccess) return 'Approved. You can go back to your CLI.';
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 p-6">
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
        />

        <button
          onClick={() => verify.mutate(userCode.trim())}
          disabled={!userCode.trim() || verify.isPending}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Approve
        </button>

        {statusText ? <div className="mt-4 text-sm">{statusText}</div> : null}
        {verify.isError ? (
          <div className="mt-2 text-xs text-red-600">{(verify.error as any)?.message ?? 'Error'}</div>
        ) : null}
      </div>
    </div>
  );
}
