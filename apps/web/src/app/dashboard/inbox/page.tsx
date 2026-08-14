'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Camera,
  FileText,
  Image as ImageIcon,
  MapPin,
  Mic,
  MoreHorizontal,
  Music,
  Paperclip,
  Phone,
  Plus,
  Send,
  SmilePlus,
  UserPlus,
  Users,
} from 'lucide-react';
import { callCreditsApi, messagesApi, numbersApi } from '@/lib/api';
import { formatUsdCents } from '@/lib/money';
import { BpEmptyState } from '@/components/design-system';
import { MessengerTabs } from '@/components/dashboard/messenger-tabs';
import { useNumbersStore } from '@/store';

type NumberRecord = {
  id: string;
  number: string;
  type?: string;
  status?: string;
  countryCode?: string;
};

type MessageRecord = {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status?: string;
  createdAt: string;
  extractedOtp?: string;
};

type ConversationThread = {
  id: string;
  counterpart: string;
  latestMessage: string;
  latestAt: string;
  unread: boolean;
  messages: MessageRecord[];
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

type CallCreditRate = {
  id: string;
  destinationCountry: string;
  creditsPerMinute: number;
};

type CallCreditTransaction = {
  id: string;
  type: string;
  creditsAmount: number;
  description: string | null;
  createdAt: string | null;
};

type CallCreditPackage = {
  id: string;
  name: string;
  usdPriceCents: number;
  totalCredits: number;
  bonusCredits: number;
};

const MENU_ITEMS = [
  'View Profile',
  'Search',
  'Media, Links, Docs',
  'Disappearing Messages',
  'Notification Settings',
  'Customize Chat Theme',
  'Mute Notifications',
  'Delete Conversation',
  'Clear Chat',
  'Export Chat',
  'Report',
  'Block',
];

const MEDIA_ACTIONS = [
  { label: 'Voice message', icon: Mic },
  { label: 'File manager', icon: Paperclip },
  { label: 'Camera', icon: Camera },
  { label: 'Gallery', icon: ImageIcon },
  { label: 'Location', icon: MapPin },
  { label: 'Contacts', icon: Users },
  { label: 'Documents', icon: FileText },
  { label: 'Audio', icon: Music },
  { label: 'Keyboard tools', icon: SmilePlus },
] as const;

const NEW_THREAD_ID = '__new_thread__';

function buildThreads(messages: MessageRecord[]): ConversationThread[] {
  const grouped = new Map<string, MessageRecord[]>();

  for (const message of messages) {
    const key = message.direction === 'outbound' ? message.to : message.from;
    const current = grouped.get(key) ?? [];
    current.push(message);
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([counterpart, threadMessages]) => {
      const sorted = [...threadMessages].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
      const latest = sorted[sorted.length - 1];

      return {
        id: counterpart,
        counterpart,
        latestMessage: latest?.body || 'No messages yet',
        latestAt: latest?.createdAt || new Date().toISOString(),
        unread: latest?.direction === 'inbound' && latest?.status !== 'read',
        messages: sorted,
      };
    })
    .sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime());
}

