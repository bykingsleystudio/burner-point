'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { paymentsApi, type PaymentGatewayId } from '@/lib/api';
import toast from 'react-hot-toast';
import { Bitcoin, ExternalLink, Globe, Shield } from 'lucide-react';
import { formatNgnKobo, formatStoredKoboAsUsd } from '@/lib/money';

interface Package {
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
    desc: 'Primary local card and bank payments',
    color: 'text-blue-400',
    borderActive: 'border-blue-400',
    bgActive: 'bg-blue-400/10',
    category: 'core',
  },
  {
    id: 'paddle',
    name: 'Paddle',
    code: 'INT',
    desc: 'International cards and subscriptions',
    color: 'text-cyan-400',
    borderActive: 'border-cyan-400',
    bgActive: 'bg-cyan-400/10',
    category: 'core',
  },
  {
    id: 'nowpayments',
    name: 'NOWPayments',
    code: 'BTC',
    desc: 'Crypto checkout when enabled',
    color: 'text-brand-green',
    borderActive: 'border-brand-green',
    bgActive: 'bg-brand-green/10',
    category: 'core',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    code: 'FW',
    desc: 'Additional regional option',
    color: 'text-orange-400',
    borderActive: 'border-orange-400',
    bgActive: 'bg-orange-400/10',
    category: 'deferred',
  },
  {
    id: 'squad',
    name: 'Squad by GTCO',
    code: 'SQ',
    desc: 'Additional regional option',
    color: 'text-green-400',
    borderActive: 'border-green-400',
    bgActive: 'bg-green-400/10',
    category: 'deferred',
  },
  {
    id: 'korapay',
    name: 'Korapay',
    code: 'KO',
    desc: 'Additional regional option',
    color: 'text-purple-400',
    borderActive: 'border-purple-400',
    bgActive: 'bg-purple-400/10',
    category: 'deferred',
  },
  {
    id: 'opay',
    name: 'OPay Merchant',
    code: 'OP',
    desc: 'Additional regional option',
    color: 'text-yellow-400',
    borderActive: 'border-yellow-400',
    bgActive: 'bg-yellow-400/10',
    category: 'deferred',
  },
];

export default function CreditsPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayId>('paystack');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setLoading(true);
    paymentsApi
      .packages()
      .then((r) => {
        setPackages(r.data);
        setSelectedPkg((current) => current ?? r.data.find((pkg: Package) => pkg.isFeatured) ?? r.data[0] ?? null);
      })
      .catch(() => toast.error('Failed to load packages'))
      .finally(() => setLoading(false));
  }, []);

  const initPayment = async () => {
    if (!selectedPkg) {
      toast.error('Please select a credit package');
      return;
    }
    setProcessing(true);
    try {
      const r = await paymentsApi.initialize({
        paymentType: 'credits',
        gateway: selectedGateway,
        packageId: selectedPkg.id,
        clientPlatform: 'web',
      });
      if (r.data.checkoutUrl) {
        window.location.href = r.data.checkoutUrl;
      }
    } catch (e: unknown) {
      const responseMessage = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(responseMessage ?? 'Payment initialization failed');
    } finally {
      setProcessing(false);
    }
  };

  const selectedGatewayDef = GATEWAYS.find((g) => g.id === selectedGateway);
  const coreGateways = GATEWAYS.filter((g) => g.category === 'core');
  const deferredGateways = GATEWAYS.filter((g) => g.category === 'deferred');

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">Buy Credits</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Credits fund verifications, rentals, and account actions from one protected checkout flow.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-muted">Select Package</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkg(pkg)}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                  selectedPkg?.id === pkg.id
                    ? 'border-brand-green bg-brand-green/10'
                    : 'border-brand-border bg-brand-card hover:border-brand-muted'
                }`}
              >
                {pkg.isFeatured ? (
                  <span className="absolute -top-2 left-4 rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-black">
                    POPULAR
                  </span>
                ) : null}
                <p className="text-sm font-semibold">{pkg.name}</p>
                <p className="mt-1 font-mono text-xl font-bold text-brand-green">
                  {formatStoredKoboAsUsd(pkg.priceKobo)}
                </p>
                <p className="mt-0.5 text-xs text-brand-muted">
                  {formatNgnKobo(pkg.priceKobo)} local checkout
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  {formatStoredKoboAsUsd(pkg.amountKobo)} wallet credits
                  {pkg.bonusKobo > 0 ? (
                    <span className="text-brand-green"> + {formatStoredKoboAsUsd(pkg.bonusKobo)} bonus</span>
                  ) : null}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Core payment methods</span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {coreGateways.map((gw) => (
            <GatewayButton
              key={gw.id}
              gateway={gw}
              selected={selectedGateway === gw.id}
              onSelect={() => setSelectedGateway(gw.id)}
            />
          ))}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Secondary gateways</span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>
        <p className="mb-3 text-xs leading-5 text-brand-muted">
          Additional regional checkout options will appear here as they become available.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {deferredGateways.map((gw) => (
            <GatewayButton
              key={gw.id}
              gateway={gw}
              selected={selectedGateway === gw.id}
              onSelect={() => setSelectedGateway(gw.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-brand-muted">Package</span>
          <span className="text-sm font-medium">{selectedPkg?.name ?? '-'}</span>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-brand-muted">Amount</span>
          <span className="font-mono font-bold text-brand-green">
            {selectedPkg ? formatStoredKoboAsUsd(selectedPkg.priceKobo) : '-'}
          </span>
        </div>
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm text-brand-muted">Local checkout</span>
          <span className="text-sm text-white/70">
            {selectedPkg ? formatNgnKobo(selectedPkg.priceKobo) : '-'}
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
          onClick={initPayment}
          disabled={!selectedPkg || processing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3 font-semibold text-black transition-all hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <>
              <ExternalLink size={15} />
              Pay Now
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
              <strong>Crypto payment:</strong> choose your coin on the hosted checkout screen.
            </p>
          </div>
        ) : null}

        {selectedGateway === 'paddle' ? (
          <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-cyan-400">
              <Globe size={11} />
              <strong>International cards:</strong> Use Paddle when you want a smooth global card checkout experience.
            </p>
          </div>
        ) : null}
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
