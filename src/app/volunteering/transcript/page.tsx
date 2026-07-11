'use client';

/**
 * /volunteering/transcript — "Sosyal Etki Transkripti".
 *
 * Kullanıcının ONAYLI gönüllülük tamamlamalarından resmî, yazdırılabilir bir
 * transkript üretir: toplam saat, SDG karnesi (hangi amaca kaç saat), beceri
 * listesi ve her başarı satırı. Her satırdan "Doğrula" → /verify/<credId>,
 * ayrıca "LinkedIn'e ekle" ve "PDF/Yazdır" aksiyonları.
 *
 * YENİ, bağımsız sayfa. Paylaşılan dosyalara (types.ts, volunteering/page.tsx,
 * volunteering/[id]/page.tsx, passport/*, ngo-admin/*, nav/app-shell/layout)
 * DOKUNMAZ. Tipler src/lib/credentials/transcript.ts'te yerel tanımlı. Nav
 * bağlantısını proje sahibi ekleyecek (rapora bakınız).
 *
 * Veri kaynağı:
 *  - volunteerCompletions (where userId == uid) → onaylı tamamlamalar.
 *  - volunteering (ilanlar) → taskId ile join: başlık + socialArea + skills.
 *  - users/{uid} → transkript sahibinin adı.
 *
 * Mobil-öncelikli, `--sat` safe-area'ya saygılı, Apple-temiz, Türkçe.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, doc, query, where } from 'firebase/firestore';
import {
  Award,
  ShieldCheck,
  Clock,
  Sparkles,
  Printer,
  Linkedin,
  Target,
  ScrollText,
  Loader2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COLLECTIONS } from '@/firebase/collections';
import {
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import {
  buildTranscript,
  type CompletionInput,
  type TranscriptSummary,
} from '@/lib/credentials/transcript';

// ---------------------------------------------------------------------------
// Yerel (gevşek) shape'ler — types.ts'e DOKUNMADAN.
// ---------------------------------------------------------------------------

type MyUserDoc = {
  id: string;
  name?: string;
};

type CompletionRecord = {
  id: string;
  userId?: string;
  taskId?: string;
  ngoId?: string;
  hoursLogged?: number;
  adjustedHours?: number;
  impactValueTRY?: number;
  professionLabel?: string;
  ngoApproved?: boolean;
  socialArea?: string; // bazı kayıtlarda snapshot'lanmış olabilir
  skills?: string[];
  completedAt?: { seconds: number; nanoseconds: number } | null;
  approvedAt?: { seconds: number; nanoseconds: number } | null;
};

type ListingDoc = {
  id: string;
  title?: string;
  socialArea?: string;
  skills?: string[];
};

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

function fmtHours(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function fmtTRY(v: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(v);
}

/**
 * LinkedIn "Add to Profile" derin bağlantısı. Sertifikasyon adı + veren kurum
 * ön-doldurulur; canlıda credential doğrulama URL'i de eklenir.
 */
