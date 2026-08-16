'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { AuthProviderButton } from '@/components/auth-provider-button';
import Button from '@/components/ui/button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { getErrorMessage, sanitizeRedirect } from '@/lib/auth';
import { useManualAuthCompletion } from '@/lib/auth-session-sync';
import {
  INTERNATIONAL_PHONE_ERROR,
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from '@/lib/phone';
import { supabase } from '@/lib/supabase';

const productChips = ['Private access', 'Secure account'];

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => sanitizeRedirect(searchParams.get('redirect')), [searchParams]);
  const completeAuth = useManualAuthCompletion();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim().toLowerCase();
    const phoneNumber = normalizeInternationalPhone(formData.phone);

    if (!firstName || !lastName) {
      toast.error('Enter your first and last name.');
      return;
    }
    if (!email) {
      toast.error('Enter your email address.');
      return;
    }
    if (formData.phone && !isValidInternationalPhone(formData.phone)) {
      toast.error(INTERNATIONAL_PHONE_ERROR);
      return;
    }
    if (!phoneNumber && !email) {
      toast.error('Enter either a valid email or phone number.');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast.error('You must accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        // Use centralized auth sync instead of direct redirect
        await completeAuth(data.session, {
          redirectTo: redirectTo || '/dashboard',
          profileData: {
            firstName,
            lastName,
            email,
            phoneNumber,
            acceptTerms: true,
            acceptPrivacy: true,
          },
        });
        toast.success('Account created.');
        return;
      }

      toast.success('Account created. Check your email to verify your account, then sign in.');
      window.location.href = `/sign-in?redirect=${encodeURIComponent(redirectTo)}`;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create account.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthRegister = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'OAuth registration failed.'));
    }
  };

  return (
    <SignInPage
      title="Create your account"
      description="Access Burner Point with one account."
      chips={productChips}
      socialAuth={
        <AuthProviderButton
          provider="Google"
          onClick={handleOAuthRegister}
          disabled={loading}
        />
      }
      footerContent={
        <div className="flex flex-col gap-3">
          <p className="bp-auth-muted text-sm">
            Already have an account?{' '}
            <Link href="/sign-in" className="bp-auth-inline-link font-semibold">
              Sign in
            </Link>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <Link href="/terms-of-service" className="bp-auth-inline-link">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="bp-auth-inline-link">
              Privacy Policy
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="firstName" className="bp-auth-label">
              First name
            </label>
            <GlassInputWrapper>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className="bp-auth-text-input"
                autoComplete="given-name"
              />
            </GlassInputWrapper>
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="bp-auth-label">
              Last name
            </label>
            <GlassInputWrapper>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="bp-auth-text-input"
                autoComplete="family-name"
              />
            </GlassInputWrapper>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="bp-auth-label">
            Email address
          </label>
          <GlassInputWrapper>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="bp-auth-text-input"
              autoComplete="email"
            />
          </GlassInputWrapper>
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="bp-auth-label">
            Phone number
          </label>
          <GlassInputWrapper>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+14155550182"
              className="bp-auth-text-input"
              autoComplete="tel"
              inputMode="tel"
            />
          </GlassInputWrapper>
          <p className="bp-auth-muted text-sm">
            Include the full international number with country code. Burner Point accepts numbers from supported regions worldwide.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="bp-auth-label">
            Password
          </label>
          <GlassInputWrapper>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Use at least 8 characters"
                className="bp-auth-text-input pr-12"
                autoComplete="new-password"
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
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                className="bp-auth-text-input pr-12"
                autoComplete="new-password"
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

        <div className="flex flex-col gap-3 text-sm">
          <label className="bp-auth-muted inline-flex items-start gap-2.5">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="bp-auth-checkbox mt-0.5 h-4 w-4 rounded border-white/15 bg-transparent"
            />
            <span>
              I accept the{' '}
              <Link href="/terms-of-service" className="bp-auth-inline-link font-medium">
                Terms of Service
              </Link>
            </span>
          </label>

          <label className="bp-auth-muted inline-flex items-start gap-2.5">
            <input
              type="checkbox"
              name="acceptPrivacy"
              checked={formData.acceptPrivacy}
              onChange={handleChange}
              className="bp-auth-checkbox mt-0.5 h-4 w-4 rounded border-white/15 bg-transparent"
            />
            <span>
              I accept the{' '}
              <Link href="/privacy-policy" className="bp-auth-inline-link font-medium">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        <Button
          type="submit"
          variant="brand"
          size="xl"
          loading={loading}
          className="bp-button-glow h-12 w-full rounded-[1rem] px-5 text-sm uppercase tracking-[0.16em]"
        >
          {loading ? 'Creating account' : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Get Started
            </>
          )}
        </Button>
      </form>
    </SignInPage>
  );
}
