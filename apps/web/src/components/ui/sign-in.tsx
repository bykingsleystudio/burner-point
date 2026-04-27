'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
      'flex w-72 items-start gap-3 rounded-[1.4rem] border border-black/6 bg-white p-4 shadow-[0_14px_40px_rgba(2,20,12,0.08)]',
      delay,
    )}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
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
      className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium text-white transition-colors hover:border-[#00FF9D]/30 hover:bg-[#00FF9D]/[0.05]"
    >
      {icon}
      {label}
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
    <div className="relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f8fbf9,#edf5f0)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_88%_14%,rgba(1,50,32,0.12),transparent_20%)]" />
        <div className="absolute -left-12 top-10 h-72 w-72 rounded-full bg-[#00FF9D]/12 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#9FA6B2]/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-[96rem] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:px-8 lg:py-6">
        <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.9),rgba(0,0,0,0.98))] p-5 shadow-[0_40px_110px_rgba(0,0,0,0.28)] sm:p-6 lg:p-7">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Burner Point home">
              <Image src="/assets/logo-mark.svg" alt="" width={34} height={34} className="h-8 w-8 sm:h-9 sm:w-9" />
              <span className="rounded-full bg-white/[0.04] px-3 py-2">
                <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={166} height={26} className="h-[1.15rem] w-auto sm:h-5" />
              </span>
            </Link>
            <Link href="/pricing" className="hidden text-sm font-medium text-white/72 transition hover:text-white sm:inline-flex">
              Pricing
            </Link>
          </div>

          <div className="mt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF9D]">Account access</p>
            {title ? (
              <h1 className="mt-4 text-4xl font-black leading-[0.94] text-white sm:text-[2.8rem]">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {heroTrustItems.slice(0, 3).map((item) => (
              <span
                key={item}
                className="inline-flex min-h-9 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-white/72"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8">
            {renderCustomContent ? (
              <div>{renderCustomContent}</div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={onGoogleSignIn} />
                  <SocialButton icon={<AppleIcon />} label="Continue with Apple" onClick={onAppleSignIn} />
                  <SocialButton icon={<MicrosoftIcon />} label="Continue with Microsoft" onClick={onMicrosoftSignIn} />
                </div>

                <div className="relative my-5 flex items-center justify-center">
                  <span className="w-full border-t border-white/10" />
                  <span className="absolute bg-[#04120C] px-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/70">
                    OR
                  </span>
                </div>

                <form className="space-y-5" onSubmit={onSignIn}>
                  <div>
                    <label className="text-sm font-medium text-white/76">Email or phone</label>
                    <GlassInputWrapper>
                      <input
                        name="identifier"
                        type="text"
                        placeholder="you@example.com or +14155550182"
                        className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/56 focus:outline-none"
                      />
                    </GlassInputWrapper>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/76">Password</label>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-white placeholder:text-white/56 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-white/70 transition-colors hover:text-white" />
                          ) : (
                            <Eye className="h-5 w-5 text-white/70 transition-colors hover:text-white" />
                          )}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-3 text-white/76">
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
                    className="w-full rounded-[1.15rem] bg-[#00FF9D] py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#39FF14]"
                  >
                    Continue
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-white/72">
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

          <div className="mt-8 rounded-[1.4rem] border border-[#00FF9D]/16 bg-[#00FF9D]/[0.06] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[#00FF9D]" />
              <div>
                <p className="text-sm font-semibold text-white">One account across all Burner Point products.</p>
                <p className="mt-1.5 text-sm leading-6 text-white/66">
                  Sign in once to access numbers, verification, rentals, eSIM orders, proxy access, billing, and support.
                </p>
                <Link href="/#products" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#00FF9D] transition hover:gap-3">
                  Explore products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden rounded-[2rem] border border-black/6 bg-white p-7 shadow-[0_36px_100px_rgba(2,20,12,0.12)] lg:flex lg:flex-col lg:justify-between">
          {heroImageSrc ? (
            <div
              className="absolute inset-4 rounded-[2rem] bg-cover bg-center opacity-10"
              style={{ backgroundImage: `url(${heroImageSrc})` }}
            />
          ) : null}

          <div className="relative z-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00A76A]">Stay Anonymous. Stay Connected.</p>
            <h2 className="mt-4 max-w-xl text-[3rem] font-black leading-[0.92] text-[#07140f] xl:text-[3.7rem]">
              Private access, without the noise.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#2f4d40]">
              Sign in quickly, manage your privacy tools, and keep support close when you need help.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 xl:grid-cols-2">
            {productLinks.slice(0, 4).map((item, index) => (
              <article
                key={item.name}
                className={cn(
                  'rounded-[1.35rem] border p-5',
                  index === 0
                    ? 'border-transparent bg-[linear-gradient(135deg,#07140f,#013220)] text-white shadow-[0_20px_48px_rgba(2,20,12,0.14)]'
                    : 'border-black/6 bg-[#f7fbf8] text-[#07140f]',
                )}
              >
                <p className={cn('font-mono text-[10px] uppercase tracking-[0.22em]', index === 0 ? 'text-[#00FF9D]' : 'text-[#00A76A]')}>
                  {item.name}
                </p>
                <p className={cn('mt-3 text-sm leading-7', index === 0 ? 'text-white/78' : 'text-[#2f4d40]')}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="relative z-10 mt-8 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="rounded-[1.45rem] border border-black/6 bg-[#f7fbf8] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00A76A]">Support contacts</p>
              <div className="mt-3 space-y-2 text-sm text-[#2f4d40]">
                <a href={`mailto:${supportContacts.email}`} className="block transition hover:text-[#07140f]">
                  {supportContacts.email}
                </a>
                <a href={supportContacts.telegramPrimary} target="_blank" rel="noreferrer" className="block transition hover:text-[#07140f]">
                  Telegram: @burnerpoint
                </a>
                <a href={supportContacts.telegramApp} target="_blank" rel="noreferrer" className="block transition hover:text-[#07140f]">
                  Telegram: @burnerpointapp
                </a>
              </div>
            </div>

            {testimonials.length > 0 ? (
              <div className="hidden xl:flex xl:flex-col xl:gap-3">
                <TestimonialCard testimonial={testimonials[0]} delay="" />
                {testimonials[1] ? <TestimonialCard testimonial={testimonials[1]} delay="" /> : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export { AppleIcon, GoogleIcon, MicrosoftIcon, GlassInputWrapper, TestimonialCard };

