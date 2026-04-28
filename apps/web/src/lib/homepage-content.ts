import {
  SUPPORT_CONTACTS,
  SUPPORT_EMAIL,
  TELEGRAM_COMMUNITY_HANDLE,
  TELEGRAM_COMMUNITY_URL,
  TELEGRAM_SUPPORT_HANDLE,
} from './support';

export type ProductLink = {
  name: string;
  description: string;
  href: string;
};

export type FeatureCard = {
  title: string;
  description: string;
};

export type ProductSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  note?: string;
  features: string[];
};

export type PricingCard = {
  title: string;
  price: string;
  description: string;
  cta: string;
  href: string;
  highlights: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  id: string;
  label: string;
  description: string;
  items: FaqItem[];
};

export const supportContacts = SUPPORT_CONTACTS;

export const socialProfiles = [
  { label: 'Instagram', handle: '@burnerpoint.app', href: 'https://www.instagram.com/burnerpoint.app' },
  { label: 'Facebook', handle: '@burnerpoint.app', href: 'https://www.facebook.com/burnerpoint.app' },
  { label: 'LinkedIn', handle: '@burnerpointapp', href: 'https://www.linkedin.com/company/burnerpointapp' },
  { label: 'TikTok', handle: '@burnerpointapp', href: 'https://www.tiktok.com/@burnerpointapp' },
  { label: 'Twitter/X', handle: '@burnerpointapp', href: 'https://x.com/burnerpointapp' },
  { label: 'Telegram', handle: TELEGRAM_COMMUNITY_HANDLE, href: TELEGRAM_COMMUNITY_URL },
  { label: 'YouTube', handle: '@burnerpointapp', href: 'https://www.youtube.com/@burnerpointapp' },
] as const;

export const productLinks: ProductLink[] = [
  {
    name: 'BP Messenger',
    description: 'Private US, UK, and Canada numbers for calling, texting, and contact separation.',
    href: '/products/messenger',
  },
  {
    name: 'BP Verify Hub',
    description: 'Receive supported SMS and voice codes without using your personal number.',
    href: '/products/verify-hub',
  },
  {
    name: 'BP Rentals',
    description: 'Keep a temporary or renewable number active for continuity and recovery.',
    href: '/products/rentals',
  },
  {
    name: 'BP eSIM Store',
    description: 'Buy travel data plans and activate connectivity without a physical SIM.',
    href: '/products/esim-store',
  },
  {
    name: 'BP Proxy Store',
    description: 'Access residential, datacenter, and rotating proxies for approved use cases.',
    href: '/products/proxy-store',
  },
  {
    name: 'BP Secure Tunnel',
    description: 'Protect your connection with secure access and dedicated IP options.',
    href: '/products/secure-tunnel',
  },
];

