'use client';
/**
 * apps/web/src/app/dashboard/credits/page.tsx
 *
 * COMPLETE REPLACEMENT FILE
 * - Removed: Stripe, Crypto (Coinbase) entries
 * - Added:   Paddle, NOWPayments entries
 * - Payment method order: Paystack -> Paddle -> NOWPayments
 * - SVG brand assets referenced from /public/assets/ (see SVG placement guide)
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { paymentsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { CreditCard, ExternalLink, Shield, Zap, Globe, Bitcoin } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  amountKobo: number;
  bonusKobo: number;
  priceKobo: number;
  isFeatured: boolean;
}

// ─── Payment gateway definitions — EXACT PRIORITY ORDER ───────────────────
// Each entry maps directly to the PaymentGateway enum in the API.
// Do NOT reorder these — priority is business-critical.
const GATEWAYS = [
  // ── Nigerian gateways (1-5) ──────────────────────────────────────────────
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    flag: '🌍',
    desc: 'Cards, Bank, Mobile Money',
    color: 'text-orange-400',
    borderActive: 'border-orange-400',
    bgActive: 'bg-orange-400/10',
    category: 'ng',
  },
  {
    id: 'paystack',
    name: 'Paystack',
    flag: '🇳🇬',
    desc: 'Cards, Bank Transfer, USSD',
    color: 'text-blue-400',
    borderActive: 'border-blue-400',
    bgActive: 'bg-blue-400/10',
    category: 'ng',
  },
  {
    id: 'squad',
    name: 'Squad by GTCO',
    flag: '🏦',
    desc: 'Fast Nigerian payments',
    color: 'text-green-400',
    borderActive: 'border-green-400',
    bgActive: 'bg-green-400/10',
    category: 'ng',
  },
  {
    id: 'korapay',
    name: 'Korapay',
    flag: '💳',
    desc: 'Cards, Bank, Virtual accounts',
    color: 'text-purple-400',
    borderActive: 'border-purple-400',
    bgActive: 'bg-purple-400/10',
    category: 'ng',
  },
  {
    id: 'opay',
    name: 'OPay Merchant',
    flag: '📱',
    desc: 'OPay wallet & mobile money',
    color: 'text-yellow-400',
    borderActive: 'border-yellow-400',
    bgActive: 'bg-yellow-400/10',
    category: 'ng',
  },
  // ── International gateways (6-7) ─────────────────────────────────────────
  {
    id: 'paddle',
    name: 'Paddle',
    flag: '🌐',
    desc: 'International cards',
    color: 'text-cyan-400',
    borderActive: 'border-cyan-400',
    bgActive: 'bg-cyan-400/10',
    category: 'intl',
  },
  {
    id: 'nowpayments',
    name: 'NOWPayments',
    flag: '₿',
    desc: 'BTC, ETH, USDT, 300+ coins',
    color: 'text-brand-green',
    borderActive: 'border-brand-green',
    bgActive: 'bg-brand-green/10',
    category: 'intl',
  },
] as const;

type GatewayId = (typeof GATEWAYS)[number]['id'];

export default function CreditsPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<GatewayId>('paystack');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setLoading(true);
    paymentsApi
      .packages()
      .then((r) => setPackages(r.data))
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
      const msg =
        e instanceof Error
          ? e.message
          : (e as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Payment initialization failed';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const selectedGatewayDef = GATEWAYS.find((g) => g.id === selectedGateway);
  const ngGateways = GATEWAYS.filter((g) => g.id === 'paystack');
  const intlGateways = GATEWAYS.filter((g) => g.category === 'intl');

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold">Buy Credits</h1>
        <p className="text-sm text-brand-muted mt-1">
          Credits are stored in your wallet in NGN.{' '}
          <span className="text-brand-green font-mono">₦1,600 ≈ $1 USD</span>
        </p>
      </div>

      {/* Credit packages */}
      <div>
        <h2 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
          Select Package
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-brand-card border border-brand-border rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`text-left p-4 rounded-2xl border transition-all relative ${
                  selectedPkg?.id === pkg.id
                    ? 'border-brand-green bg-brand-green/10'
                    : 'border-brand-border bg-brand-card hover:border-brand-border/80'
                }`}
              >
                {pkg.isFeatured && (
                  <span className="absolute -top-2 left-4 text-[10px] bg-brand-green text-black px-2 py-0.5 rounded-full font-bold">
                    POPULAR
                  </span>
                )}
                <p className="font-semibold text-sm">{pkg.name}</p>
                <p className="font-mono font-bold text-xl text-brand-green mt-1">
                  ₦{(pkg.priceKobo / 100).toLocaleString()}
                </p>
                <p className="text-xs text-brand-muted mt-0.5">
                  ₦{(pkg.amountKobo / 100).toLocaleString()} credits
                  {pkg.bonusKobo > 0 && (
                    <span className="text-brand-green">
                      {' '}
                      + ₦{(pkg.bonusKobo / 100).toLocaleString()} bonus
                    </span>
                  )}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment methods — Nigerian gateways first */}
      <div>
        {/* Nigerian gateways section */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
            Nigerian Payments
          </span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {ngGateways.map((gw) => (
            <button
              key={gw.id}
              onClick={() => setSelectedGateway(gw.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedGateway === gw.id
                  ? `${gw.borderActive} ${gw.bgActive}`
                  : 'border-brand-border bg-brand-card hover:border-brand-muted'
              }`}
            >
              <span className="text-xl flex-shrink-0">{gw.flag}</span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    selectedGateway === gw.id ? gw.color : 'text-white'
                  }`}
                >
                  {gw.name}
                </p>
                <p className="text-[10px] text-brand-muted leading-tight">{gw.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* International gateways section */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
            International
          </span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {intlGateways.map((gw) => (
            <button
              key={gw.id}
              onClick={() => setSelectedGateway(gw.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedGateway === gw.id
                  ? `${gw.borderActive} ${gw.bgActive}`
                  : 'border-brand-border bg-brand-card hover:border-brand-muted'
              }`}
            >
              <span className="text-xl flex-shrink-0">{gw.flag}</span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    selectedGateway === gw.id ? gw.color : 'text-white'
                  }`}
                >
                  {gw.name}
                </p>
                <p className="text-[10px] text-brand-muted leading-tight">{gw.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Checkout summary */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-brand-muted">Package</span>
          <span className="text-sm font-medium">{selectedPkg?.name ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-brand-muted">Amount</span>
          <span className="font-mono font-bold text-brand-green">
            {selectedPkg ? `₦${(selectedPkg.priceKobo / 100).toLocaleString()}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-brand-muted">Gateway</span>
          <span className="text-sm flex items-center gap-1.5">
            <span>{selectedGatewayDef?.flag}</span>
            <span>{selectedGatewayDef?.name}</span>
          </span>
        </div>

        <button
          onClick={initPayment}
          disabled={!selectedPkg || processing}
          className="w-full flex items-center justify-center gap-2 bg-brand-green text-black font-semibold py-3 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <ExternalLink size={15} />
              Pay Now
            </>
          )}
        </button>

        <p className="text-xs text-brand-muted text-center mt-3 flex items-center justify-center gap-1">
          <Shield size={11} />
          Secured by {selectedGatewayDef?.name ?? 'payment provider'}
        </p>

        {/* NOWPayments crypto note */}
        {selectedGateway === 'nowpayments' && (
          <div className="mt-3 bg-brand-green/5 border border-brand-green/20 rounded-xl p-3">
            <p className="text-xs text-brand-green flex items-center gap-1.5">
              <Bitcoin size={11} />
              <strong>Crypto payment:</strong> You'll choose your coin on the next screen.
              Supports BTC, ETH, USDT (TRC20/ERC20), BNB, and 300+ others.
            </p>
          </div>
        )}

        {/* Paddle international note */}
        {selectedGateway === 'paddle' && (
          <div className="mt-3 bg-cyan-400/5 border border-cyan-400/20 rounded-xl p-3">
            <p className="text-xs text-cyan-400 flex items-center gap-1.5">
              <Globe size={11} />
              <strong>International cards:</strong> Visa, Mastercard, and local payment
              methods worldwide. Amount billed in USD.
            </p>
          </div>
        )}
      </div>

      {/* SVG Brand Logo in footer — displayed once assets are placed */}
      {/* See SVG placement guide for how to add your logo files */}
      <div className="flex items-center justify-center pt-2">
        {/* Primary: use SVG file from public/assets/ */}
        {/* Fallback: text logo if SVG not yet placed */}
        <div className="opacity-40 hover:opacity-60 transition-opacity">
          <Image
            src="/assets/logo-mark.svg"
            alt="BurnerPoint"
            width={24}
            height={24}
            className="inline-block mr-2"
            onError={(e) => {
              // Hide broken image icon if SVG not placed yet
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-xs text-brand-muted font-mono">BurnerPoint</span>
        </div>
      </div>
    </div>
  );
}
