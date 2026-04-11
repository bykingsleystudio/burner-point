'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Check, Mail } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://burner-point-api-production.up.railway.app/api';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z.string().min(7, 'Phone number is required').regex(/^\+?[0-9\s().-]{7,24}$/, 'Enter a valid phone number'),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  country: z.string().default('NG'),
  referralCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const FEATURES = ['Real SIM-backed numbers', 'OTP and voice verification', 'eSIM, proxies, and VPN privacy', 'No personal number exposure'];

const oauthProviders = [
  { label: 'Google', href: `${API_URL}/auth/oauth/google` },
  { label: 'Apple iCloud', href: `${API_URL}/auth/oauth/apple` },
  { label: 'Microsoft Outlook', href: `${API_URL}/auth/oauth/microsoft` },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'NG' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      const { accessToken, refreshToken } = res.data;
      const { default: api } = await import('@/lib/api');
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      const userRes = await api.get('/users/me');
      setAuth(userRes.data, accessToken, refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      document.cookie = `accessToken=${accessToken}; path=/; max-age=900`;
      toast.success('Account created. Welcome to Burner Point.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="bp-grid-bg absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.14),transparent_64%)]" />
      </div>
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <section className="hidden md:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-green/25 bg-brand-green/10">
              <Image src="/assets/logo-mark.svg" alt="" width={26} height={26} />
            </span>
            <span className="font-mono text-lg font-semibold uppercase tracking-[0.22em]">Burner <span className="text-brand-green">Point</span></span>
          </Link>
          <h1 className="mt-10 text-5xl font-semibold uppercase leading-[0.95]">Create a private identity layer before the internet asks for your number.</h1>
          <p className="mt-6 max-w-md text-base leading-8 text-white/58">Signup requires first name, last name, email, and phone number so account recovery and verification support stay reliable.</p>
          <div className="mt-8 space-y-3">
            {FEATURES.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-green/30 bg-brand-green/10">
                  <Check className="h-3.5 w-3.5 text-brand-green" />
                </span>
                <span className="text-sm text-white/62">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit(onSubmit)} className="bp-card rounded-[34px] p-5 md:p-7">
          <div className="rounded-[28px] border border-white/8 bg-black/24 p-5 md:p-6">
            <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-green/25 bg-brand-green/10">
                  <Image src="/assets/logo-mark.svg" alt="" width={26} height={26} />
                </span>
                <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">Burner <span className="text-brand-green">Point</span></span>
              </Link>
              <span className="rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Required profile</span>
            </div>

            <h2 className="text-3xl font-semibold uppercase">Create account</h2>
            <p className="mt-2 text-sm leading-6 text-white/52">Private by design. Stay anonymous. Stay connected.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.firstName?.message}>
                <input {...register('firstName')} autoComplete="given-name" placeholder="Kingsley" className="auth-input" />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input {...register('lastName')} autoComplete="family-name" placeholder="Doe" className="auth-input" />
              </Field>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">
                <Mail className="h-4 w-4" />
                Required Contact
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email address" error={errors.email?.message}>
                  <input {...register('email')} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" className="auth-input" />
                </Field>
                <Field label="Phone number" error={errors.phoneNumber?.message}>
                  <input {...register('phoneNumber')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 415 555 0182" className="auth-input" />
                </Field>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.7fr]">
              <Field label="Password" error={errors.password?.message}>
                <input {...register('password')} type="password" autoComplete="new-password" placeholder="Min 8 chars, mixed case + number" className="auth-input" />
              </Field>
              <Field label="Referral code">
                <input {...register('referralCode')} placeholder="ABC1234" className="auth-input font-mono" />
              </Field>
            </div>

            <button type="submit" disabled={loading} className="bp-button-glow mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/8" />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">or continue with</span>
              <span className="h-px flex-1 bg-white/8" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {oauthProviders.map((provider) => (
                <a key={provider.label} href={provider.href} className="flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-center text-xs font-semibold text-white/76 transition hover:border-brand-green/35 hover:text-brand-green">
                  {provider.label}
                </a>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-white/48">
              Already have an account? <Link href="/auth/login" className="text-brand-green hover:underline">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/58">
      {label}
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1.5 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}