export default function InboxPage() {
  const { numbers, setNumbers } = useNumbersStore();
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState('');
  const [composer, setComposer] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [callCreditsBalance, setCallCreditsBalance] = useState<CallCreditsBalance | null>(null);
  const [callCreditRates, setCallCreditRates] = useState<CallCreditRate[]>([]);
  const [callCreditHistory, setCallCreditHistory] = useState<CallCreditTransaction[]>([]);
  const [callCreditPackages, setCallCreditPackages] = useState<CallCreditPackage[]>([]);
  const [purchasingCallCreditPackage, setPurchasingCallCreditPackage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    numbersApi
      .list()
      .then((response) => {
        if (!mounted) return;
        setNumbers(response.data);
        setSelectedNumberId((current) => current ?? response.data[0]?.id ?? null);
      })
      .catch(() => toast.error('Unable to load your active numbers.'));

    return () => {
      mounted = false;
    };
  }, [setNumbers]);

  useEffect(() => {
    const numberId = selectedNumberId;

    if (!numberId) {
      setMessages([]);
      return;
    }

    let mounted = true;

    async function loadMessages(activeNumberId: string) {
      setLoadingMessages(true);
      try {
        const response = await messagesApi.list(activeNumberId);
        if (!mounted) return;
        setMessages(response.data.data);
      } catch {
        if (mounted) toast.error('Unable to load BP Messenger threads for this number.');
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    }

    loadMessages(numberId);
    const interval = window.setInterval(() => {
      void loadMessages(numberId);
    }, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [selectedNumberId]);

  const loadCallCreditData = async () => {
    const results = await Promise.allSettled([
      callCreditsApi.balance(),
      callCreditsApi.rates(),
      callCreditsApi.transactions(1, 4),
      callCreditsApi.packages(),
    ]);

    if (results[0].status === 'fulfilled') {
      setCallCreditsBalance(results[0].value.data);
    }
    if (results[1].status === 'fulfilled' && Array.isArray(results[1].value.data)) {
      setCallCreditRates(results[1].value.data);
    }
    if (results[2].status === 'fulfilled') {
      setCallCreditHistory(results[2].value.data?.transactions ?? []);
    }
    if (results[3].status === 'fulfilled' && Array.isArray(results[3].value.data)) {
      setCallCreditPackages(results[3].value.data);
    }
  };

  useEffect(() => {
    void loadCallCreditData();
  }, []);

  const selectedNumber = useMemo(() => {
    return (numbers as NumberRecord[]).find((item) => item.id === selectedNumberId) ?? null;
  }, [numbers, selectedNumberId]);

  const threads = useMemo(() => buildThreads(messages), [messages]);
  const selectedThread = useMemo(() => {
    if (selectedThreadId === NEW_THREAD_ID) return null;
    return threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null;
  }, [selectedThreadId, threads]);

  useEffect(() => {
    if (!selectedThread) {
      if (selectedThreadId && selectedThreadId !== NEW_THREAD_ID) setSelectedThreadId(null);
      return;
    }
    setSelectedThreadId((current) => (current === selectedThread.id ? current : selectedThread.id));
    setSendTo((current) => (current === selectedThread.counterpart ? current : selectedThread.counterpart));
  }, [selectedThread, selectedThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length]);

  const startNewMessage = () => {
    setSelectedThreadId(NEW_THREAD_ID);
    setSendTo('');
    setComposer('');
  };

  const sendMessage = async () => {
    if (!selectedNumber || !sendTo.trim() || !composer.trim()) {
      toast.error('Select a number, choose a recipient, and enter a message.');
      return;
    }

    setSending(true);
    try {
      const response = await messagesApi.send({
        from: selectedNumber.number,
        to: sendTo.trim(),
        body: composer.trim(),
      });

      setMessages((current) => [...current, response.data]);
      setComposer('');
      setSelectedThreadId(response.data.to);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to send this message right now.');
    } finally {
      setSending(false);
    }
  };

  const purchaseCallCredits = async (packageId: string) => {
    setPurchasingCallCreditPackage(packageId);
    try {
      await callCreditsApi.purchase({
        packageId,
        idempotencyKey: crypto.randomUUID(),
      });
      await loadCallCreditData();
      toast.success('Call Credits purchased from available balance.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? 'Unable to purchase Call Credits right now.');
    } finally {
      setPurchasingCallCreditPackage(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Messenger</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Messaging, calls, and contacts without exposing your main line.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
              BP Messenger keeps conversations scoped to Burner Point numbers. Messaging and calling remain limited to supported conversation regions while contacts, media context, and moderation controls stay in one interface.
            </p>
          </div>
          <button
            type="button"
            onClick={startNewMessage}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-brand-green px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac]"
          >
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>

        <div className="mt-5">
          <MessengerTabs active="/dashboard/messenger" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Call Credits</p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {callCreditsBalance?.callCredits?.balance ?? 0} available
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/54">
                Call Credits are used only for BP Messenger international calls and premium voice routes.
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-brand-green/20 bg-brand-green/[0.08] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-green transition hover:border-brand-green/30"
            >
              Manage Billing
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: 'Available', value: `${callCreditsBalance?.callCredits?.availableBalance ?? 0}` },
              { label: 'USD Value', value: formatUsdCents(callCreditsBalance?.callCredits?.equivalentUsdCents) },
              { label: 'Wallet Balance', value: formatUsdCents(callCreditsBalance?.wallet?.balanceUsdCents) },
            ].map((item) => (
              <div key={item.label} className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/38">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {callCreditPackages.slice(0, 3).map((pkg) => (
              <div key={pkg.id} className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-sm font-semibold text-white">{pkg.name}</p>
                <p className="mt-2 font-mono text-brand-green">{formatUsdCents(pkg.usdPriceCents)}</p>
                <p className="mt-1 text-xs text-white/46">{pkg.totalCredits} call credits</p>
                <button
                  type="button"
                  onClick={() => purchaseCallCredits(pkg.id)}
                  disabled={Boolean(purchasingCallCreditPackage)}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-[0.95rem] bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
                >
                  {purchasingCallCreditPackage === pkg.id ? 'Processing...' : 'Buy Call Credits'}
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Calling Rates</p>
          <div className="mt-4 space-y-3">
            {callCreditRates.slice(0, 4).map((rate) => (
              <div key={rate.id} className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-sm font-semibold text-white">{rate.destinationCountry}</p>
                <p className="mt-2 text-sm text-brand-green">{rate.creditsPerMinute} credits / minute</p>
              </div>
            ))}
            {!callCreditRates.length ? (
              <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 text-sm text-white/46">
                Calling rates will appear here once active Messenger routes are configured.
              </div>
            ) : null}
          </div>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Recent Call Credit Activity</p>
          <div className="mt-4 space-y-3">
            {callCreditHistory.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-sm font-semibold text-white">{item.description ?? item.type}</p>
                <p className="mt-1 text-xs text-brand-green">{item.creditsAmount} call credits</p>
              </div>
            ))}
            {!callCreditHistory.length ? (
              <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 text-sm text-white/46">
                No call credit activity has been recorded yet.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Conversation list</p>
          <div className="mt-4 space-y-2">
            {(numbers as NumberRecord[]).map((number) => (
              <button
                key={number.id}
                type="button"
                onClick={() => setSelectedNumberId(number.id)}
                className={`w-full rounded-[1rem] border px-3 py-3 text-left transition ${
                  selectedNumberId === number.id
                    ? 'border-brand-green/24 bg-brand-green/[0.08]'
                    : 'border-white/8 bg-[#020806]/18 hover:border-brand-green/20 hover:bg-brand-green/[0.04]'
                }`}
              >
                <p className="font-mono text-sm text-white">{number.number}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/42">
                  {number.countryCode || 'BP'} • {number.type || 'conversation'} • {number.status || 'active'}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-white/8 pt-4">
            <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-white/38">Threads</p>
            <div className="space-y-2">
              {threads.length ? (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setSendTo(thread.counterpart);
                    }}
                    className={`w-full rounded-[1rem] border px-3 py-3 text-left transition ${
                      selectedThread?.id === thread.id
                        ? 'border-brand-green/24 bg-brand-green/[0.08]'
                        : 'border-white/8 bg-[#020806]/18 hover:border-brand-green/20 hover:bg-brand-green/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-white">{thread.counterpart}</p>
                      {thread.unread ? <span className="h-2.5 w-2.5 rounded-full bg-brand-green" /> : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-white/46">{thread.latestMessage}</p>
                    <p className="mt-2 text-[11px] text-white/32">
                      {formatDistanceToNow(new Date(thread.latestAt), { addSuffix: true })}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4 text-sm leading-6 text-white/48">
                  Conversations appear here once this number has inbound or outbound message activity.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card">
          <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{selectedThread?.counterpart || 'New conversation'}</p>
              <p className="mt-1 text-sm text-white/48">
                {selectedNumber ? `${selectedNumber.number} routed through BP Messenger` : 'Choose a Burner Point number to continue.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href={sendTo ? `/dashboard/calls?to=${encodeURIComponent(sendTo)}` : '/dashboard/calls'} className="flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/22 hover:text-brand-green">
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Link>
              <button
                type="button"
                onClick={() => toast.success('Save-to-contacts is routed through BP Messenger contact management.')}
                className="flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/22 hover:text-brand-green"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </button>
              <details className="relative [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-[0.95rem] border border-white/10 text-white/70 transition hover:border-brand-green/22 hover:text-brand-green">
                  <MoreHorizontal className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-[1rem] border border-white/8 bg-[#07140F] p-2 shadow-[0_22px_60px_rgba(0,0,0,0.4)]">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toast(item)}
                      className="flex min-h-10 w-full items-center rounded-[0.85rem] px-3 text-left text-sm text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <div className="min-h-[28rem] px-5 py-5">
            {!selectedNumber ? (
              <BpEmptyState
                title="No number selected"
                text="Choose a Burner Point line from the conversation list to view messages or send a new one."
              />
            ) : loadingMessages ? (
              <div className="flex min-h-[28rem] items-center justify-center">
                <div className="loader" />
              </div>
            ) : selectedThread ? (
              <div className="space-y-4">
                {selectedThread.messages.map((message) => (
                  <div key={message.id} className={message.direction === 'outbound' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={`max-w-[88%] rounded-[1.3rem] px-4 py-3 text-sm leading-6 shadow-[0_12px_28px_rgba(0,0,0,0.2)] md:max-w-[72%] ${
                      message.direction === 'outbound'
                        ? 'border border-brand-green/20 bg-brand-green/[0.12] text-white'
                        : 'border border-white/8 bg-[#020806]/24 text-white/78'
                    }`}>
                      {message.extractedOtp ? (
                        <div className="mb-2 inline-flex items-center rounded-full border border-brand-green/24 bg-brand-green/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-brand-green">
                          OTP {message.extractedOtp}
                        </div>
                      ) : null}
                      <p>{message.body}</p>
                      <p className="mt-2 text-[11px] text-white/38">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            ) : (
              <BpEmptyState
                title="Start a secure conversation"
                text="Select an existing thread or enter a recipient number below to open a new BP Messenger chat."
                action={
                  <button
                    type="button"
                    onClick={startNewMessage}
                    className="rounded-[0.95rem] bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
                  >
                    New Message
                  </button>
                }
              />
            )}
          </div>

          <div className="border-t border-white/8 px-5 py-4">
            <div className="grid gap-3 lg:grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto_auto_1fr_auto]">
              {MEDIA_ACTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    title={`${item.label} is enabled only when secure media configuration is active for this account.`}
                    className="flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/8 bg-[#020806]/18 text-white/28"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}

              <input
                value={sendTo}
                onChange={(event) => setSendTo(event.target.value)}
                placeholder="Recipient number"
                className="bp-input lg:min-w-[15rem]"
              />

              <div className="flex gap-2 lg:col-span-full">
                <textarea
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  placeholder="Write a private message..."
                  className="bp-input min-h-[5rem] flex-1 resize-none"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending}
                  className="flex min-h-[5rem] min-w-[5rem] items-center justify-center rounded-[1rem] bg-brand-green text-black transition hover:bg-[#1cffac] disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Contact info</p>
          {selectedThread ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1rem] border border-white/8 bg-[#020806]/18 p-4">
                <p className="text-base font-semibold text-white">{selectedThread.counterpart}</p>
                <p className="mt-1 font-mono text-xs text-white/42">BP Messenger thread</p>
                <p className="mt-3 text-sm leading-6 text-white/56">
                  Conversation currently attached to {selectedNumber?.number || 'your active Burner Point line'} with {selectedThread.messages.length} message event{selectedThread.messages.length === 1 ? '' : 's'}.
                </p>
              </div>

              <div className="grid gap-2">
                <Link href={`/dashboard/calls?to=${encodeURIComponent(selectedThread.counterpart)}`} className="flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 text-sm font-semibold text-white/72 transition hover:border-brand-green/22 hover:text-brand-green">
                  Call
                </Link>
                <button
                  type="button"
                  onClick={() => setSendTo(selectedThread.counterpart)}
                  className="flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 text-sm font-semibold text-white/72 transition hover:border-brand-green/22 hover:text-brand-green"
                >
                  SMS
                </button>
                <button
                  type="button"
                  onClick={() => toast('This action is routed through Burner Point moderation controls.')}
                  className="flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 text-sm font-semibold text-white/72 transition hover:border-brand-green/22 hover:text-brand-green"
                >
                  Block / Report
                </button>
              </div>

              <div className="rounded-[1rem] border border-white/8 bg-[#020806]/18 p-4">
                <p className="text-sm font-semibold text-white">Supported region policy</p>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  BP Messenger conversation routing is currently scoped to USA, Canada, and the United Kingdom for app messaging and calling.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-white/8 bg-[#020806]/18 p-4 text-sm leading-6 text-white/50">
              Choose a thread to view message context, call actions, and moderation tools.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
