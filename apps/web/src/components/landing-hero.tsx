'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, MessageSquare, Phone, ShieldCheck, Voicemail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, LiquidButton } from '@/components/ui/liquid-glass-button';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';

type HeroStat = [string, string];
type QuickAction = { href: string; label: string };

const DEFAULT_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

export function LandingHero({
  heroProof,
  quickActions,
}: {
  heroProof: HeroStat[];
  quickActions: QuickAction[];
}) {
  const router = useRouter();
  const scene = process.env.NEXT_PUBLIC_BP_SPLINE_SCENE || DEFAULT_SCENE;

  return (
    <section id="top" className="relative scroll-mt-28 overflow-hidden border-b border-white/6" aria-labelledby="home-hero-title">
      <div className="bp-hero-fx" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(57,255,20,0.1),transparent_26%),radial-gradient(circle_at_76%_22%,rgba(0,255,157,0.12),transparent_28%),linear-gradient(180deg,rgba(1,50,32,0.2),rgba(0,0,0,0.82))]" />
        <Spotlight className="-top-32 left-1/2 max-w-none -translate-x-1/2" fill="#00FF9D" />
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <SplineScene scene={scene} className="h-full w-full opacity-90" />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1680px] gap-8 px-5 py-8 sm:px-6 md:gap-12 md:pb-20 md:pt-20 lg:grid-cols-12 lg:items-center xl:px-10 2xl:gap-16 2xl:pb-28 2xl:pt-24">
        <div className="bp-reveal lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-brand-green">Private telecom access</p>
          <h1
            id="home-hero-title"
            className="mt-4 max-w-5xl text-[2.3rem] font-black leading-[0.95] tracking-tight text-white min-[360px]:text-[2.6rem] min-[390px]:text-[2.8rem] min-[430px]:text-[3rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
          >
            <span className="block">Don&apos;t Want To Give Out</span>
            <span className="block">Your Phone Number?</span>
            <span className="mt-2 block text-brand-green sm:mt-3">No Problem.</span>
            <span className="block text-white">Use Ours.</span>
          </h1>

          <div className="mt-6 max-w-4xl space-y-4">
            <p className="text-[17px] font-medium leading-7 tracking-normal text-white md:text-xl md:leading-8">
              <span className="block sm:inline">Stay Anonymous. Stay Connected. </span>
              <span className="text-brand-green">Private By Design.</span>
            </p>
            <p className="max-w-[21rem] text-base leading-7 text-white/70 md:max-w-3xl md:text-xl md:leading-9">
              Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <LiquidButton className="w-full sm:w-auto" onClick={() => router.push('/auth/signup')}>
              <span className="inline-flex min-h-[54px] items-center px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-black">
                Get Started
                <ArrowRight className="ml-3 h-4 w-4" />
              </span>
            </LiquidButton>
            <Button asChild variant="outline" className="min-h-[54px] rounded-full border-white/14 bg-black/24 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white hover:border-brand-green/35 hover:bg-brand-green/[0.06] hover:text-white">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[54px] rounded-full border-white/14 bg-black/24 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white hover:border-brand-green/35 hover:bg-brand-green/[0.06] hover:text-white">
              <Link href="/overview">Learn More</Link>
            </Button>
          </div>

          <p className="mt-6 max-w-[21rem] font-mono text-[11px] font-semibold uppercase leading-5 tracking-[0.16em] text-brand-green md:max-w-3xl md:text-sm md:leading-6">
            Receive SMS, Voice, and OTP verifications from 900+ platforms worldwide.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4" role="list" aria-label="Burner Point trust proof points">
            {heroProof.map(([value, label]) => (
              <div key={label} role="listitem" className="rounded-[1.15rem] border border-white/8 bg-black/28 px-4 py-4 backdrop-blur-sm md:px-5">
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
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-black/24 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/68 transition hover:-translate-y-0.5 hover:border-brand-green/35 hover:text-brand-green sm:px-5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="bp-reveal-delay lg:col-span-5">
          <div className="rounded-[2rem] border border-brand-green/18 bg-[linear-gradient(160deg,rgba(1,50,32,0.92),rgba(0,0,0,0.96)_55%)] p-4 shadow-[0_0_80px_rgba(0,255,157,0.11)] backdrop-blur-xl md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/25 bg-brand-green/10">
                  <img src="/assets/logo-mark.svg" alt="" className="h-7 w-7" />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Burner Point Live</p>
                  <p className="text-sm text-white/50">Private telecom control surface</p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-green">
                No personal exposure
              </span>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/8 bg-black/32 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase text-white/40">Selected Number</p>
                  <p className="mt-2 font-mono text-3xl text-brand-green">+1 415 555 0182</p>
                </div>
                <div className="rounded-[1.1rem] border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-right">
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
                    <div key={label as string} className="rounded-[1.1rem] border border-white/8 bg-black/24 p-4">
                      <AppIcon className="h-5 w-5 text-brand-green" />
                      <p className="mt-3 text-sm font-semibold text-white">{label as string}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3">
                <div className="max-w-[88%] rounded-[1.1rem] border border-white/8 bg-black/36 px-4 py-3 text-sm text-white/78">
                  Your marketplace login code is <span className="font-mono text-brand-green">847291</span>.
                </div>
                <div className="ml-auto max-w-[82%] rounded-[1.1rem] border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-sm text-white/88">
                  Protected. Routed through Burner Point.
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['Real mobile numbers', 'No logs policy', 'GDPR aligned'].map((item) => (
                <div key={item} className="rounded-[1.1rem] border border-white/8 bg-white/[0.025] p-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/56">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-brand-green" />
                <div>
                  <p className="text-sm font-semibold text-white">3D hero scene ready for custom Burner Point art</p>
                  <p className="mt-2 text-sm leading-6 text-white/52">
                    The hero uses a dedicated Spline backdrop and can switch to a branded `.splinecode` scene instantly through <code className="font-mono text-brand-green">NEXT_PUBLIC_BP_SPLINE_SCENE</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
