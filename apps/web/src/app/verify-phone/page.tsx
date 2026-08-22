'use client';
import Link from 'next/link';
import { useState } from 'react';
import { apiRequest } from '../../lib/api';

export default function VerifyPhonePage() {
  const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [sent, setSent] = useState(false); const [message, setMessage] = useState('');
  async function sendOtp() { try { await apiRequest('/phone-auth/send', { method: 'POST', body: JSON.stringify({ phoneNumber: phone, channel: 'sms' }) }); setSent(true); setMessage('Verification code sent.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to send a code.'); } }
  async function verify(event: React.FormEvent) { event.preventDefault(); try { await apiRequest('/phone-auth/verify', { method: 'POST', body: JSON.stringify({ phoneNumber: phone, code: otp }) }); setMessage('Phone verified successfully.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'That code could not be verified.'); } }
  return <main className="auth-page"><div className="auth-brand"><Link href="/" className="brand"><span className="brand-mark">BP</span><span>Burner Point</span></Link></div><section className="auth-card"><p className="eyebrow">SECURITY CHECK</p><h1>Verify your phone.</h1><p className="auth-lead">Use an active number to protect your Burner Point account.</p><label>Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" required /></label><button className="button button-accent" onClick={sendOtp} disabled={!phone}>Send code <span>→</span></button>{sent && <form onSubmit={verify}><label>Verification code<input value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" required minLength={6} /></label><button className="button button-dark">Verify phone <span>→</span></button></form>}{message && <p className="form-message">{message}</p>}<p className="auth-switch"><Link href="/dashboard">Skip for now</Link></p></section></main>;
}
