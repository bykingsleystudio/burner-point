'use client';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (password !== confirm) { setMessage('Passwords do not match.'); return; } if (!supabase) { setMessage('Password recovery is not configured.'); return; } setBusy(true); setMessage(''); const { error } = await supabase.auth.updateUser({ password }); if (error) setMessage(error.message); else { setMessage('Password updated. You can sign in now.'); await supabase.auth.signOut(); } setBusy(false); }
  return <main className="auth-page"><div className="auth-brand"><Link href="/" className="brand"><span className="brand-mark">BP</span><span>Burner Point</span></Link></div><section className="auth-card"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Choose a new password.</h1><p className="auth-lead">Use a password with at least eight characters.</p><form onSubmit={submit}><label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></label><label>Confirm password<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={8} required autoComplete="new-password" /></label><button className="button button-accent" disabled={busy}>{busy ? 'Updating...' : 'Update password'} <span>→</span></button></form>{message && <p className="form-message">{message}</p>}<p className="auth-switch"><Link href="/sign-in">Return to sign in</Link></p></section></main>;
}
