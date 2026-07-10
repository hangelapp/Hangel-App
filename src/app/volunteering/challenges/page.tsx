'use client';

/**
 * /volunteering/challenges — Takım Meydan Okumaları (Benevity/Deed tarzı).
 *
 * YENİ, bağımsız sayfa. Paylaşılan dosyalara (types.ts, volunteering/page.tsx,
 * volunteering/[id], leaderboard, nav/app-shell/layout) DOKUNMAZ. Yalnız
 * GÖRÜNTÜLEME + boş durum; yönetici tarafı (meydan okuma oluşturma) bu turda yok.
 *
 * Veri kaynağı:
 *  - `challenges` koleksiyonu (varsayımsal — bkz. aşağıdaki Challenge tipi).
 *    Aktif olanlar = `endsAt` gelecekte. Tek alanlı `where('endsAt','>')`
 *    kullanılır (composite index gerektirmez); sıralama client-side yapılır.
 *  - `volunteerCompletions` (onaylı) → her meydan okumanın ilerlemesi buradan
 *    hesaplanır:
 *      metric='hours' → ilgili kayıtların adjustedHours ?? hoursLogged toplamı
 *      metric='count' → ilgili onaylı tamamlama sayısı
 *    Kapsam:
 *      ngoId'li meydan okuma → completion.ngoId eşleşmesi (doğrudan).
 *      clubId'li meydan okuma → o kulübün üyelerinin (users içindeki
 *        volunteerInfo.clubMemberships / joinedClubs / managedClubId) userId
 *        kümesine düşen tamamlamalar. Bunun için `users` koleksiyonu yalnız
 *        kulüp bazlı meydan okuma varsa çekilir.
 *  - Giriş yapan kullanıcının doc'u → kendi kulüpleri; "Kulübümün meydan
 *    okumaları" bölümünü öne çıkarmak için.
 *
 * Mobil-öncelikli, `--sat` safe-area'ya saygılı, Apple-temiz, Türkçe.
 */

