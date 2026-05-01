'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footerContent?: React.ReactNode;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="group relative rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-[#00FF9D]/30 focus-within:border-[#00FF9D]/50 focus-within:shadow-[0_0_20px_rgba(0,255,157,0.15)]">
    {children}
  </div>
);

export const SignInPage: React.FC<SignInPageProps> = ({
  title = 'Sign in to Burner Point',
  description,
  children,
  footerContent,
}) => {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#013220] via-[#000000] to-[#03110B] px-4 py-12">
      {/* Animated background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-[#00FF9D]/10 blur-3xl" />
        <div className="absolute -right-1/4 bottom-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-[#39FF14]/10 blur-3xl" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main auth card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#07140F]/95 to-[#013220]/95 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* Subtle inner glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00FF9D]/[0.03] to-transparent" />
          
          {/* Logo Section */}
          <div className="relative mb-6 flex flex-col items-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF9D] to-[#39FF14] p-[2px] shadow-[0_0_30px_rgba(0,255,157,0.3)]">
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#013220] to-black p-2.5">
                <Image
                  src="/assets/logo-mark.svg"
                  alt="Burner Point"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            {description && (
              <p className="mt-2.5 text-center text-sm text-[#9FA6B2]">{description}</p>
            )}
          </div>

          {/* Content */}
          <div className="relative space-y-4">
            {children}
          </div>

          {/* Footer */}
          {footerContent && (
            <div className="relative mt-6 border-t border-white/10 pt-4">
              {footerContent}
            </div>
          )}
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-[#9FA6B2]">
          By continuing, you agree to our{' '}
          <Link href="/terms-of-service" className="text-[#00FF9D] transition-colors hover:text-[#39FF14] hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="text-[#00FF9D] transition-colors hover:text-[#39FF14] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export { GlassInputWrapper };
