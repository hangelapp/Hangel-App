'use client';

/**
 * AdStats — bir reklam banner'ı için "Detaylı istatistik" bloğu.
 *
 * `marketAdBanners/{bannerId}/daily/{YYYY-MM-DD}` alt-koleksiyonunu okuyup
 * (click/impression route'ları burayı besler) son 14 günün tıklama + gösterim
 * dağılımını salt div'lerle bar grafik olarak çizer. Ek olarak toplam gösterim,
 * genel CTR ve TAHMİNİ gelir (tık × sabit CPC) gösterir.
 *
 * Grafik kütüphanesi yok — yükseklikler değere orantılı basit div'ler.
 */

import React from 'react';
import { collection } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

/** Tahmini tık başına gelir (TRY). Gerçek reklam sözleşmesi değil — yaklaşık gösterge. */
export const EST_CPC_TRY = 2.5;

/** daily alt-koleksiyon doküman şekli — id = YYYY-MM-DD. */
interface DailyStat {
  id: string;
  clicks?: number;
  impressions?: number;
}

/** Son N günün YYYY-MM-DD anahtarları (bugünden geriye, kronolojik sırada). */
function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** YYYY-MM-DD → "12 Tem" gibi kısa TR etiketi. */
function shortLabel(day: string): string {
  const d = new Date(day + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return day.slice(5);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function AdStats({
  bannerId,
  clickCount,
  impressionCount,
}: {
  bannerId: string;
  clickCount: number;
  impressionCount: number;
}) {
  const db = useFirestore();

  const dailyQuery = useMemoFirebase(
    () => (db ? collection(db, COLLECTIONS.marketAdBanners, bannerId, 'daily') : null),
    [db, bannerId],
  );
  const { data: daily, isLoading } = useCollection<DailyStat>(dailyQuery);

  const byDay = new Map<string, DailyStat>();
  for (const d of daily || []) byDay.set(d.id, d);

  const days = lastDays(14);
  const rows = days.map((day) => {
    const rec = byDay.get(day);
    const clicks = rec?.clicks ?? 0;
    const impressions = rec?.impressions ?? 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
    return { day, clicks, impressions, ctr };
  });

  const maxImpr = Math.max(1, ...rows.map((r) => r.impressions));
  const maxClicks = Math.max(1, ...rows.map((r) => r.clicks));

  const overallCtr = impressionCount > 0 ? (clickCount / impressionCount) * 100 : null;
  const estRevenue = clickCount * EST_CPC_TRY;

  return (
    <div className="mt-3 space-y-4 rounded-lg border bg-muted/30 p-3">
      {/* Özet metrikler */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border bg-background p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Toplam Gösterim</p>
          <p className="text-lg font-semibold">{impressionCount.toLocaleString('tr-TR')}</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Toplam Tıklama</p>
          <p className="text-lg font-semibold">{clickCount.toLocaleString('tr-TR')}</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Genel CTR</p>
          <p className="text-lg font-semibold">{overallCtr !== null ? `%${overallCtr.toFixed(1)}` : '—'}</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tahmini Gelir</p>
          <p className="text-lg font-semibold">
            ₺{estRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground">
            tahmini ≈ {clickCount.toLocaleString('tr-TR')} tık × ₺{EST_CPC_TRY}
          </p>
        </div>
      </div>

      {/* Son 14 gün bar grafik */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Son 14 gün</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-sky-500" /> Gösterim
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-rose-500" /> Tıklama
            </span>
          </div>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">İstatistikler yükleniyor…</p>
        ) : (
          <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ minHeight: 96 }}>
            {rows.map((r) => (
              <div key={r.day} className="flex min-w-[22px] flex-1 flex-col items-center gap-1">
                <div className="flex h-20 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 rounded-t-sm bg-sky-500"
                    style={{ height: `${(r.impressions / maxImpr) * 100}%` }}
                    title={`${shortLabel(r.day)} — ${r.impressions} gösterim`}
                  />
                  <div
                    className="w-1/2 rounded-t-sm bg-rose-500"
                    style={{ height: `${(r.clicks / maxClicks) * 100}%` }}
                    title={`${shortLabel(r.day)} — ${r.clicks} tıklama${r.ctr !== null ? ` (CTR %${r.ctr.toFixed(1)})` : ''}`}
                  />
                </div>
                <span className="text-[9px] leading-none text-muted-foreground">{shortLabel(r.day)}</span>
                <span className="text-[9px] leading-none text-muted-foreground">
                  {r.ctr !== null ? `%${r.ctr.toFixed(0)}` : '·'}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">
          Alt satır: o günün CTR&apos;ı. Barlar kendi maksimumuna göre ölçeklenir.
        </p>
      </div>
    </div>
  );
}

export default AdStats;
