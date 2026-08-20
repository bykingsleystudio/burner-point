'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getCountryDataList, getEmojiFlag } from 'countries-list';
import toast from 'react-hot-toast';
import { CalendarClock, Copy, RadioTower, RefreshCcw, ShoppingBag, Wallet, Plus } from 'lucide-react';
import { messagesApi, numbersApi, walletApi } from '@/lib/api';
import { BpEmptyState } from '@/components/design-system';

type SearchResult = {
  number: string;
  carrier?: string;
};

type ActiveNumber = {
  id: string;
  number: string;
  countryCode?: string;
  type?: string;
  status?: string;
  expiresAt?: string;
  autoRenew?: boolean;
  capabilities?: string[];
};

const COUNTRIES = getCountryDataList()
  .map((item) => ({ code: item.iso2, flag: getEmojiFlag(item.iso2), name: item.name }))
  .filter((item) => ['US', 'CA'].includes(item.code))
  .sort((left, right) => left.name.localeCompare(right.name));

const NUMBER_TYPES = [
  { value: 'burner', label: 'SMS', price: 'Backend-calculated USD', durationOptions: '1w / 1m / 1y' },
  { value: 'rental', label: 'SMS / Voice', price: 'Backend-calculated USD', durationOptions: '1w / 1m / 1y' },
] as const;

const DURATIONS = [
  { label: '1w', days: 7 },
  { label: '1m', days: 30 },
  { label: '1y', days: 365 },
] as const;

