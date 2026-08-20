'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Trash2,
  UserRound,
  Save,
} from 'lucide-react';
import { BpTabs } from '@/components/design-system';
import { authApi, clearApiSession, supportApi, usersApi } from '@/lib/api';
import { SUPPORT_EMAIL_HREF, TELEGRAM_SUPPORT_URL } from '@/lib/support';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { useTheme, type ThemePreference } from '@/components/theme-provider';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function SettingsPage() {
  const pathname = usePathname();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const { preference, setPreference } = useTheme();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installReady, setInstallReady] = useState(false);
  const [notifications, setNotifications] = useState({ balance: true, expiry: true, support: true });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      (window as Window & { bpInstallPrompt?: BeforeInstallPromptEvent }).bpInstallPrompt = promptEvent;
      setInstallPrompt(promptEvent);
      setInstallReady(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setInstallReady(false);
      (window as Window & { bpInstallPrompt?: BeforeInstallPromptEvent }).bpInstallPrompt = undefined;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const existingPrompt = (window as Window & { bpInstallPrompt?: BeforeInstallPromptEvent }).bpInstallPrompt;
    if (existingPrompt) {
      setInstallPrompt(existingPrompt);
      setInstallReady(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = installPrompt ?? (window as Window & { bpInstallPrompt?: BeforeInstallPromptEvent }).bpInstallPrompt;
    if (!promptEvent) return;

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallReady(false);
    }
    setInstallPrompt(null);
    (window as Window & { bpInstallPrompt?: BeforeInstallPromptEvent }).bpInstallPrompt = undefined;
  };

  useEffect(() => {
    const stored = (user as { preferences?: { notifications?: Partial<typeof notifications> } } | null)?.preferences?.notifications;
    if (stored) setNotifications((current) => ({ ...current, ...stored }));
  }, [user]);

  const saveNotifications = async (next: typeof notifications) => {
    setNotifications(next);
    try {
      await usersApi.update({ preferences: { notifications: next } });
      toast.success('Notification preferences saved.');
    } catch { toast.error('Unable to save notification preferences.'); }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8 || password !== confirmPassword) { toast.error('Enter matching passwords with at least 8 characters.'); return; }
    setSavingAccount(true);
    try { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; setPassword(''); setConfirmPassword(''); toast.success('Password changed.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to change password.'); }
    finally { setSavingAccount(false); }
  };

  const requestClosure = async () => {
    if (closureReason.trim().length < 10) { toast.error('Tell support why you want to close the account.'); return; }
    setSavingAccount(true);
    try { await supportApi.createTicket({ category: 'account', subject: 'Account closure request', message: closureReason.trim(), priority: 'high' }); toast.success('Account closure request sent to support.'); setClosureReason(''); }
    catch { toast.error('Unable to submit the closure request.'); }
    finally { setSavingAccount(false); }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete this account? This cannot be undone.')) return;
    setSavingAccount(true);
    try { await usersApi.delete(); await handleSignOut(); }
    catch { toast.error('Unable to delete the account. Submit a closure request instead.'); setSavingAccount(false); }
  };

  const handleSignOut = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // best-effort logout
    } finally {
      clearAuth();
      clearApiSession();
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

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
              <h2 className="mt-2 text-3xl font-semibold text-white">{fullName || 'Burner Point account'}</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">
                Manage profile details, billing, support paths, and secure account controls from one settings index.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
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
            <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">First name</p>
              <p className="mt-2 text-white">{user?.firstName || 'Add in profile'}</p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Last name</p>
              <p className="mt-2 text-white">{user?.lastName || 'Add in profile'}</p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Email</p>
              <p className="mt-2 text-white">{user?.email || 'Secure email required'}</p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Phone</p>
              <p className="mt-2 text-white">{user?.phoneNumber || 'Add in profile and verify'}</p>
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

        <article className="rounded-[1.5rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-5">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-brand-green" />
            <div>
              <h3 className="text-base font-semibold">Appearance</h3>
              <p className="mt-1 text-sm bp-dashboard-muted">Choose how Burner Point looks on this device.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme preference">
            {(['light', 'dark', 'system'] as ThemePreference[]).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={preference === option}
                onClick={() => setPreference(option)}
                className={`min-h-11 rounded-[0.85rem] border px-3 text-xs font-semibold capitalize transition ${
                  preference === option
                    ? 'border-brand-green/40 bg-brand-green/10 text-brand-green'
                    : 'border-[var(--bp-border-subtle)] bg-[var(--bp-surface-muted)] text-[var(--bp-foreground-muted)] hover:border-brand-green/25'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {installReady ? (
            <button
              type="button"
              onClick={() => void handleInstallApp()}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[0.85rem] border border-brand-green/30 bg-brand-green/12 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-green transition hover:bg-brand-green/18"
            >
              Install Burner Point
            </button>
          ) : null}
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Notification preferences</h3>
          </div>
          <div className="mt-4 grid gap-3">
            {[['balance', 'Balance changes and successful top-ups'], ['expiry', 'Rental expiry and renewal reminders'], ['support', 'Verification results and support replies']].map(([key, item]) => (
              <label key={key} className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-3 text-sm text-white/62"><span>{item}</span><input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(event) => void saveNotifications({ ...notifications, [key]: event.target.checked })} className="bp-auth-checkbox h-4 w-4" /></label>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-white/50">Changes apply to this account across supported product notifications.</p>
        </article>

        <article className="rounded-[1.5rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-5">
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-brand-green" /><h3 className="text-base font-semibold">Password</h3></div>
          <form onSubmit={changePassword} className="mt-4 space-y-3"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="bp-input" placeholder="New password" autoComplete="new-password" /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="bp-input" placeholder="Confirm new password" autoComplete="new-password" /><button type="submit" disabled={savingAccount} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black disabled:opacity-50"><Save className="h-4 w-4" />Change password</button></form>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Billing & Subscription</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/wallet" className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Wallet balance</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Review funding history, invoices, and active subscriptions.</p>
            </Link>
            <Link href="/dashboard/wallet" className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Deposit options</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Fund the wallet for usage-based products and renewals.</p>
            </Link>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-brand-green" />
            <h3 className="text-base font-semibold text-white">Support</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/support" className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Create ticket</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Open a scoped support request with account, billing, or product context.</p>
            </Link>
            <a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noreferrer" className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
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
            <Link href="/terms-of-service" className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
              <p className="text-sm font-semibold text-white">Terms of Service</p>
              <p className="mt-2 text-sm leading-6 text-white/50">Review the current Burner Point terms effective April 23, 2026.</p>
            </Link>
            <Link href="/privacy-policy" className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.04]">
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
            Sign out from this device, request account closure from support, or permanently delete the account after confirmation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-[0.95rem] bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
            >
              Sign Out
            </button>
            <Link
              href={SUPPORT_EMAIL_HREF}
              className="rounded-[0.95rem] border border-red-300/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-200/80 transition hover:border-red-200/45 hover:text-red-100"
            >
              Account Closure Request
            </Link>
            <textarea value={closureReason} onChange={(event) => setClosureReason(event.target.value)} className="bp-input min-h-20 w-full" placeholder="Reason for closure request" />
            <button type="button" onClick={() => void requestClosure()} disabled={savingAccount} className="rounded-[0.95rem] border border-red-300/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-200/80 disabled:opacity-50">Submit Closure Request</button>
            <button type="button" onClick={() => void deleteAccount()} disabled={savingAccount} className="rounded-[0.95rem] bg-red-500/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-200 disabled:opacity-50">Delete Account</button>
          </div>
        </article>
      </section>
    </div>
  );
}
