export type BillingSubscriptionProduct =
  | 'bp_messenger_pro'
  | 'bp_secure_tunnel'
  | 'bp_premium';

export type BillingSubscriptionPlan = {
  id: string;
  product: BillingSubscriptionProduct;
  productName: string;
  planName: string;
  headline: string;
  priceUsdCents: number;
  displayPrice: string;
  cadence: 'monthly';
  paddlePriceEnv: string;
  features: string[];
  metadata?: Record<string, unknown>;
};

export type WalletFundingMethod = {
  id: 'paystack' | 'flutterwave' | 'nowpayments';
  label: string;
  description: string;
};

export const WALLET_FUNDING_METHODS: WalletFundingMethod[] = [
  {
    id: 'paystack',
    label: 'Paystack',
    description: 'Card and local checkout for wallet top-ups.',
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    description: 'Alternative card and bank wallet funding path.',
  },
  {
    id: 'nowpayments',
    label: 'NOWPayments',
    description: 'Crypto wallet funding for supported assets.',
  },
];

export const BILLING_SUBSCRIPTION_PLANS: BillingSubscriptionPlan[] = [
  {
    id: 'bp-messenger-pro-us',
    product: 'bp_messenger_pro',
    productName: 'BP Messenger Pro',
    planName: 'USA Number Plan',
    headline: 'Dedicated renewable number with messaging and calling.',
    priceUsdCents: 799,
    displayPrice: '$7.99/month',
    cadence: 'monthly',
    paddlePriceEnv: 'PADDLE_PRICE_BP_MESSENGER_US_MONTHLY',
    features: [
      'Dedicated renewable number',
      'SMS and MMS',
      'Voice calls and logs',
      'Spam protection',
      'Realtime inbox sync',
    ],
    metadata: {
      country: 'US',
      providerChain: ['twilio', 'telnyx', 'bandwidth'],
      walletNote: 'International calls and high-cost routes use Call Credits.',
    },
  },
  {
    id: 'bp-messenger-pro-ca',
    product: 'bp_messenger_pro',
    productName: 'BP Messenger Pro',
    planName: 'Canada Number Plan',
    headline: 'Dedicated renewable number with messaging and calling.',
    priceUsdCents: 899,
    displayPrice: '$8.99/month',
    cadence: 'monthly',
    paddlePriceEnv: 'PADDLE_PRICE_BP_MESSENGER_CA_MONTHLY',
    features: [
      'Dedicated renewable number',
      'SMS and MMS',
      'Voice calls and logs',
      'Spam protection',
      'Realtime inbox sync',
    ],
    metadata: {
      country: 'CA',
      providerChain: ['twilio', 'telnyx', 'bandwidth'],
      walletNote: 'International calls and high-cost routes use Call Credits.',
    },
  },
  {
    id: 'bp-messenger-pro-uk',
    product: 'bp_messenger_pro',
    productName: 'BP Messenger Pro',
    planName: 'UK Number Plan',
    headline: 'Dedicated renewable number with messaging and calling.',
    priceUsdCents: 999,
    displayPrice: '$9.99/month',
    cadence: 'monthly',
    paddlePriceEnv: 'PADDLE_PRICE_BP_MESSENGER_UK_MONTHLY',
    features: [
      'Dedicated renewable number',
      'SMS and MMS',
      'Voice calls and logs',
      'Spam protection',
      'Realtime inbox sync',
    ],
    metadata: {
      country: 'UK',
      providerChain: ['twilio', 'telnyx', 'bandwidth'],
      walletNote: 'International calls and high-cost routes use Call Credits.',
    },
  },
  {
    id: 'bp-secure-tunnel-basic',
    product: 'bp_secure_tunnel',
    productName: 'BP Secure Tunnel VPN',
    planName: 'Basic',
    headline: 'Encrypted WireGuard access across US, UK, and global servers.',
    priceUsdCents: 599,
    displayPrice: '$5.99/month',
    cadence: 'monthly',
    paddlePriceEnv: 'PADDLE_PRICE_BP_SECURE_TUNNEL_BASIC_MONTHLY',
    features: [
      'WireGuard VPN',
      'Encrypted traffic',
      'US, UK, and global servers',
      'Mobile support',
      'Desktop config export',
    ],
    metadata: {
      tier: 'basic',
    },
  },
  {
    id: 'bp-secure-tunnel-pro',
    product: 'bp_secure_tunnel',
    productName: 'BP Secure Tunnel VPN',
    planName: 'Pro',
    headline: 'Premium routing with dedicated IP support where available.',
    priceUsdCents: 999,
    displayPrice: '$9.99/month',
    cadence: 'monthly',
    paddlePriceEnv: 'PADDLE_PRICE_BP_SECURE_TUNNEL_PRO_MONTHLY',
    features: [
      'Dedicated IP support where available',
      'Premium routing',
      'Priority bandwidth',
      'Multi-device sessions',
    ],
    metadata: {
      tier: 'pro',
    },
  },
  {
    id: 'bp-premium',
    product: 'bp_premium',
    productName: 'BP Premium',
    planName: 'Premium',
    headline: 'Messenger Pro plus Secure Tunnel Pro with platform-wide premium perks.',
    priceUsdCents: 1499,
    displayPrice: '$14.99/month',
    cadence: 'monthly',
    paddlePriceEnv: 'PADDLE_PRICE_BP_PREMIUM_MONTHLY',
    features: [
      'Messenger Pro access',
      'Secure Tunnel Pro access',
      'Ad-free experience',
      'Priority support',
      'Reduced verification and rental fees',
      'Premium dashboard and badge',
    ],
  },
];

export function findBillingSubscriptionPlan(planId?: string | null) {
  if (!planId) return null;
  return BILLING_SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? null;
}
