import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Globe2, MessageSquareText, ShieldCheck, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const proofItems = [
  {
    icon: ShieldCheck,
    title: 'Private by default',
    text: 'Use one secure Burner Point account across identity, messaging, payments, and connectivity.',
  },
  {
    icon: Globe2,
    title: 'Global access',
    text: 'Move between regions, providers, and devices without changing how you access the platform.',
  },
  {
    icon: MessageSquareText,
    title: 'Clear next steps',
    text: 'Every auth surface is tuned for direct recovery, verification, and sign-in without visual noise.',
  },
  {
    icon: Smartphone,
    title: 'Web and mobile aligned',
    text: 'The same account state carries from BurnerPoint.com to the mobile app and back.',
  },
];

export function AuthShell({
  title,
  description,
  children,
  asideTitle,
  asideDescription,
  className,
  helperContent,
}: {
  title: string;
  description: string;
  children: ReactNode;
  asideTitle?: string;
  asideDescription?: string;
  className?: string;
  helperContent?: ReactNode;
}) {
  return (
    <main className="bp-auth-page relative min-h-screen overflow-x-clip px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.18),transparent_34%)]" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.1),transparent_68%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[118rem] gap-5 min-[1100px]:min-h-[calc(100dvh-4rem)] min-[1100px]:grid-cols-[minmax(0,40rem)_minmax(0,36rem)] min-[1100px]:items-center">
        <section
          className={cn(
            'bp-auth-panel hidden min-[1100px]:flex min-h-[44rem] flex-col justify-between rounded-[2rem] p-6 xl:p-7 2xl:min-h-[47rem]',
            className,
          )}
        >
          <div>
            <Link href="/" className="inline-flex max-w-full items-center gap-3" aria-label="Burner Point home">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[1rem] border border-brand-green/25 bg-brand-green/10 shadow-[0_0_24px_rgba(0,255,157,0.14)]">
                <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
              </span>
              <span className="inline-flex min-w-0 items-center rounded-full border border-white/8 bg-black/30 px-4 py-2">
                <Image
                  src="/assets/wordmark-white.svg"
                  alt="Burner Point"
                  width={176}
                  height={28}
                  className="h-[1.05rem] w-auto max-w-[10rem] lg:max-w-[11rem]"
                />
              </span>
            </Link>

            <p className="bp-auth-kicker mt-8 font-mono text-[10px] uppercase tracking-[0.26em] text-brand-green">
              Account access
            </p>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(2.45rem,5vw,4.85rem)] font-semibold uppercase leading-[0.88] text-white">
              {asideTitle || 'Private entry that feels calm, direct, and fast.'}
            </h1>
            <p className="bp-auth-panel-copy mt-4 max-w-[34rem] text-base leading-7 text-[#E5E7EB]">
              {asideDescription ||
                'Access messaging, numbers, verifications, rentals, wallets, subscriptions, and support from one secure Burner Point account.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="bp-auth-chip bp-auth-chip-primary">Stay Anonymous. Stay Connected.</span>
              <span className="bp-auth-chip">Supabase secured</span>
              <span className="bp-auth-chip">BurnerPoint.com</span>
            </div>
          </div>

          <div className="mt-8 grid gap-3 xl:grid-cols-2">
            {proofItems.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[1.45rem] border border-white/10 bg-black/22 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-brand-green/12 text-brand-green">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#E5E7EB]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-[36rem] items-center">
          <div className="bp-card bp-auth-card w-full overflow-hidden rounded-[1.75rem] p-3 sm:p-4 lg:p-5">
            <div className="bp-auth-surface flex flex-col gap-5 rounded-[1.4rem] p-4 sm:p-5 lg:p-6">
              <div className="bp-auth-header">
                <Link href="/" className="inline-flex max-w-full items-center gap-3" aria-label="Burner Point home">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[0.95rem] border border-brand-green/25 bg-brand-green/10 shadow-[0_0_18px_rgba(0,255,157,0.12)]">
                    <Image src="/assets/logo-mark.svg" alt="" width={22} height={22} className="h-5.5 w-5.5" />
                  </span>
                  <span className="inline-flex min-w-0 items-center rounded-full border border-white/8 bg-black/32 px-3.5 py-1.5">
                    <Image
                      src="/assets/wordmark-white.svg"
                      alt="Burner Point"
                      width={160}
                      height={26}
                      className="h-[0.95rem] w-auto max-w-[9.25rem] sm:max-w-[10rem] lg:max-w-[11rem]"
                    />
                  </span>
                </Link>

                <p className="bp-auth-kicker mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">
                  Account access
                </p>
                <h2 className="bp-auth-title mt-2 text-[clamp(1.7rem,4vw,2.35rem)] font-semibold leading-[0.95]">
                  {title}
                </h2>
                <p className="bp-auth-desc mt-3 max-w-[34rem] text-sm leading-6 text-[#E5E7EB] sm:text-[0.96rem]">
                  {description}
                </p>
              </div>

              <div className="min-h-0 flex-1">{children}</div>

              <div className="bp-auth-helper hidden min-[1366px]:block">
                {helperContent ?? (
                  <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                      <div>
                        <p className="text-sm font-semibold text-white">One account across all Burner Point products.</p>
                        <p className="mt-1.5 text-sm leading-6 text-[#E5E7EB]">
                          Access messaging, numbers, rentals, subscriptions, connectivity, wallet activity, and support.
                        </p>
                        <Link
                          href="/pricing"
                          className="bp-auth-inline-link mt-3 inline-flex items-center gap-2 text-sm font-medium transition hover:gap-3"
                        >
                          View pricing
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
