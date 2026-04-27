import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f34723',
          color: 'white',
          fontWeight: 900,
          fontSize: 48,
          letterSpacing: -2,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderRadius: '14px',
        }}
      >
        h
      </div>
    ),
    { ...size },
  );
}
