'use client';

import { Show, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  Code2,
  CreditCard,
  FileText,
  Globe2,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BpAccordion, BpButton, BpInput, BpSupportWidget, BpTextarea, BpTrustBadge } from '@/components/design-system';
import {
  footerGroups,
  primaryNav,
  socialLinks,
  trustBadges,
  type IconKey,
  type MarketingCard,
  type MarketingPageContent,
} from '@/lib/marketing-data';

const icons: Record<IconKey, LucideIcon> = {
  bell: Bell,
  book: BookOpen,
  briefcase: Briefcase,
  calendar: CalendarDays,
  code: Code2,
  credit: CreditCard,
  file: FileText,
  globe: Globe2,
  help: HelpCircle,
  key: KeyRound,
  lock: Lock,
  mail: Mail,
  message: MessageSquare,
  phone: Phone,
  shield: ShieldCheck,
  smartphone: Smartphone,
  wifi: Wifi,
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="bp-label mb-4 inline-flex items-center gap-3 font-mono text-[10px] text-brand-green">
      <span className="h-px w-8 bg-brand-green/80" />
      <span>{children}</span>
    </div>
  );
}

export function BurnerLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Burner Point home">
      <span className="flex h-10 w-10 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10 shadow-[0_0_32px_rgba(0,255,157,0.18)] transition group-hover:scale-105 group-hover:bg-brand-green/20">
        <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} priority />
      </span>
      {!compact ? (
        <span className="bp-brand-wordmark bp-metal-text text-base">
          Burner Point
        </span>
      ) : null}
    </Link>
  );
}

