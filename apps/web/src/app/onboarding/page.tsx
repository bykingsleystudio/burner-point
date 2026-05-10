'use client';

import Link from 'next/link';
import { Suspense, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/ui/auth-shell';
import { buildPostAuthRedirect, exchangeSupabaseSession, getErrorMessage, sanitizeRedirect } from '@/lib/auth';
import { INTERNATIONAL_PHONE_ERROR, isValidInternationalPhone, normalizeInternationalPhone } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const redirectTo = useMemo(() => sanitizeRedirect(searchParams.get('redirect')), [searchParams]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session?.user) return;

      const sessionUser = data.session.user;
      const metadata = (sessionUser.user_metadata ?? {}) as Record<string, unknown>;

      setForm((current) => ({
        firstName:
          current.firstName ||
          user?.firstName ||
          (typeof metadata.first_name === 'string' ? metadata.first_name : '') ||
          (typeof metadata.firstName === 'string' ? metadata.firstName : ''),
        lastName:
          current.lastName ||
          user?.lastName ||
          (typeof metadata.last_name === 'string' ? metadata.last_name : '') ||
          (typeof metadata.lastName === 'string' ? metadata.lastName : ''),
        email: current.email || user?.email || sessionUser.email || '',
        phoneNumber:
          current.phoneNumber ||
          user?.phoneNumber ||
          (typeof metadata.phone_number === 'string' ? metadata.phone_number : '') ||
          (typeof metadata.phoneNumber === 'string' ? metadata.phoneNumber : '') ||
          sessionUser.phone ||
          '',
      }));
    });

    return () => {
      active = false;
    };
  }, [user?.email, user?.firstName, user?.lastName, user?.phoneNumber]);

  const setField = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const completeOnboarding = async () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const normalizedPhone = normalizeInternationalPhone(form.phoneNumber);

    if (!firstName || !lastName || !email || !normalizedPhone) {
      toast.error('Add your first name, last name, email, and phone number.');
      return;
    }

    if (!isValidInternationalPhone(form.phoneNumber)) {
      toast.error(INTERNATIONAL_PHONE_ERROR);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sign in again to continue.');
      }

      const result = await exchangeSupabaseSession(session, {
        firstName,
        lastName,
        email,
        phoneNumber: normalizedPhone,
        acceptTerms: true,
        acceptPrivacy: true,
      });

      toast.success("You're all set.");
      router.push(buildPostAuthRedirect(result, redirectTo));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Something went wrong. Please sign in again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Finish your account setup"
      description="Add the details Burner Point uses for recovery, billing, and account security."
      asideTitle="Private access starts with a complete account."
      asideDescription="Finish your profile once, then manage messaging, verification, rentals, travel data, proxy plans, billing, and support from one place."
    >
      <div className="space-y-2.5 sm:space-y-4">
        <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-3 sm:rounded-[1.35rem] sm:p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
            <div>
              <p className="text-xs font-semibold text-white sm:text-sm">Almost done</p>
              <p className="mt-1 text-xs leading-5 text-white/72 sm:mt-1.5 sm:text-sm sm:leading-6">
                Add your contact details so you can recover your account and receive important updates.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <Field label="First name">
            <input
              value={form.firstName}
              onChange={(event) => setField('firstName')(event.target.value)}
              className="auth-input"
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
          </Field>
          <Field label="Last name">
            <input
              value={form.lastName}
              onChange={(event) => setField('lastName')(event.target.value)}
              className="auth-input"
              autoComplete="family-name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
          </Field>
          <Field label="Email address">
            <input
              value={form.email}
              readOnly
              type="email"
              inputMode="email"
              className="auth-input cursor-not-allowed opacity-70"
              autoComplete="email"
            />
          </Field>
          <Field label="Phone number">
            <input
              value={form.phoneNumber}
              onChange={(event) => setField('phoneNumber')(event.target.value)}
              type="tel"
              inputMode="tel"
              className="auth-input"
              autoComplete="tel"
              enterKeyHint="done"
              placeholder="+14155550182"
            />
          </Field>
        </div>

        <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-3 text-[11px] leading-5 text-white/70 sm:rounded-[1.35rem] sm:p-4 sm:text-sm sm:leading-6">
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

        <button
          type="button"
          disabled={loading}
          onClick={() => void completeOnboarding()}
          className="bp-button-glow flex min-h-11 w-full items-center justify-center rounded-[1rem] bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:rounded-[1.15rem] sm:px-5 sm:text-sm sm:tracking-[0.18em]"
        >
          {loading ? 'Saving...' : 'Continue'}
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
    <label className="block text-[11px] font-medium text-white/76 sm:text-xs">
      {label}
      <div className="mt-1 sm:mt-2">{children}</div>
    </label>
  );
}
