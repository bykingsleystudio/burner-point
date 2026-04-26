import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/marketing';
import { BpButton } from '@/components/ui/bp-landing-primitives';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(
  'Private Access',
  'Burner Point keeps sensitive operational access out of the public marketing experience.',
);

export default function ApiPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(1,50,32,0.12),transparent_26%),linear-gradient(180deg,#f8fbf9,#edf5f0)]" />
        </div>

        <div className="relative mx-auto max-w-[72rem] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#07140f,#013220_58%,#07140f)] p-8 text-white shadow-[0_28px_90px_rgba(2,20,12,0.16)] md:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#00FF9D]">
              <ShieldCheck className="h-4 w-4" />
              Private Access
            </div>
            <h1 className="mt-6 text-4xl font-black leading-[0.94] text-white sm:text-5xl">
              Public pages show product information, not sensitive operational details.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/74">
              Burner Point keeps restricted operational access and sensitive setup details out of the public marketing experience. Use your account, support, or approved onboarding channels when deeper access is required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BpButton href="/auth/signup" size="lg">
                Create account
              </BpButton>
              <Link
                href="/contact"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/12 px-7 text-sm font-semibold text-white/82 transition hover:border-[#00FF9D]/28 hover:text-white"
              >
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
