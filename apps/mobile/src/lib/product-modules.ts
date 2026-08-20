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
    eyebrow: 'BP Verify Hub',
    title: 'Receive SMS and voice codes without using your personal number.',
    description:
      'Choose a supported country and service, request a private number, and watch the code arrive inside Burner Point.',
    status: 'Live verification session',
    primaryAction: { label: 'Choose Number', href: '/numbers' },
    secondaryAction: { label: 'Add Funds', href: '/billing' },
    stats: [
      { label: 'SMS', value: 'OTP' },
      { label: 'Voice', value: 'Where supported' },
      { label: 'Start', value: '$0.99+' },
    ],
    cards: [
      { meta: 'Services', title: 'Supported Verification', text: 'Use listed services and countries based on current availability.' },
      { meta: 'Codes', title: 'Live Delivery', text: 'Incoming SMS or voice OTP results stay visible in the verification session.' },
      { meta: 'Control', title: 'Pay On Result', text: 'Pricing depends on service, country, route quality, and successful delivery rules.' },
    ],
    workflow: ['Select service', 'Choose country', 'Get assigned number', 'Receive SMS or voice OTP'],
    note: 'Use BP Verify Hub only for accounts, services, and workflows you are authorized to access.',
  },
  rentals: {
    eyebrow: 'BP Rental Hub',
    title: 'Keep a number when you need continuity.',
    description:
      'Rent temporary or renewable numbers for repeated messages, recovery, and longer account workflows where supported.',
    status: 'Rental lifecycle',
    primaryAction: { label: 'Browse Numbers', href: '/numbers' },
    secondaryAction: { label: 'Add Funds', href: '/billing' },
    stats: [
      { label: 'Temporary', value: '$5.99+' },
      { label: 'Monthly', value: '$15.99+' },
      { label: 'Renewal', value: 'Optional' },
    ],
    cards: [
      { meta: 'Short Term', title: 'Non-Renewable', text: 'Use a fixed access window when you do not need to keep the number.' },
      { meta: 'Continuity', title: 'Renewable', text: 'Keep the same number active through renewal when inventory allows.' },
      { meta: 'Alerts', title: 'Expiry Control', text: 'See duration, renewal reminders, status changes, and support options.' },
    ],
    workflow: ['Pick country and type', 'Review price and duration', 'Confirm payment', 'Track expiry or renewal state'],
    note: 'Rental availability, SMS, and voice support depend on country, inventory, service rules, and plan type.',
  },
  esim: {
    eyebrow: 'BP eSIM Store',
    title: 'Travel data without a physical SIM swap.',
    description:
      'Buy country or regional eSIM data plans and keep activation details, usage status, and order history in one account.',
    status: 'Travel data catalog',
    primaryAction: { label: 'Open Billing', href: '/billing' },
    secondaryAction: { label: 'Support', href: '/support' },
    stats: [
      { label: 'Plans', value: 'Country' },
      { label: 'Regions', value: 'Global' },
      { label: 'Install', value: 'QR' },
    ],
    cards: [
      { meta: 'Travel', title: 'Destination Plans', text: 'Choose data plans by region, country, amount, and duration.' },
      { meta: 'Install', title: 'QR Activation', text: 'Follow setup guidance and check device compatibility before use.' },
      { meta: 'Usage', title: 'Plan Visibility', text: 'Review data amount, validity window, activation state, and order history.' },
    ],
    workflow: ['Choose destination', 'Select data package', 'Complete checkout', 'Install and monitor usage'],
    note: 'Most eSIM plans are data-only and require an eSIM-compatible device.',
  },
  proxies: {
    eyebrow: 'BP Proxy Store',
    title: 'Network access for approved use cases.',
    description:
      'Choose residential, datacenter, or rotating proxy plans for business, testing, research, geo-checking, and approved routing needs.',
    status: 'Plan access and session health',
    primaryAction: { label: 'Open Billing', href: '/billing' },
    secondaryAction: { label: 'Support', href: '/support' },
    stats: [
      { label: 'Types', value: '3+' },
      { label: 'Region', value: 'Select' },
      { label: 'Use', value: 'Approved' },
    ],
    cards: [
      { meta: 'Region', title: 'Location Control', text: 'Choose available regions for permitted browsing, testing, and research.' },
      { meta: 'Access', title: 'Setup Details', text: 'View plan instructions only after access is active on your account.' },
      { meta: 'Health', title: 'Session Status', text: 'Track active routes, usage state, renewal timing, and support paths.' },
    ],
    workflow: ['Select proxy type', 'Choose region', 'Activate plan', 'Review setup details and health'],
    note: 'Proxy access must be used lawfully and in accordance with Burner Point’s Acceptable Use Policy.',
  },
  vpn: {
    eyebrow: 'BP Secure Tunnel VPN',
    title: 'Secure your connection with private tunnel access.',
    description:
      'Use WireGuard-based secure tunnel plans with location choice, device setup guidance, and dedicated IP options where available.',
    status: 'Secure tunnel access',
    primaryAction: { label: 'Open Settings', href: '/settings' },
    secondaryAction: { label: 'Support', href: '/support' },
    stats: [
      { label: 'Protocol', value: 'WireGuard' },
      { label: 'IP', value: 'Dedicated' },
      { label: 'Devices', value: 'Managed' },
    ],
    cards: [
      { meta: 'Protect', title: 'Encrypted Access', text: 'Reduce exposure while using Burner Point and other approved workflows.' },
      { meta: 'Region', title: 'Server Choice', text: 'Choose from available secure tunnel locations and plan options.' },
      { meta: 'Devices', title: 'Setup Guidance', text: 'Review device limits, setup steps, and connection status in-app.' },
    ],
    workflow: ['Choose a plan', 'Select server location', 'Set up your device', 'Review status and renewal timing'],
    note: 'Secure Tunnel is built for lawful privacy, account protection, and safer connectivity.',
  },
  voicemail: {
    eyebrow: 'BP Messenger Pro',
    title: 'Missed calls stay attached to your private number.',
    description:
      'Voicemail, missed calls, transcripts, and callbacks live inside the same private communication timeline.',
    status: 'Conversation backup',
    primaryAction: { label: 'Open Calls', href: '/calls' },
    secondaryAction: { label: 'Open Inbox', href: '/messages' },
    stats: [
      { label: 'Audio', value: 'Private' },
      { label: 'Calls', value: 'Linked' },
      { label: 'Alerts', value: 'Ready' },
    ],
    cards: [
      { meta: 'Audio', title: 'Private Playback', text: 'Review missed-call audio inside your Burner Point account.' },
      { meta: 'Thread', title: 'Conversation Context', text: 'Pair voicemail with calls, SMS, MMS, contacts, and message history.' },
      { meta: 'Notify', title: 'Missed Call Alerts', text: 'Receive reminders when a private number has new voicemail activity.' },
    ],
    workflow: ['Miss a call', 'Open voicemail', 'Review context', 'Call back or message'],
    note: 'Availability depends on the number type, region, and active BP Messenger plan.',
  },
  support: {
    eyebrow: 'Support',
    title: 'Help for account, billing, and product delivery.',
    description:
      'Reach support for verification delivery, rentals, eSIM activation, proxies, secure tunnel access, account access, or billing reconciliation.',
    status: 'Support center',
    primaryAction: { label: 'Open Tickets', href: '/support-tickets' },
    secondaryAction: { label: 'Email Support', href: 'mailto:info@burnerpoint.com' },
    stats: [
      { label: 'Email', value: 'Active' },
      { label: 'Telegram', value: 'Ready' },
      { label: 'Tickets', value: 'Tracked' },
    ],
    cards: [
      { meta: 'Cases', title: 'Support Tickets', text: 'Track issue type, status, references, and resolution notes.' },
      { meta: 'Privacy', title: 'Scoped Intake', text: 'Share only the information needed to resolve the specific case.' },
      { meta: 'Outcome', title: 'Clear Resolution', text: 'Get next steps for refunds, retries, renewals, delivery, or account review.' },
    ],
    workflow: ['Choose category', 'Attach reference', 'Submit context', 'Track resolution'],
    note: 'Support works best when you include the product, order, number, payment reference, and timestamp when relevant.',
  },
  tickets: {
    eyebrow: 'Support Tickets',
    title: 'Track private support cases with clear status.',
    description:
      'A ticket queue gives users a structured path for failed OTPs, payment references, number issues, eSIM install help, proxies, and account access.',
    status: 'Ticket framework',
    primaryAction: { label: 'Contact Support', href: 'mailto:info@burnerpoint.com' },
    secondaryAction: { label: 'Back To Support', href: '/support' },
    stats: [
      { label: 'Scope', value: 'Private' },
      { label: 'Status', value: 'Clear' },
      { label: 'History', value: 'Saved' },
    ],
    cards: [
      { meta: 'Open', title: 'Case Intake', text: 'Collect category, affected service, reference, and severity.' },
      { meta: 'Trace', title: 'Resolution History', text: 'Show timestamps, user-visible notes, and final outcome.' },
      { meta: 'Secure', title: 'Sensitive Data', text: 'Avoid unnecessary uploads and keep requests focused.' },
    ],
    workflow: ['Create ticket', 'Attach references', 'Wait for review', 'Close with outcome'],
    note: 'Do not share passwords, recovery codes, or unrelated personal data in support tickets.',
  },
  developer: {
    eyebrow: 'Account Controls',
    title: 'Advanced account requests go through support.',
    description:
      'Burner Point keeps mobile screens focused on product actions. Higher-touch access requests should be reviewed through support.',
    status: 'Support-reviewed access',
    primaryAction: { label: 'Open Support', href: '/support' },
    secondaryAction: { label: 'Open Settings', href: '/settings' },
    stats: [
      { label: 'Review', value: 'Support' },
      { label: 'Privacy', value: 'Scoped' },
      { label: 'Control', value: 'Account' },
    ],
    cards: [
      { meta: 'Trust', title: 'Privacy Review', text: 'Use support for account requests that require additional review.' },
      { meta: 'Updates', title: 'Clear Next Steps', text: 'Track responses and approved account actions without technical setup noise.' },
      { meta: 'Safety', title: 'Safe Defaults', text: 'Keep sensitive account actions controlled, reversible, and easy to understand.' },
    ],
    workflow: ['Open support', 'Attach product reference', 'Wait for review', 'Follow approved next step'],
    note: 'Customer screens should show product choices, billing status, support paths, and account security—not internal controls.',
  },
} satisfies Record<string, MobileProductModule>;
