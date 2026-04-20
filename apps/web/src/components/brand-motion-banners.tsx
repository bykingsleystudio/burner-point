import Link from 'next/link';
import {
  CalendarDays,
  Code2,
  Globe2,
  Lock,
  Server,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

const COVERAGE = [
  { iso: 'US', flag: '🇺🇸', mot: 'bp-flag-mot-0' },
  { iso: 'CA', flag: '🇨🇦', mot: 'bp-flag-mot-1' },
  { iso: 'GB', flag: '🇬🇧', mot: 'bp-flag-mot-2' },
  { iso: 'DE', flag: '🇩🇪', mot: 'bp-flag-mot-3' },
  { iso: 'FR', flag: '🇫🇷', mot: 'bp-flag-mot-4' },
  { iso: 'AU', flag: '🇦🇺', mot: 'bp-flag-mot-5' },
  { iso: 'JP', flag: '🇯🇵', mot: 'bp-flag-mot-6' },
  { iso: 'BR', flag: '🇧🇷', mot: 'bp-flag-mot-7' },
] as const;

const SERVICES: Array<{ href: string; label: string; Icon: LucideIcon; mot: string }> = [
  { href: '/verifications', label: 'Verifications', Icon: ShieldCheck, mot: 'bp-svc-mot-0' },
  { href: '/numbers', label: 'Numbers', Icon: Smartphone, mot: 'bp-svc-mot-1' },
  { href: '/rentals', label: 'Rentals', Icon: CalendarDays, mot: 'bp-svc-mot-2' },
  { href: '/esim', label: 'eSIM', Icon: Globe2, mot: 'bp-svc-mot-3' },
  { href: '/proxies', label: 'Proxies', Icon: Server, mot: 'bp-svc-mot-4' },
  { href: '/api/docs', label: 'API', Icon: Code2, mot: 'bp-svc-mot-5' },
  { href: '/security', label: 'VPN', Icon: Lock, mot: 'bp-svc-mot-6' },
];

function CoverageStrip() {
  return (
    <>
      {[0, 1].map((ring) => (
        <div key={ring} className="flex shrink-0 items-center">
          {COVERAGE.map((c) => (
            <div
              key={`${c.iso}-${ring}`}
              className="mx-3 inline-flex shrink-0 items-center gap-2.5 rounded-bp-md border border-brand-green/30 bg-[#010806] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(0,255,157,0.12),0_8px_28px_rgba(0,0,0,0.45)]"
            >
              <span className={`select-none text-2xl leading-none ${c.mot}`} aria-hidden="true">
                {c.flag}
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/92">{c.iso}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function ProductStrip() {
  return (
    <>
      {[0, 1].map((ring) => (
        <div key={ring} className="flex shrink-0 items-center">
          {SERVICES.map((s) => {
            const Icon = s.Icon;
            return (
              <Link
                key={`${s.href}-${ring}`}
                href={s.href}
                className={`mx-3 inline-flex shrink-0 items-center gap-3 rounded-bp-md border border-white/12 bg-[linear-gradient(145deg,rgba(0,255,157,0.08),rgba(0,0,0,0.92))] px-4 py-3 shadow-[0_10px_36px_rgba(0,0,0,0.5)] transition duration-[220ms] ease-out hover:border-brand-green/40 hover:shadow-[0_12px_40px_rgba(0,255,157,0.12)] active:scale-[0.98] ${s.mot}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-bp border border-brand-green/22 bg-black/55">
                  <Icon className="h-5 w-5 text-brand-green" aria-hidden="true" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/88">{s.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function BrandMotionBanners() {
  return (
    <div className="relative z-[1] border-t border-brand-green/18">
      <section aria-labelledby="bp-coverage-marquee" className="overflow-hidden bg-[linear-gradient(180deg,rgba(1,50,32,0.5),#000000)] py-8 md:py-10">
        <h2 id="bp-coverage-marquee" className="sr-only">
          Supported country regions
        </h2>
        <p className="mb-5 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green">
          Global coverage
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
          <div className="bp-coverage-marquee flex w-max">
            <CoverageStrip />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="bp-services-marquee"
        className="overflow-hidden border-t border-white/8 bg-[linear-gradient(180deg,#000000,rgba(1,50,32,0.35))] py-8 md:py-10"
      >
        <h2 id="bp-services-marquee" className="sr-only">
          Burner Point services
        </h2>
        <p className="mb-5 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
          Platform services
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
          <div className="bp-product-marquee flex w-max">
            <ProductStrip />
          </div>
        </div>
      </section>
    </div>
  );
}
