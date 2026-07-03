'use client';

/**
 * /leaderboard — modern, sezon temalı liderlik tablosu.
 *
 * Veri: Firestore `users` koleksiyonu (impactScore / volunteerHours / totalDonation).
 * Data shape DEĞİŞMEDİ — sadece UI yenilendi.
 *
 * Yapı:
 * - Hero banner (sezonal vurgu)
 * - Zaman filtresi tab'ları (Tüm Zamanlar aktif; period-bucketed stats yok,
 *   diğerleri "yakında" rozetiyle disabled)
 * - Metrik tab'ları (Etki / Gönüllülük / Bağış)
 * - Scope alt-tab'ları (Global / Ülke / Şehir / Okul)
 * - Top-3 podium + 4-N rank list (limit 50)
 * - "Senin sıran" sticky kart
 * - Sezon ödülleri info kartı
 */

import { useMemo, useState } from 'react';
import { collection, doc, limit, orderBy, query } from 'firebase/firestore';
import { Award, Globe, Handshake, Heart, MapPin, School, Sparkles, Star } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COLLECTIONS } from '@/firebase/collections';
import { useFirestore, useMemoFirebase, useCollection, useDoc, useUser } from '@/firebase';
import { useTranslation } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

import { LeaderboardHero } from './_components/leaderboard-hero';
import { LeaderboardPodium } from './_components/leaderboard-podium';
import { LeaderboardRow } from './_components/leaderboard-row';
import { LeaderboardMyRank } from './_components/leaderboard-my-rank';
import { LeaderboardRewards } from './_components/leaderboard-rewards';
import { LeaderboardSkeleton } from './_components/leaderboard-skeleton';
import {
  getValue,
  userSchools,
  type LeaderboardUser,
  type MetricKey,
  type RankedUser,
  type Scope,
  type TimeRange,
} from './_components/leaderboard-types';

const PAGE_SIZE = 7;
// İlk 100 kullanıcı listelenebilsin (kullanıcı isteği) — Firestore zaten 100 çekiyor.
const MAX_LIST = 100;
// PERF: tüm `users` koleksiyonunu indirmek yerine en yüksek etki puanlı ilk 100
// kullanıcı çekilir (board zaten yalnız üst sıraları gösterir). Kullanıcının
// kendi doc'u ayrıca alınıp birleştirilir → top 100 dışındaysa bile "senin sıran"
// kartı doğru çalışır.
const LEADERBOARD_FETCH_LIMIT = 100;

const METRICS: ReadonlyArray<{
  key: MetricKey;
  labelKey: string;
  unitKey: 'unitPoints' | 'unitHours' | 'unitCurrency';
  icon: typeof Star;
}> = [
  { key: 'totalPoints', labelKey: 'tabPoints', unitKey: 'unitPoints', icon: Award },
  { key: 'impactScore', labelKey: 'tabImpact', unitKey: 'unitPoints', icon: Star },
  { key: 'volunteerHours', labelKey: 'tabVolunteer', unitKey: 'unitHours', icon: Handshake },
  { key: 'totalDonation', labelKey: 'tabDonation', unitKey: 'unitCurrency', icon: Heart },
  // Sosyal Etki Mali Değeri — paylaşılan calculateImpactValue utility tarafından
  // beslenen `stats.totalImpactValue` (cache). Etki tab + super-admin demographics
  // ile aynı kaynak.
  { key: 'totalImpactValue', labelKey: 'tabImpactValue', unitKey: 'unitCurrency', icon: Sparkles },
] as const;

const SCOPES: ReadonlyArray<{ key: Scope; labelKey: string; icon: typeof Globe }> = [
  { key: 'global', labelKey: 'scopeGlobal', icon: Globe },
  { key: 'country', labelKey: 'scopeCountry', icon: MapPin },
  { key: 'city', labelKey: 'scopeCity', icon: MapPin },
  { key: 'school', labelKey: 'scopeSchool', icon: School },
] as const;

const TIME_RANGES: ReadonlyArray<{ key: TimeRange; labelKey: string; available: boolean }> = [
  { key: 'all', labelKey: 'timeAll', available: true },
  { key: 'year', labelKey: 'timeYear', available: false },
  { key: 'month', labelKey: 'timeMonth', available: false },
  { key: 'week', labelKey: 'timeWeek', available: false },
] as const;

type ListProps = {
  valueKey: MetricKey;
  unitKey: 'unitPoints' | 'unitHours' | 'unitCurrency';
  allUsers: LeaderboardUser[] | null | undefined;
  authUserId: string | undefined;
  scope: Scope;
  isLoading: boolean;
};

