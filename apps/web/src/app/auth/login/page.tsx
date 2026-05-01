'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import {
  INTERNATIONAL_PHONE_ERROR,
  classifyAuthIdentifier,
  isValidInternationalPhone,
  normalizeAuthIdentifier,
} from '@/lib/phone';

const oauthProviders = [
  { label: 'Google', strategy: 'oauth_google' },
  { label: 'Apple', strategy: 'oauth_apple' },
  { label: 'Microsoft', strategy: 'oauth_microsoft' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const completeOrContinueSignIn = async () => {
    if (!signIn) return;
    if (signIn.status === 'complete') {
      await finishSignIn();
      toast.success('Welcome back.');
      return;
    }
    toast.error('Something went wrong. Please sign in again.');
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    } catch (err: any) {
      const raw = err?.errors?.[0]?.message || err?.message || '';
      if (/captcha|challenge|browser/i.test(raw)) {
        toast.error('Verification failed. Try again or switch browser.');
      } else if (/password|identifier|not found|invalid|incorrect/i.test(raw)) {
        toast.error('Email/phone or password is incorrect.');
      } else {
        toast.error('Something went wrong. Please sign in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async (strategy: string) => {
    if (!signIn) {
      toast.error('Something went wrong. Please sign in again.');
      return;
    }
    try {
      const { error } = await signIn.sso({
        strategy: strategy as any,
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
      });
      if (error) throw error;
    } catch (err) {
      toast.error('Something went wrong. Please sign in again.');
    }
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
            <button
              key={provider.label}
              onClick={() => startOAuth(provider.strategy)}
              disabled={isSubmitting}
              className="group relative flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-4 text-sm font-medium text-white backdrop-blur-xl transition-all duration-300 hover:border-[#00FF9D]/30 hover:shadow-[0_0_20px_rgba(0,255,157,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {provider.label === 'Google' && (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.15 3.45v2.77h3.57c2.08-1.92 3.22-4.75 3.22-8.23z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.82 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.82 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.59 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {provider.label === 'Apple' && (
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 16.06 3.21 10.5 6.5 10.5c1.54 0 2.5.74 3.35.74.82 0 2.34-.93 3.93-.4.67.23 1.25.56 1.72 1.01-.03.02-1.02.6-1.02 1.78 0 1.41 1.23 2.81 1.82 2.81-.03.08-2.09.72-2.09 3.84 0 3.09 2.7 4.11 2.75 4.11-.03.08-.42 1.44-1.96 2.89zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-2.04 4.16-3.74 4.25z" />
                </svg>
              )}
              {provider.label === 'Microsoft' && (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
                  <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
                  <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
                  <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
                </svg>
              )}
              <span>Continue with {provider.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative flex items-center py-3">
          <div className="flex-1 border-t border-white/10" />
          <span className="mx-3 text-xs font-medium uppercase tracking-wider text-[#9FA6B2]">OR</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#9FA6B2]">
              Email or Phone
            </label>
            <GlassInputWrapper>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                type="text"
                autoComplete="username"
                placeholder="you@example.com or +14155550182"
                className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-[#9FA6B2] focus:outline-none"
              />
            </GlassInputWrapper>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#9FA6B2]">
              Password
            </label>
            <GlassInputWrapper>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-lg bg-transparent px-3 py-2.5 pr-10 text-sm text-white placeholder:text-[#9FA6B2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-[#9FA6B2] hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-[#9FA6B2]">
              <input type="checkbox" className="h-3.5 w-3.5 accent-[#00FF9D]" />
              Keep me signed in
            </label>
            <Link
              href="/forgot-password"
              className="text-[#00FF9D] transition-colors hover:text-[#39FF14]"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold uppercase tracking-wider text-black shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <p className="text-center text-xs text-[#9FA6B2]">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-[#00FF9D] transition-colors hover:text-[#39FF14] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </SignInPage>
  );
}
