'use client';

/**
 * hangel NGO admin — SROI Etki Panosu (Social Return on Investment).
 *
 * STK yöneticisine kurumunun ürettiği "toplumsal getiri"yi şeffaf ve basit bir
 * formülle gösterir. Salt-okunur bir pano: hiçbir doküman yazmaz.
 *
 * Okunan koleksiyonlar (hepsi where ngoId == STK):
 *   - volunteerCompletions → gönüllü saati (adjustedHours ?? hoursLogged),
 *                            varsa kayıtlı impactValueTRY, benzersiz gönüllü sayısı
 *   - volunteering         → ilan sayısı + sosyal alan / kategori dağılımı
 *   - donations            → onaylı bağışların bu STK'ya düşen net payı (₺)
 *
 * SROI formülü (basit + şeffaf — panoda da açıkça yazılıdır):
 *   gönüllü saati × saatlik sosyal değer (sabit ₺200/saat)  → gönüllülük değeri
 *   + toplam bağış (₺)                                       → bağış değeri
 *   = ÜRETİLEN TOPLUMSAL DEĞER
 *   SROI oranı = üretilen toplumsal değer ÷ bağış (yatırım) — bağış yoksa gösterilmez.
 *
 * Not: volunteerCompletions kaydında snapshot impactValueTRY varsa gönüllülük
 * değeri için o toplam kullanılır (kayıt anındaki gerçek saatlik ücret); yoksa
 * saat × sabit değer ile tahmin edilir. `hangel-impact-inventory.json` nitel bir
 * sosyal-etki envanteri olduğundan saatlik değer içermez → sabit kullanılır.
 *
 * Cerrahi: yalnız yeni `/ngo-admin/sroi` route'unu ekler; paylaşılan hiçbir
 * dosyaya dokunmaz. entityId deseni /ngo-admin/volunteering ile aynı.
 */

