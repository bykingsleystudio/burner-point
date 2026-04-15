import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Code2,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  Image as ImageIcon,
  KeyRound,
  Lock,
  MessageSquare,
  Phone,
  Radio,
  ShieldCheck,
  Smartphone,
  Ticket,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type IconKey =
  | 'bell'
  | 'calendar'
  | 'check'
  | 'code'
  | 'credit'
  | 'file'
  | 'globe'
  | 'headphones'
  | 'image'
  | 'key'
  | 'lock'
  | 'message'
  | 'phone'
  | 'radio'
  | 'shield'
  | 'smartphone'
  | 'ticket'
  | 'wifi';

type ModuleAction = { label: string; href: string };
type ModuleCard = { title: string; text: string; icon: IconKey; meta?: string };

export type DashboardModuleContent = {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  primaryAction: ModuleAction;
  secondaryAction?: ModuleAction;
  stats: Array<{ label: string; value: string }>;
  cards: ModuleCard[];
  workflow: string[];
  note: string;
};

const icons: Record<IconKey, LucideIcon> = {
  bell: Bell,
  calendar: CalendarDays,
  check: CheckCircle2,
  code: Code2,
  credit: CreditCard,
  file: FileText,
  globe: Globe2,
  headphones: Headphones,
  image: ImageIcon,
  key: KeyRound,
  lock: Lock,
  message: MessageSquare,
  phone: Phone,
  radio: Radio,
  shield: ShieldCheck,
  smartphone: Smartphone,
  ticket: Ticket,
  wifi: Wifi,
};

