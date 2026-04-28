import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export function AccountAttentionBanner({
  needsOnboarding,
  needsPhoneVerification,
  missingFields = [],
}: {
  needsOnboarding?: boolean;
  needsPhoneVerification?: boolean;
  missingFields?: string[];
}) {
  if (!needsOnboarding && !needsPhoneVerification) {
    return null;
  }

  const humanFields = missingFields
    .filter((field) => field !== 'acceptTerms' && field !== 'acceptPrivacy')
    .map((field) =>
      field === 'firstName'
        ? 'first name'
        : field === 'lastName'
          ? 'last name'
          : field === 'phoneNumber'
            ? 'phone number'
            : field,
    );

  return (
    <section className="border-b border-brand-green/18 bg-[linear-gradient(90deg,rgba(0,255,157,0.12),rgba(0,0,0,0.72))] px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-[1rem] border border-brand-green/24 bg-brand-green/10">
            {needsPhoneVerification ? (
              <ShieldCheck className="h-5 w-5 text-brand-green" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-brand-green" />
            )}
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Account attention</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {needsPhoneVerification
                ? 'Your dashboard is open, but your account phone still needs verification.'
                : 'Your dashboard is open, but a few account details still need to be completed.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              {needsPhoneVerification
                ? 'Use secure SMS or voice delivery to verify the number attached to this Burner Point account without leaving your active session.'
                : humanFields.length
                  ? `Finish ${humanFields.join(', ')} so recovery, billing, and product access stay aligned.`
                  : 'Finish the remaining profile details so recovery, billing, and product access stay aligned.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {needsOnboarding ? (
            <Link
              href="/onboarding?redirect=/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-[1rem] border border-white/10 bg-black/24 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/74 transition hover:border-brand-green/28 hover:text-white"
            >
              Complete Profile
            </Link>
          ) : null}
          {needsPhoneVerification ? (
            <Link
              href="/verify-phone?redirect=/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-[1rem] bg-brand-green px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#1cffac]"
            >
              Verify Phone
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
