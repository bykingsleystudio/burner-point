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
import { AppleIcon, GlassInputWrapper, GoogleIcon, MicrosoftIcon, SignInPage } from '@/components/ui/sign-in';
import { INTERNATIONAL_PHONE_ERROR, isValidInternationalPhone, normalizeInternationalPhone } from '@/lib/phone';

const schema = z.object({
  firstName: z.string().trim().min(2, 'Enter your first name'),
  lastName: z.string().trim().min(2, 'Enter your last name'),
  email: z.string().trim().email('Enter a valid email address'),
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => isValidInternationalPhone(value), INTERNATIONAL_PHONE_ERROR),
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
          phoneNumber: normalizeInternationalPhone(data.phoneNumber),
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
      title="Create your account"
      description="Join Burner Point today"
    >
      <div className="space-y-4">
        {!awaitingEmailCode ? (
          <>
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" error={errors.firstName?.message}>
                  <GlassInputWrapper>
                    <input
                      {...register('firstName')}
                      autoComplete="given-name"
                      placeholder="First name"
                      className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                    />
                  </GlassInputWrapper>
                </Field>

                <Field label="Last name" error={errors.lastName?.message}>
                  <GlassInputWrapper>
                    <input
                      {...register('lastName')}
                      autoComplete="family-name"
                      placeholder="Last name"
                      className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                    />
                  </GlassInputWrapper>
                </Field>
              </div>

              <Field label="Email" error={errors.email?.message}>
                <GlassInputWrapper>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  />
                </GlassInputWrapper>
              </Field>

              <Field label="Phone" error={errors.phoneNumber?.message}>
                <GlassInputWrapper>
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+14155550182"
                    className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  />
                </GlassInputWrapper>
              </Field>

              <Field label="Password" error={errors.password?.message}>
                <GlassInputWrapper>
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Use at least 8 characters"
                    className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  />
                </GlassInputWrapper>
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </>
        ) : (
          /* Email Verification */
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400">
              We sent a code to <span className="text-white">{getValues('email')}</span>
            </p>
            <Field label="Verification code">
              <GlassInputWrapper>
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                />
              </GlassInputWrapper>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={verifyEmailCode}
                className="flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Checking...' : 'Continue'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={resendEmailCode}
                className="flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        {/* Footer Link */}
        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-[#00FF9D] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </SignInPage>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-400">{label}</label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-[10px] text-red-400">{error}</p> : null}
    </div>
  );
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
