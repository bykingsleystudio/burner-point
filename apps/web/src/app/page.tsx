import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Code2,
  Globe2,
  Lock,
  Mail,
  MessageCircleMore,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-brand-green">
      <span className="h-px w-8 bg-brand-green/80" />
      <span>{children}</span>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm text-white/70">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-none text-brand-green" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-brand-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-80" />
        <div className="bp-hero-fx" />
        <div className="absolute inset-y-0 left-0 w-[38%] bg-[radial-gradient(circle_at_left,rgba(0,255,157,0.12),transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.12),transparent_65%)]" />
      </div>

      <div className="bp-orb absolute left-[18%] top-[140px] hidden md:block" />
      <div className="bp-orb-ring absolute left-[30%] top-[340px] hidden md:block" />
      <div className="bp-orb absolute right-[24%] top-[520px] hidden md:block" style={{ animationDelay: '2s' }} />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#060807]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo-mark.svg" alt="Burner Point" width={34} height={34} />
            <span className="font-mono text-lg font-semibold uppercase tracking-[0.22em] text-white">
              Burner <span className="text-brand-green">Point</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/58 lg:flex">
            {['Overview', 'Verifications', 'Rentals', 'API', 'Pricing', 'Blog', 'FAQ', 'About', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} className="transition hover:text-brand-green">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 transition hover:border-brand-green/40 hover:text-white">
              Sign In
            </Link>
            <Link href="/auth/register" className="bp-button-glow rounded-xl bg-brand-green px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-[#1cffac]">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-10 flex justify-center">
              <div className="rounded-[28px] border border-brand-green/20 bg-brand-green/8 p-5 shadow-[0_0_60px_rgba(0,255,157,0.22)]">
                <Image src="/assets/logo-mark.svg" alt="Burner Point" width={64} height={64} />
              </div>
            </div>

            <div className="mb-6 inline-flex rounded-full border border-brand-green/15 bg-brand-green/10 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.35em] text-brand-green">
              Private by Design
            </div>
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.35em] text-white/45 md:text-xs">
              Don&apos;t want to give out your phone number?
            </p>

            <div className="space-y-2 leading-[0.9] md:space-y-1">
              <div className="text-6xl font-semibold uppercase text-white md:text-[8rem]">No</div>
              <div className="bp-outline text-6xl font-semibold uppercase md:text-[8rem]">Problem.</div>
              <div className="text-6xl font-semibold uppercase text-white md:text-[8rem]">Use</div>
              <div className="bp-outline text-6xl font-semibold uppercase md:text-[8rem]">Ours.</div>
            </div>

            <p className="mx-auto mt-8 max-w-[44rem] text-base leading-8 text-white/58 md:text-xl">
              Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.
            </p>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.26em] text-white/45">Stay Anonymous. Stay Connected.</p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register" className="bp-button-glow inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-brand-green px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-[#1cffac]">
                Get Started
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/82 transition hover:border-brand-green/35 hover:text-white">
                Learn More
              </a>
            </div>

            <div className="mt-14">
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                Receive SMS, voice, and OTP verifications from 900+ platforms worldwide
              </p>
              <div className="overflow-hidden rounded-full border border-white/8 bg-white/[0.02] py-4">
                <div className="bp-number-track flex min-w-max items-center gap-8 px-6">
                  {[...Array(2)]
                    .flatMap(() => [
                      '+1 (415) 555-0182',
                      '+44 7700 900341',
                      '+49 177 5553918',
                      '+33 6 12 34 56 78',
                      '+81 90-5555-2847',
                      '+1 (416) 555-7293',
                    ])
                    .map((number, index) => (
                      <div key={`${number}-${index}`} className="font-mono text-sm uppercase tracking-[0.18em] text-white/38">
                        {number}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="overflow-hidden rounded-full border border-brand-green/15 bg-brand-green/[0.03] py-3">
                <div className="bp-flag-track flex min-w-max items-center gap-6 px-6">
                  {[...Array(2)]
                    .flatMap(() => ['🇺🇸 US +1', '🇬🇧 UK +44', '🇩🇪 DE +49', '🇫🇷 FR +33', '🇳🇬 NG +234', '🇮🇳 IN +91', '🇨🇦 CA +1', '🇦🇺 AU +61', '🇧🇷 BR +55', '🇯🇵 JP +81'])
                    .map((item, index) => (
                      <div key={`${item}-${index}`} className="rounded-full border border-white/10 bg-black/30 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/72">
                        {item}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-5 rounded-[30px] border border-white/6 bg-white/[0.015] p-6 md:grid-cols-4">
              {[
                ['900', '+ Services'],
                ['180', '+ Countries'],
                ['2', 'M+ Numbers'],
                ['99.9', '% Uptime'],
              ].map(([value, label]) => (
                <div key={label} className="text-center">
                  <div className="text-4xl font-semibold text-brand-green md:text-5xl">{value}</div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section id="how" className="relative py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">
            Four Steps
            <br />
            to Privacy
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {[
              ['01', 'Choose Your Number', 'Select your country and area code and get a real, non-VoIP number in seconds.'],
              ['02', 'Use It Anywhere', 'Verify accounts, receive messages, and handle communication across major services worldwide.'],
              ['03', 'Receive Instantly', 'SMS, OTP codes, and voice verifications arrive in real time with full inbox access.'],
              ['04', "You're in Control", 'Let the number expire when you are done or keep it active with flexible rentals.'],
            ].map(([number, title, description]) => (
              <article key={number} className="bp-card rounded-[30px] p-7">
                <div className="text-6xl font-semibold text-white/10">{number}</div>
                <h3 className="mt-6 font-mono text-lg font-semibold uppercase tracking-[0.08em] text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-12 text-center font-mono text-2xl uppercase tracking-[0.18em] text-white/88">
            Simple. <span className="text-brand-green">Secure.</span> Controlled.
          </p>
        </div>
      </section>

      <div className="bp-divider" />

      <section id="overview" className="relative py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <Eyebrow>Why Burner Point</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">
              Built for
              <br />
              Those Who
              <br />
              Value Privacy
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/58">
              Private by design. Every number, every verification, every call built from the ground up for speed, safety, and control.
            </p>
            <div className="mt-10 space-y-4">
              {([
                [Smartphone, 'Real SIM-Backed Numbers', 'Genuine mobile numbers backed by physical SIMs, not disposable VoIP lines.'],
                [Globe2, 'Universal Compatibility', 'Works across social apps, marketplaces, financial tools, and business software.'],
                [Mail, 'Instant Delivery', 'Carrier-connected delivery keeps SMS and OTP traffic fast and dependable.'],
                [ShieldCheck, 'Privacy First', 'Your real number stays private while Burner Point handles verification and communication.'],
              ] as Array<[LucideIcon, string, string]>).map(([Icon, title, description]) => (
                <div key={String(title)} className="bp-card flex gap-4 rounded-[24px] p-5 md:p-6">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-brand-green/20 bg-brand-green/10">
                    <Icon className="h-5 w-5 text-brand-green" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-white">{String(title)}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/58">{String(description)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pt-16">
            <div className="bp-card rounded-[34px] p-7 md:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-green/80">Active Number - US - Burner</div>
              <div className="mt-5 font-mono text-3xl font-medium text-brand-green md:text-5xl">+1 (415) 555-0182</div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  ['148', 'SMS Received'],
                  ['23', 'Calls This Month'],
                  ['$0.99', 'Last Verification'],
                  ['Live', 'Status'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[20px] border border-white/6 bg-black/25 p-4">
                    <div className="text-3xl font-semibold text-brand-green">{value}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/32">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-7">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/32">TTL Remaining</div>
                <div className="flex items-center gap-4">
                  <div className="h-3 flex-1 overflow-hidden rounded-full border border-brand-green/15 bg-brand-green/10">
                    <div className="h-full w-[62%] rounded-full bg-brand-green shadow-[0_0_24px_rgba(0,255,157,0.35)]" />
                  </div>
                  <div className="font-mono text-sm uppercase tracking-[0.12em] text-white/64">5d 14h</div>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-center gap-3 rounded-full border border-brand-green/15 bg-brand-green/8 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-brand-green shadow-[0_0_16px_rgba(0,255,157,0.9)]" />
                <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-brand-green/90">Zero Personal Data Stored</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section id="verifications" className="relative py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>What We Offer</Eyebrow>
          <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">
            Secure
            <br />
            Communication
            <br />
            Solutions
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/58">
            Burner Point provides secure communication solutions for individuals and businesses who value privacy, speed, and control.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {([
              [Smartphone, 'Non-VoIP Numbers', 'Real mobile numbers backed by physical SIMs that work where internet-only lines fail.'],
              [Mail, 'SMS and OTP Verification', 'Receive verification codes from major services instantly for one-time or repeat usage.'],
              [Phone, 'Voice Call Verification', 'Receive and answer automated voice verification calls directly through your Burner Point number.'],
              [RefreshCcw, 'Temporary Rentals', 'Short-term number rentals from 1 to 14 days for registrations, testing, and controlled access.'],
              [Globe2, 'Multi-Country Access', 'Choose numbers in 180+ countries and match area codes to the regions you need.'],
              [ShieldCheck, 'Platform Verification', 'Verify WhatsApp, Instagram, Telegram, TikTok, Gmail, Uber, Stripe, and hundreds more services.'],
            ] as Array<[LucideIcon, string, string]>).map(([Icon, title, description]) => (
              <article key={String(title)} className="bp-card rounded-[30px] p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/7 bg-white/[0.02]">
                  <Icon className="h-6 w-6 text-brand-green" />
                </div>
                <h3 className="mt-7 font-mono text-lg font-semibold uppercase tracking-[0.08em] text-white">{String(title)}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">{String(description)}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.015] py-5">
            <p className="px-6 pb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-green/80">900+ Supported Services</p>
            <div className="bp-service-track flex min-w-max items-center gap-4 px-6">
              {[...Array(2)]
                .flatMap(() => ['WhatsApp', 'Telegram', 'Gmail', 'Tinder', 'Instagram', 'Facebook', 'Uber', 'Stripe', 'Discord', 'X', 'Binance', 'LinkedIn'])
                .map((service, index) => (
                  <span key={`${service}-${index}`} className="rounded-full border border-white/10 bg-black/35 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/66">
                    {service}
                  </span>
                ))}
            </div>
          </div>

          <div id="api" className="bp-card mt-5 rounded-[30px] p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-green/20 bg-brand-green/10">
                  <Code2 className="h-6 w-6 text-brand-green" />
                </div>
                <h3 className="text-3xl font-semibold uppercase text-white md:text-4xl">Developer API</h3>
                <p className="mt-4 text-base leading-8 text-white/58">
                  Integrate Burner Point into your system and automate verifications at scale with REST endpoints, webhook callbacks, and developer-friendly workflows.
                </p>
              </div>
              <a href="#services" className="bp-button-glow inline-flex items-center justify-center rounded-2xl bg-brand-green px-7 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-[#1cffac]">
                View API Docs
                <ArrowRight className="ml-3 h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['2M+', 'Numbers Generated'],
              ['900+', 'Platforms Supported'],
              ['99.9%', 'Delivery Uptime'],
            ].map(([value, label]) => (
              <div key={label} className="bp-card rounded-[26px] p-6">
                <div className="text-4xl font-semibold text-brand-green">{value}</div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/38">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Eyebrow>Loved by Users Worldwide</Eyebrow>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-white/58">
            Millions trust Burner Point to communicate, verify, and stay connected without exposing their real number.
          </p>
        </div>
      </section>

      <div className="bp-divider" />

      <section id="pricing" className="relative py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">
              Great Products.
              <br />
              Simple Pricing.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/58">
              Purchase numbers or credits using secure payment options and choose the plan that fits your needs.
            </p>
          </div>

          <div className="mt-14 grid gap-6 xl:grid-cols-3">
            {[
              {
                icon: Check,
                title: 'Verifications',
                price: '$0.99',
                period: 'per verification',
                features: ['Receive SMS or OTP codes instantly', 'Verify accounts across any platform', 'Real non-VoIP numbers only', '180+ country selection', 'Instant delivery with no wait time'],
              },
              {
                icon: CalendarDays,
                title: 'Non-Renewable Rentals',
                price: '$5.00',
                period: 'per rental - 1-14 days',
                features: ['Use for any service or platform', 'Own your number temporarily', 'Unlimited SMS verifications', 'Instant access 24/7', 'No automatic renewal charges'],
                featured: true,
                badge: 'Most Flexible',
              },
              {
                icon: RefreshCcw,
                title: 'Renewable Rentals',
                price: '$15.99',
                period: 'per month',
                features: ['Keep your number as long as you want', 'Unlimited SMS and voice verifications', 'Choose any country or area code', 'Monthly subscription billing', 'Multi-service verification on one line'],
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className={`rounded-[30px] border p-7 ${card.featured ? 'border-brand-green/30 bg-[linear-gradient(180deg,rgba(0,255,157,0.08),rgba(2,14,10,0.92))] shadow-[0_0_50px_rgba(0,255,157,0.15)]' : 'bp-card'}`}>
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                        <Icon className="h-5 w-5 text-brand-green" />
                      </div>
                      <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.32em] text-white/32">{card.title}</div>
                    </div>
                    {card.badge ? <div className="rounded-full bg-brand-green px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-black">{card.badge}</div> : null}
                  </div>
                  <div className="mt-6 text-5xl font-semibold text-brand-green md:text-6xl">{card.price}</div>
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/38">{card.period}</div>
                  <div className="my-8 h-px bg-white/8" />
                  <BulletList items={card.features} />
                  <Link href="/auth/register" className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] transition ${card.featured ? 'bg-brand-green text-black hover:bg-[#1cffac]' : 'border border-white/10 text-white/84 hover:border-brand-green/35 hover:text-white'}`}>
                    {card.title === 'Verifications' ? 'Get Verification' : card.title === 'Renewable Rentals' ? 'Start Monthly Plan' : 'Rent a Number'}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section id="rentals" className="relative py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <Eyebrow>Calls and Messaging</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">
              Call and Text
              <br />
              Over WiFi
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/58">
              Millions use Burner Point to call and text over WiFi or data with no SIM or airtime required.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {([
                [Smartphone, 'Free Phone Number', 'Choose your own U.S. number and start communicating instantly.'],
                [MessageCircleMore, 'Free Texting', 'Unlimited texting to U.S. numbers from any connected device.'],
                [Wifi, 'WiFi and Data Calling', 'Call and text without using cellular minutes or airtime credit.'],
                [Phone, 'Full Communication Suite', 'SMS, MMS, Calls, and Voicemail all in one place.'],
                [Globe2, 'No Roaming Fees', 'Use Burner Point globally without extra roaming charges.'],
                [ShieldCheck, 'Cross-Platform Access', 'Available on iOS, Android, Web, iPad, and more.'],
              ] as Array<[LucideIcon, string, string]>).map(([Icon, title, description]) => (
                <article key={String(title)} className="bp-card rounded-[24px] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                    <Icon className="h-5 w-5 text-brand-green" />
                  </div>
                  <h3 className="mt-5 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-white">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/58">{String(description)}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bp-card w-full max-w-[360px] rounded-[40px] p-5">
              <div className="rounded-[34px] border border-brand-green/15 bg-[#050807] p-5 shadow-[0_0_40px_rgba(0,255,157,0.12)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-brand-green">Burner Point</div>
                  <Wifi className="h-5 w-5 text-brand-green" />
                </div>
                <div className="text-center">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">Your Private Number</div>
                  <div className="mt-3 font-mono text-3xl font-medium text-brand-green">+1 (415) 555-0182</div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="max-w-[80%] rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/78">
                    Your Stripe verification code:
                    <div className="mt-2 font-mono text-xl text-brand-green">847 291</div>
                  </div>
                  <div className="ml-auto max-w-[56%] rounded-[18px] border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-sm text-white/88">Got it, thanks!</div>
                  <div className="max-w-[72%] rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/78">
                    Your WhatsApp code:
                    <div className="mt-2 font-mono text-xl text-brand-green">362-419</div>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 border-t border-white/6 pt-4">
                  <div className="flex-1 rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/30">Reply...</div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-black">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section id="faq" className="relative py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">
              Everything
              <br />
              You Need
              <br />
              to Know
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/58">
              Everything you need to know about Burner Point, how it works, and how to get started.
            </p>
          </div>

          <div className="space-y-4">
            {[
              ['What is a non-VoIP number and why does it matter?', 'Non-VoIP numbers are backed by real carrier infrastructure and physical SIMs, not internet-only voice services. Many major platforms reject VoIP numbers, while real SIM-backed numbers pass those checks much more reliably.'],
              ['How quickly will I receive SMS codes?', 'Most verification messages arrive within seconds through carrier-connected infrastructure designed for speed and consistency.'],
              ['Which countries and services are supported?', 'Burner Point supports numbers in 180+ countries and works with 900+ services including messaging apps, marketplaces, financial tools, and social platforms.'],
              ["What's the difference between a rental and a verification?", 'A verification is typically one-time use for receiving a code. A rental gives you longer access to the number for repeat verifications and broader communication use.'],
              ['Is my identity protected?', 'Yes. Burner Point is built around privacy-first usage and keeps your personal number separated from the accounts and workflows you manage.'],
              ['Can I use Burner Point for calls as well as SMS?', 'Yes. Burner Point supports SMS, MMS, voice verification, and calling workflows depending on the number type and plan you choose.'],
              ['Do you offer an API for developers?', 'Yes. A developer API with REST endpoints and webhook support is available for automating number provisioning and verification at scale.'],
            ].map(([question, answer]) => (
              <details key={question} className="bp-card group rounded-[24px] p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-mono text-sm font-semibold uppercase tracking-[0.14em] text-white">
                  <span>{question}</span>
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-brand-green/15 bg-brand-green/10 text-brand-green transition group-open:rotate-45">+</div>
                </summary>
                <p className="pt-5 text-sm leading-7 text-white/58">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="bp-divider" />

      <section id="services" className="relative py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Built for Privacy and Control</Eyebrow>
            <h2 className="text-5xl font-semibold uppercase leading-[0.95] text-white md:text-7xl">
              Built for
              <br />
              Privacy
              <br />
              and Control
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/58">
              Burner Point is designed for people who want control over their communication. Use it for online registrations, marketplaces, business interactions, dating platforms, travel communication, and everyday privacy protection.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {([
              {
                icon: Lock,
                title: 'Instant Verifications',
                points: [
                  'Get a non-VoIP number',
                  'Register on any platform',
                  'Receive SMS and OTP instantly',
                  'Respond to voice verification calls',
                  'Choose any country or area code',
                ],
              },
              {
                icon: CalendarDays,
                title: 'Flexible Rentals',
                points: [
                  'Short-term rentals (1-14 days)',
                  'Long-term rentals (renewable monthly)',
                  'Unlimited verification usage',
                  'Multi-platform compatibility',
                ],
              },
              {
                icon: Code2,
                title: 'API Access',
                points: [
                  'Integrate Burner Point into your system',
                  'Automate verifications at scale',
                  'Webhook-ready workflows',
                  'Built for developer speed and reliability',
                ],
              },
            ] as Array<{ icon: LucideIcon; title: string; points: string[] }>).map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="bp-card rounded-[24px] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                    <Icon className="h-5 w-5 text-brand-green" />
                  </div>
                  <h3 className="mt-5 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-white">{card.title}</h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-white/66">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 leading-7">
                        <Check className="mt-1 h-4 w-4 flex-none text-brand-green" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <p className="mt-12 text-center font-mono text-2xl uppercase tracking-[0.18em] text-white/82">
            Stay Connected. <span className="text-brand-green">Stay Anonymous.</span>
          </p>
        </div>
      </section>

      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-[40px] border border-brand-green/10 bg-[linear-gradient(135deg,rgba(0,255,157,0.12),rgba(5,8,7,0.96)_58%)] px-8 py-16 text-center md:px-12">
            <div className="pointer-events-none absolute inset-0 bp-grid-bg opacity-50" />
            <div className="relative">
              <Eyebrow>Get Started Today</Eyebrow>
              <h2 className="text-5xl font-semibold uppercase leading-[0.94] text-white md:text-8xl">
                Stay
                <br />
                <span className="text-brand-green">Anonymous.</span>
                <br />
                Stay Connected.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
                Millions trust Burner Point every day. Join them. Your first number takes 30 seconds.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/register" className="bp-button-glow inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-brand-green px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-[#1cffac]">
                  Get Your Number
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
                <a href="#pricing" className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/82 transition hover:border-brand-green/35 hover:text-white">
                  View Pricing
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1.85fr]">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <Image src="/assets/logo-mark.svg" alt="Burner Point" width={32} height={32} />
                <span className="font-mono text-lg font-semibold uppercase tracking-[0.22em] text-white">
                  Burner <span className="text-brand-green">Point</span>
                </span>
              </Link>
              <p className="mt-6 max-w-sm text-sm leading-8 text-white/52">
                Your one-stop platform for secure SMS, text, and voice verification. Built for speed, privacy, and global access.
              </p>
              <p className="mt-2 max-w-sm text-sm leading-8 text-white/52">Exceptional service and competitive pricing set us apart.</p>
              <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.26em] text-white/30">Private by Design.</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.26em] text-brand-green">Stay Connected. Stay Anonymous.</p>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Product', ['Overview', 'Verifications', 'Rentals', 'API', 'Pricing']],
                ['Company', ['About', 'Blog', 'Updates', 'Careers']],
                ['Support', ['FAQ', 'Help Center', 'Contact']],
                ['Legal', ['Terms', 'Privacy Policy']],
              ].map(([title, links]) => (
                <div key={String(title)}>
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white">{String(title)}</h3>
                  <ul className="mt-5 space-y-3 text-sm text-white/48">
                    {(links as string[]).map((label) => (
                      <li key={label}>
                        <a
                          href={
                            label === 'FAQ'
                              ? '#faq'
                              : label === 'About'
                                ? '#about'
                                : label === 'Contact'
                                  ? '#contact'
                                  : label === 'Pricing'
                                    ? '#pricing'
                                    : label === 'Verifications'
                                      ? '#verifications'
                                      : label === 'Rentals'
                                        ? '#rentals'
                                        : label === 'API'
                                          ? '#api'
                                          : label === 'Overview'
                                            ? '#overview'
                                            : '#'
                          }
                          className="transition hover:text-brand-green"
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/6 pt-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-white/30">© 2026 Burner Point. All rights reserved.</p>
              <div className="flex flex-wrap gap-3">
                {['256-bit AES', 'No Logs Policy', 'GDPR Compliant', 'Real SIM Numbers'].map((badge) => (
                  <span key={badge} className="rounded-full border border-white/8 bg-white/[0.025] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/34">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
      <section id="blog" className="hidden" />
      <section id="about" className="hidden" />
      <section id="contact" className="hidden" />
    </main>
  );
}