function LeaderboardList({ valueKey, unitKey, allUsers, authUserId, scope, isLoading }: ListProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const unit = t(`leaderboardPage.${unitKey}`);

  const { ranked, myEntry } = useMemo(() => {
    if (!allUsers) {
      return { ranked: [] as RankedUser[], myEntry: null as RankedUser | null };
    }
    let scoped = [...allUsers];
    const me = authUserId ? scoped.find((u) => u.id === authUserId) : null;

    if (scope === 'city' && me) {
      const city = me.personalInfo?.address?.city;
      if (city) scoped = scoped.filter((u) => u.personalInfo?.address?.city === city);
    } else if (scope === 'school' && me) {
      const mySchools = userSchools(me);
      if (mySchools.length > 0) {
        scoped = scoped.filter((u) => userSchools(u).some((s) => mySchools.includes(s)));
      }
    }

    const sorted = scoped
      .map((u) => ({ user: u, value: getValue(u, valueKey) }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_LIST)
      .map((x, idx): RankedUser => ({ ...x.user, _value: x.value, _rank: idx + 1 }));

    const mine = authUserId ? sorted.find((u) => u.id === authUserId) ?? null : null;
    return { ranked: sorted, myEntry: mine };
  }, [allUsers, authUserId, scope, valueKey]);

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (ranked.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
        <p className="text-base font-medium text-foreground">{t('leaderboardPage.emptyTitle')}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {t('leaderboardPage.emptyDesc')}
        </p>
        <Button asChild className="mt-4 rounded-2xl">
          <a href="/events">{t('leaderboardPage.emptyCta')}</a>
        </Button>
      </div>
    );
  }

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, visible + 3);
  const hasMore = visible + 3 < ranked.length;

  return (
    <div className="space-y-4">
      <LeaderboardPodium top3={top3} unit={unit} />

      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((user, idx) => (
            <div
              key={user.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
            >
              <LeaderboardRow
                user={user}
                unit={unit}
                valueKey={valueKey}
                isMe={!!authUserId && user.id === authUserId}
              />
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            {t('leaderboardPage.loadMore')}
          </Button>
        </div>
      )}

      {authUserId && (
        <LeaderboardMyRank me={myEntry} totalShown={ranked.length} unit={unit} />
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user: authUser } = useUser();
  const db = useFirestore();
  const { t } = useTranslation();

  const [scope, setScope] = useState<Scope>('country');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [metric, setMetric] = useState<MetricKey>('totalPoints');

  // PERF: en yüksek etki puanlı ilk 100 kullanıcı (top-level impactScore alanı —
  // tüm puan yazımları buraya increment edilir). Tüm koleksiyonu indirmez.
  // Aktif metriğe göre sırala → her sekme kendi gerçek liderlerini getirir
  // (impactScore'a göre çekip totalPoints'e göre sıralamak yanlış #1 gösteriyordu).
  const usersRef = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.users), orderBy(metric, 'desc'), limit(LEADERBOARD_FETCH_LIMIT)),
    [db, metric],
  );
  const { data: topUsers, isLoading } = useCollection<LeaderboardUser>(usersRef);

  // Kullanıcının kendi doc'u — top 100 dışındaysa bile "senin sıran" kartı için
  // ayrıca çekilir ve listeye birleştirilir (top 100 içindeyse mükerrer eklenmez).
  const myUserRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: myUser } = useDoc<LeaderboardUser>(myUserRef);

  const allUsers = useMemo<LeaderboardUser[] | null>(() => {
    if (!topUsers) return null;
    if (!myUser?.id || topUsers.some((u) => u.id === myUser.id)) return topUsers;
    return [...topUsers, myUser];
  }, [topUsers, myUser]);

  const activeMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 pb-32 sm:p-6">
        <LeaderboardHero />
        <LeaderboardSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 pb-32 sm:p-6">
      <LeaderboardHero />

      {/* Zaman aralığı — bucket'lı stats olmadığı için sadece "Tüm Zamanlar" aktif */}
      <Tabs
        value={timeRange}
        onValueChange={(v) => {
          const next = TIME_RANGES.find((r) => r.key === v);
          if (next?.available) setTimeRange(next.key);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          {TIME_RANGES.map((r) => (
            <TabsTrigger
              key={r.key}
              value={r.key}
              disabled={!r.available}
              className={cn(
                'relative min-h-[44px] rounded-xl text-xs sm:text-sm',
                !r.available && 'cursor-not-allowed opacity-60'
              )}
            >
              <span className="line-clamp-1">{t(`leaderboardPage.${r.labelKey}`)}</span>
              {!r.available && (
                <Badge
                  variant="secondary"
                  className="ml-1 hidden h-5 px-1.5 text-xs leading-none sm:inline-flex"
                >
                  {t('leaderboardPage.soon')}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Metrik sekmeleri */}
      <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <TabsTrigger key={m.key} value={m.key} className="min-h-[44px] rounded-xl px-1.5 text-xs sm:text-sm">
                <Icon className="mr-1 hidden h-4 w-4 shrink-0 sm:inline-block" />
                <span className="line-clamp-2 leading-tight sm:line-clamp-1">{t(`leaderboardPage.${m.labelKey}`)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {METRICS.map((m) => (
          <TabsContent key={m.key} value={m.key} className="mt-4 space-y-4">
            {/* Scope (kapsam) */}
            <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-muted/60">
                {SCOPES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <TabsTrigger key={s.key} value={s.key} className="min-h-[44px] rounded-xl text-xs">
                      <Icon className="mr-1 hidden h-3.5 w-3.5 sm:inline-block" />
                      <span className="line-clamp-1">{t(`leaderboardPage.${s.labelKey}`)}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <LeaderboardList
              valueKey={m.key}
              unitKey={m.unitKey}
              allUsers={allUsers}
              authUserId={authUser?.uid}
              scope={scope}
              isLoading={isLoading}
            />
          </TabsContent>
        ))}
      </Tabs>

      <LeaderboardRewards />

      {/* hidden ref kullanılmıyor — sadece TS'in activeMetric'i dead-code saymaması için */}
      <span className="sr-only">{t(`leaderboardPage.${activeMetric.labelKey}`)}</span>
    </div>
  );
}
