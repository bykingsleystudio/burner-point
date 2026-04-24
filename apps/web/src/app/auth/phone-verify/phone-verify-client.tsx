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
  const unsafePhoneNumber =
    typeof user?.unsafeMetadata?.phoneNumber === 'string'
      ? user.unsafeMetadata.phoneNumber
      : undefined;
  const firstName = user?.firstName;
  const lastName = user?.lastName;
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const primaryPhone = user?.primaryPhoneNumber?.phoneNumber;

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    async function prepareApiSession() {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('Missing secure session token');

        const pendingPhone = typeof window !== 'undefined' ? sessionStorage.getItem('burnerPointPendingPhone') : null;
        const { data } = await authApi.exchangeClerkToken(clerkToken, {
          firstName,
          lastName,
          email: primaryEmail,
          phoneNumber: pendingPhone || primaryPhone || unsafePhoneNumber,
        });

        if (cancelled) return;
        setApiSession(data.accessToken, data.refreshToken);

        const apiPhone = data.user?.phoneNumber || pendingPhone || primaryPhone || '';
        setPhoneNumber(apiPhone);

        if (!data.needsPhoneVerification || data.user?.phoneVerified) {
          toast.success('Phone number already verified.');
          router.replace(redirectTo);
          return;
        }

        setStep('ready');
      } catch (error: unknown) {
        if (cancelled) return;
        const responseError = error as Error & {
          response?: {
            data?: { message?: string };
          };
        };
        const message =
          responseError.response?.data?.message ||
          responseError.message ||
          'Unable to prepare secure phone verification.';
        toast.error(message);
        router.replace('/dashboard');
      }
    }

    prepareApiSession();
    return () => {
      cancelled = true;
    };
  }, [firstName, getToken, isLoaded, lastName, primaryEmail, primaryPhone, redirectTo, router, unsafePhoneNumber, user?.id]);

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
      const remaining = (error as { response?: { data?: { attemptsRemaining?: number } } })?.response?.data?.attemptsRemaining;
      if (typeof remaining === 'number') setAttemptsRemaining(remaining);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-brand-black px-3 py-3 text-white sm:px-4 md:py-4">
      <div className="bp-grid-bg pointer-events-none fixed inset-0 opacity-60" />
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-2xl items-center">
        <div className="bp-card w-full rounded-bp-lg p-3.5 sm:p-4 md:p-5 [&_input.auth-input]:min-h-11 [&_input.auth-input]:px-3.5 [&_input.auth-input]:py-3">
          <div className="rounded-bp-lg border border-white/8 bg-black/24 p-4 sm:p-4 md:p-5">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
              <span className="flex h-10 w-10 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
                <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} />
              </span>
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">
                Burner <span className="text-brand-green">Point</span>
              </span>
            </Link>

            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-bp-md border border-brand-green/25 bg-brand-green/10">
              <ShieldCheck className="h-6 w-6 text-brand-green" />
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Secure phone verification</p>
            <h1 className="mt-3 text-[1.8rem] font-semibold uppercase leading-none sm:text-[2rem]">Verify your account phone</h1>
            <p className="mt-2 text-sm leading-5 text-white/52">
              Use SMS or voice delivery to verify the number attached to your Burner Point account. International numbers are supported when entered in E.164 format.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_0.55fr]">
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
                <span className="mt-1.5 block text-xs text-brand-muted">Use your Burner Point profile phone in E.164 format, for example +14155550182 or +2348012345678.</span>
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
                        className={`min-h-11 rounded-bp border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition ${
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
              className="bp-button-glow mt-4 flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? 'Sending...' : step === 'sent' ? 'Send another code' : 'Send code'}
              <ArrowRight className="ml-3 h-4 w-4" />
            </button>

            {step === 'sent' || step === 'approved' ? (
              <div className="mt-4 rounded-bp-lg border border-brand-green/18 bg-brand-green/[0.05] p-3.5 md:p-4">
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
                        placeholder="Enter verification code"
                        className="auth-input mt-1.5 max-w-sm font-mono text-lg"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={verifyCode}
                      disabled={loading || !codeIsValid}
                      className="mt-3 flex min-h-11 w-full items-center justify-center rounded-bp bg-brand-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

            <div className="mt-4 rounded-bp-lg border border-white/8 bg-white/[0.02] p-3.5 text-xs leading-5 text-white/46">
              Codes expire after 10 minutes. If you do not receive one, switch between SMS and voice delivery and confirm the number is typed in full international format.
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
