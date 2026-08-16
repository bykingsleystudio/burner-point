import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get('redirect');

  // If there's a code, this is a password recovery or email confirmation flow
  // Exchange the code for a session and redirect
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(error.message)}`);
    }

    const nextPath =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/dashboard';

    const cleanUrl = new URL(`${origin}${nextPath}`);
    return NextResponse.redirect(cleanUrl.toString());
  }

  // If there's NO code, this is likely an OAuth redirect with a hash session (#access_token=...)
  // In this case, we need to return an HTML page that lets the browser consume the hash
  // via the client-side AuthSessionRouter component
  // 
  // We preserve the hash and redirect parameter by returning a page without a server redirect
  const nextPath =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard';

  // Return a page that preserves the hash and lets client-side code handle it
  return NextResponse.redirect(`${origin}${nextPath}${requestUrl.hash ? `#${requestUrl.hash.slice(1)}` : ''}`);
}

