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
  brandColor: string;
  tileBorder: string;
  tileGlow: string;
  iconBg: string;
  iconBorder: string;
  labelColor: string;
};

/** Representative platforms for SMS/OTP ecosystems; icons via react-icons (Simple Icons + FA). */
export const TRUSTED_PLATFORMS: TrustedPlatformItem[] = [
  { label: 'Google', Icon: SiGoogle, mot: MOT[0], brandColor: '#4285F4', tileBorder: 'rgba(66,133,244,0.45)', tileGlow: 'rgba(66,133,244,0.24)', iconBg: 'rgba(66,133,244,0.12)', iconBorder: 'rgba(66,133,244,0.34)', labelColor: '#9CC1FF' },
  { label: 'Amazon', Icon: FaAmazon, mot: MOT[1], brandColor: '#FF9900', tileBorder: 'rgba(255,153,0,0.42)', tileGlow: 'rgba(255,153,0,0.2)', iconBg: 'rgba(255,153,0,0.12)', iconBorder: 'rgba(255,153,0,0.34)', labelColor: '#FFC86A' },
  { label: 'Microsoft', Icon: FaMicrosoft, mot: MOT[2], brandColor: '#00A4EF', tileBorder: 'rgba(0,164,239,0.42)', tileGlow: 'rgba(0,164,239,0.22)', iconBg: 'rgba(0,164,239,0.12)', iconBorder: 'rgba(0,164,239,0.34)', labelColor: '#84D8FF' },
  { label: 'Meta', Icon: SiMeta, mot: MOT[3], brandColor: '#0866FF', tileBorder: 'rgba(8,102,255,0.42)', tileGlow: 'rgba(8,102,255,0.22)', iconBg: 'rgba(8,102,255,0.12)', iconBorder: 'rgba(8,102,255,0.34)', labelColor: '#8DB7FF' },
  { label: 'Apple', Icon: SiApple, mot: MOT[4], brandColor: '#E5E7EB', tileBorder: 'rgba(229,231,235,0.28)', tileGlow: 'rgba(229,231,235,0.14)', iconBg: 'rgba(229,231,235,0.08)', iconBorder: 'rgba(229,231,235,0.22)', labelColor: '#E5E7EB' },
  { label: 'LinkedIn', Icon: FaLinkedin, mot: MOT[5], brandColor: '#0A66C2', tileBorder: 'rgba(10,102,194,0.42)', tileGlow: 'rgba(10,102,194,0.22)', iconBg: 'rgba(10,102,194,0.12)', iconBorder: 'rgba(10,102,194,0.34)', labelColor: '#8BC4FF' },
  { label: 'Netflix', Icon: SiNetflix, mot: MOT[6], brandColor: '#E50914', tileBorder: 'rgba(229,9,20,0.42)', tileGlow: 'rgba(229,9,20,0.22)', iconBg: 'rgba(229,9,20,0.12)', iconBorder: 'rgba(229,9,20,0.34)', labelColor: '#FF8A92' },
  { label: 'Spotify', Icon: SiSpotify, mot: MOT[7], brandColor: '#1ED760', tileBorder: 'rgba(30,215,96,0.42)', tileGlow: 'rgba(30,215,96,0.22)', iconBg: 'rgba(30,215,96,0.12)', iconBorder: 'rgba(30,215,96,0.34)', labelColor: '#7FFFB0' },
  { label: 'Uber', Icon: SiUber, mot: MOT[0], brandColor: '#FFFFFF', tileBorder: 'rgba(255,255,255,0.2)', tileGlow: 'rgba(255,255,255,0.12)', iconBg: 'rgba(255,255,255,0.06)', iconBorder: 'rgba(255,255,255,0.16)', labelColor: '#F3F4F6' },
  { label: 'Airbnb', Icon: SiAirbnb, mot: MOT[1], brandColor: '#FF385C', tileBorder: 'rgba(255,56,92,0.42)', tileGlow: 'rgba(255,56,92,0.22)', iconBg: 'rgba(255,56,92,0.12)', iconBorder: 'rgba(255,56,92,0.34)', labelColor: '#FF98AB' },
  { label: 'Discord', Icon: SiDiscord, mot: MOT[2], brandColor: '#5865F2', tileBorder: 'rgba(88,101,242,0.42)', tileGlow: 'rgba(88,101,242,0.22)', iconBg: 'rgba(88,101,242,0.12)', iconBorder: 'rgba(88,101,242,0.34)', labelColor: '#ABB2FF' },
  { label: 'Telegram', Icon: SiTelegram, mot: MOT[3], brandColor: '#26A5E4', tileBorder: 'rgba(38,165,228,0.42)', tileGlow: 'rgba(38,165,228,0.2)', iconBg: 'rgba(38,165,228,0.12)', iconBorder: 'rgba(38,165,228,0.34)', labelColor: '#8DDBFF' },
  { label: 'WhatsApp', Icon: SiWhatsapp, mot: MOT[4], brandColor: '#25D366', tileBorder: 'rgba(37,211,102,0.42)', tileGlow: 'rgba(37,211,102,0.22)', iconBg: 'rgba(37,211,102,0.12)', iconBorder: 'rgba(37,211,102,0.34)', labelColor: '#88F5B2' },
  { label: 'TikTok', Icon: SiTiktok, mot: MOT[5], brandColor: '#FE2C55', tileBorder: 'rgba(254,44,85,0.42)', tileGlow: 'rgba(254,44,85,0.2)', iconBg: 'rgba(37,244,238,0.12)', iconBorder: 'rgba(254,44,85,0.34)', labelColor: '#FF97AA' },
  { label: 'X', Icon: SiX, mot: MOT[6], brandColor: '#F5F5F5', tileBorder: 'rgba(245,245,245,0.22)', tileGlow: 'rgba(245,245,245,0.14)', iconBg: 'rgba(255,255,255,0.06)', iconBorder: 'rgba(255,255,255,0.18)', labelColor: '#F5F5F5' },
  { label: 'Instagram', Icon: SiInstagram, mot: MOT[7], brandColor: '#E4405F', tileBorder: 'rgba(228,64,95,0.42)', tileGlow: 'rgba(228,64,95,0.2)', iconBg: 'rgba(228,64,95,0.12)', iconBorder: 'rgba(228,64,95,0.34)', labelColor: '#FF9CAD' },
  { label: 'Snapchat', Icon: SiSnapchat, mot: MOT[0], brandColor: '#FFFC00', tileBorder: 'rgba(255,252,0,0.42)', tileGlow: 'rgba(255,252,0,0.18)', iconBg: 'rgba(255,252,0,0.14)', iconBorder: 'rgba(255,252,0,0.36)', labelColor: '#FFFCA4' },
  { label: 'PayPal', Icon: SiPaypal, mot: MOT[1], brandColor: '#003087', tileBorder: 'rgba(0,48,135,0.42)', tileGlow: 'rgba(0,48,135,0.24)', iconBg: 'rgba(0,156,222,0.12)', iconBorder: 'rgba(0,48,135,0.34)', labelColor: '#8DD7FF' },
  { label: 'Stripe', Icon: SiStripe, mot: MOT[2], brandColor: '#635BFF', tileBorder: 'rgba(99,91,255,0.42)', tileGlow: 'rgba(99,91,255,0.22)', iconBg: 'rgba(99,91,255,0.12)', iconBorder: 'rgba(99,91,255,0.34)', labelColor: '#BBB6FF' },
  { label: 'Samsung', Icon: SiSamsung, mot: MOT[3], brandColor: '#1428A0', tileBorder: 'rgba(20,40,160,0.42)', tileGlow: 'rgba(20,40,160,0.22)', iconBg: 'rgba(20,40,160,0.12)', iconBorder: 'rgba(20,40,160,0.34)', labelColor: '#8EA4FF' },
  { label: 'GitHub', Icon: SiGithub, mot: MOT[4], brandColor: '#F5F5F5', tileBorder: 'rgba(245,245,245,0.22)', tileGlow: 'rgba(245,245,245,0.12)', iconBg: 'rgba(255,255,255,0.06)', iconBorder: 'rgba(255,255,255,0.16)', labelColor: '#F5F5F5' },
  { label: 'Cloudflare', Icon: SiCloudflare, mot: MOT[5], brandColor: '#F38020', tileBorder: 'rgba(243,128,32,0.42)', tileGlow: 'rgba(243,128,32,0.2)', iconBg: 'rgba(243,128,32,0.12)', iconBorder: 'rgba(243,128,32,0.34)', labelColor: '#FFC48B' },
  { label: 'Okta', Icon: SiOkta, mot: MOT[6], brandColor: '#007DC1', tileBorder: 'rgba(0,125,193,0.42)', tileGlow: 'rgba(0,125,193,0.22)', iconBg: 'rgba(0,125,193,0.12)', iconBorder: 'rgba(0,125,193,0.34)', labelColor: '#8FD5FF' },
  { label: 'Auth0', Icon: SiAuth0, mot: MOT[7], brandColor: '#EB5424', tileBorder: 'rgba(235,84,36,0.42)', tileGlow: 'rgba(235,84,36,0.22)', iconBg: 'rgba(235,84,36,0.12)', iconBorder: 'rgba(235,84,36,0.34)', labelColor: '#FFB09A' },
  { label: 'Reddit', Icon: SiReddit, mot: MOT[0], brandColor: '#FF4500', tileBorder: 'rgba(255,69,0,0.42)', tileGlow: 'rgba(255,69,0,0.22)', iconBg: 'rgba(255,69,0,0.12)', iconBorder: 'rgba(255,69,0,0.34)', labelColor: '#FFB28F' },
  { label: 'Pinterest', Icon: SiPinterest, mot: MOT[1], brandColor: '#BD081C', tileBorder: 'rgba(189,8,28,0.42)', tileGlow: 'rgba(189,8,28,0.22)', iconBg: 'rgba(189,8,28,0.12)', iconBorder: 'rgba(189,8,28,0.34)', labelColor: '#FF9BA6' },
  { label: 'Zoom', Icon: SiZoom, mot: MOT[2], brandColor: '#0B5CFF', tileBorder: 'rgba(11,92,255,0.42)', tileGlow: 'rgba(11,92,255,0.22)', iconBg: 'rgba(11,92,255,0.12)', iconBorder: 'rgba(11,92,255,0.34)', labelColor: '#9ABBFF' },
  { label: 'Twitch', Icon: SiTwitch, mot: MOT[3], brandColor: '#9146FF', tileBorder: 'rgba(145,70,255,0.42)', tileGlow: 'rgba(145,70,255,0.22)', iconBg: 'rgba(145,70,255,0.12)', iconBorder: 'rgba(145,70,255,0.34)', labelColor: '#CDAEFF' },
  { label: 'Proton', Icon: SiProton, mot: MOT[4], brandColor: '#8B5CF6', tileBorder: 'rgba(139,92,246,0.42)', tileGlow: 'rgba(139,92,246,0.22)', iconBg: 'rgba(139,92,246,0.12)', iconBorder: 'rgba(139,92,246,0.34)', labelColor: '#D6C2FF' },
  { label: '1Password', Icon: Si1Password, mot: MOT[5], brandColor: '#3B66BC', tileBorder: 'rgba(59,102,188,0.42)', tileGlow: 'rgba(59,102,188,0.22)', iconBg: 'rgba(59,102,188,0.12)', iconBorder: 'rgba(59,102,188,0.34)', labelColor: '#A9C4FF' },
];
