'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { getErrorMessage } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const recoveryChips = ['Password Recovery', 'Secure Session'];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
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
      description="Finish the secure Burner Point recovery flow from the link sent to your email."
      chips={recoveryChips}
      footerContent={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href="/forgot-password" className="bp-auth-inline-link font-medium">
            Request another link
          </Link>
          <Link href="/sign-in" className="bp-auth-inline-link font-medium">
            Back to sign in
          </Link>
        </div>
      }
    >
      {!ready ? (
        <div className="bp-auth-note">
          Open this page from the password reset link sent to your email. If the link expired or opened in a different browser session, request another secure reset link.
        </div>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label htmlFor="password" className="bp-auth-label">
              New password
            </label>
            <GlassInputWrapper>
              <div className="relative">
                <input
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Use at least 8 characters"
                  className="bp-auth-text-input pr-12"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="bp-auth-toggle absolute inset-y-0 right-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="bp-auth-label">
              Confirm password
            </label>
            <GlassInputWrapper>
              <div className="relative">
                <input
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  className="bp-auth-text-input pr-12"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="bp-auth-toggle absolute inset-y-0 right-3 flex items-center"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>

          <Button
            type="submit"
            variant="brand"
            size="xl"
            loading={loading}
            disabled={password.length < 8 || password !== confirmPassword}
            className="bp-button-glow h-12 w-full rounded-[1rem] px-5 text-sm uppercase tracking-[0.16em]"
          >
            {loading ? 'Updating password' : 'Update password'}
          </Button>
        </form>
      )}
    </SignInPage>
  );
}
