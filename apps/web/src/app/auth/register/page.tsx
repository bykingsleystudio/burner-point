'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AuthProviderButton } from '@/components/auth-provider-button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

const schema = z.object({
  firstName: z.string().trim().min(2, 'Enter your first name'),
  lastName: z.string().trim().min(2, 'Enter your last name'),
  email: z.string().trim().email('Enter a valid email address'),
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => E164_PATTERN.test(normalizePhone(value)), 'Enter your phone number with country code'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

const oauthProviders = [
  { label: 'Google', strategy: 'oauth_google' },
  { label: 'Apple', strategy: 'oauth_apple' },
  { label: 'Microsoft', strategy: 'oauth_microsoft' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [awaitingEmailCode, setAwaitingEmailCode] = useState(false);
  const authReady = Boolean(signUp);
  const isSubmitting = loading || fetchStatus === 'fetching' || !authReady;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
    },
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

  const sendEmailCode = async () => {
    if (!signUp) throw new Error('Auth not ready');

    const result = await signUp.verifications.sendEmailCode();
    if ('error' in result && result.error) throw result.error;

    setAwaitingEmailCode(true);
    toast.success('Check your email for the code.');
  };

  const continueAfterCreate = async () => {
    if (!signUp) throw new Error('Auth not ready');

    if (signUp.status === 'complete') {
      await finishSignUp();
      toast.success('Account created.');
      return;
    }

    if (signUp.unverifiedFields.includes('email_address')) {
      await sendEmailCode();
      return;
    }

    toast.error('Something went wrong. Please try again.');
  };

  const onSubmit = async (data: FormData) => {
    if (!signUp) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: data.email.trim().toLowerCase(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        legalAccepted: true,
        unsafeMetadata: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phoneNumber: normalizePhone(data.phoneNumber),
          acceptTerms: true,
          acceptPrivacy: true,
          authSource: 'web_signup',
        },
      });

      if ('error' in result && result.error) throw result.error;
      await continueAfterCreate();
    } catch (error) {
      toast.error(getFriendlyAuthError(error, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!signUp) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    const code = emailCode.trim();
    if (!code) {
      toast.error('Enter the code you received.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.verifications.verifyEmailCode({ code });
      if ('error' in result && result.error) throw result.error;
      await continueAfterCreate();
    } catch (error) {
      toast.error(getFriendlyAuthError(error, 'Verification failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const resendEmailCode = async () => {
    if (!signUp) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await sendEmailCode();
    } catch (error) {
      toast.error(getFriendlyAuthError(error, 'Could not resend the code. Try again.'));
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
          acceptTerms: true,
          acceptPrivacy: true,
          authSource: 'web_signup_oauth',
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(getFriendlyAuthError(error, 'Something went wrong. Please try again.'));
    }
  };

  return (
    <SignInPage
      title="Create your Burner Point account."
      description="Add your first name, last name, email, phone number, and password to get started."
      testimonials={[]}
    >
      <div className="space-y-5">
        {!awaitingEmailCode ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
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

        {awaitingEmailCode ? (
          <div className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm leading-6 text-white/72">
              We sent a sign-up code to <span className="text-white">{getValues('email')}</span>.
            </p>
            <Field label="Email code">
              <GlassInputWrapper>
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  enterKeyHint="done"
                  placeholder="Enter code"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                />
              </GlassInputWrapper>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={verifyEmailCode}
                className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Checking...' : 'Continue'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={resendEmailCode}
                className="flex min-h-12 w-full items-center justify-center rounded-[1.15rem] border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white/76 transition hover:border-brand-green/28 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send another code
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.firstName?.message}>
                <GlassInputWrapper>
                  <input
                    {...register('firstName')}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    placeholder="First name"
                    className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                  />
                </GlassInputWrapper>
              </Field>

              <Field label="Last name" error={errors.lastName?.message}>
                <GlassInputWrapper>
                  <input
                    {...register('lastName')}
                    autoComplete="family-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    placeholder="Last name"
                    className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                  />
                </GlassInputWrapper>
              </Field>
            </div>

            <Field label="Email address" error={errors.email?.message}>
              <GlassInputWrapper>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  enterKeyHint="next"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                />
              </GlassInputWrapper>
            </Field>

            <Field label="Phone number" error={errors.phoneNumber?.message}>
              <GlassInputWrapper>
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="next"
                  placeholder="+14155550182"
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
            <Link href="/sign-in" className="text-brand-green transition hover:text-[#39FF14]">
              Sign in
            </Link>
            <span className="mx-2 text-white/70">&bull;</span>
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

function getFriendlyAuthError(error: unknown, fallback: string) {
  const clerkError = error as {
    longMessage?: string;
    message?: string;
    errors?: Array<{ longMessage?: string; message?: string }>;
  };
  const raw =
    clerkError.errors?.[0]?.longMessage ||
    clerkError.errors?.[0]?.message ||
    clerkError.longMessage ||
    clerkError.message ||
    '';

  if (/captcha|challenge|browser|verification/i.test(raw)) return 'Verification failed. Try again or switch browser.';
  if (/password/i.test(raw)) return 'Choose a stronger password and try again.';
  if (/email/i.test(raw)) return 'That email address is already in use.';
  return fallback;
}

