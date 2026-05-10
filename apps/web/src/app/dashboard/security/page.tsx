'use client';

import Link from 'next/link';
import { ShieldCheck, Smartphone, KeyRound, Mail } from 'lucide-react';
import { useAuthStore } from '@/store';

export default function SecurityPage() {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Account security</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white">Security and recovery</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
              Review your verified channels, reset your password, and finish phone verification before you use messaging, rentals, and verification workflows.
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand-green" />
            <h2 className="text-lg font-semibold text-white">Email</h2>
          </div>
          <p className="mt-4 text-sm text-white/72">{user?.email || 'No email connected'}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Email remains your primary sign-in and password recovery channel for Burner Point.
          </p>
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-brand-green" />
            <h2 className="text-lg font-semibold text-white">Phone verification</h2>
          </div>
          <p className="mt-4 text-sm text-white/72">{user?.phoneNumber || 'No phone number saved yet'}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            {user?.phoneVerified
              ? 'Your account phone number is verified and ready for OTP-protected workflows.'
              : 'Verify your phone number to unlock recovery and product flows that require OTP confirmation.'}
          </p>
          {!user?.phoneVerified ? (
            <Link
              href="/verify-phone?redirect=/dashboard/security"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-bp-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
            >
              Verify phone
            </Link>
          ) : null}
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-brand-green" />
            <h2 className="text-lg font-semibold text-white">Password and recovery</h2>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/50">
            Password updates and recovery links are managed through the Supabase-backed auth flow. Use the recovery screen if you need to reset access.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center justify-center rounded-bp-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
            >
              Reset password
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-11 items-center justify-center rounded-bp-md border border-white/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/72 transition hover:border-brand-green/20 hover:text-brand-green"
            >
              Back to settings
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
