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
import { Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';

const schema = z.object({
  identifier: z.string().min(3, 'Enter your email address or phone number'),
  password: z.string().min(8, 'Min 8 characters'),
});

type FormData = z.infer<typeof schema>;

const oauthProviders = [
  { label: 'Google', strategy: 'oauth_google' },
  { label: 'Apple iCloud', strategy: 'oauth_apple' },
  { label: 'Microsoft Outlook', strategy: 'oauth_microsoft' },
] as const;

type SecondFactorStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy | null>(null);
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const isSubmitting = loading || fetchStatus === 'fetching';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const finishSignIn = async () => {
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
    toast.success('Enter your Clerk 2FA code to continue.');
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

  const verifySecondFactor = async () => {
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
    <main className="relative min-h-screen overflow-hidden bg-brand-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.14),transparent_64%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-10">
        <form onSubmit={handleSubmit(onSubmit)} className="bp-card w-full rounded-[34px] p-5 md:p-7">
          <div className="rounded-[28px] border border-white/8 bg-black/24 p-5 md:p-6">
            <div className="mb-8 text-center">
              <Link href="/" className="mx-auto inline-flex items-center justify-center gap-3" aria-label="Burner Point home">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-green/25 bg-brand-green/10">
                  <Image src="/assets/logo-mark.svg" alt="" width={28} height={28} />
                </span>
                <span className="font-mono text-base font-semibold uppercase tracking-[0.22em]">Burner <span className="text-brand-green">Point</span></span>
              </Link>
              <div className="mx-auto mt-7 flex h-14 w-14 items-center justify-center rounded-[22px] border border-brand-green/25 bg-brand-green/10">
                <ShieldCheck className="h-7 w-7 text-brand-green" />
              </div>
              <h1 className="mt-5 text-3xl font-semibold uppercase">Welcome back</h1>
              <p className="mt-2 text-sm text-white/52">Sign in with Clerk using your email address or phone number.</p>
            </div>

            {secondFactorStrategy ? (
              <div className="space-y-4 rounded-[24px] border border-brand-green/20 bg-brand-green/[0.04] p-4">
                <label className="block text-sm font-medium text-white/70">
                  Clerk 2FA code
                  <input
                    value={secondFactorCode}
                    onChange={(event) => setSecondFactorCode(event.target.value)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter verification code"
                    className="auth-input mt-1.5"
                  />
                </label>
                <button type="button" disabled={isSubmitting} onClick={verifySecondFactor} className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Verifying...' : 'Verify 2FA'}
                </button>
              </div>
            ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-white/70">
                Email or phone number
                <input
                  {...register('identifier')}
                  type="text"
                  inputMode="text"
                  autoComplete="username"
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
                    placeholder="Password"
                    className="auth-input pr-12"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/44 transition hover:bg-white/5 hover:text-white">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p> : null}
              </label>

              <div className="text-right">
                <Link href="/contact" className="text-xs font-medium text-brand-green/90 underline-offset-2 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            )}

            {!secondFactorStrategy ? (
              <button type="submit" disabled={isSubmitting} className="bp-button-glow mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <Zap size={16} />}
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            ) : null}

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/8" />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">or continue with</span>
              <span className="h-px flex-1 bg-white/8" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {oauthProviders.map((provider) => (
                <button key={provider.label} type="button" onClick={() => startOAuth(provider.strategy)} className="flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-center text-xs font-semibold text-white/76 transition hover:border-brand-green/35 hover:text-brand-green">
                  {provider.label}
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-white/48">
              No account? <Link href="/auth/signup" className="text-brand-green hover:underline">Create one free</Link>
            </p>
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
