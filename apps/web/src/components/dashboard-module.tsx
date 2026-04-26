import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  Image as ImageIcon,
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
  | 'credit'
  | 'file'
  | 'globe'
  | 'headphones'
  | 'image'
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
  credit: CreditCard,
  file: FileText,
  globe: Globe2,
  headphones: Headphones,
  image: ImageIcon,
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
    title: 'SMS, secure media, and private message threads.',
    description:
      'Keep text conversations attached to the Burner Point number that received them. The module is designed for US/Canada SMS, secure audio, photo and video sharing, call context, and WiFi & Data communication history.',
    status: 'Threaded communication',
    primaryAction: { label: 'Open Inbox', href: '/dashboard/inbox' },
    secondaryAction: { label: 'Manage Numbers', href: '/dashboard/numbers' },
    stats: [
      { label: 'Media', value: 'MMS' },
      { label: 'Media', value: 'Private' },
      { label: 'Region', value: 'US/CA' },
    ],
    cards: [
      { icon: 'message', title: 'Threaded SMS', text: 'Read inbound and outbound messages by number, contact, service, and delivery status.', meta: 'Text' },
      { icon: 'image', title: 'Audio, Photo and Video', text: 'Attach protected media metadata to each conversation without public upload exposure.', meta: 'Media' },
      { icon: 'phone', title: 'Voice Context', text: 'Connect call activity and voicemail to the same communication timeline.', meta: 'Calls' },
    ],
    workflow: ['Select a conversation number', 'Open the active contact or service thread', 'Send or receive SMS plus audio, photo and video', 'Preserve delivery, spam, and OTP context'],
    note: 'Keep each conversation attached to the right number so messages, media, and follow-up actions stay easy to manage.',
  },
  calls: {
    eyebrow: 'US/Canada Conversation',
    title: 'Private calls over WiFi & Data.',
    description:
      'Run voice conversations from a Burner Point number without exposing your personal line. Calls are designed for US and Canada conversation numbers with voicemail and activity history.',
    status: 'Conversation infrastructure',
    primaryAction: { label: 'Open Inbox', href: '/dashboard/inbox' },
    secondaryAction: { label: 'Manage Numbers', href: '/dashboard/numbers' },
    stats: [
      { label: 'Region', value: 'US/CA' },
      { label: 'Transport', value: 'WiFi & Data' },
      { label: 'Identity', value: 'Separated' },
    ],
    cards: [
      { icon: 'phone', title: 'Call Routing', text: 'Route inbound and outbound voice through assigned conversation numbers.', meta: 'Voice' },
      { icon: 'wifi', title: 'No Roaming Exposure', text: 'Use WiFi & Data so private communication stays portable.', meta: 'Data' },
      { icon: 'shield', title: 'Number Separation', text: 'Keep business, marketplace, dating, and travel calls away from your real number.', meta: 'Privacy' },
    ],
    workflow: ['Select an active US/CA conversation number', 'Choose or enter a contact', 'Start the call over data', 'Store call activity and voicemail status'],
    note: 'Call quality, missed activity, and voicemail should stay grouped by number so you can respond quickly.',
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
    note: 'Voicemail should stay attached to the number that received it, with playback, callback, and follow-up in one place.',
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
    note: 'Rental timing, renewal choices, and support references should stay visible before a number changes state.',
  },
  esim: {
    eyebrow: 'BP eSIM Store',
    title: 'eSIM plans without physical SIM friction.',
    description:
      'Burner Point eSIM management is designed for travel-ready data, instant activation, and multi-country connectivity while keeping privacy tooling in one account.',
    status: 'Global data catalog',
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
    workflow: ['Choose destination or region', 'Select data amount and duration', 'Complete checkout', 'Show activation and usage state'],
    note: 'Choose a plan, activate it on a compatible device, and monitor usage without leaving your Burner Point account.',
  },
  proxies: {
    eyebrow: 'BP Proxy Store',
    title: 'Proxy access for location-aware privacy workflows.',
    description:
      'Proxy management gives users approved routing options, location flexibility, and connection health visibility from one clean account surface.',
    status: 'Plan access and session health',
    primaryAction: { label: 'Buy Credits', href: '/dashboard/credits' },
    secondaryAction: { label: 'Open Support', href: '/dashboard/support' },
    stats: [
      { label: 'Types', value: 'Mobile/Residential' },
      { label: 'Regions', value: 'Selectable' },
      { label: 'Use', value: 'Approved' },
    ],
    cards: [
      { icon: 'globe', title: 'Region Control', text: 'Select routing regions for browsing, testing, and account separation.', meta: 'Location' },
      { icon: 'lock', title: 'Access Delivery', text: 'View setup details only when a proxy plan is active on your account.', meta: 'Access' },
      { icon: 'radio', title: 'Health Checks', text: 'Track active routes, durability, rotation, and connection issues.', meta: 'Reliability' },
    ],
    workflow: ['Choose proxy type and region', 'Confirm price and duration', 'Activate access', 'Review setup details and session status'],
    note: 'Proxy access is for lawful, approved use cases and should stay easy to manage without exposing unnecessary technical details.',
  },
  vpn: {
    eyebrow: 'BP Secure Tunnel',
    title: 'Secure your connection with BP Secure Tunnel.',
    description:
      'BP Secure Tunnel gives users encrypted connectivity, device setup guidance, server location choice, and dedicated IP options where available.',
    status: 'Secure tunnel access',
    primaryAction: { label: 'See Security', href: '/security' },
    secondaryAction: { label: 'Open Support', href: '/dashboard/support' },
    stats: [
      { label: 'Protocol', value: 'WireGuard' },
      { label: 'IP', value: 'Dedicated' },
      { label: 'Devices', value: 'Managed' },
    ],
    cards: [
      { icon: 'lock', title: 'Protected Session', text: 'Toggle protection while using communication, billing, and account workflows.', meta: 'Security' },
      { icon: 'globe', title: 'Server Selection', text: 'Choose from available secure tunnel regions and plan options.', meta: 'Routing' },
      { icon: 'shield', title: 'No-Logs Posture', text: 'Keep telemetry limited to abuse prevention, reliability, and billing safety.', meta: 'Trust' },
    ],
    workflow: ['Choose a plan', 'Select server location', 'Set up your device', 'Review connection status and renewal timing'],
    note: 'Secure Tunnel is designed for privacy, account protection, and safer connectivity under Burner Point usage policies.',
  },
  support: {
    eyebrow: 'Support',
    title: 'Support for account access, billing, and telecom delivery.',
    description:
      'Support must understand privacy workflows: verification delivery, rental continuity, number status, payment updates, eSIM activation, proxies, and account security.',
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
      { icon: 'check', title: 'Resolution Notes', text: 'Give users clear outcomes for refunds, retries, renewals, and delivery issues.', meta: 'Clarity' },
    ],
    workflow: ['Collect issue category and reference', 'Attach the account context that matters', 'Escalate billing or delivery issues', 'Close with clear resolution history'],
    note: 'Support should focus on clear issue categories, fast next steps, and calm resolution updates.',
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
    note: 'Each ticket should show what happened, what is needed next, and how long the resolution is likely to take.',
  },
  billing: {
    eyebrow: 'Credits and Billing',
    title: 'Credits, purchases, subscriptions, and payment history.',
    description:
      'Billing keeps verification credits, rental purchases, monthly plans, checkout status, transaction history, refunds, and account visibility in one controlled surface.',
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
      { icon: 'bell', title: 'Protected Updates', text: 'Balance changes appear only after checkout is confirmed and reflected in your account history.', meta: 'Events' },
      { icon: 'file', title: 'Transaction History', text: 'Expose references, gateway status, product assignment, and receipt support.', meta: 'Ledger' },
    ],
    workflow: ['Choose a package or product', 'Start checkout', 'Confirm payment', 'Update billing history and assign access'],
    note: 'Purchases should appear clearly with status, references, and the next action if something needs attention.',
  },
  developer: {
    eyebrow: 'Account Controls',
    title: 'Approved access requests and account support.',
    description:
      'Advanced account needs should be handled through support-reviewed workflows so users see clear product actions instead of internal system tools.',
    status: 'Support-reviewed access',
    primaryAction: { label: 'Open Support', href: '/dashboard/support' },
    secondaryAction: { label: 'View Settings', href: '/dashboard/settings' },
    stats: [
      { label: 'Review', value: 'Support' },
      { label: 'Privacy', value: 'Scoped' },
      { label: 'Control', value: 'Account' },
    ],
    cards: [
      { icon: 'shield', title: 'Privacy Review', text: 'Use support for account access requests that require additional review.', meta: 'Trust' },
      { icon: 'bell', title: 'Clear Updates', text: 'Track responses, next steps, and account actions without technical setup noise.', meta: 'Updates' },
      { icon: 'lock', title: 'Safe Defaults', text: 'Keep sensitive account actions controlled, reversible, and easy to understand.', meta: 'Safety' },
    ],
    workflow: ['Open a support request', 'Attach the relevant product reference', 'Wait for account review', 'Follow the approved next step'],
    note: 'Customer-facing screens should focus on clear product actions, billing status, support paths, and account security.',
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
      <section className="overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.9),rgba(0,0,0,0.96))] shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
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

          <div className="rounded-[1.5rem] border border-brand-green/18 bg-brand-green/[0.055] p-5">
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
                <div key={`${stat.label}-${stat.value}`} className="rounded-[1rem] border border-white/8 bg-black/20 p-3">
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
            <article key={card.title} className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.9))] p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                  <Icon className="h-5 w-5 text-brand-green" />
                </span>
                {card.meta ? (
                  <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/48">
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
        <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.9))] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Workflow</p>
          <div className="mt-4 space-y-3">
            {module.workflow.map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[0.9rem] border border-brand-green/20 bg-brand-green/10 font-mono text-xs text-brand-green">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-white/66">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-brand-green/16 bg-brand-green/[0.045] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Need to know</p>
          <p className="mt-4 text-sm leading-7 text-white/66">{module.note}</p>
        </div>
      </section>
    </div>
  );
}