function linkedInAddUrl(opts: {
  name: string;
  issueDate?: string; // ISO
  certUrl?: string;
  certId?: string;
}): string {
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: opts.name,
    organizationName: 'hangel',
  });
  if (opts.issueDate) {
    const d = new Date(opts.issueDate);
    if (!Number.isNaN(d.getTime())) {
      params.set('issueYear', String(d.getFullYear()));
      params.set('issueMonth', String(d.getMonth() + 1));
    }
  }
  if (opts.certUrl) params.set('certUrl', opts.certUrl);
  if (opts.certId) params.set('certId', opts.certId);
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Alt bileşenler
// ---------------------------------------------------------------------------

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Award;
  value: string;
  label: string;
}) {
  return (
    <Card variant="solid" className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function SdgCard({
  no,
  label,
  color,
  hours,
  count,
}: {
  no: number;
  label: string;
  color: string;
  hours: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-2.5">
      {/* SDG numara rozeti — resmî SDG rengi */}
      <span
        className="inline-flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        <span className="text-[9px] font-semibold leading-none opacity-90">SDG</span>
        <span className="text-lg font-bold leading-none">{no}</span>
      </span>
      <div className="min-w-0 flex-grow">
        <p className="truncate text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          {fmtHours(hours)} saat · {count} görev
        </p>
      </div>
    </div>
  );
}

function AchievementRow({
  credName,
  hours,
  sdgs,
  credId,
  linkedInHref,
}: {
  credName: string;
  hours: number;
  sdgs: number[];
  credId: string;
  linkedInHref: string;
}) {
  return (
    <Card variant="solid" className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Award className="h-4.5 w-4.5 text-primary" aria-hidden />
          </span>
          <div className="min-w-0 flex-grow">
            <p className="text-sm font-semibold text-foreground">{credName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden />
                {fmtHours(hours)} saat
              </span>
              {sdgs.map((n) => (
                <Badge key={n} variant="glass" className="px-1.5 py-0 text-[10px]">
                  SDG {n}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Aksiyonlar — yazdırırken gizlenir (print:hidden) */}
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button asChild size="sm" variant="outline">
            <Link href={`/verify/${encodeURIComponent(credId)}`}>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Doğrula
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href={linkedInHref} target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-4 w-4" aria-hidden />
              LinkedIn'e ekle
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Award;
  title: string;
  desc: string;
}) {
  return (
    <Card variant="solid" className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10">
          <Icon className="h-7 w-7 text-primary" aria-hidden />
        </span>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sayfa
// ---------------------------------------------------------------------------

export default function SocialImpactTranscriptPage() {
  const db = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // --- Kullanıcı doc'u: transkript sahibinin adı ---
  const myDocRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: myDoc } = useDoc<MyUserDoc>(myDocRef);

  // --- Onaylı tamamlamalar ---
  const completionsQuery = useMemoFirebase(
    () =>
      db && authUser?.uid
        ? query(
            collection(db, COLLECTIONS.volunteerCompletions),
            where('userId', '==', authUser.uid),
          )
        : null,
    [db, authUser?.uid],
  );
  const { data: completions, isLoading: completionsLoading } =
    useCollection<CompletionRecord>(completionsQuery);

  // --- İlanlar: taskId ile join (başlık + socialArea + skills) ---
  const listingsQuery = useMemoFirebase(
    () => (db ? collection(db, COLLECTIONS.volunteering) : null),
    [db],
  );
  const { data: listings, isLoading: listingsLoading } =
    useCollection<ListingDoc>(listingsQuery);

  const listingById = useMemo(() => {
    const m = new Map<string, ListingDoc>();
    for (const l of listings ?? []) m.set(l.id, l);
    return m;
  }, [listings]);

  // Tamamlamaları credential girdisine dönüştür (ilanla zenginleştirilmiş).
  const inputs = useMemo<CompletionInput[]>(() => {
    return (completions ?? []).map((c) => {
      const listing = c.taskId ? listingById.get(c.taskId) : undefined;
      return {
        id: c.id,
        userId: c.userId,
        taskId: c.taskId,
        ngoId: c.ngoId,
        taskTitle: listing?.title || c.professionLabel,
        socialArea: c.socialArea || listing?.socialArea,
        skills: c.skills && c.skills.length ? c.skills : listing?.skills,
        hoursLogged: c.hoursLogged,
        adjustedHours: c.adjustedHours,
        impactValueTRY: c.impactValueTRY,
        professionLabel: c.professionLabel,
        ngoApproved: c.ngoApproved,
        completedAt: c.completedAt,
        approvedAt: c.approvedAt,
      };
    });
  }, [completions, listingById]);

  const subjectName = myDoc?.name || 'Gönüllü';

  const transcript = useMemo<TranscriptSummary>(
    () => buildTranscript(inputs, { subjectName }),
    [inputs, subjectName],
  );

  const authLoading = isUserLoading;
  const dataLoading = authLoading || completionsLoading || listingsLoading;
  const hasData = transcript.totalCompletions > 0;

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div
      className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6"
      style={{ paddingBottom: 'calc(8rem + var(--sat, 0px))' }}
    >
      {/* Yazdırma stilleri — resmî, temiz A4 çıktısı */}
      <style jsx global>{`
        @media print {
          nav,
          header.app-shell-header,
          .app-bottom-nav,
          [data-app-nav] {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Başlık */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <div>
            <h1 className="font-headline text-2xl font-bold">Sosyal Etki Transkripti</h1>
            <p className="text-sm text-muted-foreground">
              {subjectName}
              {' · '}
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                hangel tarafından doğrulanabilir
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Giriş gerekiyor */}
      {!authLoading && !authUser && (
        <EmptyCard
          icon={Sparkles}
          title="Transkriptini görmek için giriş yap"
          desc="Onaylı gönüllülük tamamlamalarından oluşan sosyal etki transkriptini görmek için hesabına giriş yapmalısın."
        />
      )}

      {/* Yükleniyor */}
      {authUser && dataLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="text-sm">Transkript hazırlanıyor…</span>
        </div>
      )}

      {/* Boş durum */}
      {authUser && !dataLoading && !hasData && (
        <EmptyCard
          icon={Award}
          title="Henüz onaylı tamamlama yok"
          desc="Bir gönüllülük görevini tamamlayıp ilgili STK onayladığında, buradan resmî sosyal etki transkriptini oluşturabilirsin."
        />
      )}

      {/* Transkript içeriği */}
      {authUser && !dataLoading && hasData && (
        <>
          {/* Aksiyon çubuğu — yazdırırken gizli */}
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4" aria-hidden />
              PDF / Yazdır
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href={linkedInAddUrl({
                  name: 'Sosyal Etki Transkripti — hangel',
                  issueDate: new Date().toISOString(),
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4" aria-hidden />
                LinkedIn'e ekle
              </a>
            </Button>
          </div>

          {/* Özet istatistikler */}
          <section className="grid grid-cols-3 gap-2.5">
            <StatTile
              icon={Clock}
              value={fmtHours(transcript.totalHours)}
              label="Toplam saat"
            />
            <StatTile
              icon={Award}
              value={String(transcript.totalCompletions)}
              label="Başarı"
            />
            <StatTile
              icon={Sparkles}
              value={
                transcript.totalImpactTRY > 0
                  ? fmtTRY(transcript.totalImpactTRY)
                  : String(transcript.sdgTally.length)
              }
              label={transcript.totalImpactTRY > 0 ? 'Sosyal değer' : 'SDG'}
            />
          </section>

          {/* SDG karnesi */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-base font-semibold text-foreground">SDG Karnesi</h2>
              <Badge variant="glass" className="ml-auto">
                {transcript.sdgTally.length} amaç
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Gönüllülüğünün BM Sürdürülebilir Kalkınma Amaçlarına (SDG) katkısı.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {transcript.sdgTally.map((s) => (
                <SdgCard
                  key={s.no}
                  no={s.no}
                  label={s.label}
                  color={s.color}
                  hours={s.hours}
                  count={s.count}
                />
              ))}
            </div>
          </section>

          {/* Beceri listesi */}
          {transcript.skillTally.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="text-base font-semibold text-foreground">
                  Kazanılan Beceriler
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {transcript.skillTally.map((s) => (
                  <Badge key={s.name} variant="glass" className="gap-1">
                    {s.name}
                    {s.count > 1 && (
                      <span className="text-muted-foreground">×{s.count}</span>
                    )}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Başarı satırları */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-base font-semibold text-foreground">Başarılar</h2>
              <Badge variant="glass" className="ml-auto">
                {transcript.credentials.length}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {transcript.credentials.map((cred, idx) => {
                const ach = cred.credentialSubject.achievement;
                const credId = cred.id;
                return (
                  <div
                    key={credId}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{
                      animationDelay: `${idx * 30}ms`,
                      animationFillMode: 'backwards',
                    }}
                  >
                    <AchievementRow
                      credName={ach.name}
                      hours={ach.hours}
                      sdgs={ach.sdgs}
                      credId={credId}
                      linkedInHref={linkedInAddUrl({
                        name: ach.name,
                        issueDate: cred.issuanceDate,
                        certId: credId,
                        certUrl:
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/verify/${encodeURIComponent(credId)}`
                            : undefined,
                      })}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Doğrulama açıklaması + footer */}
          <Card variant="solid" className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Bu transkript hangel tarafından verilmiştir
                </p>
                <p className="text-xs text-muted-foreground">
                  Her başarı, Open Badges 3.0 / W3C Doğrulanabilir Kimlik Bilgisi
                  (VC) standardıyla üretilir. Bir başarının doğruluğunu{' '}
                  <span className="font-medium text-foreground">Doğrula</span>{' '}
                  bağlantısından kontrol edebilirsin. (Kriptografik imza
                  entegrasyonu yakında.)
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