export const dashboardModules: Record<string, DashboardModuleContent> = {
  messages: {
    eyebrow: 'Conversation Inbox',
    title: 'SMS, MMS, photos, and private message threads.',
    description:
      'Keep text conversations attached to the Burner Point number that received them. The module is designed for US/Canada SMS, MMS, photo messaging, call context, and WiFi/data communication history.',
    status: 'Threaded communication',
    primaryAction: { label: 'Open Inbox', href: '/dashboard/inbox' },
    secondaryAction: { label: 'Manage Numbers', href: '/dashboard/numbers' },
    stats: [
      { label: 'Media', value: 'MMS' },
      { label: 'Photos', value: 'Private' },
      { label: 'Region', value: 'US/CA' },
    ],
    cards: [
      { icon: 'message', title: 'Threaded SMS', text: 'Read inbound and outbound messages by number, contact, service, and delivery status.', meta: 'Text' },
      { icon: 'image', title: 'MMS and Photos', text: 'Attach protected media metadata to each conversation without public upload exposure.', meta: 'Media' },
      { icon: 'phone', title: 'Voice Context', text: 'Connect call activity and voicemail to the same communication timeline.', meta: 'Calls' },
    ],
    workflow: ['Select a conversation number', 'Open the active contact or service thread', 'Send or receive SMS, MMS, and photos', 'Preserve delivery, spam, and OTP context'],
    note: 'Messaging, MMS, photo storage, and provider callbacks must be normalized by the backend before anything reaches the client. Twilio secrets stay server-side.',
  },
  calls: {
    eyebrow: 'US/Canada Conversation',
    title: 'Private calls over WiFi and mobile data.',
    description:
      'Run voice conversations from a Burner Point number without exposing your personal line. Calls are designed for US and Canada conversation numbers with voicemail and activity history.',
    status: 'Conversation infrastructure',
    primaryAction: { label: 'Open Inbox', href: '/dashboard/inbox' },
    secondaryAction: { label: 'Manage Numbers', href: '/dashboard/numbers' },
    stats: [
      { label: 'Region', value: 'US/CA' },
      { label: 'Transport', value: 'WiFi/Data' },
      { label: 'Identity', value: 'Separated' },
    ],
    cards: [
      { icon: 'phone', title: 'Call Routing', text: 'Route inbound and outbound voice through assigned conversation numbers.', meta: 'Voice' },
      { icon: 'wifi', title: 'No Roaming Exposure', text: 'Use WiFi or cellular data so private communication stays portable.', meta: 'Data' },
      { icon: 'shield', title: 'Number Separation', text: 'Keep business, marketplace, dating, and travel calls away from your real number.', meta: 'Privacy' },
    ],
    workflow: ['Select an active US/CA conversation number', 'Choose or enter a contact', 'Start the call over data', 'Store call activity and voicemail status'],
    note: 'Live call provider actions remain backend-only and should be routed through Twilio Voice/WebRTC when enabled.',
  },
  voicemail: {
    eyebrow: 'Call Backup',
    title: 'Voicemail that keeps missed calls controlled.',
    description:
      'Voicemail belongs inside the private conversation layer, so missed calls, recordings, transcripts, and callbacks stay attached to the Burner Point number that received them.',
    status: 'Secure voicemail layer',
    primaryAction: { label: 'Open Calls', href: '/dashboard/calls' },
    secondaryAction: { label: 'Open Inbox', href: '/dashboard/inbox' },
    stats: [
      { label: 'Playback', value: 'Private' },
      { label: 'Routing', value: 'Number-bound' },
      { label: 'Status', value: 'Tracked' },
    ],
    cards: [
      { icon: 'headphones', title: 'Private Playback', text: 'Listen to voicemail from the dashboard without exposing public recording URLs.', meta: 'Audio' },
      { icon: 'message', title: 'Thread Context', text: 'Pair voicemail, calls, SMS, and MMS in the same communication history.', meta: 'Context' },
      { icon: 'bell', title: 'Missed Call Alerts', text: 'Notify users when a conversation number receives voicemail or call activity.', meta: 'Alerts' },
    ],
    workflow: ['Receive missed call event', 'Attach voicemail to the number', 'Protect playback access', 'Notify the user and preserve activity history'],
    note: 'Voicemail storage should use private object storage and signed URLs once recordings are enabled.',
  },
  rentals: {
    eyebrow: 'Number Rentals',
    title: 'Temporary when speed matters. Renewable when continuity matters.',
    description:
      'Rent secure non-VoIP numbers for one-time workflows or keep a renewable monthly number active for account recovery, messaging, and controlled communication.',
    status: 'Rental lifecycle',
    primaryAction: { label: 'Get Number', href: '/dashboard/numbers' },
    secondaryAction: { label: 'Buy Credits', href: '/dashboard/credits' },
    stats: [
      { label: 'Short-term', value: '$5.99+' },
      { label: 'Monthly', value: '$15.99+' },
      { label: 'Renewal', value: 'Controlled' },
    ],
    cards: [
      { icon: 'calendar', title: 'Non-Renewable Rentals', text: 'Use numbers for fixed windows where automatic renewal is not needed.', meta: '1-14 days' },
      { icon: 'radio', title: 'Renewable Rentals', text: 'Keep an identity line active for repeat verifications and recovery workflows.', meta: 'Monthly' },
      { icon: 'shield', title: 'Expiry Control', text: 'Show expiry, renewal, release, and support paths before access changes.', meta: 'Lifecycle' },
    ],
    workflow: ['Select country and number type', 'Confirm price and duration', 'Activate after payment confirmation', 'Renew or release before expiry'],
    note: 'Rental assignment should happen only after gateway webhook confirmation and wallet ledger reconciliation.',
  },
  esim: {
    eyebrow: 'Global Connectivity',
    title: 'eSIM plans without physical SIM friction.',
    description:
      'Burner Point eSIM management is designed for travel-ready data, instant activation, and multi-country connectivity while keeping privacy tooling in one account.',
    status: '1GLOBAL-ready catalog',
    primaryAction: { label: 'Buy Credits', href: '/dashboard/credits' },
    secondaryAction: { label: 'Contact Support', href: '/dashboard/support' },
    stats: [
      { label: 'Activation', value: 'Instant' },
      { label: 'Coverage', value: 'Multi-country' },
      { label: 'Control', value: 'In-app' },
    ],
    cards: [
      { icon: 'smartphone', title: 'Device Setup', text: 'Prepare activation QR, install status, and compatible-device guidance.', meta: 'eSIM' },
      { icon: 'globe', title: 'Travel Data', text: 'Offer region-aware plans for travel, remote work, and backup connectivity.', meta: 'Global' },
      { icon: 'check', title: 'Usage Visibility', text: 'Show data balance, validity, active plan, and renewal prompts.', meta: 'Control' },
    ],
    workflow: ['Choose destination or region', 'Select data amount and duration', 'Pay through backend checkout', 'Show activation and usage state'],
    note: 'Provider keys for 1GLOBAL must stay on the API service and webhook events must update plan status idempotently.',
  },
  proxies: {
    eyebrow: 'Routing Flexibility',
    title: 'Proxy access for location-aware privacy workflows.',
    description:
      'Proxy management gives users secure routing options, location flexibility, and provider health visibility without exposing Bright Data credentials to the client.',
    status: 'Provider abstraction',
    primaryAction: { label: 'Buy Credits', href: '/dashboard/credits' },
    secondaryAction: { label: 'Open API Tools', href: '/dashboard/api' },
    stats: [
      { label: 'Types', value: 'Mobile/Residential' },
      { label: 'Regions', value: 'Selectable' },
      { label: 'Secrets', value: 'Server-side' },
    ],
    cards: [
      { icon: 'globe', title: 'Region Control', text: 'Select routing regions for browsing, testing, and account separation.', meta: 'Location' },
      { icon: 'lock', title: 'Credential Masking', text: 'Show proxy credentials once, mask stored values, and rotate safely.', meta: 'Secrets' },
      { icon: 'radio', title: 'Health Checks', text: 'Track active routes, durability, rotation, and provider failures.', meta: 'Reliability' },
    ],
    workflow: ['Choose proxy type and region', 'Confirm price and duration', 'Provision through backend adapter', 'Display masked credentials and rotation status'],
    note: 'Bright Data API keys and webhook signatures belong in Railway environment variables only.',
  },
  vpn: {
    eyebrow: 'Built-In Protection',
    title: 'Privacy protection inside Burner Point, not a standalone VPN.',
    description:
      'The VPN layer should reduce exposure while users operate Burner Point services. It belongs to the platform security model, paired with numbers, eSIM, proxies, and account controls.',
    status: 'WireGuard control plane',
    primaryAction: { label: 'See Security', href: '/security' },
    secondaryAction: { label: 'Open Support', href: '/dashboard/support' },
    stats: [
      { label: 'Mode', value: 'Integrated' },
      { label: 'Protocol', value: 'WireGuard' },
      { label: 'Logs', value: 'Minimized' },
    ],
    cards: [
      { icon: 'lock', title: 'Protected Session', text: 'Toggle protection while using communication, billing, and account workflows.', meta: 'Security' },
      { icon: 'globe', title: 'Server Selection', text: 'Expose regions clearly without selling the VPN as a separate product.', meta: 'Routing' },
      { icon: 'shield', title: 'No-Logs Posture', text: 'Keep telemetry limited to abuse prevention, reliability, and billing safety.', meta: 'Trust' },
    ],
    workflow: ['Check account eligibility', 'Generate WireGuard profile server-side', 'Connect to selected region', 'Display status and rotate credentials safely'],
    note: 'VPN config generation must use secure storage and never expose private server keys to frontend bundles.',
  },
  support: {
    eyebrow: 'High-Trust Support',
    title: 'Support for account access, billing, and telecom delivery.',
    description:
      'Support must understand privacy workflows: verification delivery, rental continuity, number status, payment reconciliation, eSIM activation, proxies, and account security.',
    status: 'Support operations',
    primaryAction: { label: 'Open Tickets', href: '/dashboard/support/tickets' },
    secondaryAction: { label: 'Email Support', href: 'mailto:info.burnerpoint@gmail.com' },
    stats: [
      { label: 'Email', value: 'Active' },
      { label: 'Telegram', value: 'Active' },
      { label: 'Tickets', value: 'Planned' },
    ],
    cards: [
      { icon: 'ticket', title: 'Support Tickets', text: 'Track issues with category, service, number, gateway reference, and status.', meta: 'Cases' },
      { icon: 'shield', title: 'Privacy Triage', text: 'Avoid asking users to expose sensitive identity data unless truly required.', meta: 'Trust' },
      { icon: 'check', title: 'Resolution Notes', text: 'Give users clear outcomes for refunds, retries, renewals, and provider failures.', meta: 'Clarity' },
    ],
    workflow: ['Collect issue category and reference', 'Attach account and provider context', 'Escalate telecom or payment failures', 'Close with clear resolution history'],
    note: 'Future ticket endpoints should include audit logs and role-based access for support operators.',
  },
  tickets: {
    eyebrow: 'Support Tickets',
    title: 'Track service, billing, and privacy support from one queue.',
    description:
      'Support tickets give users a controlled way to report failed OTP delivery, number expiry, payment references, eSIM activation, proxy durability, and account access issues without leaking unnecessary personal data.',
    status: 'Ticket framework',
    primaryAction: { label: 'Open Support', href: '/dashboard/support' },
    secondaryAction: { label: 'Email Support', href: 'mailto:info.burnerpoint@gmail.com' },
    stats: [
      { label: 'Categories', value: '7' },
      { label: 'Privacy', value: 'Scoped' },
      { label: 'Audit', value: 'Logged' },
    ],
    cards: [
      { icon: 'ticket', title: 'Case Intake', text: 'Collect issue type, service, affected number, order, payment reference, and severity.', meta: 'Open' },
      { icon: 'file', title: 'Resolution History', text: 'Show user-visible status changes, operator notes, and final outcomes.', meta: 'Trace' },
      { icon: 'shield', title: 'Sensitive Data Guardrails', text: 'Request IDs or documents only when legally required and store them privately.', meta: 'Privacy' },
    ],
    workflow: ['Create ticket with scoped context', 'Attach telecom, payment, or account references', 'Route to support or operations', 'Close with refund, retry, renewal, or explanation'],
    note: 'Ticket data should use role-based access, audit logging, private attachments, and strict retention rules before production support launch.',
  },
  billing: {
    eyebrow: 'Credits and Billing',
    title: 'Credits, purchases, subscriptions, and payment history.',
    description:
      'Billing keeps verification credits, rental purchases, monthly plans, gateway checkout state, transaction history, refunds, and reconciliation in one controlled account surface.',
    status: 'Payment center',
    primaryAction: { label: 'Buy Credits', href: '/dashboard/credits' },
    secondaryAction: { label: 'Open Support', href: '/dashboard/support' },
    stats: [
      { label: 'Verify', value: '$0.99+' },
      { label: 'Rental', value: '$5.99+' },
      { label: 'Monthly', value: '$15.99' },
    ],
    cards: [
      { icon: 'credit', title: 'Wallet Credits', text: 'Use wallet balance for verifications, rentals, eSIM, proxies, and renewals.', meta: 'Credits' },
      { icon: 'bell', title: 'Webhook-Safe Updates', text: 'Balance changes only after gateway confirmation and idempotent ledger entries.', meta: 'Events' },
      { icon: 'file', title: 'Transaction History', text: 'Expose references, gateway status, product assignment, and receipt support.', meta: 'Ledger' },
    ],
    workflow: ['Choose package or product', 'Create checkout through Burner Point API', 'Confirm payment by webhook', 'Update ledger and assign inventory'],
    note: 'Gateway integrations must remain backend-only. Mobile in-app purchases need Apple and Google policy review before selling digital goods in native checkout.',
  },
  developer: {
    eyebrow: 'API and Developer Tools',
    title: 'API keys, webhooks, and telecom automation.',
    description:
      'Developer tools let teams automate private verification, number provisioning, inbox events, webhooks, and account-safe workflows through scoped API access.',
    status: 'Developer console',
    primaryAction: { label: 'Manage API Keys', href: '/dashboard/api' },
    secondaryAction: { label: 'View Docs', href: '/api/docs' },
    stats: [
      { label: 'Auth', value: 'Bearer' },
      { label: 'Events', value: 'Webhooks' },
      { label: 'Keys', value: 'Scoped' },
    ],
    cards: [
      { icon: 'key', title: 'Scoped Keys', text: 'Create and revoke API keys with least-privilege scopes for production workflows.', meta: 'Keys' },
      { icon: 'bell', title: 'Webhook Events', text: 'Deliver payment, message, call, number, and verification events to developer systems.', meta: 'Events' },
      { icon: 'code', title: 'API Contracts', text: 'Keep endpoints typed, documented, rate-limited, and compatible across web and mobile.', meta: 'REST' },
    ],
    workflow: ['Create a named API key', 'Configure webhook URL and event types', 'Verify signatures server-side', 'Provision numbers or consume events safely'],
    note: 'Raw API keys should be shown once, stored hashed, and protected by rate limits, audit logging, and revoke flows.',
  },
};

