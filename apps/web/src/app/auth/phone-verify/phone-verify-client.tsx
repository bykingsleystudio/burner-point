'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, PhoneCall, ShieldCheck, Smartphone, TimerReset } from 'lucide-react';
import Button from '@/components/ui/button';
import { GlassInputWrapper, SignInPage } from '@/components/ui/sign-in';
import { phoneAuthApi } from '@/lib/api';
import { exchangeSupabaseSession, getErrorMessage, sanitizeRedirect } from '@/lib/auth';
import { INTERNATIONAL_PHONE_ERROR, isValidInternationalPhone, normalizeInternationalPhone } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

type Channel = 'sms' | 'call';
type OtpStep = 'loading-session' | 'ready' | 'sent' | 'approved';

const recoveryChips = ['SMS OTP', 'Voice Call'];

export default function PhoneVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState<OtpStep>('loading-session');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const redirectTo = useMemo(() => sanitizeRedirect(searchParams.get('redirect')), [searchParams]);
  const supabaseOtpMode = searchParams.get('mode');
  const isSupabaseOtp = supabaseOtpMode === 'supabase-signup' || supabaseOtpMode === 'supabase-login';
  const isSupabaseSignup = supabaseOtpMode === 'supabase-signup';
  const normalizedPhone = useMemo(() => normalizeInternationalPhone(phoneNumber), [phoneNumber]);
  const phoneIsValid = isValidInternationalPhone(phoneNumber);
  const codeIsValid = /^\d{4,10}$/.test(code.trim());

  useEffect(() => {
    let cancelled = false;

    async function prepareApiSession() {
      try {
        if (isSupabaseOtp) {
          setPhoneNumber(searchParams.get('phone') || '');
          setStep('sent');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error('Sign in again to continue.');

        const pendingPhone = typeof window !== 'undefined' ? sessionStorage.getItem('burnerPointPendingPhone') : null;
        const result = await exchangeSupabaseSession(session, {
          phoneNumber: pendingPhone || user?.phoneNumber,
        });

        if (cancelled) return;

        const apiPhone = result.user?.phoneNumber || pendingPhone || user?.phoneNumber || '';
        setPhoneNumber(apiPhone);

        if (result.needsOnboarding) {
          router.replace(`/onboarding?redirect=${encodeURIComponent(redirectTo)}`);
          return;
        }

        if (!result.needsPhoneVerification || result.user?.phoneVerified) {
          toast.success('Phone number already verified.');
          router.replace(redirectTo);
          return;
        }

        setStep('ready');
      } catch (error: unknown) {
        if (cancelled) return;
        toast.error(getErrorMessage(error, 'Something went wrong. Please sign in again.'));
        router.replace('/sign-in');
      }
    }

    void prepareApiSession();
    return () => {
      cancelled = true;
    };
  }, [isSupabaseOtp, redirectTo, router, searchParams, user?.phoneNumber]);

  const sendCode = async () => {
    if (!phoneIsValid) {
      setLastError(INTERNATIONAL_PHONE_ERROR);
      return;
    }

    setLoading(true);
    setLastError(null);
    try {
      if (isSupabaseOtp) {
        const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
        if (error) throw error;
        setStep('sent');
        toast.success('A new verification code was sent.');
        return;
      }

      const { data } = await phoneAuthApi.send({ phoneNumber: normalizedPhone, channel });
      setExpiresAt(data.expiresAt);
      setAttemptsRemaining(data.attemptsRemaining);
      setStep('sent');
      toast.success(`${channel === 'sms' ? 'SMS' : 'Voice'} code sent.`);
    } catch (error: unknown) {
      setLastError(getOtpError(error, 'Could not send the code. Try again.'));
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
      if (isSupabaseOtp) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: code.trim(),
          type: 'sms',
        });
        if (error || !data.session) throw error ?? new Error('Supabase phone verification did not create a session.');

        const result = await exchangeSupabaseSession(data.session, isSupabaseSignup
          ? { phoneNumber: normalizedPhone, acceptTerms: true, acceptPrivacy: true }
          : { phoneNumber: normalizedPhone });
        updateUser({ phoneNumber: normalizedPhone, phoneVerified: true });
        setStep('approved');
        toast.success('Phone verified. Opening Burner Point.');
        router.replace(buildPhoneRedirect(result, redirectTo));
        return;
      }

      const { data } = await phoneAuthApi.verify({ phoneNumber: normalizedPhone, code: code.trim() });
      updateUser({ phoneNumber: normalizedPhone, phoneVerified: true });
      setStep('approved');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('burnerPointPendingPhone');
      }
      toast.success('Phone verified. Opening Burner Point.');
      router.replace(sanitizeRedirect(data.redirectTo || redirectTo));
    } catch (error: unknown) {
      const message = getOtpError(error, 'Verification failed. Try again.');
      setLastError(message);
      const remaining = (error as { response?: { data?: { attemptsRemaining?: number } } })?.response?.data?.attemptsRemaining;
      if (typeof remaining === 'number') setAttemptsRemaining(remaining);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      title="Verify your phone number"
      description="Confirm the number linked to your Burner Point account with SMS or voice delivery before continuing."
      chips={recoveryChips}
      footerContent={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href={`/sign-in?redirect=${encodeURIComponent(redirectTo)}`} className="bp-auth-inline-link font-medium">
            Back to sign in
          </Link>
          <Link href="/dashboard/security" className="bp-auth-inline-link font-medium">
            Security settings
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bp-auth-note flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-current">Finish account security</p>
            <p className="text-sm leading-6">
              Choose SMS or voice, enter the secure code, and continue to the Burner Point destination you requested.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="bp-auth-label">
              Account phone number
            </label>
            <GlassInputWrapper>
              <input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                placeholder="+14155550182"
                className="bp-auth-text-input"
                disabled={step === 'approved'}
              />
            </GlassInputWrapper>
            <p className="bp-auth-muted text-sm">Include the full international number with country code.</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="bp-auth-label">Delivery method</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: 'sms' as const, label: 'SMS', icon: Smartphone },
                { id: 'call' as const, label: 'Voice call', icon: PhoneCall },
              ].map((item) => {
                const Icon = item.icon;
                const active = channel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChannel(item.id)}
                    className={cn('bp-auth-channel', active && 'bp-auth-channel-active')}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <Button
          type="button"
          onClick={() => void sendCode()}
          variant="brand"
          size="xl"
          loading={loading && step !== 'sent'}
          disabled={step === 'loading-session' || step === 'approved' || !phoneIsValid}
          className="bp-button-glow h-12 w-full rounded-[1rem] px-5 text-sm uppercase tracking-[0.16em]"
        >
          {step === 'sent' ? 'Send another code' : 'Send code'}
        </Button>

        {step === 'sent' || step === 'approved' ? (
          <div className="bp-auth-success">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <TimerReset className="h-4 w-4" />
              {expiresAt ? `Code expires ${new Date(expiresAt).toLocaleTimeString()}` : 'Code sent'}
              {attemptsRemaining !== null ? <span className="opacity-80">Attempts left: {attemptsRemaining}</span> : null}
            </div>

            {step === 'approved' ? (
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Approved. Redirecting...
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <div className="space-y-2">
                  <label htmlFor="otpCode" className="bp-auth-label">
                    Verification code
                  </label>
                  <GlassInputWrapper className="max-w-[16rem]">
                    <input
                      id="otpCode"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      enterKeyHint="done"
                      placeholder="Enter code"
                      className="bp-auth-text-input font-mono text-base tracking-[0.22em]"
                    />
                  </GlassInputWrapper>
                </div>

                <Button
                  type="button"
                  onClick={() => void verifyCode()}
                  variant="brand"
                  size="xl"
                  loading={loading}
                  disabled={!codeIsValid}
                  className="bp-button-glow h-12 w-full rounded-[1rem] px-5 text-sm uppercase tracking-[0.16em]"
                >
                  Verify and continue
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {lastError ? (
          <div className="bp-auth-error" role="alert">
            {lastError}
          </div>
        ) : null}

        <div className="bp-auth-note">
          Codes expire after 10 minutes. If the message does not arrive, send another code or switch between SMS and voice delivery.
        </div>
      </div>
    </SignInPage>
  );
}

function buildPhoneRedirect(result: { needsOnboarding?: boolean; user?: { phoneNumber?: string }; onboarding?: unknown }, redirectTo: string) {
  return result.needsOnboarding
    ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}`
    : redirectTo;
}

function getOtpError(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string | { message?: string }; retryAfter?: number }; headers?: Record<string, string> } })?.response;
  const message = response?.data?.message;
  const retryAfter = response?.data?.retryAfter ?? response?.headers?.['retry-after'];
  const text = typeof message === 'string' ? message : message?.message;
  if (/captcha|challenge|browser/i.test(text || '')) return 'Verification failed. Try again or switch browser.';
  return retryAfter ? `Try again in ${retryAfter} seconds.` : fallback;
}
