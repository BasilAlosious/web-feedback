import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Check for session cookie (new auth system)
    const sessionCookie = request.cookies.get('session')
    const isAuthenticated = !!sessionCookie?.value

    // Define paths that do not require authentication
    const isPublicPath =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/api/proxy') ||
        request.nextUrl.pathname.startsWith('/share') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname === '/favicon.ico'

    if (!isAuthenticated && !isPublicPath) {
        // Redirect to login if not authenticated and trying to access protected route
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to dashboard if already logged in and trying to access auth pages
    if (isAuthenticated && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
