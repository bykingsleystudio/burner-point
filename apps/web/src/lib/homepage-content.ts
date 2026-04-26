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

export const supportContacts = {
  email: 'info.burnerpoint@gmail.com',
  telegramPrimary: 'https://t.me/burnerpoint',
  telegramApp: 'https://t.me/burnerpointapp',
};

export const socialProfiles = [
  { label: 'Instagram', handle: '@burnerpoint.app', href: 'https://www.instagram.com/burnerpoint.app' },
  { label: 'Facebook', handle: '@burnerpoint.app', href: 'https://www.facebook.com/burnerpoint.app' },
  { label: 'LinkedIn', handle: '@burnerpointapp', href: 'https://www.linkedin.com/company/burnerpointapp' },
  { label: 'TikTok', handle: '@burnerpointapp', href: 'https://www.tiktok.com/@burnerpointapp' },
  { label: 'Twitter/X', handle: '@burnerpointapp', href: 'https://x.com/burnerpointapp' },
  { label: 'Telegram', handle: '@burnerpointapp', href: 'https://t.me/burnerpointapp' },
  { label: 'YouTube', handle: '@burnerpointapp', href: 'https://www.youtube.com/@burnerpointapp' },
] as const;

export const productLinks: ProductLink[] = [
  {
    name: 'BP Messenger',
    description: 'Private US, UK, and Canada numbers for calling, texting, and contact separation.',
    href: '/#bp-messenger',
  },
  {
    name: 'BP Verify Hub',
    description: 'Receive supported SMS and voice verification codes from one clean dashboard.',
    href: '/#bp-verify-hub',
  },
  {
    name: 'BP Rentals',
    description: 'Keep a temporary or renewable number active for continuity and recovery.',
    href: '/#bp-rentals',
  },
  {
    name: 'BP eSIM Store',
    description: 'Buy travel data plans and activate connectivity without a physical SIM.',
    href: '/#bp-esim-store',
  },
  {
    name: 'BP Proxy Store',
    description: 'Access residential, datacenter, and rotating proxies for approved use cases.',
    href: '/#bp-proxy-store',
  },
  {
    name: 'BP Secure Tunnel',
    description: 'Use WireGuard-based VPN access with dedicated IP options and device controls.',
    href: '/#bp-secure-tunnel',
  },
];

