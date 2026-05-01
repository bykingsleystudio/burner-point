'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import {
  INTERNATIONAL_PHONE_ERROR,
  classifyAuthIdentifier,
  isValidInternationalPhone,
  normalizeAuthIdentifier,
} from '@/lib/phone';

type ResetMethod = 'email' | 'phone';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'identifier' | 'code' | 'password'>('identifier');
  const [resetMethod, setResetMethod] = useState<ResetMethod>('email');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) {
      toast.error('Auth not ready');
      return;
    }

    const identifierType = classifyAuthIdentifier(identifier);
    if (!identifierType) {
      toast.error('Please enter a valid email or phone number');
      return;
    }

    if (identifierType === 'phone' && !isValidInternationalPhone(identifier)) {
      toast.error(INTERNATIONAL_PHONE_ERROR);
      return;
    }

    const normalizedIdentifier = normalizeAuthIdentifier(identifier);
    setLoading(true);

    try {
      // Create sign-in session first
      await signIn.create({ identifier: normalizedIdentifier });

      // Send reset code
      if (identifierType === 'email') {
        await signIn.resetPasswordEmailCode.sendCode();
        setResetMethod('email');
      } else {
        await signIn.resetPasswordPhoneCode.sendCode();
        setResetMethod('phone');
      }

      setStep('code');
      toast.success(`Reset code sent to your ${identifierType === 'email' ? 'email' : 'phone'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) {
      toast.error('Auth not ready');
      return;
    }

    setLoading(true);
    try {
      // Verify the code
      if (resetMethod === 'email') {
        await signIn.resetPasswordEmailCode.verifyCode({ code });
      } else {
        await signIn.resetPasswordPhoneCode.verifyCode({ code });
      }

      setStep('password');
      toast.success('Code verified. Set your new password.');
    } catch (error: any) {
      toast.error(error.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) {
      toast.error('Auth not ready');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Submit new password
      if (resetMethod === 'email') {
        await signIn.resetPasswordEmailCode.submitPassword({ password, signOutOfOtherSessions: true });
      } else {
        await signIn.resetPasswordPhoneCode.submitPassword({ password, signOutOfOtherSessions: true });
      }

      toast.success('Password reset successful');
      router.push('/sign-in');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      title="Reset your password"
      description="We'll send you a code to reset your password"
    >
      <div className="space-y-4">
        {step === 'identifier' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Email or phone number
              </label>
              <GlassInputWrapper>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  type="text"
                  placeholder="you@example.com or +14155550182"
                  className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  required
                />
              </GlassInputWrapper>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-gray-400">
              Enter the code sent to{' '}
              <span className="text-white font-medium">{identifier}</span>
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Verification code
              </label>
              <GlassInputWrapper>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  type="text"
                  placeholder="Enter code"
                  className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  required
                />
              </GlassInputWrapper>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
                  placeholder="Confirm your password"
                  className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  required
                />
              </GlassInputWrapper>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Back to sign in link */}
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
