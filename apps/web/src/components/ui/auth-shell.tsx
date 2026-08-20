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
        <div className={cn('bp-card bp-auth-card w-full overflow-hidden rounded-[1.75rem] p-3 sm:p-4', className)}>
          <div className="bp-auth-surface flex flex-col gap-5 rounded-[1.4rem] p-4 sm:p-6">
            <div className="bp-auth-header text-center">
              <Link href="/" className="inline-flex items-center justify-center gap-3" aria-label="Burner Point home">
                <Image src="/assets/burner-point-combination-mark-gradient.svg" alt="Burner Point" width={220} height={64} className="h-10 w-auto max-w-full" />
              </Link>

              <p className="bp-auth-kicker mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">
                Account access
              </p>
              <h2 className="bp-auth-title mt-2 text-[clamp(1.75rem,4vw,2.35rem)] font-semibold leading-[0.95]">
                {title}
              </h2>
              <p className="bp-auth-desc mt-3 text-sm leading-6 text-[#E5E7EB] sm:text-[0.96rem]">
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
