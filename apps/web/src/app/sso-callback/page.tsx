'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SsoCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/onboarding"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    />
  );
}
