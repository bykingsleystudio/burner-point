'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Phone, Plus, Search, ShieldCheck, Users } from 'lucide-react';

const CONTACTS = [
  {
    id: 'marketplace-buyer',
    name: 'Marketplace Buyer',
    alias: 'Short-term listing',
    number: '+1 415 555 0182',
    route: 'US/CA Conversation',
    status: 'verified',
    lastActivity: 'SMS and MMS ready',
  },
  {
    id: 'travel-support',
    name: 'Travel Support',
    alias: 'Trip recovery line',
    number: '+44 20 7946 0482',
    route: 'Global verification',
    status: 'active',
    lastActivity: 'Voice OTP capable',
  },
  {
    id: 'private-work',
    name: 'Private Work Line',
    alias: 'Client communication',
    number: '+1 647 555 0198',
    route: 'US/CA Conversation',
    status: 'active',
    lastActivity: 'Calls, voicemail, SMS',
  },
  {
    id: 'social-recovery',
    name: 'Social Recovery',
    alias: 'Account access',
    number: '+1 212 555 0144',
    route: 'Renewable rental',
    status: 'renewal',
    lastActivity: 'Expires soon',
  },
];

const ROUTES = ['All', 'US/CA Conversation', 'Global verification', 'Renewable rental'];

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const [route, setRoute] = useState('All');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return CONTACTS.filter((contact) => {
      const matchesRoute = route === 'All' || contact.route === route;
      const matchesQuery = !normalized || [contact.name, contact.alias, contact.number, contact.route]
        .some((value) => value.toLowerCase().includes(normalized));
      return matchesRoute && matchesQuery;
    });
  }, [query, route]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Contacts</p>
            <h1 className="mt-2 text-3xl font-black uppercase leading-none text-white md:text-5xl">
              Private address book.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted">
              Save aliases, assign routes, and keep calls, SMS, MMS, photos, and voicemail tied to the burner number you choose.
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Contact creation will save alias, route, phone number, notes, and preferred burner number through the backend contacts endpoint.')}
            className="bp-primary-action inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search contacts</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-green" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search alias, number, or route"
              className="bp-input pl-11"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Contact route filters">
            {ROUTES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRoute(item)}
                className={`min-h-12 rounded-bp border px-4 py-2 text-xs font-semibold uppercase transition ${
                  route === item
                    ? 'border-brand-green bg-brand-green/10 text-brand-green'
                    : 'border-white/10 text-white/54 hover:border-brand-green/30 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.42fr]">
        <div className="space-y-3">
          {filtered.map((contact) => (
            <article key={contact.id} className="rounded-bp-lg border border-brand-border bg-brand-card p-5 transition hover:border-brand-green/30 hover:bg-brand-green/[0.035]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-bp-md border border-brand-green/20 bg-brand-green/10">
                    <Users className="h-5 w-5 text-brand-green" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold uppercase text-white">{contact.name}</h2>
                      <span className="rounded-bp border border-brand-green/18 bg-brand-green/8 px-2 py-1 font-mono text-[10px] uppercase text-brand-green">
                        {contact.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-brand-muted">{contact.alias}</p>
                    <p className="mt-2 font-mono text-sm text-white/76">{contact.number}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/40">{contact.route} - {contact.lastActivity}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/dashboard/calls" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-bp border border-white/10 px-4 py-2 text-xs font-semibold uppercase text-white/70 transition hover:border-brand-green/32 hover:text-brand-green">
                    <Phone className="h-4 w-4" />
                    Call
                  </Link>
                  <Link href="/dashboard/inbox" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-bp border border-white/10 px-4 py-2 text-xs font-semibold uppercase text-white/70 transition hover:border-brand-green/32 hover:text-brand-green">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-bp-lg border border-brand-green/16 bg-brand-green/[0.045] p-5">
          <ShieldCheck className="h-6 w-6 text-brand-green" />
          <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-white">Implementation Direction</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-white/64">
            <p>Contacts should store aliases first, with legal names optional. Each contact can be assigned a preferred Burner Point number for calls, SMS, MMS, photos, and voicemail.</p>
            <p>Production backend should add contacts, contact notes, route preference, blocked state, last activity, and audit events before enabling sync across web and mobile.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
