'use client';

/**
 * Referans Mektuplarım — gönüllünün ONAYLANMIŞ gönüllülük tamamlamalarından
 * STK-onaylı, yazdırılabilir/paylaşılabilir resmî referans mektupları üretir
 * (CV / LinkedIn için).
 *
 * Kaynak:
 *   volunteerCompletions (where userId == uid) → client'ta onaylıları süzer
 *   (ngoApproved === true || status === 'approved' — iki bayrak da yazılabiliyor).
 *
 * Zenginleştirme (ek yazma yok, sadece okuma):
 *   - STK adı + logosu   ← ngos/{ngoId}
 *   - Görev/ilan başlığı  ← volunteering/{taskId}
 *   Referans dokümanlar `documentId() in` chunk'lı sorgularla toplu çekilir
 *   (etki-haritam/page.tsx ile aynı desen).
 *
 * Kullanıcının görünen adı users/{uid} doc'undan alınır; yoksa auth
 * displayName / e-posta yerel kısmı fallback olur.
 *
 * Yazdır/İndir:
 *   - window.print()  → @media print ile sade A4 (yalnız seçili mektup basılır)
 *   - "Metni kopyala" → navigator.clipboard (fallback: execCommand)
 *
 * (Kripto-imzalı PDF SONRA — şimdilik yazdırılabilir resmî metin.)
 *
 * ÇAKIŞMA NOTU: bu dosya tamamen self-contained; paylaşılan hiçbir dosyayı
 * (types.ts, volunteering/page.tsx, volunteering/[id]/page.tsx, nav/shell) import
 * dışında değiştirmez.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  documentId,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {
  useFirestore,
  useUser,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { Award, FileText, Printer, Copy, Check, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// hangel resmi paleti (Apple marka kimliği).
const CORAL = '#f34723';

/** volunteerCompletions doc (bu sayfada okunan alanlar). */
interface CompletionDoc {
  id: string;
  userId?: string;
  taskId?: string;
  ngoId?: string;
  hoursLogged?: number;
  adjustedHours?: number;
  professionLabel?: string;
  impactValueTRY?: number;
  ngoApproved?: boolean;
  status?: string;
  completedAt?: FsDate;
  approvedAt?: FsDate;
}

/** users/{uid} doc'undan sadece görünen ad için gereken alanlar. */
interface UserLite {
  name?: string;
  username?: string;
  personalInfo?: { email?: string };
}

/** ISO string, Firestore Timestamp ({ seconds }) veya admin serileştirmesi ({ _seconds }). */
type FsDate = string | { seconds?: number; _seconds?: number } | null | undefined;

/** Bir onaylı tamamlamadan türetilmiş, ekrana basılacak referans mektubu. */
interface ReferenceLetter {
  id: string;
  ngoId?: string;
  ngoName: string;
  ngoLogoUrl?: string;
  taskTitle: string;
  hours: number;
  professionLabel?: string;
  impactValueTRY?: number;
  /** Kullanıcı dostu tarih (dd MMMM yyyy). */
  dateLabel: string;
  /** Çalışma saatleri aralığı, varsa (örn "09:00 – 17:00"). */
  timeLabel?: string;
}

/** Firestore/ISO tarih değerini Date'e çevirir (client SDK: seconds; admin: _seconds). */
function toDate(value: FsDate): Date | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const d = value.includes('T') ? new Date(value) : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const secs = value.seconds ?? value._seconds;
  return typeof secs === 'number' ? new Date(secs * 1000) : null;
}

function formatDate(value: FsDate): string {
  const d = toDate(value);
  return d ? format(d, 'dd MMMM yyyy', { locale: tr }) : '';
}

