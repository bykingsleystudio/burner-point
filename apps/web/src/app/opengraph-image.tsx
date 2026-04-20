import { ImageResponse } from 'next/og';
import { siteTagline } from '@/lib/seo';

export const alt = 'Burner Point - Stay Anonymous. Stay Connected. Private By Design.';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'stretch',
          background: '#000000',
          color: '#ffffff',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          padding: 48,
          width: '100%',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #013220 0%, #000000 56%, #00170f 100%)',
            border: '1px solid rgba(0,255,157,0.35)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            padding: 56,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ color: '#00FF9D', fontSize: 28, fontWeight: 700, letterSpacing: 0 }}>
              BURNER POINT
            </div>
            <div style={{ border: '1px solid rgba(0,255,157,0.45)', borderRadius: 8, color: '#00FF9D', fontSize: 22, padding: '12px 18px' }}>
              PRIVATE ACCESS
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 950 }}>
            <div style={{ color: '#9FA6B2', fontSize: 30, fontWeight: 600 }}>
              {siteTagline}
            </div>
            <div style={{ fontSize: 86, fontWeight: 900, lineHeight: 0.95, marginTop: 24 }}>
              Private telecom access without personal-number exposure.
            </div>
          </div>

          <div style={{ color: '#E5E7EB', display: 'flex', fontSize: 26, gap: 32 }}>
            <span>SMS / OTP</span>
            <span>Rentals</span>
            <span>eSIM</span>
            <span>Proxies</span>
            <span>VPN Protection</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
