'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { TELEGRAM_COMMUNITY_HANDLE, TELEGRAM_SUPPORT_HANDLE } from '@/lib/support';
import { cn } from '@/lib/utils';
import { heroTrustItems, productLinks, supportContacts } from '@/lib/homepage-content';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.917z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-white">
    <path d="M16.365 12.79c.024 2.506 2.202 3.34 2.226 3.35-.018.06-.347 1.19-1.142 2.357-.686 1.01-1.398 2.014-2.52 2.035-1.102.02-1.456-.654-2.719-.654-1.262 0-1.656.633-2.698.674-1.083.041-1.909-1.086-2.6-2.092-1.41-2.04-2.486-5.764-1.04-8.275.718-1.247 2.002-2.036 3.395-2.056 1.062-.02 2.066.715 2.719.715.653 0 1.879-.885 3.165-.755.539.022 2.055.218 3.028 1.643-.078.048-1.81 1.054-1.794 3.058Zm-2.013-8.607c.574-.696.963-1.666.857-2.63-.827.034-1.827.55-2.42 1.246-.532.613-1 1.594-.874 2.533.922.072 1.863-.468 2.437-1.149Z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
    <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
    <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
    <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
  </svg>
);

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  onMicrosoftSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  formContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] backdrop-blur-md transition-colors focus-within:border-[#00FF9D]/40 focus-within:bg-[#00FF9D]/[0.05]">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div
    className={cn(
      'flex w-full max-w-[18rem] items-start gap-3 rounded-[1.4rem] border border-black/6 bg-white p-4 shadow-[0_14px_40px_rgba(2,20,12,0.08)]',
      delay,
    )}
  >
    <img src={testimonial.avatarSrc} className="h-10 w-10 rounded-2xl object-cover" alt={testimonial.name} />
    <div className="text-sm leading-snug">
      <p className="font-medium text-[#07140f]">{testimonial.name}</p>
      <p className="text-[#6f877b]">{testimonial.handle}</p>
      <p className="mt-1 text-[#3c584b]">{testimonial.text}</p>
    </div>
  </div>
);

function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-3 py-3.5 text-xs font-medium text-white transition-colors hover:border-[#00FF9D]/30 hover:bg-[#00FF9D]/[0.05] sm:min-h-[54px] sm:px-4 sm:py-4 sm:text-sm"
    >
      {icon}
      <span className="text-center">{label}</span>
    </button>
  );
}

