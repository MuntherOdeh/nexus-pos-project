import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { isValidTenantSlug } from '@/lib/tenant-slug';

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

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function getTenantFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0].toLowerCase();

  const rootDomain = (process.env.TENANT_ROOT_DOMAIN || process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN || 'nexuspoint.com').toLowerCase();

  if (hostname === rootDomain || hostname === `www.${rootDomain}`) return null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.slice(0, -1 * (`.${rootDomain}`.length));
    if (isValidTenantSlug(subdomain)) return subdomain;
  }

  // Local dev convenience: pizza.localhost -> tenant "pizza"
  if (hostname.endsWith('.localhost')) {
    const subdomain = hostname.slice(0, -'.localhost'.length);
    if (isValidTenantSlug(subdomain)) return subdomain;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Multi-tenant routing: <tenant>.<rootDomain> -> /t/<tenant>/*
  const tenant = getTenantFromHost(request.headers.get('host'));
  const isFileRequest = pathname.includes('.');
  if (tenant && !isFileRequest && !pathname.startsWith('/t/') && !pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();

    if (pathname === '/welcome' || pathname.startsWith('/welcome/')) {
      url.pathname = `/t/${tenant}${pathname}`;
    } else if (pathname === '/pos' || pathname.startsWith('/pos/')) {
      url.pathname = `/t/${tenant}${pathname}`;
    } else {
      url.pathname = `/t/${tenant}/pos${pathname === '/' ? '' : pathname}`;
    }

    const rewritten = NextResponse.rewrite(url);
    applySecurityHeaders(rewritten);
    return rewritten;
  }
  
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
  applySecurityHeaders(response);

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
