import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that are completely public (static assets, api auth, sw, manifest, login)
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/seed') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') || // static files (.svg, .png, .ico, .json, .js)
    pathname === '/sw.js' ||
    pathname === '/manifest.json' ||
    pathname === '/icon.svg';

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for JWT token cookie
  const token = request.cookies.get('token')?.value;

  // If no token, instantly redirect to /login before rendering anything
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
