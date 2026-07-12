'use client';

/**
 * /verify/[id] — Sosyal Etki Kimlik Bilgisi (credential) DOĞRULAMA sayfası.
 *
 * STUB: Kriptografik imza doğrulaması ŞİMDİLİK YOK. Sayfa, credential id'sinden
 * ilgili tamamlamayı çözer, credential objesini gösterir ve "hangel tarafından
 * verildi ✓ (imza entegrasyonu yakında)" der. Gerçek imza doğrulaması (did:web
 * / Sertifier) SONRA takılacak.
 *
 * YENİ, bağımsız sayfa. Paylaşılan dosyalara (types.ts, volunteering/*,
 * passport/*, ngo-admin/*, nav/app-shell/layout) DOKUNMAZ. Tipler
 * src/lib/credentials/transcript.ts'te yerel tanımlı.
 *
 * URL: /verify/<credId> — credId = urn:hangel:credential:<completionId>.
 *
 * Mobil-öncelikli, `--sat` safe-area'ya saygılı, Apple-temiz, Türkçe.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Award,
  Target,
  Sparkles,
  Loader2,
  ArrowLeft,
  BadgeCheck,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COLLECTIONS } from '@/firebase/collections';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  buildCredential,
  completionIdFromCredentialId,
  credentialIdForCompletion,
  SDG_META,
  type CompletionInput,
} from '@/lib/credentials/transcript';

// ---------------------------------------------------------------------------
// Yerel (gevşek) shape — types.ts'e DOKUNMADAN.
// ---------------------------------------------------------------------------

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
  socialArea?: string;
  skills?: string[];
  completedAt?: { seconds: number; nanoseconds: number } | null;
  approvedAt?: { seconds: number; nanoseconds: number } | null;
};

function fmtHours(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

// ---------------------------------------------------------------------------
// Sayfa
// ---------------------------------------------------------------------------

export default function VerifyCredentialPage() {
  const db = useFirestore();
  const params = useParams<{ id: string }>();

  // Route param → credId → completionId.
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const credId = rawId ? decodeURIComponent(rawId) : '';
  const completionId = credId ? completionIdFromCredentialId(credId) : '';

  const completionRef = useMemoFirebase(
    () =>
      db && completionId
        ? doc(db, COLLECTIONS.volunteerCompletions, completionId)
        : null,
    [db, completionId],
  );
  const { data: completion, isLoading, error } = useDoc<CompletionRecord>(completionRef);

  // Tamamlamadan credential objesini yeniden üret (aynı saf fonksiyon).
  const credential = useMemo(() => {
    if (!completion) return null;
    const input: CompletionInput = {
      id: completion.id,
      userId: completion.userId,
      taskId: completion.taskId,
      ngoId: completion.ngoId,
      socialArea: completion.socialArea,
      skills: completion.skills,
      hoursLogged: completion.hoursLogged,
      adjustedHours: completion.adjustedHours,
      impactValueTRY: completion.impactValueTRY,
      professionLabel: completion.professionLabel,
      ngoApproved: completion.ngoApproved,
      completedAt: completion.completedAt,
      approvedAt: completion.approvedAt,
    };
    return buildCredential(input);
  }, [completion]);

  // Onaylı mı? (Doğrulamanın anlamı: STK onaylı ve credential üretilebilir.)
  const isApproved = completion?.ngoApproved === true;
  const canonicalCredId = completionId ? credentialIdForCompletion(completionId) : credId;

  return (
    <div
      className="mx-auto w-full max-w-lg space-y-5 p-4 sm:p-6"
      style={{ paddingBottom: 'calc(6rem + var(--sat, 0px))' }}
    >
      {/* Geri */}
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/volunteering/transcript">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Transkripte dön
          </Link>
        </Button>
      </div>

      {/* Başlık */}
      <header className="flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <BadgeCheck className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div>
          <h1 className="font-headline text-xl font-bold">Kimlik Bilgisi Doğrulama</h1>
          <p className="text-xs text-muted-foreground">Sosyal Etki Transkripti · hangel</p>
        </div>
      </header>

      {/* Yükleniyor */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="text-sm">Doğrulanıyor…</span>
        </div>
      )}

      {/* Bulunamadı / erişilemedi */}
      {!isLoading && (!completion || error) && (
        <Card variant="solid" className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-500/10">
              <ShieldAlert className="h-7 w-7 text-amber-500" aria-hidden />
            </span>
            <p className="text-base font-semibold text-foreground">
              Kimlik bilgisi bulunamadı
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Bu doğrulama bağlantısı geçersiz olabilir ya da kayda erişim
              yetkisi gerekiyor olabilir. Lütfen bağlantıyı kontrol et.
            </p>
            {credId && (
              <p className="mt-1 break-all rounded-lg bg-muted/60 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {credId}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Doğrulama sonucu */}
      {!isLoading && completion && credential && (
        <>
          {/* Doğrulama rozeti (STUB) */}
          <Card
            variant="solid"
            className={
              isApproved
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-amber-500/30 bg-amber-500/5'
            }
          >
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <span
                className={
                  'inline-flex h-16 w-16 items-center justify-center rounded-full ' +
                  (isApproved ? 'bg-emerald-500/15' : 'bg-amber-500/15')
                }
              >
                {isApproved ? (
                  <ShieldCheck className="h-8 w-8 text-emerald-500" aria-hidden />
                ) : (
                  <ShieldAlert className="h-8 w-8 text-amber-500" aria-hidden />
                )}
              </span>
              {isApproved ? (
                <>
                  <p className="text-base font-bold text-foreground">
                    hangel tarafından verildi ✓
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Bu kimlik bilgisi hangel üzerinde onaylanmış bir gönüllülük
                    tamamlamasına karşılık gelir.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-foreground">Onay bekliyor</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Bu tamamlama henüz ilgili STK tarafından onaylanmadığı için
                    doğrulanabilir bir kimlik bilgisi oluşturulmamıştır.
                  </p>
                </>
              )}
              <Badge variant="glass" className="mt-1 gap-1">
                <Sparkles className="h-3 w-3" aria-hidden />
                İmza entegrasyonu yakında
              </Badge>
            </CardContent>
          </Card>

          {/* Başarı detayı */}
          <Card variant="solid">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Award className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {credential.credentialSubject.achievement.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {credential.credentialSubject.achievement.description}
                  </p>
                </div>
              </div>

              {/* Meta satırları */}
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden /> Doğrulanmış saat
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {fmtHours(credential.credentialSubject.achievement.hours)} saat
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <BadgeCheck className="h-4 w-4" aria-hidden /> Veren
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {credential.issuer.name}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="h-4 w-4" aria-hidden /> Verilme tarihi
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {fmtDate(credential.issuanceDate)}
                  </dd>
                </div>
              </dl>

              {/* SDG'ler */}
              {credential.credentialSubject.achievement.sdgs.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Target className="h-3.5 w-3.5" aria-hidden /> Sürdürülebilir
                    Kalkınma Amaçları
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {credential.credentialSubject.achievement.sdgs.map((n) => {
                      const meta = SDG_META[n];
                      return (
                        <span
                          key={n}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: meta?.color ?? '#666' }}
                        >
                          SDG {n}
                          {meta ? ` · ${meta.label}` : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Beceriler */}
              {credential.credentialSubject.achievement.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Beceriler (ESCO)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {credential.credentialSubject.achievement.skills.map((s) => (
                      <Badge key={s.name} variant="glass">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ham credential (denetim / teknik doğrulama için) */}
          <details className="rounded-2xl border border-border bg-card/50 p-3">
            <summary className="cursor-pointer select-none text-xs font-semibold text-muted-foreground">
              Ham kimlik bilgisi (Open Badges 3.0 / VC)
            </summary>
            <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              {JSON.stringify(credential, null, 2)}
            </pre>
          </details>

          {/* Kimlik bilgisi id */}
          <p className="break-all text-center font-mono text-[10px] text-muted-foreground">
            {canonicalCredId}
          </p>
        </>
      )}
    </div>
  );
}
