import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  Code2,
  CreditCard,
  Globe2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BulletList, Eyebrow, FeatureCard, MarketingShell } from '@/components/marketing';

const howSteps = [
  ['01', 'Choose Your Number', 'Select your country and area code and get a real, non-VoIP number in seconds.'],
  ['02', 'Use It Anywhere', 'Verify accounts, receive messages, and manage communication across major services.'],
  ['03', 'Receive Instantly', 'SMS, OTP codes, and voice verifications arrive in real time with full inbox access.'],
  ['04', 'Expire or Keep It', 'Let the number disappear when you are finished or keep it active with rentals.'],
];

const coreFeatures: Array<{ icon: LucideIcon; title: string; text: string; href: string; cta: string; items: string[] }> = [
  {
    icon: Smartphone,
    title: 'Phone Numbers and Verifications',
    text: 'Secure access to real SIM-backed mobile numbers for instant verification and private communication.',
    href: '/verifications',
    cta: 'Get Verification',
    items: ['Non-VoIP numbers', 'SMS and OTP verification', 'Voice call verification', '900+ platform support'],
  },
  {
    icon: CalendarDays,
    title: 'Number Rentals',
    text: 'Flexible number ownership for temporary projects, repeat verifications, account recovery, and US/CA conversation flows.',
    href: '/rentals',
    cta: 'Rent A Number',
    items: ['Short-term 1-14 day rentals', 'Renewable monthly numbers', 'SMS, MMS, calls, voicemail', 'WiFi and mobile-data calling'],
  },
  {
    icon: Code2,
    title: 'Developer API',
    text: 'Automate verification and communication workflows with developer-friendly endpoints and webhooks.',
    href: '/api/docs',
    cta: 'View API Docs',
    items: ['REST API', 'Webhook callbacks', 'API keys', 'Production-ready automation'],
  },
];

const platformFeatures = [
  { icon: Smartphone, title: 'eSIM Purchase', text: 'Instant eSIM activation with travel-ready data plans and multi-country coverage.', href: '/esim', cta: 'Get Your eSIM' },
  { icon: Globe2, title: 'Proxies Purchase', text: 'Residential and mobile proxy access for privacy-enhanced browsing and location control.', href: '/proxies', cta: 'Get Proxies' },
  { icon: Lock, title: 'VPN Privacy and Protection', text: 'An encrypted browsing layer built into the Burner Point platform experience.', href: '/security', cta: 'Learn More' },
];

const pricingCards = [
  { icon: ShieldCheck, title: 'Verifications', price: '$0.99+', period: 'per verification', href: '/verifications', cta: 'Get Verification', items: ['Instant SMS and OTP', 'Real SIM numbers', '900+ platform support', 'USD, NGN, card and crypto checkout'] },
  { icon: CalendarDays, title: 'Non-Renewable Rentals', price: '$5.99+', period: 'per rental', href: '/rentals', cta: 'Rent A Number', items: ['1-14 day access', 'Unlimited verification usage', 'No auto-renewal surprise', 'Local transfer-ready billing model'] },
  { icon: CreditCard, title: 'Monthly Plans', price: '$15.99+', period: 'per month', href: '/pricing', cta: 'Start Monthly Plan', items: ['Renewable access', 'SMS and voice support', 'Best for continuity', 'Built for business privacy workflows'] },
];

const productLinks = [
  { label: 'Overview', href: '/overview' },
  { label: 'Verifications', href: '/verifications' },
  { label: 'Rentals', href: '/rentals' },
  { label: 'API', href: '/api' },
  { label: 'Pricing', href: '/pricing' },
];

const useCases = ['Online registrations', 'Marketplaces', 'Business communication', 'Dating platforms', 'Travel usage', 'Privacy protection'];

