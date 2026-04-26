import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronRight,
  CreditCard,
  Globe2,
  LockKeyhole,
  MessageSquareText,
  Phone,
  Route,
  Server,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MarketingFooter, MarketingHeader } from '@/components/sections/bp-marketing-shell';
import { BpButton, BpKicker } from '@/components/ui/bp-landing-primitives';
import {
  availabilityItems,
  dashboardPreviewCards,
  faqPreviewItems,
  heroTrustItems,
  howItWorksSteps,
  paymentMethods,
  pricingCards,
  problemCards,
  productSections,
  productStripCards,
  safetyFeatures,
  solutionFeatures,
  testimonialPlaceholders,
} from '@/lib/homepage-content';

const productIcons = [MessageSquareText, ShieldCheck, Phone, Smartphone, Server, Route] as const;
const solutionIcons = [LockKeyhole, MessageSquareText, CalendarClock, CreditCard, Globe2, Wifi] as const;
const problemIcons = [Phone, BadgeCheck, Globe2] as const;

const trustedChips = [
  'Private number layer',
  'SMS & voice OTP',
  'Renewable rentals',
  'Travel eSIM',
  'Proxy plans',
  'Secure tunnel',
] as const;

const dashboardSignals = [
  { label: 'Wallet', value: '$25.00', meta: 'USD balance ready' },
  { label: 'Number', value: '+1 United States', meta: 'Active private line' },
  { label: 'OTP', value: '482901', meta: 'Code received live' },
  { label: 'Tunnel', value: 'Active', meta: 'Encrypted session' },
] as const;

