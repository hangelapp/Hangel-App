import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e85a3a',
          color: 'white',
          fontWeight: 900,
          fontSize: 138,
          lineHeight: 1,
          letterSpacing: -6,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          // iOS apple-touch-icon yuvarlatmayı kendisi uygular, biz düz bırakıyoruz
          paddingBottom: 16,
        }}
      >
        h
      </div>
    ),
    { ...size },
  );
}
