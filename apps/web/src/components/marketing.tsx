'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Check, CreditCard, Globe2, HelpCircle, Lock, Mail, MessageSquare, Phone, ShieldCheck, Smartphone, Wifi } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MarketingFooter, MarketingHeader } from '@/components/sections/bp-marketing-shell';
import { BpButton } from '@/components/ui/bp-landing-primitives';
import {
  type IconKey,
  type MarketingCard,
  type MarketingPageContent,
} from '@/lib/marketing-data';

const icons: Record<IconKey, LucideIcon> = {
  bell: ShieldCheck,
  book: HelpCircle,
  briefcase: ShieldCheck,
  calendar: CreditCard,
  code: ShieldCheck,
  credit: CreditCard,
  file: MessageSquare,
  globe: Globe2,
  help: HelpCircle,
  key: Lock,
  lock: Lock,
  mail: Mail,
  message: MessageSquare,
  phone: Phone,
  shield: ShieldCheck,
  smartphone: Smartphone,
  wifi: Wifi,
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#00A76A]">{children}</p>;
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f7f3] text-[#07140f]">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <MarketingHeader />
      <div id="main-content">{children}</div>
      <MarketingFooter />
    </main>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm text-[#375245]">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-none text-[#00A76A]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeatureCard({ card }: { card: MarketingCard }) {
  const Icon = card.icon ? icons[card.icon] : ShieldCheck;
  const content = (
    <article
      id={card.anchorId}
      className="group h-full rounded-[1.75rem] border border-black/6 bg-white p-7 shadow-[0_18px_48px_rgba(2,20,12,0.06)] transition hover:-translate-y-1 hover:border-[#00FF9D]/24 hover:shadow-[0_28px_80px_rgba(0,255,157,0.1)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[#013220] text-[#00FF9D]">
          <Icon className="h-6 w-6" />
        </div>
        {card.meta ? (
          <span className="rounded-full border border-[#00FF9D]/18 bg-[#effcf5] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#00A76A]">
            {card.meta}
          </span>
        ) : null}
      </div>
      <h3 className="mt-7 text-lg font-semibold text-[#07140f]">{card.title}</h3>
      <p className="mt-4 text-sm leading-7 text-[#456052]">{card.text}</p>
      {card.cta ? (
        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00A76A]">
          {card.cta}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </div>
      ) : null}
    </article>
  );

  return card.href ? <Link href={card.href} className="block h-full" aria-label={`${card.cta ?? 'Open'}: ${card.title}`}>{content}</Link> : content;
}

