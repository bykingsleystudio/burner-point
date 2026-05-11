'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="text-sm text-brand-muted">Loading payment status...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref') || searchParams.get('reference');

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-2xl border border-brand-border bg-brand-card p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-400/10">
          <ShieldAlert className="h-6 w-6 text-yellow-300" />
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-yellow-300">Payment cancelled</p>
        <h1 className="mt-2 text-2xl font-bold">Checkout was not completed</h1>
        <p className="mt-3 text-sm leading-6 text-white/64">
          No wallet credit or service access is applied until a payment is confirmed.
        </p>

        {reference ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-[#020806]/25 p-4">
            <p className="text-xs text-brand-muted">Reference</p>
            <p className="mt-1 break-all font-mono text-sm text-white">{reference}</p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/dashboard/billing" className="flex min-h-12 items-center justify-center rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-black">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Link>
          <Link href="/dashboard/support" className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/72 hover:border-brand-green/35 hover:text-white">
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
