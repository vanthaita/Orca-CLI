import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ORCA_API_BASE_URL, NEXT_PUBLIC_PREFIX_API } from '@/config/env';

const isDev = process.env.NODE_ENV === 'development';
const log = (...args: unknown[]) => isDev && console.log('[Middleware]', ...args);

async function verifyAuthFromAPI(request: NextRequest): Promise<boolean> {
    try {
        const verifyUrl = `${ORCA_API_BASE_URL}/${NEXT_PUBLIC_PREFIX_API}/auth/me`;

        log('[Middleware] Attempting API verification:', verifyUrl);

        // Extract cookies from the incoming request
        const cookieHeader = request.headers.get('cookie') || '';

        log('[Middleware] Cookie header:', cookieHeader);

        const response = await fetch(verifyUrl, {
            method: 'GET',
            headers: {
                // Manually forward the cookie header from the client request
                ...(cookieHeader && { 'Cookie': cookieHeader }),
            },
            // Note: credentials: 'include' doesn't work in Next.js middleware for cross-origin
            // so we manually forward the cookie header instead
        });

        if (!response.ok) {
            const errorText = await response.text();
            log('[Middleware] API verification failed with status:', response.status, errorText);
            return false;
        }

        log('[Middleware] API verification result:', {
            authenticated: true
        });

        return true;
    } catch (error) {
        log('[Middleware] API verification error:', error instanceof Error ? error.message : 'Unknown error');
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    log('[Middleware] Running for pathname:', pathname);

    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    const protectedPrefixes = ['/dashboard'];

    const guestOnlyRoutes = ['/login'];

    const hasTokens = await verifyAuthFromAPI(request);
    const shouldVerifyAuth = hasTokens;

    const isAuthenticated = shouldVerifyAuth;

    const requiresAuth = protectedPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    if (requiresAuth && !isAuthenticated) {
        log('[Middleware] Access denied - redirecting to login');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (guestOnlyRoutes.includes(pathname) && isAuthenticated) {
        log('[Middleware] Authenticated user accessing guest route - redirecting');
        const returnUrl = searchParams.get('returnUrl');
        const redirectTo = returnUrl && protectedPrefixes.some(prefix =>
            returnUrl === prefix || returnUrl.startsWith(prefix + '/')
        )
            ? returnUrl
            : (pathname === '/' ? '/dashboard/calendar' : '/dashboard');

        return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    log('[Middleware] Access granted for:', pathname);
    return NextResponse.next();
}


export const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
        '/login',
    ],
};