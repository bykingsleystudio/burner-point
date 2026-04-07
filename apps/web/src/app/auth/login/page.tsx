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
import { Eye, EyeOff, Shield, Zap } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Min 8 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { accessToken, refreshToken, userId } = res.data;
      // Fetch user profile
      const { default: api } = await import('@/lib/api');
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      const userRes = await api.get('/users/me');
      setAuth(userRes.data, accessToken, refreshToken);
      // Set cookie for middleware
      document.cookie = `accessToken=${accessToken}; path=/; max-age=900`;
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5" style={{backgroundImage:'linear-gradient(#00FF9D 1px,transparent 1px),linear-gradient(90deg,#00FF9D 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center">
              <Shield size={16} className="text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">BurnerPoint</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-brand-muted text-sm">Privacy is not a feature. It is the foundation.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 pr-11 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green text-black font-semibold py-3 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
              ) : (
                <><Zap size={16}/> Sign In</>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-brand-muted">
            No account?{' '}
            <Link href="/auth/register" className="text-brand-green hover:underline">Create one free</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
