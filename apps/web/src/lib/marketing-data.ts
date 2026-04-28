import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
  TELEGRAM_COMMUNITY_HANDLE,
  TELEGRAM_COMMUNITY_URL,
  TELEGRAM_SUPPORT_HANDLE,
  TELEGRAM_SUPPORT_URL,
  buildSupportMailto,
} from './support';

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
export type MarketingSection = { title: string; text: string; items?: string[]; meta?: string; anchorId?: string };
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
  { label: 'Products', href: '/#products' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Support', href: '/support' },
];

export const footerGroups = [
  {
    title: 'Platform',
    href: '/',
    links: [
      { label: 'Products', href: '/#products' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Blog', href: '/blog' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    title: 'Support',
    href: '/support',
    links: [
      { label: 'Support', href: '/support' },
      { label: 'Contact', href: '/contact' },
      { label: 'Help Center', href: '/help-center' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Company',
    href: '/about',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Support', href: '/support' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Legal',
    href: '/terms-of-service',
    links: [
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Acceptable Use Policy', href: '/acceptable-use-policy' },
    ],
  },
];

export const socialLinks = [
  { label: 'Instagram', short: 'ig', handle: '@burnerpoint.app', href: 'https://www.instagram.com/burnerpoint.app' },
  { label: 'Facebook', short: 'fb', handle: '@burnerpoint.app', href: 'https://www.facebook.com/burnerpoint.app' },
  { label: 'LinkedIn', short: 'in', handle: '@burnerpointapp', href: 'https://www.linkedin.com/company/burnerpointapp' },
  { label: 'TikTok', short: 'tt', handle: '@burnerpointapp', href: 'https://www.tiktok.com/@burnerpointapp' },
  { label: 'Twitter/X', short: 'x', handle: '@burnerpointapp', href: 'https://x.com/burnerpointapp' },
  { label: 'Telegram', short: 'tg', handle: TELEGRAM_COMMUNITY_HANDLE, href: TELEGRAM_COMMUNITY_URL },
  { label: 'YouTube', short: 'yt', handle: '@burnerpointapp', href: 'https://www.youtube.com/@burnerpointapp' },
];

export const trustBadges: MarketingLink[] = [
  { label: 'Private Number Access', href: '/products/messenger' },
  { label: 'SMS & Voice OTP', href: '/products/verify-hub' },
  { label: 'Secure Account Controls', href: '/products/secure-tunnel' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

const faqItems = [
  ['What is a burner number?', 'A burner number is a temporary or renewable phone number you use instead of exposing your personal number online. Burner Point numbers are designed for account verification, controlled communication, rentals, recovery, and everyday privacy separation.'],
  ['Are Burner Point numbers private numbers?', 'Burner Point is positioned around private number access for SMS, OTP, voice verification, rentals, recovery, and communication. Availability still depends on country, service rules, telecom routing, and inventory.'],
  ['How does the US/Canada conversation inbox work?', 'Conversation numbers are designed for US and Canada messaging and calling. A supported number can receive or send text, SMS, secure audio, photo and video sharing, calls, and voicemail over WiFi & Data from Burner Point web and mobile apps.'],
  ['How do verifications work?', 'Choose a country, service, and available number, submit that number to the third-party platform, and watch Burner Point for SMS OTP or voice OTP delivery. Codes remain tied to the number and verification workflow.'],
  ['How do rentals work?', 'Rentals give you a number for a defined window. Use short-term rentals for temporary access, or monthly rentals when you need continuity for repeat verifications, recovery messages, or communication history.'],
  ['What is the difference between renewable and non-renewable numbers?', 'Non-renewable numbers are short-duration rentals built for temporary access. Renewable numbers can stay active month to month for account recovery, repeat messaging, and longer-running private communication.'],
  ['Can I keep a number after verification?', 'Yes. You can use a one-time verification, rent a number for a fixed window, or keep a renewable monthly number when the platform account needs ongoing access or recovery.'],
  ['How does eSIM work?', 'Buy a destination-ready data plan, activate the eSIM on a compatible device, and manage travel connectivity without swapping physical SIM cards. Burner Point positions eSIM as connectivity inside the same privacy account.'],
  ['How do proxies work?', 'Proxy access gives you controlled routing through supported regions for privacy-enhanced browsing, localization, testing, and account separation. Access details are managed inside your Burner Point account.'],
  ['Is VPN protection a separate product?', 'No. VPN privacy and protection is an in-platform Burner Point feature. It is designed to reduce exposure while using Burner Point services, not to operate as a standalone VPN brand.'],
  ['What payment methods does Burner Point support?', 'Supported payment options may include cards, Paystack, Paddle subscriptions, NOWPayments crypto deposits, and additional regional gateways as available.'],
  ['How do refunds and billing work?', 'Refund eligibility depends on the product, provider delivery, whether a verification or rental was consumed, payment status, and number lifecycle. Billing surfaces should show references, status, credits, receipts, and support paths.'],
  ['What is required to create an account?', 'Account creation requires first name, last name, email, phone number, and password. By continuing, users agree to the Terms of Service and Privacy Policy. Burner Point supports email, phone, OAuth, password reset, and optional 2FA through a managed authentication layer.'],
  ['How does Burner Point handle privacy and data?', 'Burner Point is designed around data minimization, private access control, account protection, support visibility, and clear privacy policies.'],
  ['How do I reach support?', `Email ${SUPPORT_EMAIL} or message Telegram support at ${TELEGRAM_SUPPORT_HANDLE} and ${TELEGRAM_COMMUNITY_HANDLE} for account, verification, rental, billing, eSIM, proxy, or VPN help.`],
].map(([question, answer]) => ({ question, answer }));

export const marketingPages: Record<string, MarketingPageContent> = {
  overview: {
    slug: 'overview',
    eyebrow: 'Product Overview',
    title: 'Private telecom infrastructure for modern identity control.',
    description: 'Burner Point brings verifications, rentals, eSIM connectivity, proxies, and privacy protection into one platform for users who do not want to hand out their real number.',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
    highlights: ['Private number access', 'SMS, OTP, voice, and MMS workflows', 'Privacy-first platform expansion'],
    cards: [
      { icon: 'smartphone', title: 'Real Numbers', text: 'Choose country and area-code inventory for verifications, rentals, recovery, and private communication.', href: '/products/verify-hub', cta: 'Get Verification' },
      { icon: 'globe', title: 'Global Services', text: 'Use Burner Point across marketplaces, social apps, travel flows, and business registrations without overusing your personal number.', href: '/products/rentals', cta: 'Rent A Number' },
      { icon: 'shield', title: 'Private By Design', text: 'Keep your personal identity separated from the services, platforms, and accounts you need to access.', href: '/products/secure-tunnel', cta: 'Learn More' },
    ],
    sections: [
      { title: 'How it works', text: 'Choose your number, use it for verification or communication, receive SMS or voice instantly, then expire it or keep it active.', items: ['Country and area-code selection', 'Instant SMS and OTP visibility', 'Renewable access when continuity matters'] },
      { title: 'Who it serves', text: 'Built for privacy-minded users, travelers, operators, and teams who need secure telecom access without personal exposure.', items: ['Online registrations', 'Business communication', 'Dating and marketplace privacy', 'Travel and backup connectivity'] },
    ],
  },
  verifications: {
    slug: 'verifications',
    eyebrow: 'Phone Numbers and Verifications',
    title: 'Get verification codes without exposing your real number.',
    description: 'Use non-VoIP, SIM-backed numbers to receive SMS, OTP, and voice verification from major platforms with fast delivery and clean account separation.',
    primaryCta: { label: 'Get Verification', href: '/sign-up' },
    secondaryCta: { label: 'Rent A Number', href: '/products/rentals' },
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
    primaryCta: { label: 'Rent A Number', href: '/sign-up' },
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
    eyebrow: 'Private Access',
    title: 'Sensitive integrations stay behind approved access.',
    description: 'Burner Point does not expose sensitive operational details on public marketing pages. Product setup, support, and approved access are handled through your account and support channels.',
    primaryCta: { label: 'Contact Support', href: '/contact' },
    secondaryCta: { label: 'Get Started', href: '/sign-up' },
    highlights: ['User-facing setup only', 'Private operational access', 'Support-led onboarding when needed'],
    cards: [
      { icon: 'shield', title: 'Protected Access', text: 'Sensitive product operations are not presented on public marketing pages.' },
      { icon: 'message', title: 'Support Guidance', text: 'Use Burner Point support for setup questions, account access, and approved workflow requests.' },
      { icon: 'lock', title: 'Account-Based Control', text: 'Private operational tools stay behind authenticated account access where applicable.' },
    ],
  },
  'api-docs': {
    slug: 'api-docs',
    eyebrow: 'Access Notes',
    title: 'Public pages focus on customer-facing product information.',
    description: 'Burner Point keeps public product education separate from sensitive operational and integration details.',
    primaryCta: { label: 'Open FAQ', href: '/faq' },
    secondaryCta: { label: 'Contact Support', href: '/contact' },
    highlights: ['Product guidance only', 'No operational exposure', 'Support available for approved requests'],
    sections: [
      { title: 'What you can do here', text: 'Use the public site to understand products, pricing, availability, onboarding, trust, and support.' },
      { title: 'What stays private', text: 'Internal routing and restricted operational details stay behind approved support and account workflows.' },
    ],
  },
  pricing: {
    slug: 'pricing',
    eyebrow: 'Pricing',
    title: 'Wallet-based usage plus recurring subscriptions.',
    description: 'Fund a USD-priced wallet for BP Verify Hub, BP Number Rentals, BP eSIM Store, and BP Proxy Store, then use subscriptions for BP Messenger Pro, BP Secure Tunnel, and advanced recurring plans.',
    primaryCta: { label: 'Get Your Number', href: '/sign-up' },
    secondaryCta: { label: 'Contact Support', href: '/support' },
    highlights: ['Wallet top-up for usage-based products', 'Subscriptions for recurring access', 'Paystack, Paddle, and NOWPayments'],
    cards: [
      { icon: 'credit', title: 'Wallet Top-Up', meta: 'Usage-based', text: 'Use wallet funds for BP Verify Hub, BP Number Rentals, BP eSIM Store, and BP Proxy Store.', href: '/sign-up', cta: 'Create Account' },
      { icon: 'calendar', title: 'Renewable Rentals', meta: 'Recurring', text: 'Keep the same number active when continuity, recovery, and monthly access matter.', href: '/products/rentals', cta: 'Rent A Number' },
      { icon: 'shield', title: 'Subscriptions', meta: 'Recurring', text: 'Use subscriptions for BP Messenger Pro, BP Secure Tunnel, and advanced recurring platform access.', href: '/pricing', cta: 'View Pricing' },
    ],
  },
  blog: {
    slug: 'blog',
    eyebrow: 'Blog',
    title: 'Practical privacy writing for real-world telecom decisions.',
    description: 'Guides for safer registrations, better communication separation, and stronger privacy habits.',
    primaryCta: { label: 'Start Privately', href: '/sign-up' },
    secondaryCta: { label: 'Open Help Center', href: '/help-center' },
    cards: [
      { icon: 'file', meta: 'Privacy - 6 min read', title: 'Why You Should Never Use Your Personal Number Online', text: 'Reduce spam, data brokerage, SIM swap exposure, and unwanted account linkage.', href: '/blog#post-personal-number', anchorId: 'post-personal-number' },
      { icon: 'file', meta: 'Communication - 5 min read', title: 'How Burner Numbers Protect Your Identity', text: 'Compartmentalize marketplaces, social apps, business communication, and short-term signups.', href: '/blog#post-burner-identity', anchorId: 'post-burner-identity' },
      { icon: 'file', meta: 'Security - 7 min read', title: 'Understanding Non-VoIP Numbers', text: 'Why SIM-backed inventory matters for OTP reliability, recovery, and trust.', href: '/blog#post-nonvoip', anchorId: 'post-nonvoip' },
      { icon: 'file', meta: 'Anonymous and Connected - 4 min read', title: 'Privacy in the Digital Age: Anonymous and Connected', text: 'Keep access, recovery, and messages portable while reducing identity exposure.', href: '/blog#post-anonymous-connected', anchorId: 'post-anonymous-connected' },
      { icon: 'file', meta: 'Product Updates - 5 min read', title: 'How Burner Point Handles Secure Communication', text: 'A practical look at private inboxes, supported routing, privacy policies, and account control.', href: '/blog#post-secure-communication', anchorId: 'post-secure-communication' },
    ],
    sections: [
      {
        anchorId: 'post-personal-number',
        meta: 'Privacy - 6 min read',
        title: 'Why You Should Never Use Your Personal Number Online',
        text: 'Your personal phone number is one of the most persistent identifiers you own. Once it appears in sign-up forms, marketplaces, dating apps, social platforms, and recovery flows, it can connect your accounts, location patterns, contact graph, and real-world identity. Burner Point exists so users can keep that personal line private while still receiving the messages, codes, and calls they need.',
        items: ['Reduce spam, data broker enrichment, and unwanted account linkage', 'Keep short-term registrations separate from your long-term identity', 'Use temporary or renewable numbers when a platform needs phone access but not your personal number'],
      },
      {
        anchorId: 'post-burner-identity',
        meta: 'Communication - 5 min read',
        title: 'How Burner Numbers Protect Your Identity',
        text: 'A burner number creates a controlled communication boundary. Instead of giving every service the same personal line, you can assign a separate number to a marketplace listing, business workflow, travel need, online registration, or social account. That boundary gives you a cleaner way to pause, renew, expire, or support a communication channel without exposing your primary number.',
        items: ['Separate business, personal, dating, travel, and platform activity', 'Keep SMS, calls, voicemail, and secure audio, photo and video sharing attached to the right number', 'Let a temporary identity expire when the risk or need is gone'],
      },
      {
        anchorId: 'post-nonvoip',
        meta: 'Security - 7 min read',
        title: 'Understanding Non-VoIP Numbers',
        text: 'Private numbers are positioned around supported telecom routes rather than generic internet-only calling identities. Many services apply stricter checks to phone numbers during OTP, recovery, and anti-abuse flows. That is why Burner Point emphasizes country selection, service availability, and verification reliability instead of treating every phone number as interchangeable.',
        items: ['Real mobile number access can improve acceptance for SMS and voice verification', 'Country, carrier, service, and route quality still matter for delivery', 'Users should see clear availability, delivery, and support guidance in the interface'],
      },
      {
        anchorId: 'post-anonymous-connected',
        meta: 'Anonymous and Connected - 4 min read',
        title: 'Privacy in the Digital Age: Anonymous and Connected',
        text: 'Privacy should not require disappearing from the services you need. Burner Point is designed around a simpler idea: stay reachable while reducing exposure. Users can receive codes, keep recovery access, use eSIM connectivity, route with proxies, and protect sessions without turning a personal phone number into the key that ties everything together.',
        items: ['Stay reachable without handing every platform your primary number', 'Use numbers, eSIM, proxies, and built-in protection from one account', 'Keep control over expiration, renewal, billing, and support paths'],
      },
      {
        anchorId: 'post-secure-communication',
        meta: 'Product Updates - 5 min read',
        title: 'How Burner Point Handles Secure Communication',
        text: 'Secure communication requires more than a clean interface. Burner Point is designed to keep product access clear, reduce personal-number exposure, limit unnecessary data visibility, and make communication workflows feel controlled from the first action.',
        items: ['Conversation activity stays tied to number ownership and account sessions', 'Availability, delivery, and billing states should remain clear to users', 'Rate limits and abuse controls protect the platform while keeping user-facing copy straightforward'],
      },
    ],
  },
  updates: {
    slug: 'updates',
    eyebrow: 'Product Updates',
    title: 'Recent shipping notes from the Burner Point platform.',
    description: 'A lightweight changelog for number coverage, wallet improvements, eSIM regions, and privacy workflow updates.',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
    cards: [
      { icon: 'globe', meta: 'April 2026', title: 'New Country Number Coverage Added', text: 'Expanded SIM-backed availability for additional verification routes and regional area-code selection.', href: '/updates#update-country-numbers', anchorId: 'update-country-numbers' },
      { icon: 'credit', meta: 'March 2026', title: 'Wallet and Checkout Flow Improvements', text: 'Improved billing clarity, balance updates, and purchase-state messaging across the dashboard.', href: '/updates#update-wallet-improvements', anchorId: 'update-wallet-improvements' },
      { icon: 'smartphone', meta: 'February 2026', title: 'New eSIM Regions Released', text: 'Travel-ready data plans added for more destinations with a faster activation flow.', href: '/updates#update-esim-regions', anchorId: 'update-esim-regions' },
      { icon: 'wifi', meta: 'January 2026', title: 'New Proxy Region and Durability Upgrades', text: 'Improved proxy region selection, active-session health checks, and durability messaging for privacy workflows.', href: '/updates#update-proxy-durability', anchorId: 'update-proxy-durability' },
      { icon: 'phone', meta: 'December 2025', title: 'US/Canada WiFi & Data Communication Improvements', text: 'Refined the conversation roadmap for SMS, calls, voicemail, and secure audio, photo and video sharing over WiFi & Data.', href: '/updates#update-conversation-usca', anchorId: 'update-conversation-usca' },
    ],
    sections: [
      { anchorId: 'update-country-numbers', meta: 'April 2026', title: 'New Country Number Coverage Added', text: 'Burner Point expanded number coverage planning for additional country routes and area-code selection. The product direction prioritizes verification reliability, inventory quality, and clear user controls before exposing availability broadly.', items: ['More route planning for SMS and voice verification', 'Sharper country and area-code inventory display', 'Support-ready states for unavailable or degraded routes'] },
      { anchorId: 'update-wallet-improvements', meta: 'March 2026', title: 'Wallet and Checkout Flow Improvements', text: 'Burner Point refined product pricing visibility, payment-state messaging, and wallet balance updates so users can understand what happened after each purchase more easily.', items: ['Sharper purchase confirmations and balance updates', 'Clearer payment and pending states', 'More direct support paths when funding or assignment needs review'] },
      { anchorId: 'update-esim-regions', meta: 'February 2026', title: 'New eSIM Regions Released', text: 'Burner Point added more complete eSIM content and product routing around destination-ready data plans. The experience focuses on instant activation, compatible device guidance, multi-country coverage, and plan visibility.', items: ['Travel-ready data plan positioning', 'Activation and usage state framework', 'Support path for eSIM install and connectivity issues'] },
      { anchorId: 'update-proxy-durability', meta: 'January 2026', title: 'New Proxy Region and Durability Improvements', text: 'Proxy purchase and management now has clearer product language for residential and mobile proxy access, region control, session durability, and health messaging. This keeps proxy access practical without overloading users with operational detail.', items: ['Region and proxy type framework', 'Durability, rotation, and health messaging', 'Cleaner account-level access guidance'] },
      { anchorId: 'update-conversation-usca', meta: 'December 2025', title: 'WiFi & Data Communication Improvements for USA/Canada', text: 'The conversation roadmap now clarifies support for US/Canada calls, voicemail, text, SMS, and secure audio, photo and video sharing over WiFi & Data. The goal is a cross-platform communication layer connected to rentals and numbers.', items: ['Calls, voicemail, texting, SMS, and secure audio, photo and video sharing context', 'Cross-platform inbox direction for web and mobile', 'No-roaming-fee communication positioning'] },
    ],
  },
  careers: {
    slug: 'careers',
    eyebrow: 'Careers',
    title: 'Build the future of private communication.',
    description: 'Join a remote-friendly team building secure, privacy-first digital infrastructure for global users.',
    primaryCta: { label: 'Contact Careers', href: buildSupportMailto('Burner Point Careers') },
    secondaryCta: { label: 'Read About Us', href: '/about' },
    highlights: ['Remote-friendly opportunities', 'Privacy-first mission', 'Telecom, security, product, and support craftsmanship'],
    cards: [
      { icon: 'briefcase', meta: 'Remote', title: 'Frontend Product Engineer', text: 'Own polished web and mobile experiences for onboarding, number management, and privacy workflows.' },
      { icon: 'briefcase', meta: 'Remote', title: 'Telecom Operations Specialist', text: 'Manage number inventory, provider quality, delivery reliability, and escalations.' },
      { icon: 'briefcase', meta: 'Remote', title: 'Privacy Support Advocate', text: 'Help users understand verifications, rentals, eSIM activation, proxies, and security.' },
    ],
    sections: [
      { title: 'Mission', text: 'Burner Point exists to give people practical control over communication identity. The work spans product design, telecom operations, security, billing, support, and mobile delivery.', items: ['Make privacy usable for everyday registrations and communication', 'Build trustworthy telecom-grade workflows', 'Keep user experiences clear and reliable'] },
      { title: 'Why work at Burner Point', text: 'This is product craft with real infrastructure behind it. The team designs for trust, user control, reliable delivery, and calm interfaces that do not feel like generic SaaS templates.', items: ['Privacy-first product decisions', 'Direct impact across web, mobile, and telecom operations', 'High bar for polish, reliability, and user safety'] },
      { title: 'Remote opportunities', text: 'Burner Point is structured for remote-friendly collaboration across engineering, product, design, support, telecom operations, and security.', items: ['Async documentation and clear ownership', 'Production-minded execution over performative process', 'Respect for focused work and deep craft'] },
      { title: 'Team focus areas', text: 'Hiring priorities align around the systems needed to ship a privacy-focused telecommunications platform.', items: ['Frontend Product Engineer', 'Growth Product Designer', 'Telecom Operations Specialist', 'Privacy Support Advocate', 'Lifecycle Marketing Manager'] },
      { title: 'Culture', text: 'The culture is privacy-aware, customer-conscious, and craft-heavy. Burner Point values direct communication, careful systems thinking, strong security instincts, and interfaces that help users feel in control.', items: ['Privacy before hype', 'Telecom reliability before vanity metrics', 'Product craftsmanship before templates'] },
    ],
  },
};

marketingPages.numbers = {
  slug: 'numbers',
  eyebrow: 'Numbers',
  title: 'Choose the number strategy that matches your privacy need.',
  description: 'Search, filter, and activate phone numbers for one-time verification, short-term rentals, renewable rentals, and US/Canada conversation workflows.',
  primaryCta: { label: 'Get Your Number', href: '/sign-up' },
  secondaryCta: { label: 'View Pricing', href: '/pricing' },
  highlights: ['Search by country and region', 'One-time or renewable access', 'US/Canada conversation support'],
  cards: [
    { icon: 'globe', title: 'Global Verification Numbers', text: 'Use country-specific inventory for SMS OTP and voice OTP across supported services.', href: '/products/verify-hub', cta: 'Start Verification' },
    { icon: 'calendar', title: 'Rental Numbers', text: 'Keep a number active for a fixed short window or renew monthly for long-term continuity.', href: '/products/rentals', cta: 'Rent A Number' },
    { icon: 'message', title: 'Conversation Numbers', text: 'US, UK, and Canada numbers support messaging, calls, voicemail, contacts, and call history.', href: '/products/messenger', cta: 'See Messenger' },
  ],
  sections: [
    { title: 'Search and filters', text: 'The authenticated number experience should support country, area code, service type, renewal mode, availability, and price filters.' },
    { title: 'Lifecycle controls', text: 'Every number needs clear status, expiration, renewal, release, usage history, and support escalation states so users always know what will happen next.' },
  ],
};

marketingPages.support = {
  slug: 'support',
  eyebrow: 'Support',
  title: 'Fast help from people who understand privacy workflows.',
  description: 'Reach Burner Point support by email, Telegram, or the help center for account access, verification delivery, rental continuity, and billing questions.',
  primaryCta: { label: 'Email Support', href: SUPPORT_EMAIL_HREF },
  secondaryCta: { label: 'Telegram Support', href: TELEGRAM_SUPPORT_URL },
  highlights: [`Email: ${SUPPORT_EMAIL}`, `Telegram: ${TELEGRAM_SUPPORT_HANDLE}`, `Telegram app channel: ${TELEGRAM_COMMUNITY_HANDLE}`],
  cards: [
    { icon: 'mail', title: 'Email Support', text: `Send billing, account, privacy, and technical questions to ${SUPPORT_EMAIL}.`, href: SUPPORT_EMAIL_HREF, cta: 'Send Email' },
    { icon: 'message', title: 'Telegram Channel', text: `Message ${TELEGRAM_SUPPORT_HANDLE} for direct support or follow ${TELEGRAM_COMMUNITY_HANDLE} for app notices.`, href: TELEGRAM_SUPPORT_URL, cta: 'Open Telegram' },
    { icon: 'help', title: 'Help Center', text: 'Use guides for setup, authentication, numbers, rentals, and payments.', href: '/help-center', cta: 'Read Guides' },
  ],
};
marketingPages.faq = {
  slug: 'faq',
  eyebrow: 'FAQ',
  title: 'Answers before you need a support ticket.',
  description: 'Clear answers about burner numbers, conversation inbox, verifications, rentals, eSIM, proxies, VPN protection, payments, account setup, refunds, billing, privacy, and data handling.',
  primaryCta: { label: 'Open Help Center', href: '/help-center' },
  secondaryCta: { label: 'Contact Support', href: '/contact' },
  faqs: faqItems,
};

marketingPages.help = {
  slug: 'help',
  eyebrow: 'Help Center',
  title: 'Guides for account setup, authentication, and service usage.',
  description: 'Structured help for getting started, verifications, rentals, payments, security, account access, and authentication.',
  primaryCta: { label: 'Contact Support', href: '/contact' },
  secondaryCta: { label: 'Telegram Support', href: TELEGRAM_SUPPORT_URL },
  cards: [
    { icon: 'book', meta: 'Getting Started', title: 'Create your Burner Point account', text: 'Required profile fields, linked legal pages, and first-dashboard orientation.', href: '/help-center#help-getting-started', anchorId: 'help-getting-started' },
    { icon: 'book', meta: 'Verifications', title: 'Receive SMS, OTP, and voice codes', text: 'Choose country and service, activate a number, submit it to the platform, and monitor delivery.', href: '/help-center#help-verifications', anchorId: 'help-verifications' },
    { icon: 'book', meta: 'Rentals', title: 'Manage temporary and renewable numbers', text: 'Understand expiration, renewal, release, conversation support, and recovery planning.', href: '/help-center#help-rentals', anchorId: 'help-rentals' },
    { icon: 'book', meta: 'Payments', title: 'Credits, purchases, receipts, and references', text: 'Troubleshoot checkout status, wallet credits, subscriptions, and payment gateway references.', href: '/help-center#help-payments', anchorId: 'help-payments' },
    { icon: 'book', meta: 'Security', title: 'Account security, sessions, and 2FA', text: 'Use email, phone, password reset, OAuth, active sessions, and optional multifactor authentication.', href: '/help-center#help-security', anchorId: 'help-security' },
    { icon: 'book', meta: 'Travel & Connectivity', title: 'Manage eSIM, proxies, and secure access', text: 'Understand plan setup, availability, region choices, and support paths for connectivity tools.', href: '/help-center#help-connectivity', anchorId: 'help-connectivity' },
    { icon: 'book', meta: 'Account & Authentication', title: 'Profile, sign out, and recovery', text: 'Manage account details, support tickets, notification preferences, and recovery paths.', href: '/help-center#help-account-auth', anchorId: 'help-account-auth' },
  ],
  sections: [
    { anchorId: 'help-getting-started', meta: 'Getting Started', title: 'Getting Started', text: 'Create a Burner Point account with first name, last name, email, phone number, and password. By continuing, you agree to the Terms of Service and Privacy Policy. After sign-up, complete onboarding so telecom, billing, support, and dashboard features have the account context they need.', items: ['Use a real email and phone number for recovery', 'Complete email or phone verification when prompted', 'Start with Get Verification, Rent A Number, or Buy Credits from the dashboard'] },
    { anchorId: 'help-verifications', meta: 'Verifications', title: 'Verifications', text: 'Verification workflows let you choose a country, service, and number, then receive SMS OTP or voice OTP through Burner Point. Delivery depends on provider route quality, platform rules, and available inventory.', items: ['Select service and country before purchasing', 'Watch the inbox for SMS or voice code delivery', 'Open support with the service, number, and payment reference if delivery fails'] },
    { anchorId: 'help-rentals', meta: 'Rentals', title: 'Rentals', text: 'Rentals are for users who need a number beyond a single OTP. Non-renewable rentals are short-term. Renewable rentals are monthly and better for account recovery, repeat verification, messaging, and US/Canada conversation flows.', items: ['Track expiration before losing access', 'Renew monthly numbers before they lapse', 'Use conversation-supported numbers for calls, voicemail, SMS, and secure audio, photo and video sharing where available'] },
    { anchorId: 'help-payments', meta: 'Payments', title: 'Payments', text: 'Credits and billing should show gateway status, product assignment, receipts, references, wallet updates, and subscriptions. Paystack, Paddle, and NOWPayments are the core payment paths, with secondary gateways deferred until core stability.', items: ['Save checkout and payment references', 'Wait for payment confirmation before expecting assignment', 'Contact support if payment succeeded but credits or inventory did not update'] },
    { anchorId: 'help-security', meta: 'Security', title: 'Security', text: 'Burner Point users can sign in with email or phone, reset passwords, use OAuth providers when configured, manage active sessions, and enable optional 2FA from the security page.', items: ['Use strong passwords and 2FA for sensitive accounts', 'Review active sessions after password resets', 'Never share OTP, recovery links, or support attachments publicly'] },
    { anchorId: 'help-connectivity', meta: 'Travel & Connectivity', title: 'Travel & Connectivity', text: 'Connectivity products cover eSIM plans, proxy access, and secure tunnel setup. The public product experience should make plan coverage, activation states, and support paths easy to understand.', items: ['Choose the right product for travel, routing, or secure access', 'Use support when setup, delivery, or plan status needs review', 'Keep plan, region, and device details ready when requesting help'] },
    { anchorId: 'help-account-auth', meta: 'Account & Authentication', title: 'Account & Authentication', text: 'Account settings cover profile details, sign out, support tickets, notifications, security controls, and recovery. A complete profile helps support resolve verification, rental, payment, eSIM, proxy, and VPN issues without asking for unnecessary personal data.', items: ['Keep profile email and phone current', 'Use sign out on shared devices', 'Open tickets with scoped context rather than sensitive unrelated information'] },
  ],
};
marketingPages.contact = { slug: 'contact', eyebrow: 'Contact', title: 'Talk to Burner Point.', description: 'Use the contact form, email support, or Telegram for verification, rental, eSIM, proxy, VPN, billing, and partnership questions.', primaryCta: { label: 'Email Support', href: SUPPORT_EMAIL_HREF }, secondaryCta: { label: 'Telegram Support', href: TELEGRAM_SUPPORT_URL }, highlights: [SUPPORT_EMAIL, TELEGRAM_SUPPORT_URL, TELEGRAM_COMMUNITY_URL] };
marketingPages.about = {
  slug: 'about',
  eyebrow: 'About Burner Point',
  title: 'Control communication without exposing identity.',
  description: 'Burner Point exists to give users practical control over communication identity. People should be able to verify accounts, receive messages, stay reachable, travel, route privately, and recover access without turning their personal number into a permanent public identifier.',
  primaryCta: { label: 'Get Started', href: '/sign-up' },
  secondaryCta: { label: 'Careers', href: '/careers' },
  highlights: ['Private by Design', 'Stay Anonymous', 'Stay Connected'],
  cards: [
    { icon: 'shield', title: 'Mission', text: 'Give users secure communication access without requiring personal-number exposure.' },
    { icon: 'phone', title: 'Audience', text: 'Built for privacy-minded individuals, operators, travelers, teams, and support-heavy workflows.' },
    { icon: 'lock', title: 'Trust Model', text: 'Minimize sensitive data exposure and make every account action clear.' },
  ],
  sections: [
    {
      title: 'Why Burner Point exists',
      text: 'A phone number has become an identity key. It is used for signups, recovery, fraud checks, messaging, shipping, marketplaces, dating, support, work, travel, and payments. Burner Point gives users a controlled layer between their personal number and the platforms that ask for phone access.',
      items: ['Reduce personal-number exposure', 'Separate short-term accounts from long-term identity', 'Keep communication reachable without surrendering control'],
    },
    {
      title: 'Mission',
      text: 'Burner Point is building privacy-focused telecommunications infrastructure for real users, not a novelty burner app. The mission is to make secure number access, verification, rentals, eSIM connectivity, proxies, and built-in protection feel reliable enough for everyday use.',
      items: ['Private by Design', 'Stay Anonymous', 'Stay Connected'],
    },
    {
      title: 'Who we serve',
      text: 'Burner Point serves people and teams who need communication access without unnecessary exposure. That includes online registrations, marketplaces, business communication, travel connectivity, private social accounts, and support workflows.',
      items: ['Privacy-minded individuals', 'Travelers and remote workers', 'Founders, operators, and support teams'],
    },
    {
      title: 'Values',
      text: 'The product is shaped around user control, reliability, transparency, security, and restraint. Burner Point should feel premium and calm because privacy tools work best when users can understand what is happening and trust the next action.',
      items: ['Minimize exposure', 'Design for trust', 'Explain status clearly', 'Build secure defaults'],
    },
    {
      title: 'Product philosophy',
      text: 'Burner Point brings together phone numbers, verification, rentals, conversation tools, eSIM, proxies, VPN-style protection, billing, and support under one cohesive identity-control layer. Each module should feel connected while keeping the public experience focused on what customers actually need.',
      items: ['Telecom-grade workflows over generic SaaS patterns', 'Clear lifecycle states for every number, payment, message, and support path', 'User-facing clarity before technical complexity'],
    },
    {
      title: 'Craft standard',
      text: 'Burner Point is designed to feel minimal, secure, and intentional across desktop web, mobile web, and native app experiences. The interface should help users make confident decisions without clutter, hype, or unclear privacy tradeoffs.',
      items: ['Premium green, white, and black visual language', 'High-trust copy and predictable controls', 'Production-ready accessibility, performance, and observability'],
    },
  ],
};
marketingPages.terms = { slug: 'terms', eyebrow: 'Legal', title: 'Terms of Service.', description: 'These product-facing terms summarize expected usage for Burner Point services and should be reviewed with counsel before production launch.', sections: [
  { title: 'Acceptable use', text: 'Burner Point is intended for lawful privacy, verification, communication, travel, and connectivity workflows. Abuse, fraud, harassment, spam, and platform misuse are prohibited.' },
  { title: 'Service availability', text: 'Telecommunications delivery depends on carriers, country coverage, provider inventory, and platform-specific acceptance rules.' },
  { title: 'User responsibility', text: 'Users are responsible for account security, third-party platform compliance, and lawful use of numbers, proxies, eSIM plans, and privacy tools.' },
] };
marketingPages.privacy = { slug: 'privacy', eyebrow: 'Legal', title: 'Privacy Policy.', description: 'Burner Point is designed around minimizing exposure and giving users more control over communication identity.', sections: [
  { title: 'Data minimization', text: 'We collect the account and transaction data needed to operate the platform, protect users, support billing, and troubleshoot service delivery.' },
  { title: 'No logs posture', text: 'Burner Point is presented with a no-logs policy for privacy workflows, with operational telemetry limited to security, abuse prevention, billing, and reliability.' },
  { title: 'User rights', text: 'The product experience should support access, correction, deletion, and export workflows where required by GDPR and other applicable privacy laws.' },
] };
marketingPages.esim = { slug: 'esim', eyebrow: 'eSIM Purchase', title: 'Travel-ready data without swapping physical SIM cards.', description: 'Buy and activate eSIM plans for global connectivity while keeping your number strategy and privacy workflow inside Burner Point.', primaryCta: { label: 'Get Your eSIM', href: '/sign-up' }, highlights: ['Instant eSIM activation', 'Travel-ready data plans', 'Multi-country coverage'], cards: [
  { icon: 'smartphone', title: 'Instant Activation', text: 'Activate data plans quickly without waiting for a physical card.' },
  { icon: 'globe', title: 'Global Coverage', text: 'Choose destination-ready connectivity for travel, remote work, and backup access.' },
  { icon: 'wifi', title: 'No Roaming Stress', text: 'Keep data predictable when moving between countries and networks.' },
] };
marketingPages.proxies = { slug: 'proxies', eyebrow: 'Proxies Purchase', title: 'Location-aware access with privacy-enhanced routing.', description: 'Use proxy access for privacy-preserving browsing, testing, localization, and controlled location switching.', primaryCta: { label: 'Get Proxies', href: '/sign-up' }, highlights: ['Residential and mobile proxies', 'Location switching', 'High-speed routing'], cards: [
  { icon: 'globe', title: 'Location Control', text: 'Route workflows through regions that match your access or testing needs.' },
  { icon: 'shield', title: 'Privacy Layer', text: 'Add separation between your personal connection and the tasks you need to complete.' },
  { icon: 'wifi', title: 'Fast Routing', text: 'Designed for practical browsing, testing, and app workflows.' },
] };
marketingPages.security = { slug: 'security', eyebrow: 'Secure Tunnel and Privacy', title: 'Stay Anonymous. Stay Connected. Private By Design.', description: 'Burner Point brings secure connectivity, private routing, and no-personal-number communication into one privacy-first platform experience.', primaryCta: { label: 'Learn More', href: '/products/secure-tunnel' }, highlights: ['Secure tunnel access', 'Account protection', 'Integrated privacy tools'], cards: [
  { icon: 'lock', title: 'Encrypted Layer', text: 'A security-first product posture for private browsing and communication workflows.' },
  { icon: 'shield', title: 'Privacy Controls', text: 'Clear account settings and privacy policies keep the product focused on user control and minimal exposure.' },
  { icon: 'globe', title: 'Integrated Routing', text: 'Proxy and VPN-style protection paired with private numbers and eSIM connectivity.' },
] };

export function getMarketingPage(slug: string) {
  return marketingPages[slug];
}

