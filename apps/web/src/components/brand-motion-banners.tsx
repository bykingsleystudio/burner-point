import Link from 'next/link';
import {
  CalendarDays,
  Globe2,
  HelpCircle,
  Lock,
  Server,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { getAllIsoAlpha2Sorted, isoToFlagEmoji } from '@/lib/iso-countries';
import { TRUSTED_PLATFORMS } from '@/lib/trusted-platforms';

const ALL_ISO_CODES = getAllIsoAlpha2Sorted();

const FLAG_MOT = [
  'bp-flag-mot-0',
  'bp-flag-mot-1',
  'bp-flag-mot-2',
  'bp-flag-mot-3',
  'bp-flag-mot-4',
  'bp-flag-mot-5',
  'bp-flag-mot-6',
  'bp-flag-mot-7',
] as const;

const SERVICES: Array<{ href: string; label: string; Icon: LucideIcon; mot: string }> = [
  { href: '/products/verify-hub', label: 'Verify Hub', Icon: ShieldCheck, mot: 'bp-svc-mot-0' },
  { href: '/products/messenger', label: 'Messenger', Icon: Smartphone, mot: 'bp-svc-mot-1' },
  { href: '/products/rentals', label: 'Rentals', Icon: CalendarDays, mot: 'bp-svc-mot-2' },
  { href: '/products/esim-store', label: 'eSIM', Icon: Globe2, mot: 'bp-svc-mot-3' },
  { href: '/products/proxy-store', label: 'Proxies', Icon: Server, mot: 'bp-svc-mot-4' },
  { href: '/support', label: 'Support', Icon: HelpCircle, mot: 'bp-svc-mot-5' },
  { href: '/products/secure-tunnel', label: 'Secure Tunnel', Icon: Lock, mot: 'bp-svc-mot-6' },
];

function CoverageStrip() {
  return (
    <>
      {[0, 1].map((ring) => (
        <div key={ring} className="flex shrink-0 items-center">
          {ALL_ISO_CODES.map((iso, i) => {
            const mot = FLAG_MOT[i % FLAG_MOT.length];
            const flag = isoToFlagEmoji(iso);
            return (
              <div
                key={`${iso}-${ring}`}
                className="mx-2 inline-flex shrink-0 items-center gap-2 rounded-full bg-white/[0.03] px-3 py-2 sm:mx-3 sm:px-4 sm:py-2.5"
              >
                <span className={`text-base ${mot}`} aria-hidden="true">
                  {flag}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 sm:text-[11px]">
                  {iso}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

function TrustedPlatformsStrip() {
  return (
    <>
      {[0, 1].map((ring) => (
        <div key={ring} className="flex shrink-0 items-center">
          {TRUSTED_PLATFORMS.map((p) => {
            const Icon = p.Icon;
            return (
              <div
                key={`${p.label}-${ring}`}
                className={`mx-2 inline-flex shrink-0 items-center gap-3 rounded-full bg-white/[0.03] px-3 py-2.5 sm:mx-3 sm:px-4 sm:py-3 ${p.mot}`}
                style={{
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${p.tileGlow}`,
                }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: p.brandColor }} aria-hidden="true" />
                </span>
                <span
                  className="max-w-[7rem] font-mono text-[9px] font-semibold uppercase leading-tight tracking-[0.12em] sm:max-w-none sm:text-[10px] sm:tracking-[0.14em]"
                  style={{ color: p.labelColor }}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
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
                className={`mx-3 inline-flex shrink-0 items-center gap-3 rounded-full bg-[linear-gradient(145deg,rgba(0,255,157,0.08),rgba(0,0,0,0.92))] px-4 py-3 shadow-[0_10px_36px_rgba(0,0,0,0.5)] transition duration-[220ms] ease-out hover:bg-brand-green/[0.08] hover:shadow-[0_12px_40px_rgba(0,255,157,0.12)] active:scale-[0.98] ${s.mot}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
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
        <p className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green">
          Global coverage
        </p>
        <p className="mb-5 text-center text-[11px] text-white/38">
          {ALL_ISO_CODES.length}+ ISO regions • flag emoji where supported by your device
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]">
          <div className="bp-coverage-marquee flex w-max">
            <CoverageStrip />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="bp-trusted-marquee"
        className="overflow-hidden border-t border-brand-green/22 bg-[linear-gradient(180deg,#000000,#01140d)] py-8 md:py-10"
      >
        <h2 id="bp-trusted-marquee" className="sr-only">
          Representative third-party platforms
        </h2>
        <p className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#39FF14]/90">
          Trusted platforms
        </p>
        <p className="mx-auto mb-5 max-w-2xl px-4 text-center text-[11px] leading-relaxed text-white/36">
          Logos are identifiers only (react-icons: Simple Icons and Font Awesome glyphs). Trademarks belong to their owners. Not affiliated with or endorsed by these services.
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]">
          <div className="bp-trusted-marquee flex w-max">
            <TrustedPlatformsStrip />
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

