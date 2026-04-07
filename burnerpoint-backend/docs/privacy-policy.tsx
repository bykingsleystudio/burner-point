/**
 * apps/web/src/app/privacy/page.tsx
 *
 * BurnerPoint Privacy Policy
 * Last updated: automatically injected at build time
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 prose prose-invert prose-sm lg:prose-base">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-brand-muted text-sm mb-12">
        Last updated: April 2026 · Effective immediately
      </p>

      <section className="mb-10">
        <h2>1. Who We Are</h2>
        <p>
          BurnerPoint ("we," "our," "us") operates the BurnerPoint platform,
          including the website at burnerpoint.app, the iOS application, and the
          Android application (collectively, the "Service"). We provide temporary
          phone numbers for privacy-conscious individuals and businesses.
        </p>
        <p>
          Our core promise: <strong>Privacy is not a feature. It is the foundation.</strong>{' '}
          We collect the minimum data necessary to operate the Service and never
          sell your data.
        </p>
      </section>

      <section className="mb-10">
        <h2>2. Data We Collect</h2>

        <h3>2.1 Data you provide</h3>
        <ul>
          <li><strong>Email address</strong> — used for account creation and transactional emails</li>
          <li><strong>Phone number</strong> — used for account verification (via Twilio Verify OTP)</li>
          <li><strong>Payment information</strong> — processed by our payment partners (Paystack, Flutterwave, Paddle, etc.). We never store raw card numbers or bank details.</li>
          <li><strong>Profile information</strong> — first name, country (optional)</li>
        </ul>

        <h3>2.2 Data collected automatically</h3>
        <ul>
          <li><strong>IP address</strong> — used for rate limiting and abuse prevention</li>
          <li><strong>Device information</strong> — browser type, OS version (for debugging)</li>
          <li><strong>Usage logs</strong> — which features you use, when (no message content)</li>
          <li><strong>Cookies</strong> — session management only. We do not use advertising cookies.</li>
        </ul>

        <h3>2.3 Message data</h3>
        <p>
          SMS messages received on your BurnerPoint numbers are temporarily stored
          to deliver them to you. Messages are automatically deleted after{' '}
          <strong>30 days</strong>. We use AI to classify message content
          (OTP detection, spam filtering) — message content is processed but
          not used for advertising or shared with third parties.
        </p>
      </section>

      <section className="mb-10">
        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>Provide, operate, and improve the Service</li>
          <li>Process payments and prevent fraud</li>
          <li>Send transactional emails (receipts, security alerts)</li>
          <li>Detect and prevent abuse, spam, and illegal activity</li>
          <li>Comply with legal obligations</li>
          <li>Respond to customer support requests</li>
        </ul>
        <p>
          <strong>We do not:</strong> sell your data, use it for advertising,
          build behavioural profiles, or share it with data brokers.
        </p>
      </section>

      <section className="mb-10">
        <h2>4. Data Sharing</h2>
        <p>We share data only with:</p>
        <ul>
          <li><strong>Twilio / Telnyx</strong> — SMS and call routing (phone numbers only)</li>
          <li><strong>Payment processors</strong> — Paystack, Flutterwave, Squad, Korapay, OPay, Paddle, NOWPayments (payment information only)</li>
          <li><strong>OpenAI</strong> — message classification (message content, anonymised)</li>
          <li><strong>Resend</strong> — transactional email delivery (email address only)</li>
          <li><strong>Law enforcement</strong> — when required by valid legal process (we will notify you where permitted)</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2>5. Data Retention</h2>
        <table>
          <thead>
            <tr><th>Data Type</th><th>Retention Period</th></tr>
          </thead>
          <tbody>
            <tr><td>Account data</td><td>Until account deleted + 30 days</td></tr>
            <tr><td>SMS messages</td><td>30 days from receipt</td></tr>
            <tr><td>Payment records</td><td>7 years (tax compliance)</td></tr>
            <tr><td>Access logs</td><td>90 days</td></tr>
            <tr><td>Abuse/security logs</td><td>12 months</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access</strong> your personal data</li>
          <li><strong>Correct</strong> inaccurate data</li>
          <li><strong>Delete</strong> your account and associated data</li>
          <li><strong>Export</strong> your data (data portability)</li>
          <li><strong>Withdraw consent</strong> where processing is based on consent</li>
          <li><strong>Object</strong> to processing in certain circumstances</li>
        </ul>
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:privacy@burnerpoint.app">privacy@burnerpoint.app</a>.
          We respond within 30 days.
        </p>
      </section>

      <section className="mb-10">
        <h2>7. Security</h2>
        <p>We protect your data with:</p>
        <ul>
          <li>Encryption at rest (AES-256) and in transit (TLS 1.3)</li>
          <li>Short-lived JWT access tokens (15 minutes) with Redis-backed revocation</li>
          <li>Bcrypt password hashing (cost factor 12)</li>
          <li>Rate limiting on all endpoints</li>
          <li>Row-level security in the database</li>
          <li>Regular security audits</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2>8. Cookies</h2>
        <p>
          We use strictly necessary cookies only (session management, CSRF protection).
          No advertising cookies. No third-party tracking. You can disable cookies
          in your browser, though some features may not work.
        </p>
      </section>

      <section className="mb-10">
        <h2>9. Children</h2>
        <p>
          The Service is not directed at children under 16 (18 in some jurisdictions).
          We do not knowingly collect data from minors. If you believe a minor has
          created an account, contact us at privacy@burnerpoint.app.
        </p>
      </section>

      <section className="mb-10">
        <h2>10. International Transfers</h2>
        <p>
          Your data may be processed in the United States and other countries
          where our service providers operate. We ensure appropriate safeguards
          (Standard Contractual Clauses) are in place for transfers from the EU/EEA.
        </p>
      </section>

      <section className="mb-10">
        <h2>11. Changes to This Policy</h2>
        <p>
          We will notify you of material changes via email and in-app notice at
          least 30 days before the changes take effect. Continued use of the
          Service after changes constitutes acceptance.
        </p>
      </section>

      <section className="mb-10">
        <h2>12. Contact Us</h2>
        <p>
          <strong>Data Controller:</strong> BurnerPoint<br />
          <strong>Email:</strong>{' '}
          <a href="mailto:privacy@burnerpoint.app">privacy@burnerpoint.app</a><br />
          <strong>Support:</strong>{' '}
          <a href="mailto:support@burnerpoint.app">support@burnerpoint.app</a>
        </p>
      </section>
    </div>
  );
}
