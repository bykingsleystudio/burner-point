'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2, CreditCard, Globe2, PhoneCall, ShieldCheck, Smartphone, TimerReset } from 'lucide-react';
import { phoneAuthApi } from '@/lib/api';

type Channel = 'sms' | 'call';
type Step = 'idle' | 'sent' | 'verified';

const e164Pattern = /^\+[1-9]\d{6,14}$/;

export default function VerificationPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedPhone = useMemo(() => phoneNumber.trim().replace(/[^\d+]/g, ''), [phoneNumber]);
  const phoneIsValid = e164Pattern.test(normalizedPhone);
  const codeIsValid = /^\d{4,10}$/.test(code.trim());

  const sendOtp = async () => {
    if (!phoneIsValid) {
      toast.error('Enter a phone number in E.164 format, for example +14155550182.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await phoneAuthApi.send({ phoneNumber: normalizedPhone, channel });
      setStep('sent');
      setExpiresInMinutes(data.expiresInMinutes);
      toast.success(`${channel === 'sms' ? 'SMS' : 'Voice'} code sent securely.`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!codeIsValid) {
      toast.error('Enter the verification code you received.');
      return;
    }

    setLoading(true);
    try {
      await phoneAuthApi.verify({ phoneNumber: normalizedPhone, code: code.trim() });
      setStep('verified');
      toast.success('Phone number verified.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCode('');
    setStep('idle');
    setExpiresInMinutes(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.78fr]">
        <section className="rounded-2xl border border-brand-border bg-brand-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-green/25 bg-brand-green/10">
              <ShieldCheck className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-green">Twilio Verify</p>
              <h1 className="text-2xl font-bold">Phone verification</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-muted">
            Send SMS or voice OTP through the Burner Point API. Twilio credentials stay on the Railway backend and never reach the browser.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_0.42fr]">
            <label className="block text-sm font-medium text-white/70">
              Phone number
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+14155550182"
                className="auth-input mt-2"
              />
              <span className="mt-1.5 block text-xs text-brand-muted">Use country code. Spaces and dashes are cleaned before sending.</span>
            </label>

            <fieldset className="block text-sm font-medium text-white/70">
              <legend>Delivery channel</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
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
                      className={`min-h-12 rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition ${
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
            onClick={sendOtp}
            disabled={loading || !phoneIsValid}
            className="bp-button-glow mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-green px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading && step !== 'sent' ? 'Sending...' : step === 'sent' ? 'Send another code' : 'Send code'}
          </button>

          {step !== 'idle' ? (
            <div className="mt-6 rounded-2xl border border-brand-green/18 bg-brand-green/[0.05] p-4">
              <div className="flex items-center gap-2 text-sm text-brand-green">
                <TimerReset className="h-4 w-4" />
                Code expires in {expiresInMinutes ?? 10} minutes.
              </div>
              <label className="mt-4 block text-sm font-medium text-white/70">
                Verification code
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  className="auth-input mt-2 max-w-sm font-mono text-lg"
                />
              </label>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading || !codeIsValid || step === 'verified'}
                  className="flex min-h-12 items-center justify-center rounded-xl bg-brand-green px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#1cffac] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-brand-green/35 hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="rounded-2xl border border-brand-border bg-brand-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-green">Production flow</p>
          <div className="mt-5 space-y-4">
            {[
              'Frontend validates E.164 phone format.',
              'Browser calls Burner Point API only.',
              'Railway backend calls Twilio Verify server-side.',
              'Auth and phone endpoints are rate limited.',
              'Successful verification updates the local user record.',
            ].map((item, index) => (
              <div key={item} className="flex gap-3">
                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10 font-mono text-xs text-brand-green">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-white/64">{item}</p>
              </div>
            ))}
          </div>

          {step === 'verified' ? (
            <div className="mt-6 rounded-2xl border border-brand-green/20 bg-brand-green/10 p-4">
              <div className="flex items-center gap-2 text-brand-green">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Verified</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/64">
                This number is approved for Burner Point onboarding and security checks.
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="rounded-2xl border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-green">Verification purchase flow</p>
            <h2 className="mt-2 text-2xl font-black uppercase leading-none text-white">
              Buy credits, choose platform, receive the code.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-muted">
              Product verifications should debit wallet credits after the user selects country, service, delivery route, and number. Provider calls stay server-side and the inbox shows SMS, OTP, or voice delivery state.
            </p>
          </div>
          <Link href="/dashboard/credits" className="bp-primary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em]">
            Buy Verification Credits
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            [Globe2, 'Country and service', 'Choose destination, platform, and provider route before reserving inventory.'],
            [CreditCard, 'Credit-backed checkout', 'Verification starts from $0.99+ and should reconcile through wallet ledger events.'],
            [ShieldCheck, 'Private delivery', 'SMS, OTP, and voice results stay tied to the selected Burner Point number.'],
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof Globe2;
            return (
              <article key={String(title)} className="rounded-xl border border-white/8 bg-black/20 p-4">
                <ItemIcon className="h-5 w-5 text-brand-green" />
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-white">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">{String(text)}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
