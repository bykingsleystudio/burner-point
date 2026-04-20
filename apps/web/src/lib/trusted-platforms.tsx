import type { IconType } from 'react-icons';
import {
  FaAmazon,
  FaLinkedin,
  FaMicrosoft,
} from 'react-icons/fa6';
import {
  Si1Password,
  SiAirbnb,
  SiApple,
  SiAuth0,
  SiCloudflare,
  SiDiscord,
  SiGithub,
  SiGoogle,
  SiInstagram,
  SiMeta,
  SiNetflix,
  SiOkta,
  SiPaypal,
  SiPinterest,
  SiProton,
  SiReddit,
  SiSamsung,
  SiSnapchat,
  SiSpotify,
  SiStripe,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiUber,
  SiWhatsapp,
  SiX,
  SiZoom,
} from 'react-icons/si';

const MOT = [
  'bp-trust-mot-0',
  'bp-trust-mot-1',
  'bp-trust-mot-2',
  'bp-trust-mot-3',
  'bp-trust-mot-4',
  'bp-trust-mot-5',
  'bp-trust-mot-6',
  'bp-trust-mot-7',
] as const;

export type TrustedPlatformItem = {
  label: string;
  Icon: IconType;
  mot: (typeof MOT)[number];
};

/** Representative platforms for SMS/OTP ecosystems; icons via react-icons (Simple Icons + FA). */
export const TRUSTED_PLATFORMS: TrustedPlatformItem[] = [
  { label: 'Google', Icon: SiGoogle, mot: MOT[0] },
  { label: 'Amazon', Icon: FaAmazon, mot: MOT[1] },
  { label: 'Microsoft', Icon: FaMicrosoft, mot: MOT[2] },
  { label: 'Meta', Icon: SiMeta, mot: MOT[3] },
  { label: 'Apple', Icon: SiApple, mot: MOT[4] },
  { label: 'LinkedIn', Icon: FaLinkedin, mot: MOT[5] },
  { label: 'Netflix', Icon: SiNetflix, mot: MOT[6] },
  { label: 'Spotify', Icon: SiSpotify, mot: MOT[7] },
  { label: 'Uber', Icon: SiUber, mot: MOT[0] },
  { label: 'Airbnb', Icon: SiAirbnb, mot: MOT[1] },
  { label: 'Discord', Icon: SiDiscord, mot: MOT[2] },
  { label: 'Telegram', Icon: SiTelegram, mot: MOT[3] },
  { label: 'WhatsApp', Icon: SiWhatsapp, mot: MOT[4] },
  { label: 'TikTok', Icon: SiTiktok, mot: MOT[5] },
  { label: 'X', Icon: SiX, mot: MOT[6] },
  { label: 'Instagram', Icon: SiInstagram, mot: MOT[7] },
  { label: 'Snapchat', Icon: SiSnapchat, mot: MOT[0] },
  { label: 'PayPal', Icon: SiPaypal, mot: MOT[1] },
  { label: 'Stripe', Icon: SiStripe, mot: MOT[2] },
  { label: 'Samsung', Icon: SiSamsung, mot: MOT[3] },
  { label: 'GitHub', Icon: SiGithub, mot: MOT[4] },
  { label: 'Cloudflare', Icon: SiCloudflare, mot: MOT[5] },
  { label: 'Okta', Icon: SiOkta, mot: MOT[6] },
  { label: 'Auth0', Icon: SiAuth0, mot: MOT[7] },
  { label: 'Reddit', Icon: SiReddit, mot: MOT[0] },
  { label: 'Pinterest', Icon: SiPinterest, mot: MOT[1] },
  { label: 'Zoom', Icon: SiZoom, mot: MOT[2] },
  { label: 'Twitch', Icon: SiTwitch, mot: MOT[3] },
  { label: 'Proton', Icon: SiProton, mot: MOT[4] },
  { label: '1Password', Icon: Si1Password, mot: MOT[5] },
];
