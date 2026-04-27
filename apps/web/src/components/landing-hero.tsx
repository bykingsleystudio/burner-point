'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  MessageSquare,
  Phone,
  ShieldCheck,
  Smartphone,
  TowerControl,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { LiquidButton, MetalButton } from '@/components/ui/liquid-glass-button';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';

type HeroStat = [string, string];
type QuickAction = { href: string; label: string };

const DEFAULT_SCENE = 'https://prod.spline.design/X-LH7Bs0Cb5fYkPA/scene.splinecode';

const telecomSignals: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: 'Private relay',
    text: 'Move messages and verification traffic through Burner Point instead of your personal line.',
    icon: TowerControl,
  },
  {
    title: 'Two-phone routing',
    text: 'Keep communication, recovery, and marketplace activity split across purpose-built numbers.',
    icon: Smartphone,
  },
  {
    title: 'WiFi and data ready',
    text: 'Voice, SMS, voicemail, and secure media stay reachable across browser and app surfaces.',
    icon: Wifi,
  },
];

const rightRailCards: Array<{ eyebrow: string; title: string; text: string; align?: 'left' | 'right' }> = [
  {
    eyebrow: 'Private number',
    title: '+1 415 555 0182',
    text: 'Marketplace verification and callback traffic stay attached to a Burner Point line.',
    align: 'left',
  },
  {
    eyebrow: 'Travel line',
    title: '+44 20 7946 0314',
    text: 'Use a separate number for travel, listings, sales, or recovery without crossing identities.',
    align: 'right',
  },
];

const routingSignals = [
  { label: 'Active lines', value: '06' },
  { label: 'OTP success', value: '99.2%' },
  { label: 'Regions live', value: '180+' },
] as const;

