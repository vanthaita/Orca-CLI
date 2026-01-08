export function clearAuthState(): void {
    try {
        const authKeys = Object.keys(localStorage).filter(key =>
            key.includes('auth') || key.includes('token') || key.includes('user')
        );
        authKeys.forEach(key => localStorage.removeItem(key));

        sessionStorage.clear();

        console.log('[auth-utils] Cleared client-side auth state (server manages cookies)');
    } catch (error) {
        console.error('[auth-utils] Error clearing auth state:', error);
    }
}


export function redirectToLogin(returnUrl?: string): void {
    const url = returnUrl || window.location.pathname;
    const loginUrl = `/login${url !== '/' && url !== '/login' ? `?returnUrl=${encodeURIComponent(url)}` : ''}`;

    // eslint-disable-next-line no-console
    console.log('[auth-utils] Redirecting to login:', loginUrl);

    window.location.href = loginUrl;
}


export function isAuthError(error: any): boolean {
    const status = error?.response?.status || error?.status;
    return status === 401 || status === 403;
}


const AUTH_FAILURE_KEY = 'auth_failure_count';
const AUTH_FAILURE_TIMESTAMP_KEY = 'auth_failure_timestamp';
const MAX_AUTH_FAILURES = 3;
const FAILURE_RESET_TIME = 60000; // 1 minute


export function recordAuthFailure(): boolean {
    try {
        const now = Date.now();
        const lastFailureTime = parseInt(sessionStorage.getItem(AUTH_FAILURE_TIMESTAMP_KEY) || '0');

        // Reset counter if enough time has passed
        if (now - lastFailureTime > FAILURE_RESET_TIME) {
            sessionStorage.setItem(AUTH_FAILURE_KEY, '1');
            sessionStorage.setItem(AUTH_FAILURE_TIMESTAMP_KEY, now.toString());
            return false;
        }

        // Increment failure count
        const failureCount = parseInt(sessionStorage.getItem(AUTH_FAILURE_KEY) || '0') + 1;
        sessionStorage.setItem(AUTH_FAILURE_KEY, failureCount.toString());
        sessionStorage.setItem(AUTH_FAILURE_TIMESTAMP_KEY, now.toString());

        // eslint-disable-next-line no-console
        console.log(`[auth-utils] Auth failure count: ${failureCount}/${MAX_AUTH_FAILURES}`);

        return failureCount >= MAX_AUTH_FAILURES;
    } catch (error) {
        console.error('[auth-utils] Error recording auth failure:', error);
        return false;
    }
}

/**
 * Reset authentication failure counter
 */
export function resetAuthFailures(): void {
    try {
        sessionStorage.removeItem(AUTH_FAILURE_KEY);
        sessionStorage.removeItem(AUTH_FAILURE_TIMESTAMP_KEY);
    } catch (error) {
        console.error('[auth-utils] Error resetting auth failures:', error);
    }
}

/**
 * Complete logout flow: clear state and redirect
 */
export function performLogout(): void {
    clearAuthState();
    resetAuthFailures();
    window.location.href = '/';
}
