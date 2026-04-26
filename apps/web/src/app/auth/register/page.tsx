'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AuthProviderButton } from '@/components/auth-provider-button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your email or phone number')
    .refine((value) => isEmail(value) || E164_PATTERN.test(normalizePhone(value)), 'Enter a valid email or phone number'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

type FormData = z.infer<typeof schema>;
type PendingVerification = 'email' | 'phone' | null;

const oauthProviders = [
  { label: 'Google', strategy: 'oauth_google' },
  { label: 'Apple', strategy: 'oauth_apple' },
  { label: 'Microsoft', strategy: 'oauth_microsoft' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const authReady = Boolean(signUp);
  const isSubmitting = loading || fetchStatus === 'fetching' || !authReady;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  const finishSignUp = async () => {
    if (!signUp) throw new Error('Auth not ready');

    const { error } = await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        router.push(decorateUrl('/onboarding?redirect=/dashboard'));
      },
    });

    if (error) throw error;
  };

  const continueSignUpVerification = async () => {
    if (!signUp) throw new Error('Auth not ready');

    if (signUp.status === 'complete') {
      await finishSignUp();
      toast.success('Account created.');
      return;
    }

    if (signUp.unverifiedFields.includes('email_address')) {
      const result = await signUp.verifications.sendEmailCode();
      setPendingVerification('email');
      toast.success('Check your email for the code.');
      if ('error' in result && result.error) throw result.error;
      return;
    }

    if (signUp.unverifiedFields.includes('phone_number')) {
      const result = await signUp.verifications.sendPhoneCode();
      setPendingVerification('phone');
      toast.success('Check your phone for the code.');
      if ('error' in result && result.error) throw result.error;
      return;
    }

    toast.error('Something went wrong. Please try again.');
  };

  const onSubmit = async (data: FormData) => {
    if (!signUp) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    const identifier = data.identifier.trim();
    const phoneNumber = normalizePhone(identifier);
    const isPhone = E164_PATTERN.test(phoneNumber);

    setLoading(true);
    try {
      const result = await signUp.create({
        ...(isPhone ? { phoneNumber } : { emailAddress: identifier.toLowerCase() }),
        password: data.password,
        legalAccepted: true,
        unsafeMetadata: {
          acceptTerms: true,
          acceptPrivacy: true,
          authSource: 'web_signup',
        },
      });

      if ('error' in result && result.error) throw result.error;
      await continueSignUpVerification();
    } catch (err) {
      toast.error(getFriendlyAuthError(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!signUp) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    const code = verificationCode.trim();
    if (!code) {
      toast.error('Enter the code you received.');
      return;
    }

    setLoading(true);
    try {
      const result =
        pendingVerification === 'phone'
          ? await signUp.verifications.verifyPhoneCode({ code })
          : await signUp.verifications.verifyEmailCode({ code });

      if ('error' in result && result.error) throw result.error;
      await continueSignUpVerification();
    } catch (err) {
      toast.error(getFriendlyAuthError(err, 'Verification failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async (strategy: (typeof oauthProviders)[number]['strategy']) => {
    if (!signUp) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    try {
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: '/onboarding?redirect=/dashboard',
        redirectCallbackUrl: '/sso-callback',
        unsafeMetadata: {
          authSource: 'web_signup_oauth',
          acceptTerms: true,
          acceptPrivacy: true,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(getFriendlyAuthError(err, 'Something went wrong. Please try again.'));
    }
  };

  return (
    <SignInPage
      title="Create your account."
      description="Start with email or phone. Add products when you are ready."
      testimonials={[]}
    >
      <div className="space-y-5">
        {!pendingVerification ? (
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
            </div>

            <div className="relative flex items-center justify-center">
              <span className="w-full border-t border-white/10" />
              <span className="absolute bg-[#04120C] px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
                OR
              </span>
            </div>
          </>
        ) : null}

        {pendingVerification ? (
          <div className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <label className="block text-sm font-medium text-white/76">
              {pendingVerification === 'phone' ? 'Phone code' : 'Email code'}
              <GlassInputWrapper>
                <input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  enterKeyHint="done"
                  placeholder="Enter code"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={verifyCode}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Checking...' : 'Continue'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Email or phone" error={errors.identifier?.message}>
              <GlassInputWrapper>
                <input
                  {...register('identifier')}
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  enterKeyHint="next"
                  placeholder="you@example.com or +14155550182"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                />
              </GlassInputWrapper>
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <GlassInputWrapper>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  enterKeyHint="done"
                  placeholder="Use at least 8 characters"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                />
              </GlassInputWrapper>
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Get Started'}
            </button>
          </form>
        )}

        <div className="border-t border-white/8 pt-4 text-xs leading-6 text-white/70">
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-green transition hover:text-[#39FF14]">
              Sign in
            </Link>
            <span className="mx-2 text-white/70">•</span>
            By continuing you agree to the{' '}
            <Link href="/terms-of-service" className="text-brand-green transition hover:text-[#39FF14]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="text-brand-green transition hover:text-[#39FF14]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </SignInPage>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/76">
      {label}
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-1.5 text-xs text-red-200">{error}</p> : null}
    </label>
  );
}

function normalizePhone(value: string) {
  return value.trim().replace(/[\s().-]/g, '');
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getFriendlyAuthError(error: unknown, fallback: string) {
  const clerkError = error as { longMessage?: string; message?: string; errors?: Array<{ longMessage?: string; message?: string }> };
  const raw = clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.longMessage || clerkError.message || '';
  if (/captcha|challenge|browser|verification/i.test(raw)) return 'Verification failed. Try again or switch browser.';
  if (/password|identifier|not found|invalid|incorrect/i.test(raw)) return 'Email/phone or password is incorrect.';
  return fallback;
}


