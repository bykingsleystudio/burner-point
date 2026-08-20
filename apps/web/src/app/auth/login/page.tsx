'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import { AuthProviderButton } from '@/components/auth-provider-button';
import Button from '@/components/ui/button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { supabase } from '@/lib/supabase';
import { getErrorMessage, sanitizeRedirect } from '@/lib/auth';
import { getRememberMePreference, setRememberMePreference } from '@/lib/auth-persistence';
import { useManualAuthCompletion } from '@/lib/auth-session-sync';
import { authApi, setApiSession, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { TurnstileWidget } from '@/components/turnstile-widget';
import {
  INTERNATIONAL_PHONE_ERROR,
  classifyAuthIdentifier,
  isValidInternationalPhone,
  normalizeAuthIdentifier,
} from '@/lib/phone';

const productChips = ['Private access', 'Secure account'];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => sanitizeRedirect(searchParams.get('redirect')), [searchParams]);
  const completeAuth = useManualAuthCompletion();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => getRememberMePreference());
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingSession, setPendingSession] = useState<Session | null>(null);

  useEffect(() => {
    if (searchParams.get('mfa') !== '1') return;
    setRequiresTwoFactor(true);
    void supabase.auth.getSession().then(({ data }) => setPendingSession(data.session));
  }, [searchParams]);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const canSubmit = identifier.trim().length >= 3 && password.length >= 8 && (!turnstileSiteKey || !!turnstileToken);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error('Enter your email or phone number and password.');
      return;
    }

    const identifierType = classifyAuthIdentifier(identifier);
    const normalizedIdentifier = normalizeAuthIdentifier(identifier);

    if (identifierType === 'phone' && !isValidInternationalPhone(identifier)) {
      toast.error(INTERNATIONAL_PHONE_ERROR);
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      toast.error('Please complete the security check before signing in.');
      return;
    }

    setLoading(true);
    try {
      setRememberMePreference(rememberMe);
      if (turnstileSiteKey && turnstileToken) {
        await authApi.verifyTurnstile(turnstileToken);
      }

      let session = pendingSession;
      if (!session) {
        const { data, error } = await supabase.auth.signInWithPassword(
          identifierType === 'phone'
            ? { phone: normalizedIdentifier, password }
            : { email: normalizedIdentifier.toLowerCase(), password },
        );

        if (error || !data.session) throw error ?? new Error('Unable to sign in.');
        session = data.session;
      }

      // Use centralized auth sync instead of direct redirect
      await completeAuth(session, {
        redirectTo: redirectTo || '/dashboard',
        profileData: twoFactorCode.trim() ? { twoFactorCode: twoFactorCode.trim() } : undefined,
      });
      toast.success('Welcome back.');
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Something went wrong. Please sign in again.');
      if (/authenticator code is required/i.test(message)) {
        setRequiresTwoFactor(true);
        const { data } = await supabase.auth.getSession();
        setPendingSession(data.session);
        toast('Enter the code from your authenticator app to finish signing in.');
      } else if (/password|identifier|not found|invalid|incorrect|credentials/i.test(message)) {
        toast.error('Email/phone number or password is incorrect.');
      } else if (/captcha|challenge|browser/i.test(message)) {
        toast.error('Verification failed. Try again or switch browser.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo || '/dashboard')}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Something went wrong. Please sign in again.'));
    }
  };

  const signInWithPasskey = async () => {
    setLoading(true);
    try {
      const { data: options } = await authApi.passkeyAuthenticationOptions();
      const response = await startAuthentication({ optionsJSON: options });
      const { data: tokens } = await authApi.verifyPasskeyAuthentication(response as unknown as Record<string, unknown>);
      setApiSession(tokens.access_token, tokens.refresh_token);
      const { data: user } = await usersApi.me();
      setAuth(user, tokens.access_token, tokens.refresh_token);
      window.location.assign(redirectTo || '/dashboard');
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Passkey sign-in failed.');
      if (!/cancel/i.test(message)) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordlessCode = async () => {
    const normalizedIdentifier = normalizeAuthIdentifier(identifier);
    const identifierType = classifyAuthIdentifier(identifier);
    if (identifierType === 'phone' && !isValidInternationalPhone(identifier)) {
      toast.error(INTERNATIONAL_PHONE_ERROR);
      return;
    }
    if (!normalizedIdentifier) {
      toast.error('Enter your email address or phone number first.');
      return;
    }

    setLoading(true);
    try {
      if (turnstileSiteKey && turnstileToken) await authApi.verifyTurnstile(turnstileToken);
      if (identifierType === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({ phone: normalizedIdentifier });
        if (error) throw error;
        window.location.assign(`/auth/phone-verify?mode=supabase-login&phone=${encodeURIComponent(normalizedIdentifier)}&redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedIdentifier.toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` },
      });
      if (error) throw error;
      toast.success('Check your email for a secure sign-in link.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to send a sign-in code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      title="Welcome back"
      description="Sign in to continue."
      chips={productChips}
      socialAuth={
        <AuthProviderButton
          provider="Google"
          onClick={startOAuth}
          disabled={loading}
        />
      }
      footerContent={
        <div className="flex flex-col gap-3">
          <p className="bp-auth-muted text-sm">
            Need an account?{' '}
            <Link href="/sign-up" className="bp-auth-inline-link font-semibold">
              Create one
            </Link>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <Link href="/terms-of-service" className="bp-auth-inline-link">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="bp-auth-inline-link">
              Privacy Policy
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="identifier" className="bp-auth-label">
            Email address or phone number
          </label>
          <GlassInputWrapper>
            <input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              type="text"
              autoComplete="username"
              placeholder="you@example.com or +14155550182"
              className="bp-auth-text-input"
            />
          </GlassInputWrapper>
          <p className="bp-auth-muted text-sm">
            Use the same email or full international number with country code that you used during sign-up.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="bp-auth-label">
            Password
          </label>
          <GlassInputWrapper>
            <div className="relative">
              <input
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="bp-auth-text-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="bp-auth-toggle absolute inset-y-0 right-3 flex items-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </GlassInputWrapper>
        </div>

        {requiresTwoFactor ? (
          <div className="space-y-2">
            <label htmlFor="twoFactorCode" className="bp-auth-label">
              Authenticator code
            </label>
            <GlassInputWrapper>
              <input
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="bp-auth-text-input font-mono tracking-[0.3em]"
              />
            </GlassInputWrapper>
          </div>
        ) : null}

        {turnstileSiteKey ? (
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onTokenChange={setTurnstileToken}
          />
        ) : null}

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="bp-auth-muted inline-flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => {
                const next = event.target.checked;
                setRememberMe(next);
                setRememberMePreference(next);
              }}
              className="bp-auth-checkbox h-4 w-4 rounded border-white/15 bg-transparent"
            />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="bp-auth-inline-link font-medium">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="brand"
          size="xl"
          loading={loading}
          disabled={!canSubmit}
          className="bp-button-glow h-12 w-full rounded-[1rem] px-5 text-sm uppercase tracking-[0.16em]"
        >
          {loading ? 'Signing in' : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Sign In
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={() => void signInWithPasskey()}
          disabled={loading}
          className="bp-auth-provider inline-flex min-h-12 w-full items-center justify-center rounded-[1rem] border border-white/10 px-5 text-sm font-semibold text-white/80 transition hover:border-brand-green/30 hover:text-brand-green disabled:opacity-50"
        >
          Sign in with passkey
        </button>
        <button
          type="button"
          onClick={() => void sendPasswordlessCode()}
          disabled={loading}
          className="bp-auth-provider inline-flex min-h-12 w-full items-center justify-center rounded-[1rem] border border-white/10 px-5 text-sm font-semibold text-white/80 transition hover:border-brand-green/30 hover:text-brand-green disabled:opacity-50"
        >
          Email me a sign-in link or send phone OTP
        </button>
      </form>
    </SignInPage>
  );
}
