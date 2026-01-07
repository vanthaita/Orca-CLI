import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ORCA_API_BASE_URL, NEXT_PUBLIC_PREFIX_API } from '@/config/env';

const isDev = process.env.NODE_ENV === 'development';
const log = (...args: unknown[]) => isDev && console.log('[Middleware]', ...args);

async function verifyAuthFromCookies(request: NextRequest): Promise<boolean> {
    try {
        const accessToken: string | undefined = request.cookies.get('access_token')?.value;
        const refreshToken: string | undefined = request.cookies.get('refresh_token')?.value;

        const allCookies = request.cookies.getAll();
        log('[Middleware] All cookies:', allCookies.map(c => ({ name: c.name, hasValue: Boolean(c.value) })));

        const hasTokens: boolean = Boolean(accessToken || refreshToken);

        if (!hasTokens) {
            log('[Middleware] No authentication tokens found in cookies');
            return false;
        }

        log('[Middleware] Authentication tokens found in cookies', {
            hasAccessToken: Boolean(accessToken),
            hasRefreshToken: Boolean(refreshToken)
        });
        return true;

    } catch (error) {
        log('[Middleware] Cookie verification failed:', error);
        return false;
    }
}

async function verifyAuthFromAPI(request: NextRequest): Promise<boolean> {
    try {
        const verifyUrl = `${ORCA_API_BASE_URL}/${NEXT_PUBLIC_PREFIX_API}/auth/me`;

        log('[Middleware] Attempting API verification:', verifyUrl);

        const cookieHeader = request.headers.get('cookie') || '';

        const response = await fetch(verifyUrl, {
            method: 'GET',
            headers: {
                'Cookie': cookieHeader,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            log('[Middleware] API verification failed with status:', response.status);
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

    const hasTokens = await verifyAuthFromCookies(request);
    const shouldVerifyAuth = hasTokens;

    const isAuthenticated = shouldVerifyAuth
        ? await verifyAuthFromAPI(request)
        : false;

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