'use client';

/**
 * /c — hangel sertifika doğrulama GİRİŞİ (kod olmadan gelenler için).
 * Kod girilince /c/{KOD} doğrulama sayfasına yönlendirir. QR okutanlar zaten
 * doğrudan /c/{KOD}'a gider; bu sayfa kodu elle doğrulamak isteyenler içindir.
 * Eskiden /c sayfası yoktu → 404/hata veriyordu; bu landing onu giderir.
 * Oturuma/app-shell'e bağımlı DEĞİLDİR.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, Loader2 } from 'lucide-react';

const CORAL = '#f34723';
const INK = '#1f1f1f';

function normalize(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export default function CertVerifyLandingPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const valid = normalize(code).length >= 6;
  const go = () => {
    if (!valid) return;
    setSubmitting(true);
    router.push(`/c/${normalize(code)}`);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        color: INK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: `${CORAL}1a`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <ShieldCheck size={28} color={CORAL} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Sertifika Doğrulama</h1>
        <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 8, lineHeight: 1.5 }}>
          hangel sertifika kodunu gir, doğrulayalım. Kod sertifikanın altında yazar (ör.{' '}
          <strong>H9022610076</strong>).
        </p>

        <div style={{ marginTop: 24 }}>
          <label
            htmlFor="cert-code"
            style={{ fontSize: 12, fontWeight: 700, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            Sertifika Kodu
          </label>
          <input
            id="cert-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') go();
            }}
            placeholder="H9022610076"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '14px 16px',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.05em',
              borderRadius: 14,
              border: '1.5px solid rgba(0,0,0,0.12)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={go}
            disabled={submitting || !valid}
            style={{
              width: '100%',
              marginTop: 14,
              padding: '14px 16px',
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
              background: CORAL,
              border: 'none',
              borderRadius: 14,
              cursor: submitting || !valid ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: submitting || !valid ? 0.5 : 1,
            }}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} Doğrula
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#9b9b9b', marginTop: 20, textAlign: 'center', lineHeight: 1.5 }}>
          QR okuttuysan bu sayfayı görmezsin — kod otomatik gelir. umudu büyütüyoruz 🧡
        </p>
      </div>
    </main>
  );
}
