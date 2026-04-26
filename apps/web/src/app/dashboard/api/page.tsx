import Link from 'next/link';
import { ArrowRight, HelpCircle, Lock, ShieldCheck } from 'lucide-react';

const requestTypes = [
  'Bulk verification workflow review',
  'Business account controls',
  'Compliance and usage policy questions',
  'Product access that needs manual approval',
];

export default function AccountAccessPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.9),rgba(0,0,0,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)] md:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Account access</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-none text-white md:text-5xl">
          Advanced access is handled through support review.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted md:text-base">
          Burner Point keeps customer screens focused on products, billing, privacy, and support. If your account needs a higher-touch workflow, open a support request with the product, country, and use case.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/support"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-brand-green px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac]"
          >
            Open Support
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-12 items-center justify-center rounded-[1rem] border border-white/10 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:border-brand-green/35 hover:text-white"
          >
            Back To Settings
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'Privacy First', text: 'Only product context needed for review should be included in a request.' },
          { icon: HelpCircle, title: 'Support Reviewed', text: 'Support confirms eligibility, availability, and next steps before access changes.' },
          { icon: Lock, title: 'Safe Defaults', text: 'Sensitive operational controls are not exposed in the customer dashboard.' },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <Icon className="h-5 w-5 text-brand-green" />
            <h2 className="mt-4 text-base font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/54">{text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
        <h2 className="text-base font-semibold text-white">Good request examples</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {requestTypes.map((item) => (
            <div key={item} className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/62">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
