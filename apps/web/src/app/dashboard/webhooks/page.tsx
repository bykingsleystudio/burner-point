import Link from 'next/link';
import { ArrowRight, Bell, ShieldCheck, Ticket } from 'lucide-react';

const supportChecklist = [
  'Product involved: Messenger, Verify Hub, Rentals, eSIM, Proxies, or Secure Tunnel',
  'Country, service, number, order, or payment reference when relevant',
  'What happened and what result you expected',
  'Screenshots only when they do not expose unnecessary personal data',
];

export default function AccountNotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.96),rgba(0,0,0,0.96))] p-6 md:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Support requests</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-none text-white md:text-5xl">
          Need event history or account activity help?
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted md:text-base">
          Customer support can review messages, verification attempts, rentals, billing updates, eSIM orders, proxy sessions, and secure tunnel access with the right account reference.
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
          { icon: Bell, title: 'Activity Clarity', text: 'Use support for product activity questions that need account review.' },
          { icon: Ticket, title: 'Ticket Trail', text: 'Support tickets keep issue status, references, and outcomes in one place.' },
          { icon: ShieldCheck, title: 'Privacy Scoped', text: 'Share only the context needed to resolve the specific product issue.' },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <Icon className="h-5 w-5 text-brand-green" />
            <h2 className="mt-4 text-base font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/54">{text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
        <h2 className="text-base font-semibold text-white">What to include</h2>
        <div className="mt-4 grid gap-2">
          {supportChecklist.map((item) => (
            <div key={item} className="rounded-[1rem] border border-white/8 bg-[#020806]/20 px-4 py-3 text-sm text-white/62">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