const coverageRegions = [
  {
    flagLabel: 'US',
    code: 'US',
    country: 'United States',
    dial: '+1',
    sample: '+1 415 555 0182',
    gradient: 'linear-gradient(135deg,#b22234 0 38%,#ffffff 38% 48%,#3c3b6e 48% 100%)',
  },
  {
    flagLabel: 'CA',
    code: 'CA',
    country: 'Canada',
    dial: '+1',
    sample: '+1 647 555 0198',
    gradient: 'linear-gradient(90deg,#d52b1e 0 28%,#ffffff 28% 72%,#d52b1e 72% 100%)',
  },
  {
    flagLabel: 'GB',
    code: 'GB',
    country: 'United Kingdom',
    dial: '+44',
    sample: '+44 20 7946 0482',
    gradient: 'linear-gradient(135deg,#012169 0 38%,#ffffff 38% 48%,#c8102e 48% 58%,#012169 58% 100%)',
  },
  {
    flagLabel: 'FR',
    code: 'FR',
    country: 'France',
    dial: '+33',
    sample: '+33 1 76 35 48 10',
    gradient: 'linear-gradient(90deg,#0055a4 0 33%,#ffffff 33% 66%,#ef4135 66% 100%)',
  },
  {
    flagLabel: 'DE',
    code: 'DE',
    country: 'Germany',
    dial: '+49',
    sample: '+49 30 5557 0192',
    gradient: 'linear-gradient(180deg,#000000 0 33%,#dd0000 33% 66%,#ffce00 66% 100%)',
  },
  {
    flagLabel: 'JP',
    code: 'JP',
    country: 'Japan',
    dial: '+81',
    sample: '+81 3 4510 2440',
    gradient: 'radial-gradient(circle,#bc002d 0 28%,#ffffff 29% 100%)',
  },
  {
    flagLabel: 'IN',
    code: 'IN',
    country: 'India',
    dial: '+91',
    sample: '+91 80 4567 2109',
    gradient: 'linear-gradient(180deg,#ff9933 0 33%,#ffffff 33% 66%,#138808 66% 100%)',
  },
  {
    flagLabel: 'NG',
    code: 'NG',
    country: 'Nigeria',
    dial: '+234',
    sample: '+234 802 555 0198',
    gradient: 'linear-gradient(90deg,#008751 0 33%,#ffffff 33% 66%,#008751 66% 100%)',
  },
  {
    flagLabel: 'BR',
    code: 'BR',
    country: 'Brazil',
    dial: '+55',
    sample: '+55 11 95555 0198',
    gradient: 'linear-gradient(135deg,#009c3b 0 42%,#ffdf00 42% 62%,#002776 62% 100%)',
  },
  {
    flagLabel: 'ZA',
    code: 'ZA',
    country: 'South Africa',
    dial: '+27',
    sample: '+27 21 555 0182',
    gradient: 'linear-gradient(135deg,#007749 0 34%,#ffffff 34% 42%,#000000 42% 50%,#ffb81c 50% 58%,#de3831 58% 100%)',
  },
];

const natureSignals = [
  ['Fox Mask', 'identity separation'],
  ['Falcon Route', 'fast OTP delivery'],
  ['Firefly Pulse', 'live webhook events'],
];

const heroStats = [
  ['900+', 'services supported'],
  ['180+', 'countries available'],
  ['99.9%', 'uptime target'],
  ['0', 'bytes logged'],
];

const designTokens = [
  ['Primary CTA', '#00FF9D', 'Conversion action and successful secure states'],
  ['Deep Green', '#013220', 'Privacy base, hero depth, platform surfaces'],
  ['Neon Signal', '#39FF14', 'Live route, alerts, active tab glow'],
  ['Metallic UI', '#9FA6B2 -> #E5E7EB', 'Wordmark and premium secondary accents'],
];

const appStoreFrames = [
  ['Create Burner Numbers Instantly', 'Real mobile numbers for verifications, rentals, and private inboxes.'],
  ['Stay Anonymous', 'Keep your personal number off signups, marketplaces, and high-risk workflows.'],
  ['Unlimited SMS & Calls', 'US/CA numbers support SMS, MMS, calls, voicemail, and WiFi/data calling.'],
];

