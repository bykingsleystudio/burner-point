'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, storeTokens } from '../../lib/api';

export default function SignInPage() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('expired') === '1') setMessage('Your session expired. Please sign in again.'); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try { const tokens = await apiRequest<{ accessToken: string; refreshToken: string; userId: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier: form.get('identifier'), password: form.get('password') }) }); storeTokens(tokens); window.localStorage.setItem('bp_announcement_pending', 'true'); window.location.href = '/dashboard'; }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Sign-in failed. Please try again.'); setBusy(false); }
  }
  async function googleSignIn() { setBusy(true); setMessage(''); try { const result = await apiRequest<{ url: string }>('/auth/oauth/google', { method: 'POST' }); window.location.href = result.url; } catch (error) { setMessage(error instanceof Error ? error.message : 'Google sign-in is unavailable.'); setBusy(false); } }
  return <main className="auth-page"><div className="auth-brand"><Link href="/" className="brand"><span className="brand-mark">BP</span><span>Burner Point</span></Link></div><section className="auth-card"><p className="eyebrow">BURNER POINT</p><h1>Welcome back.</h1><form onSubmit={submit}><label>Email / phone<input name="identifier" type="text" required autoComplete="username" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" /></label><div className="form-row"><Link href="/forgot-password">Forgot password?</Link></div><button className="button button-accent" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign In'} <span>→</span></button></form><button className="google-button" onClick={googleSignIn} disabled={busy}>Continue with Google</button>{message && <p className="form-message">{message}</p>}<p className="auth-switch"><Link href="/sign-up">Create account</Link></p></section><footer className="auth-footer"><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link></footer></main>;
}
