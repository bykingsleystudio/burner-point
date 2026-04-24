export type MobileModuleAction = {
  label: string;
  href?: string;
  message?: string;
};

export type MobileProductModule = {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  primaryAction: MobileModuleAction;
  secondaryAction?: MobileModuleAction;
  stats: Array<{ label: string; value: string }>;
  cards: Array<{ title: string; text: string; meta: string }>;
  workflow: string[];
  note: string;
};

export const MOBILE_PRODUCT_MODULES = {
  verification: {
    eyebrow: 'Verification',
    title: 'Receive OTP without exposing your personal number.',
    description:
      'Use Burner Point numbers for SMS, OTP, and voice verification while keeping account setup separated from your real identity.',
    status: 'Global verification flow',
    primaryAction: { label: 'Choose Number', href: '/numbers' },
    secondaryAction: { label: 'Buy Credits', href: '/credits' },
    stats: [
      { label: 'SMS', value: 'OTP' },
      { label: 'Voice', value: 'Ready' },
      { label: 'Privacy', value: 'High' },
    ],
    cards: [
      { meta: 'Real SIM', title: 'Non-VoIP Access', text: 'Use SIM-backed inventory where provider acceptance matters.' },
      { meta: 'Codes', title: 'Fast Delivery', text: 'Incoming verification messages stay visible in the Burner Point inbox.' },
      { meta: 'Control', title: 'Short Lived', text: 'Use a number for one task or move into a rental when continuity matters.' },
    ],
    workflow: ['Select country and service', 'Choose available number', 'Submit it to the platform', 'Read SMS or voice code in Burner Point'],
    note: 'All provider calls must run through the Burner Point API. Twilio, Telnyx, and Tremil secrets never belong in the mobile bundle.',
  },
  rentals: {
    eyebrow: 'Rentals',
    title: 'Short-term and renewable numbers for controlled access.',
    description:
      'Rent a number for temporary verification, monthly recovery, or ongoing communication without tying activity to your personal line.',
    status: 'Rental lifecycle',
    primaryAction: { label: 'Browse Numbers', href: '/numbers' },
    secondaryAction: { label: 'Buy Credits', href: '/credits' },
    stats: [
      { label: 'One-time', value: '$5.99+' },
      { label: 'Monthly', value: '$15.99' },
      { label: 'Renewal', value: 'Manual' },
    ],
    cards: [
      { meta: 'Temporary', title: 'Non-Renewable', text: 'Use a fixed access window for projects, signups, and testing.' },
      { meta: 'Monthly', title: 'Renewable', text: 'Keep a number active for repeat verification and account recovery.' },
      { meta: 'Alerts', title: 'Expiry Control', text: 'Surface renewal, release, and support options before access changes.' },
    ],
    workflow: ['Pick country and type', 'Review price and duration', 'Confirm payment', 'Track expiry and renewal state'],
    note: 'Number assignment should happen after backend payment confirmation and inventory reservation.',
  },
  esim: {
    eyebrow: 'eSIM',
    title: 'Travel data without a physical SIM swap.',
    description:
      'Purchase and manage eSIM plans for global data connectivity from the same privacy-first account you use for numbers.',
    status: 'Global data catalog',
    primaryAction: { label: 'Buy Credits', href: '/credits' },
    secondaryAction: { label: 'Support', href: '/support' },
    stats: [
      { label: 'Activation', value: 'Instant' },
      { label: 'Coverage', value: 'Global' },
      { label: 'Data', value: 'Tracked' },
    ],
    cards: [
      { meta: 'Travel', title: 'Destination Plans', text: 'Choose data plans by region, country, and duration.' },
      { meta: 'Install', title: 'QR Activation', text: 'Show install status, QR guidance, and compatibility checks.' },
      { meta: 'Usage', title: 'Balance Visibility', text: 'Keep data remaining, validity, and renewal state easy to read.' },
    ],
    workflow: ['Choose destination', 'Select data package', 'Complete secure checkout', 'Install and monitor usage'],
    note: 'eSIM provisioning keys and webhooks must stay on the API service and update plan state idempotently.',
  },
  proxies: {
    eyebrow: 'Proxies',
    title: 'Routing flexibility for private access workflows.',
    description:
      'Use mobile or residential proxy access for location-aware browsing, testing, and account separation with server-side credential control.',
    status: 'Provisioning and credential delivery',
    primaryAction: { label: 'Buy Credits', href: '/credits' },
    secondaryAction: { label: 'Developer Tools', href: '/developer' },
    stats: [
      { label: 'Type', value: 'Mobile' },
      { label: 'Region', value: 'Select' },
      { label: 'Secrets', value: 'Masked' },
    ],
    cards: [
      { meta: 'Region', title: 'Location Control', text: 'Choose routing regions for app access, QA, or privacy workflows.' },
      { meta: 'Mask', title: 'Credential Safety', text: 'Reveal credentials intentionally and rotate them when needed.' },
      { meta: 'Health', title: 'Durability', text: 'Track active routes, failures, session status, and expiration.' },
    ],
    workflow: ['Select proxy type', 'Choose region', 'Provision through backend', 'Show masked credentials and health'],
    note: 'Proxy credentials must never be embedded in the mobile app. The client should only receive scoped provisioning results.',
  },
  vpn: {
    eyebrow: 'VPN',
    title: 'In-platform privacy protection for Burner Point sessions.',
    description:
      'The VPN layer reduces exposure while using Burner Point. It is part of the platform, not a standalone consumer VPN product.',
    status: 'WireGuard control plane',
    primaryAction: { label: 'Open Settings', href: '/settings' },
    secondaryAction: { label: 'Support', href: '/support' },
    stats: [
      { label: 'Mode', value: 'Built-in' },
      { label: 'Protocol', value: 'WG' },
      { label: 'Logs', value: 'Min' },
    ],
    cards: [
      { meta: 'Protect', title: 'Session Routing', text: 'Connect through a protected route before sensitive workflows.' },
      { meta: 'Region', title: 'Server Choice', text: 'Show available regions without turning the feature into a separate product.' },
      { meta: 'Trust', title: 'No-Logs Posture', text: 'Limit telemetry to safety, abuse prevention, reliability, and billing.' },
    ],
    workflow: ['Check eligibility', 'Generate profile server-side', 'Connect selected region', 'Display status and rotation'],
    note: 'WireGuard private server keys and config generation must stay backend-only.',
  },
  voicemail: {
    eyebrow: 'Voicemail',
    title: 'Missed calls stay attached to your private number.',
    description:
      'Voicemail, missed calls, transcripts, and callbacks should live inside the same private communication timeline.',
    status: 'Conversation backup',
    primaryAction: { label: 'Open Calls', href: '/calls' },
    secondaryAction: { label: 'Open Inbox', href: '/messages' },
    stats: [
      { label: 'Audio', value: 'Private' },
      { label: 'Calls', value: 'Linked' },
      { label: 'Alerts', value: 'Ready' },
    ],
    cards: [
      { meta: 'Audio', title: 'Secure Playback', text: 'Use signed playback links and private object storage for recordings.' },
      { meta: 'Thread', title: 'Context', text: 'Pair voicemail with calls, SMS, MMS, secure audio, photo and video sharing, and contact history.' },
      { meta: 'Notify', title: 'Missed Call Alerts', text: 'Send push alerts when a private number receives voicemail.' },
    ],
    workflow: ['Receive missed call', 'Attach recording to number', 'Notify user', 'Protect playback access'],
    note: 'Voicemail files should be private by default and only exposed through short-lived signed URLs.',
  },
  support: {
    eyebrow: 'Support',
    title: 'Help for account, billing, and telecom delivery.',
    description:
      'Reach support for verification delivery, rentals, eSIM activation, proxies, VPN, account access, or billing reconciliation.',
    status: 'Support operations',
    primaryAction: { label: 'Open Tickets', href: '/support-tickets' },
    secondaryAction: { label: 'Email Support', href: 'mailto:info.burnerpoint@gmail.com' },
    stats: [
      { label: 'Email', value: 'Active' },
      { label: 'Telegram', value: 'Ready' },
      { label: 'Tickets', value: 'Next' },
    ],
    cards: [
      { meta: 'Cases', title: 'Support Tickets', text: 'Track issue type, status, references, and resolution notes.' },
      { meta: 'Privacy', title: 'Scoped Intake', text: 'Avoid collecting sensitive information unless required for the case.' },
      { meta: 'Ops', title: 'Escalation', text: 'Route provider, payment, or account issues to the right team.' },
    ],
    workflow: ['Choose category', 'Attach reference', 'Submit context', 'Track resolution'],
    note: 'Support attachments should use private storage, strict access control, audit logs, and retention rules.',
  },
  tickets: {
    eyebrow: 'Tickets',
    title: 'Track private support cases with clear status.',
    description:
      'A ticket queue gives users a structured path for failed OTPs, payment references, number issues, eSIM install help, proxies, and account access.',
    status: 'Ticket framework',
    primaryAction: { label: 'Contact Support', href: 'mailto:info.burnerpoint@gmail.com' },
    secondaryAction: { label: 'Back To Support', href: '/support' },
    stats: [
      { label: 'Scope', value: 'Private' },
      { label: 'Audit', value: 'On' },
      { label: 'Status', value: 'Clear' },
    ],
    cards: [
      { meta: 'Open', title: 'Case Intake', text: 'Collect category, affected service, reference, and severity.' },
      { meta: 'Trace', title: 'History', text: 'Show timestamps, user-visible notes, and final outcome.' },
      { meta: 'Secure', title: 'Sensitive Data', text: 'Keep IDs, documents, or uploads private and access controlled.' },
    ],
    workflow: ['Create ticket', 'Attach references', 'Route internally', 'Close with outcome'],
    note: 'Production tickets need role-based support access and immutable audit events.',
  },
  developer: {
    eyebrow: 'Developer Tools',
    title: 'API keys and webhooks for private telecom workflows.',
    description:
      'Build verification, number provisioning, inbox, webhook, and billing workflows through Burner Point backend endpoints.',
    status: 'Developer console',
    primaryAction: { label: 'Open Web API', href: '/settings' },
    secondaryAction: { label: 'Support', href: '/support' },
    stats: [
      { label: 'Keys', value: 'Scoped' },
      { label: 'Events', value: 'Hooks' },
      { label: 'Auth', value: 'Bearer' },
    ],
    cards: [
      { meta: 'Keys', title: 'Scoped Access', text: 'Create least-privilege keys from the secure web dashboard.' },
      { meta: 'Events', title: 'Webhooks', text: 'Receive message, payment, verification, and number lifecycle events.' },
      { meta: 'Docs', title: 'Contracts', text: 'Keep API usage typed, documented, rate-limited, and observable.' },
    ],
    workflow: ['Create API key on web', 'Configure webhook URL', 'Verify signatures', 'Consume events idempotently'],
    note: 'Raw API keys should be shown once, hashed server-side, and revocable from the dashboard.',
  },
} satisfies Record<string, MobileProductModule>;
