'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { ArrowRight, CheckCircle2, PhoneCall, ShieldCheck, Smartphone, TimerReset } from 'lucide-react';
import { authApi, phoneAuthApi, setApiSession } from '@/lib/api';

type Channel = 'sms' | 'call';
type OtpStep = 'loading-session' | 'ready' | 'sent' | 'approved';

const e164Pattern = /^\+[1-9]\d{6,14}$/;

export default function PhoneVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [step, setStep] = useState<OtpStep>('loading-session');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const redirectTo = useMemo(() => sanitizeRedirect(searchParams.get('redirect')), [searchParams]);
  const normalizedPhone = useMemo(() => phoneNumber.trim().replace(/[^\d+]/g, ''), [phoneNumber]);
  const phoneIsValid = e164Pattern.test(normalizedPhone);
  const codeIsValid = /^\d{4,10}$/.test(code.trim());

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    async function prepareApiSession() {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('Missing secure session token');

        const pendingPhone = typeof window !== 'undefined' ? sessionStorage.getItem('burnerPointPendingPhone') : null;
        const { data } = await authApi.exchangeClerkToken(clerkToken, {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.primaryEmailAddress?.emailAddress,
          phoneNumber: pendingPhone || user?.primaryPhoneNumber?.phoneNumber,
        });

        if (cancelled) return;
        setApiSession(data.accessToken, data.refreshToken);

        const apiPhone = data.user?.phoneNumber || pendingPhone || user?.primaryPhoneNumber?.phoneNumber || '';
        setPhoneNumber(apiPhone);

        if (data.user?.phoneVerified) {
          toast.success('Phone number already verified.');
          router.replace(redirectTo);
          return;
        }

        setStep('ready');
      } catch (error: any) {
        if (cancelled) return;
        const message = error.response?.data?.message || error.message || 'Complete onboarding before phone verification.';
        toast.error(message);
        router.replace('/onboarding');
      }
    }

    prepareApiSession();
    return () => { cancelled = true; };
  }, [isLoaded, getToken, router, redirectTo, user?.id]);

  const sendCode = async () => {
    if (!phoneIsValid) {
      setLastError('Enter your account phone number in E.164 format, for example +14155550182.');
      return;
    }

    setLoading(true);
    setLastError(null);
    try {
      const { data } = await phoneAuthApi.send({ phoneNumber: normalizedPhone, channel });
      setExpiresAt(data.expiresAt);
      setAttemptsRemaining(data.attemptsRemaining);
      setStep('sent');
      toast.success(`${channel === 'sms' ? 'SMS' : 'Voice'} code sent.`);
    } catch (error) {
      setLastError(getOtpError(error, 'Unable to send verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!codeIsValid) {
      setLastError('Enter the 4-10 digit code sent to your phone.');
      return;
    }

    setLoading(true);
    setLastError(null);
    try {
      const { data } = await phoneAuthApi.verify({ phoneNumber: normalizedPhone, code: code.trim() });
      setStep('approved');
      if (typeof window !== 'undefined') sessionStorage.removeItem('burnerPointPendingPhone');
      toast.success('Phone verified. Opening Burner Point.');
      router.replace(sanitizeRedirect(data.redirectTo || redirectTo));
    } catch (error) {
      const message = getOtpError(error, 'Verification failed. Check the code and try again.');
      setLastError(message);
      const remaining = (error as any)?.response?.data?.attemptsRemaining;
      if (typeof remaining === 'number') setAttemptsRemaining(remaining);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-brand-black px-4 py-6 text-white sm:px-5 md:py-10">
      <div className="bp-grid-bg pointer-events-none fixed inset-0 opacity-60" />
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl items-start md:min-h-[calc(100vh-5rem)] md:items-center">
        <div className="bp-card w-full rounded-bp-lg p-4 sm:p-5 md:p-7">
          <div className="rounded-bp-lg border border-white/8 bg-black/24 p-4 sm:p-5 md:p-6">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
              <span className="flex h-11 w-11 items-center justify-center rounded-bp-lg border border-brand-green/25 bg-brand-green/10">
                <Image src="/assets/logo-mark.svg" alt="" width={26} height={26} />
              </span>
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">
                Burner <span className="text-brand-green">Point</span>
              </span>
            </Link>

            <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-bp-lg border border-brand-green/25 bg-brand-green/10">
              <ShieldCheck className="h-7 w-7 text-brand-green" />
            </div>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.28em] text-brand-green">Twilio Verify</p>
            <h1 className="mt-3 text-2xl font-semibold uppercase sm:text-3xl">Verify your account phone</h1>
            <p className="mt-3 text-sm leading-6 text-white/52">
              Burner Point sends OTP through the Railway API using Twilio Verify server-side. No Twilio credentials are bundled into the web app.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_0.55fr]">
              <label className="block text-sm font-medium text-white/70">
                Account phone number
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  placeholder="+1 415 555 0182"
                  className="auth-input mt-1.5"
                  disabled={step === 'approved'}
                />
                <span className="mt-1.5 block text-xs text-brand-muted">Use your Burner Point profile phone in E.164 format.</span>
              </label>

              <fieldset className="block text-sm font-medium text-white/70">
                <legend>Delivery</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[
                    { id: 'sms' as const, label: 'SMS', icon: Smartphone },
                    { id: 'call' as const, label: 'Voice', icon: PhoneCall },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = channel === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setChannel(item.id)}
                        className={`min-h-12 rounded-bp border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                          active
                            ? 'border-brand-green bg-brand-green/10 text-brand-green'
                            : 'border-brand-border bg-black/20 text-brand-muted hover:border-brand-green/35 hover:text-white'
                        }`}
                      >
                        <Icon className="mx-auto mb-1 h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <button
              type="button"
              onClick={sendCode}
              disabled={loading || step === 'loading-session' || step === 'approved' || !phoneIsValid}
              className="bp-button-glow mt-5 flex min-h-12 w-full items-center justify-center rounded-bp bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? 'Sending...' : step === 'sent' ? 'Send another code' : 'Send code'}
              <ArrowRight className="ml-3 h-4 w-4" />
            </button>

            {step === 'sent' || step === 'approved' ? (
              <div className="mt-6 rounded-bp-lg border border-brand-green/18 bg-brand-green/[0.05] p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-brand-green">
                  <TimerReset className="h-4 w-4" />
                  {expiresAt ? `Code expires ${new Date(expiresAt).toLocaleTimeString()}` : 'Code sent'}
                  {attemptsRemaining !== null ? <span className="text-white/44">Attempts left: {attemptsRemaining}</span> : null}
                </div>

                {step === 'approved' ? (
                  <div className="mt-4 flex items-center gap-2 text-brand-green">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Approved. Redirecting...</span>
                  </div>
                ) : (
                  <>
                    <label className="mt-4 block text-sm font-medium text-white/70">
                      Verification code
                      <input
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        enterKeyHint="done"
                        placeholder="Enter Twilio code"
                        className="auth-input mt-1.5 max-w-sm font-mono text-lg"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={verifyCode}
                      disabled={loading || !codeIsValid}
                      className="mt-4 flex min-h-12 w-full items-center justify-center rounded-bp bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {loading ? 'Verifying...' : 'Verify and continue'}
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {lastError ? (
              <div className="mt-5 rounded-bp border border-red-400/20 bg-red-500/[0.06] p-4 text-sm leading-6 text-red-200" role="alert">
                {lastError}
              </div>
            ) : null}

            <div className="mt-6 rounded-bp-lg border border-white/8 bg-white/[0.02] p-4 text-xs leading-6 text-white/46">
              OTP endpoints are authenticated with the Burner Point API token, rate limited to 5 attempts per 10 minutes, and bound to your local user record before Twilio is called.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function sanitizeRedirect(value?: string | null) {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

function getOtpError(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string | { message?: string }; retryAfter?: number }; headers?: Record<string, string> } })?.response;
  const message = response?.data?.message;
  const retryAfter = response?.data?.retryAfter ?? response?.headers?.['retry-after'];
  const text = typeof message === 'string' ? message : message?.message;
  return retryAfter ? `${text || fallback} Retry after ${retryAfter} seconds.` : (text || fallback);
}
