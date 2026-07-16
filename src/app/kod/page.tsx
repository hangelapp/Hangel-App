'use client';

/**
 * /kod — Kod ile etkinlik kaydı.
 *
 * QR okutamayan katılımcı, sunum ekranındaki 6 haneli kodu (plaka+ay+gün) buraya
 * girer → /api/events/by-code eşleşen etkinliğin slug'ını döner → yönlendirilir.
 * Apple estetiği: tek odak (kod alanı), bol boşluk, sistem fontu.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, ArrowRight } from 'lucide-react';
import './kod.css';

const LEN = 6;

export default function KodPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  const code = digits.join('');

  const setAt = (i: number, v: string) => {
    setDigits((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });
  };

  const handleChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '');
    if (!v) { setAt(i, ''); return; }
    // Yapıştırma: birden çok rakam gelirse dağıt.
    if (v.length > 1) {
      const chars = v.slice(0, LEN - i).split('');
      setDigits((prev) => {
        const n = [...prev];
        chars.forEach((c, k) => { if (i + k < LEN) n[i + k] = c; });
        return n;
      });
      const next = Math.min(i + chars.length, LEN - 1);
      inputsRef.current[next]?.focus();
      return;
    }
    setAt(i, v);
    setStatus('idle');
    if (i < LEN - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === 'Enter' && code.length === LEN) submit();
  };

  const submit = async () => {
    if (code.length !== LEN) { setMessage('Lütfen 6 haneli kodu gir.'); setStatus('error'); return; }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/events/by-code?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data?.message || 'Bu koda ait etkinlik bulunamadı.');
        return;
      }
      router.push(`/events/${data.slug}`);
    } catch {
      setStatus('error');
      setMessage('Bağlantı hatası. Tekrar dene.');
    }
  };

  return (
    <div className="kod-stage">
      <div className="kod-card">
        <span className="kod-icon-wrap"><KeyRound strokeWidth={1.6} /></span>
        <div className="kod-head">
          <h1 className="kod-title">Kod ile katıl</h1>
          <p className="kod-sub">Etkinlik ekranındaki 6 haneli kodu gir.</p>
        </div>

        <div className="kod-inputs" role="group" aria-label="Etkinlik kodu">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={i === 0 ? LEN : 1}
              className={`kod-digit ${status === 'error' ? 'kod-digit-error' : ''}`}
              aria-label={`Hane ${i + 1}`}
            />
          ))}
        </div>

        {message ? <p className="kod-message">{message}</p> : null}

        <button
          type="button"
          onClick={submit}
          disabled={status === 'loading' || code.length !== LEN}
          className="kod-submit"
        >
          {status === 'loading' ? <Loader2 className="kod-spin" /> : <>Etkinliğe git <ArrowRight strokeWidth={2} /></>}
        </button>

        <p className="kod-hint">Kod, ilin plaka kodu + ay + gün şeklindedir (örn. İzmir · 16 Temmuz → 350716).</p>
      </div>
      <footer className="kod-footer">hangel<span className="kod-dot">.</span>org</footer>
    </div>
  );
}
