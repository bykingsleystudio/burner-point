'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { AuthProviderButton } from '@/components/auth-provider-button';

const schema = z.object({
  identifier: z.string().min(3, 'Enter your email address or phone number'),
  password: z.string().min(8, 'Min 8 characters'),
});

type FormData = z.infer<typeof schema>;

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
  const { signIn, fetchStatus } = useSignIn();
  const [showPw, setShowPw] = useState(false);
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const finishSignIn = async () => {
    if (!signIn) {
      throw new Error('Authentication is still loading.');
    }

    const { error } = await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          router.push('/onboarding');
          return;
        }

        const url = decorateUrl('/dashboard');
        if (url.startsWith('http')) {
          window.location.href = url;
          return;
        }
        router.push(url);
      },
    });

    if (error) {
      throw error;
    }
  };

  const prepareSecondFactor = async () => {
    if (!signIn) {
      throw new Error('Authentication is still loading.');
    }

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
    toast.success('Enter your two-factor code to continue.');
  };

  const completeOrContinueSignIn = async () => {
    if (signIn.status === 'complete') {
      await finishSignIn();
      toast.success('Welcome back.');
      return;
    }

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      await prepareSecondFactor();
      return;
    }

    toast.error('Additional verification is required before this session can continue.');
  };

  const onSubmit = async (data: FormData) => {
    if (!signIn) {
      toast.error('Authentication is still loading.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn.password({
        identifier: data.identifier,
        password: data.password,
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

    const identifier = resetIdentifier.trim();
    if (identifier.length < 3) {
      toast.error('Enter your account email address or phone number.');
      return;
    }

    const method: ResetPasswordMethod = identifier.includes('@') ? 'email' : 'phone';
    setLoading(true);
    try {
      const { error: createError } = await signIn.create({ identifier });
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
    if (!code) return;

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

  const returnToSignIn = () => {
    setAuthMode('sign-in');
    setSecondFactorStrategy(null);
    setSecondFactorCode('');
    setResetIdentifier('');
    setResetCode('');
    setResetPassword('');
  };

  const verifySecondFactor = async () => {
    if (!signIn) {
      toast.error('Authentication is still loading.');
      return;
    }

    if (!secondFactorStrategy || !secondFactorCode.trim()) return;
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

      if (error) {
        throw error;
      }

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

  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-brand-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.14),transparent_64%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[34rem] items-center px-3 py-3 sm:px-4 md:py-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bp-card w-full rounded-bp-lg p-3 sm:p-4 md:p-5 [&_input.auth-input]:min-h-10 [&_input.auth-input]:px-3 [&_input.auth-input]:py-2.5 md:[&_input.auth-input]:min-h-11 md:[&_input.auth-input]:px-3.5 md:[&_input.auth-input]:py-3"
        >
          <div className="rounded-bp-lg border border-white/8 bg-black/24 p-3.5 sm:p-4 md:p-5">
            <div className="mb-5 text-center">
              <Link href="/" className="mx-auto inline-flex items-center justify-center gap-3" aria-label="Burner Point home">
                <span className="flex h-10 w-10 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
                  <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} />
                </span>
                <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">Burner <span className="text-brand-green">Point</span></span>
              </Link>
              <h1 className="mt-4 text-[1.7rem] font-semibold uppercase leading-none sm:text-[1.85rem]">Welcome back</h1>
              <p className="mt-1.5 text-[13px] leading-5 text-white/52 sm:text-sm">Use your email address or phone number to access your Burner Point workspace.</p>
            </div>

            {authMode === 'reset-request' ? (
              <div className="space-y-3 rounded-bp-lg border border-brand-green/20 bg-brand-green/[0.04] p-3.5 md:p-4">
                <label className="block text-sm font-medium text-white/70">
                  Email or phone number
                  <input
                    value={resetIdentifier}
                    onChange={(event) => setResetIdentifier(event.target.value)}
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    enterKeyHint="next"
                    placeholder="you@example.com or +1 415 555 0182"
                    className="auth-input mt-1.5"
                  />
                </label>
                <button type="button" disabled={isSubmitting} onClick={startPasswordReset} className="bp-button-glow flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Sending code...' : 'Send reset code'}
                </button>
                <button type="button" onClick={returnToSignIn} className="w-full text-xs font-medium text-white/48 underline-offset-2 transition hover:text-brand-green hover:underline">
                  Back to sign in
                </button>
              </div>
            ) : authMode === 'reset-code' ? (
              <div className="space-y-3 rounded-bp-lg border border-brand-green/20 bg-brand-green/[0.04] p-3.5 md:p-4">
                <label className="block text-sm font-medium text-white/70">
                  Reset code
                  <input
                    value={resetCode}
                    onChange={(event) => setResetCode(event.target.value)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    enterKeyHint="done"
                    placeholder="Enter reset code"
                    className="auth-input mt-1.5"
                  />
                </label>
                <button type="button" disabled={isSubmitting} onClick={verifyPasswordResetCode} className="bp-button-glow flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Verifying...' : 'Verify reset code'}
                </button>
                <button type="button" onClick={returnToSignIn} className="w-full text-xs font-medium text-white/48 underline-offset-2 transition hover:text-brand-green hover:underline">
                  Back to sign in
                </button>
              </div>
            ) : authMode === 'reset-password' ? (
              <div className="space-y-3 rounded-bp-lg border border-brand-green/20 bg-brand-green/[0.04] p-3.5 md:p-4">
                <label className="block text-sm font-medium text-white/70">
                  New password
                  <input
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    enterKeyHint="done"
                    placeholder="Enter a new password"
                    className="auth-input mt-1.5"
                  />
                </label>
                <button type="button" disabled={isSubmitting} onClick={submitNewPassword} className="bp-button-glow flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Saving password...' : 'Reset password'}
                </button>
                <button type="button" onClick={returnToSignIn} className="w-full text-xs font-medium text-white/48 underline-offset-2 transition hover:text-brand-green hover:underline">
                  Back to sign in
                </button>
              </div>
            ) : secondFactorStrategy ? (
              <div className="space-y-3 rounded-bp-lg border border-brand-green/20 bg-brand-green/[0.04] p-3.5 md:p-4">
                <label className="block text-sm font-medium text-white/70">
                  Two-factor code
                  <input
                    value={secondFactorCode}
                    onChange={(event) => setSecondFactorCode(event.target.value)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    enterKeyHint="done"
                    placeholder="Enter verification code"
                    className="auth-input mt-1.5"
                  />
                </label>
                <button type="button" disabled={isSubmitting} onClick={verifySecondFactor} className="bp-button-glow flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Verifying...' : 'Verify 2FA'}
                </button>
              </div>
            ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/70">
                Email or phone number
                <input
                  {...register('identifier')}
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  enterKeyHint="next"
                  placeholder="you@example.com or +1 415 555 0182"
                  className="auth-input mt-1.5"
                />
                {errors.identifier ? <p className="mt-1.5 text-xs text-red-300">{errors.identifier.message}</p> : null}
              </label>

              <label className="block text-sm font-medium text-white/70">
                Password
                <div className="relative mt-1.5">
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    enterKeyHint="done"
                    placeholder="Password"
                    className="auth-input pr-12"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-bp-md text-white/44 transition hover:bg-white/5 hover:text-white">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p> : null}
              </label>

              <div className="text-right">
                <button type="button" onClick={() => setAuthMode('reset-request')} className="inline-flex min-h-10 items-center text-xs font-medium text-brand-green/90 underline-offset-2 hover:underline">
                  Forgot password?
                </button>
              </div>
            </div>
            )}

            {!secondFactorStrategy && authMode === 'sign-in' ? (
              <button type="submit" disabled={isSubmitting} className="bp-button-glow mt-3.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <Zap size={16} />}
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            ) : null}

            {authMode === 'sign-in' ? (
              <>
              <div className="my-3.5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/8" />
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">or continue with</span>
                <span className="h-px flex-1 bg-white/8" />
              </div>
                <div className="grid grid-cols-3 gap-2">
                  {oauthProviders.map((provider) => (
                    <AuthProviderButton key={provider.label} provider={provider.label} onClick={() => startOAuth(provider.strategy)} disabled={isSubmitting} className="md:h-full" />
                  ))}
                </div>

                <p className="mt-4 text-center text-sm text-white/48">
                  No account? <Link href="/auth/signup" className="text-brand-green hover:underline">Create one free</Link>
                </p>
              </>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  );
}

function getClerkErrorMessage(error: unknown, fallback: string) {
  const clerkError = error as { longMessage?: string; message?: string; errors?: Array<{ longMessage?: string; message?: string }> };
  return clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.longMessage || clerkError.message || fallback;
}
