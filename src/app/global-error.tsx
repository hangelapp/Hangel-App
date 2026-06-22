'use client';

import { useEffect } from 'react';

/**
 * Kök global hata sınırı. Root layout dahi çökse bu devreye girer; bu yüzden
 * kendi <html><body> sarmalayıcısını render etmek ZORUNDADIR (Next.js gereği).
 * Tema değişkenleri / fontlar yüklenmemiş olabileceğinden coral marka rengi
 * (#f34723) inline verilir.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[hangel:global-error-boundary]', error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '9999px',
            backgroundColor: 'rgba(243, 71, 35, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            fontSize: 30,
          }}
          aria-hidden="true"
        >
          🧡
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          Bir şeyler ters gitti — ama yalnız değilsin.
        </h1>
        <p
          style={{
            marginTop: 8,
            maxWidth: 420,
            fontSize: 14,
            lineHeight: 1.5,
            color: '#6b7280',
          }}
        >
          Beklenmedik bir hata oluştu. Sayfayı yeniden yükleyelim; umudu büyütmeye
          birlikte devam edelim.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 24,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
            backgroundColor: '#f34723',
            color: '#fafafa',
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Tekrar dene
        </button>
      </body>
    </html>
  );
}
