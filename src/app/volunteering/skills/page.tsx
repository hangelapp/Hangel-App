'use client';

/**
 * /volunteering/skills — "Beceri Gelişimim": gönüllülükle kazanılan beceri
 * rozetleri + öğrenme yolu (geliştirme yolu).
 *
 * YENİ, bağımsız sayfa. Paylaşılan dosyalara (types.ts, volunteering/page.tsx,
 * volunteering/[id]/page.tsx, ngo-admin/*, nav/menu/app-shell/layout) DOKUNMAZ.
 * Nav bağlantısını proje sahibi ekleyecek (rapora bakınız).
 *
 * Veri kaynağı:
 *  - users/{uid}.volunteerInfo.skills → kullanıcının KAZANILMIŞ becerileri
 *    (rozet olarak gösterilir).
 *  - volunteerCompletions (where userId == uid) → tamamlanan görev sayısı.
 *    Onaylanmış (ngoApproved) tamamlama sayısına göre beceri başına deneyim
 *    seviyesi eşiği hesaplanır (Başlangıç / Orta / İleri).
 *  - volunteering (açık ilanlar) → ilanların `skills` alanından türetilen,
 *    kullanıcının HENÜZ sahip olmadığı aranan beceriler → "Öğrenme Yolu":
 *    "Bu beceriyi kazanmak için şu ilanlara başvur" önerisi (ilana link).
 *
 * Mobil-öncelikli, `--sat` safe-area'ya saygılı, Apple-temiz, Türkçe literal.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, doc, query, where } from 'firebase/firestore';
import {
  Award,
  Medal,
  Star,
  Sparkles,
  Compass,
  ChevronRight,
  Target,
  Lightbulb,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { COLLECTIONS } from '@/firebase/collections';
import {
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Yerel (gevşek) shape'ler — types.ts'e DOKUNMADAN. Yalnız bu sayfanın
// okuduğu alanlar; hepsi opsiyonel (eksik olabilir).
// ---------------------------------------------------------------------------

type MyUserDoc = {
  id: string;
  name?: string;
  avatarUrl?: string;
  volunteerInfo?: {
    skills?: string[];
  };
};

type CompletionRecord = {
  id: string;
  userId?: string;
  ngoApproved?: boolean;
  skills?: string[]; // bazı kayıtlarda görevden snapshot'lanmış olabilir
};

type ListingDoc = {
  id: string;
  title?: string;
  organization?: string;
  skills?: string[];
};

// ---------------------------------------------------------------------------
// Deneyim seviyesi eşikleri — onaylanmış tamamlama sayısına göre.
// ---------------------------------------------------------------------------

type Level = {
  key: 'baslangic' | 'orta' | 'ileri';
  label: string;
  // Rozet ikon + renk paleti (seviye halkası dahil).
  Icon: typeof Award;
  ring: string; // avatar/halka rengi
  chip: string; // seviye etiketi rengi
  iconColor: string;
};

const LEVELS: Record<Level['key'], Level> = {
  baslangic: {
    key: 'baslangic',
    label: 'Başlangıç',
    Icon: Star,
    ring: 'ring-2 ring-sky-400/70',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    iconColor: 'text-sky-500',
  },
  orta: {
    key: 'orta',
    label: 'Orta',
    Icon: Medal,
    ring: 'ring-2 ring-violet-400/70',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    iconColor: 'text-violet-500',
  },
  ileri: {
    key: 'ileri',
    label: 'İleri',
    Icon: Award,
    ring: 'ring-2 ring-amber-400/80',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
};

/**
 * Onaylanmış tamamlama sayısına göre deneyim seviyesi.
 *  - 0–1 görev  → Başlangıç
 *  - 2–4 görev  → Orta
 *  - 5+  görev  → İleri
 * (Beceri başına ayrı tamamlama izi tutulmadığı için toplam onaylı tamamlama
 * sayısı, kullanıcının genel deneyim düzeyini temsil eder.)
 */
function levelFor(approvedCount: number): Level {
  if (approvedCount >= 5) return LEVELS.ileri;
  if (approvedCount >= 2) return LEVELS.orta;
  return LEVELS.baslangic;
}

