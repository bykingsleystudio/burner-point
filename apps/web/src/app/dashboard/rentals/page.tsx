'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCountryDataList, getEmojiFlag } from 'countries-list';
import toast from 'react-hot-toast';
import { CalendarClock, CreditCard, RadioTower, RefreshCcw, ShoppingBag } from 'lucide-react';
import { numbersApi, paymentsApi, type PaymentGatewayId } from '@/lib/api';
import { BpEmptyState } from '@/components/design-system';

type SearchResult = {
  number: string;
};

type ActiveNumber = {
  id: string;
  number: string;
  countryCode?: string;
  type?: string;
  status?: string;
  expiresAt?: string;
};

const COUNTRIES = getCountryDataList()
  .map((item) => ({ code: item.iso2, flag: getEmojiFlag(item.iso2), name: item.name }))
  .sort((left, right) => left.name.localeCompare(right.name));

const NUMBER_TYPES = [
  { value: 'burner', label: 'SMS', price: '$5.99+', durationOptions: '1w / 1m / 1y' },
  { value: 'rental', label: 'SMS / Voice', price: '$15.99+', durationOptions: '1w / 1m / 1y' },
  { value: 'verification', label: 'Voice', price: '$0.99+', durationOptions: '1w / 1m / 1y' },
] as const;

const DURATIONS = [
  { label: '1w', days: 7 },
  { label: '1m', days: 30 },
  { label: '1y', days: 365 },
] as const;

const GATEWAYS: Array<{ id: PaymentGatewayId; label: string }> = [
  { id: 'paystack', label: 'Paystack' },
  { id: 'paddle', label: 'Paddle' },
  { id: 'nowpayments', label: 'NOWPayments' },
];

export default function RentalsPage() {
  const [country, setCountry] = useState('US');
  const [numberType, setNumberType] = useState<(typeof NUMBER_TYPES)[number]['value']>('burner');
  const [durationDays, setDurationDays] = useState(30);
  const [gateway, setGateway] = useState<PaymentGatewayId>('paystack');
  const [availableNumbers, setAvailableNumbers] = useState<SearchResult[]>([]);
  const [activeRentals, setActiveRentals] = useState<ActiveNumber[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [searching, setSearching] = useState(false);
  const [processingNumber, setProcessingNumber] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    numbersApi
      .list()
      .then((response) => {
        if (!mounted) return;
        const next = Array.isArray(response.data) ? response.data : [];
        setActiveRentals(next.filter((item: ActiveNumber) => item.type === 'burner' || item.type === 'rental'));
      })
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

  const selectedCountry = useMemo(() => COUNTRIES.find((item) => item.code === country), [country]);
  const selectedType = useMemo(() => NUMBER_TYPES.find((item) => item.value === numberType) ?? NUMBER_TYPES[0], [numberType]);

  const searchInventory = async () => {
    setSearching(true);
    try {
      const response = await numbersApi.search(country);
      setAvailableNumbers(Array.isArray(response.data) ? response.data.slice(0, 10) : []);
      if (!response.data?.length) toast('No inventory was returned for the selected market.');
    } catch {
      toast.error('Unable to load number inventory right now.');
    } finally {
      setSearching(false);
    }
  };

  const startRentalCheckout = async (phoneNumber: string) => {
    setProcessingNumber(phoneNumber);
    try {
      const response = await paymentsApi.initialize({
        paymentType: 'rental',
        gateway,
        rentalDays: durationDays,
        countryCode: country,
        phoneNumber,
        numberType,
        clientPlatform: 'web',
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
        return;
      }

      toast.success('Rental checkout created.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to start the rental checkout.');
    } finally {
      setProcessingNumber(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Number Rentals</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Available numbers and active rentals in one assignment view.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Search by country, choose a number type, confirm rental duration, and send the order into checkout. Once a number is active it stays visible with renewal state, next billing timing, and release control.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
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
            <div className="grid grid-cols-[1fr_0.8fr_0.7fr_0.9fr_auto] gap-3 border-b border-white/8 bg-black/20 px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-white/38">
              <span>Country</span>
              <span>Type</span>
              <span>Price</span>
              <span>Duration Options</span>
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
                    onClick={() => startRentalCheckout(item.number)}
                    disabled={Boolean(processingNumber)}
                    className="rounded-[0.95rem] bg-brand-green px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
                  >
                    {processingNumber === item.number ? 'Opening...' : 'Rent Now'}
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
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Checkout controls</p>
          <div className="mt-4 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
            <p className="text-sm text-white/58">Current configuration</p>
            <p className="mt-2 text-lg font-semibold text-white">{selectedCountry?.flag} {selectedCountry?.name}</p>
            <p className="mt-1 text-sm text-white/52">{selectedType.label} • {selectedType.price}</p>
            <p className="mt-3 font-mono text-sm text-brand-green">
              {DURATIONS.find((item) => item.days === durationDays)?.label} via {gateway}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {GATEWAYS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setGateway(item.id)}
                className={`flex min-h-11 w-full items-center justify-between rounded-[0.95rem] border px-4 text-sm transition ${
                  gateway === item.id
                    ? 'border-brand-green/24 bg-brand-green/[0.08] text-brand-green'
                    : 'border-white/8 bg-black/20 text-white/58 hover:border-brand-green/20 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <CreditCard className="h-4 w-4" />
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Active rentals</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Assigned numbers with renewal status and next billing state.</h3>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
            <ShoppingBag className="h-5 w-5 text-brand-green" />
          </span>
        </div>

        {loadingActive ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[1.2rem] border border-white/8 bg-black/20" />)}
          </div>
        ) : activeRentals.length ? (
          <div className="mt-5 grid gap-3">
            {activeRentals.map((item) => (
              <article key={item.id} className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                      <RadioTower className="h-5 w-5 text-brand-green" />
                    </span>
                    <div>
                      <p className="font-mono text-base text-white">{item.number}</p>
                      <p className="mt-1 text-sm text-white/46">
                        {item.countryCode || 'BP'} • {item.type || 'rental'} • {item.status || 'active'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-white/56 md:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/8 bg-black/24 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Renewal status</p>
                      <p className="mt-2 text-white">{item.status || 'Active'}</p>
                    </div>
                    <div className="rounded-[1rem] border border-white/8 bg-black/24 px-4 py-3">
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
              text="As soon as a number is assigned through the rental checkout flow, it will appear here with status and renewal timing."
            />
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: CalendarClock,
            title: 'Duration logic',
            text: 'Choose short-term or long-term access before starting checkout so the right lifecycle lands in billing.',
          },
          {
            icon: RefreshCcw,
            title: 'Renewal visibility',
            text: 'Renewal state and next billing timing stay visible on active assignments instead of disappearing into support.',
          },
          {
            icon: ShoppingBag,
            title: 'Wallet-aware checkout',
            text: 'Rental initiation routes through the existing payment service so fulfillment stays traceable end to end.',
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
