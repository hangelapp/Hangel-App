'use client'

import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle, Lock, Award } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { computeAreaPoints, mapCategoryToBadgeArea, enrichBadges, type TierEnrichedBadge } from '@/lib/badge-points';
import type { Application } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Badge as BadgeType, BadgeLevel } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { groupBy } from 'lodash';
import { Progress } from '@/components/ui/progress';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { EtkiTabContent } from '@/components/profile/etki-tab-content';
import { CertificatesTab } from '@/components/profile/certificates-tab';

const levelColors: Record<BadgeLevel, { bg: string; text: string }> = {
  'Bakır':  { bg: 'bg-orange-700/15',  text: 'text-orange-800 dark:text-orange-300' },
  'Bronz':  { bg: 'bg-amber-700/20',   text: 'text-amber-800 dark:text-amber-300' },
  'Gümüş':  { bg: 'bg-gray-400/20',    text: 'text-gray-500 dark:text-gray-300' },
  'Altın':  { bg: 'bg-yellow-500/20',  text: 'text-yellow-600 dark:text-yellow-300' },
  'Platin': { bg: 'bg-cyan-300/20',    text: 'text-cyan-500 dark:text-cyan-300' },
};

const LEVEL_ORDER: BadgeLevel[] = ['Bakır', 'Bronz', 'Gümüş', 'Altın', 'Platin'];

/**
 * PRD kuralı: kullanıcı bir STK'yı bağış/destek (supportedNgos) veya gönüllülük
 * (volunteerNgos) için seçtiğinde, o STK'nın kategorisinin eşlendiği rozet
 * alanına +10 puan kazandırır. Her nitelikli seçim için 10 puan.
 */
const SELECTION_AREA_POINTS = 10;

type NextBadgeRow = TierBadge & { tierCurrent: number; tierDelta: number; tierProgress: number };

