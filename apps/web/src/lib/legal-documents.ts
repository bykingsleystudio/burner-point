export type LegalSubsection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalSection = {
  number: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: LegalSubsection[];
};

export type LegalDocument = {
  slug: 'terms-of-service' | 'privacy-policy';
  title: string;
  effectiveDate: string;
  companyName?: string;
  intro: string[];
  sections: LegalSection[];
};

export const legalDocuments: Record<LegalDocument['slug'], LegalDocument> = {
  'terms-of-service': {
    slug: 'terms-of-service',
    title: 'Burner Point Terms of Service',
    effectiveDate: 'April 23, 2026',
    companyName: 'Burner Point (“Burner Point,” “BP,” “we,” “us,” or “our”)',
    intro: [
      'These Terms of Service (“Terms”) govern your access to and use of Burner Point’s websites, mobile applications, dashboards, APIs, and related services (collectively, the “Services”). By creating an account, accessing, or using the Services, you agree to these Terms.',
      'If you do not agree, do not use the Services.',
    ],
    sections: [
      {
        number: '1',
        title: 'Eligibility',
        paragraphs: [
          'You must be at least 18 years old, or the age of majority in your jurisdiction, to use the Services. By using Burner Point, you represent that:',
          'We may restrict or deny access in certain countries or jurisdictions.',
        ],
        bullets: [
          'You are legally able to enter into binding agreements.',
          'The information you provide is accurate and current.',
          'You will comply with applicable laws and these Terms.',
        ],
      },
      {
        number: '2',
        title: 'Description of Services',
        paragraphs: [
          'Burner Point provides a multi-service communications and connectivity platform that may include:',
          'Some Services depend on third-party providers and carrier networks. Availability may vary by region, provider, regulation, and technical limitations.',
        ],
        bullets: [
          'Messaging and calling services',
          'Temporary and renewable number rentals',
          'Verification tools and communication workflows',
          'eSIM products',
          'Proxy products',
          'VPN services',
          'Wallet, billing, and subscription tools',
          'APIs, integrations, and support tools',
        ],
      },
      {
        number: '3',
        title: 'Account Registration',
        paragraphs: [
          'To access many features, you must create an account. You agree to:',
          'We may require identity verification, business verification, or additional checks for certain features.',
        ],
        bullets: [
          'Provide truthful registration details',
          'Keep login credentials secure',
          'Notify us promptly of unauthorized use',
          'Be responsible for activity under your account',
        ],
      },
      {
        number: '4',
        title: 'Wallets, Credits, Billing, and Payments',
        subsections: [
          {
            title: '4.1 Wallet Balance',
            paragraphs: [
              'Some Services use prepaid wallet balances or credits. Wallet balances may be denominated in USD, with local currency values shown for convenience.',
            ],
          },
          {
            title: '4.2 Funding',
            paragraphs: [
              'Wallet balances may be funded through supported payment providers. Fees, processing times, limits, and verification requirements may apply.',
            ],
          },
          {
            title: '4.3 Subscriptions',
            paragraphs: [
              'Some Services require recurring subscriptions. Subscription terms, renewal timing, billing intervals, and cancellation details are shown at checkout.',
            ],
          },
          {
            title: '4.4 Price Changes',
            paragraphs: [
              'We may change pricing, fees, exchange rates shown, taxes, or plan terms at any time, subject to applicable law.',
            ],
          },
          {
            title: '4.5 Refunds',
            paragraphs: [
              'Unless required by law or expressly stated, payments are non-refundable once Services are provisioned, numbers assigned, eSIMs issued, OTP workflows completed, proxy access details delivered, or VPN access activated.',
            ],
          },
          {
            title: '4.6 Taxes',
            paragraphs: ['You are responsible for applicable taxes unless otherwise stated.'],
          },
        ],
      },
      {
        number: '5',
        title: 'Number Rentals and Communications Services',
        paragraphs: [
          'Phone numbers, messaging routes, and call services are subject to:',
          'Numbers are licensed for use, not sold. We may reassign, reclaim, suspend, or rotate numbers when required by providers, law, abuse detection, inactivity, or unpaid balances.',
          'We do not guarantee delivery of any call, SMS, or OTP message.',
        ],
        bullets: [
          'Carrier availability',
          'Regulatory requirements',
          'Country restrictions',
          'Identity/KYC checks where required',
          'Fair use and anti-abuse monitoring',
        ],
      },
      {
        number: '6',
        title: 'Verification Services',
        paragraphs: [
          'Verification-related tools may support receiving or sending one-time codes or communication workflows depending on the product offered.',
          'You may only use verification tools for lawful, authorized purposes. You may not:',
          'We may suspend access to verification features at any time.',
        ],
        bullets: [
          'Bypass another platform’s rules or security',
          'Access accounts without authorization',
          'Create fraudulent or deceptive accounts',
          'Circumvent rate limits or abuse protections',
          'Violate any third-party terms',
        ],
      },
      {
        number: '7',
        title: 'eSIM, Proxy, and VPN Services',
        subsections: [
          {
            title: 'eSIM',
            paragraphs: [
              'eSIM plans are subject to network coverage, device compatibility, roaming rules, and third-party carrier terms.',
            ],
          },
          {
            title: 'Proxies',
            paragraphs: [
              'You may not use proxy services for fraud, credential attacks, scraping in violation of law, spam, malware, or unauthorized access.',
            ],
          },
          {
            title: 'VPN',
            paragraphs: [
              'VPN services may not be used to violate law, evade sanctions, infringe rights, distribute malware, or abuse networks.',
              'Performance depends on geography, congestion, providers, and device setup.',
            ],
          },
        ],
      },
      {
        number: '8',
        title: 'Acceptable Use Policy',
        paragraphs: [
          'You agree not to use the Services for:',
          'We may investigate and cooperate with authorities where appropriate.',
        ],
        bullets: [
          'Fraud, scams, phishing, impersonation',
          'Spam or unsolicited communications',
          'Harassment, threats, or abuse',
          'Money laundering or sanctions evasion',
          'Intellectual property infringement',
          'Child exploitation content',
          'Malware, botnets, credential stuffing',
          'Illegal surveillance or privacy violations',
          'Any unlawful activity',
        ],
      },
      {
        number: '9',
        title: 'Suspensions and Termination',
        paragraphs: [
          'We may suspend, limit, or terminate accounts or Services immediately if we believe there is:',
          'You may stop using the Services at any time.',
        ],
        bullets: [
          'Fraud or abuse risk',
          'Violation of these Terms',
          'Payment failure or chargeback risk',
          'Legal or regulatory risk',
          'Security threats',
          'Provider-imposed restrictions',
        ],
      },
      {
        number: '10',
        title: 'Third-Party Providers',
        paragraphs: [
          'We rely on carriers, payment processors, infrastructure vendors, and software providers. We are not responsible for outages, failures, delays, suspensions, or actions caused by third parties.',
        ],
      },
      {
        number: '11',
        title: 'Intellectual Property',
        paragraphs: [
          'Burner Point and related branding, software, interfaces, and content are owned by us or our licensors and protected by law.',
          'You receive a limited, revocable, non-transferable license to use the Services under these Terms.',
        ],
      },
      {
        number: '12',
        title: 'Privacy',
        paragraphs: ['Your use of the Services is also governed by our Privacy Policy.'],
      },
      {
        number: '13',
        title: 'Disclaimers',
        paragraphs: [
          'The Services are provided “as is” and “as available.” To the maximum extent permitted by law, we disclaim warranties including merchantability, fitness for a particular purpose, and non-infringement.',
          'We do not guarantee uninterrupted service, message delivery, number retention, or compatibility with third-party platforms.',
        ],
      },
      {
        number: '14',
        title: 'Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by law, Burner Point will not be liable for indirect, incidental, special, consequential, punitive, or lost profits damages.',
          'Our aggregate liability for claims related to the Services will not exceed the amount you paid us in the twelve (12) months before the claim.',
        ],
      },
      {
        number: '15',
        title: 'Indemnification',
        paragraphs: [
          'You agree to defend, indemnify, and hold harmless Burner Point and its affiliates from claims arising out of your misuse of the Services, violation of these Terms, or violation of law.',
        ],
      },
      {
        number: '16',
        title: 'Governing Law',
        paragraphs: [
          'These Terms are governed by the laws of the jurisdiction selected in our legal notices or contracting entity details, without regard to conflict-of-law principles.',
        ],
      },
      {
        number: '17',
        title: 'Changes to These Terms',
        paragraphs: [
          'We may update these Terms from time to time. Continued use after updates means you accept the revised Terms.',
        ],
      },
      {
        number: '18',
        title: 'Contact',
        paragraphs: [
          'For legal notices or support, contact us through the official Burner Point support channels listed on our website or dashboard.',
        ],
      },
    ],
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Burner Point Privacy Policy',
    effectiveDate: 'April 23, 2026',
    intro: [
      'This Privacy Policy explains how Burner Point collects, uses, discloses, and safeguards personal information when you use our Services.',
    ],
    sections: [
      {
        number: '1',
        title: 'Information We Collect',
        subsections: [
          {
            title: '1.1 Information You Provide',
            bullets: [
              'Name, username, company name',
              'Email address',
              'Phone number',
              'Billing and payment details (processed by providers)',
              'Identity verification details where required',
              'Support messages and communications',
            ],
          },
          {
            title: '1.2 Information Collected Automatically',
            bullets: [
              'IP address',
              'Device identifiers',
              'Browser/app metadata',
              'Usage logs',
              'Session timestamps',
              'Approximate location',
              'Crash and diagnostics data',
            ],
          },
          {
            title: '1.3 Service Data',
            paragraphs: ['Depending on the feature used:'],
            bullets: [
              'Message metadata',
              'Call metadata',
              'Number assignments',
              'Subscription status',
              'Wallet transactions',
              'eSIM order status',
              'Proxy/VPN session metadata',
              'Security and fraud signals',
            ],
          },
        ],
      },
      {
        number: '2',
        title: 'How We Use Information',
        paragraphs: ['We use information to:'],
        bullets: [
          'Provide and operate the Services',
          'Process payments and subscriptions',
          'Deliver communications features',
          'Detect fraud and secure accounts',
          'Provide support',
          'Improve product performance',
          'Measure analytics and usage',
          'Comply with law',
        ],
      },
      {
        number: '3',
        title: 'Legal Bases (Where Applicable)',
        paragraphs: ['Depending on your location, we process data based on:'],
        bullets: [
          'Contract performance',
          'Legitimate interests',
          'Consent',
          'Legal obligations',
        ],
      },
      {
        number: '4',
        title: 'Sharing of Information',
        paragraphs: [
          'We may share information with:',
          'We do not sell your personal data to advertisers.',
        ],
        bullets: [
          'Telecom, carrier, and infrastructure providers',
          'Payment processors',
          'Analytics and monitoring vendors',
          'Identity verification vendors',
          'Legal authorities when required',
          'Professional advisors in connection with corporate matters',
        ],
      },
      {
        number: '5',
        title: 'Data Retention',
        paragraphs: [
          'We retain information as long as reasonably necessary for:',
          'Retention periods vary by data type and jurisdiction.',
        ],
        bullets: [
          'Service delivery',
          'Security and fraud prevention',
          'Accounting and legal compliance',
          'Dispute resolution',
        ],
      },
      {
        number: '6',
        title: 'Security',
        paragraphs: [
          'We use administrative, technical, and organizational safeguards designed to protect data. No system is perfectly secure.',
        ],
      },
      {
        number: '7',
        title: 'International Transfers',
        paragraphs: [
          'Your information may be processed in countries other than your own. We use appropriate safeguards where required.',
        ],
      },
      {
        number: '8',
        title: 'Your Rights',
        paragraphs: [
          'Depending on your jurisdiction, you may have rights to:',
          'Requests may be subject to identity verification and legal limitations.',
        ],
        bullets: [
          'Access data',
          'Correct inaccurate data',
          'Delete certain data',
          'Restrict or object to processing',
          'Data portability',
          'Withdraw consent where applicable',
        ],
      },
      {
        number: '9',
        title: 'Cookies and Similar Technologies',
        paragraphs: [
          'We may use cookies, SDKs, pixels, and similar technologies for login, preferences, security, and analytics. You may manage browser settings where available.',
        ],
      },
      {
        number: '10',
        title: 'Children',
        paragraphs: [
          'The Services are not directed to children under 18, and we do not knowingly collect their personal data.',
        ],
      },
      {
        number: '11',
        title: 'Third-Party Services',
        paragraphs: [
          'Our Services may link to or integrate with third-party products. Their privacy practices are governed by their own policies.',
        ],
      },
      {
        number: '12',
        title: 'Changes to This Policy',
        paragraphs: [
          'We may update this Privacy Policy from time to time. Continued use of the Services after updates constitutes acceptance where permitted.',
        ],
      },
      {
        number: '13',
        title: 'Contact',
        paragraphs: [
          'For privacy requests or questions, contact Burner Point through the official support or privacy contact listed on our website.',
        ],
      },
    ],
  },
};

export function getLegalDocument(slug: LegalDocument['slug']) {
  return legalDocuments[slug];
}