export const SignInPage: React.FC<SignInPageProps> = ({
  title = 'Sign in to Burner Point.',
  description = 'Manage private numbers, codes, rentals, travel data, proxies, billing, and support from one account.',
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onAppleSignIn,
  onMicrosoftSignIn,
  onResetPassword,
  onCreateAccount,
  formContent,
  footerContent,
  children,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const renderCustomContent = children || formContent;

  return (
    <div className="relative min-h-screen bg-[linear-gradient(180deg,#f8fbf9,#edf5f0)] py-4 text-white sm:py-6 lg:py-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_88%_14%,rgba(1,50,32,0.12),transparent_20%)]" />
        <div className="absolute -left-12 top-10 h-72 w-72 rounded-full bg-[#00FF9D]/12 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#9FA6B2]/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[88rem] flex-col items-center justify-center gap-6 px-4 sm:px-6 lg:flex-row lg:items-stretch lg:px-8">
        {/* Left Auth Card */}
        <section className="flex w-full max-w-[28rem] flex-col overflow-hidden rounded-[1.45rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.9),rgba(0,0,0,0.98))] p-4 shadow-[0_40px_110px_rgba(0,0,0,0.28)] sm:max-w-[30rem] sm:p-5 lg:max-w-[34rem] lg:rounded-[2rem] lg:p-6 xl:p-7">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Link href="/" className="inline-flex max-w-full items-center gap-2 sm:gap-2.5" aria-label="Burner Point home">
              <Image src="/assets/logo-mark.svg" alt="" width={34} height={34} className="h-7 w-7 flex-none sm:h-8 sm:w-8" />
              <span className="min-w-0 rounded-full bg-white/[0.04] px-2 py-1 sm:px-2.5 sm:py-1.5">
                <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={166} height={26} className="h-3 w-auto max-w-[6rem] sm:h-3.5 sm:max-w-[8rem] lg:h-4 lg:max-w-[10rem]" />
              </span>
            </Link>
            <Link href="/pricing" className="hidden text-xs font-medium text-white transition hover:text-white sm:inline-flex sm:text-sm">
              Pricing
            </Link>
          </div>

          {/* Title Section */}
          <div className="bp-auth-copy mt-3 sm:mt-4">
            <p className="bp-auth-kicker font-mono text-[9px] uppercase tracking-[0.18em] text-[#00FF9D] sm:text-[10px] sm:tracking-[0.24em]">Account access</p>
            {title ? (
              <h1 className="bp-auth-title mt-1.5 text-lg font-black leading-none text-white sm:mt-2 sm:text-xl lg:mt-2.5 lg:text-2xl xl:text-[2.4rem]">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="bp-auth-desc mt-1.5 line-clamp-2 text-xs leading-5 text-[#E5E7EB] sm:mt-2 sm:text-sm sm:leading-6 lg:mt-2 lg:text-base lg:leading-6">
                {description}
              </p>
            ) : null}
          </div>

          {/* Trust Badges - Desktop Only */}
          <div className="mt-3 hidden flex-wrap gap-2 sm:flex lg:mt-3">
            {heroTrustItems.slice(0, 3).map((item) => (
              <span
                key={item}
                className="inline-flex min-h-7 items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-[9px] font-medium text-[#E5E7EB] sm:min-h-8 sm:px-3 sm:text-xs"
              >
                {item}
              </span>
            ))}
          </div>

          {/* Form Content */}
          <div className="mt-3 flex-1 sm:mt-4 lg:mt-4">
            {renderCustomContent ? (
              <div>{renderCustomContent}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={onGoogleSignIn} />
                  <SocialButton icon={<AppleIcon />} label="Continue with Apple" onClick={onAppleSignIn} />
                  <SocialButton icon={<MicrosoftIcon />} label="Continue with Microsoft" onClick={onMicrosoftSignIn} />
                </div>

                <div className="relative my-3.5 flex items-center justify-center sm:my-4">
                  <span className="w-full border-t border-white/10" />
                  <span className="absolute bg-[#04120C] px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#E5E7EB] sm:px-4 sm:text-[11px] sm:tracking-[0.22em]">
                    OR
                  </span>
                </div>

                <form className="space-y-3.5 sm:space-y-4" onSubmit={onSignIn}>
                  <div>
                    <label className="text-sm font-medium text-white">Email or phone</label>
                    <GlassInputWrapper>
                      <input
                        name="identifier"
                        type="text"
                        placeholder="you@example.com or +14155550182"
                        className="w-full rounded-2xl bg-transparent p-3.5 text-sm text-white placeholder:text-[#E5E7EB] focus:outline-none sm:p-4"
                      />
                    </GlassInputWrapper>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white">Password</label>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="w-full rounded-2xl bg-transparent p-3.5 pr-12 text-sm text-white placeholder:text-[#E5E7EB] focus:outline-none sm:p-4"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-[#E5E7EB] transition-colors hover:text-white" />
                          ) : (
                            <Eye className="h-5 w-5 text-[#E5E7EB] transition-colors hover:text-white" />
                          )}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <label className="flex items-center gap-2 text-[#E5E7EB]">
                      <input type="checkbox" name="rememberMe" className="h-4 w-4 accent-[#00FF9D]" />
                      <span>Keep me signed in</span>
                    </label>
                    <button
                      type="button"
                      onClick={onResetPassword}
                      className="text-[#00FF9D] transition-colors hover:text-[#39FF14]"
                    >
                      Reset password
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-[1.15rem] bg-[#00FF9D] py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#39FF14] sm:py-4 sm:text-sm"
                  >
                    Continue
                  </button>
                </form>

                <p className="mt-3.5 text-center text-xs text-white/72 sm:mt-4 sm:text-sm">
                  New to Burner Point?{' '}
                  <button
                    type="button"
                    onClick={onCreateAccount}
                    className="text-[#00FF9D] transition-colors hover:text-[#39FF14]"
                  >
                    Create account
                  </button>
                </p>
              </>
            )}

            {footerContent ? <div className="pt-3">{footerContent}</div> : null}
          </div>

          {/* Helper Card - Only show on XL screens where there's room */}
          <div className="mt-4 hidden rounded-[1.4rem] border border-[#00FF9D]/16 bg-[#00FF9D]/[0.06] p-3.5 xl:block">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[#00FF9D]" />
              <div>
                <p className="text-sm font-semibold text-white">One account across all Burner Point products.</p>
                <p className="mt-1.5 text-sm leading-6 text-[#E5E7EB]">
                  Sign in once to access numbers, verification, rentals, eSIM orders, proxy access, billing, and support.
                </p>
                <Link href="/#products" className="mt-2.5 inline-flex items-center gap-2 text-sm font-medium text-[#00FF9D] transition hover:gap-3">
                  Explore products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Right Marketing Panel - Only on large screens (1100px+) */}
        <section className="relative hidden w-full max-w-[32rem] overflow-hidden rounded-[2rem] border border-black/6 bg-white p-5 shadow-[0_36px_100px_rgba(2,20,12,0.12)] lg:flex lg:max-w-[36rem] xl:block xl:w-auto xl:flex-1 2xl:max-w-[42rem]">
          {heroImageSrc ? (
            <div
              className="absolute inset-4 rounded-[2rem] bg-cover bg-center opacity-10"
              style={{ backgroundImage: `url(${heroImageSrc})` }}
            />
          ) : null}

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00A76A]">Stay Anonymous. Stay Connected.</p>
              <h2 className="mt-2.5 max-w-xl text-xl font-black leading-[0.92] text-[#07140f] sm:text-2xl lg:mt-3 lg:text-[2.2rem] xl:text-[2.6rem] 2xl:text-[3rem]">
                Private access, without the noise.
              </h2>
              <p className="mt-2.5 max-w-lg text-sm leading-6 text-[#2f4d40] sm:text-base lg:mt-2.5 lg:leading-7">
                Sign in quickly, manage your privacy tools, and keep support close when you need help.
              </p>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:mt-6">
              {productLinks.slice(0, 4).map((item, index) => (
                <article
                  key={item.name}
                  className={cn(
                    'rounded-[1.2rem] border p-3.5',
                    index === 0
                      ? 'border-transparent bg-[linear-gradient(135deg,#07140f,#013220)] text-white shadow-[0_20px_48px_rgba(2,20,12,0.14)]'
                      : 'border-black/6 bg-[#f7fbf8] text-[#07140f]',
                  )}
                >
                  <p className={cn('font-mono text-[9px] uppercase tracking-[0.2em]', index === 0 ? 'text-[#00FF9D]' : 'text-[#00A76A]')}>
                    {item.name}
                  </p>
                  <p className={cn('mt-1.5 text-xs leading-5', index === 0 ? 'text-white/78' : 'text-[#2f4d40]')}>
                    {item.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-3.5 xl:mt-6 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="rounded-[1.35rem] border border-black/6 bg-[#f7fbf8] p-3.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00A76A]">Support contacts</p>
                <div className="mt-2 space-y-1.5 text-xs text-[#2f4d40] sm:text-sm">
                  <a href={`mailto:${supportContacts.email}`} className="block transition hover:text-[#07140f]">
                    {supportContacts.email}
                  </a>
                  <a href={supportContacts.telegramPrimary} target="_blank" rel="noreferrer" className="block transition hover:text-[#07140f]">
                    Telegram: {TELEGRAM_SUPPORT_HANDLE}
                  </a>
                  <a href={supportContacts.telegramApp} target="_blank" rel="noreferrer" className="block transition hover:text-[#07140f]">
                    Telegram: {TELEGRAM_COMMUNITY_HANDLE}
                  </a>
                </div>
              </div>

              {testimonials.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <TestimonialCard testimonial={testimonials[0]} delay="" />
                  {testimonials[1] ? <TestimonialCard testimonial={testimonials[1]} delay="" /> : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export { AppleIcon, GoogleIcon, MicrosoftIcon, GlassInputWrapper, TestimonialCard };

