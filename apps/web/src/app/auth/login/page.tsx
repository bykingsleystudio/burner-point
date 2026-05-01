'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import { AuthProviderButton } from '@/components/auth-provider-button';
import { AppleIcon, GlassInputWrapper, GoogleIcon, MicrosoftIcon, SignInPage } from '@/components/ui/sign-in';
import {
  INTERNATIONAL_PHONE_ERROR,
  classifyAuthIdentifier,
  isValidInternationalPhone,
  normalizeAuthIdentifier,
  normalizeInternationalPhone,
} from '@/lib/phone';

const oauthProviders = [
  { label: 'Google', strategy: 'oauth_google' },
  { label: 'Apple', strategy: 'oauth_apple' },
  { label: 'Microsoft', strategy: 'oauth_microsoft' },
] as const;

type SecondFactorStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code';
type AuthMode = 'sign-in' | 'phone-request' | 'phone-code' | 'reset-request' | 'reset-code' | 'reset-password';
type ResetPasswordMethod = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, fetchStatus } = useSignIn();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy | null>(null);
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');
  const [phoneIdentifier, setPhoneIdentifier] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMethod, setResetMethod] = useState<ResetPasswordMethod>('email');

  useEffect(() => {
    if (searchParams.get('mode') === 'reset-request') {
      setAuthMode('reset-request');
    }
  }, [searchParams]);

  const authReady = Boolean(signIn);
  const isSubmitting = loading || fetchStatus === 'fetching' || !authReady;
  const canSubmit = identifier.trim().length >= 3 && password.length >= 8;

  const finishSignIn = async () => {
    if (!signIn) throw new Error('Auth not ready');
    const { error } = await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        router.push(decorateUrl('/dashboard'));
      },
    });
    if (error) throw error;
  };

  const prepareSecondFactor = async () => {
    if (!signIn) throw new Error('Auth not ready');
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
    toast.error('Something went wrong. Please sign in again.');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) {
      toast.error('Something went wrong. Please sign in again.');
      return;
    }
    if (!canSubmit) {
      toast.error('Enter your email or phone and password.');
      return;
    }

    const identifierType = classifyAuthIdentifier(identifier);
    const normalizedIdentifier = normalizeAuthIdentifier(identifier);

    if (identifierType === 'phone' && !isValidInternationalPhone(identifier)) {
      toast.error(INTERNATIONAL_PHONE_ERROR);
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn.password({
        identifier: normalizedIdentifier,
        password,
      });
      if (error) throw error;
      await completeOrContinueSignIn();
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'Something went wrong. Please sign in again.'));
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async (strategy: (typeof oauthProviders)[number]['strategy']) => {
    if (!signIn) {
      toast.error('Something went wrong. Please sign in again.');
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
      toast.error(getClerkErrorMessage(err, 'Something went wrong. Please sign in again.'));
    }
  };

  const returnToSignIn = () => {
    setAuthMode('sign-in');
    setSecondFactorStrategy(null);
    setSecondFactorCode('');
    setPhoneIdentifier('');
    setPhoneCode('');
    setResetIdentifier('');
    setResetCode('');
    setResetPassword('');
  };

  return (
    <SignInPage
      title="Sign in to Burner Point"
      description="Access your private dashboard"
    >
      <div className="space-y-4">
        {/* Social Login Buttons */}
        <div className="grid grid-cols-1 gap-3">
          {oauthProviders.map((provider) => (
            <AuthProviderButton
              key={provider.label}
              provider={provider.label}
              label={provider.label}
              onClick={() => startOAuth(provider.strategy)}
              disabled={isSubmitting}
              className="h-11 justify-center"
            />
          ))}
        </div>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-1 border-t border-white/10" />
          <span className="mx-3 text-xs text-gray-500">OR</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Email or phone
            </label>
            <GlassInputWrapper>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                type="text"
                autoComplete="username"
                placeholder="you@example.com or +14155550182"
                className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
              />
            </GlassInputWrapper>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Password
            </label>
            <GlassInputWrapper>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
              />
            </GlassInputWrapper>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-gray-400">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-[#00FF9D]"
              />
              Keep me signed in
            </label>
            <button
              type="button"
              onClick={() => setAuthMode('reset-request')}
              className="text-[#00FF9D] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <Zap size={16} />
            )}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Links */}
        <p className="text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-[#00FF9D] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </SignInPage>
  );
}

function getClerkErrorMessage(error: unknown, fallback: string) {
  const clerkError = error as { longMessage?: string; message?: string; errors?: Array<{ longMessage?: string; message?: string }> };
  const raw = clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.longMessage || clerkError.message || '';
  if (/captcha|challenge|browser/i.test(raw)) return 'Verification failed. Try again or switch browser.';
  if (/password|identifier|not found|invalid|incorrect/i.test(raw)) return 'Email/phone or password is incorrect.';
  return fallback;
}
