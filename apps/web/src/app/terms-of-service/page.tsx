import Link from 'next/link';

export default function TermsOfServicePage() {
  return <main className="auth-page"><section className="auth-card policy-card"><p className="eyebrow">BURNER POINT</p><h1>Terms of service.</h1><p className="auth-lead">Use Burner Point lawfully and keep your account credentials secure. You are responsible for activity performed through your account and for complying with provider and destination-service rules.</p><p className="auth-lead">Service availability, pricing, and product-specific limits are shown before an order or payment is confirmed.</p><p className="auth-switch"><Link href="/help-center">Contact Support</Link> <span>·</span> <Link href="/">Return home</Link></p></section></main>;
}
