import { Suspense } from 'react';
import PhoneVerifyClient from './phone-verify-client';

export const metadata = {
  title: 'Verify Phone | Burner Point',
  description: 'Verify your Burner Point account phone number with a secure Twilio OTP flow.',
};

export default function PhoneVerifyPage() {
  return (
    <Suspense fallback={<PhoneVerifyFallback />}>
      <PhoneVerifyClient />
    </Suspense>
  );
}

function PhoneVerifyFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-black px-4 text-white">
      <div className="bp-state max-w-md">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/52">Preparing secure phone verification...</p>
      </div>
    </main>
  );
}
