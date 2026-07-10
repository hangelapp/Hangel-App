'use client';

/**
 * /volunteering/leaderboard — Gönüllülük Lider Tablosu + Takım/Kulüp Meydan Okuması.
 *
 * YENİ, bağımsız sayfa. Paylaşılan dosyalara (types.ts, volunteering/page.tsx,
 * nav) DOKUNMAZ. Nav bağlantısını proje sahibi ekleyecek.
 *
 * Veri kaynağı: Firestore `users` koleksiyonu.
 *  - Bireysel sekme: en yüksek `impactScore`'a sahip ilk ~50 gönüllü
 *    (server-side orderBy + limit → tüm koleksiyon indirilmez).
 *  - Kulübüm sekmesi: kullanıcının doc'undaki `joinedClubs` (club id dizisi)
 *    kesişimiyle aynı kulüpteki gönüllüler sıralanır. `joinedClubs` yoksa bu
 *    sekme hiç render edilmez (yalnız bireysel gösterilir).
 *
 * Mobil-öncelikli, `--sat` safe-area'ya saygılı, Türkçe literal.
 */

import { useMemo, useState } from 'react';
import {
  collection,
  doc,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import { Trophy, Medal, Users, User as UserIcon, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { COLLECTIONS } from '@/firebase/collections';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
  useUser,
} from '@/firebase';
import { cn } from '@/lib/utils';

// Lider tablosunda gösterilecek üst sıra sayısı.
const LEADERBOARD_LIMIT = 50;

// users doc'undan yalnız tabloyu besleyen alanlar. types.ts'e DOKUNMADAN
// yerel, gevşek bir shape tanımlanır (opsiyonel alanlar eksik olabilir).
type BoardUser = {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  impactScore?: number;
  joinedClubs?: string[];
  managedClubId?: string;
};

type ClubDoc = {
  id: string;
  name?: string;
  shortName?: string;
};

// Ranked = tabloya girmiş, sıra numarası atanmış kullanıcı.
type RankedUser = BoardUser & { _rank: number; _score: number };

/** Ada göre 1-2 harflik baş harf (avatar fallback). */
function initials(name?: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr');
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr');
}

/** impactScore'a göre azalan sırala, puanı 0'dan büyük olanları al, ilk 50. */
function rank(users: BoardUser[] | null | undefined): RankedUser[] {
  if (!users) return [];
  return users
    .map((u) => ({ ...u, _score: Number(u.impactScore) || 0 }))
    .filter((u) => u._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, LEADERBOARD_LIMIT)
    .map((u, idx) => ({ ...u, _rank: idx + 1 }));
}

// İlk 3 için madalya vurgu paleti (altın / gümüş / bronz).
const MEDALS: Record<number, { ring: string; badge: string; icon: string }> = {
  1: {
    ring: 'ring-2 ring-amber-400',
    badge: 'bg-amber-400 text-amber-950',
    icon: 'text-amber-500',
  },
  2: {
    ring: 'ring-2 ring-slate-300',
    badge: 'bg-slate-300 text-slate-800',
    icon: 'text-slate-400',
  },
  3: {
    ring: 'ring-2 ring-orange-400',
    badge: 'bg-orange-400 text-orange-950',
    icon: 'text-orange-500',
  },
};

function RankRow({ user, isMe }: { user: RankedUser; isMe: boolean }) {
  const medal = MEDALS[user._rank];
  return (
    <Card
      variant="solid"
      className={cn(
        'overflow-hidden transition-colors',
        isMe && 'ring-2 ring-primary',
      )}
    >
      <CardContent className="flex items-center gap-3 p-3">
        {/* Sıra / madalya */}
        <div className="flex w-9 shrink-0 items-center justify-center">
          {medal ? (
            <Medal className={cn('h-6 w-6', medal.icon)} aria-hidden />
          ) : (
            <span className="text-base font-bold tabular-nums text-muted-foreground">
              {user._rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className={cn('h-11 w-11', medal?.ring)}>
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name ?? ''} /> : null}
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>

        {/* Ad + rozet */}
        <div className="min-w-0 flex-grow">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name || 'Gönüllü'}
            {isMe && (
              <span className="ml-1.5 text-xs font-medium text-primary">(Sen)</span>
            )}
          </p>
          {user.username ? (
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          ) : null}
        </div>

        {/* Etki puanı */}
        <div className="flex shrink-0 flex-col items-end">
          <span className="flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            {user._score.toLocaleString('tr-TR')}
          </span>
          <span className="text-[11px] text-muted-foreground">etki puanı</span>
        </div>
      </CardContent>
    </Card>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
        >
          <div className="h-6 w-9 animate-pulse rounded bg-muted" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
          <div className="flex-grow space-y-1.5">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <Card variant="solid" className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10">
          <Trophy className="h-7 w-7 text-primary" aria-hidden />
        </span>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

function Board({
  users,
  isLoading,
  myId,
  emptyTitle,
  emptyDesc,
}: {
  users: BoardUser[] | null | undefined;
  isLoading: boolean;
  myId?: string;
  emptyTitle: string;
  emptyDesc: string;
}) {
  const ranked = useMemo(() => rank(users), [users]);

  if (isLoading) return <BoardSkeleton />;
  if (ranked.length === 0) return <EmptyState title={emptyTitle} desc={emptyDesc} />;

  return (
    <div className="space-y-2">
      {ranked.map((u, idx) => (
        <div
          key={u.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
        >
          <RankRow user={u} isMe={!!myId && u.id === myId} />
        </div>
      ))}
    </div>
  );
}

export default function VolunteeringLeaderboardPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();

  const [tab, setTab] = useState<'individual' | 'club'>('individual');

  // --- Bireysel: en yüksek impactScore'lu ilk 50 (server-side) ---
  const individualQuery = useMemoFirebase(
    () =>
      db
        ? query(
            collection(db, COLLECTIONS.users),
            orderBy('impactScore', 'desc'),
            limit(LEADERBOARD_LIMIT),
          )
        : null,
    [db],
  );
  const { data: topUsers, isLoading: topLoading } = useCollection<BoardUser>(individualQuery);

  // --- Giriş yapan kullanıcının doc'u: joinedClubs / rütbe vurgusu için ---
  const myDocRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: myDoc } = useDoc<BoardUser>(myDocRef);

  const myClubIds = useMemo<string[]>(() => {
    const joined = Array.isArray(myDoc?.joinedClubs) ? myDoc!.joinedClubs! : [];
    const managed = myDoc?.managedClubId ? [myDoc.managedClubId] : [];
    return Array.from(new Set([...joined, ...managed]));
  }, [myDoc]);

  const hasClub = myClubIds.length > 0;

  // --- Kulübüm: aynı kulüpteki gönüllüler ---
  // users içinde `joinedClubs` array için array-contains-any gerekli; ancak
  // birden çok kulüp + impactScore orderBy karma indeks ister. Basit ve indeks
  // gerektirmeyen yol: kulüp sekmesi açıkken tüm koleksiyonu çekip client-side
  // kesişim + sırala. Sekme açılmadan sorgu tetiklenmez (query null).
  const clubMembersQuery = useMemoFirebase(
    () => (db && tab === 'club' && hasClub ? collection(db, COLLECTIONS.users) : null),
    [db, tab, hasClub],
  );
  const { data: allUsers, isLoading: clubLoading } = useCollection<BoardUser>(clubMembersQuery);

  const clubMembers = useMemo<BoardUser[]>(() => {
    if (!allUsers || myClubIds.length === 0) return [];
    const clubSet = new Set(myClubIds);
    return allUsers.filter((u) => {
      const joined = Array.isArray(u.joinedClubs) && u.joinedClubs.some((c) => clubSet.has(c));
      const manages = u.managedClubId ? clubSet.has(u.managedClubId) : false;
      return joined || manages;
    });
  }, [allUsers, myClubIds]);

  // Kulüp adını çöz (tek kulüp varsa başlıkta göster).
  const primaryClubRef = useMemoFirebase(
    () => (db && hasClub ? doc(db, COLLECTIONS.clubs, myClubIds[0]) : null),
    [db, hasClub, myClubIds],
  );
  const { data: primaryClub } = useDoc<ClubDoc>(primaryClubRef);
  const clubLabel =
    primaryClub?.shortName || primaryClub?.name || (myClubIds.length > 1 ? 'Kulüplerim' : 'Kulübüm');

  return (
    <div
      className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6"
      style={{ paddingBottom: 'calc(8rem + var(--sat, 0px))' }}
    >
      {/* Başlık */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold font-headline">Lider Tablosu</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gönüllülük etki puanına göre topluluğun en aktif gönüllüleri.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'individual' | 'club')} className="w-full">
        {/* Kulüp yoksa yalnız bireysel sekme gösterilir. */}
        <TabsList className={cn('grid w-full rounded-2xl', hasClub ? 'grid-cols-2' : 'grid-cols-1')}>
          <TabsTrigger value="individual" className="min-h-[44px] rounded-xl text-sm">
            <UserIcon className="mr-1.5 hidden h-4 w-4 sm:inline-block" aria-hidden />
            Bireysel
          </TabsTrigger>
          {hasClub && (
            <TabsTrigger value="club" className="min-h-[44px] rounded-xl text-sm">
              <Users className="mr-1.5 hidden h-4 w-4 sm:inline-block" aria-hidden />
              <span className="line-clamp-1">{clubLabel}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="individual" className="mt-4">
          <Board
            users={topUsers}
            isLoading={topLoading}
            myId={authUser?.uid}
            emptyTitle="Henüz sıralama yok"
            emptyDesc="Bir gönüllülük faaliyetini tamamla ve etki puanı kazanarak tabloda yerini al."
          />
        </TabsContent>

        {hasClub && (
          <TabsContent value="club" className="mt-4 space-y-3">
            <Card variant="solid" className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-3 p-3">
                <Users className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{clubLabel}</span> takımının gönüllüleri —
                  kulübünle birlikte tabloyu yükselt.
                </p>
              </CardContent>
            </Card>
            <Board
              users={clubMembers}
              isLoading={clubLoading}
              myId={authUser?.uid}
              emptyTitle="Kulübünde henüz sıralama yok"
              emptyDesc="Kulüp arkadaşlarını gönüllülüğe davet et; ilk etki puanını kazanan tabloyu başlatsın."
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
