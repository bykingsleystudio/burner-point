'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, lazy, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const Spline = lazy(() => import('@splinetool/react-spline'));

type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg';

type BpButtonProps = {
  href?: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#00FF9D] text-black shadow-[0_16px_40px_rgba(0,255,157,0.18),inset_0_1px_0_rgba(255,255,255,0.32)] hover:-translate-y-0.5 hover:bg-[#39FF14]',
  outline:
    'border border-white/14 bg-[linear-gradient(135deg,rgba(159,166,178,0.14),rgba(0,0,0,0.2))] text-white hover:-translate-y-0.5 hover:border-[#00FF9D]/36 hover:text-[#00FF9D]',
  ghost:
    'border border-transparent bg-transparent text-[#E5E7EB] hover:border-white/10 hover:bg-white/[0.03] hover:text-white',
};

const buttonSizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 py-3 text-xs tracking-[0.18em]',
  lg: 'min-h-14 px-7 py-4 text-sm tracking-[0.18em]',
};

export function BpLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
      <Image src="/assets/burner-point-logo-icon-gradient.svg" alt="Burner Point" width={compact ? 40 : 52} height={compact ? 40 : 52} priority className={compact ? 'h-10 w-10' : 'h-10 w-10'} />
      {!compact ? (
        <Image src="/assets/burner-point-wordmark-gradient.svg" alt="Burner Point" width={180} height={32} priority className="h-5 w-auto sm:h-6" />
      ) : null}
    </Link>
  );
}

export function BpButton({
  href,
  children,
  className,
  variant = 'primary',
  size = 'md',
  external = false,
  onClick,
  type = 'button',
  disabled = false,
}: BpButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase transition duration-200 ease-out active:scale-[0.98]',
    disabled && 'pointer-events-none opacity-55',
    buttonStyles[variant],
    buttonSizes[size],
    className,
  );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}

export function BpKicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-[#00FF9D]', className)}>
      {children}
    </p>
  );
}

export function BpSectionHeading({
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
    <div className={cn('max-w-4xl', centered ? 'mx-auto text-center' : '')}>
      <BpKicker>{kicker}</BpKicker>
      <h2 className="mt-4 font-sans text-4xl font-black leading-[0.94] text-white sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {body ? <p className="mt-5 text-base leading-8 text-[#E5E7EB]">{body}</p> : null}
    </div>
  );
}

export function BpSurface({
  children,
  className,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.78),rgba(0,0,0,0.94))] backdrop-blur-xl',
        glow ? 'shadow-[0_30px_90px_rgba(0,255,157,0.08)]' : 'shadow-[0_24px_72px_rgba(0,0,0,0.3)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TelecomSplineScene({
  scene,
  fallback,
  className,
}: {
  scene?: string;
  fallback: ReactNode;
  className?: string;
}) {
  if (!scene) return <>{fallback}</>;

  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">{fallback}</div>}>
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