/** İki string'i normalize edip karşılaştırmak için (TR-güvenli, boşluk/case). */
function norm(s: string): string {
  return s.trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');
}

/** Beceri adından 1-2 harflik baş harf (rozet fallback). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr');
  return (parts[0][0] + parts[1][0]).toLocaleUpperCase('tr');
}

// ---------------------------------------------------------------------------
// Alt bileşenler
// ---------------------------------------------------------------------------

function SkillBadge({
  skill,
  level,
  approvedCount,
}: {
  skill: string;
  level: Level;
  approvedCount: number;
}) {
  const { Icon } = level;
  return (
    <Card variant="solid" className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-3">
        {/* Rozet: seviye halkalı avatar + ikon rozeti */}
        <div className="relative shrink-0">
          <Avatar className={cn('h-12 w-12', level.ring)}>
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {initials(skill)}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border',
            )}
            aria-hidden
          >
            <Icon className={cn('h-3.5 w-3.5', level.iconColor)} />
          </span>
        </div>

        {/* Beceri adı + seviye */}
        <div className="min-w-0 flex-grow">
          <p className="truncate text-sm font-semibold text-foreground">{skill}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                level.chip,
              )}
            >
              {level.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {approvedCount > 0
                ? `${approvedCount} görevde kullandın`
                : 'Yeni kazanıldı'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PathCard({
  skill,
  listings,
}: {
  skill: string;
  listings: ListingDoc[];
}) {
  return (
    <Card variant="solid" className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Target className="h-4.5 w-4.5 text-primary" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{skill}</p>
            <p className="text-[11px] text-muted-foreground">
              {listings.length} açık ilanda aranıyor
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Bu beceriyi kazanmak için şu ilanlara başvurabilirsin:
        </p>

        <div className="space-y-1.5">
          {listings.slice(0, 3).map((l) => (
            <Link
              key={l.id}
              href={`/volunteering/${l.id}`}
              className="flex items-center gap-2 rounded-2xl border border-border bg-background/50 px-3 py-2 transition-colors hover:bg-muted/60 active:bg-muted"
            >
              <Compass className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-grow">
                <span className="block truncate text-xs font-medium text-foreground">
                  {l.title || 'Gönüllülük ilanı'}
                </span>
                {l.organization ? (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {l.organization}
                  </span>
                ) : null}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
        >
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          <div className="flex-grow space-y-1.5">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
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

export default function VolunteeringSkillsPage() {
  const db = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // --- Kullanıcı doc'u: kazanılmış beceriler ---
  const myDocRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: myDoc, isLoading: myDocLoading } = useDoc<MyUserDoc>(myDocRef);

  // --- Tamamlama kayıtları: deneyim seviyesi için ---
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

  // --- Açık gönüllülük ilanları: öğrenme yolu türetimi için ---
  const listingsQuery = useMemoFirebase(
    () => (db ? collection(db, COLLECTIONS.volunteering) : null),
    [db],
  );
  const { data: listings, isLoading: listingsLoading } =
    useCollection<ListingDoc>(listingsQuery);

  // Onaylanmış tamamlama sayısı → genel deneyim seviyesi.
  const approvedCount = useMemo(
    () => (completions ?? []).filter((c) => c.ngoApproved === true).length,
    [completions],
  );
  const level = useMemo(() => levelFor(approvedCount), [approvedCount]);

  // Kullanıcının kazanılmış becerileri (benzersiz, boş olmayanlar).
  const mySkills = useMemo<string[]>(() => {
    const raw = myDoc?.volunteerInfo?.skills;
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of raw) {
      const label = (s ?? '').trim();
      if (!label) continue;
      const key = norm(label);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(label);
    }
    return out;
  }, [myDoc]);

  const mySkillKeys = useMemo(() => new Set(mySkills.map(norm)), [mySkills]);

  // Öğrenme yolu: ilanların skills'inden, kullanıcının SAHİP OLMADIĞI beceriler.
  // Her beceri için o beceriyi arayan açık ilanlar toplanır.
  const learningPaths = useMemo(() => {
    const map = new Map<string, { skill: string; listings: ListingDoc[] }>();
    for (const l of listings ?? []) {
      const skills = Array.isArray(l.skills) ? l.skills : [];
      for (const s of skills) {
        const label = (s ?? '').trim();
        if (!label) continue;
        const key = norm(label);
        if (mySkillKeys.has(key)) continue; // zaten sahip
        const entry = map.get(key);
        if (entry) {
          entry.listings.push(l);
        } else {
          map.set(key, { skill: label, listings: [l] });
        }
      }
    }
    // En çok aranan (en çok ilanı olan) beceriler önce.
    return Array.from(map.values()).sort(
      (a, b) => b.listings.length - a.listings.length,
    );
  }, [listings, mySkillKeys]);

  const authLoading = isUserLoading || (!!authUser && myDocLoading);
  const skillsLoading = authLoading || completionsLoading;

  return (
    <div
      className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6"
      style={{ paddingBottom: 'calc(8rem + var(--sat, 0px))' }}
    >
      {/* Başlık */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Award className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <h1 className="font-headline text-2xl font-bold">Beceri Gelişimim</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gönüllülükle kazandığın beceriler ve seni bekleyen gelişim yolu.
        </p>
      </header>

      {/* Giriş gerekmiyorsa bilgilendir */}
      {!authLoading && !authUser && (
        <EmptyCard
          icon={Sparkles}
          title="Beceri gelişimini görmek için giriş yap"
          desc="Gönüllülükle kazandığın becerileri ve önerilen gelişim yolunu görmek için hesabına giriş yapmalısın."
        />
      )}

      {/* Deneyim seviyesi özeti */}
      {authUser && (
        <Card variant="solid" className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <span
              className={cn(
                'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm',
                level.ring,
              )}
            >
              <level.Icon className={cn('h-6 w-6', level.iconColor)} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Deneyim seviyen:{' '}
                <span className={cn('font-bold', level.iconColor)}>{level.label}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {approvedCount > 0
                  ? `${approvedCount} onaylı gönüllülük tamamladın.`
                  : 'İlk görevini tamamlayarak seviyeni yükseltmeye başla.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kazanılmış beceriler */}
      {authUser && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-base font-semibold text-foreground">
              Kazandığın Beceriler
            </h2>
            {mySkills.length > 0 && (
              <Badge variant="glass" className="ml-auto">
                {mySkills.length}
              </Badge>
            )}
          </div>

          {skillsLoading ? (
            <SectionSkeleton rows={3} />
          ) : mySkills.length === 0 ? (
            <EmptyCard
              icon={Star}
              title="Henüz beceri eklenmemiş"
              desc="Profilindeki gönüllü bilgilerine becerilerini ekle; tamamladığın görevlerle bu rozetler seviye atlar."
            />
          ) : (
            <div className="space-y-2">
              {mySkills.map((skill, idx) => (
                <div
                  key={skill}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{
                    animationDelay: `${idx * 30}ms`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <SkillBadge
                    skill={skill}
                    level={level}
                    approvedCount={approvedCount}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Öğrenme yolu */}
      {authUser && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-base font-semibold text-foreground">Öğrenme Yolu</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Açık ilanlarda aranan ama henüz sahip olmadığın beceriler. Başvurarak
            yeni beceriler kazan.
          </p>

          {listingsLoading || authLoading ? (
            <SectionSkeleton rows={2} />
          ) : learningPaths.length === 0 ? (
            <EmptyCard
              icon={Compass}
              title="Şimdilik yeni bir öğrenme hedefi yok"
              desc="Açık ilanlarda aranan beceriler zaten sende var ya da henüz uygun ilan yok. Yeni ilanlar açıldıkça burada önerilerini göreceksin."
            />
          ) : (
            <div className="space-y-2.5">
              {learningPaths.slice(0, 8).map((p, idx) => (
                <div
                  key={norm(p.skill)}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{
                    animationDelay: `${idx * 30}ms`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <PathCard skill={p.skill} listings={p.listings} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