export function BurnerPointHomepage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f4] text-[#07140f]">
      <MarketingHeader />
      <HeroSection />
      <ProductStripSection />
      <ProblemSolutionSection />
      <ProductShowcaseSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <PricingSection />
      <PaymentsAvailabilitySection />
      <TrustSafetySection />
      <TestimonialsSection />
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
          <BpKicker>Private communication operating system</BpKicker>
          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-6xl lg:text-7xl xl:text-[5.9rem]">
            Private by Design.
            <span className="block bg-[linear-gradient(105deg,#00FF9D,#E5E7EB_48%,#39FF14)] bg-clip-text text-transparent">
              Stay Anonymous. Stay Connected.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Don&apos;t want to give out your real phone number? No problem. Use ours. Burner Point gives you private
            numbers, messaging, verification codes, rentals, eSIM data, proxy access, and secure VPN tools from one
            clean dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BpButton href="/auth/signup" size="lg">
              Get Started
            </BpButton>
            <BpButton href="#pricing" size="lg" variant="outline">
              View Pricing
            </BpButton>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {heroTrustItems.map((item) => (
              <span
                key={item}
                className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.045] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/70"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-h-[36rem]">
          <div className="absolute left-0 top-0 hidden w-44 rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_30px_80px_rgba(0,0,0,.28)] backdrop-blur-xl md:block">
            <PrivacyCharacter />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#00FF9D]">Number protected</p>
          </div>

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[42rem] rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-3 shadow-[0_44px_120px_rgba(0,0,0,.48)] backdrop-blur-2xl">
            <DashboardGlass />
          </div>

          <div className="absolute right-2 top-6 w-48 rounded-[2rem] border border-[#00FF9D]/20 bg-[#00FF9D]/10 p-4 shadow-[0_24px_70px_rgba(0,255,157,.12)] backdrop-blur-xl sm:right-8 lg:right-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">Live OTP</p>
            <p className="mt-3 font-mono text-3xl font-black text-white">482901</p>
            <p className="mt-2 text-xs leading-5 text-white/58">Code delivered to BP Verify Hub.</p>
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
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">Burner Point Dashboard</p>
          <p className="mt-1 text-sm text-white/52">One privacy account. Six product lanes.</p>
        </div>
        <span className="rounded-full bg-[#00FF9D] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
          Live
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {dashboardSignals.map((item) => (
          <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-black/24 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/38">{item.label}</p>
            <p className="mt-2 text-xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs text-white/46">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-[#00FF9D]/20 bg-[#00FF9D]/[0.07] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#00FF9D]/12">
            <ShieldCheck className="h-4 w-4 text-[#00FF9D]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Secure Tunnel Active</p>
            <p className="mt-1 text-sm leading-6 text-white/58">
              eSIM plan, proxy access, and private messages stay visible without exposing technical setup.
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
        kicker="One account. Six privacy tools."
        title="Every Burner Point product is positioned from the first screen."
        body="The homepage, dashboard, and mobile flow all lead users to the same product stack: BP Messenger, Verify Hub, Rentals, eSIM Store, Proxy Store, and Secure Tunnel."
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {productStripCards.map((item, index) => {
          const Icon = productIcons[index];
          return (
            <FeatureTile key={item.title} icon={Icon} title={item.title} text={item.description} />
          );
        })}
      </div>
    </SectionShell>
  );
}

function ProblemSolutionSection() {
  return (
    <SectionShell>
      <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <DarkPanel>
          <BpKicker>Your real number should not be everywhere</BpKicker>
          <h2 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
            Too many apps ask for your number before they earn your trust.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/70">
            Apps, marketplaces, signups, rideshares, online sellers, and unknown contacts can expose users to spam,
            tracking, unwanted calls, and account recovery problems.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {['Spam', 'Tracking', 'Recovery'].map((item) => (
              <div key={item} className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF9D]">{item}</p>
                <p className="mt-2 text-sm leading-6 text-white/52">Reduced by adding a controlled privacy layer.</p>
              </div>
            ))}
          </div>
        </DarkPanel>

        <div className="grid gap-4">
          {problemCards.map((item, index) => {
            const Icon = problemIcons[index];
            return (
              <LightPanel key={item.title} className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
                <IconBadge icon={Icon} />
                <div>
                  <h3 className="text-xl font-black tracking-[-0.02em] text-[#07140f]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#456052]">{item.description}</p>
                </div>
              </LightPanel>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] border border-black/6 bg-white p-5 shadow-[0_20px_70px_rgba(2,20,12,0.06)] sm:p-7">
        <SectionHeading
          kicker="Solution"
          title="Built for private, global communication."
          body="Burner Point combines second-number access, verification tools, rentals, eSIM connectivity, proxies, and secure VPN access into one platform built around privacy, control, and flexibility."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {solutionFeatures.map((item, index) => {
            const Icon = solutionIcons[index];
            return <FeatureTile key={item.title} icon={Icon} title={item.title} text={item.description} compact />;
          })}
        </div>
      </div>
    </SectionShell>
  );
}

function ProductShowcaseSection() {
  return (
    <SectionShell>
      <SectionHeading
        kicker="Product System"
        title="A full privacy stack, not another one-feature number app."
        body="Each product has a clear purpose, a user-safe message, and a direct entry point. Internal routing, provider details, and operational controls stay out of the customer interface."
        align="center"
      />

      <div className="mt-10 space-y-5">
        {productSections.map((section, index) => (
          <article
            key={section.id}
            id={section.id}
            className="grid overflow-hidden rounded-[2.25rem] border border-black/6 bg-white shadow-[0_24px_90px_rgba(2,20,12,0.08)] lg:grid-cols-[1.02fr_0.98fr]"
          >
            <div className={`p-6 sm:p-8 lg:p-10 ${index % 2 ? 'lg:order-2' : ''}`}>
              <BpKicker className="text-[#008f5c]">{section.eyebrow}</BpKicker>
              <h3 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-[#07140f] sm:text-5xl">
                {section.title}
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#456052]">{section.description}</p>
              {section.note ? (
                <p className="mt-5 rounded-[1.2rem] border border-[#00FF9D]/24 bg-[#effcf5] px-4 py-3 text-sm leading-7 text-[#274437]">
                  {section.note}
                </p>
              ) : null}
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {section.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 rounded-[1rem] bg-[#f5faf7] px-4 py-3 text-sm leading-6 text-[#274437]">
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
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-[#07140f] transition hover:border-[#00FF9D]/28"
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
          <p className="mt-3 text-sm leading-6 text-white/58">
            Managed from one account with clear status, pricing, and support paths.
          </p>
        </div>

        <div className="grid gap-3">
          {['Choose product', 'Confirm availability', 'Activate from dashboard'].map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/28 px-4 py-3">
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
            Create an account, fund your wallet or choose a plan, pick a product, then manage your numbers, codes,
            plans, and connectivity tools from one dashboard.
          </p>
        </DarkPanel>
        <div className="grid gap-4 sm:grid-cols-2">
          {howItWorksSteps.map((item) => (
            <LightPanel key={item.step}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#008f5c]">{item.step}</p>
              <h3 className="mt-4 text-xl font-black tracking-[-0.02em] text-[#07140f]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#456052]">{item.description}</p>
            </LightPanel>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function DashboardPreviewSection() {
  return (
    <SectionShell>
      <div className="rounded-[2.25rem] bg-[linear-gradient(135deg,#07140f,#013220_62%,#000000)] p-5 text-white shadow-[0_34px_110px_rgba(2,20,12,0.18)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <BpKicker>Dashboard Preview</BpKicker>
            <h2 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
              Everything runs from one dashboard.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/68">
              No more switching between fragmented telecom tools. Burner Point gives users one place to manage wallet,
              numbers, verifications, rentals, eSIMs, proxies, VPN, messages, billing, and support.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {dashboardPreviewCards.map((card) => (
              <div key={card.label} className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">{card.label}</p>
                <p className="mt-3 text-2xl font-black text-white">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-white/56">{card.meta}</p>
              </div>
            ))}
          </div>
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
            <p className="mt-4 text-2xl font-black leading-tight tracking-[-0.03em] text-[#07140f]">{card.price}</p>
            <p className="mt-3 text-sm leading-7 text-[#456052]">{card.description}</p>
            <ul className="mt-5 flex-1 space-y-3">
              {card.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#274437]">
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

function PaymentsAvailabilitySection() {
  return (
    <SectionShell>
      <div className="grid gap-5 lg:grid-cols-2">
        <LightPanel>
          <SectionHeading
            kicker="Payments"
            title="Pay globally. View locally."
            body="Burner Point stores balances in USD and can display local exchange-rate estimates for NGN and other supported currencies."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            {paymentMethods.map((item) => (
              <span key={item} className="inline-flex min-h-11 items-center rounded-full border border-black/8 bg-[#f4faf6] px-4 text-sm font-semibold text-[#274437]">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-[#567265]">
            Exchange rates are shown for convenience. Final payment amounts may vary depending on gateway fees, network
            fees, and provider rates.
          </p>
        </LightPanel>

        <LightPanel>
          <SectionHeading
            kicker="Availability"
            title="Built for global users."
            body="Availability depends on country, telecom inventory, route quality, plan type, and compliance requirements."
          />
          <div className="mt-6 grid gap-3">
            {availabilityItems.map((item) => (
              <div key={item.title} className="flex flex-col gap-2 rounded-[1rem] border border-black/6 bg-[#f6fbf8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-black text-[#07140f]">{item.title}</p>
                <p className="text-sm text-[#456052]">{item.description}</p>
              </div>
            ))}
          </div>
        </LightPanel>
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
            <p className="mt-5 text-base leading-8 text-white/70">
              Burner Point is built for privacy, not fraud. Product screens should protect users while also supporting
              platform, provider, and network safety.
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

function TestimonialsSection() {
  return (
    <SectionShell>
      <SectionHeading
        kicker="Testimonials"
        title="What users will love about Burner Point."
        body="These are launch-ready testimonial placeholders. Replace them with verified customer feedback before presenting them as real reviews."
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {testimonialPlaceholders.map((item) => (
          <LightPanel key={`${item.name}-${item.location}`} className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#013220] text-sm font-black text-[#00FF9D]">
                {item.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-black text-[#07140f]">{item.name}</p>
                <p className="text-sm text-[#6c8578]">{item.location}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[#3d594c]">“{item.quote}”</p>
          </LightPanel>
        ))}
      </div>
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
            title="Questions? We’ve got answers."
            body="The full FAQ page includes tabs for General, BP Messenger, BP Verify Hub, BP Rentals, Wallet & Payments, eSIM, Proxies, Secure Tunnel, and Account & Security."
          />
          <div className="mt-7">
            <BpButton href="/faq" size="md">
              Open Full FAQ
            </BpButton>
          </div>
        </LightPanel>
        <div className="space-y-3">
          {faqPreviewItems.map((item) => (
            <details key={item.question} className="rounded-[1.35rem] border border-black/6 bg-white p-5 shadow-[0_18px_48px_rgba(2,20,12,0.06)]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 text-sm font-black text-[#07140f]">
                <span>{item.question}</span>
                <ChevronRight className="h-4 w-4 flex-none text-[#008f5c]" />
              </summary>
              <p className="mt-3 text-sm leading-7 text-[#456052]">{item.answer}</p>
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
            <BpButton href="/auth/signup" size="lg">
              Create Account
            </BpButton>
            <BpButton href="#pricing" size="lg" variant="outline">
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
      <h2 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-[#07140f] sm:text-5xl lg:text-6xl">{title}</h2>
      {body ? <p className="mt-5 text-base leading-8 text-[#456052]">{body}</p> : null}
    </div>
  );
}

function LightPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(2,20,12,0.06)] ${className || ''}`}>
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
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <article className={`group rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(2,20,12,0.06)] transition hover:-translate-y-1 hover:border-[#00FF9D]/28 hover:shadow-[0_28px_80px_rgba(0,255,157,0.11)] ${compact ? 'p-5' : ''}`}>
      <IconBadge icon={Icon} />
      <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-[#07140f]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#456052]">{text}</p>
      {!compact ? (
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#008f5c]">
          Explore
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      ) : null}
    </article>
  );
}

function PrivacyCharacter() {
  return (
    <svg viewBox="0 0 180 180" role="img" aria-label="Privacy character illustration" className="h-auto w-full">
      <defs>
        <linearGradient id="bp-character-gradient" x1="28" y1="16" x2="152" y2="158" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FF9D" />
          <stop offset="1" stopColor="#39FF14" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r="76" fill="#07140F" stroke="rgba(255,255,255,.16)" strokeWidth="2" />
      <path d="M52 78c0-24 17-43 38-43s38 19 38 43v18c0 24-17 43-38 43s-38-19-38-43V78Z" fill="url(#bp-character-gradient)" />
      <path d="M66 84c7 6 16 9 26 9 12 0 24-5 33-15v19c0 20-15 36-35 36S55 117 55 97V81c3 1 7 2 11 3Z" fill="#06120D" opacity=".9" />
      <circle cx="77" cy="91" r="5" fill="#00FF9D" />
      <circle cx="105" cy="91" r="5" fill="#00FF9D" />
      <path d="M78 111c9 7 18 7 27 0" fill="none" stroke="#E5E7EB" strokeLinecap="round" strokeWidth="5" />
      <path d="M43 128c12-12 27-18 47-18s35 6 47 18" fill="none" stroke="rgba(255,255,255,.4)" strokeLinecap="round" strokeWidth="8" />
      <path d="M42 55 24 45m114 10 18-10M34 96H17m126 0h20" stroke="#00FF9D" strokeLinecap="round" strokeWidth="5" opacity=".75" />
    </svg>
  );
}
