'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getCountryDataList, getEmojiFlag } from 'countries-list';
import {
  Copy,
  Globe2,
  Smartphone,
  Volume2,
  PhoneCall,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, numbersApi, verificationHubApi, walletApi } from '@/lib/api';
import { BpEmptyState } from '@/components/design-system';

type TierId = 'premium' | 'standard' | 'economy';

type NumberSearchResult = {
  number: string;
  locality?: string;
  region?: string;
  carrier?: string;
};

type ProvisionedNumber = {
  id: string;
  number: string;
  status?: string;
};

type MessageRecord = {
  id: string;
  body: string;
  extractedOtp?: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
};

type VerificationHistoryItem = {
  id: string;
  service: string;
  country: string;
  tier: TierId;
  costBand: string;
  status: string;
  number: string;
  channel: 'sms' | 'voice';
  expiresAt?: string | null;
};

type VerificationService = {
  code: string;
  name: string;
  priceUsdCents: number;
};

type VerificationOrder = {
  id: string;
  serviceCode?: string | null;
  serviceName?: string | null;
  tier?: TierId;
  countryCode: string;
  phoneNumber?: string | null;
  priceUsdCents: number;
  status: string;
  createdAt?: string;
  channel?: 'sms' | 'voice';
  expiresAt?: string | null;
  provider?: string;
  otpCode?: string | null;
};

const TIERS: Array<{ id: TierId; label: string; note: string; priceBand: string }> = [
  {
    id: 'premium',
    label: 'Premium US/CA/UK Numbers',
    note: 'Highest deliverability on supported premium routes.',
    priceBand: 'Backend-calculated USD pricing',
  },
  {
    id: 'standard',
    label: 'Global Standard Numbers',
    note: 'Balanced reach and cost for mainstream verification traffic.',
    priceBand: 'Backend-calculated USD pricing',
  },
  {
    id: 'economy',
    label: 'Low-Cost Global Numbers',
    note: 'Economy routing for low-cost high-volume workflows.',
    priceBand: 'Backend-calculated USD pricing',
  },
];

const COUNTRIES = getCountryDataList()
  .map((item) => ({ code: item.iso2, name: item.name, flag: getEmojiFlag(item.iso2) }))
  .sort((left, right) => left.name.localeCompare(right.name));

