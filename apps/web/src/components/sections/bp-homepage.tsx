'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Phone,
  Route,
  Server,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wifi,
  X,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTelegram, FaTiktok, FaYoutube } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { BpButton, BpKicker, BpLogo, BpSectionHeading, BpSurface, TelecomSplineScene } from '@/components/ui/bp-landing-primitives';

const DEFAULT_SPLINE_SCENE = 'https://prod.spline.design/X-LH7Bs0Cb5fYkPA/scene.splinecode';

const NAV_ITEMS = [
  { label: 'Products', href: '#products' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Download App', href: '#download-app' },
  { label: 'Support', href: '#support' },
] as const;

const HERO_STATS = [
  { value: '180+', label: 'Countries' },
  { value: '99.2%', label: 'OTP Success Rate' },
  { value: '900+', label: 'Platforms Supported' },
  { value: 'Growing', label: 'Active Lines' },
] as const;

const WHY_ITEMS = [
  {
    icon: LockKeyhole,
    title: 'Protect Privacy',
    body: 'Use a second number instead of exposing your personal line.',
  },
  {
    icon: MessageSquareText,
    title: 'Stay Connected',
    body: 'Call, text, verify, rent, and manage communication in one place.',
  },
  {
    icon: Wifi,
    title: 'Instant Access',
    body: 'Numbers, OTPs, eSIMs, and tools available in seconds.',
  },
] as const;

const PRODUCT_ITEMS = [
  {
    icon: MessageSquareText,
    title: 'BP Messenger',
    body: 'Dedicated US/UK/CA number for texting and calls.',
    href: '/dashboard/inbox',
  },
  {
    icon: ShieldCheck,
    title: 'BP Verify Hub',
    body: 'Receive SMS or voice verification codes instantly.',
    href: '/dashboard/verification',
  },
  {
    icon: Phone,
    title: 'BP Rentals',
    body: 'Temporary or renewable private numbers.',
    href: '/dashboard/rentals',
  },
  {
    icon: Smartphone,
    title: 'BP eSIM Store',
    body: 'Travel data plans for global connectivity.',
    href: '/dashboard/esim',
  },
  {
    icon: Route,
    title: 'BP Secure Tunnel',
    body: 'VPN with dedicated IP options.',
    href: '/dashboard/vpn',
  },
  {
    icon: Server,
    title: 'BP Proxy Store',
    body: 'Private routing tools for business users.',
    href: '/dashboard/proxies',
  },
] as const;

const USE_CASES = [
  'Online selling without exposing your number',
  'Dating safely',
  'Side business communication',
  'Travel abroad with eSIM data',
  'Signups and account recovery',
  'Separate work from personal life',
] as const;

const HOW_IT_WORKS = [
  'Create account',
  'Fund wallet or choose subscription',
  'Select service (Number / Verify / Rental / eSIM / VPN)',
  'Stay connected privately',
] as const;

const PRICING_ITEMS: Array<{
  title: string;
  price: string;
  body: string;
  cta: string;
  href: string;
  recommended?: boolean;
}> = [
  {
    title: 'Verification',
    price: 'Starting at $0.99+',
    body: 'SMS or voice OTP by service + country.',
    cta: 'Get Verification',
    href: '/dashboard/verification',
  },
  {
    title: 'Non-Renewable Rentals',
    price: 'Starting at $5.99',
    body: 'Temporary numbers when you only need short-term access.',
    cta: 'Rent Number',
    href: '/dashboard/rentals',
  },
  {
    title: 'Renewable Rentals',
    price: 'Starting at $15.99/month',
    body: 'Keep the same number active for continuity.',
    cta: 'Start Monthly Plan',
    href: '/pricing',
  },
  {
    title: 'BP Messenger Pro',
    price: 'From $9.99/month',
    body: 'Dedicated private number + full messaging tools.',
    cta: 'Start Messaging',
    href: '/dashboard/inbox',
    recommended: true,
  },
] as const;

const COMPARISON_ITEMS = [
  ['Messaging + Calls', 'Yes', 'Sometimes'],
  ['Verification Hub', 'Yes', 'No'],
  ['Rentals', 'Yes', 'Rare'],
  ['eSIM', 'Yes', 'No'],
  ['VPN', 'Yes', 'No'],
  ['Wallet Billing', 'Yes', 'No'],
  ['Privacy-first Brand', 'Yes', 'Mixed'],
] as const;

const FAQ_ITEMS = [
  {
    question: 'Is my real number required?',
    answer: 'No. Use Burner Point numbers where supported.',
  },
  {
    question: 'What countries are supported?',
    answer: 'USA, Canada, UK plus global services depending on product.',
  },
  {
    question: 'How fast is verification?',
    answer: 'Usually instant, depending on route and service.',
  },
  {
    question: 'Can I renew my number?',
    answer: 'Yes, renewable rentals are available.',
  },
  {
    question: 'What payment methods do you support?',
    answer: 'Cards, local gateways, crypto, selected regional methods.',
  },
] as const;

const TESTIMONIALS = [
  {
    name: 'Sarah Digital',
    handle: '@sarahdigital',
    quote:
      'Finally, a telecom platform that respects my privacy. The verification tools are lightning-fast and the UI is stunning.',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Marcus W.',
    handle: '@marcusops',
    quote:
      'Burner Point feels premium in a way most number platforms never do. Messaging, rentals, and OTP flows are all in one place.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Nadia K.',
    handle: '@nadiabuilds',
    quote:
      'I switched because the brand feels trustworthy and the wallet model is simple. It is fast, clear, and private by default.',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
  },
] as const;

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/burnerpoint.app', icon: FaInstagram },
  { label: 'Facebook', href: 'https://www.facebook.com/burnerpoint.app', icon: FaFacebook },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/burnerpointapp', icon: FaLinkedin },
  { label: 'TikTok', href: 'https://www.tiktok.com/@burnerpointapp', icon: FaTiktok },
  { label: 'X', href: 'https://x.com/burnerpointapp', icon: FaXTwitter },
  { label: 'Telegram', href: 'https://t.me/burnerpointapp', icon: FaTelegram },
  { label: 'YouTube', href: 'https://www.youtube.com/@burnerpointapp', icon: FaYoutube },
] as const;

