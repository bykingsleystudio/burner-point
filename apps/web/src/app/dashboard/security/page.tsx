'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ShieldCheck, Smartphone, KeyRound, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { startRegistration } from '@simplewebauthn/browser';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function SecurityPage() {
  const { user } = useAuthStore();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [setup, setSetup] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(true);
  const [savingTwoFactor, setSavingTwoFactor] = useState(false);
  const [sessions, setSessions] = useState<Array<{ id: string; deviceName?: string; userAgent?: string; ipAddress?: string; active: boolean; lastUsedAt?: string; createdAt?: string }>>([]);
  const [passkeys, setPasskeys] = useState<Array<{ id: string; name?: string; deviceType?: string; backedUp: boolean; lastUsedAt?: string; createdAt?: string }>>([]);
  const [passkeyName, setPasskeyName] = useState('This device');
  const [loadingPasskey, setLoadingPasskey] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [reauthCode, setReauthCode] = useState('');
  const [reauthSent, setReauthSent] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    Promise.allSettled([authApi.twoFactorStatus(), authApi.sessions(), authApi.passkeys()]).then(([twoFactor, sessionResult, passkeyResult]) => {
      if (twoFactor.status === 'fulfilled') setTwoFactorEnabled(twoFactor.value.data.enabled);
      if (sessionResult.status === 'fulfilled' && Array.isArray(sessionResult.value.data)) setSessions(sessionResult.value.data);
      if (passkeyResult.status === 'fulfilled' && Array.isArray(passkeyResult.value.data)) setPasskeys(passkeyResult.value.data);
      if (twoFactor.status === 'rejected') toast.error('Unable to load authenticator security status.');
    }).finally(() => setLoadingTwoFactor(false));
  }, []);

  const registerPasskey = async () => {
    setLoadingPasskey(true);
    try {
      const { data: options } = await authApi.passkeyRegistrationOptions();
      const response = await startRegistration({ optionsJSON: options });
      await authApi.verifyPasskeyRegistration(response as unknown as Record<string, unknown>, passkeyName.trim() || 'Passkey');
      const { data } = await authApi.passkeys();
      setPasskeys(data);
      toast.success('Passkey registered.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (message !== 'Registration cancelled') toast.error(message || 'Unable to register this passkey.');
    } finally {
      setLoadingPasskey(false);
    }
  };

  const removePasskey = async (id: string) => {
    try {
      await authApi.removePasskey(id);
      setPasskeys((current) => current.filter((passkey) => passkey.id !== id));
      toast.success('Passkey removed.');
    } catch {
      toast.error('Unable to remove this passkey.');
    }
  };

  const revokeSession = async (id: string) => {
    try {
      await authApi.revokeSession(id);
      setSessions((current) => current.map((session) => session.id === id ? { ...session, active: false } : session));
      toast.success('Session revoked.');
    } catch {
      toast.error('Unable to revoke this session.');
    }
  };

  const requestReauthentication = async () => {
    try {
      const { error } = await supabase.auth.reauthenticate();
      if (error) throw error;
      setReauthSent(true);
      toast.success('A reauthentication code was sent to your current email.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to start reauthentication.');
    }
  };

  const verifyReauthentication = async () => {
    if (!user?.email || !/^\d{6}$/.test(reauthCode.trim())) {
      toast.error('Enter the six-digit reauthentication code.');
      return false;
    }

    const { error } = await supabase.auth.verifyOtp({
      email: user.email,
      token: reauthCode.trim(),
      type: 'reauthentication',
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    setReauthSent(false);
    setReauthCode('');
    return true;
  };

  const changeEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newEmail.trim() || newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('Enter a different email address.');
      return;
    }

    setSavingEmail(true);
    try {
      if (!(await verifyReauthentication())) return;
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
      if (error) throw error;
      setNewEmail('');
      toast.success('Check both email addresses to confirm the change.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to request the email change.');
    } finally {
      setSavingEmail(false);
    }
  };

  const inviteUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviting(true);
    try {
      await authApi.inviteUser(inviteEmail.trim().toLowerCase(), `${window.location.origin}/auth/callback?redirect=/onboarding`);
      setInviteEmail('');
      toast.success('Invitation sent through Supabase.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const beginTwoFactorSetup = async () => {
    setSavingTwoFactor(true);
    try {
      const { data } = await authApi.setupTwoFactor();
      setSetup({ qrCodeDataUrl: data.qrCodeDataUrl, secret: data.secret });
      toast('Scan the QR code with your authenticator app, then enter the code.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to start authenticator setup.');
    } finally {
      setSavingTwoFactor(false);
    }
  };

  const confirmTwoFactor = async () => {
    if (twoFactorCode.trim().length < 6) {
      toast.error('Enter the six-digit authenticator code.');
      return;
    }

    setSavingTwoFactor(true);
    try {
      await authApi.enableTwoFactor(twoFactorCode.trim());
      setTwoFactorEnabled(true);
      setSetup(null);
      setTwoFactorCode('');
      toast.success('Authenticator 2FA enabled.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'That authenticator code was not accepted.');
    } finally {
      setSavingTwoFactor(false);
    }
  };

  const disableTwoFactor = async () => {
    if (twoFactorCode.trim().length < 6) {
      toast.error('Enter your current authenticator code to disable 2FA.');
      return;
    }

    setSavingTwoFactor(true);
    try {
      await authApi.disableTwoFactor(twoFactorCode.trim());
      setTwoFactorEnabled(false);
      setTwoFactorCode('');
      toast.success('Authenticator 2FA disabled.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'That authenticator code was not accepted.');
    } finally {
      setSavingTwoFactor(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Account security</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white">Security and recovery</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
              Review your verified channels, reset your password, and finish phone verification before you use messaging, rentals, and verification workflows.
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand-green" />
            <h2 className="text-lg font-semibold text-white">Email</h2>
          </div>
          <p className="mt-4 text-sm text-white/72">{user?.email || 'No email connected'}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Email remains your primary sign-in and password recovery channel for Burner Point.
          </p>
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-brand-green" />
            <h2 className="text-lg font-semibold text-white">Phone verification</h2>
          </div>
          <p className="mt-4 text-sm text-white/72">{user?.phoneNumber || 'No phone number saved yet'}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            {user?.phoneVerified
              ? 'Your account phone number is verified and ready for OTP-protected workflows.'
              : 'Verify your phone number to unlock recovery and product flows that require OTP confirmation.'}
          </p>
          {!user?.phoneVerified ? (
            <Link
              href="/verify-phone?redirect=/dashboard/security"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-bp-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
            >
              Verify phone
            </Link>
          ) : null}
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-brand-green" />
            <h2 className="text-lg font-semibold text-white">Password and recovery</h2>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/50">
            Password updates and recovery links are managed through the Supabase-backed auth flow. Use the recovery screen if you need to reset access.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center justify-center rounded-bp-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
            >
              Reset password
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-11 items-center justify-center rounded-bp-md border border-white/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/72 transition hover:border-brand-green/20 hover:text-brand-green"
            >
              Back to settings
            </Link>
          </div>
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand-green" />
            <div>
              <h2 className="text-lg font-semibold text-white">Email and reauthentication</h2>
              <p className="mt-1 text-sm text-white/50">Sensitive account changes use Supabase reauthentication first.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-white/40">Current email</p>
              <p className="mt-2 break-all text-sm text-white">{user?.email || 'No email connected'}</p>
              <button type="button" onClick={() => void requestReauthentication()} className="mt-4 min-h-11 rounded-md border border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Send reauth code</button>
            </div>
            <form onSubmit={changeEmail} className="rounded-md border border-white/10 p-4">
              <label htmlFor="newEmail" className="text-xs uppercase tracking-[0.12em] text-white/40">New email address</label>
              <input id="newEmail" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className="bp-input mt-2" placeholder="new@example.com" required />
              {reauthSent ? (
                <input value={reauthCode} onChange={(event) => setReauthCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="bp-input mt-3" placeholder="Reauthentication code" required />
              ) : null}
              <button type="submit" disabled={savingEmail || !reauthSent} className="mt-3 min-h-11 rounded-md bg-brand-green px-3 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-50">Change email</button>
            </form>
          </div>
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
            <div>
              <h2 className="text-lg font-semibold text-white">Authenticator app</h2>
              <p className="mt-1 text-sm text-white/50">
                {loadingTwoFactor ? 'Checking status...' : twoFactorEnabled ? 'Enabled for API and web sign-in.' : 'Add a time-based one-time password to sign-in.'}
              </p>
            </div>
          </div>

          {!twoFactorEnabled && !setup ? (
            <button
              type="button"
              onClick={() => void beginTwoFactorSetup()}
              disabled={savingTwoFactor || loadingTwoFactor}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-bp-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
            >
              Set up authenticator
            </button>
          ) : null}

          {setup ? (
            <div className="mt-4 grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
              <Image src={setup.qrCodeDataUrl} alt="Authenticator setup QR code" width={176} height={176} unoptimized className="h-44 w-44 rounded-lg bg-white p-2" />
              <div>
                <p className="text-sm leading-6 text-white/60">Scan this code in your authenticator app. If scanning is unavailable, use the manual key below.</p>
                <p className="mt-3 break-all rounded-md border border-white/10 bg-black/20 p-3 font-mono text-xs text-white/80">{setup.secret}</p>
                <input
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter six-digit code"
                  className="bp-input mt-3"
                />
                <button
                  type="button"
                  onClick={() => void confirmTwoFactor()}
                  disabled={savingTwoFactor}
                  className="mt-3 inline-flex min-h-11 items-center justify-center rounded-bp-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black disabled:opacity-50"
                >
                  Confirm setup
                </button>
              </div>
            </div>
          ) : null}

          {twoFactorEnabled ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block max-w-xs text-sm text-white/60">
                Current authenticator code
                <input
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="bp-input mt-2"
                />
              </label>
              <button
                type="button"
                onClick={() => void disableTwoFactor()}
                disabled={savingTwoFactor}
                className="inline-flex min-h-11 items-center justify-center rounded-bp-md border border-red-300/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-red-200 disabled:opacity-50"
              >
                Disable 2FA
              </button>
            </div>
          ) : null}
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-brand-green" />
            <div>
              <h2 className="text-lg font-semibold text-white">Passkeys</h2>
              <p className="mt-1 text-sm text-white/50">Use a device biometrics or security key for faster sign-in.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block max-w-xs text-sm text-white/60">
              Passkey name
              <input value={passkeyName} onChange={(event) => setPasskeyName(event.target.value)} maxLength={80} className="bp-input mt-2" />
            </label>
            <button type="button" onClick={() => void registerPasskey()} disabled={loadingPasskey} className="inline-flex min-h-11 items-center justify-center rounded-bp-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black disabled:opacity-50">
              {loadingPasskey ? 'Registering...' : 'Add passkey'}
            </button>
          </div>
          {passkeys.length ? (
            <div className="mt-4 space-y-2">
              {passkeys.map((passkey) => (
                <div key={passkey.id} className="flex flex-col gap-3 rounded-md border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{passkey.name || 'Passkey'}</p>
                    <p className="mt-1 text-xs text-white/50">{passkey.deviceType || 'Platform credential'}{passkey.backedUp ? ' • backed up' : ''}</p>
                  </div>
                  <button type="button" onClick={() => void removePasskey(passkey.id)} className="min-h-10 rounded-md border border-red-300/30 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-200">Remove</button>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Signed-in sessions</h2>
              <p className="mt-1 text-sm text-white/50">Revoke sessions you no longer recognize.</p>
            </div>
            <button type="button" onClick={() => void authApi.revokeAllSessions().then(() => setSessions((current) => current.map((session) => ({ ...session, active: false }))))} className="min-h-10 rounded-md border border-red-300/30 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-200">Revoke all</button>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-col gap-3 rounded-md border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{session.deviceName || 'Web session'}</p>
                  <p className="mt-1 text-xs text-white/50">{session.userAgent || 'Unknown browser'}{session.ipAddress ? ` • ${session.ipAddress}` : ''}</p>
                </div>
                {session.active ? <button type="button" onClick={() => void revokeSession(session.id)} className="min-h-10 rounded-md border border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Revoke</button> : <span className="text-xs uppercase tracking-[0.12em] text-white/35">Revoked</span>}
              </div>
            ))}
          </div>
        </article>

        {user?.role === 'admin' || user?.role === 'enterprise' ? (
          <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5 md:col-span-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-brand-green" />
              <div>
                <h2 className="text-lg font-semibold text-white">Invite a user</h2>
                <p className="mt-1 text-sm text-white/50">Send a Supabase invitation link that opens the shared onboarding flow.</p>
              </div>
            </div>
            <form onSubmit={inviteUser} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor="inviteEmail" className="block max-w-md flex-1 text-xs uppercase tracking-[0.12em] text-white/40">
                Email address
                <input id="inviteEmail" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="bp-input mt-2" placeholder="person@example.com" required />
              </label>
              <button type="submit" disabled={inviting} className="min-h-11 rounded-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-50">{inviting ? 'Sending...' : 'Send invitation'}</button>
            </form>
          </article>
        ) : null}
      </section>
    </div>
  );
}
