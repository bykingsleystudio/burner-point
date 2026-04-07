'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { Shield, Check } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  country: z.string().default('NG'),
  referralCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const FEATURES = ['Anonymous phone numbers', 'OTP interception', 'Privacy-first infrastructure', 'NGN & crypto payments'];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      const { accessToken, refreshToken } = res.data;
      const { default: api } = await import('@/lib/api');
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      const userRes = await api.get('/users/me');
      setAuth(userRes.data, accessToken, refreshToken);
      document.cookie = `accessToken=${accessToken}; path=/; max-age=900`;
      toast.success('Account created! Welcome to BurnerPoint.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 1px 1px,#00FF9D 1px,transparent 0)',backgroundSize:'30px 30px'}}/>
      <div className="w-full max-w-4xl relative z-10 grid md:grid-cols-2 gap-8 items-center">
        {/* Left panel */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center">
              <Shield size={16} className="text-black"/>
            </div>
            <span className="text-xl font-bold">BurnerPoint</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">Privacy is not a feature.<br/><span className="text-brand-green">It is the foundation.</span></h2>
          <p className="text-brand-muted mb-8">Join thousands protecting their identity with disposable phone numbers.</p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-green/20 border border-brand-green/40 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-brand-green"/>
                </div>
                <span className="text-sm text-brand-muted">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
            <h1 className="text-2xl font-bold mb-2">Create account</h1>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-brand-muted">First name</label>
                <input {...register('firstName')} placeholder="Kingsley" className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"/>
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-brand-muted">Last name</label>
                <input {...register('lastName')} placeholder="Optional" className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-brand-muted">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"/>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-brand-muted">Password</label>
              <input {...register('password')} type="password" placeholder="Min 8 chars, mixed case + number" className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"/>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-brand-muted">Referral code (optional)</label>
              <input {...register('referralCode')} placeholder="ABC1234" className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors font-mono"/>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-green text-black font-semibold py-3 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <p className="text-center text-xs text-brand-muted">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-green hover:underline">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
