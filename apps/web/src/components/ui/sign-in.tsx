'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path
      d="M6.2 2.5h3.2c.4 0 .8.3.9.7l.9 4.3c.1.4-.1.8-.5 1l-1.8.9c1 2 2.6 3.6 4.6 4.6l.9-1.8c.2-.4.7-.6 1-.5l4.3.9c.4.1.7.5.7.9v3.2c0 .5-.4 1-.9 1C9.6 21.5 2.5 14.4 2.5 5.4c0-.5.4-.9.9-.9Z"
      fill="#00FF9D"
    />
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
  onPhoneSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  formContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] backdrop-blur-md transition-colors focus-within:border-brand-green/60 focus-within:bg-brand-green/[0.08]">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div
    className={cn(
      'animate-testimonial flex w-64 items-start gap-3 rounded-3xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl',
      delay,
    )}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={testimonial.avatarSrc} className="h-10 w-10 rounded-2xl object-cover" alt={testimonial.name} />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-white/48">{testimonial.handle}</p>
      <p className="mt-1 text-white/80">{testimonial.text}</p>
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
      className="animate-element flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4 text-sm font-medium text-white transition-colors hover:border-brand-green/35 hover:bg-brand-green/[0.06]"
    >
      {icon}
      {label}
    </button>
  );
}

export const SignInPage: React.FC<SignInPageProps> = ({
  title = null,
  description = null,
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onAppleSignIn,
  onMicrosoftSignIn,
  onPhoneSignIn,
  onResetPassword,
  onCreateAccount,
  formContent,
  footerContent,
  children,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const renderCustomContent = children || formContent;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-brand-black font-sans text-white md:flex-row">
      <section className="relative flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="bp-grid-bg absolute inset-0 opacity-60" />
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,255,157,0.18),transparent_68%)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.12),transparent_68%)] blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-xl">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
              <Image src="/assets/logo-mark.svg" alt="" width={36} height={36} className="h-9 w-9" />
              <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={188} height={24} className="h-6 w-auto" />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.68),rgba(0,0,0,0.96)_44%,rgba(0,0,0,0.98))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.42)] sm:p-8">
            <div className="flex flex-col gap-5">
              {title ? (
                <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="animate-element animate-delay-200 max-w-xl text-sm leading-7 text-white/62 sm:text-base">
                  {description}
                </p>
              ) : null}

              {renderCustomContent ? (
                <div className="animate-element animate-delay-300">{renderCustomContent}</div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={onGoogleSignIn} />
                    <SocialButton icon={<AppleIcon />} label="Continue with Apple" onClick={onAppleSignIn} />
                    <SocialButton icon={<MicrosoftIcon />} label="Continue with Microsoft" onClick={onMicrosoftSignIn} />
                    <SocialButton icon={<PhoneIcon />} label="Continue with Phone" onClick={onPhoneSignIn} />
                  </div>

                  <div className="animate-element animate-delay-400 relative flex items-center justify-center">
                    <span className="w-full border-t border-white/10" />
                    <span className="absolute bg-[#04120C] px-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/34">
                      OR
                    </span>
                  </div>

                  <form className="space-y-5" onSubmit={onSignIn}>
                    <div className="animate-element animate-delay-500">
                      <label className="text-sm font-medium text-white/64">Email Address</label>
                      <GlassInputWrapper>
                        <input
                          name="email"
                          type="email"
                          placeholder="Enter your email address"
                          className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/28 focus:outline-none"
                        />
                      </GlassInputWrapper>
                    </div>

                    <div className="animate-element animate-delay-600">
                      <label className="text-sm font-medium text-white/64">Password</label>
                      <GlassInputWrapper>
                        <div className="relative">
                          <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-white placeholder:text-white/28 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-white/46 transition-colors hover:text-white" />
                            ) : (
                              <Eye className="h-5 w-5 text-white/46 transition-colors hover:text-white" />
                            )}
                          </button>
                        </div>
                      </GlassInputWrapper>
                    </div>

                    <div className="animate-element animate-delay-700 flex items-center justify-between text-sm">
                      <label className="flex items-center gap-3 text-white/76">
                        <input type="checkbox" name="rememberMe" className="h-4 w-4 accent-[#00FF9D]" />
                        <span>Keep me signed in</span>
                      </label>
                      <button
                        type="button"
                        onClick={onResetPassword}
                        className="text-brand-green transition-colors hover:text-[#39FF14]"
                      >
                        Reset password
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="animate-element animate-delay-800 w-full rounded-2xl bg-[#00FF9D] py-4 font-medium text-black transition-colors hover:bg-[#39FF14]"
                    >
                      Continue
                    </button>
                  </form>

                  <p className="animate-element animate-delay-900 text-center text-sm text-white/48">
                    New to Burner Point?{' '}
                    <button
                      type="button"
                      onClick={onCreateAccount}
                      className="text-brand-green transition-colors hover:text-[#39FF14]"
                    >
                      Create account
                    </button>
                  </p>
                </>
              )}

              {footerContent ? <div className="pt-2">{footerContent}</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="relative hidden flex-1 overflow-hidden border-l border-white/8 md:block">
        {heroImageSrc ? (
          <div
            className="absolute inset-4 rounded-[2rem] bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(0,255,157,0.14),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(57,255,20,0.08),transparent_22%),linear-gradient(180deg,rgba(1,50,32,0.72),rgba(0,0,0,0.96)_54%)]" />
        <div className="absolute inset-4 rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]" />

        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={`auth-particle-${index}`}
              className="absolute rounded-full bg-brand-green/70 shadow-[0_0_18px_rgba(0,255,157,0.55)]"
              style={{
                width: `${index % 3 === 0 ? 7 : 4}px`,
                height: `${index % 3 === 0 ? 7 : 4}px`,
                left: `${12 + index * 8}%`,
                top: `${10 + ((index * 11) % 62)}%`,
                opacity: 0.18 + (index % 4) * 0.12,
                animation: `bp-orbit-drift ${7 + index * 0.6}s ease-in-out ${index * 0.18}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brand-green">Private entry</p>
            <h2 className="mt-4 max-w-lg text-[2.6rem] font-semibold leading-[0.96] text-white xl:text-[3.4rem]">
              One account for numbers, verification, routing, and support.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/60">
              OAuth, password access, recovery, phone verification, and 2FA are staged to move forward cleanly instead of repeating the same decision twice.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {[
              ['BP Verify Hub', 'OTP capture, SMS routing, and live code delivery.'],
              ['BP Messenger', 'Messages, voice, voicemail, and private threads.'],
              ['BP Secure Tunnel', 'Integrated protection and calmer session control.'],
              ['Billing & Support', 'Wallet, renewals, receipts, and scoped support paths.'],
            ].map(([titleText, text], index) => (
              <article
                key={titleText}
                className="animate-slide-right rounded-[1.45rem] border border-white/8 bg-black/28 p-5 backdrop-blur-xl"
                style={{ animationDelay: `${220 + index * 110}ms` }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">{titleText}</p>
                <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
              </article>
            ))}
          </div>

          {testimonials.length > 0 ? (
            <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] ? (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              ) : null}
              {testimonials[2] ? (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export { AppleIcon, GoogleIcon, MicrosoftIcon, PhoneIcon, GlassInputWrapper, TestimonialCard };
