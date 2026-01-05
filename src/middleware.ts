import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET: Uint8Array | null = (() => {
  const jwtSecretValue = process.env.JWT_SECRET;

  if (jwtSecretValue) {
    return new TextEncoder().encode(jwtSecretValue);
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return new TextEncoder().encode('your-super-secret-jwt-key-change-in-production');
})();

// Routes that require authentication
const protectedRoutes = ['/admin', '/admin/dashboard', '/admin/contacts', '/admin/settings'];
const authRoutes = ['/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is an auth route first (login page)
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // Check if the route is protected (but NOT if it's an auth route)
  const isProtectedRoute = !isAuthRoute && protectedRoutes.some(route => pathname.startsWith(route));
  
  const token = request.cookies.get('auth-token')?.value;

  // Verify token if exists
  let isValidToken = false;
  if (token && JWT_SECRET) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValidToken = true;
    } catch {
      isValidToken = false;
    }
  }

  // Redirect to login if accessing protected route without valid token
  if (isProtectedRoute && !isValidToken) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth route with valid token
  if (isAuthRoute && isValidToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