export default function VerificationPage() {
  const [channel, setChannel] = useState<'sms' | 'voice'>('sms');
  const [tier, setTier] = useState<TierId>('premium');
  const [service, setService] = useState('');
  const [country, setCountry] = useState('US');
  const [availableNumbers, setAvailableNumbers] = useState<NumberSearchResult[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<ProvisionedNumber | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [services, setServices] = useState<VerificationService[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [provisioning, setProvisioning] = useState<string | null>(null);
  const [areaCode, setAreaCode] = useState('');
  const [carrier, setCarrier] = useState('');
  const [activeOrder, setActiveOrder] = useState<VerificationOrder | null>(null);
  const [availableBalanceUsdCents, setAvailableBalanceUsdCents] = useState<number | null>(null);
  const [walletAlert, setWalletAlert] = useState<string | null>(null);

  const selectedTier = TIERS.find((item) => item.id === tier) ?? TIERS[0];
  const selectedCountry = COUNTRIES.find((item) => item.code === country);
  const selectedService = services.find((item) => item.code === service);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([verificationHubApi.services(country), verificationHubApi.orders()]).then((results) => {
      if (!mounted) return;

      const serviceResult = results[0];
      if (serviceResult.status === 'fulfilled' && Array.isArray(serviceResult.value.data)) {
        setServices(serviceResult.value.data);
        if (!serviceResult.value.data.some((item: VerificationService) => item.code === service) && serviceResult.value.data[0]) {
          setService(serviceResult.value.data[0].code);
        }
      }

      const orderResult = results[1];
      if (orderResult.status === 'fulfilled' && Array.isArray(orderResult.value.data)) {
        setHistory(orderResult.value.data.map((order: VerificationOrder) => ({
          id: order.id,
          service: order.serviceName || order.serviceCode || 'Verification service',
          country: order.countryCode,
          tier: order.tier || 'standard',
          costBand: `$${(order.priceUsdCents / 100).toFixed(2)} USD`,
          status: order.status,
          number: order.phoneNumber || 'Pending assignment',
          channel: order.channel || 'sms',
          expiresAt: order.expiresAt,
        })));
        const current = orderResult.value.data.find((order: VerificationOrder) => ['pending', 'provisioning', 'active', 'waiting_for_code'].includes(order.status));
        setActiveOrder(current || null);
      }
    });

    return () => {
      mounted = false;
    };
  }, [country, service]);

  useEffect(() => {
    walletApi.balance()
      .then(({ data }) => setAvailableBalanceUsdCents(Number(data.balanceUsdCents ?? 0) - Number(data.lockedBalanceUsdCents ?? 0)))
      .catch(() => setAvailableBalanceUsdCents(null));
  }, [activeOrder]);
  const latestInbound = useMemo(() => {
    return [...messages]
      .filter((message) => message.direction === 'inbound')
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
  }, [messages]);

  useEffect(() => {
    const activeNumberId = selectedNumber?.id;

    if (!activeNumberId) {
      setMessages([]);
      return;
    }

    let mounted = true;

    async function loadMessages(numberId: string) {
      try {
        const response = await messagesApi.list(numberId);
        if (!mounted) return;
        setMessages(response.data.data);
      } catch {
        if (mounted) toast.error('Unable to refresh the live OTP feed.');
      }
    }

    loadMessages(activeNumberId);
    const interval = window.setInterval(() => {
      void loadMessages(activeNumberId);
    }, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [selectedNumber?.id]);

  useEffect(() => {
    if (!selectedNumber || !latestInbound) return;

    setHistory((current) =>
      current.map((item) =>
        item.id === selectedOrderId
          ? { ...item, status: latestInbound.extractedOtp ? 'Code received' : 'Message received' }
          : item,
      ),
    );
  }, [latestInbound, selectedNumber, selectedOrderId]);

  const searchNumbers = async () => {
    setSearching(true);
    try {
      const response = await numbersApi.search(country, areaCode.trim() || undefined, 'verification');
      const numbers = Array.isArray(response.data) ? response.data as NumberSearchResult[] : [];
      setAvailableNumbers(carrier.trim()
        ? numbers.filter((item) => !item.carrier || item.carrier.toLowerCase().includes(carrier.trim().toLowerCase())).slice(0, 8)
        : numbers.slice(0, 8));
      if (!response.data?.length) {
        toast('No numbers were returned for this country on the current route.');
      }
    } catch {
      toast.error('Unable to retrieve verification numbers for this route.');
    } finally {
      setSearching(false);
    }
  };

  const assignNumber = async (phoneNumber: string) => {
    if (selectedService && availableBalanceUsdCents !== null && availableBalanceUsdCents < selectedService.priceUsdCents) {
      const shortfall = ((selectedService.priceUsdCents - availableBalanceUsdCents) / 100).toFixed(2);
      setWalletAlert(`Insufficient wallet balance. Add at least $${shortfall} USD to request this verification.`);
      toast.error('Insufficient wallet balance.');
      return;
    }

    setProvisioning(phoneNumber);
    try {
      const response = await verificationHubApi.createOrder({
        channel,
        phoneNumber,
        serviceCode: service,
        countryCode: country,
        areaCode: areaCode.trim() || undefined,
        carrier: carrier.trim() || undefined,
        tier,
        idempotencyKey: crypto.randomUUID(),
      });

      const order = response.data as VerificationOrder;
      const numberResponse = await numbersApi.list();
      const assignedNumber = Array.isArray(numberResponse.data)
        ? numberResponse.data.find((item: { number?: string }) => item.number === order.phoneNumber)
        : undefined;

      setSelectedOrderId(order.id);
      setActiveOrder(order);
      setSelectedNumber(assignedNumber || { id: order.id, number: order.phoneNumber || phoneNumber });
      setAvailableNumbers([]);
      setHistory((current) => [
        {
          id: order.id,
          service: selectedService?.name || service,
          country,
          tier,
          costBand: `$${(order.priceUsdCents / 100).toFixed(2)} USD`,
          status: order.status,
          number: order.phoneNumber || phoneNumber,
          channel: order.channel || channel,
          expiresAt: order.expiresAt,
        },
        ...current.filter((item) => item.id !== order.id),
      ]);
      toast.success(`${phoneNumber} is now active inside BP Verify Hub.`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to assign this number right now.');
      if (/insufficient|balance|wallet/i.test(message || '')) {
        setWalletAlert(message || 'Insufficient wallet balance. Add funds before requesting a verification.');
      }
    } finally {
      setProvisioning(null);
    }
  };

  const cancelVerification = async () => {
    if (!selectedOrderId) return;

    try {
      await verificationHubApi.cancelOrder(selectedOrderId);
      setHistory((current) => current.map((item) => item.id === selectedOrderId ? { ...item, status: 'cancelled' } : item));
      setSelectedOrderId(null);
      setSelectedNumber(null);
      setActiveOrder(null);
      setMessages([]);
      toast.success('Verification order cancelled and wallet hold released.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to cancel this verification order.');
    }
  };

  const copyOtp = async () => {
    if (!latestInbound?.extractedOtp) return;
    await navigator.clipboard.writeText(latestInbound.extractedOtp);
    toast.success('OTP copied.');
  };

  const playNumber = (value: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(value.split('').join(' ')));
  };

  const copyNumber = async () => {
    const value = selectedNumber?.number || activeOrder?.phoneNumber;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success('Number copied.');
  };

  const timeLeft = (expiresAt?: string | null) => {
    if (!expiresAt) return 'Time unavailable';
    const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s left`;
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Verify Hub</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">New SMS and voice verification requests.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Select one route, request one number, and keep the live code and purchase status here. Do not submit multiple requests for the same verification.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          {walletAlert ? <div role="alert" className="mb-5 flex flex-col gap-3 rounded-md border border-amber-300/30 bg-amber-300/[0.08] p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"><span>{walletAlert}</span><Link href="/dashboard/wallet" className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-green px-3 text-xs font-semibold uppercase tracking-[0.12em] text-black">Add funds</Link></div> : null}
          <div className="mb-5 grid grid-cols-2 gap-2">
            {([{ id: 'sms' as const, label: 'New SMS', icon: Smartphone }, { id: 'voice' as const, label: 'New Voice', icon: PhoneCall }]).map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setChannel(item.id)} disabled={Boolean(activeOrder)} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border text-sm font-semibold disabled:opacity-50 ${channel === item.id ? 'border-brand-green/40 bg-brand-green/10 text-brand-green' : 'border-white/10 text-white/70'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm text-white/68">
              Select tier
              <select value={tier} onChange={(event) => setTier(event.target.value as TierId)} className="bp-input mt-2">
                {TIERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/68">Area code <span className="text-xs text-white/35">optional</span><input value={areaCode} onChange={(event) => setAreaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="bp-input mt-2" placeholder="212" disabled={Boolean(activeOrder)} /></label>
            <label className="block text-sm text-white/68">Carrier <span className="text-xs text-white/35">optional</span><input value={carrier} onChange={(event) => setCarrier(event.target.value)} className="bp-input mt-2" placeholder="Any carrier" disabled={Boolean(activeOrder)} /></label>

            <label className="block text-sm text-white/68">
              Select service
              <select value={service} onChange={(event) => setService(event.target.value)} className="bp-input mt-2">
                {services.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/68">
              Choose country
              <select value={country} onChange={(event) => setCountry(event.target.value)} className="bp-input mt-2">
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={searchNumbers}
                disabled={searching}
                className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-brand-green px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
              >
                {searching ? 'Checking stock...' : channel === 'sms' ? 'Get SMS number now' : 'Get Voice number now'}
              </button>
            </div>
          </div>

          {activeOrder ? <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100"><p className="font-semibold">One request is already active.</p><p className="mt-1 text-amber-100/70">Use this number or cancel it before requesting another.</p></div> : null}

          <div className="mt-4 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-green">{selectedTier.label}</p>
            <p className="mt-2 text-sm text-white/74">{selectedTier.note}</p>
            <p className="mt-3 font-mono text-sm text-brand-green">
              {selectedService ? `$${(selectedService.priceUsdCents / 100).toFixed(2)} USD` : selectedTier.priceBand}
            </p>
          </div>

          {availableNumbers.length ? (
            <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-[#020806]/18 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-green">Available numbers</p>
              <div className="mt-4 space-y-2">
                {availableNumbers.map((item) => (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => assignNumber(item.number)}
                    disabled={Boolean(provisioning) || Boolean(activeOrder) || Boolean(selectedService && availableBalanceUsdCents !== null && availableBalanceUsdCents < selectedService.priceUsdCents)}
                    className="flex w-full items-center justify-between rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-3 text-left transition hover:border-brand-green/22 hover:bg-brand-green/[0.04] disabled:opacity-50"
                  >
                    <div>
                      <p className="font-mono text-sm text-white">{item.number}</p>
                      <p className="mt-1 text-xs text-white/42">{selectedCountry?.flag} {selectedCountry?.name}</p>
                    </div>
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-green">
                      <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); playNumber(item.number); }} className="cursor-pointer rounded-md border border-brand-green/20 p-2" aria-label={`Play ${item.number}`}><Volume2 className="h-4 w-4" /></span>
                      {provisioning === item.number ? 'Assigning...' : 'Use number'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">{channel === 'sms' ? 'SMS' : 'Voice'} live feed</p>
          <div className="mt-4 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/54">Live feed</p>
                <p className="mt-2 text-4xl font-semibold text-white">
                  {latestInbound?.extractedOtp || (activeOrder ? `Waiting for ${activeOrder.channel === 'voice' ? 'voice' : 'SMS'}` : 'Waiting')}
                </p>
                {latestInbound?.extractedOtp ? <button type="button" onClick={() => playNumber(latestInbound.extractedOtp || '')} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-md border border-brand-green/20 px-3 text-xs font-semibold uppercase text-brand-green"><Volume2 className="h-4 w-4" />Play code</button> : null}
                <p className="mt-2 text-sm text-white/50">
                  {selectedNumber
                    ? `Monitoring ${selectedNumber.number} for ${service} on ${selectedCountry?.name}.`
                    : 'Assign a verification number to start the secure OTP feed.'}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/22 bg-brand-green/10">
                {latestInbound?.extractedOtp ? <Smartphone className="h-5 w-5 text-brand-green" /> : <Volume2 className="h-5 w-5 text-brand-green" />}
              </span>
            </div>

            {activeOrder ? <div className="mt-4 grid gap-2 rounded-md border border-white/8 bg-[#020806]/22 p-4 text-sm"><div className="flex justify-between"><span className="text-white/45">Number</span><span className="font-mono text-white">{activeOrder.phoneNumber || selectedNumber?.number || 'Pending'}</span></div><div className="flex justify-between"><span className="text-white/45">Status</span><span className="text-brand-green">{activeOrder.status.replace(/_/g, ' ')}</span></div><div className="flex justify-between"><span className="text-white/45">Time left</span><span className="font-mono text-white">{timeLeft(activeOrder.expiresAt)}</span></div><div className="flex justify-between"><span className="text-white/45">Price</span><span className="font-mono text-white">${(activeOrder.priceUsdCents / 100).toFixed(2)} USD</span></div></div> : null}

            {latestInbound?.body ? (
              <div className="mt-4 rounded-[1rem] border border-white/8 bg-[#020806]/22 p-4">
                <p className="text-sm leading-6 text-white/68">{latestInbound.body}</p>
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => void copyNumber()} disabled={!selectedNumber?.number && !activeOrder?.phoneNumber} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[0.95rem] border border-white/10 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 disabled:opacity-50"><Copy className="h-4 w-4" />Copy number</button>
              <button
                type="button"
                onClick={() => void copyOtp()}
                disabled={!latestInbound?.extractedOtp}
                className="flex min-h-11 flex-1 items-center justify-center rounded-[0.95rem] border border-white/10 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/20 hover:text-brand-green disabled:opacity-50"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </button>
              <button
                type="button"
                onClick={() => void cancelVerification()}
                disabled={!selectedOrderId}
                className="flex min-h-11 flex-1 items-center justify-center rounded-[0.95rem] border border-white/10 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/20 hover:text-brand-green disabled:opacity-50"
              >
                Cancel & Refund
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Active verifications / history</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Recent purchases, received numbers, codes, and activation status.</h3>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
            <Globe2 className="h-5 w-5 text-brand-green" />
          </span>
        </div>

        {history.length ? (
          <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-white/8">
            <div className="grid grid-cols-[0.7fr_1.1fr_0.8fr_0.7fr_0.7fr_1fr] gap-3 border-b border-white/8 bg-[#020806]/20 px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-white/38">
              <span>Type</span>
              <span>Service</span>
              <span>Country</span>
              <span>Cost</span>
              <span>Status</span>
              <span>Number</span>
            </div>
            {history.map((item) => (
              <div key={item.id} className="grid grid-cols-[0.7fr_1.1fr_0.8fr_0.7fr_0.7fr_1fr] gap-3 px-4 py-4 text-sm text-white/70">
                <span className="uppercase">{item.channel}</span>
                <span>{item.service}</span>
                <span>{item.country}</span>
                <span>{item.costBand}</span>
                <span className="text-brand-green">{item.status}</span>
                <span className="font-mono">{item.number}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <BpEmptyState
              title="No active verifications yet"
              text="As soon as you assign a number through BP Verify Hub, the live record will appear here with service, route, and status."
            />
          </div>
        )}
      </section>
    </div>
  );
}
