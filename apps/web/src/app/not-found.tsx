import { ArrowRight } from 'lucide-react';
import { BpButton, BpKicker, BpLogo } from '@/components/ui/bp-landing-primitives';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(57,255,20,0.08),transparent_18%),linear-gradient(180deg,rgba(1,50,32,0.34),rgba(0,0,0,0.98)_58%)]" />
      <div className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.78),rgba(0,0,0,0.96))] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="flex justify-center">
          <BpLogo compact />
        </div>
        <BpKicker className="mt-6 block">404</BpKicker>
        <h1 className="mt-4 text-4xl font-black leading-[0.92] text-white md:text-6xl">This line does not exist.</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/58">
          The page you requested could not be found. Head back to the Burner Point homepage and reopen the right flow from there.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <BpButton href="/" variant="primary" size="lg">
            Back Home
            <ArrowRight className="h-4 w-4" />
          </BpButton>
          <BpButton href="/auth/login" variant="outline" size="lg">
            Sign In
          </BpButton>
        </div>
      </div>
    </main>
  );
}
