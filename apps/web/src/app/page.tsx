import Link from 'next/link';
import {
  ArrowRight,
  Globe2,
  LockKeyhole,
  MessageSquareText,
  Phone,
  Route,
  Server,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandMotionBanners } from '@/components/brand-motion-banners';
import { LandingPricingSection } from '@/components/landing-pricing-section';
import { Eyebrow, MarketingShell } from '@/components/marketing';
import { TestimonialCard, type Testimonial } from '@/components/ui/sign-in';
import { LiquidLink, MetalLink } from '@/components/ui/liquid-glass-button';
import { SplineScene } from '@/components/ui/splite';
import { getAllIsoAlpha2Sorted, isoToFlagEmoji } from '@/lib/iso-countries';
import { buildMetadata, siteName, siteTagline, siteUrl } from '@/lib/seo';

export const metadata = buildMetadata({
  route: '/',
  title: siteTagline,
  description:
    'Private telecom access for verification, rentals, messaging, eSIM, proxies, and secure routing inside one premium Burner Point platform.',
});

const homeStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${siteName} - ${siteTagline}`,
    description:
      'Private telecom access for verification, rentals, messaging, eSIM, proxies, and secure routing inside one premium Burner Point platform.',
    url: siteUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Burner Point core products',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BP Verify Hub', url: `${siteUrl}/dashboard/verification` },
      { '@type': 'ListItem', position: 2, name: 'BP Number Rentals', url: `${siteUrl}/dashboard/rentals` },
      { '@type': 'ListItem', position: 3, name: 'BP Messenger', url: `${siteUrl}/dashboard/inbox` },
      { '@type': 'ListItem', position: 4, name: 'BP eSIM Store', url: `${siteUrl}/dashboard/esim` },
      { '@type': 'ListItem', position: 5, name: 'BP Secure Tunnel', url: `${siteUrl}/dashboard/vpn` },
    ],
  },
];

const heroMetrics = [
  { label: 'Active Lines', value: '06', detail: 'Private number surfaces live now' },
  { label: 'OTP Success', value: '99.2%', detail: 'Fast delivery across verification flows' },
  { label: 'Regions Live', value: '180+', detail: 'Global reach for access and routing' },
];

const serviceCards: Array<{
  title: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  text: string;
  eyebrow: string;
}> = [
  {
    title: 'BP Messenger',
    href: '/dashboard/inbox',
    cta: 'Learn more',
    icon: MessageSquareText,
    eyebrow: 'Messaging',
    text: 'Private threads, voice context, voicemail, and number-bound message history inside one calmer inbox.',
  },
  {
    title: 'BP Verify Hub',
    href: '/dashboard/verification',
    cta: 'Learn more',
    icon: ShieldCheck,
    eyebrow: 'Verification',
    text: 'Run SMS and voice verification workflows with faster routing, cleaner visibility, and less personal exposure.',
  },
  {
    title: 'BP Rentals',
    href: '/dashboard/rentals',
    cta: 'Learn more',
    icon: Phone,
    eyebrow: 'Numbers',
    text: 'Choose temporary or renewable number rentals for registrations, recovery, short-term operations, and protected communication.',
  },
  {
    title: 'BP eSIM Store',
    href: '/dashboard/esim',
    cta: 'Learn more',
    icon: Smartphone,
    eyebrow: 'Travel data',
    text: 'Travel-ready data plans with quick activation and multi-country coverage, all without swapping physical SIM cards.',
  },
  {
    title: 'BP Proxy Store',
    href: '/dashboard/proxies',
    cta: 'Learn more',
    icon: Server,
    eyebrow: 'Routing',
    text: 'Secure proxy access for location-aware workflows, task separation, and cleaner operational privacy.',
  },
  {
    title: 'BP Secure Tunnel',
    href: '/dashboard/vpn',
    cta: 'Learn more',
    icon: Route,
    eyebrow: 'Protection',
    text: 'Integrated security and routing controls that protect the rest of your Burner Point workflow instead of living as a noisy add-on.',
  },
];

const capabilityRows = [
  'Real mobile-number access',
  'Non-VoIP verification flows',
  'Short-term and renewable rentals',
  'Private messaging and voice context',
  'Travel data through eSIM activation',
  'Protected routing and secure tunnel control',
];

const testimonials: Testimonial[] = [
  {
    avatarSrc:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    name: 'Amina O.',
    handle: 'Operations Lead',
    text: 'Burner Point made number rentals and OTP delivery feel immediate instead of fragile. The flow is calm and the routing is reliable.',
  },
  {
    avatarSrc:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    name: 'Daniel K.',
    handle: 'Growth Builder',
    text: 'The platform finally feels premium. Verification, messaging, and account privacy now live in one place instead of six scattered tools.',
  },
  {
    avatarSrc:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    name: 'Priya S.',
    handle: 'Privacy Consultant',
    text: 'The product language is direct, the pricing is clear, and the private-number workflow is far easier to trust than generic verification sites.',
  },
];

const faqItems = [
  {
    question: 'What does Burner Point actually replace?',
    answer:
      'Burner Point brings private numbers, verification, rentals, messaging, eSIM, proxy access, and secure routing into one account so users do not need separate tools for each step.',
  },
  {
    question: 'Can I go straight from sign-up into the dashboard?',
    answer:
      'Yes. Email, OAuth, and phone-based entry are designed to move directly into the account workspace once authentication and required verification are complete.',
  },
  {
    question: 'Is Burner Point only for one-time OTP codes?',
    answer:
      'No. It supports one-time verification, renewable rentals, private conversation workflows, travel data, routing, and longer-lived account separation.',
  },
];

const allIsoCodes = getAllIsoAlpha2Sorted();
const flagPreview = allIsoCodes.slice(0, 54);
const splineScene = process.env.NEXT_PUBLIC_BP_SPLINE_SCENE?.trim();

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <MarketingShell>
        <section className="bp-section-shell relative overflow-hidden pb-12 pt-8 md:pb-20 md:pt-12">
          <div className="mx-auto grid max-w-[1680px] gap-8 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center xl:px-10">
            <div className="max-w-3xl">
              <Eyebrow>Private Telecom Infrastructure</Eyebrow>
              <h1 className="bp-headline max-w-[12ch] text-5xl leading-[0.9] text-white sm:text-6xl md:text-7xl xl:text-[6.2rem]">
                Don&apos;t want to give out your phone number?
                <span className="mt-3 block bp-metal-text">No problem. Use ours.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68 md:text-xl md:leading-9">
                Private by Design. Stay Anonymous. Stay Connected.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/56">
                Generate secure, non-VoIP numbers instantly and keep messages, voice, rentals, eSIM, and protected routing
                inside one calmer Burner Point surface.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="group relative inline-flex">
                  <span className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,157,0.34),transparent_68%)] opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />
                  <MetalLink href="/auth/signup" variant="primary">
                    <span className="inline-flex items-center gap-2 px-1">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </MetalLink>
                </div>
                <LiquidLink href="/pricing" className="text-white">
                  <span className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                    View Pricing
                  </span>
                </LiquidLink>
                <Link href="/auth/login" className="bp-secondary-action inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em]">
                  Sign In
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/52">
                <Link href="/overview" className="inline-flex items-center gap-2 transition hover:text-brand-green">
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/api/docs" className="inline-flex items-center gap-2 transition hover:text-brand-green">
                  View API Docs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {capabilityRows.map((item) => (
                  <div key={item} className="rounded-[1.25rem] border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/70">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bp-card relative min-h-[24rem] overflow-hidden rounded-[2rem] p-4 sm:min-h-[30rem] lg:min-h-[42rem]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,157,0.18),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(57,255,20,0.1),transparent_20%),linear-gradient(180deg,rgba(1,50,32,0.4),rgba(0,0,0,0.08))]" />
                <div className="absolute left-5 top-5 z-10 rounded-full border border-brand-green/24 bg-brand-green/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">
                  Telecom scene
                </div>
                <div className="absolute inset-0">
                  {splineScene ? <SplineScene scene={splineScene} className="h-full w-full" /> : <TelecomHeroFallback />}
                </div>
                <div className="absolute bottom-4 left-4 right-4 z-10 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Messaging', value: 'Private threads' },
                    { label: 'Verification', value: 'Live OTP routing' },
                    { label: 'Security', value: 'Protected sessions' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-black/38 px-4 py-3 backdrop-blur-xl">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">{item.label}</p>
                      <p className="mt-2 text-sm text-white/76">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bp-section-shell relative pb-12 md:pb-16">
          <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
            <div className="grid gap-4 lg:grid-cols-3">
              {heroMetrics.map((item, index) => (
                <article
                  key={item.label}
                  className="animate-element rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.78),rgba(0,0,0,0.92))] p-5"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">{item.label}</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{item.value}</p>
                  <p className="mt-3 text-sm leading-6 text-white/54">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bp-section-shell relative py-14 md:py-24" id="services">
          <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-4xl">
                <Eyebrow>Platform Services</Eyebrow>
                <h2 className="bp-headline text-4xl leading-[0.96] text-white md:text-6xl">
                  Every private-number workflow in one premium surface.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/58">
                  Burner Point combines the strongest competitor patterns into one tighter experience: immediate utility, clean
                  pricing, trust-first messaging, and a secure telecom feel instead of a generic dashboard.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {serviceCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.9))] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-brand-green/28 hover:shadow-[0_34px_90px_rgba(0,255,157,0.11)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                        <Icon className="h-6 w-6 text-brand-green" />
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/46">
                        {card.eyebrow}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/58">{card.text}</p>
                    <Link href={card.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-green transition hover:gap-3">
                      {card.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bp-section-shell relative py-14 md:py-24" id="coverage">
          <div className="mx-auto grid max-w-[1680px] gap-8 px-5 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] xl:px-10">
            <div>
              <Eyebrow>Coverage and Compatibility</Eyebrow>
              <h2 className="bp-headline text-4xl leading-[0.96] text-white md:text-6xl">
                252+ ISO regions. 900+ verification destinations.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/58">
                Global access should feel immediate. Burner Point shows region breadth and representative platform support without
                burying the user in telecom jargon.
              </p>
              <div className="mt-8 rounded-[1.6rem] border border-brand-green/18 bg-brand-green/[0.05] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">Coverage claim</p>
                <p className="mt-3 text-sm leading-7 text-white/66">
                  Regions are represented with ISO coverage indicators, while service marks below are identifiers only. Not
                  affiliated or endorsed.
                </p>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.72),rgba(0,0,0,0.94))] p-5">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
                {flagPreview.map((iso, index) => (
                  <div
                    key={iso}
                    className="flex min-h-[4.25rem] flex-col items-center justify-center rounded-[1rem] border border-white/8 bg-white/[0.03] text-center"
                  >
                    <span className={`text-2xl ${`bp-flag-mot-${index % 8}`}`} aria-hidden="true">
                      {isoToFlagEmoji(iso)}
                    </span>
                    <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/58">{iso}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <BrandMotionBanners />

        <LandingPricingSection />

        <section className="bp-section-shell relative py-16 md:py-24" id="testimonials">
          <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
            <div className="max-w-4xl">
              <Eyebrow>What People Notice</Eyebrow>
              <h2 className="bp-headline text-4xl leading-[0.96] text-white md:text-6xl">
                Privacy, clarity, and reliability over noise.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.handle} className="flex">
                  <TestimonialCard testimonial={testimonial} delay={`animate-delay-${(index + 1) * 200}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bp-section-shell relative py-14 md:py-24" id="faq">
          <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <Eyebrow>FAQ</Eyebrow>
                <h2 className="bp-headline text-4xl leading-[0.96] text-white md:text-6xl">Clear answers before sign-up.</h2>
              </div>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <article key={item.question} className="rounded-[1.5rem] border border-white/8 bg-white/[0.025] p-5">
                    <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bp-section-shell relative pb-20 pt-6 md:pb-28">
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-6 xl:px-10">
            <div className="rounded-[2rem] border border-brand-green/16 bg-[linear-gradient(135deg,rgba(0,255,157,0.12),rgba(0,0,0,0.96)_60%)] p-8 md:p-12">
              <Eyebrow>Start Privately</Eyebrow>
              <h2 className="bp-headline text-4xl leading-[0.92] text-white md:text-7xl">
                Stay Anonymous. Stay Connected.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/60">
                Create your Burner Point account, move through one calm authentication flow, and open the dashboard with private
                numbers, messaging, verification, and secure routing already aligned.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <MetalLink href="/auth/signup" variant="primary">
                  <span className="inline-flex items-center gap-2 px-1">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </MetalLink>
                <LiquidLink href="/auth/login" className="text-white">
                  <span className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                    Sign In
                  </span>
                </LiquidLink>
              </div>
            </div>
          </div>
        </section>
      </MarketingShell>
    </>
  );
}

function TelecomHeroFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_28%,rgba(0,255,157,0.16),transparent_28%),radial-gradient(circle_at_76%_24%,rgba(57,255,20,0.12),transparent_24%)]" />
      <div className="absolute left-[12%] top-[18%] h-[18rem] w-[8.5rem] rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(229,231,235,0.16),rgba(0,0,0,0.88))] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:h-[21rem] sm:w-[10rem]">
        <div className="p-4">
          <div className="mx-auto h-1.5 w-16 rounded-full bg-white/10" />
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-brand-green/18 bg-brand-green/[0.08] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">BP Verify Hub</p>
              <p className="mt-2 text-xs text-white/64">OTP received</p>
              <p className="mt-1 font-mono text-lg text-white">482 119</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/46">Private route</p>
              <p className="mt-2 text-xs text-white/64">Messaging active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-[10%] top-[12%] h-[20rem] w-[9rem] rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(0,255,157,0.14),rgba(0,0,0,0.92))] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:h-[24rem] sm:w-[11rem]">
        <div className="p-4">
          <div className="mx-auto h-1.5 w-16 rounded-full bg-white/10" />
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-black/24 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">BP Messenger</p>
              <p className="mt-2 text-xs text-white/64">Stay connected</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/46">Secure tunnel</p>
              <p className="mt-2 text-xs text-white/64">Protected session live</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 h-[2px] w-[48%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(0,255,157,0.85),transparent)]" />
      <div className="absolute left-1/2 top-[32%] h-[36%] w-[2px] -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(229,231,235,0.75),transparent)]" />
      <div className="absolute left-[46%] top-[44%] flex h-12 w-12 items-center justify-center rounded-full border border-brand-green/30 bg-black/60 shadow-[0_0_40px_rgba(0,255,157,0.22)]">
        <LockKeyhole className="h-5 w-5 text-brand-green" />
      </div>
      <div className="absolute right-[26%] top-[49%] flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/50">
        <Globe2 className="h-5 w-5 text-white/70" />
      </div>
      <div className="absolute left-[28%] top-[56%] flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/50">
        <ShieldCheck className="h-5 w-5 text-white/70" />
      </div>
    </div>
  );
}
