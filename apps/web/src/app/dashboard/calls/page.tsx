'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Delete,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Voicemail,
} from 'lucide-react';
import { callCreditsApi, callsApi, numbersApi } from '@/lib/api';
import { formatUsdCents } from '@/lib/money';
import { MessengerTabs } from '@/components/dashboard/messenger-tabs';
import { BpEmptyState } from '@/components/design-system';

const FILTERS = [
  { value: 'all', label: 'All', icon: PhoneCall },
  { value: 'missed', label: 'Missed', icon: PhoneMissed },
  { value: 'incoming', label: 'Incoming', icon: PhoneIncoming },
  { value: 'outgoing', label: 'Outgoing', icon: PhoneOutgoing },
] as const;

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'busy', 'no-answer', 'canceled']);

type NumberRecord = {
  id: string;
  number: string;
  status?: string;
  type?: string;
  countryCode?: string;
};

type CallCreditsBalance = {
  wallet?: {
    balanceUsdCents: number;
  };
  callCredits?: {
    balance: number;
    availableBalance: number;
    equivalentUsdCents: number;
  };
};

type CallRate = {
  id: string;
  destinationCountry: string;
  destinationPrefix?: string | null;
  creditsPerMinute: number;
};

type CallRecord = {
  id: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  direction: 'inbound' | 'outbound';
  destinationCountry: string;
  durationSeconds: number;
  billableSeconds: number;
  creditsLocked: number;
  creditsSpent: number;
  failureReason?: string | null;
  providerCallId?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
  answeredAt?: string | null;
  completedAt?: string | null;
};

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[^\d+]/g, '');
  if (!compact) return '';
  const normalized = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  return normalized.startsWith('+')
    ? `+${normalized.slice(1).replace(/\+/g, '')}`
    : normalized.replace(/\+/g, '');
}

