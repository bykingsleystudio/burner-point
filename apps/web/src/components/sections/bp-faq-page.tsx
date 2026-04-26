'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LifeBuoy, MessageSquareText, ShieldCheck } from 'lucide-react';
import { MarketingFooter, MarketingHeader } from '@/components/sections/bp-marketing-shell';
import { BpButton, BpKicker, BpSurface } from '@/components/ui/bp-landing-primitives';
import { allFaqItems, faqCategories, supportContacts } from '@/lib/homepage-content';
import { cn } from '@/lib/utils';

const allTab = {
  id: 'all',
  label: 'All Questions',
  description: 'Browse every Burner Point FAQ across products, account access, billing, and support.',
};

export function BurnerPointFaqPage() {
  const [activeTab, setActiveTab] = useState<string>('all');

  const visibleGroups = useMemo(() => {
    if (activeTab === 'all') return faqCategories;
    return faqCategories.filter((category) => category.id === activeTab);
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-brand-black text-white">
      <MarketingHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="bp-grid-bg absolute inset-x-0 top-0 h-[34rem] opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.14),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(57,255,20,0.08),transparent_18%)]" />
        </div>

        <div className="relative mx-auto max-w-[92rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <BpKicker>FAQ Center</BpKicker>
          <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[0.92] text-white sm:text-6xl">
            Clear answers for private communication and connected access.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/62">
            Explore Burner Point questions by category. This page covers the full landing-page support model: General, BP Messenger, BP Verify Hub, BP Rentals, Wallet & Payments, eSIM, Proxies, Secure Tunnel, and Account & Security.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <BpButton href="/auth/signup" size="lg">
              Create account
            </BpButton>
            <BpButton href="/#pricing" variant="outline" size="lg">
              View pricing
            </BpButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {[allTab, ...faqCategories].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition',
                  activeTab === item.id
                    ? 'border-[#00FF9D]/26 bg-[#00FF9D]/10 text-[#00FF9D]'
                    : 'border-white/10 bg-white/[0.03] text-white/68 hover:border-[#00FF9D]/24 hover:text-white',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <BpSurface className="p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF9D]">
              {activeTab === 'all' ? allTab.label : faqCategories.find((item) => item.id === activeTab)?.label}
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-[0.94] text-white sm:text-4xl">
              {activeTab === 'all' ? 'Everything in one place.' : faqCategories.find((item) => item.id === activeTab)?.label}
            </h2>
            <p className="mt-4 text-base leading-8 text-white/60">
              {activeTab === 'all'
                ? allTab.description
                : faqCategories.find((item) => item.id === activeTab)?.description}
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Coverage</p>
                <p className="mt-3 text-sm leading-7 text-white/64">
                  {activeTab === 'all'
                    ? `${allFaqItems.length} answers across the full Burner Point product stack.`
                    : `${visibleGroups[0]?.items.length || 0} answers in this category.`}
                </p>
              </div>

              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <LifeBuoy className="mt-1 h-5 w-5 flex-none text-[#00FF9D]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Need account-specific help?</p>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      Contact support with your account email, product, timestamps, payment reference, and screenshots when applicable.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1rem] border border-[#00FF9D]/16 bg-[#00FF9D]/[0.06] p-4">
                <p className="text-sm leading-7 text-white/68">
                  Support: <a href={`mailto:${supportContacts.email}`} className="text-[#00FF9D]">{supportContacts.email}</a>
                </p>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  Telegram: <a href={supportContacts.telegramPrimary} target="_blank" rel="noreferrer" className="text-[#00FF9D]">@burnerpoint</a> and{' '}
                  <a href={supportContacts.telegramApp} target="_blank" rel="noreferrer" className="text-[#00FF9D]">@burnerpointapp</a>
                </p>
              </div>
            </div>
          </BpSurface>

          <div className="space-y-6">
            {visibleGroups.map((group) => (
              <div key={group.id} className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.86),rgba(0,0,0,0.98))] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[#00FF9D]/18 bg-[#00FF9D]/10">
                    {group.id === 'general' ? (
                      <ShieldCheck className="h-5 w-5 text-[#00FF9D]" />
                    ) : (
                      <MessageSquareText className="h-5 w-5 text-[#00FF9D]" />
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">{group.label}</p>
                    <p className="mt-2 text-sm leading-7 text-white/56">{group.description}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <details
                      key={item.question}
                      className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4"
                    >
                      <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-white/58">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] border border-[#00FF9D]/14 bg-[linear-gradient(135deg,rgba(1,50,32,0.28),rgba(0,0,0,0.98)_72%)] p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Next steps</p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-[0.94] text-white sm:text-4xl">
            Ready to move from questions to setup?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">
            Create your Burner Point account, fund your wallet or choose a plan, then start with the product that fits your workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BpButton href="/auth/signup" size="lg">
              Create account
            </BpButton>
            <Link
              href="/#products"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-semibold text-white/76 transition hover:border-[#00FF9D]/24 hover:text-white"
            >
              Explore products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
