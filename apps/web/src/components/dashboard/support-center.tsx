'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Headphones, LifeBuoy, Mail, MessageSquareMore, ShieldCheck, Ticket } from 'lucide-react';
import { BpEmptyState } from '@/components/design-system';
import { supportApi } from '@/lib/api';
import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
  TELEGRAM_SUPPORT_HANDLE,
  TELEGRAM_SUPPORT_URL,
} from '@/lib/support';

type SupportCategory =
  | 'account'
  | 'billing'
  | 'verification'
  | 'rental'
  | 'messenger'
  | 'esim'
  | 'proxy'
  | 'vpn'
  | 'security'
  | 'other';

type SupportPriority = 'normal' | 'high' | 'urgent';

type SupportTicketRecord = {
  id: string;
  ticketNumber: string;
  category: SupportCategory;
  product?: string | null;
  subject: string;
  message: string;
  priority: SupportPriority;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reference?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const CATEGORY_OPTIONS: Array<{ value: SupportCategory; label: string }> = [
  { value: 'verification', label: 'Verification' },
  { value: 'rental', label: 'Rentals' },
  { value: 'messenger', label: 'BP Messenger' },
  { value: 'billing', label: 'Billing' },
  { value: 'esim', label: 'eSIM' },
  { value: 'proxy', label: 'Proxy' },
  { value: 'vpn', label: 'Secure Tunnel' },
  { value: 'account', label: 'Account' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS: Array<{ value: SupportPriority; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function prettyStatus(status: SupportTicketRecord['status']) {
  switch (status) {
    case 'in_progress':
      return 'In progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    case 'open':
    default:
      return 'Open';
  }
}

function statusClasses(status: SupportTicketRecord['status']) {
  switch (status) {
    case 'resolved':
      return 'border-brand-green/25 bg-brand-green/10 text-brand-green';
    case 'closed':
      return 'border-white/10 bg-white/[0.04] text-white/60';
    case 'in_progress':
      return 'border-[#9FA6B2]/25 bg-[#9FA6B2]/10 text-[#E5E7EB]';
    case 'open':
    default:
      return 'border-[#39FF14]/20 bg-[#39FF14]/10 text-[#39FF14]';
  }
}

export function SupportCenter({ fullHistory = false }: { fullHistory?: boolean }) {
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: 'verification' as SupportCategory,
    product: 'BP Verify Hub',
    subject: '',
    message: '',
    priority: 'normal' as SupportPriority,
    reference: '',
  });

  useEffect(() => {
    let mounted = true;

    supportApi.tickets()
      .then((response) => {
        if (!mounted) return;
        setTickets(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (mounted) toast.error('Unable to load support tickets.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleTickets = useMemo(
    () => (fullHistory ? tickets : tickets.slice(0, 6)),
    [fullHistory, tickets],
  );

  const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await supportApi.createTicket({
        category: form.category,
        product: form.product || undefined,
        subject: form.subject,
        message: form.message,
        priority: form.priority,
        reference: form.reference || undefined,
      });

      setTickets((current) => [response.data, ...current]);
      setForm({
        category: 'verification',
        product: 'BP Verify Hub',
        subject: '',
        message: '',
        priority: 'normal',
        reference: '',
      });
      toast.success(`Support ticket ${response.data.ticketNumber} created.`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to create the support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Support</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {fullHistory ? 'Ticket history and support channels.' : 'Open a ticket and keep support scoped.'}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Use clear product references, timestamps, and payment or order IDs when they exist. Burner Point support stays focused on account access, billing, delivery failures, rentals, connectivity, and privacy-safe recovery.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <form onSubmit={submitTicket} className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-white/68">
              Category
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as SupportCategory }))}
                className="bp-input mt-2"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/68">
              Priority
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as SupportPriority }))}
                className="bp-input mt-2"
              >
                {PRIORITY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/68">
              Product
              <input
                value={form.product}
                onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))}
                className="bp-input mt-2"
                maxLength={80}
                placeholder="BP Verify Hub"
              />
            </label>

            <label className="block text-sm text-white/68">
              Reference
              <input
                value={form.reference}
                onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                className="bp-input mt-2"
                maxLength={120}
                placeholder="Payment, order, or number reference"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm text-white/68">
            Subject
            <input
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              className="bp-input mt-2"
              maxLength={140}
              required
              placeholder="Describe the issue in one line"
            />
          </label>

          <label className="mt-4 block text-sm text-white/68">
            Message
            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="bp-input mt-2 min-h-40 resize-y"
              maxLength={4000}
              required
              placeholder="What happened, when it happened, and what you expected instead."
            />
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-white/42">
              Do not include passwords, OTP codes, or payment card details.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 items-center justify-center rounded-[1rem] bg-brand-green px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
            >
              {submitting ? 'Creating ticket...' : 'Create Support Ticket'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Direct channels</p>
            <div className="mt-4 space-y-3">
              <a href={SUPPORT_EMAIL_HREF} className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/24 hover:bg-brand-green/[0.04]">
                <span>
                  <p className="text-sm font-semibold text-white">Email support</p>
                  <p className="mt-1 text-sm text-white/46">{SUPPORT_EMAIL}</p>
                </span>
                <Mail className="h-4 w-4 text-brand-green" />
              </a>
              <a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 transition hover:border-brand-green/24 hover:bg-brand-green/[0.04]">
                <span>
                  <p className="text-sm font-semibold text-white">Telegram support</p>
                  <p className="mt-1 text-sm text-white/46">{TELEGRAM_SUPPORT_HANDLE}</p>
                </span>
                <MessageSquareMore className="h-4 w-4 text-brand-green" />
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-green/18 bg-brand-green/[0.05] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-brand-green" />
              <div>
                <p className="text-sm font-semibold text-white">Support best practices</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-white/62">
                  <li>Use one ticket per issue.</li>
                  <li>Include the affected number, order, or payment reference.</li>
                  <li>Keep screenshots limited to the exact error or status surface.</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Ticket queue</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {fullHistory ? 'Full support history' : 'Recent support history'}
            </h2>
          </div>
          {!fullHistory ? (
            <Link href="/dashboard/support/tickets" className="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/24 hover:text-brand-green">
              View All Tickets
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-[1.2rem] border border-white/8 bg-[#020806]/20" />
            ))}
          </div>
        ) : visibleTickets.length ? (
          <div className="mt-5 grid gap-3">
            {visibleTickets.map((ticket) => (
              <article key={ticket.id} className="rounded-[1.2rem] border border-white/8 bg-[#020806]/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[1rem] border border-brand-green/18 bg-brand-green/10">
                      <Ticket className="h-5 w-5 text-brand-green" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-white">{ticket.subject}</p>
                        <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${statusClasses(ticket.status)}`}>
                          {prettyStatus(ticket.status)}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-brand-green">{ticket.ticketNumber}</p>
                      <p className="mt-2 text-sm leading-6 text-white/56">{ticket.message}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-white/58 md:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/8 bg-[#020806]/24 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Category</p>
                      <p className="mt-2 text-white">{ticket.product || ticket.category}</p>
                    </div>
                    <div className="rounded-[1rem] border border-white/8 bg-[#020806]/24 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Reference</p>
                      <p className="mt-2 text-white">{ticket.reference || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/42">
                  <span className="inline-flex items-center gap-2"><LifeBuoy className="h-3.5 w-3.5" /> Priority: {ticket.priority}</span>
                  <span className="inline-flex items-center gap-2"><Headphones className="h-3.5 w-3.5" /> Updated: {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'Pending'}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <BpEmptyState
              title="No support tickets yet"
              text="Create your first ticket from the form above and it will appear here with its support reference and status."
            />
          </div>
        )}
      </section>
    </div>
  );
}
