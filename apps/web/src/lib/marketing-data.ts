export type IconKey =
  | 'bell'
  | 'book'
  | 'briefcase'
  | 'calendar'
  | 'code'
  | 'credit'
  | 'file'
  | 'globe'
  | 'help'
  | 'key'
  | 'lock'
  | 'mail'
  | 'message'
  | 'phone'
  | 'shield'
  | 'smartphone'
  | 'wifi';

export type MarketingLink = { label: string; href: string };
export type MarketingCard = { title: string; text: string; meta?: string; href?: string; cta?: string; icon?: IconKey; anchorId?: string };
export type MarketingSection = { title: string; text: string; items?: string[] };
export type MarketingPageContent = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: MarketingLink;
  secondaryCta?: MarketingLink;
  highlights?: string[];
  cards?: MarketingCard[];
  sections?: MarketingSection[];
  faqs?: Array<{ question: string; answer: string }>;
};

export const primaryNav: MarketingLink[] = [
  { label: 'Overview', href: '/overview' },
  { label: 'Verifications', href: '/verifications' },
  { label: 'Rentals', href: '/rentals' },
  { label: 'API', href: '/api' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const footerGroups = [
  { title: 'Product', href: '/overview', links: primaryNav.slice(0, 5) },
  {
    title: 'Company',
    href: '/about',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Updates', href: '/updates' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Support',
    href: '/support',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Help Center', href: '/help' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    href: '/terms',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

export const socialLinks = [
  { label: 'LinkedIn', short: 'in', href: 'https://www.linkedin.com/company/burnerpointapp' },
  { label: 'Instagram', short: 'ig', href: 'https://www.instagram.com/burnerpoint.app' },
  { label: 'TikTok', short: 'tt', href: 'https://www.tiktok.com/@burnerpointapp' },
  { label: 'Twitter/X', short: 'x', href: 'https://x.com/burnerpointapp' },
  { label: 'Telegram', short: 'tg', href: 'https://t.me/burnerpointapp' },
  { label: 'YouTube', short: 'yt', href: 'https://www.youtube.com/@burnerpointapp' },
  { label: 'Facebook', short: 'fb', href: 'https://www.facebook.com/burnerpoint.app' },
];

export const trustBadges: MarketingLink[] = [
  { label: '256-bit AES', href: '/security' },
  { label: 'No Logs Policy', href: '/privacy' },
  { label: 'GDPR Compliant', href: '/privacy' },
  { label: 'Real SIM Numbers', href: '/verifications' },
];

const faqItems = [
  ['What is a burner number?', 'A burner number is a temporary or renewable phone number you use instead of exposing your personal number online.'],
  ['Are Burner Point numbers real SIM numbers?', 'Yes. Burner Point is positioned around real SIM-backed numbers for stronger SMS, OTP, and voice verification compatibility.'],
  ['How does the US/Canada conversation inbox work?', 'Conversation numbers are designed for US and Canada SMS, MMS/photos, calls, voicemail, and WiFi or mobile-data communication from the Burner Point web and mobile apps.'],
  ['How do verifications work?', 'Choose a service and country, receive a number, submit it to the third-party platform, then wait for the SMS OTP or voice OTP to appear in Burner Point.'],
  ['What is the difference between renewable and non-renewable rentals?', 'Non-renewable rentals are short-duration numbers for temporary access. Renewable rentals are monthly numbers you can keep active for continuity and account recovery.'],
  ['Can I keep a number after verification?', 'Yes. Use one-time verification, short-term rentals, or renewable monthly plans when you need continuity.'],
  ['Do you support eSIM, proxies, and VPN privacy?', 'Yes. Burner Point includes eSIM purchase, proxy access, and integrated VPN-style privacy protection.'],
  ['How does eSIM work?', 'Buy a destination-ready data plan, activate the eSIM on a compatible device, and manage travel connectivity without swapping physical SIM cards.'],
  ['How do proxies work?', 'Proxy access gives you controlled routing through supported regions for privacy-enhanced browsing, testing, and location-aware workflows.'],
  ['Is the VPN a separate product?', 'No. VPN privacy and protection is an in-platform Burner Point feature designed to reduce exposure while using the platform.'],
  ['What payment methods are planned?', 'The architecture supports Paystack, Paddle, NOWPayments, and later Flutterwave, Squad by GTCO, Korapay, and OPay once the core revenue flow is stable.'],
  ['Do you offer refunds?', 'Refund rules depend on number status, provider delivery, and whether a verification or rental has already been consumed. The billing dashboard and support flow should show case-specific guidance.'],
  ['Is my data private?', 'Burner Point is designed around data minimization, a no-logs posture for sensitive communication content, and operational logging limited to security, billing, fraud prevention, and reliability.'],
  ['How do I reach support?', 'Email info.burnerpoint@gmail.com or message Telegram support at @burnerpoint and @burnerpointapp.'],
].map(([question, answer]) => ({ question, answer }));

export const marketingPages: Record<string, MarketingPageContent> = {
  overview: {
    slug: 'overview',
    eyebrow: 'Product Overview',
    title: 'Private telecom infrastructure for modern identity control.',
    description: 'Burner Point brings verifications, rentals, eSIM connectivity, proxies, and privacy protection into one platform for users who do not want to hand out their real number.',
    primaryCta: { label: 'Get Started', href: '/auth/signup' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
    highlights: ['Real SIM-backed numbers', 'SMS, OTP, voice, and MMS workflows', 'Privacy-first platform expansion'],
    cards: [
      { icon: 'smartphone', title: 'Real Numbers', text: 'Choose country and area-code inventory for verifications, rentals, recovery, and private communication.', href: '/verifications', cta: 'Get Verification' },
      { icon: 'globe', title: 'Global Services', text: 'Use Burner Point across marketplaces, social apps, travel flows, business registrations, and developer workflows.', href: '/rentals', cta: 'Rent A Number' },
      { icon: 'shield', title: 'Private By Design', text: 'Keep your personal identity separated from the services, platforms, and accounts you need to access.', href: '/security', cta: 'Learn More' },
    ],
    sections: [
      { title: 'How it works', text: 'Choose your number, use it for verification or communication, receive SMS or voice instantly, then expire it or keep it active.', items: ['Country and area-code selection', 'Instant SMS and OTP visibility', 'Renewable access when continuity matters'] },
      { title: 'Who it serves', text: 'Built for privacy-minded users, travelers, operators, builders, and teams who need secure telecom access without personal exposure.', items: ['Online registrations', 'Business communication', 'Dating and marketplace privacy', 'API automation'] },
    ],
  },
  verifications: {
    slug: 'verifications',
    eyebrow: 'Phone Numbers and Verifications',
    title: 'Get verification codes without exposing your real number.',
    description: 'Use non-VoIP, SIM-backed numbers to receive SMS, OTP, and voice verification from major platforms with fast delivery and clean account separation.',
    primaryCta: { label: 'Get Verification', href: '/auth/signup' },
    secondaryCta: { label: 'Rent A Number', href: '/rentals' },
    highlights: ['SMS and OTP verification', 'Voice call verification', '900+ supported platforms'],
    cards: [
      { icon: 'mail', title: 'SMS and OTP', text: 'Receive verification codes in real time with a focused inbox built for fast confirmation.' },
      { icon: 'phone', title: 'Voice Verification', text: 'Handle automated voice calls where platforms require spoken code delivery.' },
      { icon: 'shield', title: 'Account Separation', text: 'Keep your personal phone number away from high-risk or short-term registration flows.' },
    ],
    faqs: faqItems,
  },
  rentals: {
    slug: 'rentals',
    eyebrow: 'Number Rentals',
    title: 'Temporary when you need speed. Renewable when you need continuity.',
    description: 'Rent a number for one to fourteen days, or keep a monthly number active for repeat verifications, messages, and account recovery.',
    primaryCta: { label: 'Rent A Number', href: '/auth/signup' },
    secondaryCta: { label: 'Start Monthly Plan', href: '/pricing' },
    highlights: ['1-14 day rentals', 'Renewable monthly numbers', 'Unlimited verification usage on rentals'],
    cards: [
      { icon: 'calendar', title: 'Short-Term Rentals', text: 'Great for temporary projects, controlled account setup, and short verification windows.', href: '/pricing', cta: 'View Pricing' },
      { icon: 'credit', title: 'Monthly Plans', text: 'Keep your number active for ongoing account recovery, business identity, or repeat verification needs.', href: '/pricing', cta: 'Start Monthly Plan' },
      { icon: 'message', title: 'Messaging Continuity', text: 'Maintain access to SMS threads and verification history while a rental is active.' },
    ],
  },
  api: {
    slug: 'api',
    eyebrow: 'Developer API',
    title: 'Automate private telecom workflows with Burner Point.',
    description: 'Provision numbers, monitor verification delivery, receive webhooks, and build privacy-first onboarding flows using developer-friendly API primitives.',
    primaryCta: { label: 'View API Docs', href: '/api/docs' },
    secondaryCta: { label: 'Get Started', href: '/auth/signup' },
    highlights: ['REST endpoints', 'Webhook callbacks', 'Verification lifecycle automation'],
    cards: [
      { icon: 'code', title: 'Provisioning API', text: 'Request numbers by country, service, region, and intended usage.' },
      { icon: 'bell', title: 'Webhook Events', text: 'Receive delivery updates when messages, calls, or verification state changes.' },
      { icon: 'key', title: 'API Keys', text: 'Manage scoped developer keys from the dashboard for production integrations.' },
    ],
  },
  'api-docs': {
    slug: 'api-docs',
    eyebrow: 'API Documentation',
    title: 'Build verification flows that feel instant and reliable.',
    description: 'Use these implementation notes as a developer-facing entry point for Burner Point provisioning, inbox, webhook, and billing workflows.',
    primaryCta: { label: 'Create API Key', href: '/auth/signup' },
    secondaryCta: { label: 'Contact Support', href: '/contact' },
    highlights: ['Base URL: /api', 'Bearer token authentication', 'JSON request and response payloads'],
    sections: [
      { title: 'Core endpoints', text: 'The production API is organized around authentication, number search, provisioning, messages, payments, and webhook ingestion.', items: ['POST /auth/register', 'POST /auth/login', 'GET /numbers/search', 'POST /numbers/provision', 'GET /messages', 'POST /payments/initialize'] },
      { title: 'Webhook model', text: 'Webhook consumers should verify event signatures, process idempotently, and store the latest message and verification state.', items: ['message.received', 'number.expiring', 'payment.succeeded', 'verification.completed'] },
    ],
  },
  pricing: {
    slug: 'pricing',
    eyebrow: 'Pricing',
    title: 'Great products. Simple pricing.',
    description: 'Start with a one-time verification, rent a number for short-term access, or choose a monthly plan when continuity matters.',
    primaryCta: { label: 'Get Your Number', href: '/auth/signup' },
    secondaryCta: { label: 'Contact Support', href: '/support' },
    highlights: ['$0.99+ per verification', '$5.99+ per rental', '$15.99+ monthly plans'],
    cards: [
      { icon: 'shield', title: 'Verifications', meta: '$0.99+ / verification', text: 'Best for one-time OTP, SMS, or voice confirmation.', href: '/verifications', cta: 'Get Verification' },
      { icon: 'calendar', title: 'Non-Renewable Rentals', meta: '$5.99+ / rental', text: 'Best for short-term access between one and fourteen days.', href: '/rentals', cta: 'Rent A Number' },
      { icon: 'credit', title: 'Monthly Plans', meta: '$15.99+ / month', text: 'Best for recurring communication, account recovery, and long-running projects.', href: '/auth/signup', cta: 'Start Monthly Plan' },
    ],
  },
  blog: {
    slug: 'blog',
    eyebrow: 'Blog',
    title: 'Practical privacy writing for real-world telecom decisions.',
    description: 'Guides for safer registrations, better communication separation, and stronger privacy habits.',
    cards: [
      { icon: 'file', meta: 'Privacy - 6 min read', title: 'Why You Should Never Use Your Personal Number Online', text: 'Reduce spam, data brokerage, SIM swap exposure, and unwanted account linkage.', href: '/blog#post-personal-number', anchorId: 'post-personal-number' },
      { icon: 'file', meta: 'Security - 5 min read', title: 'How Burner Numbers Protect Your Identity', text: 'Compartmentalize marketplaces, social apps, and short-term signups.', href: '/blog#post-burner-identity', anchorId: 'post-burner-identity' },
      { icon: 'file', meta: 'Telecom - 7 min read', title: 'Understanding Non-VoIP Numbers', text: 'Why SIM-backed inventory matters for OTP reliability.', href: '/blog#post-nonvoip', anchorId: 'post-nonvoip' },
      { icon: 'file', meta: 'Anonymous and Connected - 4 min read', title: 'Privacy in the Digital Age: Anonymous and Connected', text: 'Keep access, recovery, and messages portable while reducing identity exposure.', href: '/blog#post-anonymous-connected', anchorId: 'post-anonymous-connected' },
      { icon: 'file', meta: 'Product Updates - 5 min read', title: 'How Burner Point Handles Secure Communication', text: 'A practical look at private inboxes, provider routing, no-logs posture, and account control.', href: '/blog#post-secure-communication', anchorId: 'post-secure-communication' },
    ],
  },
  updates: {
    slug: 'updates',
    eyebrow: 'Product Updates',
    title: 'Recent shipping notes from the Burner Point platform.',
    description: 'A lightweight changelog for number coverage, developer tooling, eSIM regions, and privacy infrastructure improvements.',
    cards: [
      { icon: 'globe', meta: 'April 2026', title: 'New Country Number Coverage Added', text: 'Expanded SIM-backed availability for additional verification routes and regional area-code selection.' },
      { icon: 'code', meta: 'March 2026', title: 'API Webhook Reliability Improvements', text: 'Improved event naming, retry behavior, and developer dashboard visibility.' },
      { icon: 'smartphone', meta: 'February 2026', title: 'New eSIM Regions Released', text: 'Travel-ready data plans added for more destinations with a faster activation flow.' },
      { icon: 'wifi', meta: 'January 2026', title: 'Proxy Region and Durability Upgrades', text: 'Improved proxy region selection, active-session health checks, and durability messaging for privacy workflows.' },
      { icon: 'phone', meta: 'December 2025', title: 'US/Canada WiFi and Data Calling Improvements', text: 'Refined the conversation roadmap for SMS, MMS, calls, voicemail, and photo sharing over WiFi or cellular data.' },
    ],
  },
  careers: {
    slug: 'careers',
    eyebrow: 'Careers',
    title: 'Build the future of private communication.',
    description: 'Join a remote-friendly team building secure, privacy-first digital infrastructure for global users.',
    primaryCta: { label: 'Contact Careers', href: 'mailto:info.burnerpoint@gmail.com?subject=Burner%20Point%20Careers' },
    highlights: ['Remote-friendly roles', 'Privacy-first mission', 'Product, engineering, and support opportunities'],
    cards: [
      { icon: 'briefcase', meta: 'Remote', title: 'Frontend Product Engineer', text: 'Own polished web and mobile experiences for onboarding, number management, and privacy workflows.' },
      { icon: 'briefcase', meta: 'Remote', title: 'Telecom Operations Specialist', text: 'Manage number inventory, provider quality, delivery reliability, and escalations.' },
      { icon: 'briefcase', meta: 'Remote', title: 'Privacy Support Advocate', text: 'Help users understand verifications, rentals, eSIM activation, proxies, and security.' },
    ],
  },
};

marketingPages.numbers = {
  slug: 'numbers',
  eyebrow: 'Numbers',
  title: 'Choose the number strategy that matches your privacy need.',
  description: 'Search, filter, and activate phone numbers for one-time verification, short-term rentals, renewable rentals, and US/Canada conversation workflows.',
  primaryCta: { label: 'Get Your Number', href: '/auth/signup' },
  secondaryCta: { label: 'View Pricing', href: '/pricing' },
  highlights: ['Search by country and region', 'One-time or renewable access', 'US/Canada conversation support'],
  cards: [
    { icon: 'globe', title: 'Global Verification Numbers', text: 'Use country-specific inventory for SMS OTP and voice OTP across supported services.', href: '/verifications', cta: 'Start Verification' },
    { icon: 'calendar', title: 'Rental Numbers', text: 'Keep a number active for a fixed short window or renew monthly for long-term continuity.', href: '/rentals', cta: 'Rent A Number' },
    { icon: 'message', title: 'Conversation Numbers', text: 'US/Canada numbers support SMS, MMS/photos, calls, voicemail, contacts, and call history.', href: '/overview', cta: 'See Overview' },
  ],
  sections: [
    { title: 'Search and filters', text: 'The authenticated number experience should support country, area code, service type, renewal mode, provider health, and price filters.' },
    { title: 'Lifecycle controls', text: 'Every number needs clear status, expiration, renewal, release, usage history, and support escalation states so users always know what will happen next.' },
  ],
};

marketingPages.support = {
  slug: 'support',
  eyebrow: 'Support',
  title: 'Fast help from people who understand privacy workflows.',
  description: 'Reach Burner Point support by email, Telegram, or the help center for account access, verification delivery, rental continuity, and billing questions.',
  primaryCta: { label: 'Email Support', href: 'mailto:info.burnerpoint@gmail.com' },
  secondaryCta: { label: 'Telegram Support', href: 'https://t.me/burnerpoint' },
  highlights: ['Email: info.burnerpoint@gmail.com', 'Telegram: @burnerpoint', 'Telegram app channel: @burnerpointapp'],
  cards: [
    { icon: 'mail', title: 'Email Support', text: 'Send billing, account, privacy, and technical questions to info.burnerpoint@gmail.com.', href: 'mailto:info.burnerpoint@gmail.com', cta: 'Send Email' },
    { icon: 'message', title: 'Telegram Channel', text: 'Message @burnerpoint for direct support or follow @burnerpointapp for app notices.', href: 'https://t.me/burnerpoint', cta: 'Open Telegram' },
    { icon: 'help', title: 'Help Center', text: 'Use guides for setup, authentication, numbers, rentals, and payments.', href: '/help', cta: 'Read Guides' },
  ],
};
marketingPages.faq = { slug: 'faq', eyebrow: 'FAQ', title: 'Answers before you need a support ticket.', description: 'Common questions about verifications, phone rentals, eSIM, proxies, VPN protection, account setup, and support.', primaryCta: { label: 'Open Help Center', href: '/help' }, secondaryCta: { label: 'Contact Support', href: '/contact' }, faqs: faqItems };
marketingPages.help = { slug: 'help', eyebrow: 'Help Center', title: 'Guides for account setup, authentication, and service usage.', description: 'Setup steps and troubleshooting for verifications, rentals, payments, eSIM, proxies, and VPN protection.', primaryCta: { label: 'Contact Support', href: '/contact' }, secondaryCta: { label: 'Telegram Support', href: 'https://t.me/burnerpoint' }, cards: [
  { icon: 'book', meta: 'Getting Started', title: 'How to create your Burner Point account', text: 'Use first name, last name, email, phone number, and a strong password. SSO can start with Google, Apple iCloud, or Microsoft Outlook when configured.' },
  { icon: 'book', meta: 'Verifications', title: 'How OTP verification works', text: 'Choose a number, submit it to the platform, then watch the Burner Point inbox for SMS or voice verification delivery.' },
  { icon: 'book', meta: 'Rentals', title: 'Number expiration guide', text: 'Short-term rentals expire after their duration. Monthly rentals can renew for continued account recovery and messaging access.' },
  { icon: 'book', meta: 'Payments', title: 'Payment troubleshooting', text: 'Confirm checkout status, wallet balance, and payment reference before opening a support request.' },
  { icon: 'book', meta: 'Security', title: 'Account security and 2FA', text: 'Use Clerk-backed email, phone, OAuth, password reset, and optional 2FA controls to keep your Burner Point account protected.' },
  { icon: 'book', meta: 'API / Developer Tools', title: 'Developer keys and webhooks', text: 'Create scoped API keys, configure webhook endpoints, verify signatures, and process events idempotently.' },
  { icon: 'book', meta: 'Account & Authentication', title: 'Profile, sign out, and account recovery', text: 'Manage personal details, sessions, notification preferences, support tickets, and recovery paths from settings.' },
] };
marketingPages.contact = { slug: 'contact', eyebrow: 'Contact', title: 'Talk to Burner Point.', description: 'Use the contact form, email support, or Telegram for verification, rental, eSIM, proxy, VPN, API, billing, and partnership questions.', primaryCta: { label: 'Email Support', href: 'mailto:info.burnerpoint@gmail.com' }, secondaryCta: { label: 'Telegram Support', href: 'https://t.me/burnerpoint' }, highlights: ['info.burnerpoint@gmail.com', 'https://t.me/burnerpoint', 'https://t.me/burnerpointapp'] };
marketingPages.about = { slug: 'about', eyebrow: 'About Burner Point', title: 'We believe privacy should be practical, not performative.', description: 'Burner Point helps people stay reachable without surrendering their personal number everywhere.', highlights: ['Privacy-first infrastructure', 'User-controlled communication', 'Global access without personal exposure'], sections: [
  { title: 'Our values', text: 'We build for anonymity, reliability, transparency, and user control. The best privacy tools should feel easy enough to use every day.', items: ['Minimize exposure', 'Design for trust', 'Keep users in control'] },
  { title: 'Our platform', text: 'Burner Point combines SIM-backed numbers, verifications, rentals, eSIM purchase, proxies, and integrated VPN protection under one cohesive identity layer.' },
] };
marketingPages.terms = { slug: 'terms', eyebrow: 'Legal', title: 'Terms of Service.', description: 'These product-facing terms summarize expected usage for Burner Point services and should be reviewed with counsel before production launch.', sections: [
  { title: 'Acceptable use', text: 'Burner Point is intended for lawful privacy, verification, communication, travel, and developer workflows. Abuse, fraud, harassment, spam, and platform misuse are prohibited.' },
  { title: 'Service availability', text: 'Telecommunications delivery depends on carriers, country coverage, provider inventory, and platform-specific acceptance rules.' },
  { title: 'User responsibility', text: 'Users are responsible for credentials, third-party platform compliance, and lawful use of numbers, proxies, eSIM plans, and privacy tools.' },
] };
marketingPages.privacy = { slug: 'privacy', eyebrow: 'Legal', title: 'Privacy Policy.', description: 'Burner Point is designed around minimizing exposure and giving users more control over communication identity.', sections: [
  { title: 'Data minimization', text: 'We collect the account and transaction data needed to operate the platform, protect users, support billing, and troubleshoot service delivery.' },
  { title: 'No logs posture', text: 'Burner Point is presented with a no-logs policy for privacy workflows, with operational telemetry limited to security, abuse prevention, billing, and reliability.' },
  { title: 'User rights', text: 'The product experience should support access, correction, deletion, and export workflows where required by GDPR and other applicable privacy laws.' },
] };
marketingPages.esim = { slug: 'esim', eyebrow: 'eSIM Purchase', title: 'Travel-ready data without swapping physical SIM cards.', description: 'Buy and activate eSIM plans for global connectivity while keeping your number strategy and privacy workflow inside Burner Point.', primaryCta: { label: 'Get Your eSIM', href: '/auth/signup' }, highlights: ['Instant eSIM activation', 'Travel-ready data plans', 'Multi-country coverage'], cards: [
  { icon: 'smartphone', title: 'Instant Activation', text: 'Activate data plans quickly without waiting for a physical card.' },
  { icon: 'globe', title: 'Global Coverage', text: 'Choose destination-ready connectivity for travel, remote work, and backup access.' },
  { icon: 'wifi', title: 'No Roaming Stress', text: 'Keep data predictable when moving between countries and networks.' },
] };
marketingPages.proxies = { slug: 'proxies', eyebrow: 'Proxies Purchase', title: 'Location-aware access with privacy-enhanced routing.', description: 'Use proxy access for privacy-preserving browsing, testing, localization, and controlled location switching.', primaryCta: { label: 'Get Proxies', href: '/auth/signup' }, highlights: ['Residential and mobile proxies', 'Location switching', 'High-speed routing'], cards: [
  { icon: 'globe', title: 'Location Control', text: 'Route workflows through regions that match your access or testing needs.' },
  { icon: 'shield', title: 'Privacy Layer', text: 'Add separation between your personal connection and the tasks you need to complete.' },
  { icon: 'wifi', title: 'Fast Routing', text: 'Designed for practical browsing, testing, and app workflows.' },
] };
marketingPages.security = { slug: 'security', eyebrow: 'VPN Privacy and Protection', title: 'Stay Anonymous. Stay Connected. Private By Design.', description: 'Burner Point brings encrypted browsing concepts, secure routing, and no-personal-number communication into one privacy-first platform experience.', primaryCta: { label: 'Learn More', href: '/overview' }, highlights: ['256-bit AES posture', 'No Logs Policy', 'Integrated privacy protection'], cards: [
  { icon: 'lock', title: 'Encrypted Layer', text: 'A security-first product posture for private browsing and communication workflows.' },
  { icon: 'shield', title: 'No Logs Policy', text: 'A privacy promise that keeps the product focused on user control and minimal exposure.' },
  { icon: 'globe', title: 'Integrated Routing', text: 'Proxy and VPN-style protection paired with private numbers and eSIM connectivity.' },
] };

export function getMarketingPage(slug: string) {
  return marketingPages[slug];
}
