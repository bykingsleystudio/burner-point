'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { buildPostAuthRedirect, exchangeSupabaseSession, getErrorMessage } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Please enter your first and last name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast.error('You must accept the Terms and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone_number: formData.phone.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        const result = await exchangeSupabaseSession(data.session, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phone.trim(),
          acceptTerms: true,
          acceptPrivacy: true,
        });
        toast.success('Account created.');
        router.push(buildPostAuthRedirect(result));
        return;
      }

      toast.success('Account created. Check your email to verify your account, then sign in.');
      router.push('/sign-in');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create account'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthRegister = async (provider: 'google' | 'apple' | 'microsoft') => {
    try {
      const oauthProvider = provider === 'microsoft' ? 'azure' : provider;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: oauthProvider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'OAuth registration failed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create your account
          </h1>
          <p className="text-gray-400">
            Join Burner Point today
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          {/* OAuth Buttons */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            <button
              onClick={() => handleOAuthRegister('google')}
              className="flex items-center justify-center gap-2 h-11 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.15 3.45v2.77h3.57c2.08-1.92 3.22-4.75 3.22-8.23z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.82 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.82 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.59 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuthRegister('apple')}
              className="flex items-center justify-center gap-2 h-11 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 16.06 3.21 10.5 6.5 10.5c1.54 0 2.5.74 3.35.74.82 0 2.34-.93 3.93-.4.67.23 1.25.56 1.72 1.01-.03.02-1.02.6-1.02 1.78 0 1.41 1.23 2.81 1.82 2.81-.03.08-2.09.72-2.09 3.84 0 3.09 2.7 4.11 2.75 4.11-.03.08-.42 1.44-1.96 2.89zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-2.04 4.16-3.74 4.25z" />
              </svg>
              Continue with Apple
            </button>

            <button
              onClick={() => handleOAuthRegister('microsoft')}
              className="flex items-center justify-center gap-2 h-11 rounded-lg bg-[#00A4EF] text-white font-medium hover:bg-[#008ED8] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M11.1 2.3v10.6h10.6V2.3H11.1zm10.6 11.8H11.1v10.6h10.6V14.1zM.3 2.3v10.6h10.6V2.3H.3zm10.6 11.8H.3v10.6h10.6V14.1z" />
              </svg>
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-4 mb-6">
            <div className="flex-1 border-t border-white/10" />
            <span className="mx-4 text-xs text-gray-500">OR</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]"
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]"
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 mt-0.5 accent-[#00FF9D]"
                />
                I accept the{' '}
                <Link href="/terms" className="text-[#00FF9D] hover:underline">
                  Terms of Service
                </Link>
              </label>

              <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptPrivacy"
                  checked={formData.acceptPrivacy}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 accent-[#00FF9D]"
                />
                I accept the{' '}
                <Link href="/privacy" className="text-[#00FF9D] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#00FF9D] to-[#39FF14] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <Zap size={16} />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-[#00FF9D] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
