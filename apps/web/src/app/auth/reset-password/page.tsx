'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { getErrorMessage } from '@/lib/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setReady(Boolean(data.session));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Password updated. Sign in with your new password.');
      router.push('/sign-in');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to reset password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      title="Create a new password"
      description="Finish your Burner Point password reset."
    >
      <div className="space-y-4">
        {!ready ? (
          <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-white/60">
            Open this page from the reset link sent to your email. If the link expired, request another one.
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                New password
              </label>
              <GlassInputWrapper>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Use at least 8 characters"
                  className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  autoComplete="new-password"
                  required
                />
              </GlassInputWrapper>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Confirm password
              </label>
              <GlassInputWrapper>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Confirm your new password"
                  className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  autoComplete="new-password"
                  required
                />
              </GlassInputWrapper>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <div className="flex items-center justify-between text-xs">
          <Link
            href="/forgot-password"
            className="flex items-center gap-1 text-[#00FF9D] hover:underline"
          >
            <ArrowRight className="h-3 w-3 rotate-180" />
            Request another link
          </Link>
          <Link
            href="/sign-in"
            className="text-[#00FF9D] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </SignInPage>
  );
}
