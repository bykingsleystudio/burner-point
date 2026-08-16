'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { getErrorMessage } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const recoveryChips = ['Account recovery', 'Secure reset'];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
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
      title="Forgot your password?"
      description="Enter your email address and we'll send you a secure reset link."
      chips={recoveryChips}
      footerContent={
        <div className="text-sm">
          <Link href="/sign-in" className="bp-auth-inline-link font-medium">
            Back to sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSendReset} className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="email" className="bp-auth-label">
            Email address
          </label>
          <GlassInputWrapper>
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@example.com"
              className="bp-auth-text-input"
              autoComplete="email"
              required
            />
          </GlassInputWrapper>
        </div>

        <Button
          type="submit"
          variant="brand"
          size="xl"
          loading={loading}
          disabled={!email.trim()}
          className="bp-button-glow h-12 w-full rounded-[1rem] px-5 text-sm uppercase tracking-[0.16em]"
        >
          {loading ? 'Sending reset link' : 'Send reset link'}
        </Button>
      </form>
    </SignInPage>
  );
}
