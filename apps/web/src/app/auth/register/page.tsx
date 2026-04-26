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

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number is required')
    .regex(/^\+[1-9]\d{6,14}$/, 'Enter your phone number in E.164 format (example: +14155550182)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
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
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const authReady = Boolean(signUp);
  const isSubmitting = loading || fetchStatus === 'fetching' || !authReady;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const finishSignUp = async () => {
    if (!signUp) throw new Error('Authentication is still loading.');

    const { error } = await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        router.push(decorateUrl('/auth/phone-verify?redirect=/dashboard'));
      },
    });

    if (error) throw error;
  };

  const continueSignUpVerification = async () => {
    if (!signUp) throw new Error('Authentication is still loading.');

    if (signUp.status === 'complete') {
      await finishSignUp();
      toast.success('Account created. Verify your phone to enter Burner Point.');
      return;
    }

    if (signUp.unverifiedFields.includes('email_address')) {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) throw error;
      setPendingEmailVerification(true);
      toast.success('Check your email for the verification code.');
      return;
    }

    toast.error('Another verification step is required before this account can be completed.');
  };

  const onSubmit = async (data: FormData) => {
    if (!signUp) {
      toast.error('Authentication is still loading.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        legalAccepted: true,
        unsafeMetadata: {
          phoneNumber: data.phoneNumber,
          acceptTerms: true,
          acceptPrivacy: true,
          authSource: 'web_signup',
        },
      });

      if (error) throw error;
      await continueSignUpVerification();
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!signUp) {
      toast.error('Authentication is still loading.');
      return;
    }

    if (!verificationCode.trim()) {
      toast.error('Enter the verification code from your email.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: verificationCode.trim() });
      if (error) throw error;

      await continueSignUpVerification();
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async (strategy: (typeof oauthProviders)[number]['strategy']) => {
    if (!signUp) {
      toast.error('Authentication is still loading.');
      return;
    }

    const values = getValues();

    try {
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
        unsafeMetadata: {
          authSource: 'web_signup_oauth',
          firstName: values.firstName || undefined,
          lastName: values.lastName || undefined,
          phoneNumber: values.phoneNumber || undefined,
          acceptTerms: true,
          acceptPrivacy: true,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'OAuth sign-up failed'));
    }
  };

  return (
    <SignInPage
      title="Create your Burner Point account."
      description="Set up one account for private numbers, supported verifications, rentals, travel data, proxy access, and Secure Tunnel."
      testimonials={[]}
    >
      <div className="space-y-5">
        {!pendingEmailVerification ? (
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
                onClick={() => document.getElementById('auth-register-phone')?.focus()}
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

        {pendingEmailVerification ? (
          <div className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <label className="block text-sm font-medium text-white/70">
              Email verification code
              <GlassInputWrapper>
                <input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  enterKeyHint="done"
                  placeholder="Enter verification code"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={verifyEmail}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying...' : 'Verify and continue'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" error={errors.firstName?.message}>
                <GlassInputWrapper>
                  <input
                    {...register('firstName')}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    placeholder="Kingsley"
                    className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                  />
                </GlassInputWrapper>
              </Field>
              <Field label="Last Name" error={errors.lastName?.message}>
                <GlassInputWrapper>
                  <input
                    {...register('lastName')}
                    autoComplete="family-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    placeholder="Doe"
                    className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                  />
                </GlassInputWrapper>
              </Field>
            </div>

            <Field label="Email Address" error={errors.email?.message}>
              <GlassInputWrapper>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  enterKeyHint="next"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                />
              </GlassInputWrapper>
            </Field>

            <Field label="Phone Number" error={errors.phoneNumber?.message}>
              <GlassInputWrapper>
                <input
                  {...register('phoneNumber')}
                  id="auth-register-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  placeholder="+14155550182"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
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
                  placeholder="8+ chars, mixed case + number"
                  className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
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

        <div className="border-t border-white/8 pt-4 text-xs leading-6 text-white/42">
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-green transition hover:text-[#39FF14]">
              Sign in
            </Link>
            <span className="mx-2 text-white/24">•</span>
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
    <label className="block text-xs font-medium text-white/58">
      {label}
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-1.5 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function getClerkErrorMessage(error: unknown, fallback: string) {
  const clerkError = error as { longMessage?: string; message?: string; errors?: Array<{ longMessage?: string; message?: string }> };
  return clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.longMessage || clerkError.message || fallback;
}
