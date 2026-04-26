'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  Bell,
  CreditCard,
  HelpCircle,
  KeyRound,
  LogOut,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { BpTabs } from '@/components/design-system';

export default function SettingsPage() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-brand-green/24 bg-brand-green/10">
              <UserRound className="h-6 w-6 text-brand-green" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Settings</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{user?.fullName || 'Burner Point account'}</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">
                Manage profile details, billing, API access, support paths, and secure account controls from one settings index.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border border-white/10 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:border-red-300/40 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="mt-5">
          <BpTabs
            active={pathname === '/dashboard/profile' ? '/dashboard/profile' : '/dashboard/settings'}
            tabs={[
              { label: 'Profile', href: '/dashboard/profile' },
              { label: 'Billing & Subscription', href: '/dashboard/billing' },
              { label: 'Advanced Access', href: '/dashboard/api' },
              { label: 'Support', href: '/dashboard/support' },
              { label: 'Account', href: '/dashboard/settings' },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Profile</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">First name</p>
              <p className="mt-2 text-white">{user?.firstName || 'Add in profile'}</p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Last name</p>
              <p className="mt-2 text-white">{user?.lastName || 'Add in profile'}</p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Email</p>
              <p className="mt-2 text-white">{user?.primaryEmailAddress?.emailAddress || 'Secure email required'}</p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Phone</p>
              <p className="mt-2 text-white">{user?.primaryPhoneNumber?.phoneNumber || 'Add in profile and verify'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/profile" className="rounded-[0.95rem] bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]">
              Edit Profile
            </Link>
            <Link href="/dashboard/security" className="rounded-[0.95rem] border border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-brand-green/20 hover:text-brand-green">
              Manage 2FA
            </Link>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Notification preferences</h3>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              'Balance changes and successful top-ups',
              'Rental expiry and renewal reminders',
              'Verification results and support replies',
            ].map((item) => (
              <div key={item} className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/62">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-white/50">
            Notification controls are surfaced here while Clerk manages the secure account channel settings used for sign-in, recovery, and 2FA.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Billing & Subscription</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/billing" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Wallet balance</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Review funding history, invoices, and active subscriptions.</p>
            </Link>
            <Link href="/dashboard/credits" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Deposit options</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Fund the wallet for usage-based products and renewals.</p>
            </Link>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Advanced Access</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/api" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Access keys</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Generate and revoke scoped keys for approved private workflows.</p>
            </Link>
            <Link href="/dashboard/webhooks" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Event delivery</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Configure outbound event delivery and signing secrets.</p>
            </Link>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Support</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/support" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Create ticket</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Open a scoped support request with account, billing, or product context.</p>
            </Link>
            <a href="https://t.me/burnerpoint" target="_blank" rel="noreferrer" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Telegram support</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Reach the support channel without leaving the Burner Point support surface.</p>
            </a>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Legal</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/terms-of-service" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Terms of Service</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Review the current Burner Point terms effective April 23, 2026.</p>
            </Link>
            <Link href="/privacy-policy" className="rounded-[1rem] border border-white/8 bg-black/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Privacy Policy</p>
              <p className="mt-2 text-sm leading-6 text-white/50">See how Burner Point collects, uses, and protects account data.</p>
            </Link>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-red-300/16 bg-red-500/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-red-300" />
            <h3 className="text-base font-semibold text-white">Account</h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/58">
            Sign out from this device at any time. Destructive account deletion should remain gated behind a dedicated confirmed flow once full account deletion is available.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: '/' })}
              className="rounded-[0.95rem] bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
            >
              Sign Out
            </button>
            <button
              type="button"
              disabled
              className="rounded-[0.95rem] border border-red-300/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-200/70"
            >
              Delete Account
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