export function MarketingPage({ page }: { page: MarketingPageContent }) {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden py-14 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(1,50,32,0.12),transparent_26%),linear-gradient(180deg,#f8fbf9,#edf5f0)]" />
          <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-[#00FF9D]/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#9FA6B2]/18 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[92rem] gap-10 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[0.96] text-[#07140f] sm:text-5xl lg:text-7xl">
              {page.title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#456052] md:text-lg">
              {page.description}
            </p>

            {(page.primaryCta || page.secondaryCta) ? (
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                {page.primaryCta ? (
                  <BpButton href={page.primaryCta.href} variant="primary" size="md">
                    {page.primaryCta.label}
                  </BpButton>
                ) : null}
                {page.secondaryCta ? (
                  <Link
                    href={page.secondaryCta.href}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white/80 px-5 text-sm font-semibold text-[#07140f] transition hover:border-[#00FF9D]/28 hover:bg-white"
                  >
                    {page.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#07140f,#013220_58%,#07140f)] p-5 text-white shadow-[0_28px_90px_rgba(2,20,12,0.16)] md:p-8">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Burner Point</p>
              <h2 className="mt-4 text-3xl font-black leading-[0.92] text-white md:text-4xl">
                Private by design. Built for control.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/72">
                A premium privacy-first experience for private numbers, messaging, verification, rentals, travel connectivity, proxies, and secure access.
              </p>
              {page.highlights?.length ? (
                <div className="mt-6 grid gap-3">
                  {page.highlights.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-black/20 px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#00FF9D]" />
                      <span className="text-sm text-white/78">{item}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {page.cards?.length ? (
        <section className="py-6 md:py-10">
          <div className="mx-auto grid max-w-[92rem] gap-5 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-3 lg:px-8">
            {page.cards.map((card) => (
              <FeatureCard key={`${page.slug}-${card.title}`} card={card} />
            ))}
          </div>
        </section>
      ) : null}

      {page.sections?.length ? (
        <section className="py-8 md:py-12">
          <div className="mx-auto grid max-w-[92rem] gap-5 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            {page.sections.map((section, index) => (
              <article
                key={section.title}
                id={section.anchorId}
                className={[
                  'rounded-[1.8rem] p-6 shadow-[0_18px_48px_rgba(2,20,12,0.06)] lg:col-span-6',
                  index % 3 === 0
                    ? 'border border-black/6 bg-white text-[#07140f]'
                    : 'bg-[linear-gradient(180deg,#07140f,#03140d)] text-white',
                ].join(' ')}
              >
                {section.meta ? (
                  <span
                    className={[
                      'inline-flex rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em]',
                      index % 3 === 0
                        ? 'border border-[#00FF9D]/18 bg-[#effcf5] text-[#00A76A]'
                        : 'border border-white/10 bg-white/[0.06] text-[#00FF9D]',
                    ].join(' ')}
                  >
                    {section.meta}
                  </span>
                ) : null}
                <h2 className="mt-4 text-2xl font-semibold first:mt-0">{section.title}</h2>
                <p className={`mt-5 text-base leading-8 ${index % 3 === 0 ? 'text-[#456052]' : 'text-white/72'}`}>{section.text}</p>
                {section.items?.length ? (
                  <div className="mt-6">
                    <BulletList items={section.items} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {page.faqs?.length ? (
        <section className="py-10 md:py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Eyebrow>Answers</Eyebrow>
            <div className="mt-6 space-y-4">
              {page.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="rounded-[1.4rem] border border-black/6 bg-white p-5 shadow-[0_18px_48px_rgba(2,20,12,0.06)]"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[#07140f]">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#456052]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {page.slug === 'contact' ? <ContactFormSection /> : null}
    </MarketingShell>
  );
}

function ContactFormSection() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto grid max-w-[92rem] gap-6 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#07140f,#013220_62%,#0a1d14)] p-6 text-white shadow-[0_28px_90px_rgba(2,20,12,0.16)]">
          <Eyebrow>Support</Eyebrow>
          <h2 className="mt-4 text-3xl font-black leading-[0.94] text-white">Talk to Burner Point.</h2>
          <p className="mt-4 text-base leading-8 text-white/72">
            Reach support for pricing, access, verification, rentals, travel data, proxy plans, secure tunnel, and account issues.
          </p>
          <div className="mt-6 grid gap-3">
            <ContactLine label="Email" value="info.burnerpoint@gmail.com" href="mailto:info.burnerpoint@gmail.com" />
            <ContactLine label="Telegram" value="@burnerpoint" href="https://t.me/burnerpoint" />
            <ContactLine label="Community" value="@burnerpointapp" href="https://t.me/burnerpointapp" />
          </div>
        </div>

        <form action="mailto:info.burnerpoint@gmail.com" method="post" encType="text/plain" className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(2,20,12,0.06)]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                name="name"
                required
                autoComplete="name"
                className="mt-2 w-full rounded-[1rem] border border-black/8 bg-[#f7fbf8] px-4 py-3 text-sm text-[#07140f] outline-none transition focus:border-[#00FF9D]/30"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-[1rem] border border-black/8 bg-[#f7fbf8] px-4 py-3 text-sm text-[#07140f] outline-none transition focus:border-[#00FF9D]/30"
                placeholder="you@example.com"
              />
            </Field>
          </div>
          <Field label="Message">
            <textarea
              name="message"
              required
              rows={6}
              className="mt-2 w-full rounded-[1rem] border border-black/8 bg-[#f7fbf8] px-4 py-3 text-sm text-[#07140f] outline-none transition focus:border-[#00FF9D]/30"
              placeholder="Tell us what you need help with..."
            />
          </Field>
          <BpButton type="submit" className="mt-5 w-full md:w-auto">
            Send Support Email
          </BpButton>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[#274437]">
      {label}
      {children}
    </label>
  );
}

function ContactLine({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className="rounded-[1rem] border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:border-[#00FF9D]/24"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-white/46">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </a>
  );
}
