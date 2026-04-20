'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Check, Mail } from 'lucide-react';
import { AuthProviderButton } from '@/components/auth-provider-button';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z.string().min(7, 'Phone number is required').regex(/^\+?[0-9\s().-]{7,24}$/, 'Enter a valid phone number'),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  country: z.string().default('NG'),
  referralCode: z.string().optional(),
  acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the Terms of Service' }),
  acceptPrivacy: z.boolean().refine((v) => v === true, { message: 'You must accept the Privacy Policy' }),
});

type FormData = z.infer<typeof schema>;

const FEATURES = ['Real SIM-backed numbers', 'OTP and voice verification', 'eSIM, proxies, and VPN privacy', 'No personal number exposure'];

const oauthProviders = [
  { label: 'Google', strategy: 'oauth_google' },
  { label: 'Apple', strategy: 'oauth_apple' },
  { label: 'Microsoft', strategy: 'oauth_microsoft' },
] as const;

type PendingVerification = 'email' | 'phone';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const authReady = Boolean(signUp);
  const isSubmitting = loading || fetchStatus === 'fetching' || !authReady;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'NG', acceptTerms: false, acceptPrivacy: false },
  });
  const policyAccepted = watch('acceptTerms') && watch('acceptPrivacy');
  const policyError = errors.acceptTerms?.message || errors.acceptPrivacy?.message;

  const togglePolicies = (checked: boolean) => {
    setValue('acceptTerms', checked, { shouldValidate: true, shouldDirty: true });
    setValue('acceptPrivacy', checked, { shouldValidate: true, shouldDirty: true });
    if (checked) {
      clearErrors(['acceptTerms', 'acceptPrivacy']);
    }
  };

  const finishSignUp = async () => {
    if (!signUp) {
      throw new Error('Authentication is still loading.');
    }

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

    if (error) {
      throw error;
    }
  };

  const continueSignUpVerification = async () => {
    if (!signUp) {
      throw new Error('Authentication is still loading.');
    }

    if (signUp.status === 'complete') {
      await finishSignUp();
      toast.success('Account created. Welcome to Burner Point.');
      return;
    }

    if (signUp.unverifiedFields.includes('email_address')) {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) throw error;
      setPendingVerification('email');
      toast.success('Check your email for the verification code.');
      return;
    }

    if (signUp.unverifiedFields.includes('phone_number')) {
      const { error } = await signUp.verifications.sendPhoneCode();
      if (error) throw error;
      setPendingVerification('phone');
      toast.success('Check your phone for the verification code.');
      return;
    }

    toast.error('More verification is required before this account can be completed.');
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
        phoneNumber: data.phoneNumber,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        legalAccepted: true,
        unsafeMetadata: {
          country: data.country,
          referralCode: data.referralCode,
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

    if (!pendingVerification || !verificationCode.trim()) return;
    setLoading(true);
    try {
      const code = verificationCode.trim();
      const { error } =
        pendingVerification === 'email'
          ? await signUp.verifications.verifyEmailCode({ code })
          : await signUp.verifications.verifyPhoneCode({ code });
      if (error) {
        throw error;
      }

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
      toast.error('By continuing, accept the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: '/onboarding',
        redirectCallbackUrl: '/sso-callback',
        unsafeMetadata: { authSource: 'web_signup', acceptTerms: true, acceptPrivacy: true },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(getClerkErrorMessage(err, 'OAuth sign-up failed'));
    }
  };

  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-brand-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.14),transparent_64%)]" />
      </div>
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[78rem] items-center gap-6 px-3 py-3 sm:px-4 md:px-6 md:py-4 lg:grid-cols-[0.82fr_1fr] xl:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
            <span className="flex h-10 w-10 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
              <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} />
            </span>
            <span className="font-mono text-base font-semibold uppercase tracking-[0.2em]">Burner <span className="text-brand-green">Point</span></span>
          </Link>
          <h1 className="mt-6 max-w-[18ch] text-[2.7rem] font-semibold uppercase leading-[0.92] xl:text-[3.25rem]">Create a private identity layer before the internet asks for your number.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/58 xl:text-[15px] xl:leading-7">Burner Point keeps sign-up direct, secure, and controlled while collecting the account details needed for recovery, verification, and private communication support.</p>
          <div className="mt-6 space-y-2.5">
            {FEATURES.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-green/30 bg-brand-green/10">
                  <Check className="h-3.5 w-3.5 text-brand-green" />
                </span>
                <span className="text-sm leading-5 text-white/62">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bp-card rounded-bp-lg p-3.5 sm:p-4 md:p-5 [&_input.auth-input]:min-h-11 [&_input.auth-input]:px-3.5 [&_input.auth-input]:py-3"
        >
          <div className="rounded-bp-lg border border-white/8 bg-black/24 p-4 sm:p-4 md:p-5">
            <div className="mb-5">
              <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
                  <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} />
                </span>
                <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em]">Burner <span className="text-brand-green">Point</span></span>
              </Link>
            </div>

            <h2 className="text-[1.85rem] font-semibold uppercase leading-none sm:text-[2rem]">Create account</h2>
            <p className="mt-2 text-sm leading-5 text-white/52">Private by design. Stay anonymous. Stay connected.</p>

            {pendingVerification ? (
              <div className="mt-5 rounded-bp-lg border border-brand-green/20 bg-brand-green/[0.04] p-3.5 md:p-4">
                <label className="block text-sm font-medium text-white/70">
                  {pendingVerification === 'email' ? 'Email verification code' : 'Phone verification code'}
                  <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" enterKeyHint="done" placeholder="Enter verification code" className="auth-input mt-1.5" />
                </label>
                <button type="button" disabled={isSubmitting} onClick={verifyEmail} className="bp-button-glow mt-3 flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Verifying...' : 'Verify and continue'}
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Field label="First name" error={errors.firstName?.message}>
                    <input {...register('firstName')} autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" placeholder="Kingsley" className="auth-input" />
                  </Field>
                  <Field label="Last name" error={errors.lastName?.message}>
                    <input {...register('lastName')} autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" placeholder="Doe" className="auth-input" />
                  </Field>
                </div>

                <div className="mt-4 rounded-bp-lg border border-white/8 bg-white/[0.02] p-3.5 md:p-4">
                  <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">
                    <Mail className="h-4 w-4" />
                    Required Contact
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Email address" error={errors.email?.message}>
                      <input {...register('email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" enterKeyHint="next" placeholder="you@example.com" className="auth-input" />
                    </Field>
                    <Field label="Phone number" error={errors.phoneNumber?.message}>
                      <input {...register('phoneNumber')} type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" placeholder="+1 415 555 0182" className="auth-input" />
                    </Field>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_0.7fr]">
                  <Field label="Password" error={errors.password?.message}>
                    <input {...register('password')} type="password" autoComplete="new-password" enterKeyHint="next" placeholder="Min 8 chars, mixed case + number" className="auth-input" />
                  </Field>
                  <Field label="Referral code">
                    <input {...register('referralCode')} autoCapitalize="characters" enterKeyHint="done" placeholder="ABC1234" className="auth-input font-mono" />
                  </Field>
                </div>

                <div className="mt-4 rounded-bp-lg border border-white/8 bg-white/[0.02] p-3.5 md:p-4">
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

                <button type="submit" disabled={isSubmitting} className="bp-button-glow mt-4 flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </>
            )}

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/8" />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">or continue with</span>
              <span className="h-px flex-1 bg-white/8" />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {oauthProviders.map((provider) => (
                <AuthProviderButton key={provider.label} provider={provider.label} onClick={() => startOAuth(provider.strategy)} disabled={isSubmitting} className="md:h-full" />
              ))}
            </div>

            <p className="mt-4 text-center text-sm text-white/48">
              Already have an account? <Link href="/auth/login" className="text-brand-green hover:underline">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/58">
      {label}
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1.5 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function getClerkErrorMessage(error: unknown, fallback: string) {
  const clerkError = error as { longMessage?: string; message?: string; errors?: Array<{ longMessage?: string; message?: string }> };
  return clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.longMessage || clerkError.message || fallback;
}
