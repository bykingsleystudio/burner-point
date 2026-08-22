'use client';
import Link from 'next/link';
import { useState } from 'react';

const options = ['Messaging', 'Verification', 'Number Rentals', 'eSIM', 'Proxies', 'VPN'];
const steps = ['Welcome', 'Services', 'Security', 'Finish'];

export default function OnboardingPage() {
	const [step, setStep] = useState(0);
	const [selected, setSelected] = useState<string[]>([]);

	function finish() {
		window.localStorage.setItem('bp_onboarding_products', JSON.stringify(selected));
		window.localStorage.setItem('bp_onboarding_complete', 'true');
		window.location.href = '/dashboard';
	}

	return <main className="auth-page"><div className="auth-brand"><Link href="/" className="brand"><span className="brand-mark">BP</span><span>Burner Point</span></Link><span className="auth-caption">A more private way to connect.</span></div><section className="auth-card onboarding-card"><div className="onboarding-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((label, index) => <div className={index <= step ? 'onboarding-step active' : 'onboarding-step'} key={label}><span>{String(index + 1).padStart(2, '0')}</span>{label}</div>)}</div>{step === 0 && <><p className="eyebrow">STEP 01</p><h1>Welcome to Burner Point.</h1><p className="auth-lead">One private workspace for the services you use to connect, verify, and move online.</p><button className="button button-accent" onClick={() => setStep(1)}>Get started <span>→</span></button></>}{step === 1 && <><p className="eyebrow">STEP 02</p><h1>Choose what you want to use.</h1><p className="auth-lead">Pick any services you want to see first. You can change this later.</p><div className="onboarding-options">{options.map((option) => <button type="button" className={selected.includes(option) ? 'onboarding-option selected' : 'onboarding-option'} onClick={() => setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])} key={option}><span>{selected.includes(option) ? '✓' : '+'}</span>{option}</button>)}</div><button className="button button-accent" onClick={() => setStep(2)}>Continue <span>→</span></button></>}{step === 2 && <><p className="eyebrow">STEP 03</p><h1>Security setup.</h1><p className="auth-lead">Your account is ready. Review sessions and add passkeys or other security controls any time from your Security area.</p><div className="onboarding-security"><span className="security-mark">✓</span><div><strong>Account protection is ready</strong><p>We will keep your security settings available in the workspace.</p></div></div><button className="button button-accent" onClick={() => setStep(3)}>Continue <span>→</span></button></>}{step === 3 && <><p className="eyebrow">STEP 04</p><h1>You are ready.</h1><p className="auth-lead">Your Burner Point workspace is set up. Start with {selected.length ? selected.join(', ') : 'any service'}.</p><button className="button button-accent" onClick={finish}>Open workspace <span>→</span></button></>}<Link className="skip-link" href="/dashboard">Skip setup</Link></section></main>;
}
