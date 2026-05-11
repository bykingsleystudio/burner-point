/**
 * apps/web/src/app/terms/page.tsx
 *
 * BurnerPoint Terms and Conditions
 */
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 prose prose-invert prose-sm lg:prose-base">
      <h1 className="text-3xl font-bold text-white mb-2">Terms and Conditions</h1>
      <p className="text-brand-muted text-sm mb-12">Last updated: April 2026</p>

      <section className="mb-10">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using BurnerPoint ("Service"), you agree to be bound by
          these Terms. If you do not agree, do not use the Service. These Terms
          form a legal agreement between you and BurnerPoint.
        </p>
      </section>

      <section className="mb-10">
        <h2>2. The Service</h2>
        <p>BurnerPoint provides:</p>
        <ul>
          <li>Temporary and rental phone numbers for SMS and voice reception</li>
          <li>OTP verification services</li>
          <li>Anonymous calling capabilities</li>
          <li>Developer APIs for programmatic number management</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2>3. Acceptable Use</h2>
        <h3>3.1 Permitted use</h3>
        <p>You may use the Service for:</p>
        <ul>
          <li>Protecting your personal privacy online</li>
          <li>Receiving verification codes from online services</li>
          <li>Separating personal and professional communications</li>
          <li>Legitimate business communications</li>
          <li>Testing applications that require phone number verification</li>
        </ul>

        <h3>3.2 Prohibited use</h3>
        <p>
          You may <strong>not</strong> use the Service to:
        </p>
        <ul>
          <li>Send unsolicited messages (spam) or operate robocalling systems</li>
          <li>Harass, stalk, threaten, or abuse others</li>
          <li>Engage in fraud, scams, or impersonation</li>
          <li>Violate any applicable law or regulation</li>
          <li>Bypass account restrictions imposed by third parties fraudulently</li>
          <li>Engage in illegal gambling, drug trafficking, or human trafficking</li>
          <li>Create multiple accounts to abuse free trials or referral programs</li>
          <li>Circumvent sanctions or export controls</li>
          <li>Use the Service in connection with child exploitation material</li>
          <li>Conduct DDoS attacks, port scans, or other network abuse</li>
        </ul>
        <p>
          Violations may result in immediate account termination without refund
          and may be reported to appropriate authorities.
        </p>
      </section>

      <section className="mb-10">
        <h2>4. Payments and Refunds</h2>
        <h3>4.1 Pricing</h3>
        <ul>
          <li>Pay-per-use: $0.99 per verification credit</li>
          <li>Rental: $5.99 per phone number (1–14 days)</li>
          <li>Subscription: $15.99/month (auto-renewing)</li>
        </ul>

        <h3>4.2 Refund policy</h3>
        <p>
          Unused credits may be refunded within 14 days of purchase.
          Credits consumed in transactions are non-refundable. Subscriptions
          may be cancelled at any time and remain active until the end of the
          billing period — no partial-month refunds.
        </p>
        <p>
          To request a refund, contact{' '}
          <a href="mailto:billing@burnerpoint.com">billing@burnerpoint.com</a>.
        </p>

        <h3>4.3 Payment processing</h3>
        <p>
          Payments are processed by third-party providers (Paystack, Flutterwave,
          Paddle, etc.). Your payment data is subject to their privacy policies.
          We do not store raw card numbers or bank account details.
        </p>
      </section>

      <section className="mb-10">
        <h2>5. Phone Numbers</h2>
        <p>
          Phone numbers provisioned through BurnerPoint are leased from our
          carrier partners (Twilio, Telnyx). Numbers are subject to:
        </p>
        <ul>
          <li>Availability in your requested country</li>
          <li>Carrier regulations and restrictions</li>
          <li>Expiry after your rental period ends</li>
          <li>Reclamation if found to be used for prohibited activities</li>
        </ul>
        <p>
          We do not guarantee specific numbers will remain available or that
          numbers will receive messages from all senders (some services block
          VoIP numbers by policy).
        </p>
      </section>

      <section className="mb-10">
        <h2>6. Account Security</h2>
        <p>You are responsible for:</p>
        <ul>
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activity that occurs under your account</li>
          <li>Notifying us immediately of any unauthorised access at security@burnerpoint.com</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2>7. Intellectual Property</h2>
        <p>
          The BurnerPoint name, logo, and all associated marks are trademarks of
          BurnerPoint. You may not use them without written permission. All
          software, designs, and content are proprietary to BurnerPoint.
        </p>
        <p>
          You grant BurnerPoint a limited license to process your messages
          solely for the purpose of delivering the Service (routing, AI
          classification, spam filtering).
        </p>
      </section>

      <section className="mb-10">
        <h2>8. Disclaimers and Limitation of Liability</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
          WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
          OR THAT MESSAGES WILL BE DELIVERED.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, BURNERPOINT'S TOTAL LIABILITY
          SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.
          WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
        </p>
      </section>

      <section className="mb-10">
        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify BurnerPoint from claims arising from your violation
          of these Terms, misuse of the Service, or infringement of third-party rights.
        </p>
      </section>

      <section className="mb-10">
        <h2>10. Termination</h2>
        <p>
          We may suspend or terminate your account for violation of these Terms.
          You may close your account at any time via Settings → Account → Delete Account.
          Upon termination, your data is deleted per our Privacy Policy.
        </p>
      </section>

      <section className="mb-10">
        <h2>11. Governing Law</h2>
        <p>
          These Terms are governed by applicable law. Disputes shall first be
          attempted to be resolved through good-faith negotiation. If unresolved,
          disputes will be submitted to binding arbitration.
        </p>
      </section>

      <section className="mb-10">
        <h2>12. Changes to Terms</h2>
        <p>
          We may update these Terms with 30 days' notice via email and in-app notification.
          Continued use after the effective date constitutes acceptance.
        </p>
      </section>

      <section className="mb-10">
        <h2>13. Contact</h2>
        <p>
          <strong>Legal inquiries:</strong>{' '}
          <a href="mailto:legal@burnerpoint.com">legal@burnerpoint.com</a><br />
          <strong>Abuse reports:</strong>{' '}
          <a href="mailto:abuse@burnerpoint.com">abuse@burnerpoint.com</a>
        </p>
      </section>
    </div>
  );
}
