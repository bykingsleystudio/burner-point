import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  MessageSquareText,
  Phone,
  Route,
  Server,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MarketingFooter, MarketingHeader } from '@/components/sections/bp-marketing-shell';
import { BpButton, BpKicker } from '@/components/ui/bp-landing-primitives';
import {
  faqPreviewItems,
  heroTrustItems,
  howItWorksSteps,
  pricingCards,
  productLinks,
  productSections,
  productStripCards,
  safetyFeatures,
} from '@/lib/homepage-content';

const productIcons = [MessageSquareText, ShieldCheck, Phone, Smartphone, Server, Route] as const;

const trustedChips = [
  'Private number layer',
  'SMS & voice codes',
  'Renewable rentals',
  'Travel eSIM',
  'Proxy plans',
  'Secure access',
] as const;

const accountSignals = [
  { label: 'Wallet', value: '$25.00', meta: 'USD balance ready' },
  { label: 'Number', value: '+1 United States', meta: 'Active private line' },
  { label: 'Code', value: '482901', meta: 'Ready to copy' },
  { label: 'Access', value: 'Protected', meta: 'Secure connection' },
] as const;

export function BurnerPointHomepage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f4] text-[#07140f] dark:bg-[#06120d] dark:text-white">
      <MarketingHeader />
      <HeroSection />
      <ProductStripSection />
      <ProductShowcaseSection />
      <HowItWorksSection />
      <TrustSafetySection />
      <PricingSection />
      <FaqPreviewSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#06120d] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(0,255,157,0.24),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(57,255,20,0.14),transparent_24%),linear-gradient(135deg,#000000,#07140f_50%,#013220)]" />
        <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-[#00FF9D]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[92rem] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <BpKicker>Private telecom platform</BpKicker>
          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-6xl lg:text-7xl xl:text-[5.7rem]">
            Private by Design.
            <span className="mt-2 block bg-[linear-gradient(105deg,#00FF9D,#E5E7EB_48%,#39FF14)] bg-clip-text text-transparent">
              Stay Anonymous. Stay Connected.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Don&apos;t want to give out your real phone number? No problem. Use Burner Point for private numbers,
            messaging, verification codes, rentals, travel data, proxies, and secure access from one account.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BpButton href="/sign-up" size="lg">
              Get Started
            </BpButton>
            <BpButton href="/pricing" size="lg" variant="outline">
              View Pricing
            </BpButton>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {heroTrustItems.slice(0, 3).map((item) => (
              <span
                key={item}
                className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.045] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/70"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[30rem] items-center lg:justify-end">
          <div className="w-full max-w-[42rem] rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_44px_120px_rgba(0,0,0,.48)] backdrop-blur-2xl">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {trustedChips.slice(0, 3).map((item) => (
                <div key={item} className="rounded-[1.2rem] border border-white/10 bg-[#020806]/18 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                  {item}
                </div>
              ))}
            </div>
            <DashboardGlass />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardGlass() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#07140f] p-4 text-white sm:p-5">
      <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">Burner Point</p>
          <p className="mt-1 text-sm text-white/68">One account for privacy tools.</p>
        </div>
        <span className="rounded-full bg-[#00FF9D] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
          Live
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {accountSignals.map((item) => (
          <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-[#020806]/24 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/70">{item.label}</p>
            <p className="mt-2 text-xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs text-white/72">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-[#00FF9D]/20 bg-[#00FF9D]/[0.07] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#00FF9D]/12">
            <ShieldCheck className="h-4 w-4 text-[#00FF9D]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Secure access active</p>
            <p className="mt-1 text-sm leading-6 text-white/72">
              Numbers, codes, travel data, proxies, and support stay easy to manage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductStripSection() {
  return (
    <SectionShell id="products" className="pt-12">
      <SectionHeading
        kicker="What you can do"
        title="One account for private communication and access."
        body="Call, text, receive supported codes, rent numbers, buy travel data, choose proxy plans, and protect your connection."
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {productStripCards.map((item, index) => {
          const Icon = productIcons[index];
          const href = productLinks[index]?.href;
          return (
            <FeatureTile key={item.title} icon={Icon} title={item.title} text={item.description} href={href} />
          );
        })}
      </div>
    </SectionShell>
  );
}

function ProductShowcaseSection() {
  return (
    <SectionShell>
      <SectionHeading
        kicker="Products"
        title="Choose the privacy tool you need."
        body="Every Burner Point product has a clear purpose and a direct path to get started."
        align="center"
      />

      <div className="mt-10 space-y-5">
        {productSections.map((section, index) => (
          <article
            key={section.id}
            id={section.id}
            className="grid overflow-hidden rounded-[2.25rem] border border-black/6 bg-white shadow-[0_24px_90px_rgba(2,20,12,0.08)] dark:border-white/10 dark:bg-[#07140f] lg:grid-cols-[1.02fr_0.98fr]"
          >
            <div className={`p-6 sm:p-8 lg:p-10 ${index % 2 ? 'lg:order-2' : ''}`}>
              <BpKicker className="text-[#008f5c]">{section.eyebrow}</BpKicker>
              <h3 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-[#07140f] dark:text-white sm:text-5xl">
                {section.title}
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#2f4d40] dark:text-white/76">{section.description}</p>
              {section.note ? (
                <p className="mt-5 rounded-[1.2rem] border border-[#00FF9D]/24 bg-[#effcf5] px-4 py-3 text-sm leading-7 text-[#274437]">
                  {section.note}
                </p>
              ) : null}
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {section.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 rounded-[1rem] bg-[#f5faf7] px-4 py-3 text-sm leading-6 text-[#274437] dark:bg-white/[0.06] dark:text-white/78">
                    <Check className="mt-1 h-4 w-4 flex-none text-[#008f5c]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <BpButton href={section.href} size="md">
                  {section.cta}
                </BpButton>
                <Link
                  href="/faq"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-[#07140f] transition hover:border-[#00FF9D]/28 dark:border-white/12 dark:bg-white/[0.04] dark:text-white"
                >
                  View FAQ
                </Link>
              </div>
            </div>
            <ProductVisual sectionIndex={index} />
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function ProductVisual({ sectionIndex }: { sectionIndex: number }) {
  const states = [
    ['Active line', '+1 United States'],
    ['Code status', 'Received'],
    ['Rental mode', 'Renewable'],
    ['eSIM plan', 'USA 5GB'],
    ['Proxy plan', 'Residential'],
    ['Tunnel', 'Dedicated IP'],
  ];
  const [label, value] = states[sectionIndex] ?? states[0];

  return (
    <div className={`relative min-h-[28rem] bg-[linear-gradient(135deg,#07140f,#013220_62%,#000000)] p-6 text-white sm:p-8 ${sectionIndex % 2 ? 'lg:order-1' : ''}`}>
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(0,255,157,.5)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">{label}</p>
          <p className="mt-4 text-4xl font-black tracking-[-0.04em]">{value}</p>
          <p className="mt-3 text-sm leading-6 text-white/72">
            Managed from one account with clear status, pricing, and support paths.
          </p>
        </div>

        <div className="grid gap-3">
          {['Choose product', 'Confirm availability', 'Start using it'].map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-[#020806]/28 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FF9D]/12 font-mono text-xs font-black text-[#00FF9D]">
                {index + 1}
              </span>
              <span className="text-sm text-white/72">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works">
      <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
        <DarkPanel>
          <BpKicker>How it works</BpKicker>
          <h2 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
            Get started in minutes.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/68">
            Create an account, choose a product, and manage your private tools from one place.
          </p>
        </DarkPanel>
        <div className="grid gap-4 sm:grid-cols-2">
          {howItWorksSteps.map((item) => (
            <LightPanel key={item.step}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#008f5c]">{item.step}</p>
              <h3 className="mt-4 text-xl font-black tracking-[-0.02em] text-[#07140f] dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#2f4d40] dark:text-white/76">{item.description}</p>
            </LightPanel>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function PricingSection() {
  return (
    <SectionShell id="pricing">
      <SectionHeading
        kicker="Pricing"
        title="Simple pricing. Built for control."
        body="Usage-based products run through a USD wallet. Recurring products use subscription-style billing where appropriate. Local currency display is shown for convenience."
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pricingCards.map((card) => (
          <LightPanel key={card.title} className="flex h-full flex-col">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#008f5c]">{card.title}</p>
            <p className="mt-4 text-2xl font-black leading-tight tracking-[-0.03em] text-[#07140f] dark:text-white">{card.price}</p>
            <p className="mt-3 text-sm leading-7 text-[#2f4d40] dark:text-white/76">{card.description}</p>
            <ul className="mt-5 flex-1 space-y-3">
              {card.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#274437] dark:text-white/78">
                  <Check className="mt-1 h-4 w-4 flex-none text-[#008f5c]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <BpButton href={card.href} size="md" className="mt-6 w-full justify-center">
              {card.cta}
            </BpButton>
          </LightPanel>
        ))}
      </div>
    </SectionShell>
  );
}

function TrustSafetySection() {
  return (
    <SectionShell>
      <DarkPanel>
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div>
            <BpKicker>Trust & Safety</BpKicker>
            <h2 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
              Privacy-first does not mean abuse-friendly.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/78">
              Burner Point is built for privacy, control, and responsible use. Clear rules protect users and keep products reliable.
            </p>
            <div className="mt-7">
              <BpButton href="/terms-of-service" variant="outline" size="md">
                Read Our Terms
              </BpButton>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {safetyFeatures.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/76">
                <ShieldCheck className="h-4 w-4 flex-none text-[#00FF9D]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </DarkPanel>
    </SectionShell>
  );
}

function FaqPreviewSection() {
  return (
    <SectionShell>
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <LightPanel>
          <SectionHeading
            kicker="FAQ"
            title="Questions? We've got answers."
            body="Find clear answers about products, pricing, payments, availability, support, and account safety."
          />
          <div className="mt-7">
            <BpButton href="/faq" size="md">
              Open Full FAQ
            </BpButton>
          </div>
        </LightPanel>
        <div className="space-y-3">
          {faqPreviewItems.map((item) => (
            <details key={item.question} className="rounded-[1.35rem] border border-black/6 bg-white p-5 shadow-[0_18px_48px_rgba(2,20,12,0.06)] dark:border-white/10 dark:bg-[#07140f]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 text-sm font-black text-[#07140f] dark:text-white">
                <span>{item.question}</span>
                <ChevronRight className="h-4 w-4 flex-none text-[#008f5c]" />
              </summary>
              <p className="mt-3 text-sm leading-7 text-[#2f4d40] dark:text-white/76">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function FinalCtaSection() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[92rem] overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#000000,#013220_62%,#07140f)] p-6 text-white shadow-[0_40px_120px_rgba(2,20,12,0.26)] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <BpKicker>Keep your real number private</BpKicker>
            <h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-6xl">
              Use Burner Point to stay connected without exposing your personal phone number everywhere.
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {trustedChips.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/66">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <BpButton href="/sign-up" size="lg">
              Create Account
            </BpButton>
            <BpButton href="/pricing" size="lg" variant="outline">
              View Pricing
            </BpButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionShell({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-[92rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 ${className || ''}`}>
      {children}
    </section>
  );
}

function SectionHeading({
  kicker,
  title,
  body,
  align = 'left',
}: {
  kicker: string;
  title: ReactNode;
  body?: ReactNode;
  align?: 'left' | 'center';
}) {
  const centered = align === 'center';
  return (
    <div className={centered ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl'}>
      <BpKicker className="text-[#008f5c]">{kicker}</BpKicker>
      <h2 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-[#07140f] dark:text-white sm:text-5xl lg:text-6xl">{title}</h2>
      {body ? <p className="mt-5 text-base leading-8 text-[#2f4d40] dark:text-white/76">{body}</p> : null}
    </div>
  );
}

function LightPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(2,20,12,0.06)] dark:border-white/10 dark:bg-[#07140f] ${className || ''}`}>
      {children}
    </div>
  );
}

function DarkPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] bg-[linear-gradient(135deg,#07140f,#013220_64%,#000000)] p-6 text-white shadow-[0_30px_90px_rgba(2,20,12,0.18)] sm:p-8 ${className || ''}`}>
      {children}
    </div>
  );
}

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[1rem] bg-[#013220] text-[#00FF9D] shadow-[0_14px_32px_rgba(1,50,32,0.18)]">
      <Icon className="h-5 w-5" />
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  text,
  compact = false,
  href,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  compact?: boolean;
  href?: string;
}) {
  const content = (
    <article className={`group h-full rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(2,20,12,0.06)] transition hover:-translate-y-1 hover:border-[#00FF9D]/28 hover:shadow-[0_28px_80px_rgba(0,255,157,0.11)] dark:border-white/10 dark:bg-[#07140f] ${compact ? 'p-5' : ''}`}>
      <IconBadge icon={Icon} />
      <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-[#07140f] dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#2f4d40] dark:text-white/76">{text}</p>
      {!compact ? (
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#008f5c]">
          Explore
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      ) : null}
    </article>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full" aria-label={`Open ${title}`}>
      {content}
    </Link>
  );
}
