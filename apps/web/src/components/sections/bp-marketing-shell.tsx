'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTelegram, FaTiktok, FaYoutube } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { BpButton } from '@/components/ui/bp-landing-primitives';
import { cn } from '@/lib/utils';
import { headerLinks, productLinks, socialProfiles, supportContacts } from '@/lib/homepage-content';

const socialIconMap = {
  Instagram: FaInstagram,
  Facebook: FaFacebook,
  LinkedIn: FaLinkedin,
  TikTok: FaTiktok,
  'Twitter/X': FaXTwitter,
  Telegram: FaTelegram,
  YouTube: FaYoutube,
} as const;

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopProductsOpen, setDesktopProductsOpen] = useState(false);
  const fullMobileLinks = useMemo(
    () => [
      ...headerLinks,
      ...productLinks.map((item) => ({ label: item.name, href: item.href })),
    ],
    [],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(1,9,5,0.72)] backdrop-blur-2xl">
      <div className="mx-auto flex min-h-20 max-w-[92rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
          <Image src="/assets/logo-mark.svg" alt="" width={40} height={40} className="h-10 w-10" priority />
          <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={184} height={28} className="h-6 w-auto" />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
          <div
            className="relative"
            onMouseEnter={() => setDesktopProductsOpen(true)}
            onMouseLeave={() => setDesktopProductsOpen(false)}
          >
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/68 transition hover:bg-white/[0.04] hover:text-white"
              onClick={() => setDesktopProductsOpen((value) => !value)}
            >
              Products
              <ChevronDown className={cn('h-4 w-4 transition', desktopProductsOpen ? 'rotate-180' : '')} />
            </button>
            {desktopProductsOpen ? (
              <div className="absolute left-0 top-full mt-3 w-[28rem] rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,20,15,0.98),rgba(0,0,0,0.98))] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.5)]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {productLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-[#00FF9D]/28 hover:bg-[#00FF9D]/[0.05]"
                    >
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="mt-2 text-sm leading-6 text-white/52">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {headerLinks.filter((item) => item.label !== 'Products').map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-white/68 transition hover:bg-white/[0.04] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white/80 transition hover:border-[#00FF9D]/24 hover:text-white"
          >
            Sign In
          </Link>
          <BpButton href="/auth/signup" size="md" className="px-5">
            Get Started
          </BpButton>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white transition hover:border-[#00FF9D]/28 lg:hidden"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/8 bg-[rgba(1,9,5,0.96)] lg:hidden">
          <div className="mx-auto max-w-[92rem] space-y-6 px-4 py-5 sm:px-6">
            <div className="grid gap-2">
              {fullMobileLinks.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#00FF9D]/24 hover:bg-[#00FF9D]/[0.05]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Support</p>
              <div className="mt-3 space-y-2 text-sm text-white/68">
                <a href={`mailto:${supportContacts.email}`} className="block transition hover:text-white">
                  {supportContacts.email}
                </a>
                <a href={supportContacts.telegramPrimary} target="_blank" rel="noreferrer" className="block transition hover:text-white">
                  Telegram support
                </a>
                <a href={supportContacts.telegramApp} target="_blank" rel="noreferrer" className="block transition hover:text-white">
                  Telegram community
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {socialProfiles.map((item) => {
                const Icon = socialIconMap[item.label as keyof typeof socialIconMap];
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-[#00FF9D]/28 hover:text-[#00FF9D]"
                    aria-label={item.label}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                  </a>
                );
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#00FF9D] text-sm font-semibold text-black"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer id="support" className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.42))]">
      <div className="mx-auto max-w-[92rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 xl:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
              <Image src="/assets/logo-mark.svg" alt="" width={40} height={40} className="h-10 w-10" />
              <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={184} height={28} className="h-6 w-auto" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/56">
              Stay Anonymous. Stay Connected. Private by Design.
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/48">
              Private numbers, OTP tools, rentals, eSIM, proxies, and secure connectivity from one account.
            </p>
          </div>

          <FooterGroup
            title="Products"
            links={productLinks.map((item) => ({ label: item.name, href: item.href }))}
          />
          <FooterGroup
            title="Company"
            links={[
              { label: 'About', href: '/about' },
              { label: 'Blog', href: '/blog' },
              { label: 'Pricing', href: '/#pricing' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Support', href: '/#support' },
            ]}
          />
          <FooterGroup
            title="Legal"
            links={[
              { label: 'Terms of Service', href: '/terms-of-service' },
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Acceptable Use Policy', href: '/terms-of-service' },
              { label: 'Refund Policy', href: '/terms-of-service' },
              { label: 'Cookie Policy', href: '/privacy-policy' },
            ]}
          />

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00FF9D]">Support</p>
            <div className="mt-4 space-y-3 text-sm text-white/60">
              <a href={`mailto:${supportContacts.email}`} className="block transition hover:text-white">
                {supportContacts.email}
              </a>
              <a href={supportContacts.telegramPrimary} target="_blank" rel="noreferrer" className="block transition hover:text-white">
                Telegram: @burnerpoint
              </a>
              <a href={supportContacts.telegramApp} target="_blank" rel="noreferrer" className="block transition hover:text-white">
                Telegram: @burnerpointapp
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {socialProfiles.map((item) => {
                const Icon = socialIconMap[item.label as keyof typeof socialIconMap];
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/68 transition hover:border-[#00FF9D]/24 hover:text-[#00FF9D]"
                    aria-label={item.label}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-6 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
          <p>Private numbers • OTP tools • Rentals • eSIM • Proxies • VPN</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 text-white/60 transition hover:text-white">
            Create account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00FF9D]">{title}</p>
      <div className="mt-4 space-y-3">
        {links.map((item) => (
          <Link key={`${title}-${item.label}`} href={item.href} className="block text-sm text-white/56 transition hover:text-white">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