/** Diziyi n'erli parçalara böler (Firestore `in` sorgusu en fazla 10 eleman). */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Resmî referans mektubu gövde metni (kopyala + yazdır ortak kaynağı). */
function buildLetterText(letter: ReferenceLetter, userName: string): string {
  const hoursPart =
    letter.hours > 0 ? ` toplam ${letter.hours.toLocaleString('tr-TR')} saat` : '';
  const rolePart = letter.professionLabel ? ` (${letter.professionLabel})` : '';
  const lines = [
    `${letter.ngoName}, ${userName} adlı gönüllünün ${letter.dateLabel} tarihinde ` +
      `"${letter.taskTitle}"${rolePart} kapsamında${hoursPart} gönüllülük çalışması ` +
      `gerçekleştirdiğini ve bu çalışmayı özveri ve sorumlulukla tamamladığını memnuniyetle onaylar.`,
    '',
    `Kendisinin ekip çalışmasına uyumu, güvenilirliği ve topluma katkısı için ` +
      `teşekkür eder; bundan sonraki çalışmalarında başarılar dileriz.`,
    '',
    `${letter.ngoName}`,
    `hangel üzerinden doğrulanmış gönüllülük kaydı`,
  ];
  return lines.join('\n');
}

export default function ReferenceLettersPage() {
  const db = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // Kullanıcının görünen adı — users/{uid}.
  const userDocRef = useMemoFirebase(
    () => (db && authUser ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: userDoc } = useDoc<UserLite>(userDocRef);

  const userName = useMemo(() => {
    const fromDoc = userDoc?.name?.trim();
    if (fromDoc) return fromDoc;
    const fromAuth = authUser?.displayName?.trim();
    if (fromAuth) return fromAuth;
    const email = userDoc?.personalInfo?.email || authUser?.email || '';
    const local = email.split('@')[0];
    return local || 'Gönüllü';
  }, [userDoc, authUser]);

  // Onaylı tamamlamalar — asıl kaynak.
  const completionsRef = useMemoFirebase(
    () =>
      db && authUser
        ? query(
            collection(db, COLLECTIONS.volunteerCompletions),
            where('userId', '==', authUser.uid),
          )
        : null,
    [db, authUser?.uid],
  );
  const { data: completionsData, isLoading: completionsLoading } =
    useCollection<CompletionDoc>(completionsRef);

  const approvedCompletions = useMemo(
    () =>
      (completionsData ?? []).filter(
        (c) => c.ngoApproved === true || c.status === 'approved',
      ),
    [completionsData],
  );

  // Referans dokümanları (ngos + volunteering) toplu çek — ek okuma tek sefer.
  const [ngoMap, setNgoMap] = useState<Map<string, Record<string, unknown>>>(
    () => new Map(),
  );
  const [taskMap, setTaskMap] = useState<Map<string, Record<string, unknown>>>(
    () => new Map(),
  );
  const [refsLoading, setRefsLoading] = useState(false);

  const ngoIdsKey = useMemo(
    () =>
      Array.from(
        new Set(approvedCompletions.map((c) => c.ngoId).filter(Boolean) as string[]),
      )
        .sort()
        .join(','),
    [approvedCompletions],
  );
  const taskIdsKey = useMemo(
    () =>
      Array.from(
        new Set(approvedCompletions.map((c) => c.taskId).filter(Boolean) as string[]),
      )
        .sort()
        .join(','),
    [approvedCompletions],
  );

  useEffect(() => {
    let cancelled = false;
    const ngoIds = ngoIdsKey ? ngoIdsKey.split(',') : [];
    const taskIds = taskIdsKey ? taskIdsKey.split(',') : [];
    if (!db || (ngoIds.length === 0 && taskIds.length === 0)) {
      setNgoMap(new Map());
      setTaskMap(new Map());
      return;
    }

    const fetchByIds = async (
      collName: string,
      ids: string[],
    ): Promise<Map<string, Record<string, unknown>>> => {
      const map = new Map<string, Record<string, unknown>>();
      for (const part of chunk(ids, 10)) {
        if (part.length === 0) continue;
        try {
          const snap = await getDocs(
            query(collection(db, collName), where(documentId(), 'in', part)),
          );
          snap.forEach((d) => map.set(d.id, d.data() as Record<string, unknown>));
        } catch {
          /* izin/sorgu hatası → o kaynak atlanır, mektup fallback ile üretilir */
        }
      }
      return map;
    };

    setRefsLoading(true);
    Promise.all([
      fetchByIds(COLLECTIONS.ngos, ngoIds),
      fetchByIds(COLLECTIONS.volunteering, taskIds),
    ])
      .then(([ngos, tasks]) => {
        if (cancelled) return;
        setNgoMap(ngos);
        setTaskMap(tasks);
      })
      .finally(() => {
        if (!cancelled) setRefsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [db, ngoIdsKey, taskIdsKey]);

  const letters = useMemo<ReferenceLetter[]>(() => {
    return approvedCompletions.map((c) => {
      const ngo = c.ngoId ? ngoMap.get(c.ngoId) : undefined;
      const task = c.taskId ? taskMap.get(c.taskId) : undefined;
      const ngoName =
        (ngo?.name as string) || (task?.organization as string) || 'STK';
      const ngoLogoUrl =
        (ngo?.avatarUrl as string) || (ngo?.logoUrl as string) || undefined;
      const taskTitle =
        (task?.title as string) || c.professionLabel || 'Gönüllülük görevi';
      const hours =
        typeof c.adjustedHours === 'number' ? c.adjustedHours : c.hoursLogged ?? 0;
      const hoursObj = task?.hours as
        | { start?: string; end?: string }
        | undefined;
      const timeLabel =
        hoursObj?.start && hoursObj?.end
          ? `${hoursObj.start} – ${hoursObj.end}`
          : undefined;
      return {
        id: c.id,
        ngoId: c.ngoId,
        ngoName,
        ngoLogoUrl,
        taskTitle,
        hours,
        professionLabel: c.professionLabel,
        impactValueTRY: c.impactValueTRY,
        dateLabel: formatDate(c.approvedAt ?? c.completedAt),
        timeLabel,
      };
    });
  }, [approvedCompletions, ngoMap, taskMap]);

  // Kopyalama geri bildirimi.
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = async (letter: ReferenceLetter) => {
    const text = buildLetterText(letter, userName);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(letter.id);
      window.setTimeout(() => setCopiedId((cur) => (cur === letter.id ? null : cur)), 2000);
    } catch {
      /* kopyalama başarısızsa sessiz geç — kullanıcı metni elle seçebilir */
    }
  };

  // Yazdırılacak mektup — state'e yazınca seçili karta `print-visible` sınıfı
  // eklenir, CSS diğerlerini gizler. State güncellenip DOM boyandıktan SONRA
  // (useEffect) window.print() çağrılır ki doğru kart görünür olsun.
  const [printingId, setPrintingId] = useState<string | null>(null);
  const handlePrint = (letter: ReferenceLetter) => {
    setPrintingId(letter.id);
  };

  useEffect(() => {
    if (!printingId || typeof window === 'undefined') return;
    const cleanup = () => {
      setPrintingId(null);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    // İki rAF: sınıfın gerçekten paint edildiğinden emin olmak için.
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
    // afterprint bazı tarayıcılarda tetiklenmez → güvenlik ağı.
    const timer = window.setTimeout(cleanup, 2000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', cleanup);
    };
  }, [printingId]);

  const loading = isUserLoading || completionsLoading || refsLoading;

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl px-4 pt-[calc(1.5rem+var(--sat))] pb-[calc(4rem+var(--sab))] space-y-6 animate-in fade-in-0' +
        (printingId ? ' printing' : '')
      }
    >
      {/* Yazdırma stilleri — yalnız `print-visible` işaretli mektup, sade A4. */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          /* Yazdırırken her şeyi gizle... */
          body :global(*) {
            visibility: hidden;
          }
          /* ...yalnız seçili mektup ve içeriği görünür kalsın. */
          .printing :global([data-letter-id].print-visible),
          .printing :global([data-letter-id].print-visible *) {
            visibility: visible;
          }
          .printing :global([data-letter-id]) {
            display: none;
          }
          .printing :global([data-letter-id].print-visible) {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
            color: #000 !important;
          }
          .printing :global(.no-print) {
            display: none !important;
          }
        }
      `}</style>

      {/* Başlık */}
      <header className="space-y-2 no-print">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Award className="h-3.5 w-3.5" />
          Referans Mektuplarım
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          STK onaylı referans mektupların
        </h1>
        <p className="text-muted-foreground">
          Tamamlayıp onaylanan gönüllülüklerin için resmî referans metni. CV veya
          LinkedIn için yazdır ya da metni kopyala.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !authUser ? (
        <EmptyState
          icon={FileText}
          title="Referans mektupların seni bekliyor"
          description="Onaylı gönüllülüklerinden referans mektubu oluşturmak için giriş yap."
          action={{ label: 'Giriş yap', href: '/login' }}
        />
      ) : letters.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Henüz referans mektubun yok"
          description="Tamamlanan gönüllülüklerin onaylanınca referans mektubun burada oluşur."
          action={{ label: 'Gönüllülükleri keşfet', href: '/volunteering' }}
        />
      ) : (
        <div className="space-y-4">
          {letters.map((letter) => {
            const isCopied = copiedId === letter.id;
            return (
              <Card
                key={letter.id}
                variant="glass"
                data-letter-id={letter.id}
                className={
                  'overflow-hidden' +
                  (printingId === letter.id ? ' print-visible' : '')
                }
              >
                <CardContent className="p-6 space-y-5">
                  {/* Antet: STK logosu + adı + tarih */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 shrink-0 rounded-2xl">
                      <AvatarImage src={letter.ngoLogoUrl} alt={letter.ngoName} />
                      <AvatarFallback className="rounded-2xl text-base font-bold">
                        {letter.ngoName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold leading-tight break-words">
                        {letter.ngoName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Referans Mektubu
                      </p>
                      {letter.dateLabel && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {letter.dateLabel}
                        </p>
                      )}
                    </div>
                    <Award
                      className="h-5 w-5 shrink-0 text-amber-500 no-print"
                      aria-hidden
                    />
                  </div>

                  {/* Görev başlığı + saat/etki rozetleri */}
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold leading-snug break-words">
                      {letter.taskTitle}
                    </h2>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {letter.hours > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {letter.hours.toLocaleString('tr-TR')} saat
                        </span>
                      )}
                      {letter.timeLabel && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 font-medium text-muted-foreground">
                          {letter.timeLabel}
                        </span>
                      )}
                      {letter.professionLabel && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 font-medium text-muted-foreground">
                          {letter.professionLabel}
                        </span>
                      )}
                      {typeof letter.impactValueTRY === 'number' &&
                        letter.impactValueTRY > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium"
                            style={{ color: CORAL, borderColor: `${CORAL}66` }}
                          >
                            {letter.impactValueTRY.toLocaleString('tr-TR')} ₺ sosyal
                            etki
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Resmî referans metni */}
                  <div className="rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {buildLetterText(letter, userName)}
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex flex-wrap items-center justify-end gap-2 no-print">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(letter)}
                    >
                      {isCopied ? (
                        <Check className="mr-1.5 h-4 w-4" />
                      ) : (
                        <Copy className="mr-1.5 h-4 w-4" />
                      )}
                      {isCopied ? 'Kopyalandı' : 'Metni kopyala'}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#f34723] text-white hover:bg-[#c5391b]"
                      onClick={() => handlePrint(letter)}
                    >
                      <Printer className="mr-1.5 h-4 w-4" />
                      Yazdır / İndir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
