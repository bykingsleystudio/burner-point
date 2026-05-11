'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTelegram, FaTiktok, FaYoutube } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { BpButton } from '@/components/ui/bp-landing-primitives';
import { headerLinks, productLinks, socialProfiles, supportContacts } from '@/lib/homepage-content';
import { TELEGRAM_COMMUNITY_HANDLE, TELEGRAM_SUPPORT_HANDLE } from '@/lib/support';
import { cn } from '@/lib/utils';

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
  const productMenuLinks = productLinks.map((item) => ({
    label: item.name.replace(/^BP\s+/, ''),
    href: item.href,
  }));
  const mobileGroups = [
    { title: 'Products', links: productMenuLinks },
    {
      title: 'Company',
      links: [
        { label: 'Pricing', href: '/pricing' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Blog', href: '/blog' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help / Support', href: '/support' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ];
  const legalLinks = [
    { label: 'Terms', href: '/terms-of-service' },
    { label: 'Privacy', href: '/privacy-policy' },
    { label: 'Acceptable Use', href: '/acceptable-use-policy' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/6 bg-white/86 backdrop-blur-2xl dark:border-white/8 dark:bg-[#06120d]/88">
      <div className="mx-auto flex min-h-20 max-w-[92rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
          <Image src="/assets/logo-mark.svg" alt="" width={34} height={34} className="h-8 w-8 flex-none sm:h-9 sm:w-9" priority />
          <span className="flex items-center rounded-full bg-[#020806]/[0.03] px-3 py-2 dark:bg-white/[0.04]">
            <Image src="/assets/wordmark-black.svg" alt="Burner Point" width={166} height={26} className="h-[1.05rem] w-auto dark:hidden sm:h-[1.15rem]" />
            <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={166} height={26} className="hidden h-[1.05rem] w-auto dark:block sm:h-[1.15rem]" />
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <div
            className="relative"
            onMouseEnter={() => setDesktopProductsOpen(true)}
            onMouseLeave={() => setDesktopProductsOpen(false)}
          >
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#10261c] transition hover:bg-[#eaf8f1] dark:text-white/78 dark:hover:bg-white/[0.06]"
              onClick={() => setDesktopProductsOpen((value) => !value)}
            >
              Products
              <ChevronDown className={cn('h-4 w-4 transition', desktopProductsOpen ? 'rotate-180' : '')} />
            </button>
            {desktopProductsOpen ? (
              <div className="absolute left-0 top-full mt-3 w-[30rem] rounded-[1.75rem] border border-black/8 bg-white p-4 shadow-[0_32px_90px_rgba(3,28,18,0.16)] dark:border-white/10 dark:bg-[#07140f]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {productLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="rounded-[1.25rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff,#f3faf6)] p-4 transition hover:-translate-y-0.5 hover:border-[#00FF9D]/32 hover:shadow-[0_14px_40px_rgba(0,255,157,0.12)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#0b1c14,#07140f)]"
                    >
                      <p className="text-sm font-semibold text-[#07140f] dark:text-white">{item.name}</p>
                      <p className="mt-2 text-sm leading-6 text-[#365447] dark:text-white/72">{item.description}</p>
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
              className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-[#10261c] transition hover:bg-[#eaf8f1] dark:text-white/78 dark:hover:bg-white/[0.06]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/sign-in"
            className="inline-flex min-h-12 min-w-[8.75rem] items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-[#07140f] shadow-[0_8px_24px_rgba(2,20,12,0.05)] transition hover:-translate-y-0.5 hover:border-[#00FF9D]/30 hover:bg-[#effcf5] dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
          >
            Sign In
          </Link>
          <BpButton href="/sign-up" size="md" className="min-w-[9.5rem] px-5 shadow-[0_18px_36px_rgba(0,255,157,0.18)]">
            Get Started
          </BpButton>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 items-center rounded-full bg-[#07140f] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(2,20,12,0.16)] transition hover:-translate-y-0.5 hover:bg-[#013220] dark:bg-[#00FF9D] dark:text-black"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#07140f] transition hover:border-[#00FF9D]/28 dark:border-white/12 dark:bg-white/[0.04] dark:text-white"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-black/6 bg-white dark:border-white/8 dark:bg-[#06120d] lg:hidden">
          <div className="mx-auto max-w-[92rem] space-y-4 px-4 py-5 sm:px-6">
            {mobileGroups.map((group) => (
              <section key={group.title} className="rounded-[1.25rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff,#f6fbf8)] p-3 dark:border-white/10 dark:bg-[linear-gradient(180deg,#0b1c14,#07140f)]">
                <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#008f5c]">{group.title}</p>
                <div className="grid gap-1.5">
                  {group.links.map((item) => (
                    <Link
                      key={`${group.title}-${item.label}`}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center justify-between rounded-[0.9rem] px-3 text-sm font-semibold text-[#07140f] transition hover:bg-[#eaf8f1] dark:text-white dark:hover:bg-white/[0.06]"
                    >
                      {item.label}
                      <ArrowRight className="h-3.5 w-3.5 text-[#008f5c]" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            <details className="rounded-[1.25rem] border border-black/6 bg-[#f7fbf8] p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#008f5c]">
                Legal
                <ChevronDown className="h-4 w-4" />
              </summary>
              <div className="mt-1 grid gap-1.5">
                {legalLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-[0.9rem] px-3 text-sm font-semibold text-[#07140f] transition hover:bg-white dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>

            <div className="flex flex-wrap justify-center gap-2">
              {socialProfiles.map((item) => {
                const Icon = socialIconMap[item.label as keyof typeof socialIconMap];

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-[#f7fbf8] text-[#153126] transition hover:border-[#00FF9D]/28 hover:text-[#00A76A] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72 dark:hover:text-[#00FF9D]"
                    aria-label={item.label}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                  </a>
                );
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/10 text-sm font-semibold text-[#07140f] dark:border-white/12 dark:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
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
    <footer
      id="support"
      className="relative overflow-hidden border-t border-white/8 bg-[linear-gradient(180deg,#04110b,#07140f_52%,#000000)] text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.16),transparent_22%),radial-gradient(circle_at_82%_8%,rgba(159,166,178,0.16),transparent_18%)]" />
      </div>

      <div className="relative mx-auto max-w-[92rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1.08fr)_repeat(4,minmax(0,1fr))] 2xl:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,1fr))]">
          <div className="min-w-0 max-w-sm xl:pr-4">
            <Link href="/" className="inline-flex max-w-full items-center gap-2.5" aria-label="Burner Point home">
              <Image src="/assets/logo-mark.svg" alt="" width={34} height={34} className="h-8 w-8 sm:h-9 sm:w-9" />
              <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={166} height={26} className="h-[1.15rem] max-w-full w-auto sm:h-5" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/74">
              Stay Anonymous. Stay Connected. Private by Design.
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/78">
              Private numbers, codes, rentals, eSIM, proxies, and secure access from one account.
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
              { label: 'Pricing', href: '/pricing' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Support', href: '/support' },
              { label: 'Contact', href: '/contact' },
            ]}
          />
          <FooterGroup
            title="Legal"
            links={[
              { label: 'Terms of Service', href: '/terms-of-service' },
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Acceptable Use Policy', href: '/acceptable-use-policy' },
              { label: 'Refund Policy', href: '/refund-policy' },
              { label: 'Cookie Policy', href: '/cookie-policy' },
            ]}
          />

          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00FF9D]">Support</p>
            <div className="mt-4 space-y-3 text-sm text-white/78">
              <a href={`mailto:${supportContacts.email}`} className="block transition hover:text-white">
                {supportContacts.email}
              </a>
              <a href={supportContacts.telegramPrimary} target="_blank" rel="noreferrer" className="block transition hover:text-white">
                Telegram: {TELEGRAM_SUPPORT_HANDLE}
              </a>
              <a href={supportContacts.telegramApp} target="_blank" rel="noreferrer" className="block transition hover:text-white">
                Telegram: {TELEGRAM_COMMUNITY_HANDLE}
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
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/78 transition hover:border-[#00FF9D]/24 hover:text-[#00FF9D]"
                    aria-label={item.label}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-6 text-sm text-white/78 md:flex-row md:items-center md:justify-between">
          <p>Private numbers &bull; Codes &bull; Rentals &bull; eSIM &bull; Proxies &bull; Secure access</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 text-white/82 transition hover:text-white">
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
    <div className="min-w-0">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00FF9D]">{title}</p>
      <div className="mt-4 space-y-3">
        {links.map((item) => (
          <Link key={`${title}-${item.label}`} href={item.href} className="block text-sm text-white/78 transition hover:text-white">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}