function MenuIcon() {
  return (
    <span className="flex h-5 w-5 flex-col justify-center gap-1.5">
      <span className="h-px w-full bg-current" />
      <span className="h-px w-full bg-current" />
      <span className="h-px w-full bg-current" />
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border/80 bg-brand-black/88 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-[1680px] items-center justify-between gap-4 px-5 sm:px-6 xl:px-10 2xl:min-h-24">
        <BurnerLogo />
        <nav className="hidden items-center gap-5 text-sm text-white/58 xl:flex 2xl:gap-7" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-bp px-2 py-2 transition hover:bg-brand-green/8 hover:text-brand-green">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Show when="signed-out">
            <Link href="/auth/login" className="bp-secondary-action px-4 py-3 text-xs font-semibold uppercase">
              Sign In
            </Link>
            <Link href="/auth/signup" className="bp-primary-action px-4 py-3 text-xs font-semibold uppercase">
              Get Started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="bp-secondary-action px-4 py-3 text-xs font-semibold uppercase">
              Dashboard
            </Link>
            <UserButton />
          </Show>
          <Link href="/api/docs" className="rounded-bp border border-brand-green/20 bg-brand-green/8 px-4 py-3 text-xs font-semibold uppercase text-brand-green transition hover:bg-brand-green/15">
            View API Docs
          </Link>
        </div>
        <details className="group relative z-[70] lg:hidden [&_summary::-webkit-details-marker]:hidden">
          <summary aria-label="Open navigation menu" className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-bp-md border border-white/16 bg-black/95 text-white shadow-[0_12px_34px_rgba(0,0,0,0.45)] transition hover:border-brand-green/45 hover:text-brand-green">
            <span className="sr-only">Toggle navigation</span>
            <MenuIcon />
          </summary>
          <div role="navigation" aria-label="Mobile primary navigation" className="fixed inset-x-3 top-20 z-[80] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-bp-lg border border-brand-green/25 bg-[#000000]/98 p-4 text-white shadow-[0_28px_90px_rgba(0,0,0,0.72)] backdrop-blur-md supports-[backdrop-filter]:bg-[#013220]/95">
            <div className="mb-4 flex items-center justify-between border-b border-brand-green/20 pb-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-green">Menu</p>
              <span className="rounded-bp border border-brand-green/30 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white/86">
                Tap menu icon to close
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {primaryNav.map((item) => (
                <Link key={item.href} href={item.href} className="flex min-h-12 items-center rounded-bp border border-white/10 bg-black/25 px-4 py-3 text-sm font-semibold text-white/88 transition hover:bg-brand-green/14 hover:text-brand-green">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-2 border-t border-brand-green/20 pt-4">
              <Show when="signed-out">
                <Link href="/auth/login" className="rounded-bp border border-white/18 bg-black/30 px-4 py-3 text-center text-xs font-semibold uppercase text-white">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="rounded-bp bg-brand-green px-4 py-3 text-center text-xs font-semibold uppercase text-black">
                  Get Started
                </Link>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className="rounded-bp border border-white/18 bg-black/30 px-4 py-3 text-center text-xs font-semibold uppercase text-white">
                  Dashboard
                </Link>
                <div className="flex justify-center rounded-bp border border-white/18 bg-black/30 px-4 py-3">
                  <UserButton />
                </div>
              </Show>
              <Link href="/api/docs" className="rounded-bp border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-center text-xs font-semibold uppercase text-brand-green">View API Docs</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/6 py-12 md:py-20">
      <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BurnerLogo />
            <p className="mt-6 max-w-md text-sm leading-8 text-white/56">
              Burner Point is a privacy-focused telecommunications platform built for speed, privacy, and global access.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/54">
              <a href="mailto:info.burnerpoint@gmail.com" className="block transition hover:text-brand-green">Email: info.burnerpoint@gmail.com</a>
              <a href="https://t.me/burnerpoint" className="block transition hover:text-brand-green">Telegram: @burnerpoint</a>
              <a href="https://t.me/burnerpointapp" className="block transition hover:text-brand-green">Telegram App: @burnerpointapp</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:col-span-8 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <Link href={group.href} className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:text-brand-green">
                  {group.title}
                </Link>
                <ul className="mt-5 space-y-3 text-sm text-white/48">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="transition hover:text-brand-green">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="bp-panel mt-12 p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/36">Social Media</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {socialLinks.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={`${item.label} ${item.handle}`} className="flex min-h-11 items-center gap-3 rounded-bp border border-white/10 bg-black/25 px-3 py-2 transition hover:-translate-y-0.5 hover:border-brand-green/40 hover:text-brand-green">
                    <span className="flex h-7 w-7 items-center justify-center rounded-bp border border-white/10 font-mono text-[10px] font-semibold uppercase text-white/70">
                      {item.short}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-white/76">{item.label}</span>
                      <span className="block font-mono text-[10px] text-white/42">{item.handle}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {trustBadges.map((badge) => (
                <BpTrustBadge key={badge.label} label={badge.label} href={badge.href} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 text-xs text-white/34 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Burner Point. All rights reserved.</p>
          <p className="font-mono uppercase tracking-[0.2em] text-brand-green/70">Stay Anonymous. Stay Connected. Private By Design.</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-brand-black pb-20 text-white md:pb-0">
      <a href="#main-content" className="bp-skip-link">Skip to content</a>
      <div className="pointer-events-none fixed inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[560px] bg-[linear-gradient(180deg,rgba(1,50,32,0.62),rgba(0,0,0,0))]" />
        <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[linear-gradient(0deg,rgba(1,50,32,0.32),rgba(0,0,0,0))]" />
      </div>
      <div className="relative z-10">
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
      </div>
      <div role="navigation" aria-label="Mobile conversion actions" className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-green/15 bg-brand-black/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.44)] backdrop-blur-xl md:hidden">
        <Show when="signed-out">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/auth/signup" className="bp-primary-action flex min-h-12 items-center justify-center px-4 py-3 text-xs font-semibold uppercase">
              Get Started
            </Link>
            <Link href="/auth/login" className="bp-secondary-action flex min-h-12 items-center justify-center px-4 py-3 text-xs font-semibold uppercase">
              Sign In
            </Link>
          </div>
        </Show>
        <Show when="signed-in">
          <Link href="/dashboard" className="bp-primary-action flex min-h-12 items-center justify-center px-4 py-3 text-xs font-semibold uppercase">
            Open Dashboard
          </Link>
        </Show>
      </div>
    </main>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm text-white/66">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-none text-brand-green" />
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
      className="bp-card group h-full scroll-mt-28 rounded-bp-lg p-7 transition duration-300 hover:-translate-y-1 hover:border-brand-green/24 hover:shadow-[0_34px_90px_rgba(0,255,157,0.11)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-bp-md border border-white/8 bg-white/[0.03]">
          <Icon className="h-6 w-6 text-brand-green" />
        </div>
        {card.meta ? <span className="rounded-full border border-brand-green/18 bg-brand-green/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-green/90">{card.meta}</span> : null}
      </div>
      <h3 className="mt-7 font-mono text-lg font-semibold uppercase tracking-[0.08em] text-white">{card.title}</h3>
      <p className="mt-4 text-sm leading-7 text-white/58">{card.text}</p>
      {card.cta ? (
        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green">
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
      <section className="bp-section-shell relative py-14 md:py-28" aria-labelledby={`${page.slug}-hero-title`}>
        <div className="mx-auto grid max-w-[1680px] gap-12 px-5 sm:px-6 lg:grid-cols-12 lg:items-center xl:px-10 2xl:py-8">
          <div className="lg:col-span-7">
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1 id={`${page.slug}-hero-title`} className="max-w-6xl text-4xl font-semibold uppercase leading-[0.98] text-white sm:text-5xl md:text-7xl xl:text-8xl 2xl:text-[6.6rem]">{page.title}</h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/62 md:text-xl md:leading-9">{page.description}</p>
            {(page.primaryCta || page.secondaryCta) ? (
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {page.primaryCta ? (
                  <BpButton
                    href={page.primaryCta.href}
                    variant="primary"
                    size="md"
                  >
                    {page.primaryCta.label}
                  </BpButton>
                ) : null}
                {page.secondaryCta ? (
                  <BpButton
                    href={page.secondaryCta.href}
                    variant="secondary"
                    size="md"
                    icon={null}
                  >
                    {page.secondaryCta.label}
                  </BpButton>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="bp-card rounded-bp-lg p-5 transition duration-300 hover:border-brand-green/22 hover:shadow-[0_34px_100px_rgba(0,255,157,0.1)] md:p-8 lg:col-span-5">
            <div className="rounded-bp-lg border border-brand-green/15 bg-brand-black p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-green">Burner Point</div>
                <ShieldCheck className="h-5 w-5 text-brand-green" />
              </div>
              <div className="mt-8 text-4xl font-semibold uppercase leading-none text-white md:text-5xl">Private<br /><span className="bp-outline">By Design</span></div>
              <p className="mt-5 text-sm leading-7 text-white/58">Stay Anonymous. Stay Connected. Use phone, data, routing, and verification tools without exposing your personal line.</p>
              {page.highlights?.length ? (
                <div className="mt-7 space-y-3">
                  {page.highlights.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-bp-md border border-white/7 bg-white/[0.025] px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-green shadow-[0_0_14px_rgba(0,255,157,0.8)]" />
                      <span className="text-sm text-white/72">{item}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <div className="bp-divider" />
      {page.cards?.length ? <section className="bp-section-shell relative py-14 md:py-24" aria-label={`${page.title} feature cards`}><div className="mx-auto grid max-w-[1680px] gap-5 px-5 sm:px-6 md:grid-cols-2 xl:grid-cols-3 xl:px-10">{page.cards.map((card) => <FeatureCard key={`${page.slug}-${card.title}`} card={card} />)}</div></section> : null}
      {page.sections?.length ? (
        <section className="bp-section-shell relative py-14 md:py-24" aria-label={`${page.title} details`}>
          <div className="mx-auto grid max-w-[1680px] gap-5 px-5 sm:px-6 lg:grid-cols-12 xl:px-10">
            {page.sections.map((section) => (
              <article
                key={section.title}
                id={section.anchorId}
                className="bp-card scroll-mt-28 rounded-bp-lg p-5 transition duration-300 hover:border-brand-green/22 hover:shadow-[0_34px_90px_rgba(0,255,157,0.09)] md:p-8 lg:col-span-6"
              >
                {section.meta ? (
                  <span className="inline-flex rounded-full border border-brand-green/18 bg-brand-green/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-green/90">
                    {section.meta}
                  </span>
                ) : null}
                <h2 className="mt-4 font-mono text-xl font-semibold uppercase text-white first:mt-0">{section.title}</h2>
                <p className="mt-5 text-base leading-8 text-white/60">{section.text}</p>
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
      {page.faqs?.length ? <section className="bp-section-shell relative py-14 md:py-24" aria-labelledby={`${page.slug}-answers-title`}><div className="mx-auto max-w-6xl px-5 sm:px-6 xl:px-10"><Eyebrow>Answers</Eyebrow><h2 id={`${page.slug}-answers-title`} className="sr-only">{page.title} answers</h2><div className="space-y-4">{page.faqs.map((faq) => <BpAccordion key={faq.question} question={faq.question} answer={faq.answer} />)}</div></div></section> : null}
      {page.slug === 'contact' ? <ContactFormSection /> : null}
    </MarketingShell>
  );
}

function ContactFormSection() {
  return (
    <section className="bp-section-shell relative pb-20 md:pb-28" aria-labelledby="contact-support-title">
      <div className="mx-auto grid max-w-[1680px] gap-6 px-5 sm:px-6 lg:grid-cols-12 xl:px-10">
        <div className="lg:col-span-5">
          <BpSupportWidget />
        </div>
        <form action="mailto:info.burnerpoint@gmail.com" method="post" encType="text/plain" className="bp-card rounded-bp-lg p-7 lg:col-span-7">
          <h2 id="contact-support-title" className="sr-only">Contact Burner Point support</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-white/70">Name<BpInput name="name" required autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="mt-2" placeholder="Your name" /></label>
            <label className="text-sm text-white/70">Email<BpInput name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" enterKeyHint="next" className="mt-2" placeholder="you@example.com" /></label>
          </div>
          <label className="mt-4 block text-sm text-white/70">Message<BpTextarea name="message" required rows={6} autoComplete="off" enterKeyHint="send" className="mt-2" placeholder="Tell us what you need help with..." /></label>
          <BpButton type="submit" className="mt-5 w-full md:w-auto">
            Send Support Email
          </BpButton>
        </form>
      </div>
    </section>
  );
}
