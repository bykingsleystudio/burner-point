import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from './utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  const protectedRoutes = ['/dashboard', '/settings', '/profile', '/verify-phone', '/onboarding'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  const authRoutes = [
    '/login',
    '/register',
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/auth/update-password',
    '/update-password',
  ];
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
  const isCallbackRoute = pathname === '/auth/callback' || pathname.startsWith('/auth/callback/');

  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/sign-in', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session && !isCallbackRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isCallbackRoute) {
    return response;
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