const NextBadgeGoal = ({ nextBadge, t }: { nextBadge: NextBadgeRow | null; t: (key: string) => string }) => {
    if (!nextBadge) {
        return (
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" /> {t('dashboard.badges.nextGoalTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.badges.nextGoalEmptyDesc')}
                    </p>
                </CardContent>
            </Card>
        );
    }
    const Icon = nextBadge.iconName;
    const remaining = Math.max(nextBadge.tierDelta - nextBadge.tierCurrent, 0);
    return (
        <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> {t('dashboard.badges.nextGoalTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-2xl shadow-sm bg-white')}>
                        <Icon className={cn('h-8 w-8', levelColors[nextBadge.level].text)} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="font-bold text-sm">{nextBadge.name}</p>
                            <p className="text-xs font-bold text-primary">%{Math.round(nextBadge.tierProgress)}</p>
                        </div>
                        <Progress value={nextBadge.tierProgress} className="h-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {nextBadge.tierCurrent.toLocaleString('tr-TR')} / {nextBadge.tierDelta.toLocaleString('tr-TR')} {t('dashboard.badges.pointsWord')} ({t('dashboard.badges.remainingLabel')}: {remaining.toLocaleString('tr-TR')})
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Tier-based ilerleme:
 * Bir alanda Bakır=100, Bronz=250, Gümüş=500, areaPoints=350 ise:
 *   - Bakır: 100/100 TAMAMLANDI
 *   - Bronz: 150/150 TAMAMLANDI (delta = 250-100)
 *   - Gümüş: 100/250 (areaPoints-Bronz = 100, delta = 500-250 = 250)
 * Yani 1. kademe dolduğunda 2. kademenin sayacı SIFIRDAN başlar.
 */
type TierBadge = BadgeType & { prevTierRequired: number };

const VectorBadge = ({ badge, t }: { badge: TierBadge; t: (key: string) => string }) => {
    const isEarned = badge.currentPoints >= badge.pointsRequired;
    const Icon = badge.iconName;
    const colors = levelColors[badge.level];

    const tierDelta = Math.max(1, badge.pointsRequired - badge.prevTierRequired);
    const tierCurrent = Math.max(0, Math.min(tierDelta, badge.currentPoints - badge.prevTierRequired));
    const progress = Math.min((tierCurrent / tierDelta) * 100, 100);
    const pointsRemaining = Math.max(tierDelta - tierCurrent, 0);

    // PRD: hak kazanılmadıkça grayscale; 1+ puan alındıysa progress bar narçiçeği
    // (#E34234) renkli, tamamlandığında rozetin ZEMİNİ ve ikonu da narçiçeği rengini alır.
    const hasAnyProgress = badge.currentPoints > badge.prevTierRequired;
    return (
        <Card
            className={cn(
                "rounded-[2rem] border-black/5 flex flex-col items-center text-center p-6 transition-all hover:shadow-xl group",
                !isEarned && !hasAnyProgress && "grayscale opacity-50",
                isEarned && "border-[#E34234]/40 shadow-md",
            )}
            style={isEarned ? { backgroundColor: '#FFF3F1' } : undefined}
        >
            <div
                className={cn(
                    'relative w-20 h-20 flex items-center justify-center rounded-3xl transition-all duration-500 mb-4 group-hover:scale-110',
                    isEarned ? '' : hasAnyProgress ? colors.bg : 'bg-muted',
                )}
                style={isEarned ? { backgroundColor: '#E34234' } : undefined}
            >
                <Icon
                    className={cn(
                        'w-10 h-10 transition-colors',
                        isEarned ? 'text-white' : hasAnyProgress ? colors.text : 'text-muted-foreground/60',
                    )}
                />
                {isEarned ? (
                    <div className="absolute -top-2 -right-2 rounded-full p-1.5 text-white shadow-lg border-2 border-white" style={{ backgroundColor: '#E34234' }}>
                        <CheckCircle className="h-3 w-3" />
                    </div>
                ) : (
                    <div className="absolute -top-2 -right-2 bg-muted-foreground/30 rounded-full p-1.5 text-white shadow-md border-2 border-white">
                        <Lock className="h-3 w-3" />
                    </div>
                )}
            </div>
            <div className="space-y-1 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{badge.level}</p>
                <h4 className="font-bold text-sm leading-tight h-10 flex items-center justify-center overflow-hidden"><span className="line-clamp-2 break-words">{badge.name}</span></h4>
                <div className="pt-2">
                    {/* Narçiçeği (#E34234) ilerleme çubuğu — profile sayfası ile aynı renk */}
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, backgroundColor: '#E34234' }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mt-2">
                        <span className="text-muted-foreground">
                            {tierCurrent.toLocaleString('tr-TR')} / {tierDelta.toLocaleString('tr-TR')}
                        </span>
                        {isEarned ? (
                            <span style={{ color: '#E34234' }}>{t('dashboard.badges.completedLabel')}</span>
                        ) : (
                            <span style={{ color: '#E34234' }}>{pointsRemaining.toLocaleString('tr-TR')} {t('dashboard.badges.remainingShort')}</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default function MyBadgesPage() {
    const { t } = useTranslation();
    const { user: authUser } = useUser();
    const db = useFirestore();
    const userDocRef = useMemoFirebase(
        () => authUser ? doc(db, COLLECTIONS.users, authUser.uid) : null,
        [db, authUser?.uid],
    );
    const { data: userData } = useDoc(userDocRef);

    // Sertifikalar: users/{uid}/certificates alt koleksiyonu. Etkinlik sertifikaları
    // title yerine eventName/ngoName/completedAt tutar → ortak şekle normalize edilir,
    // tür (event/volunteer) belirlenir (gönüllülük ve etkinlik sertifikası farklı).
    type RawCertDoc = {
        id?: string;
        title?: string; eventName?: string;
        organization?: string; ngoName?: string;
        date?: string; completedAt?: { seconds?: number } | string | number;
        type?: string;
        code?: string; organizerLogoUrl?: string;
    };
    type CertificateDoc = { id?: string; title: string; organization: string; date: string; kind: 'event' | 'volunteer'; code?: string; logoUrl?: string };
    const certificatesRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.certificates) : null),
        [db, authUser?.uid],
    );
    const { data: certificatesData } = useCollection<RawCertDoc>(certificatesRef);

    // Firestore Timestamp / sayı / ISO → "YYYY-MM-DD".
    const tsToDateStr = (v: RawCertDoc['completedAt']): string => {
        if (!v) return '';
        if (typeof v === 'string') return v.slice(0, 10);
        if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10);
        if (typeof v === 'object' && typeof v.seconds === 'number') return new Date(v.seconds * 1000).toISOString().slice(0, 10);
        return '';
    };

    // Onaylı gönüllülük katılımları → sertifika.
    // Veri modeli: applications koleksiyonunda type === 'Gönüllülük' ve
    // status === 'Onaylandı' (STK yetkilisi ngo-admin/volunteer ekranından onaylar:
    // updateDoc(applications/{id}, { status: 'Onaylandı', reviewedAt, reviewedBy })).
    // Bu, "katılımı kuruluşun yetkili kişisi tarafından ONAYLANAN gönüllüler"
    // koşulunu karşılar.
    const approvedAppsQuery = useMemoFirebase(
        () => (db && authUser ? query(collection(db, COLLECTIONS.applications), where('userId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    const { data: approvedAppsData } = useCollection<Application>(approvedAppsQuery);

    // Onaylı gönüllülük başvurularını sertifika satırına dönüştür.
    const approvedCertificates = useMemo<CertificateDoc[]>(() => {
        return (approvedAppsData ?? [])
            .filter(app => app.type === 'Gönüllülük' && app.status === 'Onaylandı')
            .map(app => ({
                id: `app-${app.id}`,
                title: app.title,
                organization: app.org || '',
                date: app.date || '',
                kind: 'volunteer' as const,
            }));
    }, [approvedAppsData]);

    // Manuel girilen sertifikalar (users/{uid}/certificates) + onaylı katılımlar.
    // Aynı başlık+kuruluş tekrarını önlemek için dedupe uygula.
    const certificates = useMemo<CertificateDoc[]>(() => {
        // Etkinlik sertifikaları eventName/ngoName/completedAt tutar → ortak şekle indir.
        const manual: CertificateDoc[] = (certificatesData ?? []).map((c) => ({
            id: c.id,
            title: (c.title || c.eventName || '').trim(),
            organization: (c.organization || c.ngoName || '').trim(),
            date: c.date || tsToDateStr(c.completedAt),
            kind: (c.type === 'volunteering' || c.type === 'volunteer') ? 'volunteer' : 'event',
            code: c.code,
            logoUrl: c.organizerLogoUrl,
        }));
        const seen = new Set(manual.map(c => `${c.title}|${c.organization}`));
        const merged: CertificateDoc[] = [...manual];
        for (const c of approvedCertificates) {
            const key = `${c.title}|${c.organization}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(c);
        }
        // Adsız sertifikaları gösterme (boş başlıklı kayıt = açılamaz/anlamsız).
        return merged.filter((c) => (c.title || '').trim().length > 0);
    }, [certificatesData, approvedCertificates]);

    // Aktivite kaynakları: areaPoints'i kullanıcının gerçek bağış / gönüllülük / davetinden hesapla.
    type DonationDoc = { id?: string; status?: string; ngoIds?: string[]; ngo?: string[] };
    type NgoDoc = { id?: string; category?: string };
    type PastVolunteeringDoc = { id?: string; points?: number; socialArea?: string; area?: string; ngoId?: string; organization?: string };

    const donationsQuery = useMemoFirebase(
        () => (db && authUser ? query(collection(db, COLLECTIONS.donations), where('userId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    const { data: donationsData } = useCollection<DonationDoc>(donationsQuery);
    const donations = useMemo(() => donationsData ?? [], [donationsData]);

    const ngosRef = useMemoFirebase(
        () => (db ? collection(db, COLLECTIONS.ngos) : null),
        [db],
    );
    const { data: ngosData } = useCollection<NgoDoc>(ngosRef);
    const ngoCategoryById = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        (ngosData ?? []).forEach(n => {
            if (n.id && typeof n.category === 'string') map[n.id] = n.category;
        });
        return map;
    }, [ngosData]);

    const pastVolunteeringRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.pastVolunteering) : null),
        [db, authUser?.uid],
    );
    const { data: pastVolunteeringData } = useCollection<PastVolunteeringDoc>(pastVolunteeringRef);
    const pastVolunteering = useMemo(() => pastVolunteeringData ?? [], [pastVolunteeringData]);

    // Top-level veya stats.* — invite akışı top-level yazıyor, signup stats altına yazıyor.
    type UserDataLike = {
        impactScore?: number;
        stats?: { impactScore?: number };
        areaPoints?: Record<string, number>;
        inviteCount?: number;
        supportedNgos?: string[];
        volunteerNgos?: string[];
    };

    // Kullanıcının bağış/destek için seçtiği STK'lar (ngos/[id] "Destekle" akışı yazar).
    const supportedNgoIds = useMemo<string[]>(
        () => {
            const v = (userData as UserDataLike | undefined)?.supportedNgos;
            return Array.isArray(v) ? v : [];
        },
        [userData]
    );
    // Kullanıcının gönüllülük için seçtiği STK'lar (ngos/[id] "Gönüllü Ol" akışı yazar).
    const volunteerNgoIds = useMemo<string[]>(
        () => {
            const v = (userData as UserDataLike | undefined)?.volunteerNgos;
            return Array.isArray(v) ? v : [];
        },
        [userData]
    );

    // Kullanıcının seçtiği sosyal hassasiyetler (volunteerInfo.interests).
    const userInterests = useMemo<string[]>(() => {
        const raw = (userData as { volunteerInfo?: { interests?: string[] } } | undefined)?.volunteerInfo?.interests;
        return Array.isArray(raw) ? raw.filter(s => typeof s === 'string' && s.trim()) : [];
    }, [userData]);

    // PRD: her nitelikli STK seçimi (bağış VEYA gönüllülük) → o STK kategorisinin
    // eşlendiği rozet alanına +10 puan. Bağış seçimi ve gönüllülük seçimi ayrı
    // sinyaller olduğundan ikisi de ayrı ayrı 10 puan kazandırır.
    // Ayrıca her sosyal hassasiyet seçimi (volunteerInfo.interests) ilgili
    // rozet alanına +10 puan kazandırır.
    const selectionAreaPoints = useMemo<Record<string, number>>(() => {
        const totals: Record<string, number> = {};
        const credit = (areaCandidate: string | undefined | null) => {
            const area = mapCategoryToBadgeArea(areaCandidate);
            if (!area) return;
            totals[area] = (totals[area] || 0) + SELECTION_AREA_POINTS;
        };
        for (const id of supportedNgoIds) credit(ngoCategoryById[id]);
        for (const id of volunteerNgoIds) credit(ngoCategoryById[id]);
        // Hassasiyet seçimleri — her biri +10 puan
        for (const interest of userInterests) credit(interest);
        return totals;
    }, [supportedNgoIds, volunteerNgoIds, ngoCategoryById, userInterests]);
    const impactScore: number = Math.max(
        Number((userData as UserDataLike | undefined)?.impactScore) || 0,
        Number((userData as UserDataLike | undefined)?.stats?.impactScore) || 0,
    );

    // Sosyal alan bazında saklı puan haritası: userData.areaPoints[socialArea] = number
    const storedAreaPoints = useMemo<Record<string, number>>(
        () => (userData as UserDataLike | undefined)?.areaPoints || {},
        [userData]
    );
    const inviteCount = Number((userData as UserDataLike | undefined)?.inviteCount) || 0;

    // Gerçek aktiviteden hesaplanan alan puanları (bağış + gönüllülük + davet).
    const computed = useMemo(
        () => computeAreaPoints({ donations, ngoCategoryById, pastVolunteering, inviteCount }),
        [donations, ngoCategoryById, pastVolunteering, inviteCount]
    );

    // PRD birincil sinyali: supportedNgos/volunteerNgos seçimlerinden gelen 10'luk
    // puanlar (selectionAreaPoints) ile bağış/gönüllülük/davet aktivitesinden
    // hesaplanan puanları (computed) topla; ardından saklı puan ile max al.
    // Böylece her alanda gösterilen değer kullanıcının GERÇEK seçimlerini yansıtır,
    // hiçbir nitelikli seçim yoksa 0 kalır.
    const effectiveAreaPoints = useMemo<Record<string, number>>(() => {
        const merged: Record<string, number> = { ...storedAreaPoints };
        const areas = new Set<string>([...Object.keys(computed), ...Object.keys(selectionAreaPoints)]);
        for (const area of areas) {
            const activity = (Number(computed[area]) || 0) + (Number(selectionAreaPoints[area]) || 0);
            merged[area] = Math.max(Number(merged[area]) || 0, activity);
        }
        return merged;
    }, [storedAreaPoints, computed, selectionAreaPoints]);

    // Saklı puan ile etkin puan farklıysa kullanıcı dokümanına yaz (write-if-changed,
    // hata durumunda non-fatal). Giriş yapılmamışsa yazma; sonsuz döngüye karşı JSON karşılaştır.
    useEffect(() => {
        if (!db || !authUser) return;
        const serialize = (m: Record<string, number>) =>
            JSON.stringify(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));
        if (serialize(storedAreaPoints) === serialize(effectiveAreaPoints)) return;
        (async () => {
            try {
                await updateDoc(doc(db, COLLECTIONS.users, authUser.uid), { areaPoints: effectiveAreaPoints });
            } catch {
                // non-fatal: puan kalıcılaştırması başarısızsa UI yine hesaplanan değerlerle çalışır.
            }
        })();
    }, [db, authUser, storedAreaPoints, effectiveAreaPoints]);

    // Rozetlere effectiveAreaPoints'ten currentPoints + tier-prev hesabı aktar.
    // Profile sayfası ile aynı kaynağı kullanmak için lib/badge-points/enrichBadges
    // çağrılır — her iki sayfa da aynı puanlardan aynı listeyi türetir.
    const enrichedBadges: TierEnrichedBadge[] = useMemo(
        () => enrichBadges(effectiveAreaPoints),
        [effectiveAreaPoints]
    );

    // Sıradaki hedef: en yakın kazanılmamış tier (delta cinsinden kalan puan en az).
    const nextBadge = useMemo<NextBadgeRow | null>(() => {
        const candidates = enrichedBadges
            .filter(b => b.currentPoints < b.pointsRequired)
            .map(b => {
                const tierDelta = Math.max(1, b.pointsRequired - b.prevTierRequired);
                const tierCurrent = Math.max(0, Math.min(tierDelta, b.currentPoints - b.prevTierRequired));
                return {
                    ...b,
                    tierCurrent,
                    tierDelta,
                    tierProgress: Math.min((tierCurrent / tierDelta) * 100, 100),
                    remaining: tierDelta - tierCurrent,
                };
            })
            .sort((a, b) => a.remaining - b.remaining);
        return candidates[0] || null;
    }, [enrichedBadges]);

    // Sosyal alan başlığı altında, seviye sırası ile
    const groupedBadges = useMemo(() => {
        const grouped = groupBy(enrichedBadges, 'socialArea');
        Object.keys(grouped).forEach(area => {
            grouped[area].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
        });
        return grouped;
    }, [enrichedBadges]);

    const earnedCount = enrichedBadges.filter(b => b.currentPoints >= b.pointsRequired).length;

    // Yeni rozet tespiti: kazanılmış rozet id'lerini localStorage'daki son görülen
    // listeyle karşılaştır. Yeni kazanılan(lar) için bildirim doc'u yaz (Cloud
    // Function otomatik push atar). Client-side çünkü rozet puanı client'ta hesaplanıyor.
    useEffect(() => {
        if (!authUser?.uid || !db) return;
        if (enrichedBadges.length === 0) return;
        const earnedIds = enrichedBadges
            .filter(b => b.currentPoints >= b.pointsRequired)
            .map(b => `${b.id}:${b.level}`);
        if (earnedIds.length === 0) return;

        const storageKey = `hangel-seen-badges-${authUser.uid}`;
        let seen: string[] = [];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) seen = JSON.parse(raw);
        } catch { /* noop */ }

        // İlk ziyaret (seen boş) → bildirim atma, sadece baseline kaydet (spam önleme)
        if (seen.length === 0) {
            try { localStorage.setItem(storageKey, JSON.stringify(earnedIds)); } catch { /* noop */ }
            return;
        }

        const newlyEarned = enrichedBadges.filter(
            b => b.currentPoints >= b.pointsRequired && !seen.includes(`${b.id}:${b.level}`),
        );
        if (newlyEarned.length === 0) return;

        // Kutlama: yeni rozet kazanma anı — konfeti + native haptik + bant.
        // (En yüksek/ilk rozeti banttta göster; çoklu kazanımda bildirim hepsini yazar.)
        const top = newlyEarned[0];
        void import('@/lib/celebrate')
            .then((m) => m.celebrate({ title: `Yeni rozet 🧡 ${top.name}`, message: `${top.level} · ${top.socialArea}` }))
            .catch(() => undefined);

        // Yeni rozet(ler) için bildirim yaz
        (async () => {
            for (const badge of newlyEarned) {
                try {
                    await addDoc(collection(db, COLLECTIONS.notifications), {
                        userId: authUser.uid,
                        type: 'badge',
                        title: `🏆 Yeni rozet: ${badge.name} (${badge.level})`,
                        body: `${badge.socialArea} alanında ${badge.level} rozetini kazandın! Tebrikler.`,
                        data: { link: '/my-badges', badgeId: badge.id, level: badge.level },
                        read: false,
                        createdAt: serverTimestamp(),
                        createdBy: 'hangel-system',
                    });
                } catch (e) {
                    console.warn('[badge] notification failed', e);
                }
            }
            try { localStorage.setItem(storageKey, JSON.stringify(earnedIds)); } catch { /* noop */ }
        })();
    }, [enrichedBadges, authUser?.uid, db]);

    return (
        <div className="p-4 space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-32">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter font-headline">{t('dashboard.badges.heading')}</h1>
                <p className="text-muted-foreground text-sm font-medium">{t('dashboard.badges.subheading')}</p>
            </div>

            <NextBadgeGoal nextBadge={nextBadge} t={t} />

            <Tabs defaultValue="badges" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1.5 rounded-2xl backdrop-blur-xl">
                    {/* min-w-0 + line-clamp + px-1: dar ekranda (≤375px) "Sertifikalar"
                        gibi uzun etiketler taşmasın/kırpılmasın. */}
                    <TabsTrigger value="impact-score" className="min-w-0 rounded-xl px-1 text-xs font-bold leading-tight data-[state=active]:bg-background data-[state=active]:shadow-lg sm:text-sm"><span className="line-clamp-1">{t('dashboard.badges.tabImpactScore')}</span></TabsTrigger>
                    <TabsTrigger value="badges" className="min-w-0 rounded-xl px-1 text-xs font-bold leading-tight data-[state=active]:bg-background data-[state=active]:shadow-lg sm:text-sm"><span className="line-clamp-1">{t('dashboard.badges.tabBadges')}</span></TabsTrigger>
                    <TabsTrigger value="certificates" className="min-w-0 rounded-xl px-1 text-xs font-bold leading-tight data-[state=active]:bg-background data-[state=active]:shadow-lg sm:text-sm"><span className="line-clamp-1">{t('dashboard.badges.tabCertificates')}</span></TabsTrigger>
                </TabsList>

                <TabsContent value="impact-score" className="mt-8 space-y-6">
                    <EtkiTabContent
                        user={{
                            impactScore,
                            stats: ((userData as { stats?: Parameters<typeof EtkiTabContent>[0]['user']['stats'] } | undefined)?.stats) || {
                                totalDonation: 0, donationCount: 0, highestSingleDonation: 0, mostSupportedNgo: '-',
                                avgDonation: 0, volunteerHours: 0, completedProjects: 0, mostActiveVolunteerArea: '-',
                                totalImpactValue: 0, volunteerRank: {},
                            },
                        }}
                        earnedBadgeCount={earnedCount}
                        certificateCount={certificates.length}
                        impactCardTitle={t('dashboard.badges.impactTotalLabel')}
                    />
                </TabsContent>

                <TabsContent value="badges" className="mt-8 space-y-12">
                    {enrichedBadges.length === 0 && (
                        <EmptyState
                            icon={Award}
                            title={t('dashboard.badges.emptyTitle')}
                            description={t('dashboard.badges.emptyDesc')}
                            action={{ label: t('dashboard.badges.emptyAction'), href: '/events' }}
                        />
                    )}
                    {Object.entries(groupedBadges).map(([socialArea, areaBadges]) => {
                        const areaCurrent = Number(effectiveAreaPoints[socialArea]) || 0;
                        return (
                            <div key={socialArea} className="space-y-6">
                                <div className="px-1 flex items-center justify-between gap-2">
                                    {/* min-w-0: uzun sosyal alan başlığı (text-2xl) dar
                                        ekranda Badge'i itip taşmasın; sayaç Badge shrink-0. */}
                                    <div className="min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight break-words">{socialArea} {t('dashboard.badges.areaSuffix')}</h2>
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                                            {t('dashboard.badges.areaScoreLabel')}: {areaCurrent.toLocaleString('tr-TR')}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0 text-[10px] font-black uppercase tracking-widest">
                                        {areaBadges.filter(b => b.currentPoints >= b.pointsRequired).length} / {areaBadges.length} {t('dashboard.badges.badgeWord')}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {areaBadges.map(badge => (
                                        <VectorBadge key={badge.id} badge={badge} t={t} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </TabsContent>

                <TabsContent value="certificates">
                    {/* Tek kaynak: /profile ve /my-badges aynı sertifika sekmesini paylaşır. */}
                    <CertificatesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
