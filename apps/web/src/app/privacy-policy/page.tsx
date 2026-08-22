import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return <main className="auth-page"><section className="auth-card policy-card"><p className="eyebrow">BURNER POINT</p><h1>Privacy policy.</h1><p className="auth-lead">Burner Point uses the account and service data needed to provide messaging, calling, connectivity, billing, and support. We do not sell personal information.</p><p className="auth-lead">You can request access, correction, export, or deletion of your personal data through Support.</p><p className="auth-switch"><Link href="/help-center">Open Support</Link> <span>·</span> <Link href="/">Return home</Link></p></section></main>;
}