export const headerLinks = [
  { label: 'Products', href: '/#products' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Support', href: '/#support' },
] as const;

export const heroTrustItems = [
  'US, UK & Canada numbers',
  'SMS & Voice OTP',
  'Renewable rentals',
  'eSIM data',
  'Secure VPN',
  'Proxy access',
] as const;

export const productStripCards: FeatureCard[] = [
  {
    title: 'BP Messenger',
    description: 'Private US, UK, and Canada numbers for calling, texting, and managing contacts.',
  },
  {
    title: 'BP Verify Hub',
    description: 'Receive supported SMS or voice verification codes for services and countries where available.',
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
    description: 'Use encrypted connectivity with WireGuard-based VPN access and dedicated IP options.',
  },
];

export const problemCards: FeatureCard[] = [
  {
    title: 'Too many apps ask for your number',
    description: 'Use a Burner Point number where supported instead of exposing your personal line everywhere.',
  },
  {
    title: 'Verification can be messy',
    description: 'Receive supported SMS or voice OTP through a wallet-powered, real-time dashboard.',
  },
  {
    title: 'Privacy tools are fragmented',
    description: 'Messaging, rentals, eSIMs, proxies, and VPN access should not live in five separate products.',
  },
];

export const solutionFeatures: FeatureCard[] = [
  {
    title: 'Private second numbers',
    description: 'Choose a number for calls, texts, and contact separation without exposing your personal line.',
  },
  {
    title: 'SMS and voice OTP',
    description: 'Receive supported verification codes directly inside your dashboard where service and route support exist.',
  },
  {
    title: 'Temporary or renewable rentals',
    description: 'Use short-term numbers for fast tasks or keep the same number active when continuity matters.',
  },
  {
    title: 'Wallet-based billing',
    description: 'Fund once and spend across usage-based products with a single account balance.',
  },
  {
    title: 'Local currency display',
    description: 'Store wallet balance in USD and display local exchange-rate estimates for NGN and other currencies.',
  },
  {
    title: 'Secure connectivity',
    description: 'Add travel data, proxy access, and secure VPN sessions to the same privacy-first platform.',
  },
];

export const productSections: ProductSection[] = [
  {
    id: 'bp-messenger',
    eyebrow: 'BP Messenger',
    title: "Your phone's other number.",
    description:
      'BP Messenger gives you a dedicated private number for communication without exposing your personal number. Choose a supported US, Canada, or UK number, then call, text, manage contacts, block spam, and keep conversations separate.',
    href: '/auth/signup',
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
      'Select a supported service, choose a country, request a number, and receive SMS or voice OTP live inside Burner Point. Pricing varies by country, service, availability, and route quality.',
    href: '/auth/signup',
    cta: 'Get Verification',
    note: 'Use BP Verify Hub only for accounts, services, and workflows you are authorized to access.',
    features: [
      'Select service and country',
      'Get assigned number instantly',
      'Receive SMS or voice OTP live',
      'Pay only when a code is received under supported billing rules',
    ],
  },
  {
    id: 'bp-rentals',
    eyebrow: 'BP Rentals',
    title: 'Keep a number when you need continuity.',
    description:
      'Some workflows require more than a single code. BP Rentals lets you rent temporary or renewable numbers for longer access, continuity, account recovery, and repeated messages where supported.',
    href: '/auth/signup',
    cta: 'Rent a Number',
    features: [
      'Daily, weekly, monthly, or yearly durations',
      'SMS support and voice OTP where available',
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
    href: '/auth/signup',
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
      'BP Proxy Store gives users access to proxy plans for business, testing, research, geo-checking, and approved routing use cases.',
    href: '/auth/signup',
    cta: 'View Proxy Plans',
    note: "Proxy access must be used lawfully and in accordance with Burner Point's Acceptable Use Policy.",
    features: [
      'Residential, datacenter, and rotating proxies',
      'Location filtering',
      'Usage dashboard and credential delivery',
      'Renewal management',
    ],
  },
  {
    id: 'bp-secure-tunnel',
    eyebrow: 'BP Secure Tunnel',
    title: 'Secure your connection with BP Secure Tunnel.',
    description:
      "BP Secure Tunnel is Burner Point's WireGuard-based VPN system for private, encrypted connectivity and dedicated IP access.",
    href: '/auth/signup',
    cta: 'Activate Secure Tunnel',
    features: [
      'WireGuard-based security',
      'Dedicated IP options',
      'Server location selection',
      'Config generation and device management',
    ],
  },
];

export const howItWorksSteps = [
  {
    step: '01',
    title: 'Create your account',
    description: 'Sign up once and access your Burner Point dashboard on web and, when available, mobile.',
  },
  {
    step: '02',
    title: 'Fund your wallet or choose a plan',
    description: 'Add USD balance through supported payment methods or subscribe to recurring products.',
  },
  {
    step: '03',
    title: 'Choose a product',
    description: 'Use BP Messenger, Verify Hub, Rentals, eSIM Store, Proxy Store, or Secure Tunnel.',
  },
  {
    step: '04',
    title: 'Stay private and connected',
    description: 'Manage numbers, codes, plans, and connectivity tools from one unified control center.',
  },
];

export const dashboardPreviewCards = [
  { label: 'Available balance', value: '$25.00', meta: 'Wallet ready for verification, rentals, and travel data' },
  { label: 'Active number', value: '+1 United States', meta: 'Private messaging line in use' },
  { label: 'OTP received', value: '482901', meta: 'Live Verify Hub session' },
  { label: 'eSIM plan', value: 'USA 5GB active', meta: 'Travel connectivity in one tap' },
  { label: 'Proxy plan', value: 'Residential online', meta: 'Approved routing available' },
  { label: 'Secure Tunnel', value: 'Dedicated IP connected', meta: 'Encrypted session running' },
] as const;

export const pricingCards: PricingCard[] = [
  {
    title: 'BP Verify Hub',
    price: 'Starting at $0.99+ / verification',
    description: 'Receive supported SMS or voice OTP codes for supported services.',
    href: '/auth/signup',
    cta: 'Get Verification',
    highlights: [
      'SMS OTP support',
      'Voice OTP where available',
      'Real-time code delivery',
      'Wallet deduction only when a code is received under supported billing rules',
    ],
  },
  {
    title: 'Non-Renewable Rentals',
    price: 'Starting at $5.99+',
    description: 'Temporary number access when you do not need renewal.',
    href: '/auth/signup',
    cta: 'Rent Temporary Number',
    highlights: [
      'Short-term number access',
      'SMS support',
      'Voice OTP where available',
      'No long-term commitment',
    ],
  },
  {
    title: 'Renewable Rentals',
    price: 'Starting at $15.99+ / month',
    description: 'Keep the same number active for continuity and recovery.',
    href: '/auth/signup',
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
    href: '/auth/signup',
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
    href: '/auth/signup',
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
    href: '/auth/signup',
    cta: 'View Proxy Plans',
    highlights: [
      'Residential proxies',
      'Datacenter proxies',
      'Rotating proxies',
      'Credentials dashboard',
    ],
  },
  {
    title: 'BP Secure Tunnel',
    price: 'Dedicated IP VPN plans',
    description: 'Secure VPN access powered by WireGuard.',
    href: '/auth/signup',
    cta: 'Secure My Connection',
    highlights: [
      'Secure tunneling',
      'Dedicated IP options',
      'Server location selection',
      'Config generation',
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
    description: 'Global support depending on service and route availability',
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
    description: 'VPN server locations and dedicated IP options',
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

export const testimonialPlaceholders = [
  {
    name: 'Remote Worker',
    location: 'Lagos, Nigeria',
    quote:
      'Burner Point gives me one place to manage numbers, messages, and verifications without exposing my personal phone number.',
  },
  {
    name: 'Online Seller',
    location: 'Accra, Ghana',
    quote:
      'I like that I can separate business contacts from my personal line. It makes online selling feel safer.',
  },
  {
    name: 'Founder',
    location: 'London, UK',
    quote:
      'The wallet system makes it easy. I fund once and use it across verifications, rentals, and other tools.',
  },
  {
    name: 'Freelancer',
    location: 'Toronto, Canada',
    quote:
      'Having a dedicated private number for messaging helps me stay organized without carrying another SIM.',
  },
  {
    name: 'Traveler',
    location: 'Nairobi, Kenya',
    quote:
      'The eSIM store makes travel easier. I can buy data and keep communication tools in the same account.',
  },
  {
    name: 'Business User',
    location: 'New York, USA',
    quote:
      'I use different tools for privacy, proxies, and connectivity. Burner Point brings them together in one dashboard.',
  },
  {
    name: 'Consultant',
    location: 'Manchester, UK',
    quote: 'BP Messenger feels like a private second line for my work life.',
  },
  {
    name: 'QA Analyst',
    location: 'Austin, USA',
    quote: 'The VPN and proxy tools make the platform feel bigger than a normal second-number app.',
  },
];

export const faqCategories: FaqCategory[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Core product definition, platform positioning, and account entry questions.',
    items: [
      {
        question: 'What is Burner Point?',
        answer:
          'Burner Point is a privacy-first communication and connectivity platform that provides private numbers, messaging tools, verification workflows, rentals, eSIM data, proxy access, and secure VPN tools.',
      },
      {
        question: 'How does Burner Point work?',
        answer:
          'Create an account, fund your wallet or choose a subscription, select a product, and manage your services from the Burner Point dashboard.',
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
          'Burner Point supports web dashboard access today and is designed to extend across mobile surfaces when the app experience is available.',
      },
      {
        question: 'Can I use Burner Point outside Nigeria?',
        answer:
          'Yes. Burner Point is built for global users. Product availability depends on country, provider inventory, telecom routing, and compliance requirements.',
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
          'Where supported by provider inventory, users should be able to select from available area codes.',
      },
    ],
  },
  {
    id: 'verify',
    label: 'BP Verify Hub',
    description: 'Supported verification flows, billing behavior, timing, and service coverage.',
    items: [
      {
        question: 'What is BP Verify Hub?',
        answer:
          'BP Verify Hub allows users to receive supported SMS or voice verification codes through Burner Point.',
      },
      {
        question: 'Does BP Verify Hub support voice OTP?',
        answer:
          'Yes, voice OTP is supported where available by country, service, and provider route.',
      },
      {
        question: 'How much does verification cost?',
        answer:
          'Pricing starts at $0.99+ and varies by country, service, provider cost, and route availability.',
      },
      {
        question: 'When am I charged?',
        answer:
          'Users should be charged when a code is successfully received, depending on the applicable billing rules.',
      },
      {
        question: 'What if no code arrives?',
        answer:
          'If no code arrives within the allowed time and the session is marked unsuccessful, the user should not be charged or should receive an automatic credit reversal according to product rules.',
      },
      {
        question: 'Are all services guaranteed?',
        answer:
          'No. Delivery depends on provider routes, target service rules, telecom filtering, and availability.',
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
        question: 'Do rentals support SMS OTP and voice OTP?',
        answer:
          'Yes. Rentals are designed to support SMS OTP and voice OTP where availability allows.',
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
    description: 'USD wallet behavior, local currency display, funding, and refund expectations.',
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
          'No. The wallet stores USD internally. Local currency display is only an estimate.',
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
          'Refund eligibility depends on the Terms of Service, provider status, product type, and whether the service has already been provisioned.',
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
          'After purchase, the user should receive an eSIM QR code or installation instructions in the dashboard.',
      },
      {
        question: 'Can I renew an eSIM?',
        answer:
          'Some plans may support renewal or repurchase depending on provider rules.',
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
          'Residential, datacenter, and rotating proxies may be offered depending on provider availability.',
      },
      {
        question: 'Are proxies allowed for any activity?',
        answer:
          'No. Users must follow the Acceptable Use Policy and provider restrictions.',
      },
      {
        question: 'How do I receive proxy access?',
        answer:
          'After purchase, proxy credentials and setup instructions should appear in the dashboard.',
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
    description: 'VPN questions covering device access, locations, and dedicated IPs.',
    items: [
      {
        question: 'What is BP Secure Tunnel?',
        answer:
          "BP Secure Tunnel is Burner Point's VPN product powered by WireGuard-based secure tunneling.",
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
        question: 'Can I choose VPN location?',
        answer: 'Users should be able to select from available server locations.',
      },
      {
        question: 'Is VPN access free?',
        answer:
          'Basic access may be offered depending on product strategy, but dedicated IP or full VPN access should be paid.',
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
          'Email info.burnerpoint@gmail.com or message Telegram support at @burnerpoint or @burnerpointapp for account, verification, rental, billing, eSIM, proxy, or VPN help.',
      },
      {
        question: 'Does privacy-first mean no rules?',
        answer:
          'No. Burner Point is privacy-first, not abuse-friendly. The platform should enforce terms, fraud controls, and provider compliance requirements.',
      },
      {
        question: 'What happens if suspicious activity is detected?',
        answer:
          'Flagged activity may trigger review, additional verification, support outreach, rate limits, or account restrictions depending on severity.',
      },
      {
        question: 'What information should I provide to support?',
        answer:
          'Provide your account email, the relevant product, timestamps, payment reference if applicable, and screenshots or session details when available.',
      },
    ],
  },
];

export const allFaqItems = faqCategories.flatMap((category) => category.items);
export const faqPreviewItems = allFaqItems.slice(0, 6);
