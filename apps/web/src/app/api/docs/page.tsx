import Link from 'next/link';
import { Lock } from 'lucide-react';
import { MarketingShell } from '@/components/marketing';
import { BpButton } from '@/components/ui/bp-landing-primitives';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(
  'Access Notes',
  'Burner Point does not publish sensitive operational documentation as part of its public marketing flow.',
);

export default function ApiDocsPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.12),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(1,50,32,0.12),transparent_26%),linear-gradient(180deg,#f8fbf9,#edf5f0)]" />
        </div>

        <div className="relative mx-auto max-w-[72rem] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_18px_48px_rgba(2,20,12,0.06)] md:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#00FF9D]/18 bg-[#effcf5] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#00A76A]">
              <Lock className="h-4 w-4" />
              Access Notes
            </div>
            <h1 className="mt-6 text-4xl font-black leading-[0.94] text-[#07140f] sm:text-5xl">
              Public documentation stays customer-facing.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#456052]">
              Burner Point keeps the public site focused on products, pricing, onboarding, support, trust, and account setup. Sensitive operational details are handled through approved access paths where needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BpButton href="/faq" size="lg">
                Open FAQ
              </BpButton>
              <Link
                href="/contact"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-black/10 bg-[#f7fbf8] px-7 text-sm font-semibold text-[#07140f] transition hover:border-[#00FF9D]/28 hover:bg-white"
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
