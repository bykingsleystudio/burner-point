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
import {
  footerGroups,
  primaryNav,
  socialLinks,
  trustBadges,
  type IconKey,
  type MarketingCard,
  type MarketingPageContent,
} from '@/lib/marketing-data';

function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const external = href.startsWith('http') || href.startsWith('mailto:');
  if (external) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

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
    <div className="mb-4 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.34em] text-brand-green">
      <span className="h-px w-8 bg-brand-green/80" />
      <span>{children}</span>
    </div>
  );
}

export function BurnerLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Burner Point home">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-green/25 bg-brand-green/10 shadow-[0_0_32px_rgba(0,255,157,0.18)] transition group-hover:scale-105 group-hover:bg-brand-green/20">
        <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} priority />
      </span>
      {!compact ? (
        <span className="font-mono text-base font-semibold uppercase tracking-[0.22em] text-white">
          Burner <span className="text-brand-green">Point</span>
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
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#050807]/82 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 xl:px-8">
        <BurnerLogo />
        <nav className="hidden items-center gap-5 text-sm text-white/58 xl:flex" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-brand-green">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/auth/login" className="rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/82 transition hover:border-brand-green/45 hover:text-white">
            Sign In
          </Link>
          <Link href="/auth/signup" className="bp-button-glow rounded-xl bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac]">
            Get Started
          </Link>
          <Link href="/api/docs" className="rounded-xl border border-brand-green/20 bg-brand-green/8 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green transition hover:bg-brand-green/15">
            View API Docs
          </Link>
        </div>
        <details className="group relative lg:hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white transition hover:border-brand-green/35 hover:text-brand-green">
            <span className="sr-only">Open navigation</span>
            <MenuIcon />
          </summary>
          <div className="absolute right-0 mt-3 w-[min(88vw,360px)] rounded-[28px] border border-white/10 bg-[#07100c]/98 p-4 shadow-[0_26px_80px_rgba(0,0,0,0.48)]">
            <div className="grid gap-2">
              {primaryNav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl px-4 py-3 text-sm font-semibold text-white/78 transition hover:bg-brand-green/10 hover:text-brand-green">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-2 border-t border-white/8 pt-4">
              <Link href="/auth/login" className="rounded-2xl border border-white/10 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/82">Sign In</Link>
              <Link href="/auth/signup" className="rounded-2xl bg-brand-green px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-black">Get Started</Link>
              <Link href="/api/docs" className="rounded-2xl border border-brand-green/20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">View API Docs</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1.95fr]">
          <div>
            <BurnerLogo />
            <p className="mt-6 max-w-md text-sm leading-8 text-white/56">
              Burner Point is a privacy-focused telecommunications platform for temporary phone numbers, eSIM services, proxies, and integrated privacy protection.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/54">
              <a href="mailto:info.burnerpoint@gmail.com" className="block transition hover:text-brand-green">Email: info.burnerpoint@gmail.com</a>
              <a href="https://t.me/burnerpoint" className="block transition hover:text-brand-green">Telegram: @burnerpoint</a>
              <a href="https://t.me/burnerpointapp" className="block transition hover:text-brand-green">Telegram App: @burnerpointapp</a>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mt-12 rounded-[28px] border border-white/8 bg-white/[0.02] p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/36">Social Media</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:-translate-y-0.5 hover:border-brand-green/40 hover:text-brand-green">
                    {item.short}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {trustBadges.map((badge) => (
                <Link key={badge.label} href={badge.href} className="rounded-full border border-white/8 bg-white/[0.025] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/44 transition hover:border-brand-green/30 hover:text-brand-green">
                  {badge.label}
                </Link>
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
    <main className="relative min-h-screen overflow-hidden bg-brand-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.15),transparent_64%)]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] bg-[radial-gradient(circle,rgba(0,255,157,0.08),transparent_68%)]" />
      </div>
      <div className="relative z-10">
        <SiteHeader />
        {children}
        <SiteFooter />
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
      className="bp-card group h-full scroll-mt-28 rounded-[30px] p-7 transition duration-300 hover:-translate-y-1 hover:border-brand-green/24 hover:shadow-[0_34px_90px_rgba(0,255,157,0.11)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
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

  return card.href ? <Link href={card.href} className="block h-full">{content}</Link> : content;
}

export function MarketingPage({ page }: { page: MarketingPageContent }) {
  return (
    <MarketingShell>
      <section className="relative py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center xl:px-8">
          <div>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1 className="max-w-5xl text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl xl:text-8xl">{page.title}</h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/62 md:text-xl md:leading-9">{page.description}</p>
            {(page.primaryCta || page.secondaryCta) ? (
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {page.primaryCta ? (
                  <CtaLink
                    href={page.primaryCta.href}
                    className="bp-button-glow inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-green px-7 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac]"
                  >
                    {page.primaryCta.label}
                    <ArrowRight className="ml-3 h-4 w-4" />
                  </CtaLink>
                ) : null}
                {page.secondaryCta ? (
                  <CtaLink
                    href={page.secondaryCta.href}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/82 transition hover:border-brand-green/35 hover:text-white"
                  >
                    {page.secondaryCta.label}
                  </CtaLink>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="bp-card rounded-[40px] p-7 md:p-8">
            <div className="rounded-[32px] border border-brand-green/15 bg-[#050807] p-6">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-green">Burner Point</div>
                <ShieldCheck className="h-5 w-5 text-brand-green" />
              </div>
              <div className="mt-8 text-4xl font-semibold uppercase leading-none text-white md:text-5xl">Private<br /><span className="bp-outline">By Design</span></div>
              <p className="mt-5 text-sm leading-7 text-white/58">Stay Anonymous. Stay Connected. Use phone, data, routing, and verification tools without exposing your personal line.</p>
              {page.highlights?.length ? (
                <div className="mt-7 space-y-3">
                  {page.highlights.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.025] px-4 py-3">
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
      {page.cards?.length ? <section className="relative py-20 md:py-24"><div className="mx-auto grid max-w-7xl gap-5 px-5 sm:px-6 md:grid-cols-2 xl:grid-cols-3 xl:px-8">{page.cards.map((card) => <FeatureCard key={`${page.slug}-${card.title}`} card={card} />)}</div></section> : null}
      {page.sections?.length ? <section className="relative py-20 md:py-24"><div className="mx-auto grid max-w-7xl gap-5 px-5 sm:px-6 lg:grid-cols-2 xl:px-8">{page.sections.map((section) => <article key={section.title} className="bp-card rounded-[34px] p-7 md:p-8"><h2 className="font-mono text-xl font-semibold uppercase tracking-[0.12em] text-white">{section.title}</h2><p className="mt-5 text-base leading-8 text-white/60">{section.text}</p>{section.items?.length ? <div className="mt-6"><BulletList items={section.items} /></div> : null}</article>)}</div></section> : null}
      {page.faqs?.length ? <section className="relative py-20 md:py-24"><div className="mx-auto max-w-5xl px-5 sm:px-6 xl:px-8"><Eyebrow>Answers</Eyebrow><div className="space-y-4">{page.faqs.map((faq) => <details key={faq.question} className="bp-card group rounded-[24px] p-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-mono text-sm font-semibold uppercase tracking-[0.14em] text-white [&::-webkit-details-marker]:hidden"><span>{faq.question}</span><span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-brand-green/15 bg-brand-green/10 text-brand-green transition group-open:rotate-45">+</span></summary><p className="pt-5 text-sm leading-7 text-white/58">{faq.answer}</p></details>)}</div></div></section> : null}
      {page.slug === 'contact' ? <ContactFormSection /> : null}
    </MarketingShell>
  );
}

function ContactFormSection() {
  return (
    <section className="relative pb-20 md:pb-28">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] xl:px-8">
        <div className="bp-card rounded-[34px] p-7">
          <h2 className="font-mono text-xl font-semibold uppercase tracking-[0.14em] text-white">Support Channels</h2>
          <div className="mt-6 space-y-3 text-sm text-white/60">
            <a href="mailto:info.burnerpoint@gmail.com" className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 transition hover:border-brand-green/35 hover:text-brand-green">Email: info.burnerpoint@gmail.com</a>
            <a href="https://t.me/burnerpoint" className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 transition hover:border-brand-green/35 hover:text-brand-green">Telegram: https://t.me/burnerpoint</a>
            <a href="https://t.me/burnerpointapp" className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 transition hover:border-brand-green/35 hover:text-brand-green">Telegram App: https://t.me/burnerpointapp</a>
          </div>
        </div>
        <form action="mailto:info.burnerpoint@gmail.com" method="post" encType="text/plain" className="bp-card rounded-[34px] p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-white/70">Name<input name="name" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-white outline-none transition placeholder:text-white/28 focus:border-brand-green/45" placeholder="Your name" /></label>
            <label className="text-sm text-white/70">Email<input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-white outline-none transition placeholder:text-white/28 focus:border-brand-green/45" placeholder="you@example.com" /></label>
          </div>
          <label className="mt-4 block text-sm text-white/70">Message<textarea name="message" required rows={6} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-white outline-none transition placeholder:text-white/28 focus:border-brand-green/45" placeholder="Tell us what you need help with..." /></label>
          <button type="submit" className="bp-button-glow mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-green px-7 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] md:w-auto">
            Send Support Email
            <ArrowRight className="ml-3 h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
