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
  supportContacts,
  testimonialPlaceholders,
  solutionFeatures,
} from '@/lib/homepage-content';

const productIcons = [MessageSquareText, ShieldCheck, Phone, Smartphone, Server, Route] as const;
const problemIcons = [Phone, BadgeCheck, Globe2] as const;
const solutionIcons = [LockKeyhole, MessageSquareText, Phone, CreditCard, Globe2, Wifi] as const;

export function BurnerPointHomepage() {
  return (
    <main className="min-h-screen bg-[#f4f7f3] text-[#07140f]">
      <MarketingHeader />

      <HeroSection />

      <SectionShell id="products" className="pt-6 lg:pt-10">
        <SectionHeading
          kicker="Product Positioning"
          title="One account. Six privacy tools."
          body="Burner Point combines private communication, verification, rentals, travel connectivity, proxies, and secure tunneling inside one premium telecom control surface."
          align="center"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productStripCards.map((item, index) => {
            const Icon = productIcons[index];

            return (
              <LightCard key={item.title} className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#013220] text-[#00FF9D] shadow-[0_14px_32px_rgba(1,50,32,0.18)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#07140f]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#456052]">{item.description}</p>
              </LightCard>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <LightCard className="overflow-hidden p-6 sm:p-8">
            <SectionHeading
              kicker="Problem"
              title="Your real number should not be everywhere."
              body="Every time you give out your personal number, you lose control. Apps, marketplaces, signups, rideshares, unknown contacts, and recovery flows can all expose you to spam, tracking, and unwanted account linkage."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MetricCard value="Spam" label="increases when one line gets reused everywhere" />
              <MetricCard value="Recovery" label="gets messy when old numbers disappear" />
              <MetricCard value="Identity" label="travels farther than it should online" />
            </div>
          </LightCard>

          <div className="grid gap-4">
            {problemCards.map((item, index) => {
              const Icon = problemIcons[index];

              return (
                <DarkCard key={item.title} className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white/10 text-[#00FF9D]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/70">{item.description}</p>
                </DarkCard>
              );
            })}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#07140f,#013220_60%,#07140f)] p-6 text-white shadow-[0_36px_90px_rgba(3,22,14,0.16)] sm:p-8">
          <SectionHeading
            kicker="Solution"
            title="Built for private, global communication."
            body="Burner Point combines second-number access, verification tools, rentals, eSIM connectivity, proxies, and secure VPN access into one platform built around privacy, control, and flexibility."
            tone="dark"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {solutionFeatures.map((item, index) => {
              const Icon = solutionIcons[index];

              return (
                <article
                  key={item.title}
                  className="rounded-[1.45rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#00FF9D]/12 text-[#00FF9D]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/72">{item.description}</p>
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
              className="grid gap-6 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_30px_90px_rgba(2,20,12,0.08)] sm:p-8 lg:grid-cols-[1.02fr_0.98fr]"
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <BpKicker className="text-[#00A76A]">{section.eyebrow}</BpKicker>
                <h3 className="mt-4 text-3xl font-black leading-[0.96] text-[#07140f] sm:text-4xl">
                  {section.title}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-8 text-[#456052]">{section.description}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {section.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 rounded-[1rem] bg-[#f3f8f5] px-4 py-3 text-sm leading-7 text-[#274437]">
                      <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[#00A76A]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {section.note ? (
                  <p className="mt-5 rounded-[1rem] border border-[#00FF9D]/18 bg-[#effcf5] px-4 py-3 text-sm leading-7 text-[#294638]">
                    {section.note}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <BpButton href={section.href} size="md">
                    {section.cta}
                  </BpButton>
                  <SecondaryLink href="/faq" dark>
                    View FAQ
                  </SecondaryLink>
                </div>
              </div>

              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <DarkCard className="h-full p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">
                    Product workflow
                  </p>
                  <div className="mt-5 space-y-3">
                    {section.features.slice(0, 4).map((feature, featureIndex) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3"
                      >
                        <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#00FF9D]/12 text-xs font-semibold text-[#00FF9D]">
                          0{featureIndex + 1}
                        </span>
                        <p className="text-sm leading-6 text-white/72">{feature}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <MiniStatus label="Availability" value={index < 3 ? 'Supported now' : 'Varies by plan'} />
                    <MiniStatus label="Setup" value={index === 1 ? 'Wallet based' : 'Fast activation'} />
                    <MiniStatus label="Control" value="Managed from dashboard" />
                    <MiniStatus label="Access" value="Web-first account" />
                  </div>
                </DarkCard>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="how-it-works">
        <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
          <LightCard className="p-6 sm:p-8">
            <SectionHeading
              kicker="How It Works"
              title="Get started in minutes."
              body="Create an account, fund your wallet or choose a plan, pick the product you need, and manage everything from one privacy-first dashboard."
            />
          </LightCard>

          <div className="grid gap-4 sm:grid-cols-2">
            {howItWorksSteps.map((item) => (
              <LightCard key={item.step} className="p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00A76A]">{item.step}</p>
                <h3 className="mt-4 text-lg font-semibold text-[#07140f]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#456052]">{item.description}</p>
              </LightCard>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <DarkCard className="p-6 sm:p-8">
            <SectionHeading
              kicker="Dashboard Preview"
              title="Everything runs from one dashboard."
              body="No more switching between fragmented telecom tools. Burner Point gives you one place to manage your wallet, numbers, verifications, rentals, eSIMs, proxies, VPN, messages, and billing."
              tone="dark"
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
                <div key={item} className="rounded-[1rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/76">
                  {item}
                </div>
              ))}
            </div>
          </DarkCard>

          <div className="grid gap-4 sm:grid-cols-2">
            {dashboardPreviewCards.map((card) => (
              <LightCard key={card.label} className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00A76A]">{card.label}</p>
                <p className="mt-4 text-2xl font-black leading-none text-[#07140f]">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-[#456052]">{card.meta}</p>
              </LightCard>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell id="pricing">
        <SectionHeading
          kicker="Pricing"
          title="Simple pricing. Built for control."
          body="Usage-based products run through a USD wallet. Recurring products use subscription-style billing where appropriate. Local currency display is shown for convenience."
          align="center"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pricingCards.map((card) => (
            <LightCard key={card.title} className="flex h-full flex-col p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00A76A]">{card.title}</p>
              <p className="mt-4 text-2xl font-black leading-tight text-[#07140f]">{card.price}</p>
              <p className="mt-3 text-sm leading-7 text-[#456052]">{card.description}</p>
              <ul className="mt-5 space-y-3">
                {card.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#274437]">
                    <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[#00A76A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <BpButton href={card.href} size="md" className="w-full justify-center">
                  {card.cta}
                </BpButton>
              </div>
            </LightCard>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-2">
          <LightCard className="p-6 sm:p-8">
            <SectionHeading
              kicker="Payments"
              title="Pay globally. View locally."
              body="Burner Point stores balances in USD and can display local exchange-rate estimates for NGN and other supported currencies."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {paymentMethods.map((item) => (
                <span
                  key={item}
                  className="inline-flex min-h-11 items-center rounded-full border border-black/6 bg-[#f2f7f4] px-4 text-sm font-medium text-[#274437]"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-[#567265]">
              Exchange rates are shown for convenience. Final payment amounts may vary depending on gateway fees, network fees, and provider rates.
            </p>
          </LightCard>

          <LightCard className="p-6 sm:p-8">
            <SectionHeading
              kicker="Availability"
              title="Built for global users."
              body="Product availability depends on country, provider inventory, telecom routing, route quality, and compliance requirements."
            />
            <div className="mt-6 grid gap-3">
              {availabilityItems.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-[1rem] border border-black/6 bg-[#f5f9f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-semibold text-[#07140f]">{item.title}</p>
                  <p className="text-sm text-[#456052]">{item.description}</p>
                </div>
              ))}
            </div>
          </LightCard>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#013220,#07140f_72%)] p-6 text-white shadow-[0_30px_90px_rgba(3,22,14,0.18)] sm:p-8">
          <SectionHeading
            kicker="Trust & Safety"
            title="Privacy-first does not mean abuse-friendly."
            body="Burner Point is built for privacy, not fraud. The platform should protect users while also protecting providers, networks, and the service itself from abuse."
            tone="dark"
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {safetyFeatures.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/78"
              >
                <ShieldCheck className="h-4 w-4 flex-none text-[#00FF9D]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <SecondaryLink href="/terms-of-service">Read our terms</SecondaryLink>
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <SectionHeading
          kicker="Testimonials"
          title="What users will love about Burner Point."
          body="Sample testimonial placeholders below should be replaced with verified customer feedback before public launch."
          align="center"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {testimonialPlaceholders.slice(0, 6).map((item) => (
            <LightCard key={`${item.name}-${item.location}`} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#013220] text-sm font-semibold text-[#00FF9D]">
                  {item.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#07140f]">{item.name}</p>
                  <p className="text-sm text-[#6c8578]">{item.location}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[#3d594c]">“{item.quote}”</p>
            </LightCard>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <LightCard className="p-6 sm:p-8">
            <SectionHeading
              kicker="FAQ"
              title="Questions? We've got answers."
              body="Use the FAQ preview below, then open the full categories page for account, verification, rentals, wallet, eSIM, proxy, and secure tunnel details."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <BpButton href="/faq" size="md">
                Open full FAQ
              </BpButton>
              <a
                href={`mailto:${supportContacts.email}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-semibold text-[#07140f] transition hover:border-[#00FF9D]/30 hover:bg-[#effcf5]"
              >
                Contact support
              </a>
            </div>
          </LightCard>

          <div className="space-y-3">
            {faqPreviewItems.map((item) => (
              <details
                key={item.question}
                className="rounded-[1.35rem] border border-black/6 bg-white p-5 shadow-[0_16px_40px_rgba(2,20,12,0.06)]"
              >
                <summary className="cursor-pointer list-none text-left text-sm font-semibold text-[#07140f]">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-[#456052]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell className="pb-20">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#07140f,#013220_62%,#0a1d14)] p-6 text-white shadow-[0_34px_100px_rgba(3,22,14,0.18)] sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <BpKicker>Final CTA</BpKicker>
            <h2 className="mt-4 text-4xl font-black leading-[0.94] text-white sm:text-5xl lg:text-6xl">
              Keep your real number private.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              Use Burner Point to stay connected without exposing your personal phone number everywhere. One account gives you private numbers, OTP tools, rentals, eSIM, proxies, and secure connectivity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BpButton href="/auth/signup" size="lg">
                Create account
              </BpButton>
              <SecondaryLink href="/pricing" large>
                View pricing
              </SecondaryLink>
            </div>
            <p className="mt-6 text-sm text-white/52">
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(1,50,32,0.12),transparent_26%),linear-gradient(180deg,#f7fbf8,#eef6f1)]" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#00FF9D]/16 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#9FA6B2]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[92rem] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-24">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF9D]/28 bg-white/80 px-4 py-2 shadow-[0_12px_30px_rgba(0,255,157,0.08)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00FF9D]" />
            <BpKicker className="text-[#00A76A]">Private by Design</BpKicker>
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[0.9] text-[#07140f] sm:text-6xl lg:text-7xl">
            Stay anonymous.
            <span className="block bg-[linear-gradient(110deg,#013220,#00A76A_45%,#07140f_90%)] bg-clip-text text-transparent">
              Stay connected.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#456052]">
            Don&apos;t want to give out your real phone number? No problem. Use ours. Burner Point gives you private numbers, messaging, verification codes, rentals, eSIM data, proxy access, and secure VPN tools from one privacy-first dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <BpButton href="/auth/signup" size="lg">
              Get started
            </BpButton>
            <SecondaryLink href="/pricing" large dark>
              View pricing
            </SecondaryLink>
            <SecondaryLink href="/#products" large dark>
              Explore products
            </SecondaryLink>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {heroTrustItems.map((item) => (
              <span
                key={item}
                className="inline-flex min-h-10 items-center rounded-full border border-black/6 bg-white/80 px-4 text-sm font-medium text-[#274437] shadow-[0_8px_24px_rgba(2,20,12,0.05)]"
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
          <div className="relative rounded-[2.4rem] border border-black/6 bg-white/80 p-4 shadow-[0_34px_110px_rgba(2,20,12,0.14)] backdrop-blur-2xl sm:p-5">
            <div className="absolute -right-4 -top-4 rounded-[1.2rem] bg-[#07140f] px-4 py-3 text-white shadow-[0_18px_40px_rgba(2,20,12,0.18)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">VPN status</p>
              <p className="mt-2 text-sm font-semibold">Secure Tunnel active</p>
            </div>

            <div className="absolute -left-5 top-28 hidden rounded-[1.2rem] border border-black/6 bg-white px-4 py-3 shadow-[0_18px_40px_rgba(2,20,12,0.12)] sm:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00A76A]">OTP received</p>
              <p className="mt-2 text-sm font-semibold text-[#07140f]">Your code is 482901</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <DarkCard className="p-5">
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF9D]">Burner Point Control Center</p>
                    <p className="mt-1 text-sm text-white/62">Private communication, verification, and secure connectivity.</p>
                  </div>
                  <span className="inline-flex h-10 items-center rounded-full bg-[#00FF9D]/12 px-4 text-sm font-semibold text-[#00FF9D]">
                    Live
                  </span>
                </div>

                <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF9D]">Wallet balance</p>
                      <p className="mt-3 text-4xl font-black text-white">$25.00</p>
                    </div>
                    <div className="rounded-[1rem] bg-[#00FF9D]/10 px-3 py-2 text-sm font-medium text-[#00FF9D]">
                      USD
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      ['Active number', '+1 United States'],
                      ['eSIM plan', 'USA 5GB active'],
                      ['Proxy plan', 'Residential online'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-sm text-white/56">{label}</p>
                        <p className="text-sm font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </DarkCard>

              <div className="grid gap-4">
                <LightCard className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00A76A]">BP Messenger</p>
                  <p className="mt-3 text-xl font-semibold text-[#07140f]">1 active line</p>
                  <p className="mt-1 text-sm leading-6 text-[#456052]">Private calls and texts separated from your personal line.</p>
                </LightCard>
                <LightCard className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00A76A]">BP Verify Hub</p>
                  <p className="mt-3 text-xl font-semibold text-[#07140f]">Ready now</p>
                  <p className="mt-1 text-sm leading-6 text-[#456052]">SMS and voice verification where supported.</p>
                </LightCard>
                <LightCard className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00A76A]">BP Rentals</p>
                  <p className="mt-3 text-xl font-semibold text-[#07140f]">Renewable</p>
                  <p className="mt-1 text-sm leading-6 text-[#456052]">Short-term access or long-term continuity from one wallet.</p>
                </LightCard>
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

function SectionHeading({
  kicker,
  title,
  body,
  align = 'left',
  tone = 'light',
}: {
  kicker: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
}) {
  const centered = align === 'center';
  const titleClass = tone === 'dark' ? 'text-white' : 'text-[#07140f]';
  const bodyClass = tone === 'dark' ? 'text-white/72' : 'text-[#456052]';

  return (
    <div className={centered ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl'}>
      <BpKicker className={tone === 'dark' ? undefined : 'text-[#00A76A]'}>{kicker}</BpKicker>
      <h2 className={`mt-4 text-4xl font-black leading-[0.94] sm:text-5xl lg:text-6xl ${titleClass}`}>{title}</h2>
      {body ? <p className={`mt-5 text-base leading-8 ${bodyClass}`}>{body}</p> : null}
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/6 bg-white/82 px-4 py-4 shadow-[0_10px_26px_rgba(2,20,12,0.05)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00A76A]">{value}</p>
      <p className="mt-2 text-sm text-[#567265]">{label}</p>
    </div>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.05] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-white/46">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function LightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.7rem] border border-black/6 bg-white shadow-[0_18px_48px_rgba(2,20,12,0.06)] ${className || ''}`}>
      {children}
    </div>
  );
}

function DarkCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.7rem] bg-[linear-gradient(180deg,#07140f,#03140d)] shadow-[0_26px_70px_rgba(2,20,12,0.18)] ${className || ''}`}>
      {children}
    </div>
  );
}

function SecondaryLink({
  href,
  children,
  large = false,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  large?: boolean;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full border px-5 font-semibold transition hover:-translate-y-0.5',
        large ? 'min-h-14 py-4 text-sm' : 'min-h-11 py-3 text-sm',
        dark
          ? 'border-black/10 bg-white/70 text-[#07140f] hover:border-[#00FF9D]/28 hover:bg-white'
          : 'border-white/12 bg-white/[0.05] text-white hover:border-[#00FF9D]/28 hover:text-white',
      ].join(' ')}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
