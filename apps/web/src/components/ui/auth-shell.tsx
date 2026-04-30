import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Globe2, MessageSquareText, ShieldCheck, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const proofItems = [
  {
    icon: ShieldCheck,
    title: 'Simple sign in',
    text: 'Use email, phone, or a trusted account to get back in quickly.',
  },
  {
    icon: Globe2,
    title: 'Global access',
    text: 'Use Burner Point wherever supported products are available.',
  },
  {
    icon: MessageSquareText,
    title: 'Clear next steps',
    text: 'Every screen tells you exactly what to do next.',
  },
  {
    icon: Smartphone,
    title: 'Web and mobile ready',
    text: 'The same clean experience carries across browser and mobile.',
  },
];

export function AuthShell({
  title,
  description,
  children,
  asideTitle,
  asideDescription,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  asideTitle?: string;
  asideDescription?: string;
  className?: string;
}) {
  return (
    <main className="relative h-screen h-[100dvh] overflow-hidden bg-brand-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.16),transparent_34%)]" />
        <div className="absolute bottom-0 right-0 h-[30rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.08),transparent_68%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid h-full w-full max-w-[96rem] gap-6 px-2 py-2 sm:px-4 sm:py-4 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)] lg:items-center lg:px-6 xl:px-8">
        <section className={cn('hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(1,50,32,0.92),rgba(0,0,0,0.96)_58%)] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.42)] lg:flex lg:min-h-[44rem] lg:flex-col lg:justify-between', className)}>
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Burner Point home">
              <Image src="/assets/logo-mark.svg" alt="" width={34} height={34} className="h-8 w-8 sm:h-9 sm:w-9" />
              <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={166} height={26} className="h-[1.15rem] w-auto sm:h-5" />
            </Link>

            <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-brand-green">Account access</p>
            <h1 className="mt-5 max-w-[11ch] text-[3.6rem] font-semibold uppercase leading-[0.9] text-white xl:text-[4.4rem]">
              {asideTitle || 'Private entry that feels calm, direct, and fast.'}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#E5E7EB]">
              {asideDescription || 'Access your private numbers, codes, rentals, travel data, proxies, billing, and support from one clean account.'}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex min-h-11 items-center rounded-full border border-brand-green/24 bg-brand-green/10 px-4 text-sm font-medium text-brand-green">
                Stay Anonymous. Stay Connected.
              </span>
              <span className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-[#E5E7EB]">
                Private by Design
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {proofItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.4rem] border border-white/10 bg-black/22 p-5 backdrop-blur-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/12 text-brand-green">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#E5E7EB]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bp-card mx-auto h-full w-full max-w-[34rem] overflow-hidden rounded-[1.35rem] p-2 sm:p-4 md:p-5 lg:max-w-none lg:rounded-[2rem] lg:p-6">
          <div className="flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-white/8 bg-black/24 p-3 sm:rounded-[1.6rem] sm:p-5 lg:p-6">
            <div className="mb-3 sm:mb-5 lg:mb-6">
              <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Burner Point home">
                <Image src="/assets/logo-mark.svg" alt="" width={34} height={34} className="h-7 w-7 sm:h-8 sm:w-8" />
                <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={156} height={26} className="h-3.5 w-auto sm:h-[1.15rem]" />
              </Link>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-brand-green sm:mt-5 sm:text-[11px] sm:tracking-[0.22em]">Account access</p>
              <h2 className="mt-1.5 text-xl font-semibold leading-none text-white sm:mt-3 sm:text-[2rem] lg:text-[2.35rem]">{title}</h2>
              <p className="mt-1.5 line-clamp-2 max-w-lg text-xs leading-5 text-[#E5E7EB] sm:mt-3 sm:text-sm sm:leading-6">{description}</p>
            </div>

            <div className="min-h-0 flex-1">{children}</div>

            <div className="mt-6 hidden rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 lg:block">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <div>
                  <p className="text-sm font-semibold text-white">One account for every Burner Point product.</p>
                  <p className="mt-1.5 text-sm leading-6 text-[#E5E7EB]">
                    Access numbers, codes, rentals, eSIM orders, proxy plans, billing, and support.
                  </p>
                  <Link href="/pricing" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-green transition hover:gap-3">
                    View pricing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
