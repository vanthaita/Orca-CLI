import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
    const accessToken = req.cookies.get('accessToken')?.value;
    if (!accessToken) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/cli/:path*'],
};
