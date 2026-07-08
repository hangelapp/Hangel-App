'use client';

/**
 * /c/[code] — herkese açık (giriş gerektirmeyen) hangel sertifika doğrulama sayfası.
 * Kısa link: https://hangel.org/c/{KOD}  (tiresiz, ör. H9022610076)
 *
 * Üç durum:
 *   • Geçerli + kayıtlı → yeşil onay + sahibi/etkinlik/STK/faaliyet/tarih (DB'den).
 *   • Biçim/Luhn geçerli ama kayıt yok → nötr "kod biçimi geçerli, kayıt bulunamadı".
 *   • Geçersiz (Luhn tutmaz) → kırmızı uyarı.
 * Oturuma/app-shell'e bağımlı DEĞİLDİR.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

type Kind = 'event' | 'volunteer' | 'blood' | 'ngo' | 'brand' | 'club';

interface VerifyResponse {
  valid: boolean;
  found?: boolean;
  kind?: Kind;
  country?: string;
  countryName?: string;
  year?: number;
  activityNo?: number;
  personNo?: number;
  holderName?: string;
  subject?: string;
  organization?: string;
  issuedAt?: string;
  eventDate?: string; // etkinliğin gerçekleşme tarihi (issuedAt = sertifika düzenlenme)
}

const CORAL = '#f34723';
const CORAL_DARK = '#c5391b';
const INK = '#1f1f1f';

function kindLabel(kind?: Kind): string {
  switch (kind) {
    case 'volunteer': return 'Gönüllülük Sertifikası';
    case 'blood': return 'Kan Bağışı Sertifikası';
    case 'ngo': return 'STK Sertifikası';
    case 'brand': return 'Marka Sertifikası';
    case 'club': return 'Öğrenci Kulübü Sertifikası';
    default: return 'Etkinlik Katılım Sertifikası';
  }
}
function subjectLabel(kind?: Kind): string {
  switch (kind) {
    case 'volunteer': return 'Görev';
    case 'blood': return 'Çağrı';
    case 'ngo': case 'brand': case 'club': return 'Kurum';
    default: return 'Etkinlik';
  }
}

function formatTrDate(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CertificateVerifyPage() {
  const params = useParams();
  const code = (params?.code as string) ?? '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!code) { setLoading(false); setFailed(true); return; }
      try {
        const res = await fetch(`/api/certificate/verify?code=${encodeURIComponent(code)}`);
        const json = (await res.json()) as VerifyResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [code]);

  const isValid = !!data?.valid;
  const found = !!data?.found;
  const displayDate = formatTrDate(data?.issuedAt) || (data?.year ? String(data.year) : null);
  const activityLine = data?.year && data?.activityNo ? `${data.year} · ${data.activityNo}. faaliyet` : null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f5f7] px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-sm font-medium uppercase tracking-wide" style={{ color: CORAL }}>
          Sertifika Doğrulama
        </h1>

        <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm sm:p-10">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Loader2 className="h-9 w-9 animate-spin" style={{ color: CORAL }} />
              <p className="text-sm" style={{ color: INK }}>Doğrulanıyor…</p>
            </div>
          ) : isValid && found ? (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(243, 71, 35, 0.10)' }}>
                <CheckCircle2 className="h-10 w-10" style={{ color: CORAL }} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold" style={{ color: INK }}>Doğrulandı</h2>
                <p className="text-sm text-gray-500">Geçerli hangel sertifikası</p>
              </div>
              <p className="rounded-full px-4 py-1.5 text-sm font-medium" style={{ backgroundColor: 'rgba(243, 71, 35, 0.08)', color: CORAL_DARK }}>
                {kindLabel(data?.kind)}
              </p>

              {/* Teyit özeti — bir bakışta doğrula: kim, hangi etkinlik/konu, ne zaman. */}
              {(data?.holderName || data?.subject) && (
                <div className="w-full rounded-2xl border border-black/5 bg-[#f5f5f7] px-4 py-3 text-left">
                  {data?.holderName ? (
                    <p className="text-base font-bold leading-snug break-words" style={{ color: INK }}>{data.holderName}</p>
                  ) : null}
                  {data?.subject ? (
                    <p className="mt-0.5 text-sm leading-snug break-words" style={{ color: INK }}>
                      {subjectLabel(data?.kind)}: <span className="font-semibold">{data.subject}</span>
                    </p>
                  ) : null}
                  {(data?.eventDate || displayDate) ? (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {data?.eventDate ? `Etkinlik tarihi: ${formatTrDate(data.eventDate) || data.eventDate}` : `Tarih: ${displayDate}`}
                    </p>
                  ) : null}
                </div>
              )}

              <dl className="mt-2 w-full divide-y divide-black/5 text-left">
                {data?.holderName ? (
                  <div className="py-3"><dt className="text-xs uppercase tracking-wide text-gray-400">Sahibi</dt>
                    <dd className="mt-0.5 text-base font-semibold" style={{ color: INK }}>{data.holderName}</dd></div>
                ) : null}
                {data?.subject ? (
                  <div className="py-3"><dt className="text-xs uppercase tracking-wide text-gray-400">{subjectLabel(data?.kind)}</dt>
                    <dd className="mt-0.5 text-base" style={{ color: INK }}>{data.subject}</dd></div>
                ) : null}
                {data?.organization ? (
                  <div className="py-3"><dt className="text-xs uppercase tracking-wide text-gray-400">Düzenleyen</dt>
                    <dd className="mt-0.5 text-base" style={{ color: INK }}>{data.organization}</dd></div>
                ) : null}
                {data?.countryName ? (
                  <div className="py-3"><dt className="text-xs uppercase tracking-wide text-gray-400">Ülke</dt>
                    <dd className="mt-0.5 text-base" style={{ color: INK }}>{data.countryName}</dd></div>
                ) : null}
                {activityLine ? (
                  <div className="py-3"><dt className="text-xs uppercase tracking-wide text-gray-400">Faaliyet</dt>
                    <dd className="mt-0.5 text-base" style={{ color: INK }}>{activityLine}{data?.personNo ? ` · ${data.personNo}. kişi` : ''}</dd></div>
                ) : null}
                {displayDate ? (
                  <div className="py-3"><dt className="text-xs uppercase tracking-wide text-gray-400">Tarih</dt>
                    <dd className="mt-0.5 text-base" style={{ color: INK }}>{displayDate}</dd></div>
                ) : null}
              </dl>

              <span className="mt-1 inline-block rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm tracking-wider" style={{ color: INK }}>
                {code.toUpperCase()}
              </span>
            </div>
          ) : isValid && !found ? (
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <AlertCircle className="h-10 w-10 text-amber-500" strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold" style={{ color: INK }}>Kod biçimi geçerli</h2>
                <p className="text-sm text-gray-500">Bu kod doğru biçimde, ancak sistemde kaydı bulunamadı.</p>
              </div>
              <span className="inline-block rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm tracking-wider" style={{ color: INK }}>
                {code.toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-10 w-10 text-red-500" strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold" style={{ color: INK }}>Geçersiz kod</h2>
                <p className="text-sm text-gray-500">
                  {failed ? 'Doğrulama yapılamadı. Lütfen daha sonra tekrar deneyin.' : 'Bu kod geçerli bir hangel sertifikası değil. Lütfen kodu kontrol edin.'}
                </p>
              </div>
              <span className="inline-block rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm tracking-wider" style={{ color: INK }}>
                {code.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-512.png" alt="hangel" width={28} height={28} className="rounded-md" />
          <span className="text-sm font-semibold" style={{ color: CORAL }}>hangel.org</span>
        </div>
      </div>
    </div>
  );
}
