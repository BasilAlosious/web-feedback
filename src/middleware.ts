import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Check for auth cookie
    const authCookie = request.cookies.get('auth_token')
    const isAuthenticated = authCookie?.value === 'authenticated'

    // Define paths that do not require authentication
    // 1. /login
    // 2. /api/proxy (if we want it public, or maybe strict to auth? let's keep it public for now or only for internal tool?)
    //    Actually, if the user (agency) is using the app, they are logged in.
    //    If we share a link later, the public viewer might need proxy. So keep proxy public or token-gated later.
    // 3. /share/* (future public share routes)
    // 4. /_next/* (static files, important!)
    // 5. /favicon.ico, etc.

    const isPublicPath =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/api/proxy') || // Allow proxy for now, might need securing later
        request.nextUrl.pathname.startsWith('/share') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname === '/favicon.ico'

    if (!isAuthenticated && !isPublicPath) {
        // Redirect to login if not authenticated and trying to access protected route
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthenticated && request.nextUrl.pathname === '/login') {
        // Redirect to dashboard if already logged in and trying to access login
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
