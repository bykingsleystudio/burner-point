'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Check, ShieldCheck } from 'lucide-react';
import { AuthProviderButton } from '@/components/auth-provider-button';
import { AuthShell } from '@/components/ui/auth-shell';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Enter a valid email address'),
  // Backend OTP verification requires strict E.164 (leading +).
  phoneNumber: z.string().min(10, 'Phone number is required').regex(
    /^\+[1-9]\d{6,14}$/,
    'Enter your phone number in E.164 format (example: +14155550182)',
  ),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  referralCode: z.string().optional(),
  acceptTerms: z.boolean().refine((value) => value === true, { message: 'You must accept the Terms of Service' }),
  acceptPrivacy: z.boolean().refine((value) => value === true, { message: 'You must accept the Privacy Policy' }),
});

type FormData = z.infer<typeof schema>;

const FEATURES = [
  'Global phone verification without country locks',
  'Private numbers, verification, rentals, and messaging',
  'Cleaner onboarding with no duplicate account loops',
  'One account surface across web and mobile',
] as const;

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
    watch,
    setValue,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { acceptTerms: false, acceptPrivacy: false },
  });

  const acceptTerms = watch('acceptTerms');
  const acceptPrivacy = watch('acceptPrivacy');
  const policyAccepted = acceptTerms && acceptPrivacy;
  const policyError = errors.acceptTerms?.message || errors.acceptPrivacy?.message;
  const phoneField = register('phoneNumber');
  const currentDescription = useMemo(() => (
    pendingEmailVerification
      ? 'Confirm your email address to finish account creation. Your phone number stays attached to your Burner Point profile and can be verified in the next secure step.'
      : 'Create your Burner Point account with the contact details you want attached to secure recovery, verification, and private communication.'
  ), [pendingEmailVerification]);

  const togglePolicies = (checked: boolean) => {
    setValue('acceptTerms', checked, { shouldValidate: true, shouldDirty: true });
    setValue('acceptPrivacy', checked, { shouldValidate: true, shouldDirty: true });
    if (checked) clearErrors(['acceptTerms', 'acceptPrivacy']);
  };

  const finishSignUp = async () => {
    if (!signUp) throw new Error('Authentication is still loading.');

    const { error } = await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        const destination = session?.currentTask ? '/onboarding' : '/dashboard';
        const url = decorateUrl(destination);
        if (url.startsWith('http')) {
          window.location.href = url;
          return;
        }
        router.push(url);
      },
    });

    if (error) throw error;
  };

  const continueSignUpVerification = async () => {
    if (!signUp) throw new Error('Authentication is still loading.');

    if (signUp.status === 'complete') {
      await finishSignUp();
      toast.success('Account created. Welcome to Burner Point.');
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
          referralCode: data.referralCode,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          acceptTerms: data.acceptTerms,
          acceptPrivacy: data.acceptPrivacy,
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

      setVerificationCode('');
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
    if (!policyAccepted) {
      toast.error('Accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    const values = getValues();

    try {
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
        unsafeMetadata: {
          authSource: 'web_signup',
          acceptTerms: true,
          acceptPrivacy: true,
          phoneNumber: values.phoneNumber || undefined,
          firstName: values.firstName || undefined,
          lastName: values.lastName || undefined,
          referralCode: values.referralCode || undefined,
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
      description={currentDescription}
      asideTitle="Build a private communication identity that starts clean."
      asideDescription="Burner Point account creation now separates authentication from profile completion and phone verification, which removes the Clerk onboarding loops you were hitting on OAuth and first-time signup."
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
          <Link href="/privacy" className="text-xs font-medium text-white/40 transition hover:text-brand-green">
            Privacy policy
          </Link>
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
                label="Continue with phone"
                onClick={() => document.getElementById('auth-register-phone')?.focus()}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-white/8" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/32">or</span>
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
            <button type="button" disabled={isSubmitting} onClick={verifyEmail} className="bp-button-glow mt-4 flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Verifying...' : 'Verify and continue'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.firstName?.message}>
                <input {...register('firstName')} autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" placeholder="Kingsley" className="auth-input" />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input {...register('lastName')} autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" placeholder="Doe" className="auth-input" />
              </Field>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">
                <ShieldCheck className="h-4 w-4" />
                Required account recovery
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email address" error={errors.email?.message}>
                  <input {...register('email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" enterKeyHint="next" placeholder="you@example.com" className="auth-input" />
                </Field>
                <Field label="Phone number" error={errors.phoneNumber?.message}>
                  <input
                    {...phoneField}
                    id="auth-register-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder="+14155550182"
                    className="auth-input"
                  />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_0.72fr]">
              <Field label="Password" error={errors.password?.message}>
                <input {...register('password')} type="password" autoComplete="new-password" enterKeyHint="next" placeholder="8+ chars, mixed case + number" className="auth-input" />
              </Field>
              <Field label="Referral code">
                <input {...register('referralCode')} autoCapitalize="characters" enterKeyHint="done" placeholder="ABC1234" className="auth-input font-mono" />
              </Field>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="grid gap-2">
                {FEATURES.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-white/62">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-green/24 bg-brand-green/10">
                      <Check className="h-3 w-3 text-brand-green" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-white/70">
                <input
                  checked={policyAccepted}
                  onChange={(event) => togglePolicies(event.target.checked)}
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-black/40 text-brand-green focus:ring-brand-green"
                />
                <span>
                  By continuing, you accept the{' '}
                  <Link href="/terms" className="text-brand-green underline-offset-2 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand-green underline-offset-2 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {policyError ? <p className="mt-2 text-xs text-red-300">{policyError}</p> : null}
            </div>

            <button type="submit" disabled={isSubmitting} className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
          <div className="text-sm text-white/46">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-brand-green transition hover:text-[#1cffac]">
              Sign in
            </Link>
          </div>
          <div className="text-xs text-white/36">
            Phone verification happens in a dedicated secure step after account creation.
          </div>
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
