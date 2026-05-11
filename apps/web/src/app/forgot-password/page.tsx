'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { getErrorMessage } from '@/lib/auth';
import { classifyAuthIdentifier } from '@/lib/phone';
import { supabase } from '@/lib/supabase';

const recoveryChips = ['Account Recovery', 'Security'];

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const identifierType = useMemo(() => classifyAuthIdentifier(identifier), [identifier]);
  const emailValue = identifier.trim().toLowerCase();
  const enteredPhoneNumber = identifier.trim().length > 0 && identifierType === 'phone';

  const handleSendReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim()) {
      toast.error('Enter your email address or phone number.');
      return;
    }

    if (identifierType !== 'email') {
      toast.error('Web password recovery sends a secure reset link to your account email. Enter that email address or manage recovery from Security settings after sign-in.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Check your email for the secure reset link.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send reset email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      title="Reset your password"
      description="Use the email address on your Burner Point account to receive a secure recovery link."
      chips={recoveryChips}
      footerContent={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href="/sign-in" className="bp-auth-inline-link font-medium">
            Back to sign in
          </Link>
          <Link href="/sign-up" className="bp-auth-inline-link font-medium">
            Create account
          </Link>
          <Link href="/dashboard/security" className="bp-auth-inline-link font-medium">
            Security settings after sign-in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSendReset} className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="identifier" className="bp-auth-label">
            Email address or phone number
          </label>
          <GlassInputWrapper>
            <input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              type="text"
              placeholder="you@example.com or +14155550182"
              className="bp-auth-text-input"
              autoComplete="email"
              required
            />
          </GlassInputWrapper>
          <p className="bp-auth-muted text-sm">
            {enteredPhoneNumber
              ? 'Web password recovery still sends the reset link to the email on your account. Use that email, then re-check your phone settings after sign-in.'
              : 'If you normally use phone sign-in, enter the email attached to your account here. Phone verification remains available once you are back inside Security settings.'}
          </p>
        </div>

        <Button
          type="submit"
          variant="brand"
          size="xl"
          loading={loading}
          disabled={!identifier.trim()}
          className="bp-button-glow h-12 w-full rounded-[1rem] px-5 text-sm uppercase tracking-[0.16em]"
        >
          {loading ? 'Sending reset link' : 'Send reset link'}
        </Button>
      </form>

      <div className="bp-auth-note">
        Burner Point preserves the current Supabase email recovery flow on web. If your account only has phone verification configured, sign in when you regain access and update recovery options from Security settings.
      </div>
    </SignInPage>
  );
}
