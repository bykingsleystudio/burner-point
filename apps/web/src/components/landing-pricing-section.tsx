'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Globe2, MessageSquareText, Phone, Server, ShieldCheck, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LiquidButton, MetalButton } from '@/components/ui/liquid-glass-button';

const MODULES: Array<{
  title: string;
  price: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  eyebrow: string;
  highlights: string[];
  featured?: boolean;
}> = [
  {
    title: 'BP Verify Hub',
    price: '$0.99+ per verification',
    description: 'SMS & Voice OTP across 180+ countries.',
    href: '/dashboard/verification',
    cta: 'Run Verification',
    icon: ShieldCheck,
    eyebrow: 'Usage based',
    highlights: ['SMS and voice OTP', 'Live verification routing'],
    featured: true,
  },
  {
    title: 'BP Number Rentals',
    price: '$5.99',
    description: 'Temporary or renewable numbers with SMS + Voice support.',
    href: '/dashboard/rentals',
    cta: 'Rent Number',
    icon: Phone,
    eyebrow: 'Recurring option',
    highlights: ['Renewable numbers', 'SMS and voice ready'],
  },
  {
    title: 'BP Messenger',
    price: '$9.99/mo',
    description: 'Private messaging + dedicated US/UK/CA number.',
    href: '/dashboard/inbox',
    cta: 'Start Messaging',
    icon: MessageSquareText,
    eyebrow: 'Subscription',
    highlights: ['Private message threads', 'Voicemail and calling'],
  },
  {
    title: 'BP eSIM Store',
    price: '$4.99',
    description: 'Travel data plans in 100+ countries.',
    href: '/dashboard/esim',
    cta: 'Buy eSIM',
    icon: Smartphone,
    eyebrow: 'Travel data',
    highlights: ['QR delivery', 'Global roaming access'],
  },
  {
    title: 'BP Proxy Store',
    price: '$7.99/mo',
    description: 'Residential and datacenter routing for safer task separation.',
    href: '/dashboard/proxies',
    cta: 'View Proxies',
    icon: Server,
    eyebrow: 'Secure routing',
    highlights: ['Dedicated credentials', 'Session isolation'],
  },
  {
    title: 'BP Secure Tunnel',
    price: '$5.99/mo',
    description: 'Dedicated IP VPN powered by Burner Point secure routing.',
    href: '/dashboard/vpn',
    cta: 'Secure Access',
    icon: Globe2,
    eyebrow: 'Private tunnel',
    highlights: ['Dedicated IP access', 'Protected region switching'],
  },
];

export function LandingPricingSection() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="bp-section-shell relative scroll-mt-28 py-16 md:py-24" id="pricing" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-[1680px] px-5 sm:px-6 xl:px-10">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Pricing</p>
            <h2 id="pricing-title" className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.98] text-white md:text-6xl">
              Wallet funding for usage. Subscriptions for continuity.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/58">
              Choose the Burner Point product surface you need now, then move between wallet-funded usage and recurring privacy subscriptions without changing accounts.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((item, index) => {
            const Icon = item.icon;
            const isFeatured = item.featured || index === 0;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.22 }}
                transition={{ duration: 0.56, delay: shouldReduceMotion ? 0 : index * 0.06 }}
                className={`rounded-[1.75rem] border p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(0,255,157,0.11)] md:p-6 ${
                  isFeatured
                    ? 'border-brand-green/28 bg-[linear-gradient(180deg,rgba(0,255,157,0.1),rgba(0,0,0,0.88))]'
                    : 'border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.72),rgba(0,0,0,0.92))]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-brand-green/10">
                    <Icon className="h-6 w-6 text-brand-green" />
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/48">
                    {item.eyebrow}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 font-mono text-3xl text-brand-green">{item.price}</p>
                <p className="mt-4 text-sm leading-7 text-white/58">{item.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/54"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="mt-8">
                  {isFeatured ? (
                    <MetalButton variant="primary" className="w-full" onClick={() => router.push(item.href)}>
                      {item.cta}
                    </MetalButton>
                  ) : (
                    <LiquidButton className="w-full" onClick={() => router.push(item.href)}>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                        {item.cta}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </LiquidButton>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