import { useMemo } from 'react';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { Trophy, Target, Users, Flame, Clock } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { COLLECTIONS } from '@/firebase/collections';
import {
  useFirestore,
  useUser,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { cn } from '@/lib/utils';

// Varsayımsal `challenges` koleksiyon adı. COLLECTIONS'a (paylaşılan dosya)
// DOKUNMAMAK için burada yerel sabit olarak tutulur; koleksiyon resmileşince
// bu satır COLLECTIONS.challenges ile değiştirilebilir.
const CHALLENGES_COLLECTION = 'challenges';

// --- Varsayımsal `challenges` koleksiyon şeması (types.ts'e DOKUNMADAN, yerel) ---
type ChallengeMetric = 'hours' | 'count';

type FirestoreTs = { seconds: number; nanoseconds: number };

type Challenge = {
  id: string;
  title: string;
  description?: string;
  clubId?: string;
  ngoId?: string;
  metric: ChallengeMetric;
  target: number;
  startsAt?: FirestoreTs;
  endsAt?: FirestoreTs;
};

// volunteerCompletions'tan yalnız ilerlemeyi besleyen alanlar (gevşek shape).
type CompletionLite = {
  id: string;
  userId?: string;
  ngoId?: string;
  hoursLogged?: number;
  adjustedHours?: number;
  ngoApproved?: boolean;
};

// users doc'undan yalnız kulüp üyeliği alanları (gevşek shape).
type MemberLite = {
  id: string;
  joinedClubs?: string[];
  managedClubId?: string;
  volunteerInfo?: { clubMemberships?: string[] };
};

// -------------------------------------------------------------------------

/** Firestore Timestamp benzeri değeri ms'ye çevir (yoksa null). */
function tsToMs(ts?: FirestoreTs): number | null {
  if (!ts || typeof ts.seconds !== 'number') return null;
  return ts.seconds * 1000 + Math.floor((ts.nanoseconds ?? 0) / 1e6);
}

/** Kalan gün (bugünden endsAt'e; geçmişse 0). */
function daysLeft(endsAt?: FirestoreTs): number | null {
  const end = tsToMs(endsAt);
  if (end == null) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

/** Kalan gün etiketi (Türkçe). */
function remainingLabel(d: number | null): string {
  if (d == null) return 'Süresiz';
  if (d === 0) return 'Bugün son gün';
  if (d === 1) return 'Son 1 gün';
  return `${d} gün kaldı`;
}

/** Bir kullanıcının bir kulübe üye olup olmadığını (tüm alanlardan) kontrol et. */
function isMemberOf(member: MemberLite, clubId: string): boolean {
  const joined = Array.isArray(member.joinedClubs) && member.joinedClubs.includes(clubId);
  const managed = member.managedClubId === clubId;
  const memberships =
    Array.isArray(member.volunteerInfo?.clubMemberships) &&
    member.volunteerInfo!.clubMemberships!.includes(clubId);
  return joined || managed || memberships;
}

/** Onaylı bir tamamlamanın metriğe göre katkısı (hours → saat; count → 1). */
function contribution(c: CompletionLite, metric: ChallengeMetric): number {
  if (metric === 'count') return 1;
  const hours = typeof c.adjustedHours === 'number' ? c.adjustedHours : c.hoursLogged;
  return Number(hours) || 0;
}

/** Sayıyı TR biçiminde, gerekirse ondalıkla göster. */
function fmt(n: number): string {
  return Number.isInteger(n)
    ? n.toLocaleString('tr-TR')
    : n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
}

// -------------------------------------------------------------------------

type ChallengeWithProgress = Challenge & {
  _current: number;
  _pct: number;
  _daysLeft: number | null;
  _isMine: boolean;
};

function metricUnit(metric: ChallengeMetric): string {
  return metric === 'hours' ? 'saat' : 'faaliyet';
}

function ChallengeCard({ ch }: { ch: ChallengeWithProgress }) {
  const reached = ch._pct >= 100;
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        {/* Üst satır: ikon + başlık + kapsam rozeti */}
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              reached ? 'bg-amber-400/15 text-amber-500' : 'bg-primary/10 text-primary',
            )}
          >
            {reached ? (
              <Trophy className="h-5 w-5" aria-hidden />
            ) : (
              <Target className="h-5 w-5" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-grow">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-base font-semibold leading-tight text-foreground">
                {ch.title}
              </h3>
              {ch._isMine && (
                <Badge className="shrink-0 gap-1">
                  <Users className="h-3 w-3" aria-hidden />
                  Kulübüm
                </Badge>
              )}
            </div>
            {ch.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {ch.description}
              </p>
            ) : null}
          </div>
        </div>

        {/* İlerleme çubuğu */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">
                {fmt(ch._current)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {fmt(ch.target)} {metricUnit(ch.metric)}
              </span>
            </span>
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                reached ? 'text-amber-500' : 'text-primary',
              )}
            >
              %{Math.round(ch._pct)}
            </span>
          </div>
          <Progress
            value={ch._pct}
            className={cn('h-2.5', reached && '[&>div]:bg-amber-400')}
          />
        </div>

        {/* Alt satır: hedef ulaşıldı / kalan gün */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {reached ? (
              <>
                <Flame className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                <span className="font-medium text-amber-500">Hedefe ulaşıldı</span>
              </>
            ) : (
              <>
                <Flame className="h-3.5 w-3.5" aria-hidden />
                Hedefe {fmt(Math.max(0, ch.target - ch._current))} {metricUnit(ch.metric)} kaldı
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {remainingLabel(ch._daysLeft)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-muted" />
          <div className="flex-grow space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="flex justify-between">
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
          <Trophy className="h-8 w-8 text-primary" aria-hidden />
        </span>
        <p className="text-base font-semibold text-foreground">
          Yakında takım meydan okumaları
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Kulübün ve takımınla birlikte gönüllülük hedeflerine ulaş. İlk meydan
          okumalar yayınlandığında burada görünecek.
        </p>
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

export default function TeamChallengesPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();

  // --- Aktif meydan okumalar: endsAt gelecekte (tek alanlı filtre). ---
  const nowTs = useMemo(() => Timestamp.now(), []);
  const challengesQuery = useMemoFirebase(
    () =>
      db
        ? query(collection(db, CHALLENGES_COLLECTION), where('endsAt', '>', nowTs))
        : null,
    [db, nowTs],
  );
  const { data: rawChallenges, isLoading: challengesLoading } =
    useCollection<Challenge>(challengesQuery);

  // --- Onaylı gönüllülük tamamlamaları (ilerleme hesabı). ---
  // Tek alanlı where — composite index gerektirmez. clubId'li meydan okumalar
  // için userId eşlemesi client-side yapılır.
  const completionsQuery = useMemoFirebase(
    () =>
      db
        ? query(
            collection(db, COLLECTIONS.volunteerCompletions),
            where('ngoApproved', '==', true),
          )
        : null,
    [db],
  );
  const { data: completions } = useCollection<CompletionLite>(completionsQuery);

  // --- Giriş yapan kullanıcının kulüpleri. ---
  const myDocRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: myDoc } = useDoc<MemberLite>(myDocRef);

  const myClubIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    (myDoc?.joinedClubs ?? []).forEach((c) => ids.add(c));
    (myDoc?.volunteerInfo?.clubMemberships ?? []).forEach((c) => ids.add(c));
    if (myDoc?.managedClubId) ids.add(myDoc.managedClubId);
    return ids;
  }, [myDoc]);

  // Kulüp bazlı meydan okuma var mı? Varsa users koleksiyonunu çek (üye→userId).
  const hasClubChallenge = useMemo(
    () => (rawChallenges ?? []).some((c) => !!c.clubId),
    [rawChallenges],
  );
  const usersQuery = useMemoFirebase(
    () => (db && hasClubChallenge ? collection(db, COLLECTIONS.users) : null),
    [db, hasClubChallenge],
  );
  const { data: allMembers } = useCollection<MemberLite>(usersQuery);

  // clubId → o kulübün üye userId kümesi.
  const clubMemberIds = useMemo<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    if (!allMembers) return map;
    const wantedClubs = new Set(
      (rawChallenges ?? []).map((c) => c.clubId).filter((v): v is string => !!v),
    );
    for (const clubId of wantedClubs) {
      const set = new Set<string>();
      for (const m of allMembers) {
        if (isMemberOf(m, clubId)) set.add(m.id);
      }
      map.set(clubId, set);
    }
    return map;
  }, [allMembers, rawChallenges]);

  // ngoId → o STK'ya ait onaylı tamamlamalar (hızlı arama için grupla).
  const completionsByNgo = useMemo<Map<string, CompletionLite[]>>(() => {
    const map = new Map<string, CompletionLite[]>();
    for (const c of completions ?? []) {
      if (!c.ngoId) continue;
      const arr = map.get(c.ngoId);
      if (arr) arr.push(c);
      else map.set(c.ngoId, [c]);
    }
    return map;
  }, [completions]);

  // --- Her meydan okuma için ilerlemeyi hesapla + sırala. ---
  const challenges = useMemo<ChallengeWithProgress[]>(() => {
    if (!rawChallenges) return [];
    const all = completions ?? [];

    return rawChallenges
      .map((ch) => {
        let current = 0;

        if (ch.clubId) {
          // Kulüp kapsamı: üye userId'lerine düşen onaylı tamamlamalar.
          const memberSet = clubMemberIds.get(ch.clubId);
          if (memberSet && memberSet.size > 0) {
            for (const c of all) {
              if (c.userId && memberSet.has(c.userId)) {
                current += contribution(c, ch.metric);
              }
            }
          }
        } else if (ch.ngoId) {
          // STK kapsamı: ngoId eşleşen onaylı tamamlamalar.
          const arr = completionsByNgo.get(ch.ngoId) ?? [];
          for (const c of arr) current += contribution(c, ch.metric);
        }

        const target = Number(ch.target) || 0;
        const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
        const isMine = !!ch.clubId && myClubIds.has(ch.clubId);

        return {
          ...ch,
          _current: current,
          _pct: pct,
          _daysLeft: daysLeft(ch.endsAt),
          _isMine: isMine,
        };
      })
      .sort((a, b) => {
        // Önce kulübüm meydan okumaları, sonra bitişe en yakın olan.
        if (a._isMine !== b._isMine) return a._isMine ? -1 : 1;
        const da = a._daysLeft ?? Number.MAX_SAFE_INTEGER;
        const dbb = b._daysLeft ?? Number.MAX_SAFE_INTEGER;
        return da - dbb;
      });
  }, [rawChallenges, completions, clubMemberIds, completionsByNgo, myClubIds]);

  const mine = useMemo(() => challenges.filter((c) => c._isMine), [challenges]);
  const others = useMemo(() => challenges.filter((c) => !c._isMine), [challenges]);

  return (
    <div
      className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6"
      style={{ paddingBottom: 'calc(8rem + var(--sat, 0px))' }}
    >
      {/* Başlık */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <h1 className="font-headline text-2xl font-bold">Takım Meydan Okumaları</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Kulüp ve takımların birlikte ulaştığı gönüllülük hedefleri. İlerlemeyi
          birlikte yükseltin.
        </p>
      </header>

      {challengesLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* Kulübümün meydan okumaları — öne çıkar. */}
          {mine.length > 0 && (
            <section className="space-y-3">
              <SectionHeading
                icon={<Users className="h-4 w-4 text-primary" aria-hidden />}
                title="Kulübümün meydan okumaları"
                count={mine.length}
              />
              <div className="space-y-3">
                {mine.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
                  >
                    <ChallengeCard ch={ch} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Diğer / tüm meydan okumalar. */}
          {others.length > 0 && (
            <section className="space-y-3">
              <SectionHeading
                icon={<Target className="h-4 w-4 text-primary" aria-hidden />}
                title={mine.length > 0 ? 'Diğer meydan okumalar' : 'Aktif meydan okumalar'}
                count={others.length}
              />
              <div className="space-y-3">
                {others.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
                  >
                    <ChallengeCard ch={ch} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
