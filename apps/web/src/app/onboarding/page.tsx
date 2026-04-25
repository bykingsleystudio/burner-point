'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import { authApi, setApiSession } from '@/lib/api';
import { AuthShell } from '@/components/ui/auth-shell';

function sanitizeRedirect(value?: string | null) {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { user } = useUser();
  const redirectTo = useMemo(() => sanitizeRedirect(searchParams.get('redirect')), [searchParams]);
  const userMetadata = (user?.unsafeMetadata ?? {}) as Record<string, string | boolean | undefined>;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || String(userMetadata.firstName || ''),
    lastName: user?.lastName || String(userMetadata.lastName || ''),
    email: user?.primaryEmailAddress?.emailAddress || '',
    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || String(userMetadata.phoneNumber || ''),
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      firstName: current.firstName || user?.firstName || String(userMetadata.firstName || ''),
      lastName: current.lastName || user?.lastName || String(userMetadata.lastName || ''),
      email: current.email || user?.primaryEmailAddress?.emailAddress || '',
      phoneNumber: current.phoneNumber || user?.primaryPhoneNumber?.phoneNumber || String(userMetadata.phoneNumber || ''),
    }));
  }, [user?.id, user?.firstName, user?.lastName, user?.primaryEmailAddress?.emailAddress, user?.primaryPhoneNumber?.phoneNumber, userMetadata.firstName, userMetadata.lastName, userMetadata.phoneNumber]);

  const setField = (key: keyof typeof form) => (value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const completeOnboarding = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phoneNumber) {
      toast.error('First name, last name, email, and phone number are required.');
      return;
    }

    const normalizedPhone = form.phoneNumber.trim().replace(/[^\d+]/g, '');
    if (!E164_PATTERN.test(normalizedPhone)) {
      toast.error('Enter your phone number in E.164 format (example: +14155550182).');
      return;
    }

    setLoading(true);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error('No secure session token');

        const { data } = await authApi.exchangeClerkToken(clerkToken, {
          ...form,
          phoneNumber: normalizedPhone,
          acceptTerms: true,
          acceptPrivacy: true,
      });

      setApiSession(data.accessToken, data.refreshToken);

      if (data.needsOnboarding) {
        toast.error('A few profile details are still missing.');
        return;
      }

      if (data.user?.phoneNumber && data.needsPhoneVerification) {
        sessionStorage.setItem('burnerPointPendingPhone', data.user.phoneNumber);
        router.push(`/auth/phone-verify?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      toast.success('Profile secured.');
      router.push(redirectTo);
    } catch (error: unknown) {
      const responseError = error as Error & {
        response?: {
          data?: { message?: string };
        };
      };
      toast.error(responseError.response?.data?.message || responseError.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Complete your Burner Point profile"
      description="Finish the recovery and security details tied to your Burner Point account, then move straight into your dashboard."
      asideTitle="Profile completion should feel like progress, not another auth wall."
      asideDescription="This step only collects the account details users actually need for secure recovery, verification, and private communication continuity."
    >
      <div className="space-y-4">
        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
            <div>
              <p className="text-sm font-semibold text-white">What this unlocks</p>
              <p className="mt-1.5 text-sm leading-6 text-white/56">
                Once this profile is complete you can verify your phone, enter the dashboard, and manage numbers, conversations, billing, and account support from one place.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input value={form.firstName} onChange={(event) => setField('firstName')(event.target.value)} className="auth-input" autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" />
          </Field>
          <Field label="Last name">
            <input value={form.lastName} onChange={(event) => setField('lastName')(event.target.value)} className="auth-input" autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" />
          </Field>
          <Field label="Email address">
            <input value={form.email} onChange={(event) => setField('email')(event.target.value)} type="email" inputMode="email" className="auth-input" autoComplete="email" autoCapitalize="none" enterKeyHint="next" />
          </Field>
          <Field label="Phone number">
            <input value={form.phoneNumber} onChange={(event) => setField('phoneNumber')(event.target.value)} type="tel" inputMode="tel" className="auth-input" autoComplete="tel" enterKeyHint="done" placeholder="+234 801 234 5678" />
          </Field>
        </div>

        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-white/70">
          By continuing, you agree to the{' '}
          <Link href="/terms-of-service" className="text-brand-green hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="text-brand-green hover:underline">
            Privacy Policy
          </Link>
          .
        </div>

        <button type="button" disabled={loading} onClick={completeOnboarding} className="bp-button-glow flex min-h-12 w-full items-center justify-center rounded-[1.15rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Saving profile...' : 'Continue to secure verification'}
        </button>
      </div>
    </AuthShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-brand-black text-white">
          <div className="loader" />
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/58">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
