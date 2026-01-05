import { NextRequest, NextResponse } from 'next/server';

async function verifyAuthFromAPI(request: NextRequest): Promise<boolean> {
    const baseUrl =
        process.env.NEXT_PUBLIC_ORCA_API_BASE_URL?.trim() ||
        process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
        'http://localhost:8000';

    const verifyUrl = `${baseUrl.replace(/\/+$/, '')}/api/v1/auth/me`;
    const cookieHeader = request.headers.get('cookie') ?? '';

    try {
        const response = await fetch(verifyUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                cookie: cookieHeader,
            },
        });

        return response.ok;
    } catch {
        return false;
    }
}

export async function proxy(req: NextRequest) {
    const accessToken = req.cookies.get('accessToken')?.value;
    if (!accessToken) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        // Preserve search params
        return NextResponse.redirect(url);
    }

    const ok = await verifyAuthFromAPI(req);
    if (!ok) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        // Preserve search params
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/cli/:path*'],
};
