'use client';

import { UserProfile } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Clerk security</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white">Security and 2FA</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
              Manage password, email, phone, connected accounts, active sessions, and multifactor authentication through Clerk.
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-bp-lg border border-brand-border bg-brand-card p-2">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: 'w-full',
              cardBox: 'w-full bg-transparent shadow-none',
              navbar: 'bg-black/20',
              pageScrollBox: 'bg-transparent',
            },
            variables: {
              colorPrimary: '#00FF9D',
              colorBackground: '#07140F',
              colorText: '#E5E7EB',
              colorTextSecondary: '#9FA6B2',
              borderRadius: '8px',
            },
          }}
        />
      </section>
    </div>
  );
}
