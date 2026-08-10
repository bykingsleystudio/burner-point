'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Bitcoin, ExternalLink, Shield, Wallet } from 'lucide-react';
import { paymentsApi, type PaymentGatewayId } from '@/lib/api';
import { formatNgnKobo, formatStoredKoboAsUsd } from '@/lib/money';

interface FundingOption {
  id: string;
  name: string;
  amountKobo: number;
  bonusKobo: number;
  priceKobo: number;
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
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">Add Funds</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Your wallet balance is stored in USD and is used directly for verifications, rentals, eSIMs, proxies, dedicated VPN IP purchases, and other pay-as-you-go products.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-muted">Select Amount</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
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
                className={`relative rounded-2xl border p-4 text-left transition-all ${
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
                  {formatStoredKoboAsUsd(option.priceKobo)}
                </p>
                <p className="mt-0.5 text-xs text-brand-muted">
                  {formatNgnKobo(option.priceKobo)} local checkout
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  Wallet funding amount: {formatStoredKoboAsUsd(option.amountKobo)}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Funding methods</span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

      <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-brand-muted">Funding amount</span>
          <span className="text-sm font-medium">{selectedOption?.name ?? '-'}</span>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-brand-muted">USD amount</span>
          <span className="font-mono font-bold text-brand-green">
            {selectedOption ? formatStoredKoboAsUsd(selectedOption.priceKobo) : '-'}
          </span>
        </div>
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm text-brand-muted">Local checkout</span>
          <span className="text-sm text-white/70">
            {selectedOption ? formatNgnKobo(selectedOption.priceKobo) : '-'}
          </span>
        </div>
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm text-brand-muted">Gateway</span>
          <span className="flex items-center gap-1.5 text-sm">
            <span>{selectedGatewayDef?.code}</span>
            <span>{selectedGatewayDef?.name}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={initializeFunding}
          disabled={!selectedOption || processing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3 font-semibold text-black transition-all hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="flex items-center justify-center pt-2">
        <div className="opacity-50 transition-opacity hover:opacity-70">
          <Image src="/assets/logo-mark.svg" alt="Burner Point" width={24} height={24} className="mr-2 inline-block" />
          <span className="font-mono text-xs text-brand-muted">Burner Point</span>
        </div>
      </div>
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
