'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="text-sm text-brand-muted">Loading payment status...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref') || searchParams.get('reference');

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-2xl border border-brand-green/20 bg-brand-green/[0.06] p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-green/25 bg-brand-green/10">
          <CheckCircle2 className="h-6 w-6 text-brand-green" />
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-brand-green">Payment received</p>
        <h1 className="mt-2 text-2xl font-bold">Checkout complete</h1>
        <p className="mt-3 text-sm leading-6 text-white/64">
          Burner Point will update your wallet funding or subscription access as soon as the payment is confirmed server-side.
        </p>

        {reference ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-[#020806]/25 p-4">
            <p className="text-xs text-brand-muted">Reference</p>
            <p className="mt-1 break-all font-mono text-sm text-white">{reference}</p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/dashboard/billing" className="flex min-h-12 items-center justify-center rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-black">
            View Billing
          </Link>
          <Link href="/dashboard" className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/72 hover:border-brand-green/35 hover:text-white">
            Dashboard
          </Link>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          { icon: CreditCard, title: 'Confirmation in progress', text: 'Billing updates usually appear automatically within moments of a completed checkout.' },
          { icon: ShieldCheck, title: 'Protected flow', text: 'Your purchase stays tied to this reference so support can help quickly if anything looks delayed.' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-2xl border border-brand-border bg-brand-card p-4">
              <Icon className="h-5 w-5 text-brand-green" />
              <h2 className="mt-3 text-sm font-semibold">{item.title}</h2>
              <p className="mt-2 text-xs leading-5 text-brand-muted">{item.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
