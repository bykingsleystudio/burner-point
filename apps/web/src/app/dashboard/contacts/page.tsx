'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MessageSquareText, Phone, Search, ShieldCheck, Users } from 'lucide-react';
import { messagesApi, numbersApi } from '@/lib/api';
import { MessengerTabs } from '@/components/dashboard/messenger-tabs';
import { BpEmptyState } from '@/components/design-system';

type NumberRecord = {
  id: string;
  number: string;
  type?: string;
};

type MessageRecord = {
  id: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
};

type ContactRecord = {
  id: string;
  number: string;
  messageCount: number;
  linkedNumbers: string[];
  lastActivity: string;
};

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadContacts() {
      try {
        const numbersResponse = await numbersApi.list();
        const numbers: NumberRecord[] = Array.isArray(numbersResponse.data) ? numbersResponse.data : [];

        const messageResponses = await Promise.all(
          numbers.map(async (number) => {
            const response = await messagesApi.list(number.id);
            return {
              number,
              messages: Array.isArray(response.data) ? response.data : [],
            };
          }),
        );

        if (!mounted) return;

        const grouped = new Map<string, ContactRecord>();

        for (const { number, messages } of messageResponses as Array<{ number: NumberRecord; messages: MessageRecord[] }>) {
          for (const message of messages) {
            const counterpart = message.direction === 'outbound' ? message.to : message.from;
            const current = grouped.get(counterpart) ?? {
              id: counterpart,
              number: counterpart,
              messageCount: 0,
              linkedNumbers: [],
              lastActivity: message.createdAt,
            };

            current.messageCount += 1;
            current.lastActivity = new Date(message.createdAt).getTime() > new Date(current.lastActivity).getTime()
              ? message.createdAt
              : current.lastActivity;

            if (!current.linkedNumbers.includes(number.number)) {
              current.linkedNumbers.push(number.number);
            }

            grouped.set(counterpart, current);
          }
        }

        setContacts(
          [...grouped.values()].sort(
            (left, right) => new Date(right.lastActivity).getTime() - new Date(left.lastActivity).getTime(),
          ),
        );
      } catch {
        if (mounted) toast.error('Unable to load BP Messenger contacts.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadContacts();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return contacts;
    return contacts.filter((contact) =>
      [contact.number, ...contact.linkedNumbers].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [contacts, query]);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Messenger</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Contacts that stay linked to private communication history.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Use Contacts to search the numbers you already communicate with through BP Messenger. Each contact remains anchored to the Burner Point lines that have handled that conversation.
        </p>
        <div className="mt-5">
          <MessengerTabs active="/dashboard/contacts" />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search contacts</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-green" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contact number or linked Burner Point line"
              className="bp-input pl-11"
            />
          </label>
          <div className="rounded-[1rem] border border-brand-green/18 bg-brand-green/[0.06] px-4 py-3 text-sm text-white/60">
            {loading ? 'Loading contacts...' : `${filteredContacts.length} contacts in BP Messenger`}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[1.4rem] border border-white/8 bg-brand-card" />)
          ) : filteredContacts.length ? (
            filteredContacts.map((contact) => (
              <article key={contact.id} className="rounded-[1.4rem] border border-white/8 bg-brand-card p-5 transition hover:border-brand-green/24 hover:bg-brand-green/[0.04]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                      <Users className="h-5 w-5 text-brand-green" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">{contact.number}</p>
                      <p className="mt-1 text-sm text-white/46">
                        {contact.messageCount} message event{contact.messageCount === 1 ? '' : 's'} across {contact.linkedNumbers.length} Burner Point line{contact.linkedNumbers.length === 1 ? '' : 's'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {contact.linkedNumbers.map((item) => (
                          <span key={item} className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[11px] text-white/52">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/dashboard/messenger"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.95rem] border border-white/10 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/20 hover:text-brand-green"
                    >
                      <MessageSquareText className="h-4 w-4" />
                      Message
                    </Link>
                    <Link
                      href="/dashboard/calls"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.95rem] border border-white/10 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/20 hover:text-brand-green"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <BpEmptyState
              title="No contacts yet"
              text="As soon as BP Messenger has inbound or outbound threads, the counterpart numbers will appear here so you can search and reuse them."
              action={
                <Link
                  href="/dashboard/messenger"
                  className="rounded-[0.95rem] bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
                >
                  Open BP Messenger
                </Link>
              }
            />
          )}
        </div>

        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <ShieldCheck className="h-6 w-6 text-brand-green" />
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-white">Contact detail view</h3>
          <p className="mt-3 text-sm leading-6 text-white/52">
            Contact editing, save, delete, and block actions belong here once first-class contact controls are enabled for the account.
          </p>
          <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-white/48">
            This screen already reads live conversation relationships. The next step is wiring a first-class contact record layer on top of those threads.
          </div>
        </aside>
      </section>
    </div>
  );
}
