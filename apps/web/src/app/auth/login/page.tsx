'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useRef, useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { ArrowRight, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { AuthProviderButton } from '@/components/auth-provider-button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';

const AUTH_HERO_IMAGE =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80';

const oauthProviders = [
  { label: 'Google', strategy: 'oauth_google' },
  { label: 'Apple', strategy: 'oauth_apple' },
  { label: 'Microsoft', strategy: 'oauth_microsoft' },
] as const;

type SecondFactorStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code';
type AuthMode = 'sign-in' | 'reset-request' | 'reset-code' | 'reset-password';
type ResetPasswordMethod = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const identifierRef = useRef<HTMLInputElement>(null);
  const { signIn, fetchStatus } = useSignIn();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy | null>(null);
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMethod, setResetMethod] = useState<ResetPasswordMethod>('email');

  const authReady = Boolean(signIn);
  const isSubmitting = loading || fetchStatus === 'fetching' || !authReady;
  const canSubmit = identifier.trim().length >= 3 && password.length >= 8;

  const description = useMemo(() => {
    if (authMode === 'reset-request') {
      return 'Use your Burner Point email or phone to request a secure password reset code.';
    }
    if (authMode === 'reset-code') {
      return 'Enter the reset code you received to confirm the account recovery request.';
    }
    if (authMode === 'reset-password') {
      return 'Set a new password, then return directly to the Burner Point dashboard.';
    }
    if (secondFactorStrategy) {
      return 'Two-factor authentication is enabled on this Burner Point account. Enter the security code to continue.';
    }
    return 'Stay Anonymous. Stay Connected. Private By Design.';
  }, [authMode, secondFactorStrategy]);

  const finishSignIn = async () => {
    if (!signIn) throw new Error('Authentication is still loading.');

    const { error } = await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        router.push(decorateUrl('/dashboard'));
      },
    });

    if (error) throw error;
  };

  const prepareSecondFactor = async () => {
    if (!signIn) throw new Error('Authentication is still loading.');

    const factor = signIn.supportedSecondFactors?.[0] as { strategy?: SecondFactorStrategy } | undefined;
    const strategy = factor?.strategy ?? 'totp';

    if (strategy === 'email_code') {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) throw error;
    }

    if (strategy === 'phone_code') {
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) throw error;
    }

    setSecondFactorStrategy(strategy);
    toast.success('Enter your security code to continue.');
  };

  const completeOrContinueSignIn = async () => {
    if (!signIn) return;

    if (signIn.status === 'complete') {
      await finishSignIn();
      toast.success('Welcome back.');
      return;
    }

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      await prepareSecondFactor();
      return;
    }

    toast.error('Another verification step is required before sign-in can continue.');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) {
      toast.error('Authentication is still loading.');
      return;
    }

    if (!canSubmit) {
      toast.error('Enter your account email or phone and a valid password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn.password({
        identifier: identifier.trim(),
        password,
      });

      if (error) throw error;
      await completeOrContinueSignIn();
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const startPasswordReset = async () => {
    if (!signIn) {
      toast.error('Authentication is still loading.');
      return;
    }

    const value = resetIdentifier.trim();
    if (value.length < 3) {
      toast.error('Enter your account email address or phone number.');
      return;
    }

    const method: ResetPasswordMethod = value.includes('@') ? 'email' : 'phone';
    setLoading(true);
    try {
      const { error: createError } = await signIn.create({ identifier: value });
      if (createError) throw createError;

      const { error: sendError } =
        method === 'email'
          ? await signIn.resetPasswordEmailCode.sendCode()
          : await signIn.resetPasswordPhoneCode.sendCode();

      if (sendError) throw sendError;

      setResetMethod(method);
      setAuthMode('reset-code');
      toast.success(`Check your ${method === 'email' ? 'email' : 'phone'} for the reset code.`);
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'Unable to send password reset code'));
    } finally {
      setLoading(false);
    }
  };

  const verifyPasswordResetCode = async () => {
    if (!signIn) {
      toast.error('Authentication is still loading.');
      return;
    }

    const code = resetCode.trim();
    if (!code) {
      toast.error('Enter the reset code you received.');
      return;
    }

    setLoading(true);
    try {
      const { error } =
        resetMethod === 'email'
          ? await signIn.resetPasswordEmailCode.verifyCode({ code })
          : await signIn.resetPasswordPhoneCode.verifyCode({ code });

      if (error) throw error;

      setAuthMode('reset-password');
      toast.success('Code verified. Set your new password.');
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'Password reset verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!signIn) {
      toast.error('Authentication is still loading.');
      return;
    }

    if (resetPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } =
        resetMethod === 'email'
          ? await signIn.resetPasswordEmailCode.submitPassword({ password: resetPassword, signOutOfOtherSessions: true })
          : await signIn.resetPasswordPhoneCode.submitPassword({ password: resetPassword, signOutOfOtherSessions: true });

      if (error) throw error;

      await finishSignIn();
      toast.success('Password reset. Welcome back.');
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'Unable to set new password'));
    } finally {
      setLoading(false);
    }
  };

  const verifySecondFactor = async () => {
    if (!signIn || !secondFactorStrategy || !secondFactorCode.trim()) {
      toast.error('Enter your verification code to continue.');
      return;
    }

    setLoading(true);
    try {
      const code = secondFactorCode.trim();
      const { error } =
        secondFactorStrategy === 'email_code'
          ? await signIn.mfa.verifyEmailCode({ code })
          : secondFactorStrategy === 'phone_code'
            ? await signIn.mfa.verifyPhoneCode({ code })
            : secondFactorStrategy === 'backup_code'
              ? await signIn.mfa.verifyBackupCode({ code })
              : await signIn.mfa.verifyTOTP({ code });

      if (error) throw error;
      await completeOrContinueSignIn();
    } catch (err) {
      toast.error(getClerkErrorMessage(err, '2FA verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async (strategy: (typeof oauthProviders)[number]['strategy']) => {
    if (!signIn) {
      toast.error('Authentication is still loading.');
      return;
    }

    try {
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
      });
      if (error) throw error;
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'OAuth sign-in failed'));
    }
  };

  const returnToSignIn = () => {
    setAuthMode('sign-in');
    setSecondFactorStrategy(null);
    setSecondFactorCode('');
    setResetIdentifier('');
    setResetCode('');
    setResetPassword('');
  };

  return (
    <SignInPage
      title="Log in or sign up"
      description={description}
      heroImageSrc={AUTH_HERO_IMAGE}
      testimonials={[]}
      onResetPassword={() => setAuthMode('reset-request')}
      onCreateAccount={() => router.push('/auth/register')}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-white/8 bg-white/[0.03] p-1">
            <span className="rounded-full bg-brand-green px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
              Sign in
            </span>
            <Link href="/auth/register" className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46 transition hover:text-white">
              Create account
            </Link>
          </div>
          <div className="text-xs text-white/38">By continuing you accept the Terms of Service and Privacy Policy.</div>
        </div>

        {!secondFactorStrategy && authMode === 'sign-in' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {oauthProviders.map((provider) => (
                <AuthProviderButton
                  key={provider.label}
                  provider={provider.label}
                  label={`Continue with ${provider.label}`}
                  onClick={() => startOAuth(provider.strategy)}
                  disabled={isSubmitting}
                />
              ))}
              <AuthProviderButton
                provider="Phone"
                label="Continue with Phone"
                onClick={() => identifierRef.current?.focus()}
                disabled={isSubmitting}
              />
            </div>

            <div className="relative flex items-center justify-center">
              <span className="w-full border-t border-white/10" />
              <span className="absolute bg-[#04120C] px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/34">
                OR
              </span>
            </div>
          </>
        ) : null}

        {authMode === 'reset-request' ? (
          <div className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <label className="block text-sm font-medium text-white/70">
              Email or phone number
              <GlassInputWrapper>
                <input
                  value={resetIdentifier}
                  onChange={(event) => setResetIdentifier(event.target.value)}
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com or +14155550182"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={startPasswordReset}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Sending code...' : 'Send reset code'}
            </button>
          </div>
        ) : authMode === 'reset-code' ? (
          <div className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <label className="block text-sm font-medium text-white/70">
              Reset code
              <GlassInputWrapper>
                <input
                  value={resetCode}
                  onChange={(event) => setResetCode(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter reset code"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={verifyPasswordResetCode}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying...' : 'Verify reset code'}
            </button>
          </div>
        ) : authMode === 'reset-password' ? (
          <div className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <label className="block text-sm font-medium text-white/70">
              New password
              <GlassInputWrapper>
                <input
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitNewPassword}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving password...' : 'Reset password'}
            </button>
          </div>
        ) : secondFactorStrategy ? (
          <div className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <label className="block text-sm font-medium text-white/70">
              Security code
              <GlassInputWrapper>
                <input
                  value={secondFactorCode}
                  onChange={(event) => setSecondFactorCode(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter verification code"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={verifySecondFactor}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying...' : 'Verify 2FA'}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-white/70">
              Email address or phone number
              <GlassInputWrapper>
                <input
                  ref={identifierRef}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com or +14155550182"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>

            <label className="block text-sm font-medium text-white/70">
              Password
              <GlassInputWrapper>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <button type="button" onClick={() => setAuthMode('reset-request')} className="font-medium text-brand-green transition hover:text-[#1cffac]">
                Forgot password?
              </button>
              <div className="inline-flex items-center gap-2 text-white/34">
                <ShieldCheck className="h-4 w-4 text-brand-green" />
                Clerk-backed 2FA available in profile settings
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <Zap size={16} />
              )}
              {isSubmitting ? 'Signing in...' : 'Continue'}
            </button>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
          <button type="button" onClick={returnToSignIn} className="inline-flex items-center gap-2 text-sm text-white/46 transition hover:text-white">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back
          </button>
          <div className="flex items-center gap-2 text-sm text-white/46">
            <Smartphone className="h-4 w-4 text-brand-green" />
            Need an account?
            <Link href="/auth/register" className="font-medium text-brand-green transition hover:text-[#1cffac]">
              Create one
            </Link>
          </div>
        </div>

        <p className="text-xs leading-6 text-white/38">
          By continuing you agree to the Burner Point{' '}
          <Link href="/terms" className="text-brand-green transition hover:text-[#1cffac]">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-brand-green transition hover:text-[#1cffac]">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </SignInPage>
  );
}

function getClerkErrorMessage(error: unknown, fallback: string) {
  const clerkError = error as { longMessage?: string; message?: string; errors?: Array<{ longMessage?: string; message?: string }> };
  return clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.longMessage || clerkError.message || fallback;
}