export const headerLinks = [
  { label: 'Products', href: '/#products' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Support', href: '/support' },
] as const;

export const heroTrustItems = [
  'Private numbers',
  'SMS & voice codes',
  'Renewable rentals',
  'Travel eSIM',
  'Proxy plans',
  'Secure access',
] as const;

export const productStripCards: FeatureCard[] = [
  {
    title: 'BP Messenger',
    description: 'Private US, UK, and Canada numbers for calling, texting, and managing contacts.',
  },
  {
    title: 'BP Verify Hub',
    description: 'Receive supported SMS or voice codes for services and countries where available.',
  },
  {
    title: 'BP Rentals',
    description: 'Rent temporary or renewable numbers for days, weeks, months, or longer.',
  },
  {
    title: 'BP eSIM Store',
    description: 'Buy country and regional data plans for travel, remote work, and global movement.',
  },
  {
    title: 'BP Proxy Store',
    description: 'Access residential, datacenter, and rotating proxy plans with location control.',
  },
  {
    title: 'BP Secure Tunnel',
    description: 'Protect your connection with secure access and dedicated IP options.',
  },
];

export const problemCards: FeatureCard[] = [
  {
    title: 'Too many apps ask for your number',
    description: 'Use a Burner Point number where supported instead of exposing your personal line everywhere.',
  },
  {
    title: 'Verification can be messy',
    description: 'Receive supported SMS or voice codes in a clear, guided flow.',
  },
  {
    title: 'Privacy tools are fragmented',
    description: 'Messaging, rentals, eSIMs, proxies, and secure access should not live in five separate products.',
  },
];

export const solutionFeatures: FeatureCard[] = [
  {
    title: 'Private second numbers',
    description: 'Choose a number for calls, texts, and contact separation without exposing your personal line.',
  },
  {
    title: 'SMS and voice codes',
    description: 'Receive supported verification codes where service and country availability allow.',
  },
  {
    title: 'Temporary or renewable rentals',
    description: 'Use short-term numbers for fast tasks or keep the same number active when continuity matters.',
  },
  {
    title: 'Wallet-based billing',
    description: 'Add balance once and use it across eligible products.',
  },
  {
    title: 'Local currency display',
    description: 'Store wallet balance in USD and display local exchange-rate estimates for NGN and other currencies.',
  },
  {
    title: 'Secure connectivity',
    description: 'Add travel data, proxy access, and protected connectivity to the same account.',
  },
];

export const productSections: ProductSection[] = [
  {
    id: 'bp-messenger',
    eyebrow: 'BP Messenger',
    title: "Your phone's other number.",
    description:
      'BP Messenger gives you a private number for calls, texts, contacts, and work-life separation.',
    href: '/products/messenger',
    cta: 'Start BP Messenger',
    features: [
      'Dedicated US, UK, or Canada number',
      'SMS and voice calling',
      'Call logs and contact management',
      'Spam blocking and number renewal',
      'Ad-free paid experience',
      'Web and mobile access',
    ],
  },
  {
    id: 'bp-verify-hub',
    eyebrow: 'BP Verify Hub',
    title: 'Receive codes without using your personal number.',
    description:
      'Choose a supported service and country, get a number, and receive SMS or voice codes where available.',
    href: '/products/verify-hub',
    cta: 'Get Verification',
    note: 'Use BP Verify Hub only for accounts, services, and workflows you are authorized to access.',
    features: [
      'Select service and country',
      'Get a private number',
      'Receive SMS or voice codes',
      'See clear pricing before you continue',
    ],
  },
  {
    id: 'bp-rentals',
    eyebrow: 'BP Rentals',
    title: 'Keep a number when you need continuity.',
    description:
      'Rent temporary or renewable numbers for repeated messages, recovery, and longer access where supported.',
    href: '/products/rentals',
    cta: 'Rent a Number',
    features: [
      'Daily, weekly, monthly, or yearly durations',
      'SMS and voice codes where available',
      'Renewal reminders and auto-renew options',
      'Rental history and number status tracking',
    ],
  },
  {
    id: 'bp-esim-store',
    eyebrow: 'BP eSIM Store',
    title: 'Stay connected when you travel.',
    description:
      'Buy eSIM data plans directly from Burner Point and activate travel data without needing a physical SIM. Ideal for travelers, founders, remote workers, and users who need global connectivity fast.',
    href: '/products/esim-store',
    cta: 'Explore eSIM Plans',
    features: [
      'Country and regional plans',
      'QR code delivery',
      'Data amount and duration display',
      'Activation tracking and order history',
    ],
  },
  {
    id: 'bp-proxy-store',
    eyebrow: 'BP Proxy Store',
    title: 'Private network access for approved use cases.',
    description:
      'Choose proxy plans for business, testing, research, geo-checking, and approved routing use cases.',
    href: '/products/proxy-store',
    cta: 'View Proxy Plans',
    note: "Proxy access must be used lawfully and in accordance with Burner Point's Acceptable Use Policy.",
    features: [
      'Residential, datacenter, and rotating proxies',
      'Location filtering',
      'Usage view and setup guidance',
      'Renewal management',
    ],
  },
  {
    id: 'bp-secure-tunnel',
    eyebrow: 'BP Secure Tunnel',
    title: 'Secure your connection with BP Secure Tunnel.',
    description:
      'Protect your connection with secure access, location choices, and dedicated IP options where available.',
    href: '/products/secure-tunnel',
    cta: 'Activate Secure Tunnel',
    features: [
      'Protected connectivity',
      'Dedicated IP options',
      'Location selection',
      'Device setup guidance',
    ],
  },
];

export const howItWorksSteps = [
  {
    step: '01',
    title: 'Create your account',
    description: 'Sign up with your email or phone and choose the product you need.',
  },
  {
    step: '02',
    title: 'Choose a product',
    description: 'Use Messenger, Verify Hub, Rentals, eSIM, Proxies, or Secure Tunnel.',
  },
  {
    step: '03',
    title: 'Stay in control',
    description: 'Manage numbers, codes, plans, billing, and support from one account.',
  },
];

export const pricingCards: PricingCard[] = [
  {
    title: 'BP Verify Hub',
    price: 'Starting at $0.99+ / verification',
    description: 'Receive supported SMS or voice codes for supported services.',
    href: '/products/verify-hub',
    cta: 'Get Verification',
    highlights: [
      'SMS code support',
      'Voice codes where available',
      'Clear country-based pricing',
      'Pay when eligible codes arrive',
    ],
  },
  {
    title: 'Non-Renewable Rentals',
    price: 'Starting at $5.99+',
    description: 'Temporary number access when you do not need renewal.',
    href: '/products/rentals',
    cta: 'Rent Temporary Number',
    highlights: [
      'Short-term number access',
      'SMS support',
      'Voice codes where available',
      'No long-term commitment',
    ],
  },
  {
    title: 'Renewable Rentals',
    price: 'Starting at $15.99+ / month',
    description: 'Keep the same number active for continuity and recovery.',
    href: '/products/rentals',
    cta: 'Start Monthly Rental',
    highlights: [
      'Renewable number access',
      'Monthly renewal options',
      'Renewal reminders',
      'Rental history',
    ],
  },
  {
    title: 'BP Messenger',
    price: 'Region-based monthly pricing',
    description: 'Dedicated number for private calling and texting.',
    href: '/products/messenger',
    cta: 'Start BP Messenger',
    highlights: [
      'US, UK, or Canada number',
      'Calling and texting',
      'Contact management',
      'Spam blocking',
    ],
  },
  {
    title: 'BP eSIM Store',
    price: 'Plan pricing varies by country',
    description: 'Buy travel data plans for supported countries and regions.',
    href: '/products/esim-store',
    cta: 'Buy eSIM',
    highlights: [
      'eSIM QR code delivery',
      'Country and regional plans',
      'Data and duration display',
      'Activation tracking',
    ],
  },
  {
    title: 'BP Proxy Store',
    price: 'Plan pricing varies by type and location',
    description: 'Access proxy plans for approved use cases.',
    href: '/products/proxy-store',
    cta: 'View Proxy Plans',
    highlights: [
      'Residential proxies',
      'Datacenter proxies',
      'Rotating proxies',
      'Setup guidance',
    ],
  },
  {
    title: 'BP Secure Tunnel',
    price: 'Dedicated IP plans',
    description: 'Protected connectivity with dedicated IP options.',
    href: '/products/secure-tunnel',
    cta: 'Secure My Connection',
    highlights: [
      'Protected connectivity',
      'Dedicated IP options',
      'Location selection',
      'Device setup guidance',
    ],
  },
];

export const paymentMethods = [
  'Cards',
  'Paystack',
  'Paddle subscriptions',
  'NOWPayments crypto deposits',
  'Additional regional gateways as available',
] as const;

export const availabilityItems = [
  {
    title: 'BP Messenger',
    description: 'USA • Canada • UK',
  },
  {
    title: 'BP Verify Hub',
    description: 'Availability depends on service and country',
  },
  {
    title: 'BP Rentals',
    description: 'Country availability depends on number inventory',
  },
  {
    title: 'BP eSIM Store',
    description: 'Country and regional data plans',
  },
  {
    title: 'BP Proxy Store',
    description: 'Location-based proxy plans',
  },
  {
    title: 'BP Secure Tunnel',
    description: 'Secure locations and dedicated IP options',
  },
];

export const safetyFeatures = [
  'Rate limits',
  'Fraud monitoring',
  'Abuse detection',
  'Audit logs',
  'Secure payments',
  'Account protection',
  'Provider compliance',
  'Terms of Service enforcement',
  'Support review for flagged activity',
] as const;

export const faqCategories: FaqCategory[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Core product definition, platform positioning, and account entry questions.',
    items: [
      {
        question: 'What is Burner Point?',
        answer:
          'Burner Point is a privacy-first communication and connectivity platform for private numbers, messaging, verification, rentals, eSIM data, proxy access, and secure connectivity.',
      },
      {
        question: 'How does Burner Point work?',
        answer:
          'Create an account, add balance or choose a plan, select a product, and manage everything from one place.',
      },
      {
        question: 'Is Burner Point only for phone numbers?',
        answer:
          'No. Burner Point includes BP Messenger, BP Verify Hub, BP Rentals, BP eSIM Store, BP Proxy Store, and BP Secure Tunnel.',
      },
      {
        question: 'What does "Private by Design" mean?',
        answer:
          'It means Burner Point is built to help users reduce exposure of their personal number and manage communication tools with more control.',
      },
      {
        question: 'Do I need to download an app?',
        answer:
          'Burner Point works in the browser and is designed for mobile access as the app experience expands.',
      },
      {
        question: 'Can I use Burner Point outside Nigeria?',
        answer:
          'Yes. Burner Point is built for global users. Product availability depends on country, service support, inventory, and compliance requirements.',
      },
    ],
  },
  {
    id: 'messenger',
    label: 'BP Messenger',
    description: 'Questions about dedicated second numbers, calls, texts, and privacy separation.',
    items: [
      {
        question: 'What is BP Messenger?',
        answer:
          "BP Messenger is Burner Point's private messaging and calling product. It gives users a dedicated number for supported US, UK, or Canada regions.",
      },
      {
        question: 'Do I need a number to use BP Messenger?',
        answer: 'Yes. BP Messenger requires a dedicated number assigned to your account.',
      },
      {
        question: 'Which countries are supported for BP Messenger numbers?',
        answer: 'BP Messenger is positioned around USA, Canada, and UK number support.',
      },
      {
        question: 'Is BP Messenger free?',
        answer:
          'Full BP Messenger access is intended to use recurring pricing. International call credits may be handled separately.',
      },
      {
        question: 'Can I choose my area code?',
        answer:
          'Where available, users can choose from supported area codes.',
      },
    ],
  },
  {
    id: 'verify',
    label: 'BP Verify Hub',
    description: 'Supported codes, timing, pricing, and service coverage.',
    items: [
      {
        question: 'What is BP Verify Hub?',
        answer:
          'BP Verify Hub allows users to receive supported SMS or voice verification codes through Burner Point.',
      },
      {
        question: 'Does BP Verify Hub support voice codes?',
        answer:
          'Yes, voice codes are supported where available by country and service.',
      },
      {
        question: 'How much does verification cost?',
        answer:
          'Pricing starts at $0.99+ and varies by country, service, and availability.',
      },
      {
        question: 'When am I charged?',
        answer:
          'Users should be charged when a code is successfully received, depending on the applicable billing rules.',
      },
      {
        question: 'What if no code arrives?',
        answer:
          'If no code arrives within the allowed time, the charge should be reversed or not applied according to product rules.',
      },
      {
        question: 'Are all services guaranteed?',
        answer:
          'No. Delivery depends on service rules, country support, filtering, and availability.',
      },
    ],
  },
  {
    id: 'rentals',
    label: 'BP Rentals',
    description: 'Temporary and renewable number access for continuity and recovery.',
    items: [
      {
        question: 'What is BP Rentals?',
        answer: 'BP Rentals allows users to rent temporary or renewable numbers for longer access.',
      },
      {
        question: 'What is the difference between non-renewable and renewable rentals?',
        answer:
          'Non-renewable rentals are temporary and expire after the selected duration. Renewable rentals can be kept active through recurring renewal payments.',
      },
      {
        question: 'Do rentals support SMS and voice codes?',
        answer:
          'Yes. Rentals are designed to support SMS and voice codes where availability allows.',
      },
      {
        question: 'Can I keep the same rental number?',
        answer:
          'Yes, if you choose a renewable rental and keep it active within the renewal policy.',
      },
      {
        question: 'Can I auto-renew rentals?',
        answer:
          'Yes. Users should be able to enable or disable auto-renew where supported.',
      },
    ],
  },
  {
    id: 'wallet-payments',
    label: 'Wallet & Payments',
    description: 'USD wallet, local currency display, funding, and refund expectations.',
    items: [
      {
        question: 'What currency does Burner Point use?',
        answer: 'Burner Point uses USD as the base wallet currency.',
      },
      {
        question: 'Can I see my balance in NGN?',
        answer:
          'Yes. Local currency estimates like NGN can be displayed using exchange rates for convenience.',
      },
      {
        question: 'Is local currency stored in my wallet?',
        answer:
          'No. Wallet balance is kept in USD. Local currency display is only an estimate.',
      },
      {
        question: 'What can I use my wallet balance for?',
        answer:
          'Wallet balance can be used for verifications, rentals, eSIM purchases, proxy purchases, and usage-based services.',
      },
      {
        question: 'What payment methods are supported?',
        answer:
          'Supported methods may include Paystack, Paddle, NOWPayments, cards, crypto, and additional gateways as available.',
      },
      {
        question: 'Can I get a refund?',
        answer:
          'Refund eligibility depends on the Terms of Service, product type, and whether the service has already been delivered.',
      },
    ],
  },
  {
    id: 'esim',
    label: 'eSIM',
    description: 'Travel data plan delivery, activation, and compatibility.',
    items: [
      {
        question: 'What is BP eSIM Store?',
        answer:
          'BP eSIM Store allows users to buy digital data plans for supported countries and regions.',
      },
      {
        question: 'How do I receive my eSIM?',
        answer:
          'After purchase, the user should receive an eSIM QR code or installation instructions in the account.',
      },
      {
        question: 'Can I renew an eSIM?',
        answer:
          'Some plans may support renewal or repurchase depending on plan rules.',
      },
      {
        question: 'Does eSIM work on every phone?',
        answer: 'No. Users need an eSIM-compatible device.',
      },
      {
        question: 'Can I use eSIM for calls?',
        answer: 'Most eSIM plans are data-only unless otherwise stated.',
      },
    ],
  },
  {
    id: 'proxies',
    label: 'Proxies',
    description: 'Business, testing, research, and location-based proxy access.',
    items: [
      {
        question: 'What is BP Proxy Store?',
        answer:
          'BP Proxy Store provides proxy access for approved business, testing, research, and routing use cases.',
      },
      {
        question: 'What proxy types are available?',
        answer:
          'Residential, datacenter, and rotating proxies may be offered depending on availability.',
      },
      {
        question: 'Are proxies allowed for any activity?',
        answer:
          'No. Users must follow the Acceptable Use Policy and product restrictions.',
      },
      {
        question: 'How do I receive proxy access?',
        answer:
          'After purchase, proxy setup details and instructions should appear in the account.',
      },
      {
        question: 'Can I select proxy country?',
        answer:
          'Where available, users should be able to choose location-based proxy options.',
      },
    ],
  },
  {
    id: 'secure-tunnel',
    label: 'Secure Tunnel',
    description: 'Secure access questions covering devices, locations, and dedicated IPs.',
    items: [
      {
        question: 'What is BP Secure Tunnel?',
        answer:
          'BP Secure Tunnel helps protect your connection with secure access and dedicated IP options where available.',
      },
      {
        question: 'What is a dedicated IP?',
        answer:
          'A dedicated IP is an IP address assigned specifically to one user or account, depending on plan availability.',
      },
      {
        question: 'Can I use BP Secure Tunnel on multiple devices?',
        answer:
          'Device limits should depend on the selected plan.',
      },
      {
        question: 'Can I choose a Secure Tunnel location?',
        answer: 'Users should be able to select from available server locations.',
      },
      {
        question: 'Is Secure Tunnel access free?',
        answer:
          'Basic access may be offered in some cases, but dedicated IP and full Secure Tunnel plans are paid.',
      },
    ],
  },
  {
    id: 'account-security',
    label: 'Account & Security',
    description: 'Support, compliance, account protection, and safe use expectations.',
    items: [
      {
        question: 'How do I reach support?',
        answer:
          `Email ${SUPPORT_EMAIL} or message Telegram support at ${TELEGRAM_SUPPORT_HANDLE} or ${TELEGRAM_COMMUNITY_HANDLE} for account, verification, rental, billing, eSIM, proxy, or Secure Tunnel help.`,
      },
      {
        question: 'Does privacy-first mean no rules?',
        answer:
          'No. Burner Point is privacy-first, not abuse-friendly. Users must follow the Terms, Acceptable Use Policy, and product rules.',
      },
      {
        question: 'What happens if suspicious activity is detected?',
        answer:
          'Flagged activity may trigger review, additional verification, support outreach, rate limits, or account restrictions depending on severity.',
      },
      {
        question: 'What information should I provide to support?',
        answer:
          'Provide your account email, the relevant product, time, payment reference if applicable, and helpful screenshots when available.',
      },
    ],
  },
];

export const allFaqItems = faqCategories.flatMap((category) => category.items);
export const faqPreviewItems = allFaqItems.slice(0, 6);
