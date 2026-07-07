'use client';

/**
 * /ngo-admin/call-center/test — bağımsız WebRTC santral test arayüzü.
 *
 * hangel WebRTC geçidine (Asterisk, wss://santral.hangel.org.tr) env'deki
 * SIP endpoint ile kaydolur; numara çevirip kulaklıkla arama/cevaplama testi
 * yapılır. Onboarding/Firestore'a bağlı DEĞİL — ilk uçtan-uca test için.
 *
 * Config eksikse (env yok) nazik uyarı gösterir, panel kırılmaz.
 */

import { useState } from 'react';
import { useSipPhone } from '@/lib/santral/use-sip-phone';
import { useSantralCredentials } from '@/lib/santral/use-credentials';
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from 'lucide-react';

const STATE_LABEL: Record<string, string> = {
  unconfigured: 'Yapılandırılmadı',
  connecting: 'Bağlanıyor…',
  registered: 'Hazır (kayıtlı)',
  calling: 'Aranıyor…',
  incoming: 'Gelen arama',
  'in-call': 'Görüşme aktif',
  ended: 'Görüşme bitti',
  failed: 'Hata',
};

const STATE_TINT: Record<string, string> = {
  registered: 'bg-emerald-100 text-emerald-800',
  'in-call': 'bg-emerald-100 text-emerald-800',
  calling: 'bg-amber-100 text-amber-800',
  incoming: 'bg-amber-100 text-amber-800',
  connecting: 'bg-zinc-100 text-zinc-700',
  ended: 'bg-zinc-100 text-zinc-700',
  failed: 'bg-rose-100 text-rose-800',
  unconfigured: 'bg-rose-100 text-rose-800',
};

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SantralTestPage() {
  const [number, setNumber] = useState('');
  // SIP/TURN credential'ları auth korumalı endpoint'ten gelir (bundle'da YOK).
  const { creds, loading } = useSantralCredentials();
  const sip = useSipPhone({
    wssUrl: creds?.wssUrl || null,
    username: creds?.sipUsername || null,
    password: creds?.sipPassword || null,
    domain: creds?.sipDomain || null,
    iceServers: creds?.iceServers,
  });

  const idle = sip.state === 'registered' || sip.state === 'ended';
  const active = sip.state === 'calling' || sip.state === 'in-call';

  return (
    <div className="mx-auto max-w-md p-5 space-y-5">
      <div>
        <h1 className="text-lg font-bold">santral test arayüzü</h1>
        <p className="text-sm text-muted-foreground">
          hangel WebRTC geçidi · kulaklıkla arama/cevaplama testi
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          Santral yapılandırması yükleniyor…
        </div>
      ) : !sip.ready ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Santral yapılandırması bulunamadı (WSS/SIP env eksik). Deploy + env girilince
          bu sayfa otomatik kaydolur.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                STATE_TINT[sip.state] ?? 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {STATE_LABEL[sip.state] ?? sip.state}
            </span>
            {active && (
              <span className="text-sm tabular-nums text-muted-foreground">
                {fmt(sip.durationSeconds)}
              </span>
            )}
            {sip.remoteIdentity && (
              <span className="text-sm font-medium">{sip.remoteIdentity}</span>
            )}
          </div>

          {sip.error && (
            <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">{sip.error}</p>
          )}

          {/* Numara + ara */}
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="tel"
              placeholder="05XX XXX XX XX"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={!idle}
              className="flex-1 rounded-xl border border-border px-3 py-2.5 text-base outline-none focus:border-[#f34723]"
            />
            <button
              onClick={() => sip.call(number)}
              disabled={!idle || !number.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#f34723] px-4 py-2.5 font-semibold text-white disabled:opacity-40"
            >
              <Phone className="h-4 w-4" /> Ara
            </button>
          </div>

          {/* Gelen arama */}
          {sip.state === 'incoming' && (
            <button
              onClick={() => sip.answer()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white"
            >
              <PhoneIncoming className="h-5 w-5" /> Cevapla
            </button>
          )}

          {/* Aktif çağrı kontrolleri */}
          {(active || sip.state === 'incoming') && (
            <div className="flex gap-2">
              <button
                onClick={() => sip.mute()}
                disabled={sip.state !== 'in-call'}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-3 font-medium disabled:opacity-40"
              >
                {sip.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {sip.muted ? 'Sesi aç' : 'Sustur'}
              </button>
              <button
                onClick={() => sip.hangup()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-3 font-semibold text-white"
              >
                <PhoneOff className="h-4 w-4" /> Kapat
              </button>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Kulaklığını tak, mikrofon iznini ver. Önce iç hat / kendi cebini ara, sesi test et.
          </p>
        </>
      )}

      {/* Remote ses */}
      <audio ref={sip.remoteAudioRef} autoPlay />
    </div>
  );
}