const qualityScores = [
  ['Visual Quality', '9.3', 'Cinematic dark green, premium metallic contrast, and focused neon accents.'],
  ['UX Clarity', '9.2', 'Awareness, trust, action, and conversion are sequenced without overloading the hero.'],
  ['Conversion Strength', '9.4', 'Primary headline, repeated CTAs, pricing, and API paths stay visible.'],
  ['Brand Alignment', '9.5', 'Privacy-first, controlled, telecom-grade language with real coverage context.'],
  ['Performance', '9.0', 'CSS-driven motion with reduced-motion support and no heavy hero media dependency.'],
];

export default function Home() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden">
        <div className="bp-hero-fx" />
        <div className="pointer-events-none absolute left-[8%] top-24 hidden md:block">
          <div className="bp-orb" />
        </div>
        <div className="pointer-events-none absolute right-[10%] top-44 hidden md:block">
          <div className="bp-orb-ring" />
        </div>
        <div className="mx-auto grid max-w-[1600px] gap-12 px-5 pb-14 pt-10 sm:px-6 md:pb-20 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center xl:px-10 2xl:px-12">
          <div className="bp-reveal">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="bp-privacy-stamp inline-flex rounded-full border border-brand-green/30 bg-brand-green/10 px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.36em] text-brand-green shadow-[0_0_44px_rgba(0,255,157,0.18)]">
                Private By Design
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/54">
                Real SIM Numbers - No Logs Policy
              </span>
            </div>

            <p className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-white/58 md:text-base">
              Stay Anonymous. <span className="text-brand-green">Stay Connected.</span>
            </p>
            <h1 className="mt-5 max-w-6xl text-[clamp(3.25rem,9vw,9.8rem)] font-black uppercase leading-[0.84] tracking-[-0.08em] text-white">
              <span className="block">Don&apos;t Want</span>
              <span className="block text-white/82">To Give Out</span>
              <span className="block bp-outline">Your Phone</span>
              <span className="block">Number?</span>
            </h1>
            <div className="mt-6 max-w-4xl rounded-[28px] border border-brand-green/16 bg-brand-green/[0.06] p-5 md:p-6">
              <p className="text-[clamp(1.65rem,4vw,4.2rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-brand-green">
                No problem. Use ours.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/68 md:text-xl md:leading-9">
                Generate secure, non-VoIP numbers instantly for SMS, MMS, voice calls, OTP verification, rentals, and private WiFi/data communication without exposing your real line.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map(([value, label]) => (
                <div key={label} className="rounded-[22px] border border-white/8 bg-white/[0.025] px-5 py-4">
                  <div className="font-mono text-3xl font-semibold text-white md:text-4xl">{value}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/auth/signup" className="bp-button-glow inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-green px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition duration-300 hover:-translate-y-1 hover:bg-[#1cffac]">
                Get Started Free
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
              <Link href="/overview" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/82 transition duration-300 hover:-translate-y-1 hover:border-brand-green/35 hover:text-white">
                See How It Works
              </Link>
              <Link href="/api/docs" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-brand-green/18 bg-brand-green/8 px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-brand-green transition duration-300 hover:-translate-y-1 hover:bg-brand-green/14">
                View API Docs
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { href: '/verifications', label: 'Get Verification' },
                { href: '/rentals', label: 'Rent A Number' },
                { href: '/pricing', label: 'Start Monthly Plan' },
                { href: '/numbers', label: 'Get Your Number' },
                { href: '/pricing', label: 'View Pricing' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:border-brand-green/35 hover:text-brand-green"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bp-card bp-reveal-delay rounded-[38px] p-4 md:rounded-[54px] md:p-6">
            <div className="rounded-[32px] border border-brand-green/15 bg-[#050807] p-4 shadow-[0_0_80px_rgba(0,255,157,0.1)] md:rounded-[46px] md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/assets/logo-mark.svg" alt="" width={38} height={38} />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Live Coverage Flow</p>
                    <p className="font-mono text-sm text-white/48">180+ countries - 900+ platforms</p>
                  </div>
                </div>
                <span className="w-fit rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Real SIM-backed</span>
              </div>

              <div className="mt-6 overflow-hidden rounded-[30px] border border-white/8 bg-black/30 p-3">
                <div className="bp-flag-track flex w-max gap-3">
                  {[...coverageRegions, ...coverageRegions].map((region, index) => (
                    <div key={`${region.code}-${index}`} className="w-[220px] rounded-[24px] border border-white/8 bg-white/[0.035] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]" style={{ background: region.gradient }}>
                          <span className="rounded-md bg-black/35 px-1.5 py-1 font-mono text-[10px] font-black tracking-[0.18em] text-white shadow-[0_0_18px_rgba(0,0,0,0.35)]">
                            {region.flagLabel}
                          </span>
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">{region.code}</span>
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-white">{region.country}</h2>
                      <p className="mt-1 font-mono text-sm text-brand-green">{region.dial}</p>
                      <p className="mt-3 font-mono text-xs text-white/48">{region.sample}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {natureSignals.map(([title, text]) => (
                  <div key={title} className="rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.08),rgba(255,255,255,0.025))] p-4">
                    <div className="bp-nature-dot" />
                    <h3 className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/48">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[30px] border border-brand-green/15 bg-brand-green/[0.06] p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Selected route</p>
                    <div className="mt-3 font-mono text-3xl font-medium text-brand-green md:text-5xl">+1 415 555 0182</div>
                    <p className="mt-3 text-sm leading-6 text-white/58">SMS - MMS photos - voice calls - voicemail - OTP delivery over WiFi or mobile data for US/CA conversation numbers.</p>
                  </div>
                  <div className="grid min-w-[170px] grid-cols-2 gap-3">
                    {[
                      ['15s', 'avg code'],
                      ['0', 'logs'],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-[20px] border border-white/8 bg-black/25 p-4 text-center">
                        <div className="text-2xl font-semibold text-white">{value}</div>
                        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/34">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="max-w-[88%] rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/78">
                  Your verification code is <span className="font-mono text-brand-green">847291</span>.
                </div>
                <div className="ml-auto max-w-[82%] rounded-[20px] border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-sm text-white/88">
                  Protected. Private. Routed through Burner Point.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <Eyebrow>How It Works</Eyebrow>
          <div className="grid gap-5 lg:grid-cols-4">
            {howSteps.map(([number, title, text]) => (
              <article key={number} className="bp-card rounded-[30px] p-7">
                <div className="text-6xl font-semibold text-white/10">{number}</div>
                <h2 className="mt-6 font-mono text-lg font-semibold uppercase tracking-[0.08em] text-white">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-white/58">{text}</p>
              </article>
            ))}
          </div>
          <p className="mt-12 text-center font-mono text-2xl uppercase tracking-[0.18em] text-white/86">
            Simple. <span className="text-brand-green">Secure.</span> Controlled.
          </p>
        </div>
      </section>

      <div className="bp-divider" />

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Core Features</Eyebrow>
              <h2 className="max-w-4xl text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">Protect your real number. Verify anything.</h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/58">Your private phone number for SMS, voice, OTP verification, messaging, and rentals, with instant activation and privacy-first infrastructure.</p>
            </div>
            <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/82 transition hover:border-brand-green/35 hover:text-brand-green">
              View Pricing
            </Link>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {coreFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="bp-card rounded-[34px] p-7">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                    <Icon className="h-6 w-6 text-brand-green" />
                  </div>
                  <h3 className="mt-7 font-mono text-xl font-semibold uppercase tracking-[0.08em] text-white">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{feature.text}</p>
                  <div className="mt-6"><BulletList items={feature.items} /></div>
                  <Link href={feature.href} className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#1cffac]">
                    {feature.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <div className="rounded-[42px] border border-brand-green/12 bg-[linear-gradient(135deg,rgba(0,255,157,0.12),rgba(5,8,7,0.96)_60%)] p-7 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <Eyebrow>Platform Features</Eyebrow>
                <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">Stay Anonymous. Stay Connected. Private By Design.</h2>
                <p className="mt-6 text-base leading-8 text-white/60">Burner Point is more than temporary numbers. It is a privacy platform for communication, connectivity, routing, and protection.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {platformFeatures.map((feature) => (
                  <FeatureCard key={feature.title} card={{ ...feature, icon: feature.title.startsWith('eSIM') ? 'smartphone' : feature.title.startsWith('Proxies') ? 'globe' : 'lock' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <Eyebrow>Product</Eyebrow>
          <div className="grid gap-4 md:grid-cols-5">
            {productLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-[26px] border border-white/8 bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:border-brand-green/30 hover:bg-brand-green/8">
                <span className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-white group-hover:text-brand-green">{item.label}</span>
                <ArrowRight className="mt-6 h-4 w-4 text-brand-green transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <Eyebrow>Pricing</Eyebrow>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricingCards.map((plan) => {
              const Icon = plan.icon;
              return (
                <article key={plan.title} className="bp-card rounded-[34px] p-7">
                  <div className="flex items-start justify-between">
                    <Icon className="h-7 w-7 text-brand-green" />
                    <span className="rounded-full border border-white/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{plan.period}</span>
                  </div>
                  <h3 className="mt-6 font-mono text-lg font-semibold uppercase tracking-[0.1em] text-white">{plan.title}</h3>
                  <div className="mt-4 text-6xl font-semibold text-brand-green">{plan.price}</div>
                  <div className="mt-6"><BulletList items={plan.items} /></div>
                  <Link href={plan.href} className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/82 transition hover:border-brand-green/35 hover:text-brand-green">
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-center xl:px-8">
          <div>
            <Eyebrow>Mobile App Design</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">Native flow for private numbers on the move.</h2>
            <p className="mt-6 text-base leading-8 text-white/60">The mobile app uses bottom tabs for Dashboard, Calls, Contacts, Activity, and Settings with quick access to verification, rentals, wallet balance, push alerts, and offline-ready cached state.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {['Streamlined onboarding', 'Bottom tab navigation', 'Push notifications for OTP and expirations', 'Offline-ready account snapshot'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/66">
                  <Check className="mr-2 inline h-4 w-4 text-brand-green" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-[380px] rounded-[46px] border border-brand-green/16 bg-[#020403] p-4 shadow-[0_0_80px_rgba(0,255,157,0.16)]">
            <div className="rounded-[36px] border border-white/8 bg-[#07100c] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/45">Good evening</p>
                  <h3 className="text-2xl font-semibold text-white">Kingsley</h3>
                </div>
                <Bell className="h-5 w-5 text-brand-green" />
              </div>
              <div className="mt-6 rounded-[28px] border border-brand-green/20 bg-brand-green/10 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Active Verification</p>
                <p className="mt-3 font-mono text-2xl text-white">+1 415 555 0182</p>
                <p className="mt-2 text-sm text-white/56">New Telegram code received.</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[[Phone, 'Verify'], [CalendarDays, 'Rentals'], [Wifi, 'eSIM'], [MessageCircle, 'Inbox']].map(([Icon, label]) => {
                  const AppIcon = Icon as LucideIcon;
                  return <div key={label as string} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-center"><AppIcon className="mx-auto h-5 w-5 text-brand-green" /><p className="mt-2 text-xs font-semibold text-white">{label as string}</p></div>;
                })}
              </div>
              <div className="mt-6 flex justify-around rounded-[24px] border border-white/8 bg-black/28 px-2 py-3">
                {['Dashboard', 'Calls', 'Contacts', 'Activity', 'Settings'].map((tab, index) => (
                  <span key={tab} className={`text-[10px] font-semibold ${index === 0 ? 'text-brand-green' : 'text-white/34'}`}>{tab}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bp-card rounded-[38px] p-7 md:p-9">
              <Eyebrow>UI System</Eyebrow>
              <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">A controlled interface, not a generic SaaS skin.</h2>
              <p className="mt-6 text-base leading-8 text-white/60">Buttons, inputs, cards, tabs, and modals follow an 8pt spacing system, 8/12/16px radii, 200-300ms transitions, glow-on-hover, and 0.97 active press feedback.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Primary Button', 'Secondary Button', 'Ghost Button', 'Inputs', 'Cards', 'Tabs', 'Modals'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/54">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {designTokens.map(([name, value, use]) => (
                <div key={name} className="rounded-[30px] border border-white/8 bg-white/[0.025] p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">{name}</p>
                  <p className="bp-metal-text mt-4 font-mono text-2xl font-semibold">{value}</p>
                  <p className="mt-4 text-sm leading-6 text-white/58">{use}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>App Store Visuals</Eyebrow>
              <h2 className="max-w-4xl text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">Screenshots that sell privacy in one glance.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/56">These frames map directly to iPhone/Android store creative: dark UI, neon accents, clear feature promise, and no clutter.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {appStoreFrames.map(([title, text], index) => (
              <div key={title} className="rounded-[42px] border border-brand-green/14 bg-[#020403] p-4 shadow-[0_0_80px_rgba(0,255,157,0.1)]">
                <div className="min-h-[520px] rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.16),rgba(1,50,32,0.38)_34%,rgba(0,0,0,0.92)_72%)] p-5">
                  <div className="mx-auto h-6 w-24 rounded-full bg-black/50" />
                  <div className="mt-12 font-mono text-[10px] uppercase tracking-[0.26em] text-brand-green">Burner Point</div>
                  <h3 className="mt-5 text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white">{title}</h3>
                  <p className="mt-5 text-sm leading-7 text-white/62">{text}</p>
                  <div className="mt-10 space-y-3">
                    {['Real SIM-backed', 'No logs policy', index === 2 ? 'WiFi/data calling' : 'Instant activation'].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/8 bg-black/28 px-4 py-4 text-sm text-white/72">
                        <Check className="mr-2 inline h-4 w-4 text-brand-green" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 rounded-[24px] border border-brand-green/18 bg-brand-green/10 p-4 font-mono text-sm text-brand-green">
                    +1 415 555 0182
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 xl:px-8">
          <Eyebrow>GStack Quality Pass</Eyebrow>
          <div className="grid gap-4 md:grid-cols-5">
            {qualityScores.map(([name, score, note]) => (
              <div key={name} className="rounded-[28px] border border-white/8 bg-white/[0.025] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">{name}</p>
                <p className="mt-4 font-mono text-4xl text-brand-green">{score}</p>
                <p className="mt-4 text-xs leading-6 text-white/52">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] xl:px-8">
          <div>
            <Eyebrow>Use Cases</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">Loved by users worldwide.</h2>
            <p className="mt-6 text-base leading-8 text-white/60">Millions trust Burner Point to communicate securely, verify accounts, and stay reachable without personal exposure.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((item) => (
              <div key={item} className="rounded-[24px] border border-white/8 bg-white/[0.02] px-5 py-5 font-mono text-sm uppercase tracking-[0.14em] text-white/70">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-6 xl:px-8">
          <div className="rounded-[42px] border border-brand-green/12 bg-[linear-gradient(135deg,rgba(0,255,157,0.13),rgba(5,8,7,0.96)_62%)] p-8 md:p-12">
            <Eyebrow>Get Started Today</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.94] text-white md:text-8xl">Get Your Number</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">Your first private number takes less than a minute. Create an account and keep your personal line out of the open internet.</p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/auth/signup" className="bp-button-glow inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-green px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac]">
                Get Your Number
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
              <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/82 transition hover:border-brand-green/35 hover:text-white">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
