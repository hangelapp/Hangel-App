'use client';

import React from 'react';

/**
 * Honeypot — bot/robot form doldurmalarına karşı maliyetsiz koruma.
 *
 * Gözle görünmez bir alan render eder. GERÇEK kullanıcı bunu görmez ve
 * doldurmaz; otomatik botlar sayfadaki tüm input'ları doldurduğu için bu alanı
 * da doldurur. Gönderimde `isBotSubmission(value)` true dönerse istek sessizce
 * reddedilir (bota "başarılı" hissi verilir, gerçek işlem yapılmaz).
 *
 * Erişilebilirlik: aria-hidden + tabindex=-1 → ekran okuyucu ve klavye atlar.
 * Görünürlük: sadece opacity/pointer-events değil; ekran dışına da taşınır
 * (bazı botlar görünürlüğü kontrol eder, konumu değil).
 *
 * Kullanım:
 *   const [hp, setHp] = useState('');
 *   <Honeypot value={hp} onChange={setHp} />
 *   // submit'te: if (isBotSubmission(hp)) return; // sessiz reddet
 */
export function Honeypot({ value, onChange, name = 'company_website' }: {
  value: string;
  onChange: (v: string) => void;
  /** Botları cezbeden makul bir alan adı (email/website/phone gibi). */
  name?: string;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <label htmlFor={`hp-${name}`}>Bu alanı boş bırakın</label>
      <input
        id={`hp-${name}`}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Honeypot dolu geldiyse (bot) true. */
export function isBotSubmission(honeypotValue: string | undefined | null): boolean {
  return !!(honeypotValue && honeypotValue.trim().length > 0);
}
