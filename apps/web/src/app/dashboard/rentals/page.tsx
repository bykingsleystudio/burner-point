'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRight, CalendarDays, Clock, CreditCard, Phone, ShieldCheck } from 'lucide-react';
import { paymentsApi, type PaymentGatewayId } from '@/lib/api';

const DURATIONS = [
  { days: 1, label: '1 day', text: 'Fast one-time access' },
  { days: 3, label: '3 days', text: 'Short project window' },
  { days: 7, label: '7 days', text: 'Most temporary workflows' },
  { days: 14, label: '14 days', text: 'Maximum non-renewable window' },
];

const GATEWAYS: Array<{ id: PaymentGatewayId; label: string; text: string }> = [
  { id: 'paystack', label: 'Paystack', text: 'Primary local checkout' },
  { id: 'paddle', label: 'Paddle', text: 'International card checkout' },
  { id: 'nowpayments', label: 'NOWPayments', text: 'Crypto checkout' },
];

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
];

const lifecycle = [
  'Reserve available inventory before checkout expires.',
  'Confirm payment through gateway webhook before assignment.',
  'Attach number to account with expiration and renewal state.',
  'Notify before expiry and route support through billing reference.',
];

export default function RentalsPage() {
  const [days, setDays] = useState(7);
  const [gateway, setGateway] = useState<PaymentGatewayId>('paystack');
  const [countryCode, setCountryCode] = useState('US');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const startCheckout = async () => {
    if (phoneNumber.trim() && !/^\+[1-9]\d{6,14}$/.test(phoneNumber.trim().replace(/[^\d+]/g, ''))) {
      toast.error('Use E.164 format for the selected number, for example +14155550182.');
      return;
    }

    setProcessing(true);
    try {
      const response = await paymentsApi.initialize({
        paymentType: 'rental',
        gateway,
        rentalDays: days,
        countryCode,
        phoneNumber: phoneNumber.trim().replace(/[^\d+]/g, '') || undefined,
        numberType: 'burner',
        clientPlatform: 'web',
      });
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
        return;
      }
      toast.success('Rental checkout created.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? 'Unable to start rental checkout');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.42fr] lg:items-start">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Rental purchase flow</p>
            <h1 className="mt-2 text-3xl font-black uppercase leading-none text-white md:text-5xl">
              Temporary when speed matters. Renewable when continuity matters.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-muted">
              Buy non-renewable rental access for one to fourteen days, or move to a monthly plan when account recovery, repeat verification, SMS, MMS, calls, and voicemail need continuity.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startCheckout}
                disabled={processing}
                className="bp-primary-action inline-flex min-h-12 items-center justify-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] disabled:opacity-50"
              >
                {processing ? 'Opening checkout...' : 'Rent A Number'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="/dashboard/subscriptions" className="inline-flex min-h-12 items-center justify-center rounded-bp border border-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:border-brand-green/35 hover:text-white">
                Start Monthly Plan
              </Link>
            </div>
          </div>

          <div className="rounded-bp-lg border border-brand-green/16 bg-brand-green/[0.045] p-5">
            <ShieldCheck className="h-6 w-6 text-brand-green" />
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Pricing</p>
            <p className="mt-2 font-mono text-4xl text-brand-green">$5.99+</p>
            <p className="mt-2 text-sm leading-6 text-white/62">Non-renewable rentals start at $5.99 depending on country, duration, and provider route.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Choose duration</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {DURATIONS.map((duration) => {
              const selected = days === duration.days;
              return (
                <button
                  key={duration.days}
                  type="button"
                  onClick={() => setDays(duration.days)}
                  className={`rounded-bp-lg border p-4 text-left transition ${
                    selected ? 'border-brand-green bg-brand-green/10' : 'border-brand-border bg-black/18 hover:border-brand-green/30'
                  }`}
                >
                  <p className="font-mono text-2xl text-brand-green">{duration.label}</p>
                  <p className="mt-2 text-sm text-brand-muted">{duration.text}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Assignment</p>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => setCountryCode(country.code)}
                  className={`rounded-bp border p-3 text-left transition ${
                    countryCode === country.code ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-white/10 text-white/62 hover:border-brand-green/30 hover:text-white'
                  }`}
                >
                  <p className="font-mono text-sm">{country.code}</p>
                  <p className="mt-1 text-[11px] leading-4 text-white/42">{country.label}</p>
                </button>
              ))}
            </div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
              Selected number
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="+1 415 555 0182"
                className="bp-input mt-2"
              />
              <span className="mt-2 block text-[11px] normal-case leading-5 tracking-normal text-white/42">
                Add a searched inventory number for automatic webhook assignment, or leave blank to create a paid rental entitlement for operator-assisted assignment.
              </span>
            </label>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Gateway</p>
            <div className="grid gap-2">
              {GATEWAYS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGateway(item.id)}
                  className={`rounded-bp border p-3 text-left transition ${
                    gateway === item.id ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-white/10 text-white/62 hover:border-brand-green/30 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase">{item.label}</p>
                  <p className="mt-1 text-[11px] leading-4 text-white/42">{item.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Lifecycle and assignment</h2>
          </div>
          <div className="mt-5 space-y-4">
            {lifecycle.map((item, index) => (
              <div key={item} className="flex gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-bp border border-brand-green/20 bg-brand-green/10 font-mono text-xs text-brand-green">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-white/64">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [Phone, 'Number', 'Reserved'],
              [CreditCard, 'Payment', 'Webhook'],
              [ShieldCheck, 'Privacy', 'Scoped'],
            ].map(([Icon, label, value]) => {
              const ItemIcon = Icon as typeof Phone;
              return (
                <div key={String(label)} className="rounded-bp border border-white/8 bg-black/20 p-3">
                  <ItemIcon className="h-4 w-4 text-brand-green" />
                  <p className="mt-3 font-mono text-sm text-brand-green">{String(value)}</p>
                  <p className="mt-1 text-[10px] uppercase text-white/38">{String(label)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
