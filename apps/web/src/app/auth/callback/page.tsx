'use client';
import { useEffect, useState } from 'react';
import { apiRequest, storeTokens } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Finishing secure sign in...');
  useEffect(() => { let mounted = true; async function finish() { if (!supabase) { setMessage('Authentication is not configured.'); return; } const { data, error } = await supabase.auth.getSession(); if (error || !data.session) { setMessage('This sign-in link has expired. Please try again.'); return; } try { const tokens = await apiRequest<{ accessToken: string; refreshToken: string; userId: string }>('/auth/supabase/exchange', { method: 'POST', body: JSON.stringify({ accessToken: data.session.access_token }) }); storeTokens(tokens); if (mounted) window.location.href = '/onboarding'; } catch (exchangeError) { if (mounted) setMessage(exchangeError instanceof Error ? exchangeError.message : 'Unable to complete sign in.'); } } finish(); return () => { mounted = false; }; }, []);
  return <main className="auth-page"><section className="auth-card callback-card"><span className="status-dot" /><p className="eyebrow">SECURE SIGN IN</p><h1>{message}</h1><p className="auth-lead">You can close this window if the redirect does not continue.</p></section></main>;
}
