import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
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
import { MarketingFooter, MarketingHeader } from '@/components/sections/bp-marketing-shell';
import { BpButton, BpKicker, BpSectionHeading, BpSurface } from '@/components/ui/bp-landing-primitives';
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
  supportContacts,
  testimonialPlaceholders,
  solutionFeatures,
} from '@/lib/homepage-content';

const productIcons = [MessageSquareText, ShieldCheck, Phone, Smartphone, Server, Route] as const;
const problemIcons = [Phone, BadgeCheck, Globe2] as const;
const solutionIcons = [LockKeyhole, MessageSquareText, Phone, CreditCard, Globe2, Wifi] as const;

export function BurnerPointHomepage() {
  return (
    <main className="min-h-screen bg-brand-black text-white">
      <MarketingHeader />

      <HeroSection />

      <SectionShell id="products" className="pt-0">
        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.82),rgba(0,0,0,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8">
          <BpSectionHeading
            kicker="Product Positioning"
            title="One account. Six privacy tools."
            body="Burner Point combines private communication, verification, rentals, travel connectivity, proxies, and secure tunneling inside one premium telecom control surface."
            align="center"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {productStripCards.map((item, index) => {
              const Icon = productIcons[index];
              return (
                <article
                  key={item.title}
                  className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-[#00FF9D]/28 hover:bg-[#00FF9D]/[0.05]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[#00FF9D]/16 bg-[#00FF9D]/10">
                    <Icon className="h-5 w-5 text-[#00FF9D]" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/56">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <BpSurface className="p-6 sm:p-8">
            <BpSectionHeading
              kicker="Problem"
              title="Your real number should not be everywhere."
              body="Every time you give out your personal number, you lose control. Apps, marketplaces, signups, rideshares, unknown contacts, and recovery flows can all expose you to spam, tracking, and unwanted account linkage."
            />
          </BpSurface>
          <div className="grid gap-4">
            {problemCards.map((item, index) => {
              const Icon = problemIcons[index];
              return (
                <article
                  key={item.title}
                  className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.84),rgba(0,0,0,0.96))] p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5 text-[#00FF9D]" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/56">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.2),rgba(0,0,0,0.95))] p-6 sm:p-8">
          <BpSectionHeading
            kicker="Solution"
            title="Built for private, global communication."
            body="Burner Point combines second-number access, verification tools, rentals, eSIM connectivity, proxies, and secure VPN access into one platform built around privacy, control, and flexibility."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {solutionFeatures.map((item, index) => {
              const Icon = solutionIcons[index];
              return (
                <article
                  key={item.title}
                  className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5 transition hover:border-[#00FF9D]/24"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[#00FF9D]/16 bg-[#00FF9D]/10">
                    <Icon className="h-5 w-5 text-[#00FF9D]" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/56">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="space-y-5">
          {productSections.map((section, index) => (
            <article
              key={section.title}
              id={section.id}
              className="grid gap-6 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.84),rgba(0,0,0,0.96))] p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr]"
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <BpKicker>{section.eyebrow}</BpKicker>
                <h3 className="mt-4 text-3xl font-black uppercase leading-[0.96] text-white sm:text-4xl">
                  {section.title}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">{section.description}</p>
                <ul className="mt-6 space-y-3">
                  {section.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-7 text-white/72">
                      <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[#00FF9D]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {section.note ? (
                  <p className="mt-5 rounded-[1rem] border border-[#00FF9D]/18 bg-[#00FF9D]/[0.06] px-4 py-3 text-sm leading-7 text-white/68">
                    {section.note}
                  </p>
                ) : null}
              </div>

              <BpSurface className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <div className="flex h-full flex-col justify-between p-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF9D]">
                      Product workflow
                    </p>
                    <div className="mt-5 grid gap-3">
                      {section.features.slice(0, 4).map((feature, featureIndex) => (
                        <div
                          key={feature}
                          className="flex items-start gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3"
                        >
                          <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[#00FF9D]/16 bg-[#00FF9D]/10 text-xs font-semibold text-[#00FF9D]">
                            0{featureIndex + 1}
                          </span>
                          <p className="text-sm leading-6 text-white/70">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <BpButton href={section.href} size="md">
                      {section.cta}
                    </BpButton>
                    <Link
                      href="/faq"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-semibold text-white/76 transition hover:border-[#00FF9D]/24 hover:text-white"
                    >
                      View FAQ
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </BpSurface>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="how-it-works">
        <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <BpSurface className="p-6 sm:p-8">
            <BpSectionHeading
              kicker="How It Works"
              title="Get started in minutes."
              body="Create an account, fund your wallet or choose a plan, pick the product you need, and manage everything from one privacy-first dashboard."
            />
          </BpSurface>
          <div className="grid gap-4 sm:grid-cols-2">
            {howItWorksSteps.map((item) => (
              <article
                key={item.step}
                className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.84),rgba(0,0,0,0.96))] p-5"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00FF9D]">{item.step}</p>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/56">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(0,0,0,0.82),rgba(7,20,15,0.96))] p-6 sm:p-8">
            <BpSectionHeading
              kicker="Dashboard Preview"
              title="Everything runs from one dashboard."
              body="No more switching between fragmented telecom tools. Burner Point gives you one place to manage your wallet, numbers, verifications, rentals, eSIMs, proxies, VPN, messages, and billing."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                'Available balance',
                'Active numbers',
                'Recent messages',
                'Verification history',
                'Active rentals',
                'eSIM orders',
                'Proxy credentials',
                'VPN sessions',
              ].map((item) => (
                <div key={item} className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {dashboardPreviewCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.9),rgba(0,0,0,0.96))] p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">{card.label}</p>
                <p className="mt-4 text-2xl font-black uppercase leading-none text-white">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-white/52">{card.meta}</p>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell id="pricing">
        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.86),rgba(0,0,0,0.98))] p-6 sm:p-8">
          <BpSectionHeading
            kicker="Pricing"
            title="Simple pricing. Built for control."
            body="Usage-based products run through a USD wallet. Recurring products use subscription-style billing where appropriate. Local currency display is shown for convenience."
            align="center"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pricingCards.map((card) => (
              <article
                key={card.title}
                className="flex h-full flex-col rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">{card.title}</p>
                <p className="mt-4 text-2xl font-black leading-tight text-white">{card.price}</p>
                <p className="mt-3 text-sm leading-7 text-white/56">{card.description}</p>
                <ul className="mt-5 space-y-3">
                  {card.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/70">
                      <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[#00FF9D]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <BpButton href={card.href} size="md" className="w-full justify-center">
                    {card.cta}
                  </BpButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-2">
          <BpSurface className="p-6 sm:p-8">
            <BpSectionHeading
              kicker="Payments"
              title="Pay globally. View locally."
              body="Burner Point stores balances in USD and can display local exchange-rate estimates for NGN and other supported currencies."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {paymentMethods.map((item) => (
                <span
                  key={item}
                  className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/74"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-white/48">
              Exchange rates are shown for convenience. Final payment amounts may vary depending on gateway fees, network fees, and provider rates.
            </p>
          </BpSurface>

          <BpSurface className="p-6 sm:p-8">
            <BpSectionHeading
              kicker="Availability"
              title="Built for global users."
              body="Product availability depends on country, provider inventory, telecom routing, route quality, and compliance requirements."
            />
            <div className="mt-6 grid gap-3">
              {availabilityItems.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-white/56">{item.description}</p>
                </div>
              ))}
            </div>
          </BpSurface>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] border border-[#00FF9D]/12 bg-[linear-gradient(180deg,rgba(1,50,32,0.24),rgba(0,0,0,0.96))] p-6 sm:p-8">
          <BpSectionHeading
            kicker="Trust & Safety"
            title="Privacy-first does not mean abuse-friendly."
            body="Burner Point is built for privacy, not fraud. The platform should protect users while also protecting providers, networks, and the service itself from abuse."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {safetyFeatures.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72"
              >
                <ShieldCheck className="h-4 w-4 flex-none text-[#00FF9D]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <BpButton href="/terms-of-service" variant="outline" size="md">
              Read our terms
            </BpButton>
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.86),rgba(0,0,0,0.98))] p-6 sm:p-8">
          <BpSectionHeading
            kicker="Testimonials"
            title="What users will love about Burner Point."
            body="Sample testimonial placeholders below should be replaced with verified customer feedback before public launch."
            align="center"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {testimonialPlaceholders.map((item) => (
              <article key={`${item.name}-${item.location}`} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#00FF9D]/20 bg-[#00FF9D]/10 text-sm font-semibold text-[#00FF9D]">
                    {item.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-white/48">{item.location}</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-white/64">“{item.quote}”</p>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <BpSurface className="p-6 sm:p-8">
            <BpSectionHeading
              kicker="FAQ"
              title="Questions? We’ve got answers."
              body="Use the FAQ preview below, then open the full categories page for account, verification, rentals, wallet, eSIM, proxy, and secure tunnel details."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <BpButton href="/faq" size="md">
                Open full FAQ
              </BpButton>
              <a
                href={`mailto:${supportContacts.email}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white/76 transition hover:border-[#00FF9D]/24 hover:text-white"
              >
                Contact support
              </a>
            </div>
          </BpSurface>

          <div className="space-y-3">
            {faqPreviewItems.map((item) => (
              <details
                key={item.question}
                className="rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.82),rgba(0,0,0,0.96))] p-5"
              >
                <summary className="cursor-pointer list-none text-left text-sm font-semibold text-white">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-white/56">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell className="pb-20">
        <div className="rounded-[2rem] border border-[#00FF9D]/14 bg-[linear-gradient(135deg,rgba(1,50,32,0.34),rgba(0,0,0,0.98)_70%)] p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <BpKicker>Final CTA</BpKicker>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[0.94] text-white sm:text-5xl lg:text-6xl">
              Keep your real number private.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">
              Use Burner Point to stay connected without exposing your personal phone number everywhere. One account gives you private numbers, OTP tools, rentals, eSIM, proxies, and secure connectivity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BpButton href="/auth/signup" size="lg">
                Create account
              </BpButton>
              <BpButton href="/#pricing" variant="outline" size="lg">
                View pricing
              </BpButton>
            </div>
            <p className="mt-6 text-sm text-white/46">
              Private numbers • OTP tools • Rentals • eSIM • Proxies • VPN
            </p>
          </div>
        </div>
      </SectionShell>

      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.16),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(57,255,20,0.08),transparent_20%)]" />
        <div className="bp-grid-bg absolute inset-x-0 top-0 h-[48rem] opacity-50" />
      </div>

      <div className="mx-auto grid max-w-[92rem] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-24">
        <div className="relative z-10">
          <BpKicker>Private by Design</BpKicker>
          <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] text-white sm:text-6xl lg:text-7xl">
            Stay anonymous.
            <span className="block bg-[linear-gradient(110deg,#9FA6B2,#E5E7EB_38%,#FFFFFF_48%,#9FA6B2)] bg-clip-text text-transparent">
              Stay connected.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/64">
            Don’t want to give out your real phone number? No problem. Use ours. Burner Point gives you private numbers, messaging, verification codes, rentals, eSIM data, proxy access, and secure VPN tools from one privacy-first dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <BpButton href="/auth/signup" size="lg">
              Get started
            </BpButton>
            <BpButton href="/#pricing" variant="outline" size="lg">
              View pricing
            </BpButton>
            <BpButton href="/#products" variant="ghost" size="lg">
              Explore products
            </BpButton>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {heroTrustItems.map((item) => (
              <span
                key={item}
                className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/74"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <MetricCard value="One" label="privacy-first dashboard" />
            <MetricCard value="USD" label="wallet with local display" />
            <MetricCard value="Global" label="services where supported" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="rounded-[2.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.86),rgba(0,0,0,0.98))] p-5 shadow-[0_32px_100px_rgba(0,0,0,0.42)] sm:p-6">
            <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Burner Point Control Center</p>
                <p className="mt-1 text-sm text-white/56">Private communication, verification, and secure connectivity.</p>
              </div>
              <span className="inline-flex h-10 items-center rounded-full border border-[#00FF9D]/18 bg-[#00FF9D]/10 px-4 text-sm font-semibold text-[#00FF9D]">
                Live
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(0,0,0,0.32),rgba(255,255,255,0.02))] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">Wallet balance</p>
                    <p className="mt-3 text-4xl font-black text-white">$25.00</p>
                  </div>
                  <div className="rounded-[1rem] border border-[#00FF9D]/16 bg-[#00FF9D]/10 px-3 py-2 text-sm font-medium text-[#00FF9D]">
                    USD
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ['Active number', '+1 United States'],
                    ['OTP received', 'Your code is 482901'],
                    ['VPN status', 'Secure Tunnel active'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-sm text-white/54">{label}</p>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <HeroUtilityCard title="BP Verify Hub" value="Ready" meta="SMS & voice OTP where supported" />
                <HeroUtilityCard title="BP eSIM Store" value="USA 5GB" meta="Travel plan active" />
                <HeroUtilityCard title="BP Proxy Store" value="Residential" meta="Approved routing online" />
                <HeroUtilityCard title="BP Messenger" value="1 active line" meta="Private calls and texts" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionShell({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-[92rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-12 ${className || ''}`}>
      {children}
    </section>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">{value}</p>
      <p className="mt-2 text-sm text-white/56">{label}</p>
    </div>
  );
}

function HeroUtilityCard({
  title,
  value,
  meta,
}: {
  title: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">{title}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm leading-6 text-white/50">{meta}</p>
    </div>
  );
}