export default function RentalsPage() {
  const [country, setCountry] = useState('US');
  const [numberType, setNumberType] = useState<(typeof NUMBER_TYPES)[number]['value']>('burner');
  const [durationDays, setDurationDays] = useState(30);
  const [availableNumbers, setAvailableNumbers] = useState<SearchResult[]>([]);
  const [activeRentals, setActiveRentals] = useState<ActiveNumber[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [searching, setSearching] = useState(false);
  const [processingNumber, setProcessingNumber] = useState<string | null>(null);
  const [areaCode, setAreaCode] = useState('');
  const [carrier, setCarrier] = useState('');
  const [walletAvailable, setWalletAvailable] = useState<number | null>(null);
  const [walletAlert, setWalletAlert] = useState<string | null>(null);
  const [view, setView] = useState<'active' | 'overdue' | 'backorders' | 'history'>('active');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [manualOnly, setManualOnly] = useState(false);
  const [unreadByNumber, setUnreadByNumber] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const refreshNumbers = async () => {
    const response = await numbersApi.list();
    const next = Array.isArray(response.data) ? response.data : [];
    setActiveRentals(next.filter((item: ActiveNumber) => item.type === 'burner' || item.type === 'rental'));
  };

  useEffect(() => {
    let mounted = true;

    refreshNumbers()
      .catch(() => {
        if (mounted) toast.error('Unable to load active rentals.');
      })
      .finally(() => {
        if (mounted) setLoadingActive(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    walletApi.balance().then(({ data }) => setWalletAvailable(Number(data.balanceUsdCents ?? 0) - Number(data.lockedBalanceUsdCents ?? 0))).catch(() => setWalletAvailable(null));
  }, [activeRentals.length]);

  useEffect(() => {
    if (!activeRentals.length) return;
    Promise.all(activeRentals.map(async (item) => {
      try { const { data } = await messagesApi.list(item.id); return [item.id, data.unreadCount || 0] as const; } catch { return [item.id, 0] as const; }
    })).then((entries) => setUnreadByNumber(Object.fromEntries(entries)));
  }, [activeRentals]);

  const selectedCountry = useMemo(() => COUNTRIES.find((item) => item.code === country), [country]);
  const selectedType = useMemo(() => NUMBER_TYPES.find((item) => item.value === numberType) ?? NUMBER_TYPES[0], [numberType]);

  const searchInventory = async () => {
    setSearching(true);
    try {
      const response = await numbersApi.search(country, areaCode.trim() || undefined, numberType);
      const numbers = Array.isArray(response.data) ? response.data as SearchResult[] : [];
      setAvailableNumbers(carrier.trim() ? numbers.filter((item) => !item.carrier || item.carrier.toLowerCase().includes(carrier.toLowerCase())).slice(0, 10) : numbers.slice(0, 10));
      if (!response.data?.length) toast('No inventory was returned for the selected market.');
    } catch {
      toast.error('Unable to load number inventory right now.');
    } finally {
      setSearching(false);
    }
  };

  const assignWalletRental = async (phoneNumber: string) => {
    if (walletAvailable !== null && walletAvailable <= 0) {
      setWalletAlert('Your wallet has no available balance. Add funds before creating a rental.');
      toast.error('Insufficient wallet balance.');
      return;
    }
    setProcessingNumber(phoneNumber);
    try {
      await numbersApi.provision({
        phoneNumber,
        type: numberType,
        countryCode: country,
        durationDays,
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success('Number assigned from wallet balance.');
      setAvailableNumbers((current) => current.filter((item) => item.number !== phoneNumber));
      await refreshNumbers();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to assign the wallet-backed rental.');
      if (/insufficient|balance|wallet/i.test(message || '')) setWalletAlert(message || 'Insufficient wallet balance. Add funds before creating a rental.');
    } finally {
      setProcessingNumber(null);
    }
  };

  const renewSelected = async () => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) { try { await numbersApi.renew(id); } catch { toast.error('Some rentals could not be renewed.'); } }
    toast.success('Selected renewals processed.');
    setSelectedIds([]);
    await refreshNumbers();
  };

  const markAllMessagesRead = async () => {
    for (const item of activeRentals) {
      try { const { data } = await messagesApi.list(item.id); await Promise.all(data.data.filter((message: { readAt?: string | null; id: string }) => !message.readAt).map((message: { id: string }) => messagesApi.markRead(message.id))); } catch { /* continue other numbers */ }
    }
    setUnreadByNumber({});
    toast.success('Unread messages marked as read.');
  };

  const filteredRentals = activeRentals.filter((item) => {
    const overdue = item.expiresAt ? new Date(item.expiresAt).getTime() < Date.now() : false;
    if (view === 'overdue' && !overdue) return false;
    if (view === 'active' && overdue) return false;
    if (view === 'backorders') return false;
    if (view === 'history') return item.status !== 'released' && item.status !== 'expired';
    if (unreadOnly && !(unreadByNumber[item.id] > 0)) return false;
    if (manualOnly && item.autoRenew) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Rental Hub</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Create and manage wallet-backed rentals.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Search inventory, create one rental at a time, and manage active, overdue, backordered, and historical numbers from one view.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          {walletAlert ? <div role="alert" className="mb-5 flex flex-col gap-3 rounded-md border border-amber-300/30 bg-amber-300/[0.08] p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"><span>{walletAlert}</span><Link href="/dashboard/wallet" className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-green px-3 text-xs font-semibold uppercase tracking-[0.12em] text-black">Add funds</Link></div> : null}
          <div className="mb-5 flex items-center gap-2 rounded-md border border-brand-green/20 bg-brand-green/[0.05] p-3 text-sm text-white/70"><Plus className="h-4 w-4 text-brand-green" />New Rental: select a number and assign it from your wallet.</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm text-white/68">
              Country
              <select value={country} onChange={(event) => setCountry(event.target.value)} className="bp-input mt-2">
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/68">Area code <span className="text-xs text-white/35">optional</span><input value={areaCode} onChange={(event) => setAreaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="bp-input mt-2" placeholder="212" /></label>
            <label className="block text-sm text-white/68">Carrier <span className="text-xs text-white/35">optional</span><input value={carrier} onChange={(event) => setCarrier(event.target.value)} className="bp-input mt-2" placeholder="Any carrier" /></label>

            <label className="block text-sm text-white/68">
              Number type
              <select value={numberType} onChange={(event) => setNumberType(event.target.value as (typeof NUMBER_TYPES)[number]['value'])} className="bp-input mt-2">
                {NUMBER_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/68">
              Duration
              <select value={String(durationDays)} onChange={(event) => setDurationDays(Number(event.target.value))} className="bp-input mt-2">
                {DURATIONS.map((item) => (
                  <option key={item.days} value={String(item.days)}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={searchInventory}
                disabled={searching}
                className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-brand-green px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search Inventory'}
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-white/8">
            <div className="grid grid-cols-[1fr_0.8fr_0.7fr_0.9fr_auto] gap-3 border-b border-white/8 bg-[#020806]/20 px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-white/38">
              <span>Country</span>
              <span>Type</span>
              <span>Price</span>
              <span>Wallet Duration</span>
              <span>Action</span>
            </div>

            {availableNumbers.length ? (
              availableNumbers.map((item) => (
                <div key={item.number} className="grid grid-cols-[1fr_0.8fr_0.7fr_0.9fr_auto] gap-3 px-4 py-4 text-sm text-white/72">
                  <span className="font-mono">
                    {selectedCountry?.flag} {item.number}
                  </span>
                  <span>{selectedType.label}</span>
                  <span>{selectedType.price}</span>
                  <span>{selectedType.durationOptions}</span>
                  <button
                    type="button"
                    onClick={() => assignWalletRental(item.number)}
                    disabled={Boolean(processingNumber)}
                    className="rounded-[0.95rem] bg-brand-green px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
                  >
                    {processingNumber === item.number ? 'Assigning...' : 'Rent From Wallet'}
                  </button>
                </div>
              ))
            ) : (
              <div className="px-4 py-10">
                <BpEmptyState
                  title="No inventory loaded"
                  text="Search inventory to populate the available-number table for the selected market and rental mode."
                />
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Wallet-backed controls</p>
          <div className="mt-4 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
            <p className="text-sm text-white/58">Current configuration</p>
            <p className="mt-2 text-lg font-semibold text-white">{selectedCountry?.flag} {selectedCountry?.name}</p>
            <p className="mt-1 text-sm text-white/52">{selectedType.label} • {selectedType.price}</p>
            <p className="mt-3 font-mono text-sm text-brand-green">
              {DURATIONS.find((item) => item.days === durationDays)?.label} from wallet balance
            </p>
          </div>

          <div className="mt-4 rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
            <p className="text-sm text-white/60">
              BP Rental Hub no longer uses direct external rental checkout. Fund the wallet first, then assign the number from the selected inventory row.
            </p>
          </div>

          <Link
            href="/dashboard/wallet"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[0.95rem] border border-brand-green/20 bg-brand-green/[0.08] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-brand-green transition hover:border-brand-green/30"
          >
            <Wallet className="h-4 w-4" />
            Add Wallet Funds
          </Link>
        </aside>
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Active rentals</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Active, overdue, backorders, history, and billing cycles.</h3>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
            <ShoppingBag className="h-5 w-5 text-brand-green" />
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2"><div className="flex flex-wrap gap-2">{(['active', 'overdue', 'backorders', 'history'] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`min-h-10 rounded-md border px-3 text-xs font-semibold uppercase tracking-[0.12em] ${view === item ? 'border-brand-green/40 bg-brand-green/10 text-brand-green' : 'border-white/10 text-white/60'}`}>{item}</button>)}</div><label className="ml-auto inline-flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />Unread only</label><label className="inline-flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={manualOnly} onChange={(event) => setManualOnly(event.target.checked)} />Manual only</label><button type="button" onClick={() => void renewSelected()} disabled={!selectedIds.length} className="min-h-10 rounded-md border border-brand-green/25 px-3 text-xs font-semibold uppercase text-brand-green disabled:opacity-40">Renew selected</button><button type="button" onClick={() => void markAllMessagesRead()} className="min-h-10 rounded-md border border-white/10 px-3 text-xs font-semibold uppercase text-white/60">Mark all messages read</button></div>

        {loadingActive ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[1.2rem] border border-white/8 bg-[#020806]/20" />)}
          </div>
        ) : filteredRentals.length ? (
          <div className="mt-5 grid gap-3">
            {filteredRentals.map((item) => (
              <article key={item.id} className="rounded-[1.2rem] border border-white/8 bg-[#020806]/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                      <RadioTower className="h-5 w-5 text-brand-green" />
                    </span>
                    <div>
                      <p className="font-mono text-base text-white">{item.number}</p>
                      <p className="mt-1 text-sm text-white/46">
                        {item.countryCode || 'BP'} • {item.type || 'rental'} • {item.status || 'active'} {unreadByNumber[item.id] ? `• ${unreadByNumber[item.id]} unread` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2"><label className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-white/60"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />Select</label><button type="button" onClick={() => void navigator.clipboard.writeText(item.number).then(() => toast.success('Number copied.'))} className="rounded-md border border-white/10 p-2" aria-label="Copy rental number"><Copy className="h-4 w-4" /></button><Link href={`/dashboard/inbox?phoneNumberId=${encodeURIComponent(item.id)}`} className="rounded-md border border-brand-green/20 px-3 py-2 text-xs font-semibold uppercase text-brand-green">Messages</Link><button type="button" onClick={() => void numbersApi.renew(item.id).then(() => refreshNumbers())} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold uppercase text-white/70">Renew</button></div>

                  <div className="grid gap-2 text-sm text-white/56 md:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/8 bg-[#020806]/24 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Renewal status</p>
                      <p className="mt-2 text-white">{item.status || 'Active'}</p>
                    </div>
                    <div className="rounded-[1rem] border border-white/8 bg-[#020806]/24 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Next billing</p>
                      <p className="mt-2 text-white">
                        {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Managed in billing'}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <BpEmptyState
              title="No active rentals"
              text="As soon as a number is assigned from wallet balance, it will appear here with status and renewal timing."
            />
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: CalendarClock,
            title: 'Duration logic',
            text: 'Choose short-term or long-term access before assigning the number so the right lifecycle lands in billing.',
          },
          {
            icon: RefreshCcw,
            title: 'Renewal visibility',
            text: 'Renewal state and next billing timing stay visible on active assignments instead of disappearing into support.',
          },
          {
            icon: ShoppingBag,
            title: 'Wallet-backed delivery',
            text: 'Rental assignment debits the wallet directly so funding, provisioning, and support references stay server-side and traceable end to end.',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-[1.4rem] border border-white/8 bg-brand-card p-5">
              <Icon className="h-5 w-5 text-brand-green" />
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/50">{item.text}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
