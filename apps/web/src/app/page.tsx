import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Globe2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Smartphone,
  Voicemail,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BulletList, Eyebrow, MarketingShell } from '@/components/marketing';
import { buildMetadata, siteName, siteTagline, siteUrl } from '@/lib/seo';

export const metadata = buildMetadata({
  route: '/',
  title: siteTagline,
  description: 'Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.',
});

const homeStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${siteName} - ${siteTagline}`,
    description: 'Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.',
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
      { '@type': 'ListItem', position: 1, name: 'Phone Number Rentals and Verifications', url: `${siteUrl}/verifications` },
      { '@type': 'ListItem', position: 2, name: 'eSIM Purchase', url: `${siteUrl}/esim` },
      { '@type': 'ListItem', position: 3, name: 'Proxies Purchase', url: `${siteUrl}/proxies` },
      { '@type': 'ListItem', position: 4, name: 'VPN Privacy and Protection', url: `${siteUrl}/security` },
    ],
  },
];

const heroProof = [
  ['900+', 'Platforms worldwide'],
  ['SMS', 'OTP and messages'],
  ['Voice', 'Call verification'],
  ['WiFi & Data', 'Private communication'],
];

const howSteps = [
  ['01', 'Choose your number', 'Pick a country and area code, then activate a secure non-VoIP number.'],
  ['02', 'Use it privately', 'Use it for verification, calls, messaging, rentals, or controlled account access.'],
  ['03', 'Receive instantly', 'View SMS, OTP, voice, MMS, voicemail, and audio, photo and video activity in one private inbox.'],
  ['04', 'Expire or keep it', 'Let the number expire when the job is done, or keep it as long as you want.'],
];

const whyBurnerPoint = [
  'Real mobile numbers backed by physical SIMs',
  'Works across major platforms and services',
  'Fast, reliable verification delivery',
  'Full privacy with no personal exposure',
  'Built for global access and flexibility',
  'Communication via WiFi & Data',
];

const offerCards: Array<{ icon: LucideIcon; title: string; text: string; href: string; cta: string; items: string[] }> = [
  {
    icon: Smartphone,
    title: 'Non-VoIP Phone Numbers',
    text: 'Use secure, SIM-backed numbers for registrations, recovery, and private access.',
    href: '/numbers',
    cta: 'Get Your Number',
    items: ['Multi-country number access', 'Country and area-code selection', 'Short-term or renewable access'],
  },
  {
    icon: ShieldCheck,
    title: 'SMS and OTP Verification',
    text: 'Receive SMS, OTP, and voice verification without exposing your personal number.',
    href: '/verifications',
    cta: 'Get Verification',
    items: ['SMS and OTP support', 'Voice call verification', 'Social and platform verification'],
  },
  {
    icon: CalendarDays,
    title: 'Temporary and Long-Term Rentals',
    text: 'Rent numbers for one-time workflows or keep them active for ongoing access.',
    href: '/rentals',
    cta: 'Rent A Number',
    items: ['Non-renewable rentals', 'Renewable monthly rentals', 'Expiration and renewal control'],
  },
  {
    icon: MessageSquare,
    title: 'Private Communication',
    text: 'Calls, voicemail, texting, SMS, and secure audio, photo and video sharing for U.S. and Canada numbers.',
    href: '/rentals',
    cta: 'Rent A Number',
    items: ['Free texting', 'Audio, photo and video support', 'WiFi & Data calling'],
  },
];

const pricing = [
  {
    icon: ShieldCheck,
    title: 'Verification',
    price: '$0.99+',
    period: 'per verification',
    text: 'Price varies by service and country.',
    href: '/verifications',
    cta: 'Get Verification',
  },
  {
    icon: CalendarDays,
    title: 'Non-Renewable Rentals',
    price: '$5.99',
    period: 'per rental',
    text: 'Temporary number access when you do not need renewal.',
    href: '/rentals',
    cta: 'Rent A Number',
  },
  {
    icon: Phone,
    title: 'Renewable Rentals',
    price: '$15.99',
    period: 'per month',
    text: 'Keep the same number active for continuity and recovery.',
    href: '/pricing',
    cta: 'Start Monthly Plan',
  },
];

const conversationItems = [
  'Phone numbers for non-renewable and renewable rentals',
  'Free texting',
  'WiFi & Data calling',
  'Texting, SMS, MMS, calls, and voicemail',
  'No roaming fees',
  'Cross-platform access',
  'Calls, voicemail, texting, SMS, and secure audio, photo and video sharing for U.S. and Canada numbers',
];

const useCases = [
  'Online registrations',
  'Marketplaces',
  'Business communication',
  'Dating platforms',
  'Travel communication',
  'Everyday privacy protection',
  'Personal communication',
];

const expandedFeatures: Array<{
  eyebrow: string;
  title: string;
  text: string;
  icon: LucideIcon;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats: Array<[string, string]>;
  items: string[];
}> = [
  {
    eyebrow: 'Phone Number Rentals & Verifications',
    title: 'Secure access to real mobile numbers for verification and private communication.',
    text:
      'Use Burner Point for SMS, OTP, voice verification, short-term rentals, long-term rentals, and US/Canada conversation numbers with calls, voicemail, texting, SMS, and secure audio, photo and video sharing for U.S. and Canada numbers.',
    icon: Phone,
    primaryCta: { label: 'Get Verification', href: '/verifications' },
    secondaryCta: { label: 'Rent A Number', href: '/rentals' },
    stats: [
      ['900+', 'platforms'],
      ['US/CA', 'conversation'],
      ['SMS', 'OTP + voice'],
    ],
    items: [
      'Real mobile numbers backed by SIM inventory',
      'Calls, voicemail, texting, SMS, and secure audio, photo and video sharing for U.S. and Canada numbers',
      'Short-term rentals, long-term rentals, and multi-country number access',
      'Verification workflows for online registrations, social platforms, marketplaces, and recovery',
    ],
  },
  {
    icon: Smartphone,
    eyebrow: 'eSIM Purchase',
    title: 'eSIM Purchase',
    text:
      'Travel with global connectivity without physical SIM cards. Burner Point eSIM plans are built for instant activation, multi-country access, and data control from one privacy-first account.',
    primaryCta: { label: 'Get Your eSIM', href: '/esim' },
    stats: [
      ['Instant', 'activation'],
      ['Multi', 'country'],
      ['Data', 'control'],
    ],
    items: [
      'Travel-ready connectivity without swapping physical SIMs',
      'Instant activation with destination-ready data plans',
      'Multi-country coverage for work, travel, and backup access',
      'In-account data status, plan visibility, and usage control',
    ],
  },
  {
    icon: Globe2,
    eyebrow: 'Proxies Purchase',
    title: 'Proxies Purchase',
    text:
      'Route sensitive workflows with more control. Burner Point proxy access is positioned around secure access, routing flexibility, residential/mobile proxy options, and privacy-enhanced browsing.',
    primaryCta: { label: 'Get Proxies', href: '/proxies' },
    stats: [
      ['Mobile', 'proxy type'],
      ['Region', 'control'],
      ['Private', 'routing'],
    ],
    items: [
      'Residential and mobile proxy access for supported workflows',
      'Location flexibility for browsing, testing, and account separation',
      'Provider abstraction so proxy credentials stay controlled',
      'Routing visibility, session state, and durability messaging',
    ],
  },
  {
    icon: Lock,
    eyebrow: 'VPN Privacy & Protection',
    title: 'VPN Privacy and Protection',
    text:
      'This is built into Burner Point as an in-platform privacy layer, not sold as a standalone VPN product. It helps reduce exposure while using numbers, messages, billing, eSIM, and routing tools.',
    primaryCta: { label: 'Learn More', href: '/overview' },
    secondaryCta: { label: 'See Security', href: '/security' },
    stats: [
      ['Built-in', 'feature'],
      ['Secure', 'routing'],
      ['Reduced', 'exposure'],
    ],
    items: [
      'Seamless protection while using Burner Point',
      'Secure routing designed to reduce account and network exposure',
      'No standalone VPN positioning or noisy add-on experience',
      'Works alongside numbers, eSIM, proxies, and account security controls',
    ],
  },
];

const quickActions = [
  { href: '/overview', label: 'Learn More' },
  { href: '/api/docs', label: 'View API Docs' },
  { href: '/verifications', label: 'Get Verification' },
  { href: '/rentals', label: 'Rent A Number' },
  { href: '/pricing', label: 'Start Monthly Plan' },
  { href: '/numbers', label: 'Get Your Number' },
  { href: '/pricing', label: 'View Pricing' },
];

const sectionAnchors = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#why-burner-point', label: 'Why Burner Point' },
  { href: '#what-we-offer', label: 'What We Offer' },
  { href: '#conversation', label: 'Conversation' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#privacy-platform', label: 'Privacy Stack' },
  { href: '#use-cases', label: 'Use Cases' },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <MarketingShell>
      <section id="top" className="relative scroll-mt-28 overflow-hidden" aria-labelledby="home-hero-title">
        <div className="bp-hero-fx" />
        <div className="mx-auto grid max-w-[1680px] gap-6 px-5 py-6 sm:px-6 md:gap-12 md:pb-20 md:pt-20 lg:grid-cols-12 lg:items-center lg:gap-8 xl:px-10 2xl:gap-16 2xl:pb-28 2xl:pt-24">
          <div className="bp-reveal lg:col-span-7">
            <h1
              id="home-hero-title"
              className="bp-headline max-w-5xl text-[2.25rem] font-black leading-[0.98] tracking-tight text-white min-[375px]:text-[2.4rem] min-[390px]:text-[2.55rem] min-[430px]:text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
            >
              <span className="block">Don&apos;t Want To Give Out Your Phone Number?</span>
              <span className="mt-2 block text-brand-green sm:mt-3">No Problem. Use Ours.</span>
            </h1>

            <div className="mt-6 max-w-4xl space-y-4">
              <p className="text-[17px] font-medium leading-7 tracking-normal text-white md:text-xl md:leading-8">
                <span className="block sm:inline">
                  Stay Anonymous. Stay Connected.{' '}
                </span>
                <span className="text-brand-green">Private By Design.</span>
              </p>
              <p className="max-w-3xl text-base leading-7 text-white/70 md:text-xl md:leading-9">
                Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/auth/signup" className="bp-primary-action inline-flex min-h-[52px] items-center justify-center px-8 py-4 text-sm font-semibold uppercase transition duration-[220ms] ease-out active:scale-[0.98]">
                Get Started
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
              <Link href="/overview" className="bp-secondary-action inline-flex min-h-[52px] items-center justify-center px-8 py-4 text-sm font-semibold uppercase transition duration-[220ms] ease-out active:scale-[0.98]">
                Learn More
              </Link>
            </div>

            <p className="mt-6 max-w-3xl font-mono text-[13px] font-semibold uppercase leading-6 tracking-wide text-brand-green md:text-sm">
              Receive SMS, Voice, and OTP verifications from 900+ platforms worldwide.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4" role="list" aria-label="Burner Point trust proof points">
              {heroProof.map(([value, label]) => (
                <div key={label} role="listitem" className="rounded-bp-md border border-white/8 bg-white/[0.025] px-4 py-4 md:px-5">
                  <div className="font-mono text-2xl font-semibold text-white md:text-4xl">{value}</div>
                  <div className="mt-1 font-mono text-[10px] font-semibold uppercase text-white/46">{label}</div>
                </div>
              ))}
            </div>

            <nav className="mt-6 hidden grid-cols-2 gap-3 md:grid lg:flex lg:flex-wrap" aria-label="Homepage quick actions">
              {quickActions.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex min-h-11 items-center justify-center rounded-bp border border-white/10 bg-white/[0.03] px-3 py-3 text-center text-xs font-semibold uppercase text-white/72 transition hover:-translate-y-0.5 hover:border-brand-green/35 hover:text-brand-green sm:px-5"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="bp-reveal-delay lg:col-span-5">
            <div className="rounded-bp-lg border border-brand-green/16 bg-brand-black p-4 shadow-[0_0_80px_rgba(0,255,157,0.11)] md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
                    <Image src="/assets/logo-mark.svg" alt="" width={30} height={30} priority />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-brand-green">Burner Point Live</p>
                    <p className="text-sm text-white/50">Private telecom control surface</p>
                  </div>
                </div>
                <span className="w-fit rounded-bp border border-brand-green/20 bg-brand-green/10 px-3 py-1 font-mono text-[10px] uppercase text-brand-green">
                  No personal exposure
                </span>
              </div>

              <div className="mt-6 rounded-bp-lg border border-white/8 bg-brand-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-white/40">Selected Number</p>
                    <p className="mt-2 font-mono text-3xl text-brand-green">+1 415 555 0182</p>
                  </div>
                  <div className="rounded-bp-md border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-right">
                    <p className="font-mono text-xl text-white">847291</p>
                    <p className="font-mono text-[10px] uppercase text-brand-green">OTP received</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    [Mail, 'SMS and OTP'],
                    [Phone, 'Voice Calls'],
                    [MessageSquare, 'Audio, photo & video'],
                    [Voicemail, 'Voicemail'],
                  ].map(([Icon, label]) => {
                    const AppIcon = Icon as LucideIcon;
                    return (
                      <div key={label as string} className="rounded-bp-md border border-white/8 bg-black/24 p-4">
                        <AppIcon className="h-5 w-5 text-brand-green" />
                        <p className="mt-3 text-sm font-semibold text-white">{label as string}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 space-y-3">
                  <div className="max-w-[88%] rounded-bp-md border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/78">
                    Your marketplace login code is <span className="font-mono text-brand-green">847291</span>.
                  </div>
                  <div className="ml-auto max-w-[82%] rounded-bp-md border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-sm text-white/88">
                    Protected. Routed through Burner Point.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {['Real mobile numbers', 'No logs policy', 'GDPR aligned'].map((item) => (
                  <div key={item} className="rounded-bp-md border border-white/8 bg-white/[0.025] p-4 text-center text-xs font-semibold uppercase text-white/56">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-40 hidden border-y border-white/6 bg-brand-black/82 backdrop-blur-xl xl:block">
        <div className="mx-auto grid max-w-[1680px] grid-cols-12 items-center gap-5 px-10 py-4">
          <nav className="col-span-9 flex items-center gap-2" aria-label="Homepage section navigation">
            {sectionAnchors.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-bp border border-white/8 bg-white/[0.025] px-4 py-2 font-mono text-[10px] font-semibold uppercase text-white/48 transition hover:-translate-y-0.5 hover:border-brand-green/32 hover:bg-brand-green/8 hover:text-brand-green"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="col-span-3 flex justify-end gap-3">
            <Link href="/auth/signup" className="bp-primary-action inline-flex min-h-11 items-center justify-center px-5 py-3 text-xs font-semibold uppercase">
              Get Started
            </Link>
            <Link href="/api/docs" className="bp-secondary-action inline-flex min-h-11 items-center justify-center px-5 py-3 text-xs font-semibold uppercase">
              API Docs
            </Link>
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="how-it-works" aria-labelledby="how-it-works-title">
        <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-4">
              <Eyebrow>How It Works</Eyebrow>
              <h2 id="how-it-works-title" className="text-4xl font-black uppercase leading-none text-white md:text-6xl">Four controlled steps.</h2>
            </div>
            <p className="max-w-3xl text-base leading-8 text-white/58 lg:col-span-5">
              Desktop flows stay scannable and dense: choose inventory, use it privately, monitor delivery, then expire or renew with clear state.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {howSteps.map(([number, title, text]) => (
              <article key={number} className="rounded-bp-lg border border-white/8 bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-green/30 hover:bg-brand-green/[0.055] hover:shadow-[0_30px_80px_rgba(0,255,157,0.09)] md:p-6">
                <div className="font-mono text-5xl font-semibold text-white/10">{number}</div>
                <h3 className="mt-6 font-mono text-lg font-semibold uppercase text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="why-burner-point" aria-labelledby="why-burner-point-title">
        <div className="mx-auto grid max-w-[1680px] gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:items-start xl:px-10">
          <div className="lg:col-span-5">
            <Eyebrow>Why Burner Point</Eyebrow>
            <h2 id="why-burner-point-title" className="max-w-3xl text-4xl font-black uppercase leading-[0.98] text-white md:text-7xl">
              Real access. Less exposure.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              Burner Point is built for users who need communication access without turning their personal number into a permanent internet identifier.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {whyBurnerPoint.map((item) => (
              <div key={item} className="rounded-bp-lg border border-white/8 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-brand-green/28 hover:bg-brand-green/[0.045]">
                <Check className="h-5 w-5 text-brand-green" />
                <p className="mt-4 text-sm font-semibold leading-6 text-white/74">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="what-we-offer" aria-labelledby="what-we-offer-title">
        <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>What We Offer</Eyebrow>
              <h2 id="what-we-offer-title" className="max-w-4xl text-4xl font-black uppercase leading-[0.98] text-white md:text-7xl">
                Numbers, verifications, rentals, and conversations.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/60">
                One controlled place for non-VoIP numbers, SMS, OTP, voice verification, multi-country access, platform support, and US/Canada private communication.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="bp-primary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
                Get Started
              </Link>
              <Link href="/pricing" className="bp-secondary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
                View Pricing
              </Link>
            </div>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {offerCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="bp-card rounded-bp-lg p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-green/28 hover:shadow-[0_34px_90px_rgba(0,255,157,0.11)] md:p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-bp-md border border-brand-green/20 bg-brand-green/10">
                    <Icon className="h-6 w-6 text-brand-green" />
                  </span>
                  <h3 className="mt-6 font-mono text-lg font-semibold uppercase text-white">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{card.text}</p>
                  <div className="mt-6">
                    <BulletList items={card.items} />
                  </div>
                  <Link href={card.href} className="bp-primary-action mt-7 inline-flex min-h-12 w-full items-center justify-center px-5 py-4 text-sm font-semibold uppercase">
                    {card.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="conversation" aria-labelledby="conversation-title">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-5 sm:px-6 lg:grid-cols-12 lg:items-center xl:px-10">
          <div className="rounded-bp-lg border border-brand-green/14 bg-brand-green/[0.055] p-7 md:p-9 lg:col-span-5">
            <Eyebrow>Conversation Section</Eyebrow>
            <h2 id="conversation-title" className="text-4xl font-black uppercase leading-[0.98] text-white md:text-7xl">
              Talk, text, and receive codes over WiFi & Data.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              Conversation numbers support private communication for USA and Canada, with calls, voicemail, text, SMS, MMS, and audio, photo and video sharing connected to the same Burner Point identity.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/rentals" className="bp-primary-action inline-flex min-h-12 items-center justify-center px-7 py-4 text-sm font-semibold uppercase">
                Rent A Number
              </Link>
              <Link href="/overview" className="bp-secondary-action inline-flex min-h-12 items-center justify-center px-7 py-4 text-sm font-semibold uppercase">
                Learn More
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {conversationItems.map((item) => (
              <div key={item} className="rounded-bp-lg border border-white/8 bg-white/[0.025] p-5 text-sm font-semibold leading-6 text-white/70 transition hover:-translate-y-0.5 hover:border-brand-green/28 hover:text-white">
                <Wifi className="mb-3 h-5 w-5 text-brand-green md:mb-4" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="pricing" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Pricing</Eyebrow>
              <h2 id="pricing-title" className="max-w-4xl text-4xl font-black uppercase leading-[0.98] text-white md:text-6xl">
                Simple entry points for private access.
              </h2>
            </div>
            <Link href="/pricing" className="bp-secondary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
              View Pricing
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricing.map((plan) => {
              const Icon = plan.icon;
              return (
                <article key={plan.title} className="bp-card rounded-bp-lg p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-green/28 hover:shadow-[0_34px_90px_rgba(0,255,157,0.11)] md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <Icon className="h-7 w-7 text-brand-green" />
                    <span className="rounded-bp border border-white/8 px-3 py-1 font-mono text-[10px] uppercase text-white/42">{plan.period}</span>
                  </div>
                  <h3 className="mt-6 font-mono text-lg font-semibold uppercase text-white">{plan.title}</h3>
                  <p className="mt-4 font-mono text-5xl font-semibold text-brand-green md:text-6xl">{plan.price}</p>
                  <p className="mt-4 text-sm leading-7 text-white/58">{plan.text}</p>
                  <Link href={plan.href} className="bp-secondary-action mt-8 inline-flex min-h-12 w-full items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="privacy-platform" aria-labelledby="privacy-platform-title">
        <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
          <div className="mb-10 max-w-5xl">
            <Eyebrow>Feature Expansion</Eyebrow>
            <h2 id="privacy-platform-title" className="text-4xl font-black uppercase leading-[0.98] text-white md:text-7xl">
              Stay Anonymous. Stay Connected. Private By Design.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/60">
              Burner Point expands from private numbers into connectivity, routing, and in-platform protection without losing the controlled telecom-grade feel.
            </p>
          </div>

          <div className="space-y-5">
            {expandedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const reverse = index % 2 === 1;
              return (
                <article
                  key={feature.eyebrow}
                  className="rounded-bp-lg border border-brand-green/12 bg-[linear-gradient(135deg,rgba(0,255,157,0.09),rgba(0,0,0,0.94)_58%)] p-5 transition duration-300 hover:border-brand-green/26 hover:shadow-[0_34px_100px_rgba(0,255,157,0.1)] md:p-7"
                >
                  <div className="grid gap-7 lg:grid-cols-12 lg:items-center">
                    <div className={`${reverse ? 'lg:order-2' : ''} lg:col-span-5`}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-bp-md border border-brand-green/20 bg-brand-green/10">
                          <Icon className="h-6 w-6 text-brand-green" />
                        </span>
                        <p className="font-mono text-[10px] font-semibold uppercase text-brand-green">{feature.eyebrow}</p>
                      </div>
                      <h3 className="mt-6 text-2xl font-black uppercase leading-none text-white sm:text-3xl md:text-5xl">
                        {feature.title}
                      </h3>
                      <p className="mt-5 text-sm leading-7 text-white/60 md:text-base md:leading-8">
                        {feature.text}
                      </p>
                      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Link href={feature.primaryCta.href} className="bp-primary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
                          {feature.primaryCta.label}
                          <ArrowRight className="ml-3 h-4 w-4" />
                        </Link>
                        {feature.secondaryCta ? (
                          <Link href={feature.secondaryCta.href} className="bp-secondary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
                            {feature.secondaryCta.label}
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className={`rounded-bp-lg border border-white/8 bg-black/25 p-4 md:p-5 lg:col-span-7 ${reverse ? 'lg:order-1' : ''}`}>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {feature.stats.map(([value, label]) => (
                          <div key={`${feature.eyebrow}-${label}`} className="rounded-bp-md border border-white/8 bg-white/[0.025] p-4">
                            <p className="font-mono text-2xl font-semibold text-brand-green">{value}</p>
                            <p className="mt-1 font-mono text-[10px] uppercase text-white/42">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {feature.items.map((item) => (
                          <div key={item} className="rounded-bp-md border border-white/8 bg-white/[0.02] p-4">
                            <Check className="h-4 w-4 text-brand-green" />
                            <p className="mt-3 text-sm leading-6 text-white/68">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="use-cases" aria-labelledby="use-cases-title">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-5 sm:px-6 lg:grid-cols-12 xl:px-10">
          <div className="lg:col-span-5">
            <Eyebrow>Use Cases</Eyebrow>
            <h2 id="use-cases-title" className="text-4xl font-black uppercase leading-[0.98] text-white md:text-7xl">
              For real-world privacy, work, travel, and personal communication.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              Use Burner Point anywhere you need to stay reachable without exposing your personal phone number.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {useCases.map((item) => (
              <div key={item} className="rounded-bp-lg border border-white/8 bg-white/[0.02] px-5 py-5 font-mono text-sm uppercase text-white/70 transition hover:-translate-y-0.5 hover:border-brand-green/28 hover:text-brand-green">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-28" id="start" aria-labelledby="start-title">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-6 xl:px-8">
          <div className="rounded-bp-lg border border-brand-green/12 bg-[linear-gradient(135deg,rgba(0,255,157,0.13),rgba(0,0,0,0.96)_62%)] p-8 md:p-12">
            <Eyebrow>Start Privately</Eyebrow>
            <h2 id="start-title" className="text-4xl font-black uppercase leading-[0.96] text-white md:text-8xl">
              Get your number.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
              Burner Point is a privacy-focused telecommunications platform built for speed, privacy, and global access.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/auth/signup" className="bp-primary-action inline-flex min-h-12 items-center justify-center px-8 py-4 text-sm font-semibold uppercase">
                Get Started
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
              <Link href="/pricing" className="bp-secondary-action inline-flex min-h-12 items-center justify-center px-8 py-4 text-sm font-semibold uppercase">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
      </MarketingShell>
    </>
  );
}
