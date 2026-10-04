import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';

const PROTECTED_ROUTES = ['/dashboard', '/organizer', '/admin', '/superadmin'];
const AUTH_ROUTES = ['/auth/login', '/auth/register'];
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['super_admin', 'club_admin'],
  '/superadmin': ['super_admin'],
  '/organizer': ['club_admin', 'super_admin'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));

  const token = req.cookies.get('parinaam_session')?.value;
  const user = token ? await verifyToken(token) : null;

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user) {
    const dest = user.role === 'super_admin' ? '/superadmin' : user.role === 'club_admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Require login for protected routes
  if (isProtected && !user) {
    return NextResponse.redirect(new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, req.url));
  }

  // Role-based access
  if (user) {
    for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && !roles.includes(user.role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/organizer/:path*', '/admin/:path*', '/superadmin/:path*', '/auth/:path*'],
};