const TRUST_ROW = ['Supports USA', 'Canada', 'UK', '& Global Services'] as const;

function MotionIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.55, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function BurnerPointHomepage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scene = process.env.NEXT_PUBLIC_BP_SPLINE_SCENE?.trim() || DEFAULT_SPLINE_SCENE;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_86%_12%,rgba(57,255,20,0.08),transparent_18%),linear-gradient(180deg,rgba(1,50,32,0.42),rgba(0,0,0,0.98)_56%)]" />
        <div className="bp-grid-bg absolute inset-0 opacity-45" />
      </div>

      <LandingNavigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="relative z-10">
        <HeroSection scene={scene} />
        <SocialProofBar />
        <WhySection />
        <ProductsSection />
        <UseCasesSection />
        <HowItWorksSection />
        <PricingSection />
        <DashboardPreviewSection />
        <ComparisonSection />
        <FaqSection />
        <TestimonialsSection />
        <FinalCtaSection />
        <LandingFooter />
      </div>
    </main>
  );
}

function LandingNavigation({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(1,7,4,0.82)] backdrop-blur-2xl">
      <div className="mx-auto flex min-h-20 max-w-[1680px] items-center justify-between gap-4 px-5 sm:px-6 xl:px-10">
        <BpLogo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-white/62 transition hover:bg-white/[0.04] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <BpButton href="/auth/login" variant="ghost" size="md">
            Sign In
          </BpButton>
          <BpButton href="/auth/signup" variant="primary" size="md">
            Get Started
          </BpButton>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/8 bg-[rgba(1,7,4,0.96)] px-5 pb-5 pt-4 lg:hidden">
          <div className="grid gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/78 transition hover:border-[#00FF9D]/28 hover:text-[#00FF9D]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2">
              <BpButton href="/auth/login" variant="outline" size="md" className="w-full">
                Sign In
              </BpButton>
              <BpButton href="/auth/signup" variant="primary" size="md" className="w-full">
                Get Started
              </BpButton>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function HeroSection({ scene }: { scene: string }) {
  return (
    <section className="px-5 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-14 xl:px-10">
      <div className="mx-auto grid max-w-[1680px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(32rem,42rem)] lg:items-center">
        <MotionIn className="max-w-3xl">
          <BpKicker>Premium Direct Response Telecom</BpKicker>
          <h1 className="mt-5 max-w-[13ch] text-[2.7rem] font-black leading-[0.88] text-white sm:text-[3.6rem] md:text-[4.6rem] xl:text-[5.7rem]">
            Private by Design.
          </h1>
          <p className="mt-4 text-xl leading-8 text-white/74 sm:text-2xl">Stay Anonymous. Stay Connected.</p>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
            Don&apos;t want to give out your phone number? No problem. Use ours.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/58">
            Need a number without giving out your real one? Burner Point gives you instant access to private numbers,
            messaging tools, verifications, rentals, eSIM data, and secure connectivity.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BpButton href="/auth/signup" variant="primary" size="lg">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </BpButton>
            <BpButton href="#pricing" variant="outline" size="lg">
              View Pricing
            </BpButton>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {TRUST_ROW.map((item) => (
              <span
                key={item}
                className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/68"
              >
                {item}
              </span>
            ))}
          </div>
        </MotionIn>

        <MotionIn delay={0.12}>
          <BpSurface glow className="relative min-h-[34rem] overflow-hidden p-4 sm:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(0,255,157,0.16),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(57,255,20,0.12),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.08))]" />
            <div className="absolute inset-0">
              <TelecomSplineScene
                scene={scene}
                className="h-full w-full opacity-70"
                fallback={<HeroVisualFallback />}
              />
            </div>
            <div className="pointer-events-none absolute left-6 top-6 rounded-full border border-[#00FF9D]/30 bg-[#00FF9D]/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">
              Live dashboard preview
            </div>
            <div className="pointer-events-none absolute right-5 top-20 w-[12rem] rounded-[1.35rem] border border-white/12 bg-black/42 p-4 backdrop-blur-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">Wallet balance</p>
              <p className="mt-3 text-3xl font-semibold text-white">$240.00</p>
              <p className="mt-2 text-xs text-white/48">One wallet. Many services.</p>
            </div>
            <div className="pointer-events-none absolute left-5 top-28 w-[13rem] rounded-[1.35rem] border border-white/12 bg-black/42 p-4 backdrop-blur-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">Active US number</p>
              <p className="mt-3 font-mono text-xl text-white">+1 (415) 555 0182</p>
              <p className="mt-2 text-xs text-white/48">Private line ready</p>
            </div>
            <div className="pointer-events-none absolute bottom-28 right-6 w-[13rem] rounded-[1.35rem] border border-[#39FF14]/24 bg-[rgba(57,255,20,0.08)] p-4 backdrop-blur-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#39FF14]">OTP received</p>
              <p className="mt-3 font-mono text-2xl text-white">847291</p>
              <p className="mt-2 text-xs text-white/48">Live verification toast</p>
            </div>
            <div className="pointer-events-none absolute bottom-6 left-5 right-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-white/12 bg-black/42 p-4 backdrop-blur-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">VPN connected</p>
                <p className="mt-2 text-sm text-white">New York</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/12 bg-black/42 p-4 backdrop-blur-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">eSIM ready</p>
                <p className="mt-2 text-sm text-white">Global data active</p>
              </div>
            </div>
          </BpSurface>
        </MotionIn>
      </div>
    </section>
  );
}

function SocialProofBar() {
  return (
    <section className="border-y border-white/8 bg-[rgba(1,14,10,0.9)] px-5 py-5 sm:px-6 xl:px-10">
      <div className="mx-auto grid max-w-[1680px] gap-4 md:grid-cols-4">
        {HERO_STATS.map((item, index) => (
          <MotionIn key={item.label} delay={0.05 * index}>
            <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.025] px-5 py-4 text-center">
              <p className="text-3xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">{item.label}</p>
            </div>
          </MotionIn>
        ))}
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading
          kicker="Why Burner Point"
          title="Your Real Number Should Stay Yours."
          body="Protect your real number. Instant second numbers. One wallet. Many services. Built for privacy."
          align="center"
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {WHY_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <MotionIn key={item.title} delay={0.08 * index}>
                <BpSurface className="h-full p-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-[#00FF9D]/22 bg-[#00FF9D]/10">
                    <Icon className="h-6 w-6 text-[#00FF9D]" />
                  </span>
                  <h3 className="mt-6 text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{item.body}</p>
                </BpSurface>
              </MotionIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section id="products" className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading
          kicker="Core Products"
          title="Everything You Need. One Platform."
          body="Burner Point is the lane the market left open: premium privacy branding, modern SaaS UX, and a full telecom ecosystem from messaging to routing."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCT_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <MotionIn key={item.title} delay={0.06 * index}>
                <BpSurface className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-[#00FF9D]/24">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.03]">
                      <Icon className="h-6 w-6 text-[#00FF9D]" />
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/42">
                      Product
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{item.body}</p>
                  <Link href={item.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00FF9D] transition hover:gap-3">
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </BpSurface>
              </MotionIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading kicker="Use Cases" title="Built For Real Life." align="center" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {USE_CASES.map((item, index) => (
            <MotionIn key={item} delay={0.05 * index}>
              <BpSurface className="px-5 py-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#00FF9D]/10 text-[#00FF9D]">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-7 text-white/76">{item}</p>
                </div>
              </BpSurface>
            </MotionIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading kicker="How It Works" title="Get Started in Minutes" align="center" />

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, index) => (
            <MotionIn key={step} delay={0.08 * index}>
              <BpSurface className="relative h-full p-6">
                <span className="font-mono text-5xl text-white/10">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold text-white">{step}</h3>
                {index < HOW_IT_WORKS.length - 1 ? (
                  <span className="pointer-events-none absolute right-[-14px] top-1/2 hidden h-px w-7 bg-[linear-gradient(90deg,rgba(0,255,157,0.3),transparent)] lg:block" />
                ) : null}
              </BpSurface>
            </MotionIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading
          kicker="Pricing"
          title="Simple Pricing. Real Control."
          body="All prices in USD. Local currency display available at checkout. No hidden fees."
          align="center"
        />

        <div className="mt-10 grid gap-5 xl:grid-cols-4">
          {PRICING_ITEMS.map((item, index) => (
            <MotionIn key={item.title} delay={0.06 * index}>
              <div
                className={cn(
                  'h-full rounded-[1.8rem] border p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1',
                  item.recommended
                    ? 'border-[#00FF9D]/32 bg-[linear-gradient(180deg,rgba(0,255,157,0.12),rgba(0,0,0,0.94))] shadow-[0_30px_90px_rgba(0,255,157,0.12)]'
                    : 'border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.76),rgba(0,0,0,0.94))]',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold text-white">{item.title}</p>
                    <p className="mt-4 text-3xl font-semibold text-[#00FF9D]">{item.price}</p>
                  </div>
                  {item.recommended ? (
                    <span className="rounded-full border border-[#39FF14]/26 bg-[#39FF14]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#39FF14]">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 text-sm leading-7 text-white/58">{item.body}</p>
                <BpButton href={item.href} variant={item.recommended ? 'primary' : 'outline'} size="lg" className="mt-8 w-full">
                  {item.cta}
                </BpButton>
              </div>
            </MotionIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreviewSection() {
  return (
    <section id="download-app" className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <div className="grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <div>
            <BpSectionHeading
              kicker="Live Dashboard Preview"
              title="A real product feel, not a generic OTP site."
              body="The dashboard preview below is built with responsive UI, not a pasted screenshot, so the page scales cleanly while still looking like a live product."
            />
            <div className="mt-8 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">Download App</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                iOS and Android companion app coming soon. The placeholder stays in nav now so the landing architecture is already ready for the mobile launch.
              </p>
            </div>
          </div>

          <MotionIn delay={0.08}>
            <BpSurface className="overflow-hidden p-4 sm:p-5">
              <div className="rounded-[1.5rem] border border-white/8 bg-black/28 p-4">
                <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#00FF9D]/22 bg-[#00FF9D]/10">
                      <Image src="/assets/logo-mark.svg" alt="" width={22} height={22} />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">Burner Point</p>
                      <p className="text-sm text-white/54">Wallet page + inbox + verify feed</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/62">Credits: $240.00</div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {['Dashboard', 'BP Messenger', 'BP Verify Hub', 'BP Rentals', 'BP Secure Tunnel'].map((item, index) => (
                      <div
                        key={item}
                        className={cn(
                          'rounded-[1rem] border px-4 py-3 text-sm',
                          index === 0
                            ? 'border-[#00FF9D]/24 bg-[#00FF9D]/10 text-white'
                            : 'border-white/8 bg-white/[0.03] text-white/62',
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">Wallet balance</p>
                        <p className="mt-3 text-3xl font-semibold text-white">$240.00</p>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">Renewable rental</p>
                        <p className="mt-3 font-mono text-lg text-white">+1 (415) 555 0182</p>
                      </div>
                    </div>
                    <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">Activity feed</p>
                          <p className="mt-2 text-sm text-white/62">Messaging inbox, verification feed, rental management, VPN dashboard.</p>
                        </div>
                        <UserRound className="h-5 w-5 text-[#00FF9D]" />
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-[1rem] border border-[#39FF14]/24 bg-[#39FF14]/10 px-4 py-3 text-sm text-white">
                          OTP Received: <span className="font-mono">847291</span>
                        </div>
                        <div className="rounded-[1rem] border border-[#00FF9D]/24 bg-[#00FF9D]/10 px-4 py-3 text-sm text-white">
                          VPN Connected - New York
                        </div>
                        <div className="rounded-[1rem] border border-white/8 bg-black/22 px-4 py-3 text-sm text-white/66">
                          eSIM ready • Travel data active • Messaging synced
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BpSurface>
          </MotionIn>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading kicker="Why Users Switch" title="Built different." align="center" />

        <div className="mt-10 overflow-hidden rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.78),rgba(0,0,0,0.94))]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b border-white/8 px-5 py-4 text-sm font-semibold text-white">
            <div>Feature</div>
            <div>Burner Point</div>
            <div>Typical Apps</div>
          </div>
          {COMPARISON_ITEMS.map(([feature, burnerPoint, typical], index) => (
            <div
              key={feature}
              className={cn(
                'grid grid-cols-[1.4fr_1fr_1fr] gap-4 px-5 py-4 text-sm',
                index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-black/18',
              )}
            >
              <div className="text-white/74">{feature}</div>
              <div className="text-[#39FF14]">✅ {burnerPoint}</div>
              <div className="text-white/56">{typical}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading kicker="FAQ" title="Frequently Asked Questions" align="center" />

        <div className="mx-auto mt-10 max-w-4xl space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <MotionIn key={item.question} delay={0.04 * index}>
              <details className="group rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-white">
                  <span>{item.question}</span>
                  <ChevronDown className="h-5 w-5 text-[#00FF9D] transition group-open:rotate-180" />
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">{item.answer}</p>
              </details>
            </MotionIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <BpSectionHeading kicker="Testimonials" title="Trusted by users worldwide" align="center" />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <MotionIn key={item.handle} delay={0.06 * index}>
              <BpSurface className="h-full p-6">
                <div className="flex items-center gap-4">
                  <Image
                    src={item.avatar}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-[1.2rem] object-cover"
                  />
                  <div>
                    <p className="text-lg font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-[#00FF9D]">{item.handle}</p>
                  </div>
                </div>
                <p className="mt-6 text-sm leading-7 text-white/68">{item.quote}</p>
              </BpSurface>
            </MotionIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="px-5 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-24 xl:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(1,50,32,0.94),rgba(0,0,0,0.98))] px-8 py-12 text-center shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
          <BpKicker>Final CTA</BpKicker>
          <h2 className="mt-4 text-4xl font-black leading-[0.94] text-white md:text-6xl">Keep Your Number Private.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/62">
            Join Burner Point and take control of how the world reaches you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <BpButton href="/auth/signup" variant="primary" size="lg">
              Create Account
            </BpButton>
            <BpButton href="#pricing" variant="outline" size="lg">
              View Pricing
            </BpButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer id="support" className="border-t border-white/8 px-5 py-14 sm:px-6 xl:px-10">
      <div className="mx-auto max-w-[1680px]">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <BpLogo />
            <p className="mt-6 max-w-lg text-base leading-8 text-white/56">
              Stay Anonymous. Stay Connected. Private by Design.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/54">
              <a href="mailto:info.burnerpoint@gmail.com" className="block transition hover:text-[#00FF9D]">
                info.burnerpoint@gmail.com
              </a>
              <a href="https://t.me/burnerpoint" target="_blank" rel="noreferrer" className="block transition hover:text-[#00FF9D]">
                https://t.me/burnerpoint
              </a>
              <a href="https://t.me/burnerpointapp" target="_blank" rel="noreferrer" className="block transition hover:text-[#00FF9D]">
                https://t.me/burnerpointapp
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {SOCIALS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/62 transition hover:border-[#00FF9D]/24 hover:text-[#00FF9D]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FooterColumn
              title="Quick Links"
              links={[
                { label: 'Pricing', href: '/pricing' },
                { label: 'Terms', href: '/terms-of-service' },
                { label: 'Privacy', href: '/privacy-policy' },
                { label: 'Support', href: '/help' },
                { label: 'API', href: '/api/docs' },
              ]}
            />
            <FooterColumn
              title="Products"
              links={PRODUCT_ITEMS.map((item) => ({ label: item.title, href: item.href }))}
            />
            <FooterColumn
              title="Account"
              links={[
                { label: 'Sign In', href: '/auth/login' },
                { label: 'Create Account', href: '/auth/signup' },
                { label: 'Dashboard', href: '/dashboard' },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-white/8 pt-6 text-sm text-white/42 sm:flex sm:items-center sm:justify-between">
          <p>© 2026 Burner Point. All rights reserved.</p>
          <div className="mt-3 flex flex-wrap gap-4 sm:mt-0">
            <Link href="/terms-of-service" className="transition hover:text-[#00FF9D]">Terms of Service</Link>
            <Link href="/privacy-policy" className="transition hover:text-[#00FF9D]">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-white/56">
        {links.map((item) => (
          <li key={`${title}-${item.label}`}>
            <Link href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroVisualFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_22%,rgba(0,255,157,0.16),transparent_26%),radial-gradient(circle_at_74%_24%,rgba(57,255,20,0.12),transparent_24%)]" />
      <div className="absolute left-[10%] top-[18%] h-[17rem] w-[8rem] rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(229,231,235,0.16),rgba(0,0,0,0.9))] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:h-[20rem] sm:w-[9rem]" />
      <div className="absolute right-[12%] top-[14%] h-[18rem] w-[8.5rem] rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(0,255,157,0.16),rgba(0,0,0,0.92))] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:h-[22rem] sm:w-[10rem]" />
      <div className="absolute left-1/2 top-1/2 h-[2px] w-[52%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(0,255,157,0.9),transparent)]" />
      <div className="absolute left-[47%] top-[45%] flex h-12 w-12 items-center justify-center rounded-full border border-[#00FF9D]/28 bg-black/58 shadow-[0_0_34px_rgba(0,255,157,0.22)]">
        <ShieldCheck className="h-5 w-5 text-[#00FF9D]" />
      </div>
      <div className="absolute left-[28%] top-[58%] flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/50">
        <MessageSquareText className="h-5 w-5 text-white/72" />
      </div>
      <div className="absolute right-[24%] top-[54%] flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/50">
        <Globe2 className="h-5 w-5 text-white/72" />
      </div>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
