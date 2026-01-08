import axios from 'axios';
import { ORCA_API_BASE_URL, NEXT_PUBLIC_PREFIX_API } from '@/config/env';
import { clearAuthState, redirectToLogin, recordAuthFailure, resetAuthFailures } from './auth-utils';

export const apiClient = axios.create({
    baseURL: `${ORCA_API_BASE_URL}/${NEXT_PUBLIC_PREFIX_API}`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Global refresh state to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Queue for requests waiting for token refresh
let refreshSubscribers: Array<(error: any) => void> = [];

/**
 * Add request to queue while refresh is in progress
 */
function subscribeTokenRefresh(callback: (error: any) => void): void {
    refreshSubscribers.push(callback);
}

/**
 * Notify all queued requests about refresh completion
 */
function onRefreshComplete(error: any = null): void {
    refreshSubscribers.forEach(callback => callback(error));
    refreshSubscribers = [];
}

apiClient.interceptors.request.use(
    (config) => {
        const baseURL = config.baseURL ?? '';
        const url = config.url ?? '';
        const fullUrl = url.startsWith('http') ? url : `${String(baseURL).replace(/\/+$/, '')}/${String(url).replace(/^\/+/, '')}`;
        const method = (config.method ?? 'GET').toUpperCase();
        // eslint-disable-next-line no-console
        console.log('[apiClient]', method, fullUrl);
        return config;
    },
    (error) => {
        // eslint-disable-next-line no-console
        console.error('[apiClient] request error', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        // Reset auth failure counter on successful response
        resetAuthFailures();

        if (response.data && response.data.data !== undefined) {
            return response.data.data;
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const url = String(originalRequest?.url ?? '');
        const isRefreshCall = url.includes('/auth/refresh');
        const isLoginCall = url.includes('/auth/login');
        const isLogoutCall = url.includes('/auth/logout');

        // Don't intercept auth endpoints
        if (isRefreshCall || isLoginCall || isLogoutCall) {
            if (error.response?.data) {
                // eslint-disable-next-line no-console
                console.error('[apiClient] auth endpoint error', error.response.status, error.response.data);
                return Promise.reject(error.response.data);
            }
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized - try to refresh token
        if (status === 401 && originalRequest && !(originalRequest as any)._retry) {
            // Check if we've exceeded failure limit
            const failureLimitExceeded = recordAuthFailure();
            if (failureLimitExceeded) {
                // eslint-disable-next-line no-console
                console.error('[apiClient] Auth failure limit exceeded, forcing logout');
                clearAuthState();
                redirectToLogin();
                return Promise.reject({ message: 'Authentication failed. Please log in again.' });
            }

            // Mark request as retried to prevent infinite loops
            (originalRequest as any)._retry = true;

            // If already refreshing, queue this request
            if (isRefreshing && refreshPromise) {
                // eslint-disable-next-line no-console
                console.log('[apiClient] Refresh in progress, queuing request');
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((err: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            // Retry original request
                            resolve(apiClient(originalRequest));
                        }
                    });
                });
            }

            // Start refresh process
            isRefreshing = true;
            // eslint-disable-next-line no-console
            console.log('[apiClient] Starting token refresh');

            refreshPromise = apiClient.post('/auth/refresh', {})
                .then(() => {
                    // eslint-disable-next-line no-console
                    console.log('[apiClient] Token refresh successful');
                    isRefreshing = false;
                    refreshPromise = null;
                    onRefreshComplete(null);
                    resetAuthFailures();
                    return apiClient(originalRequest);
                })
                .catch((refreshErr) => {
                    // eslint-disable-next-line no-console
                    console.error('[apiClient] Token refresh failed', refreshErr?.response?.status, refreshErr?.response?.data);
                    isRefreshing = false;
                    refreshPromise = null;

                    // Notify queued requests of failure
                    onRefreshComplete(refreshErr);

                    // If refresh token is expired or invalid, clear auth state and redirect
                    const refreshStatus = refreshErr?.response?.status;
                    if (refreshStatus === 401 || refreshStatus === 403) {
                        // eslint-disable-next-line no-console
                        console.log('[apiClient] Refresh token expired, clearing auth state and redirecting to login');
                        clearAuthState();
                        redirectToLogin();
                    }

                    return Promise.reject(refreshErr?.response?.data || refreshErr);
                });

            return refreshPromise;
        }

        // Handle other errors
        if (error.response?.data) {
            // eslint-disable-next-line no-console
            console.error('[apiClient] response error', error.response.status, error.response.data);
            return Promise.reject(error.response.data);
        }

        // eslint-disable-next-line no-console
        console.error('[apiClient] response error', error);
        return Promise.reject(error);
    }
);