function ExternalAwareLink({ action, className, children }: { action: ModuleAction; className: string; children: ReactNode }) {
  const external = action.href.startsWith('http') || action.href.startsWith('mailto:');
  if (external) {
    return (
      <a href={action.href} className={className} {...(action.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={action.href} className={className}>
      {children}
    </Link>
  );
}

export function DashboardModulePage({ module }: { module: DashboardModuleContent }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-lg border border-brand-border bg-brand-card">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brand-green">{module.eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-none text-white md:text-5xl">
              {module.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted md:text-base">
              {module.description}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ExternalAwareLink
                action={module.primaryAction}
                className="bp-button-glow inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac]"
              >
                {module.primaryAction.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </ExternalAwareLink>
              {module.secondaryAction ? (
                <ExternalAwareLink
                  action={module.secondaryAction}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:border-brand-green/35 hover:text-white"
                >
                  {module.secondaryAction.label}
                </ExternalAwareLink>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-brand-green/18 bg-brand-green/[0.055] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Module status</p>
                <p className="mt-2 text-lg font-semibold text-white">{module.status}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-green/25 bg-black/25">
                <ShieldCheck className="h-5 w-5 text-brand-green" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {module.stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/8 bg-black/20 p-3">
                  <p className="font-mono text-base font-semibold text-brand-green">{stat.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/38">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {module.cards.map((card) => {
          const Icon = icons[card.icon];
          return (
            <article key={card.title} className="rounded-lg border border-brand-border bg-brand-card p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10">
                  <Icon className="h-5 w-5 text-brand-green" />
                </span>
                {card.meta ? (
                  <span className="rounded-lg border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/48">
                    {card.meta}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-brand-muted">{card.text}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-brand-border bg-brand-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Workflow</p>
          <div className="mt-4 space-y-3">
            {module.workflow.map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10 font-mono text-xs text-brand-green">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-white/66">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-brand-green/16 bg-brand-green/[0.045] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Security note</p>
          <p className="mt-4 text-sm leading-7 text-white/66">{module.note}</p>
        </div>
      </section>
    </div>
  );
}
