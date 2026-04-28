'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LifeBuoy, MessageSquareText, ShieldCheck } from 'lucide-react';
import { MarketingFooter, MarketingHeader } from '@/components/sections/bp-marketing-shell';
import { BpButton, BpKicker } from '@/components/ui/bp-landing-primitives';
import { allFaqItems, faqCategories, supportContacts } from '@/lib/homepage-content';
import { TELEGRAM_COMMUNITY_HANDLE, TELEGRAM_SUPPORT_HANDLE } from '@/lib/support';
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

  const activeGroup = activeTab === 'all' ? allTab : faqCategories.find((item) => item.id === activeTab);

  return (
    <main className="min-h-screen bg-[#f4f7f3] text-[#07140f]">
      <MarketingHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_84%_8%,rgba(1,50,32,0.12),transparent_26%),linear-gradient(180deg,#f8fbf9,#edf5f0)]" />
          <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-[#00FF9D]/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#9FA6B2]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[92rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <BpKicker className="text-[#00A76A]">FAQ Center</BpKicker>
            <h1 className="mt-5 text-5xl font-black leading-[0.92] text-[#07140f] sm:text-6xl">
              Clear answers for private communication and connected access.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#456052]">
              Explore Burner Point questions by category. This page covers General, BP Messenger, BP Verify Hub, BP Rentals, Wallet & Payments, eSIM, Proxies, Secure Tunnel, and Account & Security.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <BpButton href="/sign-up" size="lg">
                Create account
              </BpButton>
              <Link
                href="/pricing"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-black/10 bg-white/80 px-7 text-sm font-semibold text-[#07140f] transition hover:border-[#00FF9D]/28 hover:bg-white"
              >
                View pricing
              </Link>
            </div>
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
                    ? 'border-[#00FF9D]/28 bg-[#effcf5] text-[#013220]'
                    : 'border-black/8 bg-white text-[#274437] hover:border-[#00FF9D]/28 hover:bg-[#f6fbf8]',
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
          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(2,20,12,0.06)] sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00A76A]">{activeGroup?.label}</p>
              <h2 className="mt-4 text-3xl font-black leading-[0.94] text-[#07140f] sm:text-4xl">
                {activeTab === 'all' ? 'Everything in one place.' : activeGroup?.label}
              </h2>
              <p className="mt-4 text-base leading-8 text-[#456052]">{activeGroup?.description}</p>
            </div>

            <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#07140f,#03140d)] p-6 text-white shadow-[0_26px_70px_rgba(2,20,12,0.14)] sm:p-8">
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.05] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Coverage</p>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  {activeTab === 'all'
                    ? `${allFaqItems.length} answers across the full Burner Point product stack.`
                    : `${visibleGroups[0]?.items.length || 0} answers in this category.`}
                </p>
              </div>

              <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <LifeBuoy className="mt-1 h-5 w-5 flex-none text-[#00FF9D]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Need account-specific help?</p>
                    <p className="mt-2 text-sm leading-7 text-white/68">
                      Contact support with your account email, product, timestamps, payment reference, and screenshots when applicable.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1rem] border border-[#00FF9D]/16 bg-[#00FF9D]/[0.08] p-4">
                <p className="text-sm leading-7 text-white/78">
                  Support:{' '}
                  <a href={`mailto:${supportContacts.email}`} className="text-[#00FF9D]">
                    {supportContacts.email}
                  </a>
                </p>
                <p className="mt-2 text-sm leading-7 text-white/78">
                  Telegram:{' '}
                  <a href={supportContacts.telegramPrimary} target="_blank" rel="noreferrer" className="text-[#00FF9D]">
                    {TELEGRAM_SUPPORT_HANDLE}
                  </a>{' '}
                  and{' '}
                  <a href={supportContacts.telegramApp} target="_blank" rel="noreferrer" className="text-[#00FF9D]">
                    {TELEGRAM_COMMUNITY_HANDLE}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {visibleGroups.map((group) => (
              <div key={group.id} className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_18px_48px_rgba(2,20,12,0.06)] sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#013220] text-[#00FF9D]">
                    {group.id === 'general' ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <MessageSquareText className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00A76A]">{group.label}</p>
                    <p className="mt-2 text-sm leading-7 text-[#456052]">{group.description}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <details
                      key={item.question}
                      className="rounded-[1.2rem] border border-black/6 bg-[#f8fbf9] p-4"
                    >
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[#07140f]">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-[#456052]">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#07140f,#013220_62%,#0a1d14)] p-6 text-white shadow-[0_34px_100px_rgba(3,22,14,0.18)] sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Next steps</p>
          <h2 className="mt-4 text-3xl font-black leading-[0.94] text-white sm:text-4xl">
            Ready to move from questions to setup?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            Create your Burner Point account, fund your wallet or choose a plan, then start with the product that fits your workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BpButton href="/sign-up" size="lg">
              Create account
            </BpButton>
            <Link
              href="/#products"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/12 px-5 text-sm font-semibold text-white/80 transition hover:border-[#00FF9D]/28 hover:text-white"
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
