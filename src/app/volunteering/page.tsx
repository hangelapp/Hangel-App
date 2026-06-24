
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, MapPin, Calendar, ChevronDown, ArrowDownUp, Map as MapIcon, X } from 'lucide-react';
import { VolunteeringMapDialog } from '@/components/volunteering/volunteering-map-dialog';
import { useTranslation } from '@/components/providers/language-provider';
import { ngos } from '@/lib/data';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { parse, differenceInDays } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, where, limit as fsLimit } from 'firebase/firestore';
import type { Volunteering } from '@/lib/types';
import { COLLECTIONS } from '@/firebase/collections';
import { scoreMatch, type MatchingUserProfile } from '@/lib/volunteer-matching';

const FilterButton = ({ title, options, selected, onSelectedChange, className }: {
    icon?: React.ElementType;
    title: string;
    options: string[];
    selected: string[];
    onSelectedChange: (selected: string[]) => void;
    className?: string;
}) => {
    const { t } = useTranslation();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`h-9 px-2 gap-x-1 rounded-full min-w-0 justify-center ${className ?? ''}`}>
                    <span className="text-xs font-medium truncate">{title}</span>
                    {selected.length > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                            {selected.length}
                        </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 overflow-y-auto" align="start">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">{t('volunteering_root.noOptions')}</div>
                ) : options.map(option => (
                    <DropdownMenuCheckboxItem
                        key={option}
                        checked={selected.includes(option)}
                        onCheckedChange={checked => {
                            onSelectedChange(checked ? [...selected, option] : selected.filter(i => i !== option));
                        }}
                    >
                        {option}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-1">
                            <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={() => onSelectedChange([])}>
                                {t('volunteering_root.clearAll')}
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// Tamamlanan gönüllülük ilanı, tamamlanma anından sonra bu süre kadar
// "Tamamlandı" rozetiyle listede kalır; sonra düşer (etkinliklerdeki gibi).
const COMPLETED_VISIBLE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 saat

// `completedAt` Firestore Timestamp ({seconds}), ms (number) ya da ISO string
// olarak gelebilir. Hepsini ms'e çevirir; çözülemezse null döner.
function completedAtMs(value: unknown): number | null {
    if (value == null) return null;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Date.parse(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof value === 'object') {
        const seconds = (value as { seconds?: unknown }).seconds;
        if (typeof seconds === 'number' && Number.isFinite(seconds)) {
            return seconds * 1000;
        }
        // Firestore client Timestamp: toMillis()
        const toMillis = (value as { toMillis?: unknown }).toMillis;
        if (typeof toMillis === 'function') {
            const ms = (value as { toMillis: () => number }).toMillis();
            return Number.isFinite(ms) ? ms : null;
        }
    }
    return null;
}

// Türkçe karşılaştırma için normalize (büyük/küçük harf + boşluk).
const normTr = (s: unknown): string =>
    typeof s === 'string' ? s.trim().toLocaleLowerCase('tr') : '';

const overlapCount = (a: string[], b: string[]): number => {
    if (a.length === 0 || b.length === 0) return 0;
    const set = new Set(b.map(normTr));
    return a.reduce((n, v) => (set.has(normTr(v)) ? n + 1 : n), 0);
};

// Kullanıcının gönüllü profilini doldurup doldurmadığını belirler.
// Hiçbir gönüllü bilgisi (ve şehir) yoksa profil uygunluğu 0 olmalı.
function hasAnyVolunteerData(profile: MatchingUserProfile): boolean {
    const vi = profile.volunteerInfo;
    if (!vi) return Boolean(normTr(profile.personalInfo?.address?.city));
    const arrays = [
        vi.skills, vi.dailySkills, vi.interests, vi.languages,
        vi.availabilityDays, vi.availabilityTimes, vi.workModes, vi.motivations,
    ];
    if (arrays.some(a => Array.isArray(a) && a.length > 0)) return true;
    return Boolean(normTr(profile.personalInfo?.address?.city));
}

/**
 * Gerçek profil uygunluğu (0–100).
 *
 * Tek kaynak: `@/lib/volunteer-matching` içindeki `scoreMatch` (ilan
 * yetkinlik/ilgi/dil/müsaitlik + şehir + çalışma şekli ağırlıklı örtüşmesi).
 * Bu sayede kart rozeti ile "Sana Özel Öneriler" aynı algoritmayı kullanır.
 *
 * Kullanıcı gönüllü bilgisini doldurmadıysa skor 0 döner — uydurma/sabit
 * değer yok. Breakdown tooltip'i de gerçek örtüşmeden hesaplanır.
 */
function computeMatch(opp: Volunteering, profile: MatchingUserProfile) {
    if (!hasAnyVolunteerData(profile)) {
        return {
            percent: 0,
            breakdown: {
                ability: { matched: 0, total: 0 },
                interest: { matched: 0, total: 0 },
                location: 'Belirsiz' as const,
            },
        };
    }

    const oppWithExtras = opp as Volunteering & {
        dailySkills?: string[];
        availabilityDays?: string[];
        availabilityTimes?: string[];
    };

    const { score } = scoreMatch(
        {
            id: opp.id,
            skills: opp.skills ?? null,
            dailySkills: oppWithExtras.dailySkills ?? null,
            socialArea: opp.socialArea ?? null,
            interests: opp.interests ?? null,
            languages: opp.languages ?? null,
            location: { city: opp.location?.city ?? null, type: opp.location?.type ?? null },
            availabilityDays: oppWithExtras.availabilityDays ?? null,
            availabilityTimes: oppWithExtras.availabilityTimes ?? null,
        },
        profile,
    );

    // Tooltip için gerçek örtüşme dökümü.
    const vi = profile.volunteerInfo ?? {};
    const userAbilities = [...(vi.skills ?? []), ...(vi.dailySkills ?? [])];
    const userInterests = vi.interests ?? [];
    const userCity = profile.personalInfo?.address?.city ?? '';

    const requiredAbilities = [...(opp.skills ?? []), ...(oppWithExtras.dailySkills ?? [])];
    const oppInterests = [...(opp.socialArea ? [opp.socialArea] : []), ...(opp.interests ?? [])];

    const abilityMatched = overlapCount(requiredAbilities, userAbilities);
    const interestMatched = overlapCount(oppInterests, userInterests);
    const sameCity = Boolean(userCity && opp.location?.city && normTr(userCity) === normTr(opp.location.city));
    const isOnline = opp.location?.type === 'Online';

    return {
        percent: Math.max(0, Math.min(100, Math.round(score))),
        breakdown: {
            ability: { matched: abilityMatched, total: requiredAbilities.length },
            interest: { matched: interestMatched, total: oppInterests.length },
            location: (sameCity ? 'Tam' : isOnline ? 'Online' : userCity && opp.location?.city ? 'Farklı' : 'Belirsiz') as 'Tam' | 'Online' | 'Farklı' | 'Belirsiz',
        },
    };
}

const OpportunityCard = ({ opp, profile, hasProfile, appStatus }: {
    opp: Volunteering;
    profile: MatchingUserProfile;
    hasProfile: boolean;
    appStatus?: string | null;
}) => {
    const { t } = useTranslation();
    const ngo = ngos.find(n => n.id === opp.ngoId);
    const match = computeMatch(opp, profile);
    const matchPercentage = match.percent;

    // Tamamlanan ilan: tamamlanma + 24 saat boyunca "Tamamlandı" rozetiyle kalır.
    const isCompleted = (opp as Volunteering & { status?: string }).status === 'Tamamlandı';

    const daysRemaining = differenceInDays(parse(opp.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
    const countdownText = daysRemaining > 0 ? t('volunteering_root.remainingDays').replace('{days}', String(daysRemaining)) : (daysRemaining === 0 ? t('volunteering_root.lastDay') : t('volunteering_root.expired'));

    return (
        <Card className="overflow-hidden border border-border/60 shadow-sm transition-all hover:shadow-md hover:border-primary/30 h-full">
            <Link href={`/volunteering/${opp.id}`} className="block group h-full">
                <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-start justify-between gap-x-2 gap-y-1">
                            <div className="flex items-center gap-x-2.5 gap-y-1 flex-1 min-w-0">
                                {ngo && (
                                    <Avatar className="h-10 w-10 border shrink-0">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground break-words leading-tight">{opp.organization}</p>
                                    <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{opp.title}</h3>
                                    {appStatus && (
                                        <span className={`inline-flex items-center gap-x-1 mt-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                            appStatus === 'Onaylandı' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                : appStatus === 'Reddedildi' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                                            {appStatus === 'Onaylandı' ? '✓ Onaylandı' : appStatus === 'Reddedildi' ? 'Kabul edilmedi' : 'Başvuruldu'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Sağ üst köşe: İncele butonu — mercan (primary) tema token'ı,
                                hardcoded renk/inline-style yerine; koyu temada otomatik uyumlu. */}
                            <span className="shrink-0 inline-flex items-center justify-center rounded-full px-3 py-1.5 min-h-[28px] text-xs font-bold text-primary border border-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                {t('volunteering_root.reviewBtn')}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 flex-wrap gap-x-2 gap-y-1">
                            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                                <span className="flex items-center gap-x-1 min-w-0"><MapPin size={12} className="shrink-0" /> <span className="truncate">{opp.location.city} ({opp.location.type})</span></span>
                                <span className="flex items-center gap-x-1 min-w-0"><Calendar size={12} className="shrink-0" /> <span className="truncate">{opp.commitment}</span></span>
                            </div>
                            <div className="flex items-center gap-x-1.5 gap-y-1 shrink-0">
                                <span className="font-bold text-primary text-xs">{opp.points} {t('volunteering_root.points')}</span>
                                {isCompleted ? (
                                    <Badge variant="secondary" className="text-xs font-bold">
                                        Tamamlandı
                                    </Badge>
                                ) : (
                                    <Badge variant={daysRemaining < 0 ? 'destructive' : 'outline'} className="text-xs font-bold">
                                        {countdownText}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {hasProfile && (
                            <div
                                className="mt-2 space-y-1"
                                title={`${t('volunteering_root.breakdownAbility')}: ${match.breakdown.ability.matched}/${match.breakdown.ability.total} • ${t('volunteering_root.breakdownSensitivity')}: ${match.breakdown.interest.matched}/${match.breakdown.interest.total} • ${t('volunteering_root.breakdownLocation')}: ${match.breakdown.location}`}
                            >
                                <div className="flex justify-between text-xs uppercase tracking-wider">
                                    <span className="font-bold text-muted-foreground">{t('volunteering_root.profileEligibility')}</span>
                                    <span className="font-black text-primary">%{matchPercentage}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                        style={{ width: `${matchPercentage}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};

export default function VolunteeringPage() {
    const db = useFirestore();
    const { user: authUser } = useUser();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [interestFilter, setInterestFilter] = useState<string[]>([]);
    const [skillFilter, setSkillFilter] = useState<string[]>([]);
    const [cityFilter, setCityFilter] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'points' | 'deadline'>('points');
    const [mapOpen, setMapOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    // Detaylı filtre paneli state'leri (yukarıdaki interest/skill/city ile paylaşımlı)
    const [socialAreaFilter, setSocialAreaFilter] = useState<string[]>([]);
    const [taskTypeFilter, setTaskTypeFilter] = useState<string[]>([]);
    const [locationTypeFilter, setLocationTypeFilter] = useState<string[]>([]);
    const [certificateOnly, setCertificateOnly] = useState(false);

    // PERF: ilk 100 ilanı yükle (createdAt'e göre sıralı), client-side
    // filtreleme yine çalışır ama Firestore'dan tüm collection inmez.
    // NOT: orderBy('deadline') boş listeye yol açtı (mevcut dokümanlarda
    // deadline field'ı yok — Firestore orderBy field yoksa doc'u atar).
    // createdAt her dokümanda var (Firestore default), güvenli sort.
    const oppsQuery = useMemoFirebase(
        () => query(collection(db, COLLECTIONS.volunteering), orderBy('createdAt', 'desc'), fsLimit(100)),
        [db],
    );
    const { data: oppsData, isLoading } = useCollection<Volunteering>(oppsQuery);

    // Kullanıcının kendi başvuruları → ilan kartında durum rozeti (entityId → status).
    const myAppsQuery = useMemoFirebase(
        () => (db && authUser ? query(collection(db, COLLECTIONS.applications), where('userId', '==', authUser.uid)) : null),
        [db, authUser],
    );
    const { data: myApps } = useCollection<{ entityId?: string; status?: string }>(myAppsQuery);
    const appStatusByEntity = useMemo(() => {
        const map: Record<string, string> = {};
        for (const a of myApps || []) {
            if (a.entityId) map[a.entityId] = a.status || 'Beklemede';
        }
        return map;
    }, [myApps]);

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);
    const { data: userData } = useDoc<{
        volunteerInfo?: {
            skills?: string[];
            dailySkills?: string[];
            languages?: string[];
            programs?: string[];
            licenses?: string[];
            driverLicenses?: string[];
            documents?: string[];
            certificates?: string[];
            interests?: string[];
            availabilityDays?: string[];
            availabilityTimes?: string[];
            workModes?: string[];
            motivations?: string[];
        };
        personalInfo?: { address?: { city?: string } };
    }>(userDocRef);

    // Profil uygunluğu için tek kaynak — kart rozeti + sıralama + öneriler
    // aynı gerçek profili kullanır.
    const matchingProfile = useMemo<MatchingUserProfile>(() => ({
        volunteerInfo: userData?.volunteerInfo || null,
        personalInfo: userData?.personalInfo || null,
    }), [userData]);

    // Kart rozeti (profil uyumu) için kullanıcının gönüllü profili dolu mu?
    const hasVolunteerProfile = useMemo(() => {
        const vi = userData?.volunteerInfo;
        if (!vi) return false;
        return Boolean(
            (vi.skills && vi.skills.length > 0) ||
            (vi.interests && vi.interests.length > 0) ||
            (vi.availabilityDays && vi.availabilityDays.length > 0) ||
            (vi.workModes && vi.workModes.length > 0) ||
            (vi.languages && vi.languages.length > 0)
        );
    }, [userData]);

    const { interestOptions, skillOptions, cityOptions, socialAreaOptions } = useMemo(() => {
        // İlanların gerçek detay alanlarından türetilen benzersiz değerler.
        // Boş/whitespace değerler atlanır; trim'lenmiş haliyle eklenir.
        const interests = new Set<string>();
        const skills = new Set<string>();
        const cities = new Set<string>();
        const socialAreas = new Set<string>();
        const addClean = (set: Set<string>, value: unknown) => {
            if (typeof value !== 'string') return;
            const v = value.trim();
            if (v) set.add(v);
        };
        (oppsData || []).forEach(opp => {
            const oppExtra = opp as Volunteering & { dailySkills?: string[] };
            // Hassasiyet → socialArea + interests birleşik benzersiz küme
            addClean(interests, opp.socialArea);
            addClean(socialAreas, opp.socialArea);
            (opp.interests || []).forEach(i => addClean(interests, i));
            // Yetkinlikler → skills + dailySkills benzersiz küme
            (opp.skills || []).forEach(s => addClean(skills, s));
            (oppExtra.dailySkills || []).forEach(s => addClean(skills, s));
            // Konum → location.city benzersiz küme
            addClean(cities, opp.location?.city);
        });
        return {
            interestOptions: Array.from(interests).sort((a, b) => a.localeCompare(b, 'tr')),
            skillOptions: Array.from(skills).sort((a, b) => a.localeCompare(b, 'tr')),
            cityOptions: Array.from(cities).sort((a, b) => a.localeCompare(b, 'tr')),
            socialAreaOptions: Array.from(socialAreas).sort((a, b) => a.localeCompare(b, 'tr')),
        };
    }, [oppsData]);

    const taskTypeOptions = ['Tek Gün', 'Dönemsel', 'Sürekli'];
    const locationTypeOptions = ['Online', 'Saha', 'Hibrit'];

    const activeFilterCount =
        interestFilter.length +
        skillFilter.length +
        cityFilter.length +
        socialAreaFilter.length +
        taskTypeFilter.length +
        locationTypeFilter.length +
        (certificateOnly ? 1 : 0);

    const clearAllFilters = () => {
        setInterestFilter([]);
        setSkillFilter([]);
        setCityFilter([]);
        setSocialAreaFilter([]);
        setTaskTypeFilter([]);
        setLocationTypeFilter([]);
        setCertificateOnly(false);
    };

    // Her ilan için profil uygunluğunu (match %) bir kez hesapla; sıralamada kullan.
    // Profil yoksa computeMatch zaten 0 döner, sıralamayı etkilemez.
    const matchPercentById = useMemo(() => {
        const map: Record<string, number> = {};
        for (const opp of oppsData || []) {
            map[opp.id] = computeMatch(opp, matchingProfile).percent;
        }
        return map;
    }, [oppsData, matchingProfile]);

    const filteredOpps = useMemo(() => {
        if (!oppsData) return [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const now = Date.now();
        // Sadece onaylanmış (Aktif) + süresi dolmamış ilanlar.
        // İstisna: 'Tamamlandı' ilan, tamamlanma anından 24 saat boyunca
        // "Tamamlandı" rozetiyle listede kalır; sonra düşer (etkinliklerdeki gibi).
        let filtered = oppsData.filter(opp => {
            const oppExtra = opp as Volunteering & { status?: string; completedAt?: unknown };
            const status = oppExtra.status;
            if (status === 'Tamamlandı') {
                const completedMs = completedAtMs(oppExtra.completedAt);
                // completedAt yoksa (zaman bilinmiyor) yeni tamamlanmış sayılıp tutulur.
                if (completedMs == null) return true;
                return now - completedMs < COMPLETED_VISIBLE_WINDOW_MS;
            }
            if (status && status !== 'Aktif') return false;
            try {
                const end = parse(opp.dates.applicationEnd, 'yyyy-MM-dd', new Date());
                if (!isNaN(end.getTime()) && end < today) return false;
            } catch { /* tarih okunmazsa göster */ }
            return true;
        });

        // Türkçe normalize (büyük/küçük + trim) ile çoklu-seçim eşleştirme.
        // Bir ilan, ilgili detay alanında seçili değerlerden HERHANGİ birini
        // taşıyorsa gösterilir.
        if (interestFilter.length > 0) {
            const wanted = new Set(interestFilter.map(normTr));
            filtered = filtered.filter(opp => {
                const oppInterests = [opp.socialArea, ...(opp.interests || [])];
                return oppInterests.some(i => wanted.has(normTr(i)));
            });
        }
        if (skillFilter.length > 0) {
            const wanted = new Set(skillFilter.map(normTr));
            filtered = filtered.filter(opp => {
                const oppExtra = opp as Volunteering & { dailySkills?: string[] };
                const oppSkills = [...(opp.skills || []), ...(oppExtra.dailySkills || [])];
                return oppSkills.some(s => wanted.has(normTr(s)));
            });
        }
        if (cityFilter.length > 0) {
            const wanted = new Set(cityFilter.map(normTr));
            filtered = filtered.filter(opp => wanted.has(normTr(opp.location?.city)));
        }
        if (socialAreaFilter.length > 0) {
            const wanted = new Set(socialAreaFilter.map(normTr));
            filtered = filtered.filter(opp => wanted.has(normTr(opp.socialArea)));
        }
        if (taskTypeFilter.length > 0) {
            filtered = filtered.filter(opp => taskTypeFilter.includes(opp.taskType));
        }
        if (locationTypeFilter.length > 0) {
            filtered = filtered.filter(opp => locationTypeFilter.includes(opp.location?.type));
        }
        if (certificateOnly) {
            filtered = filtered.filter(opp => opp.providesCertificate);
        }

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(opp =>
                opp.title.toLowerCase().includes(lower) ||
                opp.organization.toLowerCase().includes(lower)
            );
        }

        // Mevcut sıralama kriteri (puan / son tarih) — match eşitliğinde tie-breaker.
        const baseCompare = (a: Volunteering, b: Volunteering) => {
            if (sortBy === 'deadline') {
                const ad = differenceInDays(parse(a.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
                const bd = differenceInDays(parse(b.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
                return ad - bd;
            }
            return b.points - a.points;
        };

        // Kullanıcının gönüllü profili varsa: Profil Uygunluğu (match %) AZALAN
        // öncelikli; eşitlikte mevcut puan/son tarih kriteri korunur.
        // Profil yoksa: mevcut sıralama aynen kalır.
        if (hasVolunteerProfile) {
            return filtered.sort((a, b) => {
                const diff = (matchPercentById[b.id] ?? 0) - (matchPercentById[a.id] ?? 0);
                return diff !== 0 ? diff : baseCompare(a, b);
            });
        }

        return filtered.sort(baseCompare);
    }, [oppsData, interestFilter, skillFilter, cityFilter, socialAreaFilter, taskTypeFilter, locationTypeFilter, certificateOnly, searchTerm, sortBy, hasVolunteerProfile, matchPercentById]);

  return (
    <div className="space-y-4 animate-in fade-in-0">
      <div className="p-4 space-y-4">
        <div className="space-y-3 sticky top-[calc(3rem+env(safe-area-inset-top))] bg-background/95 backdrop-blur-xl z-10 py-2">
          <h1 className="text-2xl font-bold font-headline">{t('volunteeringPage.title')}</h1>
          <div className="flex gap-2">
              <div className="relative flex-grow min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input placeholder={t('volunteeringPage.searchPlaceholder')} className="pl-10 h-11 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 relative shrink-0"
                aria-label={t('volunteeringPage.filterAria')}
                title={t('volunteeringPage.filterAria')}
                onClick={() => setFilterOpen(true)}
              >
                <Filter size={20} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold ring-2 ring-background">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label={t('volunteering_root.sortAria')} title={t('volunteering_root.sortAria')}><ArrowDownUp size={20} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('volunteering_root.sortHeader')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem checked={sortBy === 'points'} onCheckedChange={() => setSortBy('points')}>{t('volunteering_root.sortByPoints')}</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={sortBy === 'deadline'} onCheckedChange={() => setSortBy('deadline')}>{t('volunteering_root.sortByDeadline')}</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
          {/* Filtre satırı — Hassasiyet · Yetkinlikler · Konum · Harita TEK SATIRA
              tam sığar: flex-1 ile eşit bölünür (yatay kaydırma YOK); etiketler
              gerekirse truncate olur. Temizle (aktifse) kompakt X ikonu. */}
          <div className="flex w-full items-center gap-1.5">
              <FilterButton className="flex-1" title={t('volunteering_root.filterSensitivity')} options={interestOptions} selected={interestFilter} onSelectedChange={setInterestFilter} />
              <FilterButton className="flex-1" title={t('volunteering_root.filterSkills')} options={skillOptions} selected={skillFilter} onSelectedChange={setSkillFilter} />
              <FilterButton className="flex-1" title={t('volunteering_root.filterLocation')} options={cityOptions} selected={cityFilter} onSelectedChange={setCityFilter} />
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 min-w-0 justify-center px-2 gap-x-1 rounded-full"
                onClick={() => setMapOpen(true)}
                aria-label={t('volunteering_root.mapAria')}
                title={t('volunteering_root.mapAria')}
              >
                <MapIcon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium truncate">{t('volunteering_root.mapLabel')}</span>
              </Button>
              {(interestFilter.length + skillFilter.length + cityFilter.length) > 0 && (
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full"
                      aria-label={t('volunteering_root.clearFilters')}
                      title={t('volunteering_root.clearFilters')}
                      onClick={() => { setInterestFilter([]); setSkillFilter([]); setCityFilter([]); }}
                  >
                      <X className="h-4 w-4" />
                  </Button>
              )}
          </div>
        </div>

        <div id="imece-all-listings" className="space-y-3 scroll-mt-32">
          {isLoading ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted" />)
          ) : filteredOpps.length > 0 ? (
              filteredOpps.map(opp => (
                  <OpportunityCard
                      key={opp.id}
                      opp={opp}
                      profile={matchingProfile}
                      hasProfile={hasVolunteerProfile}
                      appStatus={appStatusByEntity[opp.id]}
                  />
              ))
          ) : (
              <p className="text-center py-20 text-muted-foreground">{t('volunteering_root.noListings')}</p>
          )}
        </div>
      </div>
      <VolunteeringMapDialog open={mapOpen} onOpenChange={setMapOpen} items={filteredOpps} />

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Filter size={18} /> {t('volunteeringPage.filterAria')}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-[11px] font-bold">{activeFilterCount}</Badge>
              )}
            </SheetTitle>
            <SheetDescription>İlanları ihtiyacına göre daralt.</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              <CheckboxFilterGroup
                title={t('volunteering_root.filterSensitivity')}
                options={interestOptions}
                selected={interestFilter}
                onChange={setInterestFilter}
                emptyLabel={t('volunteering_root.noOptions')}
              />
              <Separator />
              <CheckboxFilterGroup
                title={t('volunteering_root.filterSkills')}
                options={skillOptions}
                selected={skillFilter}
                onChange={setSkillFilter}
                emptyLabel={t('volunteering_root.noOptions')}
              />
              <Separator />
              <CheckboxFilterGroup
                title="Sosyal Alan"
                options={socialAreaOptions}
                selected={socialAreaFilter}
                onChange={setSocialAreaFilter}
                emptyLabel={t('volunteering_root.noOptions')}
              />
              <Separator />
              <CheckboxFilterGroup
                title={t('volunteering_root.filterLocation')}
                options={cityOptions}
                selected={cityFilter}
                onChange={setCityFilter}
                emptyLabel={t('volunteering_root.noOptions')}
              />
              <Separator />
              <CheckboxFilterGroup
                title="Görev Türü"
                options={taskTypeOptions}
                selected={taskTypeFilter}
                onChange={setTaskTypeFilter}
                emptyLabel={t('volunteering_root.noOptions')}
              />
              <Separator />
              <CheckboxFilterGroup
                title="Çalışma Şekli"
                options={locationTypeOptions}
                selected={locationTypeFilter}
                onChange={setLocationTypeFilter}
                emptyLabel={t('volunteering_root.noOptions')}
              />
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold">Sertifika</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={certificateOnly}
                    onCheckedChange={checked => setCertificateOnly(checked === true)}
                  />
                  <span className="text-sm">Sadece sertifika verenler</span>
                </label>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="flex-row gap-2 p-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              {t('volunteering_root.clearFilters')}
            </Button>
            <SheetClose asChild>
              <Button className="flex-1">{`Sonuçları gör (${filteredOpps.length})`}</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const CheckboxFilterGroup = ({ title, options, selected, onChange, emptyLabel }: {
    title: string;
    options: string[];
    selected: string[];
    onChange: (next: string[]) => void;
    emptyLabel: string;
}) => (
    <div className="space-y-2">
        <p className="text-sm font-semibold">{title}</p>
        {options.length === 0 ? (
            <p className="text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
            <div className="grid grid-cols-1 gap-1.5">
                {options.map(option => {
                    const id = `flt-${title}-${option}`;
                    const checked = selected.includes(option);
                    return (
                        <label key={option} htmlFor={id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                id={id}
                                checked={checked}
                                onCheckedChange={isChecked => {
                                    onChange(isChecked === true
                                        ? [...selected, option]
                                        : selected.filter(v => v !== option));
                                }}
                            />
                            <span className="text-sm leading-tight">{option}</span>
                        </label>
                    );
                })}
            </div>
        )}
    </div>
);
