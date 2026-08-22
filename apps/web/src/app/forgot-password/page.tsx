'use client';
import Link from 'next/link';
import { useState } from 'react';
import { apiRequest } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); const email = new FormData(event.currentTarget).get('email'); try { await apiRequest('/auth/password/reset', { method: 'POST', body: JSON.stringify({ email }) }); setMessage('If that account exists, a reset link has been sent.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to request a reset link.'); } finally { setBusy(false); } }
  return <main className="auth-page"><div className="auth-brand"><Link href="/" className="brand"><span className="brand-mark">BP</span><span>Burner Point</span></Link></div><section className="auth-card"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Reset your password.</h1><p className="auth-lead">Enter your email and we will send the next step.</p><form onSubmit={submit}><label>Email<input name="email" type="email" required autoComplete="email" /></label><button className="button button-accent" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'} <span>→</span></button></form>{message && <p className="form-message">{message}</p>}<p className="auth-switch"><Link href="/sign-in">Back to sign in</Link></p></section></main>;
}
