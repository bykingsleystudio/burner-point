'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bp-primary-action text-black',
  secondary: 'bp-secondary-action text-white/82',
  ghost: 'bp-ghost-action text-white/66 hover:text-brand-green',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 py-3 text-xs',
  md: 'min-h-12 px-6 py-4 text-sm',
  lg: 'min-h-14 px-8 py-4 text-sm',
};

export function BpButton({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon,
  type = 'button',
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}) {
  const classes = cx(
    'inline-flex items-center justify-center gap-2 rounded-bp font-semibold uppercase tracking-[0.08em] transition duration-200 ease-in-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );

  const content = (
    <>
      {children}
      {icon ?? (variant === 'primary' ? <ArrowRight className="h-4 w-4" /> : null)}
    </>
  );

  if (href) {
    const external = href.startsWith('http') || href.startsWith('mailto:');
    if (external) {
      return (
        <a href={href} className={classes} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} aria-disabled={buttonProps.disabled || undefined} {...buttonProps}>
      {content}
    </button>
  );
}

export function BpCard({
  children,
  className,
  as: Component = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
}) {
  return <Component className={cx('bp-card rounded-bp-lg p-5 md:p-7', className)}>{children}</Component>;
}

export function BpInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('bp-input', className)} {...props} />;
}

export function BpTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('bp-input min-h-32 resize-y', className)} {...props} />;
}

export function BpAccordion({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="bp-accordion bp-card group rounded-bp-lg p-5 transition hover:border-brand-green/22 md:p-6">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 font-mono text-sm font-semibold uppercase text-white [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-bp border border-brand-green/15 bg-brand-green/10 text-brand-green transition group-open:rotate-180">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <p className="pt-5 text-sm leading-7 text-white/58">{answer}</p>
    </details>
  );
}

export function BpTrustBadge({ label, href }: { label: string; href?: string }) {
  const content = (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/8 bg-white/[0.025] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/48 transition hover:border-brand-green/30 hover:text-brand-green">
      <ShieldCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function BpSupportWidget() {
  return (
    <BpCard className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Support</p>
      <h3 className="mt-3 text-lg font-semibold uppercase text-white">Need privacy-safe help?</h3>
      <p className="mt-3 text-sm leading-7 text-white/58">
        Use scoped references for verification, rentals, billing, eSIM, proxies, VPN, API, or account issues.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <BpButton href="mailto:info.burnerpoint@gmail.com" variant="secondary" size="sm" icon={<Mail className="h-4 w-4" />}>
          Email Support
        </BpButton>
        <BpButton href="https://t.me/burnerpoint" variant="ghost" size="sm">
          Telegram
        </BpButton>
      </div>
    </BpCard>
  );
}

export function BpEmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="bp-state">
      <ShieldCheck className="h-8 w-8 text-brand-green" />
      <h3 className="mt-4 text-base font-semibold uppercase text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/56">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function BpLoadingState({ label = 'Loading secure state...' }: { label?: string }) {
  return (
    <div className="bp-state" role="status" aria-live="polite" aria-busy="true">
      <Loader2 className="bp-loading-pulse h-8 w-8 text-brand-green" />
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-white/52">{label}</p>
    </div>
  );
}

export function BpErrorState({
  title = 'Something needs attention',
  text,
}: {
  title?: string;
  text: string;
}) {
  return (
    <div className="bp-state border-red-400/20 bg-red-500/[0.035]" role="alert">
      <AlertTriangle className="h-8 w-8 text-red-300" />
      <h3 className="mt-4 text-base font-semibold uppercase text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/56">{text}</p>
    </div>
  );
}

export function BpTabs({
  tabs,
  active,
}: {
  tabs: Array<{ label: string; href: string }>;
  active?: string;
}) {
  return (
    <nav className="bp-tabs" aria-label="Section tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cx('bp-tab', active === tab.href && 'bp-tab-active')}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function BpModalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-bp-lg border border-brand-border bg-brand-surface p-5 shadow-[0_34px_100px_rgba(0,0,0,0.48)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Modal</p>
      <h2 className="mt-2 text-xl font-semibold uppercase text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function BpDropdownShell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="group relative [&_summary::-webkit-details-marker]:hidden">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-bp border border-white/10 bg-white/[0.025] px-4 py-2 text-sm font-semibold text-white/72 transition hover:border-brand-green/30 hover:text-brand-green">
        {label}
        <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 min-w-56 rounded-bp-lg border border-brand-border bg-brand-surface p-3 shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
        {children}
      </div>
    </details>
  );
}

export function BpPricingCard({
  title,
  price,
  text,
  features,
  href,
}: {
  title: string;
  price: string;
  text: string;
  features: string[];
  href: string;
}) {
  return (
    <BpCard as="article" className="h-full">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">{title}</p>
      <p className="mt-4 font-mono text-5xl font-semibold text-brand-green">{price}</p>
      <p className="mt-4 text-sm leading-7 text-white/58">{text}</p>
      <ul className="mt-6 space-y-3 text-sm text-white/64">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 flex-none text-brand-green" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <BpButton href={href} variant="secondary" className="mt-7 w-full">
        Select
      </BpButton>
    </BpCard>
  );
}

export function BpFeatureCard({
  icon: Icon = ShieldCheck,
  title,
  text,
  meta,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  meta?: string;
}) {
  return (
    <BpCard as="article" className="h-full">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-bp-md border border-brand-green/20 bg-brand-green/10">
          <Icon className="h-5 w-5 text-brand-green" />
        </span>
        {meta ? <span className="rounded-bp border border-white/8 px-2 py-1 font-mono text-[10px] uppercase text-white/44">{meta}</span> : null}
      </div>
      <h3 className="mt-5 font-mono text-lg font-semibold uppercase text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-white/58">{text}</p>
    </BpCard>
  );
}
