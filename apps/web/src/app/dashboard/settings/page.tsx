'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Bell, KeyRound, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';

const settings = [
  { title: 'Security and 2FA', text: 'Manage session controls, MFA, password, and trusted devices.', icon: ShieldCheck, href: '/dashboard/security' },
  { title: 'API keys', text: 'Create scoped keys and webhook destinations for developer workflows.', icon: KeyRound, href: '/dashboard/api' },
  { title: 'Notifications', text: 'OTP, rental expiration, billing, and account security alerts.', icon: Bell, href: '/dashboard/support' },
  { title: 'Privacy defaults', text: 'Keep no-logs posture, reduced exposure, and security checks top of mind.', icon: LockKeyhole, href: '/privacy' },
];

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-green/25 bg-brand-green/10">
              <UserRound className="h-6 w-6 text-brand-green" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-green">Settings and profile</p>
              <h1 className="mt-1 text-2xl font-bold">{user?.fullName || 'Burner Point user'}</h1>
              <p className="mt-1 text-sm text-brand-muted">{user?.primaryEmailAddress?.emailAddress || 'Secure Burner Point session'}</p>
            </div>
          </div>
          <Link href="/dashboard/support" className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/72 hover:border-brand-green/35 hover:text-white">
            Support
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="rounded-bp-lg border border-brand-border bg-brand-card p-5 transition hover:border-brand-green/35 hover:bg-brand-green/[0.04]">
              <Icon className="h-5 w-5 text-brand-green" />
              <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted">{item.text}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