function formatDuration(seconds: number) {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (!mins) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

function matchRate(destinationNumber: string, rates: CallRate[]) {
  const normalized = normalizePhone(destinationNumber);
  if (!normalized) return null;

  return [...rates]
    .sort((left, right) => (right.destinationPrefix?.length ?? 0) - (left.destinationPrefix?.length ?? 0))
    .find((rate) => rate.destinationPrefix && normalized.startsWith(rate.destinationPrefix))
    ?? rates.find((rate) => rate.destinationCountry === 'GLOBAL')
    ?? null;
}

export default function CallsPage() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');
  const [dialValue, setDialValue] = useState('');
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [callCreditsBalance, setCallCreditsBalance] = useState<CallCreditsBalance | null>(null);
  const [rates, setRates] = useState<CallRate[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [startingCall, setStartingCall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);

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

  const loadCallData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      numbersApi.list(),
      callCreditsApi.balance(),
      callCreditsApi.rates(),
      callsApi.list(1, 20),
    ]);

    if (results[0].status === 'fulfilled') {
      const nextNumbers = results[0].value.data ?? [];
      setNumbers(nextNumbers);
      setSelectedNumberId((current) => current ?? nextNumbers[0]?.id ?? null);
    }
    if (results[1].status === 'fulfilled') {
      setCallCreditsBalance(results[1].value.data);
    }
    if (results[2].status === 'fulfilled') {
      setRates(results[2].value.data ?? []);
    }
    if (results[3].status === 'fulfilled') {
      const nextCalls = results[3].value.data?.calls ?? [];
      setCalls(nextCalls);
      const currentActive = nextCalls.find((item: CallRecord) => !TERMINAL_STATUSES.has(item.status));
      setActiveCall(currentActive ?? null);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadCallData();
  }, []);

  useEffect(() => {
    const to = searchParams.get('to');
    if (to) {
      setDialValue(normalizePhone(to));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeCall?.id || TERMINAL_STATUSES.has(activeCall.status)) return;

    const interval = window.setInterval(async () => {
      try {
        const response = await callsApi.get(activeCall.id);
        const nextCall = response.data as CallRecord;
        setActiveCall(nextCall);
        setCalls((current) => current.map((item) => (item.id === nextCall.id ? nextCall : item)));
        if (TERMINAL_STATUSES.has(nextCall.status)) {
          await loadCallData();
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeCall?.id, activeCall?.status]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<CallRecord>).detail;
      if (!detail?.id) return;
      setCalls((current) => {
        const existing = current.find((item) => item.id === detail.id);
        if (!existing) return [detail, ...current];
        return current.map((item) => (item.id === detail.id ? detail : item));
      });
      setActiveCall((current) => (current?.id === detail.id || !current ? detail : current));
    };

    window.addEventListener('bp:call-updated', handler as EventListener);
    return () => window.removeEventListener('bp:call-updated', handler as EventListener);
  }, []);

  const appendDigit = (value: string) => setDialValue((current) => `${current}${value}`);
  const matchedRate = useMemo(() => matchRate(dialValue, rates), [dialValue, rates]);
  const selectedNumber = useMemo(() => numbers.find((item) => item.id === selectedNumberId) ?? null, [numbers, selectedNumberId]);

  const estimatedMinutes = useMemo(() => {
    const credits = callCreditsBalance?.callCredits?.availableBalance ?? 0;
    const creditsPerMinute = matchedRate?.creditsPerMinute ?? 0;
    if (!credits || !creditsPerMinute) return 0;
    return Math.floor(credits / creditsPerMinute);
  }, [callCreditsBalance?.callCredits?.availableBalance, matchedRate?.creditsPerMinute]);

  const filteredCalls = useMemo(() => {
    if (filter === 'all') return calls;
    if (filter === 'incoming') return calls.filter((item) => item.direction === 'inbound');
    if (filter === 'outgoing') return calls.filter((item) => item.direction === 'outbound');
    return calls.filter((item) => ['failed', 'busy', 'no-answer', 'canceled'].includes(item.status));
  }, [calls, filter]);

  const startCall = async () => {
    if (!selectedNumberId) {
      toast.error('Choose an active BP Messenger number before calling.');
      return;
    }

    const normalizedNumber = normalizePhone(dialValue);
    if (!normalizedNumber) {
      toast.error('Enter the destination number in international format.');
      return;
    }

    setStartingCall(true);
    try {
      const response = await callsApi.start({
        to: normalizedNumber,
        fromNumberId: selectedNumberId,
        idempotencyKey: crypto.randomUUID(),
      });
      const nextCall = response.data?.call as CallRecord;
      const nextRate = response.data?.rate as CallRate | undefined;
      if (nextCall) {
        setActiveCall(nextCall);
        setCalls((current) => [nextCall, ...current.filter((item) => item.id !== nextCall.id)]);
      }
      if (nextRate) {
        setRates((current) => {
          if (current.find((item) => item.id === nextRate.id)) return current;
          return current;
        });
      }
      await loadCallData();
      toast.success(`Calling ${normalizedNumber} at ${response.data?.rate?.creditsPerMinute ?? matchedRate?.creditsPerMinute ?? 0} credits/min.`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? 'Unable to start this outbound call right now.');
    } finally {
      setStartingCall(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Messenger Calls</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Call history, dialing, and Call Credits stay inside one private voice surface.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
              Outbound international and premium calls use BP Messenger Call Credits only. Subscriptions unlock access, your wallet buys Call Credits, and completed calls debit credits from actual provider duration.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/38">Call Credits</p>
              <p className="mt-2 text-xl font-semibold text-white">{callCreditsBalance?.callCredits?.availableBalance ?? 0}</p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/38">Wallet</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatUsdCents(callCreditsBalance?.wallet?.balanceUsdCents)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <MessengerTabs active="/dashboard/calls" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {activeCall ? (
            <div className="rounded-[1.5rem] border border-brand-green/16 bg-brand-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Active Call</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{activeCall.toNumber}</h3>
                  <p className="mt-2 text-sm text-white/54">
                    Status: <span className="text-white">{activeCall.status}</span>
                    {' '}• Duration: <span className="text-white">{formatDuration(activeCall.durationSeconds)}</span>
                    {' '}• Credits spent: <span className="text-white">{activeCall.creditsSpent}</span>
                  </p>
                </div>
                <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-3 text-sm text-white/54">
                  <p>From {activeCall.fromNumber}</p>
                  <p className="mt-1">Billable {formatDuration(activeCall.billableSeconds)}</p>
                  <p className="mt-1">Locked {activeCall.creditsLocked} credits</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Call logs</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Inbound, outbound, and failed call activity.</h3>
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
                          : 'border-white/8 bg-[#020806]/20 text-white/58 hover:border-brand-green/20 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {!loading && filteredCalls.length ? filteredCalls.map((call) => (
                <div key={call.id} className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{call.direction === 'outbound' ? call.toNumber : call.fromNumber}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/38">
                        {call.direction} • {call.status} • {call.destinationCountry}
                      </p>
                    </div>
                    <div className="text-sm text-white/54">
                      <p>{formatDuration(call.durationSeconds)} duration</p>
                      <p>{call.creditsSpent} credits spent</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-white/38">
                    {formatDistanceToNow(new Date(call.completedAt || call.startedAt || call.createdAt || new Date().toISOString()), { addSuffix: true })}
                  </p>
                  {call.failureReason ? <p className="mt-2 text-xs text-[#ffb4b4]">{call.failureReason}</p> : null}
                </div>
              )) : (
                <BpEmptyState
                  title="No call events yet"
                  text="BP Messenger will show active and completed call sessions here once your account starts placing or receiving calls."
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

            <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-[#020806]/20 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                  <Voicemail className="h-5 w-5 text-brand-green" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Voicemail and missed calls</p>
                  <p className="text-sm text-white/48">Failed or missed voice routes stay attached to the same private number used for BP Messenger calling.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Dial keypad</p>
          <div className="mt-4 rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/38">Dialed number</p>
            <p className="mt-3 min-h-[2.5rem] break-all font-mono text-2xl text-white">
              {dialValue || 'Enter number'}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/38">Calling line</p>
            <div className="mt-2 space-y-2">
              {numbers.length ? numbers.map((number) => (
                <button
                  key={number.id}
                  type="button"
                  onClick={() => setSelectedNumberId(number.id)}
                  className={`w-full rounded-[0.95rem] border px-3 py-3 text-left transition ${
                    selectedNumberId === number.id
                      ? 'border-brand-green/24 bg-brand-green/[0.08] text-brand-green'
                      : 'border-white/8 bg-[#020806]/20 text-white/68 hover:border-brand-green/20 hover:text-white'
                  }`}
                >
                  <p className="font-mono text-sm">{number.number}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/38">{number.type || 'conversation'} • {number.countryCode || 'BP'}</p>
                </button>
              )) : (
                <div className="rounded-[0.95rem] border border-white/8 bg-[#020806]/20 px-3 py-3 text-sm text-white/48">
                  No active BP Messenger number is available for calling yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/38">Rate preview</p>
            {matchedRate ? (
              <>
                <p className="mt-2 text-sm font-semibold text-white">Calling {matchedRate.destinationCountry}</p>
                <p className="mt-2 text-brand-green">{matchedRate.creditsPerMinute} credits / minute</p>
                <p className="mt-2 text-sm text-white/48">Estimated balance: {estimatedMinutes} minutes</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/48">Enter a supported destination to preview the backend call rate.</p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {keypad.map(([value, letters]) => (
              <button
                key={value}
                type="button"
                onClick={() => appendDigit(value)}
                className="rounded-[1rem] border border-white/8 bg-[#020806]/20 px-3 py-4 transition hover:border-brand-green/20 hover:bg-brand-green/[0.05]"
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
              disabled={!dialValue || !selectedNumber || startingCall}
              onClick={startCall}
              className="flex min-h-12 flex-1 items-center justify-center rounded-[1rem] bg-brand-green text-sm font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
            >
              <PhoneCall className="mr-2 h-4 w-4" />
              {startingCall ? 'Calling...' : 'Dial'}
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-white/48">
            Call Credits are used only for BP Messenger international calls and premium voice routes. Wallet balance buys Call Credits, while subscriptions remain separate.
          </p>
        </aside>
      </section>
    </div>
  );
}