import React, { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { TrendingUp, Users, Clock, HeartHandshake, Megaphone, Coins, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

// --- Sabitler ---------------------------------------------------------------

/** Gönüllü emeğinin saatlik sosyal değeri (₺). Şeffaflık için sabit ve panoda
 *  açıkça belirtilir. Kayıtta gerçek impactValueTRY varsa o önceliklidir. */
const HOURLY_SOCIAL_VALUE_TRY = 200;

/** donations.status → bu kuruma "gelmiş" sayılan bağış durumları. */
const PAID_STATUSES = new Set(['Yatırıldı', 'Tamamlandı']);

// --- Yardımcılar ------------------------------------------------------------

function toNum(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

const tryFmt = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

function formatTRY(n: number): string {
  return tryFmt.format(Math.round(n));
}

// --- Firestore doc tipleri (yalnız okunan alanlar) --------------------------

type CompletionDoc = {
  ngoId?: string;
  userId?: string;
  adjustedHours?: number | string;
  hoursLogged?: number | string;
  impactValueTRY?: number | string;
};

type VolunteeringDoc = {
  ngoId?: string;
  socialArea?: string;
  category?: string;
};

type DonationDoc = {
  status?: string;
  donationAmount?: number | string;
  ngoIds?: string[];
  ngo?: unknown[];
  ngoSplit?: Array<{ ngoId?: string; amount?: number | string }>;
};

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
          {value}
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sosyal alan dağılımı (basit bar/liste)
// ---------------------------------------------------------------------------

function AreaBreakdown({ items }: { items: { label: string; count: number }[] }) {
  const max = items.reduce((m, it) => Math.max(m, it.count), 0) || 1;
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium text-foreground">{it.label}</span>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {it.count} ilan
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(6, Math.round((it.count / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pano gövdesi
// ---------------------------------------------------------------------------

function SroiDashboard() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const searchParams = useSearchParams();
  const entityId = searchParams.get('id') || authUser?.uid || null;

  // volunteerCompletions — bu STK'nın onaylı/tüm tamamlama kayıtları
  const completionsQuery = useMemoFirebase(() => {
    if (!db || !entityId) return null;
    return query(collection(db, COLLECTIONS.volunteerCompletions), where('ngoId', '==', entityId));
  }, [db, entityId]);
  const { data: completions, isLoading: loadingCompletions } =
    useCollection<CompletionDoc>(completionsQuery);

  // volunteering — bu STK'nın ilanları
  const listingsQuery = useMemoFirebase(() => {
    if (!db || !entityId) return null;
    return query(collection(db, COLLECTIONS.volunteering), where('ngoId', '==', entityId));
  }, [db, entityId]);
  const { data: listings, isLoading: loadingListings } =
    useCollection<VolunteeringDoc>(listingsQuery);

  // donations — bu STK'ya bağış içeren dokümanlar (array-contains)
  const donationsQuery = useMemoFirebase(() => {
    if (!db || !entityId) return null;
    return query(collection(db, COLLECTIONS.donations), where('ngoIds', 'array-contains', entityId));
  }, [db, entityId]);
  const { data: donations, isLoading: loadingDonations } =
    useCollection<DonationDoc>(donationsQuery);

  const metrics = useMemo(() => {
    // --- Gönüllülük saati + kayıtlı etki değeri + gönüllü sayısı ---
    let totalHours = 0;
    let recordedImpactTRY = 0;
    const volunteers = new Set<string>();
    for (const c of completions ?? []) {
      const hours = c.adjustedHours !== undefined ? toNum(c.adjustedHours) : toNum(c.hoursLogged);
      totalHours += hours;
      recordedImpactTRY += toNum(c.impactValueTRY);
      if (typeof c.userId === 'string' && c.userId) volunteers.add(c.userId);
    }

    // Gönüllülük değeri: kayıtlı snapshot değeri varsa onu kullan (kayıt anındaki
    // gerçek saatlik ücret), yoksa saat × sabit sosyal değer ile tahmin et.
    const usedRecordedImpact = recordedImpactTRY > 0;
    const volunteerValueTRY = usedRecordedImpact
      ? recordedImpactTRY
      : totalHours * HOURLY_SOCIAL_VALUE_TRY;

    // --- Bağış toplamı (bu STK'nın net payı) ---
    let donationTRY = 0;
    for (const d of donations ?? []) {
      if (!PAID_STATUSES.has(typeof d.status === 'string' ? d.status : '')) continue;
      let share = 0;
      const entry = Array.isArray(d.ngoSplit)
        ? d.ngoSplit.find((s) => s.ngoId === entityId)
        : undefined;
      if (entry && entry.amount !== undefined) {
        share = toNum(entry.amount);
      } else {
        const total = toNum(d.donationAmount);
        const divisor =
          (Array.isArray(d.ngo) && d.ngo.length) ||
          (Array.isArray(d.ngoIds) && d.ngoIds.length) ||
          1;
        share = total / divisor;
      }
      if (share > 0) donationTRY += share;
    }

    // --- Sosyal alan / kategori dağılımı ---
    const areaMap = new Map<string, number>();
    for (const l of listings ?? []) {
      const area = (l.socialArea || l.category || 'Diğer').trim() || 'Diğer';
      areaMap.set(area, (areaMap.get(area) ?? 0) + 1);
    }
    const areas = [...areaMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const totalSocialValueTRY = volunteerValueTRY + donationTRY;
    // SROI oranı = üretilen değer ÷ yatırım (bağış). Bağış yoksa tanımsız.
    const sroiRatio = donationTRY > 0 ? totalSocialValueTRY / donationTRY : null;

    return {
      totalHours,
      volunteerCount: volunteers.size,
      listingCount: (listings ?? []).length,
      volunteerValueTRY,
      donationTRY,
      totalSocialValueTRY,
      sroiRatio,
      usedRecordedImpact,
      areas,
    };
  }, [completions, listings, donations, entityId]);

  const isLoading = loadingCompletions || loadingListings || loadingDonations;

  if (!entityId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">
          STK kimliği bulunamadı. Lütfen giriş yapın veya panoya STK bağlantısı üzerinden gelin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      {/* Başlık */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">SROI Etki Panosu</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Sosyal Yatırım Getirisi
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Kurumunuzun gönüllü emeği ve bağışlarından ürettiği toplumsal değerin
          şeffaf, basit bir özeti.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Büyük SROI / üretilen değer rakamı */}
          <Card className="overflow-hidden border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Üretilen Toplumsal Değer
                </p>
                <p className="mt-1 text-4xl font-bold tabular-nums text-primary sm:text-5xl">
                  {formatTRY(metrics.totalSocialValueTRY)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Gönüllülük değeri {formatTRY(metrics.volunteerValueTRY)} + Bağış{' '}
                  {formatTRY(metrics.donationTRY)}
                </p>
              </div>
              {metrics.sroiRatio !== null ? (
                <div className="shrink-0 rounded-xl border border-primary/20 bg-background/60 px-5 py-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    SROI Oranı
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                    {numFmt.format(metrics.sroiRatio)}×
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    her ₺1 bağış için
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Stat tile'ları */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              icon={Clock}
              label="Toplam Gönüllü Saati"
              value={`${numFmt.format(metrics.totalHours)} sa`}
            />
            <StatTile
              icon={Users}
              label="Gönüllü Sayısı"
              value={numFmt.format(metrics.volunteerCount)}
            />
            <StatTile
              icon={Megaphone}
              label="İlan Sayısı"
              value={numFmt.format(metrics.listingCount)}
            />
            <StatTile
              icon={Coins}
              label="Toplam Bağış"
              value={formatTRY(metrics.donationTRY)}
            />
          </div>

          {/* Sosyal alan dağılımı */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartHandshake className="h-5 w-5 text-primary" />
                Sosyal Alan Dağılımı
              </CardTitle>
              <CardDescription>
                İlanlarınızın sosyal alan / kategoriye göre dağılımı.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.areas.length > 0 ? (
                <AreaBreakdown items={metrics.areas} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Henüz sınıflandırılmış ilan bulunmuyor.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Şeffaflık notu — formülün açık anlatımı */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Hesaplama Nasıl Yapılır?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Gönüllülük değeri:</strong>{' '}
                {metrics.usedRecordedImpact ? (
                  <>
                    onaylı tamamlama kayıtlarında saklanan gerçek etki değerleri
                    (kayıt anındaki saatlik ücret) toplamı.
                  </>
                ) : (
                  <>
                    toplam gönüllü saati × saatlik sosyal değer (varsayılan{' '}
                    <strong className="text-foreground">{formatTRY(HOURLY_SOCIAL_VALUE_TRY)}/saat</strong>).
                  </>
                )}
              </p>
              <p>
                <strong className="text-foreground">Toplumsal değer:</strong>{' '}
                gönüllülük değeri + toplam bağış.
              </p>
              <p>
                <strong className="text-foreground">SROI oranı:</strong>{' '}
                üretilen toplumsal değer ÷ bağış (yatırım). Bu, her ₺1 yatırımın
                kaç ₺ toplumsal değere dönüştüğünü gösterir.
              </p>
              <p className="pt-1 text-xs">
                Saatlik sosyal değer şeffaflık için sabittir; kurum bazlı gerçek
                değerler kayıtlarda saklandıkça otomatik olarak onlar kullanılır.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SroiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <SroiDashboard />
    </Suspense>
  );
}
