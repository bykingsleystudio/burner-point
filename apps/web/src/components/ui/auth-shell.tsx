import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AuthShell({
  title,
  description,
  children,
  className,
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
    <main className="bp-auth-page relative flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-8 sm:px-6">
      <div className="relative z-10 w-full max-w-[30rem]">
        <div className={cn('bp-card bp-auth-card w-full overflow-hidden rounded-[1.6rem] border border-[rgba(0,255,157,0.12)] bg-[rgba(8,15,12,0.82)] p-3 sm:p-4', className)}>
          <div className="bp-auth-surface flex flex-col gap-5 rounded-[1.25rem] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(12,20,17,0.96),rgba(3,9,7,0.98))] p-4 sm:p-6">
            <div className="bp-auth-header text-center">
              <Link href="/" className="inline-flex items-center justify-center gap-3" aria-label="Burner Point home">
                <Image src="/assets/burner-point-logo-icon-gradient.svg" alt="Burner Point" width={52} height={52} className="h-10 w-10" />
                <span className="relative inline-flex h-5 w-[180px] items-center">
                  <Image src="/assets/burner-point-wordmark-black.svg" alt="Burner Point" width={180} height={32} className="bp-wordmark-light h-5 w-auto" />
                  <Image src="/assets/burner-point-wordmark-white.svg" alt="Burner Point" width={180} height={32} className="bp-wordmark-dark absolute inset-0 h-5 w-auto" />
                  <Image src="/assets/burner-point-wordmark-gradient.svg" alt="Burner Point" width={180} height={32} className="bp-wordmark-gradient absolute inset-0 h-5 w-auto" />
                </span>
              </Link>

              <p className="bp-auth-kicker mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">
                Account access
              </p>
              <h2 className="bp-auth-title mt-2 text-[clamp(1.8rem,4vw,2.35rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                {title}
              </h2>
              <p className="bp-auth-desc mt-3 text-sm leading-6 text-[rgba(229,231,235,0.82)] sm:text-[0.96rem]">
                {description}
              </p>
            </div>

            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
