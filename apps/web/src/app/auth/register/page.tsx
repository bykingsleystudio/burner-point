'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { AuthProviderButton } from '@/components/auth-provider-button';
import { AuthShell } from '@/components/ui/auth-shell';

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

  const description = useMemo(() => {
    if (pendingEmailVerification) {
      return 'Confirm the secure code sent to your email, then move directly into phone verification and your Burner Point dashboard.';
    }
    return 'Stay Anonymous. Stay Connected. Private By Design.';
  }, [pendingEmailVerification]);

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
    <AuthShell
      title="Log in or sign up"
      description={description}
      asideTitle="Private entry, no extra loops."
      asideDescription="Create a Burner Point account with the details required for secure recovery, then verify the attached phone number and enter the dashboard directly."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-white/8 bg-white/[0.03] p-1">
            <Link href="/auth/login" className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46 transition hover:text-white">
              Sign in
            </Link>
            <span className="rounded-full bg-brand-green px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
              Create account
            </span>
          </div>
          <div className="text-xs text-white/38">By continuing you accept the Terms of Service and Privacy Policy.</div>
        </div>

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

            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-white/8" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/32">OR</span>
              <span className="h-px flex-1 bg-white/8" />
            </div>
          </>
        ) : null}

        {pendingEmailVerification ? (
          <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
            <label className="block text-sm font-medium text-white/70">
              Email verification code
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="done"
                placeholder="Enter verification code"
                className="auth-input mt-2"
              />
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={verifyEmail}
              className="bp-button-glow mt-4 flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying...' : 'Verify and continue'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" error={errors.firstName?.message}>
                <input {...register('firstName')} autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" placeholder="Kingsley" className="auth-input" />
              </Field>
              <Field label="Last Name" error={errors.lastName?.message}>
                <input {...register('lastName')} autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" placeholder="Doe" className="auth-input" />
              </Field>
            </div>

            <Field label="Email Address" error={errors.email?.message}>
              <input {...register('email')} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" enterKeyHint="next" placeholder="you@example.com" className="auth-input" />
            </Field>

            <Field label="Phone Number" error={errors.phoneNumber?.message}>
              <input
                {...register('phoneNumber')}
                id="auth-register-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                placeholder="+14155550182"
                className="auth-input"
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <input {...register('password')} type="password" autoComplete="new-password" enterKeyHint="done" placeholder="8+ chars, mixed case + number" className="auth-input" />
            </Field>

            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-green/22 bg-brand-green/10">
                  <ShieldCheck className="h-4 w-4 text-brand-green" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Recovery and verification ready</p>
                  <p className="mt-2 text-sm leading-6 text-white/54">
                    The attached phone number will be used for the secure verification step immediately after account creation. No extra legal checkbox is required here.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Get Started'}
            </button>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4 text-xs leading-6 text-white/38">
          <p>
            By continuing you accept the{' '}
            <Link href="/terms" className="text-brand-green transition hover:text-[#1cffac]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-green transition hover:text-[#1cffac]">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-green transition hover:text-[#1cffac]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
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