export function LandingHero({
  heroProof,
  quickActions,
}: {
  heroProof: HeroStat[];
  quickActions: QuickAction[];
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const scene = process.env.NEXT_PUBLIC_BP_SPLINE_SCENE || DEFAULT_SCENE;

  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  } as const;

  return (
    <section id="top" className="relative scroll-mt-28 overflow-hidden border-b border-white/6" aria-labelledby="home-hero-title">
      <div className="bp-hero-fx" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(0,255,157,0.14),transparent_24%),radial-gradient(circle_at_78%_10%,rgba(57,255,20,0.08),transparent_18%),linear-gradient(180deg,rgba(1,50,32,0.38),rgba(0,0,0,0.9))]" />
        <Spotlight className="-top-32 left-1/2 max-w-none -translate-x-1/2" fill="#00FF9D" />
        <Spotlight className="right-[-12rem] top-24 hidden lg:block" fill="#39FF14" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1680px] gap-10 px-5 py-10 sm:px-6 md:gap-12 md:pb-20 md:pt-20 lg:grid-cols-12 lg:items-center xl:px-10 2xl:gap-16 2xl:pb-28 2xl:pt-24">
        <motion.div {...fadeUp} className="lg:col-span-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand-green">Private telecom access</p>
          <h1
            id="home-hero-title"
            className="mt-4 max-w-5xl text-[2.5rem] font-black leading-[0.92] tracking-tight text-white min-[390px]:text-[2.9rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[6.8rem]"
          >
            <span className="block">Don&apos;t Want To Give</span>
            <span className="block">Out Your Phone Number?</span>
            <span className="mt-2 block text-brand-green">No Problem.</span>
            <span className="block text-white">Use Ours.</span>
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/74 md:text-xl md:leading-9">
            Stay Anonymous. Stay Connected. <span className="text-brand-green">Private By Design.</span>
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/58 md:text-lg">
            Generate secure, non-VoIP numbers instantly and keep messages, voice, rentals, eSIM, and protected routing inside one calmer Burner Point surface.
          </p>

          <div className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Spotlight className="-top-24 left-10" fill="#00FF9D" />
            <MetalButton variant="primary" onClick={() => router.push('/sign-up')}>
              <span className="inline-flex items-center gap-2 px-1">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </span>
            </MetalButton>
            <LiquidButton className="w-full sm:w-auto" onClick={() => router.push('/pricing')}>
              <span className="inline-flex min-h-[54px] items-center px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                View Pricing
              </span>
            </LiquidButton>
            <Link
              href="/sign-in"
              className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-white/14 bg-black/20 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:border-brand-green/35 hover:bg-brand-green/[0.05]"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {quickActions.slice(0, 4).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-full bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/66 transition hover:bg-white/[0.06] hover:text-brand-green"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <p className="mt-8 font-mono text-[11px] font-semibold uppercase leading-5 tracking-[0.18em] text-brand-green md:text-sm md:leading-6">
            Receive SMS, voice, and OTP verifications from 900+ platforms worldwide.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4" role="list" aria-label="Burner Point trust proof points">
            {heroProof.map(([value, label], index) => (
              <motion.div
                key={label}
                role="listitem"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: shouldReduceMotion ? 0 : 0.12 + index * 0.08 }}
                className="rounded-[1.3rem] border border-white/8 bg-white/[0.025] px-4 py-4 backdrop-blur-sm md:px-5"
              >
                <div className="font-mono text-2xl font-semibold text-white md:text-4xl">{value}</div>
                <div className="mt-1 font-mono text-[10px] font-semibold uppercase text-white/46">{label}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {telecomSignals.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.56, delay: shouldReduceMotion ? 0 : 0.28 + index * 0.08 }}
                  className="rounded-[1.45rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4"
                >
                  <Icon className="h-5 w-5 text-brand-green" />
                  <h2 className="mt-3 text-sm font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/54">{item.text}</p>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.78, delay: shouldReduceMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6"
        >
          <div className="relative isolate min-h-[540px] overflow-hidden rounded-[2.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(4,18,12,0.94),rgba(0,0,0,0.98))] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] md:p-6">
            <div className="absolute inset-0">
              <SplineScene scene={scene} className="h-full w-full opacity-[0.38]" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,255,157,0.14),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(57,255,20,0.08),transparent_16%),linear-gradient(180deg,rgba(2,10,6,0.1),rgba(0,0,0,0.72))]" />

            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 12 }).map((_, index) => (
                <span
                  key={`hero-particle-${index}`}
                  className="absolute rounded-full bg-brand-green shadow-[0_0_18px_rgba(0,255,157,0.55)]"
                  style={{
                    width: `${index % 3 === 0 ? 8 : 4}px`,
                    height: `${index % 3 === 0 ? 8 : 4}px`,
                    left: `${8 + ((index * 7.5) % 78)}%`,
                    top: `${10 + ((index * 9.25) % 72)}%`,
                    opacity: 0.15 + (index % 4) * 0.12,
                    animation: `bp-orbit-drift ${6 + index * 0.6}s ease-in-out ${index * 0.2}s infinite`,
                  }}
                />
              ))}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 720 620" fill="none" aria-hidden="true">
                <path d="M176 214C244 168 312 168 360 240C404 304 468 314 544 260" stroke="rgba(0,255,157,0.45)" strokeWidth="2.5" strokeDasharray="8 10" />
                <path d="M184 382C252 420 328 420 384 364C442 306 506 292 560 326" stroke="rgba(57,255,20,0.38)" strokeWidth="2.5" strokeDasharray="10 12" />
                <circle cx="182" cy="214" r="11" fill="rgba(0,255,157,0.22)" stroke="rgba(0,255,157,0.75)" />
                <circle cx="540" cy="260" r="11" fill="rgba(0,255,157,0.22)" stroke="rgba(0,255,157,0.75)" />
                <circle cx="184" cy="382" r="11" fill="rgba(57,255,20,0.18)" stroke="rgba(57,255,20,0.7)" />
                <circle cx="560" cy="326" r="11" fill="rgba(57,255,20,0.18)" stroke="rgba(57,255,20,0.7)" />
              </svg>
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-full border border-brand-green/18 bg-brand-green/[0.08] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">
                  Telecom mesh active
                </div>
                <div className="rounded-full bg-white/[0.04] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/58">
                  Two-way private routing
                </div>
              </div>

              <div className="relative mt-8 flex-1">
                <div className="grid gap-6 md:grid-cols-2">
                  {rightRailCards.map((item, index) => (
                    <motion.article
                      key={item.title}
                      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : item.align === 'right' ? 18 : -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : 0.28 + index * 0.12 }}
                      className="rounded-[1.6rem] border border-white/8 bg-[rgba(255,255,255,0.04)] p-5 backdrop-blur-xl"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">{item.eyebrow}</p>
                      <h2 className="mt-4 font-mono text-2xl text-white">{item.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-white/58">{item.text}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-white/52">
                        <Phone className="h-4 w-4 text-brand-green" />
                        Voice, SMS, OTP, and recovery routing
                      </div>
                    </motion.article>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    [ShieldCheck, 'OTP visibility'],
                    [MessageSquare, 'Message relay'],
                    [Wifi, 'WiFi & data'],
                  ].map(([Icon, label], index) => {
                    const SignalIcon = Icon as LucideIcon;
                    return (
                      <motion.div
                        key={label as string}
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.44 + index * 0.08 }}
                        className="rounded-full bg-black/36 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/72 backdrop-blur-md"
                      >
                        <div className="mb-2 flex justify-center">
                          <SignalIcon className="h-4 w-4 text-brand-green" />
                        </div>
                        {label as string}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-brand-green/14 bg-brand-green/[0.05] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Private telecom stack</p>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-white/60">
                      Burner Point keeps messaging, verification, rentals, travel data, and secure routing in one coordinated telecom layer instead of scattering them across unrelated tools.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:min-w-[18rem]">
                    {routingSignals.map((signal) => (
                      <div key={signal.label} className="rounded-[1.15rem] border border-white/8 bg-black/24 px-3 py-3 text-center">
                        <div className="font-mono text-sm text-brand-green">{signal.value}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/46">{signal.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
