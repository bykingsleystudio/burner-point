'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { authApi, setApiSession } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || '',
    country: 'NG',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const setField = (key: keyof typeof form) => (value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const completeOnboarding = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phoneNumber) {
      toast.error('First name, last name, email, and phone number are required.');
      return;
    }
    if (!form.acceptTerms || !form.acceptPrivacy) {
      toast.error('Accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error('No Clerk session token');
      const { data } = await authApi.exchangeClerkToken(clerkToken, form);
      setApiSession(data.accessToken, data.refreshToken);
      toast.success('Profile secured.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-black px-5 py-10 text-white">
      <div className="bp-grid-bg pointer-events-none fixed inset-0 opacity-60" />
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center">
        <div className="bp-card w-full rounded-bp-lg p-5 md:p-7">
          <div className="rounded-bp-lg border border-white/8 bg-black/24 p-5 md:p-6">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
              <span className="flex h-11 w-11 items-center justify-center rounded-bp-lg border border-brand-green/25 bg-brand-green/10">
                <Image src="/assets/logo-mark.svg" alt="" width={26} height={26} />
              </span>
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">Burner <span className="text-brand-green">Point</span></span>
            </Link>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.28em] text-brand-green">Required onboarding</p>
            <h1 className="mt-3 text-3xl font-semibold uppercase">Finish your Clerk profile</h1>
            <p className="mt-3 text-sm leading-6 text-white/52">Burner Point requires a complete local profile before telecom, billing, and support features are enabled.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <input value={form.firstName} onChange={(event) => setField('firstName')(event.target.value)} className="auth-input" autoComplete="given-name" />
              </Field>
              <Field label="Last name">
                <input value={form.lastName} onChange={(event) => setField('lastName')(event.target.value)} className="auth-input" autoComplete="family-name" />
              </Field>
              <Field label="Email address">
                <input value={form.email} onChange={(event) => setField('email')(event.target.value)} type="email" className="auth-input" autoComplete="email" />
              </Field>
              <Field label="Phone number">
                <input value={form.phoneNumber} onChange={(event) => setField('phoneNumber')(event.target.value)} type="tel" className="auth-input" autoComplete="tel" placeholder="+1 415 555 0182" />
              </Field>
            </div>

            <div className="mt-6 space-y-3 rounded-bp-lg border border-white/8 bg-white/[0.02] p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/70">
                <input checked={form.acceptTerms} onChange={(event) => setField('acceptTerms')(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-brand-green focus:ring-brand-green" />
                <span>I accept the <Link href="/terms" className="text-brand-green hover:underline">Terms of Service</Link>.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/70">
                <input checked={form.acceptPrivacy} onChange={(event) => setField('acceptPrivacy')(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-brand-green focus:ring-brand-green" />
                <span>I accept the <Link href="/privacy" className="text-brand-green hover:underline">Privacy Policy</Link>.</span>
              </label>
            </div>

            <button type="button" disabled={loading} onClick={completeOnboarding} className="bp-button-glow mt-5 flex min-h-12 w-full items-center justify-center rounded-bp bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Saving profile...' : 'Complete onboarding'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/58">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
