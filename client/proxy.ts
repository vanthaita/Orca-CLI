import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Enable logging in production for debugging
const log = (...args: unknown[]) => console.log('[Middleware]', ...args);

function hasAuthCookie(request: NextRequest): boolean {
    try {
        // Check if access_token cookie exists
        const cookieHeader = request.headers.get('cookie') || '';

        log('[Middleware] Cookie header:', cookieHeader);

        // Simple check: if access_token cookie exists, consider user authenticated
        // The actual validation will happen on the server side when API calls are made
        const hasAccessToken = cookieHeader.includes('access_token=');

        log('[Middleware] Has access token:', hasAccessToken);

        return hasAccessToken;
    } catch (error) {
        log('[Middleware] Cookie check error:', error instanceof Error ? error.message : 'Unknown error');
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

    const isAuthenticated = hasAuthCookie(request);

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