'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { getErrorMessage } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success('Check your email for the reset link.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send reset email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      title="Reset your password"
      description="We’ll email you a secure recovery link."
    >
      <div className="space-y-4">
        <form onSubmit={handleSendReset} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Email address
            </label>
            <GlassInputWrapper>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                autoComplete="email"
                required
              />
            </GlassInputWrapper>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4 text-xs leading-6 text-white/60">
          Password recovery currently uses email. If your account only has a phone number connected, contact support after you regain access to add a recovery email.
        </div>

        <div className="flex items-center justify-between text-xs">
          <Link
            href="/sign-in"
            className="flex items-center gap-1 text-[#00FF9D] hover:underline"
          >
            <ArrowRight className="h-3 w-3 rotate-180" />
            Back to sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-[#00FF9D] hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </SignInPage>
  );
}
