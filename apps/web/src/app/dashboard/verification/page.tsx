'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCountryDataList, getEmojiFlag } from 'countries-list';
import {
  Copy,
  Globe2,
  Smartphone,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, numbersApi } from '@/lib/api';
import { BpEmptyState } from '@/components/design-system';

type TierId = 'premium' | 'standard' | 'economy';

type NumberSearchResult = {
  number: string;
  locality?: string;
  region?: string;
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
};

const TIERS: Array<{ id: TierId; label: string; note: string; priceBand: string }> = [
  {
    id: 'premium',
    label: 'Premium US/CA/UK Numbers',
    note: 'Highest deliverability on supported premium routes.',
    priceBand: '$0.99 - $1.50',
  },
  {
    id: 'standard',
    label: 'Global Standard Numbers',
    note: 'Balanced reach and cost for mainstream verification traffic.',
    priceBand: '$0.20 - $0.80',
  },
  {
    id: 'economy',
    label: 'Low-Cost Global Numbers',
    note: 'Economy routing for low-cost high-volume workflows.',
    priceBand: '$0.05 - $0.30',
  },
];

const SERVICES = [
  'WhatsApp',
  'Telegram',
  'Google',
  'Instagram',
  'TikTok',
  'Discord',
  'Uber',
  'Amazon',
  'LinkedIn',
  'Proton',
];

const COUNTRIES = getCountryDataList()
  .map((item) => ({ code: item.iso2, name: item.name, flag: getEmojiFlag(item.iso2) }))
  .sort((left, right) => left.name.localeCompare(right.name));

export default function VerificationPage() {
  const [tier, setTier] = useState<TierId>('premium');
  const [service, setService] = useState('WhatsApp');
  const [country, setCountry] = useState('US');
  const [availableNumbers, setAvailableNumbers] = useState<NumberSearchResult[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<ProvisionedNumber | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [provisioning, setProvisioning] = useState<string | null>(null);

  const selectedTier = TIERS.find((item) => item.id === tier) ?? TIERS[0];
  const selectedCountry = COUNTRIES.find((item) => item.code === country);
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
        setMessages(response.data);
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
        item.id === selectedNumber.id
          ? { ...item, status: latestInbound.extractedOtp ? 'Code received' : 'Message received' }
          : item,
      ),
    );
  }, [latestInbound, selectedNumber]);

  const searchNumbers = async () => {
    setSearching(true);
    try {
      const response = await numbersApi.search(country, undefined, 'verification');
      setAvailableNumbers(Array.isArray(response.data) ? response.data.slice(0, 8) : []);
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
    setProvisioning(phoneNumber);
    try {
      const response = await numbersApi.provision({
        phoneNumber,
        type: 'verification',
        countryCode: country,
      });

      setSelectedNumber(response.data);
      setAvailableNumbers([]);
      setHistory((current) => [
        {
          id: response.data.id,
          service,
          country,
          tier,
          costBand: selectedTier.priceBand,
          status: 'Waiting for code',
          number: response.data.number,
        },
        ...current.filter((item) => item.id !== response.data.id),
      ]);
      toast.success(`${phoneNumber} is now active inside BP Verify Hub.`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to assign this number right now.');
    } finally {
      setProvisioning(null);
    }
  };

  const copyOtp = async () => {
    if (!latestInbound?.extractedOtp) return;
    await navigator.clipboard.writeText(latestInbound.extractedOtp);
    toast.success('OTP copied.');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Verify Hub</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Tiered verification routing with a live OTP feed.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Choose a routing tier, select a supported service, request a number, and monitor inbound OTP or voice results in real time. Provider names stay hidden from the customer interface by design.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
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

            <label className="block text-sm text-white/68">
              Select service
              <select value={service} onChange={(event) => setService(event.target.value)} className="bp-input mt-2">
                {SERVICES.map((item) => (
                  <option key={item} value={item}>
                    {item}
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
                {searching ? 'Searching...' : 'Get Number'}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-green">{selectedTier.label}</p>
            <p className="mt-2 text-sm text-white/74">{selectedTier.note}</p>
            <p className="mt-3 font-mono text-sm text-brand-green">Tier band {selectedTier.priceBand}</p>
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
                    disabled={Boolean(provisioning)}
                    className="flex w-full items-center justify-between rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-3 text-left transition hover:border-brand-green/22 hover:bg-brand-green/[0.04] disabled:opacity-50"
                  >
                    <div>
                      <p className="font-mono text-sm text-white">{item.number}</p>
                      <p className="mt-1 text-xs text-white/42">{selectedCountry?.flag} {selectedCountry?.name}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-green">
                      {provisioning === item.number ? 'Assigning...' : 'Use number'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">OTP display panel</p>
          <div className="mt-4 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/54">Live feed</p>
                <p className="mt-2 text-4xl font-semibold text-white">
                  {latestInbound?.extractedOtp || 'Waiting'}
                </p>
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

            {latestInbound?.body ? (
              <div className="mt-4 rounded-[1rem] border border-white/8 bg-[#020806]/22 p-4">
                <p className="text-sm leading-6 text-white/68">{latestInbound.body}</p>
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={copyOtp}
                disabled={!latestInbound?.extractedOtp}
                className="flex min-h-11 flex-1 items-center justify-center rounded-[0.95rem] border border-white/10 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/20 hover:text-brand-green disabled:opacity-50"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </button>
              <button
                type="button"
                onClick={() => toast('Cancellation and refund policies are enforced after verification route assignment.')}
                className="flex min-h-11 flex-1 items-center justify-center rounded-[0.95rem] border border-white/10 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:border-brand-green/20 hover:text-brand-green"
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
            <h3 className="mt-2 text-xl font-semibold text-white">Service, country, pricing band, status, and number.</h3>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
            <Globe2 className="h-5 w-5 text-brand-green" />
          </span>
        </div>

        {history.length ? (
          <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-white/8">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.7fr_0.7fr_1fr] gap-3 border-b border-white/8 bg-[#020806]/20 px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-white/38">
              <span>Service</span>
              <span>Country</span>
              <span>Cost</span>
              <span>Status</span>
              <span>Number</span>
            </div>
            {history.map((item) => (
              <div key={item.id} className="grid grid-cols-[1.1fr_0.8fr_0.7fr_0.7fr_1fr] gap-3 px-4 py-4 text-sm text-white/70">
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
