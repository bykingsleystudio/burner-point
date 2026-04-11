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
    text: 'Secure access to real SIM-backed mobile numbers for instant verification and communication.',
    href: '/verifications',
    cta: 'Get Verification',
    items: ['Non-VoIP numbers', 'SMS and OTP verification', 'Voice call verification', 'Multi-country coverage'],
  },
  {
    icon: CalendarDays,
    title: 'Number Rentals',
    text: 'Flexible number ownership for temporary projects, repeat verifications, and account recovery.',
    href: '/rentals',
    cta: 'Rent A Number',
    items: ['Short-term 1-14 day rentals', 'Renewable monthly numbers', 'Unlimited verification usage', 'Multi-platform compatibility'],
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
  { icon: ShieldCheck, title: 'Verifications', price: '$0.99+', period: 'per verification', href: '/verifications', cta: 'Get Verification', items: ['Instant SMS and OTP', 'Real SIM numbers', '900+ platform support'] },
  { icon: CalendarDays, title: 'Non-Renewable Rentals', price: '$5.99+', period: 'per rental', href: '/rentals', cta: 'Rent A Number', items: ['1-14 day access', 'Unlimited verification usage', 'No auto-renewal surprise'] },
  { icon: CreditCard, title: 'Monthly Plans', price: '$15.99+', period: 'per month', href: '/pricing', cta: 'Start Monthly Plan', items: ['Renewable access', 'SMS and voice support', 'Best for continuity'] },
];

const productLinks = [
  { label: 'Overview', href: '/overview' },
  { label: 'Verifications', href: '/verifications' },
  { label: 'Rentals', href: '/rentals' },
  { label: 'API', href: '/api' },
  { label: 'Pricing', href: '/pricing' },
];

const useCases = ['Online registrations', 'Marketplaces', 'Business communication', 'Dating platforms', 'Travel usage', 'Privacy protection'];

export default function Home() {
  return (
    <MarketingShell>
      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-6 md:pb-28 md:pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center xl:px-8">
          <div>
            <div className="mb-7 inline-flex rounded-full border border-brand-green/18 bg-brand-green/10 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-brand-green">
              Private by Design
            </div>
            <h1 className="text-6xl font-semibold uppercase leading-[0.86] text-white md:text-8xl xl:text-[9.2rem]">
              Stay
              <br />
              <span className="bp-outline">Anonymous.</span>
              <br />
              Stay
              <br />
              <span className="text-brand-green">Connected.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-9 text-white/64 md:text-xl">
              Do not want to give out your phone number? No problem. Use ours. Generate secure, non-VoIP numbers instantly and take control of communication anywhere in the world.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/44">
              Receive SMS, voice calls, and OTP verifications from 900+ platforms globally.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/auth/signup" className="bp-button-glow inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-green px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac]">
                Get Started
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
              <Link href="/overview" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/82 transition hover:border-brand-green/35 hover:text-white">
                Learn More
              </Link>
              <Link href="/api/docs" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-brand-green/18 bg-brand-green/8 px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-brand-green transition hover:bg-brand-green/14">
                View API Docs
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { href: '/verifications', label: 'Get Verification' },
                { href: '/rentals', label: 'Rent A Number' },
                { href: '/pricing', label: 'Start Monthly Plan' },
                { href: '/auth/signup', label: 'Get Your Number' },
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

          <div className="bp-card rounded-[44px] p-5 md:p-7">
            <div className="rounded-[38px] border border-brand-green/15 bg-[#050807] p-6 shadow-[0_0_80px_rgba(0,255,157,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/assets/logo-mark.svg" alt="" width={34} height={34} />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Live Number</p>
                    <p className="font-mono text-sm text-white/48">US - Real SIM</p>
                  </div>
                </div>
                <span className="rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Active</span>
              </div>
              <div className="mt-8 font-mono text-4xl font-medium text-brand-green md:text-5xl">+1 415 555 0182</div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  ['148', 'SMS Received'],
                  ['23', 'Voice Calls'],
                  ['5d 14h', 'Rental Left'],
                  ['0', 'Personal Leaks'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[22px] border border-white/8 bg-white/[0.025] p-4">
                    <div className="text-3xl font-semibold text-white">{value}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/34">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-7 space-y-3">
                <div className="max-w-[84%] rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/78">
                  Your verification code is <span className="font-mono text-brand-green">847291</span>.
                </div>
                <div className="ml-auto max-w-[74%] rounded-[20px] border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-sm text-white/88">
                  Personal number stayed private.
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
              <h2 className="max-w-4xl text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">Numbers, rentals, and API access in one private stack.</h2>
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
            <p className="mt-6 text-base leading-8 text-white/60">The mobile app uses bottom tabs for Home, Numbers, Inbox, Credits, and Profile with quick access to verification, rentals, wallet balance, push alerts, and offline-ready cached state.</p>
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
                {['Home', 'Numbers', 'Inbox', 'Credits', 'Profile'].map((tab, index) => (
                  <span key={tab} className={`text-[10px] font-semibold ${index === 0 ? 'text-brand-green' : 'text-white/34'}`}>{tab}</span>
                ))}
              </div>
            </div>
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
