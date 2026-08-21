'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bitcoin, ExternalLink, Shield, Wallet } from 'lucide-react';
import { paymentsApi, type PaymentGatewayId } from '@/lib/api';
import { formatStoredUsdCents } from '@/lib/money';
import { useLocalCurrency } from '@/lib/use-local-currency';

interface FundingOption {
  id: string;
  name: string;
  amountUsdCents: number;
  bonusUsdCents: number;
  priceUsdCents: number;
  isFeatured: boolean;
}

type Gateway = {
  id: PaymentGatewayId;
  name: string;
  code: string;
  desc: string;
  color: string;
  borderActive: string;
  bgActive: string;
  category: 'core' | 'deferred';
};

const GATEWAYS: Gateway[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    code: 'NG',
    desc: 'Primary local card and bank funding path',
    color: 'text-blue-400',
    borderActive: 'border-blue-400',
    bgActive: 'bg-blue-400/10',
    category: 'core',
  },
  {
    id: 'nowpayments',
    name: 'NOWPayments',
    code: 'BTC',
    desc: 'Crypto wallet funding when enabled',
    color: 'text-brand-green',
    borderActive: 'border-brand-green',
    bgActive: 'bg-brand-green/10',
    category: 'core',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    code: 'FW',
    desc: 'Alternative card and bank wallet funding path',
    color: 'text-orange-400',
    borderActive: 'border-orange-400',
    bgActive: 'bg-orange-400/10',
    category: 'core',
  },
];

export default function WalletFundingPage() {
  const [options, setOptions] = useState<FundingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<FundingOption | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayId>('paystack');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const localCurrency = useLocalCurrency();

  useEffect(() => {
    setLoading(true);
    paymentsApi
      .packages()
      .then((r) => {
        setOptions(r.data);
        setSelectedOption((current) => current ?? r.data.find((item: FundingOption) => item.isFeatured) ?? r.data[0] ?? null);
      })
      .catch(() => toast.error('Failed to load wallet funding options'))
      .finally(() => setLoading(false));
  }, []);

  const initializeFunding = async () => {
    if (!selectedOption) {
      toast.error('Please select a funding amount');
      return;
    }

    setProcessing(true);
    try {
      const response = await paymentsApi.initialize({
        paymentType: 'wallet',
        gateway: selectedGateway,
        packageId: selectedOption.id,
        clientPlatform: 'web',
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? 'Wallet funding initialization failed');
    } finally {
      setProcessing(false);
    }
  };

  const selectedGatewayDef = GATEWAYS.find((gateway) => gateway.id === selectedGateway);
  const coreGateways = GATEWAYS.filter((gateway) => gateway.category === 'core');

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-green">Wallet / Funding</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Add Funds</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Your wallet balance is stored in USD and is used directly for verifications, rentals, eSIMs, proxies, dedicated VPN IP purchases, and other pay-as-you-go products.
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Select amount</h2>
            <p className="mt-1 text-sm text-brand-muted">Choose the wallet value that fits this task.</p>
          </div>
          <span className="text-xs text-brand-muted">{options.length} options</span>
        </div>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option)}
                  className={`relative rounded-xl border p-5 text-left transition-all ${
                  selectedOption?.id === option.id
                    ? 'border-brand-green bg-brand-green/10'
                    : 'border-brand-border bg-brand-card hover:border-brand-muted'
                }`}
              >
                {option.isFeatured ? (
                  <span className="absolute -top-2 left-4 rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-black">
                    POPULAR
                  </span>
                ) : null}
                <p className="text-sm font-semibold">{option.name}</p>
                <p className="mt-1 font-mono text-xl font-bold text-brand-green">
                  {formatStoredUsdCents(option.priceUsdCents)}
                </p>
                {localCurrency.formatUsdCents(option.priceUsdCents) ? (
                  <p className="mt-0.5 text-xs text-brand-muted">
                    ≈ {localCurrency.formatUsdCents(option.priceUsdCents)} {localCurrency.currency} display
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-brand-muted">
                  Wallet funding amount: {formatStoredUsdCents(option.amountUsdCents)}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold">Funding method</h2>
          <p className="mt-1 text-sm text-brand-muted">Select the provider you want to use for this wallet deposit.</p>
        </div>
        <div className="grid gap-3">
          {coreGateways.map((gateway) => (
            <GatewayButton
              key={gateway.id}
              gateway={gateway}
              selected={selectedGateway === gateway.id}
              onSelect={() => setSelectedGateway(gateway.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-brand-green/25 bg-brand-green/[0.05] p-6 text-center sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-green">Order summary</p>
        <p className="mt-4 text-5xl font-semibold tracking-tight text-white">
          {selectedOption ? formatStoredUsdCents(selectedOption.priceUsdCents) : '-'}
        </p>
        <p className="mt-2 text-sm text-brand-muted">{selectedOption?.name ?? 'Choose a funding amount'}</p>
        <div className="mx-auto mt-5 grid max-w-md gap-2 border-t border-brand-green/15 pt-4 text-sm">
          <div className="flex items-center justify-between"><span className="text-brand-muted">Wallet value</span><span>{selectedOption ? formatStoredUsdCents(selectedOption.amountUsdCents) : '-'}</span></div>
          <div className="flex items-center justify-between"><span className="text-brand-muted">Gateway</span><span>{selectedGatewayDef?.name ?? '-'}</span></div>
          <div className="flex items-center justify-between"><span className="text-brand-muted">Display currency</span><span className="text-white/70">
            {selectedOption
              ? (localCurrency.formatUsdCents(selectedOption.priceUsdCents)
                ? `≈ ${localCurrency.formatUsdCents(selectedOption.priceUsdCents)} ${localCurrency.currency}`
                : 'Unavailable')
              : '-'}
          </span></div>
        </div>

        <button
          type="button"
          onClick={initializeFunding}
          disabled={!selectedOption || processing}
          className="mx-auto mt-6 flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full bg-brand-green py-3 font-semibold text-black transition-all hover:bg-neon-green disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <>
              <ExternalLink size={15} />
              Add Funds
            </>
          )}
        </button>

        <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-brand-muted">
          <Shield size={11} />
          Secured by {selectedGatewayDef?.name ?? 'payment provider'}
        </p>

        {selectedGateway === 'nowpayments' ? (
          <div className="mt-3 rounded-xl border border-brand-green/20 bg-brand-green/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-brand-green">
              <Bitcoin size={11} />
              <strong>Crypto funding:</strong> choose your coin on the hosted checkout screen.
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-green/16 bg-brand-green/8">
            <Wallet className="h-4 w-4 text-brand-green" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase text-white">Funding flow</p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Fund your wallet once, then spend directly from available balance across Burner Point products. Call Credits remain separate for BP Messenger international calling only.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

function GatewayButton({ gateway, selected, onSelect }: { gateway: Gateway; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        selected
          ? `${gateway.borderActive} ${gateway.bgActive}`
          : 'border-brand-border bg-brand-card hover:border-brand-muted'
      }`}
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#020806]/25 font-mono text-[10px] font-semibold text-white/70">
        {gateway.code}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${selected ? gateway.color : 'text-white'}`}>{gateway.name}</p>
        <p className="text-[10px] leading-tight text-brand-muted">{gateway.desc}</p>
      </div>
    </button>
  );
}
