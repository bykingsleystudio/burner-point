import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from './utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes (require authentication)
  const protectedRoutes = ['/dashboard', '/settings', '/profile', '/verify-phone', '/onboarding'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Auth routes (redirect authenticated users to dashboard)
  // Note: /auth/callback, /auth/verify, etc. should NOT redirect authenticated users
  // because they handle their own routing based on session state
  const authRoutes = ['/sign-in', '/sign-up', '/auth/login', '/auth/register', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // If user is not authenticated and trying to access protected route, redirect to sign-in
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/sign-in', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  // This prevents them from re-entering the auth flow
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
