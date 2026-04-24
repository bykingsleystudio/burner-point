'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Delete, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOutgoing, Voicemail } from 'lucide-react';
import { MessengerTabs } from '@/components/dashboard/messenger-tabs';
import { BpEmptyState } from '@/components/design-system';

const FILTERS = [
  { value: 'all', label: 'All', icon: PhoneCall },
  { value: 'missed', label: 'Missed', icon: PhoneMissed },
  { value: 'incoming', label: 'Incoming', icon: PhoneIncoming },
  { value: 'outgoing', label: 'Outgoing', icon: PhoneOutgoing },
] as const;

export default function CallsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');
  const [dialValue, setDialValue] = useState('');

  const keypad = useMemo(
    () => [
      ['1', ''],
      ['2', 'ABC'],
      ['3', 'DEF'],
      ['4', 'GHI'],
      ['5', 'JKL'],
      ['6', 'MNO'],
      ['7', 'PQRS'],
      ['8', 'TUV'],
      ['9', 'WXYZ'],
      ['*', ''],
      ['0', '+'],
      ['#', ''],
    ],
    [],
  );

  const appendDigit = (value: string) => setDialValue((current) => `${current}${value}`);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Messenger</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Call logs, voicemail, and manual dialing in one call surface.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Use the Calls tab to review missed activity, prepare outbound dialing, and keep voicemail tied to the same private communication identity you use for BP Messenger.
        </p>
        <div className="mt-5">
          <MessengerTabs active="/dashboard/calls" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Call logs</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Filter inbound, outgoing, and missed activity.</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => {
                const Icon = item.icon;
                const active = filter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.95rem] border px-4 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                      active
                        ? 'border-brand-green/24 bg-brand-green/[0.08] text-brand-green'
                        : 'border-white/8 bg-black/20 text-white/58 hover:border-brand-green/20 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <BpEmptyState
              title="No call events yet"
              text={`BP Messenger will show ${filter === 'all' ? 'all conversation call events' : `${filter} call events`} here once calling activity is routed through an active conversation number.`}
              action={
                <Link
                  href="/dashboard/inbox"
                  className="rounded-[0.95rem] bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
                >
                  Open BP Messenger
                </Link>
              }
            />
          </div>

          <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                <Voicemail className="h-5 w-5 text-brand-green" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Voicemail</p>
                <p className="text-sm text-white/48">Playback, transcripts, and callbacks stay attached to the same private number.</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/24 p-4 text-sm leading-6 text-white/50">
              No voicemail recordings are available yet. When a line receives missed calls, playback and callback actions will appear here.
            </div>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Dial keypad</p>
          <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/20 px-4 py-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/38">Dialed number</p>
            <p className="mt-3 min-h-[2.5rem] break-all font-mono text-2xl text-white">
              {dialValue || 'Enter number'}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {keypad.map(([value, letters]) => (
              <button
                key={value}
                type="button"
                onClick={() => appendDigit(value)}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-3 py-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.05]"
              >
                <p className="font-mono text-xl text-white">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/34">{letters || '\u00A0'}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setDialValue((current) => current.slice(0, -1))}
              className="flex min-h-12 flex-1 items-center justify-center rounded-[1rem] border border-white/10 text-sm font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/20 hover:text-white"
            >
              <Delete className="mr-2 h-4 w-4" />
              Delete
            </button>
            <button
              type="button"
              disabled={!dialValue}
              className="flex min-h-12 flex-1 items-center justify-center rounded-[1rem] bg-brand-green text-sm font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
            >
              <PhoneCall className="mr-2 h-4 w-4" />
              Dial
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-white/48">
            Manual dialing is prepared here so voice-enabled Burner Point lines can initiate calls once call routing is active for your account.
          </p>
        </aside>
      </section>
    </div>
  );
}
