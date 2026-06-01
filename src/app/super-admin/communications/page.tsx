'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Search, Send, Bell, History, MessageSquare, User, Building, School, Loader2, CheckCircle2, BarChart3, Users, Eye, MailOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
    collection, doc, writeBatch, addDoc, serverTimestamp, query, orderBy, limit,
    where, getCountFromServer, getDocs,
} from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type TargetGroup = 'all' | 'all-ngos' | 'all-clubs' | 'all-brands' | 'all-ngo-admins';

interface CommsUser {
    id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    role?: string;
    managedNgoId?: string;
    managedClubId?: string;
    managedBrandId?: string;
    personalInfo?: { email?: string; phone?: string };
    [key: string]: unknown;
}

interface EntityRow {
    id: string;
    name?: string;
    logoUrl?: string;
    [key: string]: unknown;
}

// Bir alıcının çözülmüş kurum bilgisi — STK / Marka / Kulüp adı veya "Bireysel".
interface ResolvedUser {
    name: string;
    avatarUrl?: string;
    orgName: string;
    orgKind: 'STK' | 'Marka' | 'Öğrenci Kulübü' | 'Bireysel';
}

interface NotifDoc {
    id: string;
    userId?: string;
    title?: string;
    body?: string;
    type?: string;
    read?: boolean;
    readAt?: unknown;
    broadcastId?: string;
    targetCount?: number;
    target?: string;
    createdAt?: unknown;
    createdBy?: string;
    [key: string]: unknown;
}

interface BroadcastDoc {
    id: string;
    type?: string;
    title?: string;
    body?: string;
    target?: string;
    targetCount?: number;
    status?: string;
    createdAt?: unknown;
    createdBy?: string;
    [key: string]: unknown;
}

const TARGET_LABELS: Record<TargetGroup, string> = {
    'all': 'Tüm Kullanıcılar',
    'all-ngos': "Tüm STK Adminleri",
    'all-clubs': 'Tüm Kulüp Adminleri',
    'all-brands': 'Tüm Marka Adminleri',
    'all-ngo-admins': 'Tüm Kuruluş Adminleri (STK + Marka + Kulüp)',
};

const DM_TARGET_LABELS: Record<string, string> = {
    user: 'Kullanıcı (DM)',
    ngo: 'STK Yöneticisi (DM)',
    brand: 'Marka Yöneticisi (DM)',
    club: 'Kulüp Yöneticisi (DM)',
};

function targetLabel(target?: string): string {
    if (!target) return 'Bilinmeyen';
    return (TARGET_LABELS as Record<string, string>)[target]
        || DM_TARGET_LABELS[target]
        || target;
}

function toDateMaybe(value: unknown): Date | null {
    const v = value as { toDate?: () => Date } | null;
    return v?.toDate ? v.toDate() : null;
}

// Tüm broadcast'ler için okundu sayılarını TEK seferde paralel çeker — özet kartı
// ve satır rozetleri aynı veriden beslenir, render sırasında dalgalı sayı görmeyiz.
function useBroadcastReadCounts(
    broadcasts: BroadcastDoc[] | null | undefined,
): Map<string, number | null> {
    const db = useFirestore();
    const [counts, setCounts] = useState<Map<string, number | null>>(new Map());

    // Stabil bir bağımlılık — broadcasts referansı her render değişebiliyor, biz
    // sadece id seti değiştiğinde yeniden çekmek istiyoruz.
    const idsKey = useMemo(
        () => (broadcasts || []).map((b) => b.id).join('|'),
        [broadcasts],
    );

    useEffect(() => {
        if (!broadcasts || broadcasts.length === 0) {
            setCounts(new Map());
            return;
        }
        let cancelled = false;
        (async () => {
            const results = await Promise.all(
                broadcasts.map(async (b) => {
                    try {
                        const snap = await getCountFromServer(query(
                            collection(db, COLLECTIONS.notifications),
                            where('broadcastId', '==', b.id),
                            where('read', '==', true),
                        ));
                        return [b.id, snap.data().count] as const;
                    } catch {
                        // Composite index eksikse veya yetki yoksa null — UI '—' gösterir.
                        return [b.id, null as number | null] as const;
                    }
                }),
            );
            if (!cancelled) setCounts(new Map(results));
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, idsKey]);

    return counts;
}

// userId → ResolvedUser map — tüm accordion item'lar ve satırlar bunu paylaşır,
// alıcı başına ekstra Firestore okuması yapılmaz.
function useUserResolver(
    allUsers: CommsUser[] | null,
    ngos: EntityRow[] | null,
    brands: EntityRow[] | null,
    clubs: EntityRow[] | null,
): Map<string, ResolvedUser> {
    return useMemo(() => {
        const ngoName = new Map<string, string>();
        (ngos || []).forEach((e) => ngoName.set(e.id, e.name || e.id));
        const brandName = new Map<string, string>();
        (brands || []).forEach((e) => brandName.set(e.id, e.name || e.id));
        const clubName = new Map<string, string>();
        (clubs || []).forEach((e) => clubName.set(e.id, e.name || e.id));

        const map = new Map<string, ResolvedUser>();
        (allUsers || []).forEach((u) => {
            const rec = u as unknown as Record<string, string | null | undefined>;
            let orgName = 'Bireysel';
            let orgKind: ResolvedUser['orgKind'] = 'Bireysel';
            if (rec.managedNgoId) {
                orgName = ngoName.get(rec.managedNgoId) || rec.managedNgoId;
                orgKind = 'STK';
            } else if (rec.managedBrandId) {
                orgName = brandName.get(rec.managedBrandId) || rec.managedBrandId;
                orgKind = 'Marka';
            } else if (rec.managedClubId) {
                orgName = clubName.get(rec.managedClubId) || rec.managedClubId;
                orgKind = 'Öğrenci Kulübü';
            }
            map.set(u.id, {
                name: u.name || u.username || u.id.slice(0, 8) + '…',
                avatarUrl: u.avatarUrl,
                orgName,
                orgKind,
            });
        });
        return map;
    }, [allUsers, ngos, brands, clubs]);
}

// Inline accordion item — collapsed haldeyken özet rozeti, açıldığında kurum
// kırılımı + bireysel alıcı listesi. Alıcılar lazy fetch (sadece ilk açılışta).
function BroadcastAccordionItem({
    broadcast,
    readCount,
    recipients,
    isLoading,
    userById,
}: {
    broadcast: BroadcastDoc;
    readCount: number | null;
    recipients: NotifDoc[] | null;
    isLoading: boolean;
    userById: Map<string, ResolvedUser>;
}) {
    const sent = broadcast.targetCount ?? 0;
    const rate = readCount !== null && sent > 0
        ? Math.round((readCount / sent) * 100)
        : null;
    const created = toDateMaybe(broadcast.createdAt);

    // Kurum/STK-bazlı okuma kırılımı — alıcıları kurum adına göre gruplar.
    const orgBreakdown = useMemo(() => {
        if (!recipients) return [];
        const groups = new Map<string, { orgName: string; orgKind: ResolvedUser['orgKind']; sent: number; read: number }>();
        recipients.forEach((r) => {
            const resolved = r.userId ? userById.get(r.userId) : undefined;
            const orgName = resolved?.orgName || 'Bireysel';
            const orgKind = resolved?.orgKind || 'Bireysel';
            const existing = groups.get(orgName) || { orgName, orgKind, sent: 0, read: 0 };
            existing.sent += 1;
            if (r.read) existing.read += 1;
            groups.set(orgName, existing);
        });
        return Array.from(groups.values()).sort((a, b) => b.sent - a.sent || b.read - a.read);
    }, [recipients, userById]);

    return (
        <AccordionItem value={broadcast.id} className="border-b last:border-b-0">
            <AccordionTrigger className="px-3 py-3 hover:bg-muted/30 hover:no-underline [&[data-state=open]]:bg-muted/40">
                <div className="flex-1 flex items-start justify-between gap-3 text-left">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm truncate">{broadcast.title || '(başlıksız)'}</p>
                            <Badge variant="outline" className="text-[9px] uppercase">
                                {broadcast.type || 'broadcast'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{broadcast.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            {targetLabel(broadcast.target)} · {created ? created.toLocaleString('tr-TR') : '—'}
                        </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                                <Send className="h-2.5 w-2.5 mr-1" />
                                {sent}
                            </Badge>
                            <Badge
                                variant={rate !== null && rate >= 50 ? 'default' : 'secondary'}
                                className="text-[10px]"
                            >
                                <MailOpen className="h-2.5 w-2.5 mr-1" />
                                {readCount !== null ? readCount : '—'}
                                {rate !== null ? ` (%${rate})` : ''}
                            </Badge>
                        </div>
                        {rate !== null && (
                            <Progress value={rate} className="h-1 w-24" />
                        )}
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 bg-muted/10">
                {isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 mx-auto animate-spin opacity-50" />
                        <p className="text-xs mt-2">Alıcı kayıtları yükleniyor...</p>
                    </div>
                ) : recipients && recipients.length > 0 ? (
                    <div className="space-y-4 pt-2">
                        {orgBreakdown.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Building className="h-3 w-3" />
                                    Kuruma Göre Okuma ({orgBreakdown.length} kurum)
                                </p>
                                <div className="max-h-44 overflow-y-auto border rounded-xl divide-y bg-background">
                                    {orgBreakdown.map((g) => {
                                        const ratePct = g.sent > 0 ? Math.round((g.read / g.sent) * 100) : 0;
                                        return (
                                            <div key={g.orgName} className="p-2 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold truncate">{g.orgName}</p>
                                                        <p className="text-[10px] text-muted-foreground">{g.orgKind}</p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-1.5">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        Gönderilen: {g.sent}
                                                    </Badge>
                                                    <Badge
                                                        variant={ratePct >= 50 ? 'default' : 'secondary'}
                                                        className="text-[10px]"
                                                    >
                                                        Okuyan: {g.read} (%{ratePct})
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                Bireysel Alıcılar ({recipients.length})
                            </p>
                            <div className="max-h-72 overflow-y-auto border rounded-xl divide-y bg-background">
                                {recipients.map((r) => {
                                    const readAt = toDateMaybe(r.readAt);
                                    const resolved = r.userId ? userById.get(r.userId) : undefined;
                                    const displayName = resolved?.name || (r.userId ? r.userId.slice(0, 8) + '…' : '—');
                                    return (
                                        <div key={r.id} className="p-2.5 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="h-6 w-6 shrink-0">
                                                    <AvatarImage src={resolved?.avatarUrl} alt={displayName} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {(displayName[0] || '?').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <span className="text-sm truncate block">{displayName}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate block">
                                                        {resolved?.orgName || 'Bireysel'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-2">
                                                {readAt && (
                                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                                        {readAt.toLocaleString('tr-TR')}
                                                    </span>
                                                )}
                                                <Badge
                                                    variant={r.read ? 'default' : 'outline'}
                                                    className="text-[10px]"
                                                >
                                                    {r.read ? (
                                                        <><Eye className="h-2.5 w-2.5 mr-1" />Okundu</>
                                                    ) : 'Okunmadı'}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground text-xs">
                        Alıcı kaydı bulunamadı.
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}

export default function CommunicationsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    // Tüm kullanıcılar (broadcast hedef + DM seçici için)
    const usersQuery = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
    const { data: allUsers, isLoading: usersLoading } = useCollection<CommsUser>(usersQuery);

    // Kuruluşlar — drilldown'da kurum/STK-bazlı okuma kırılımı için userId → kurum adı
    // çözümünde kullanılır. Bir kez yüklenip bellekte map'lenir (alıcı başına okuma yok).
    const ngosQuery = useMemoFirebase(() => collection(db, COLLECTIONS.ngos), [db]);
    const { data: ngos } = useCollection<EntityRow>(ngosQuery);
    const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
    const { data: brands } = useCollection<EntityRow>(brandsQuery);
    const clubsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.clubs), [db]);
    const { data: clubs } = useCollection<EntityRow>(clubsQuery);

    // Geçmiş bildirimler — Trafik İzleme
    const sentNotifsQuery = useMemoFirebase(() =>
        query(collection(db, COLLECTIONS.notifications), orderBy('createdAt', 'desc'), limit(100)),
        [db]);
    const { data: sentNotifs } = useCollection<NotifDoc>(sentNotifsQuery);

    // Toplu duyuru parent docs — gruplu Trafik İzleme özeti
    const broadcastsQuery = useMemoFirebase(() =>
        query(collection(db, COLLECTIONS.broadcasts), orderBy('createdAt', 'desc'), limit(50)),
        [db]);
    const { data: broadcasts } = useCollection<BroadcastDoc>(broadcastsQuery);

    // Broadcast state
    const [target, setTarget] = useState<TargetGroup | ''>('');
    const [bcTitle, setBcTitle] = useState('');
    const [bcBody, setBcBody] = useState('');
    const [bcSending, setBcSending] = useState(false);

    // DM state
    const [recipientType, setRecipientType] = useState<'user' | 'ngo' | 'brand' | 'club' | ''>('');
    const [entitySearchTerm, setEntitySearchTerm] = useState('');
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [dmSubject, setDmSubject] = useState('');
    const [dmBody, setDmBody] = useState('');
    const [dmSending, setDmSending] = useState(false);

    // İzleme arama
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [monitorSearchTerm, setMonitorSearchTerm] = useState('');

    // Trafik İzleme — açılmış accordion item'lar + alıcı cache (lazy fetch).
    // Aynı broadcast tekrar açılırsa cache'den okur, Firestore'a yeniden gitmez.
    const [openBroadcastIds, setOpenBroadcastIds] = useState<string[]>([]);
    const [recipientsCache, setRecipientsCache] = useState<Map<string, NotifDoc[]>>(new Map());
    const [recipientsLoading, setRecipientsLoading] = useState<Set<string>>(new Set());

    // Tüm broadcast'lerin okundu sayılarını TEK seferde paralel çek — hem özet
    // kartı hem her satır rozetinin tek kaynaktan beslenmesi için.
    const broadcastReadCounts = useBroadcastReadCounts(broadcasts);
    const userById = useUserResolver(allUsers, ngos, brands, clubs);

    const handleAccordionChange = (newOpen: string[]) => {
        const newlyOpened = newOpen.filter((id) => !openBroadcastIds.includes(id));
        setOpenBroadcastIds(newOpen);
        newlyOpened.forEach((id) => {
            if (recipientsCache.has(id) || recipientsLoading.has(id)) return;
            setRecipientsLoading((prev) => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
            (async () => {
                try {
                    const snap = await getDocs(query(
                        collection(db, COLLECTIONS.notifications),
                        where('broadcastId', '==', id),
                    ));
                    const rows = snap.docs.map((d) => ({
                        id: d.id,
                        ...(d.data() as Omit<NotifDoc, 'id'>),
                    }));
                    setRecipientsCache((prev) => new Map(prev).set(id, rows));
                } catch {
                    setRecipientsCache((prev) => new Map(prev).set(id, []));
                } finally {
                    setRecipientsLoading((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                }
            })();
        });
    };

    // Trafik İzleme — özet aggregate'leri (toplam gönderim, toplam okuma, oran).
    const monitorSummary = useMemo(() => {
        const list = broadcasts || [];
        let totalSent = 0;
        let totalRead = 0;
        let readCountsKnown = 0;
        list.forEach((b) => {
            totalSent += b.targetCount ?? 0;
            const rc = broadcastReadCounts.get(b.id);
            if (rc !== undefined && rc !== null) {
                totalRead += rc;
                readCountsKnown += 1;
            }
        });
        const overallRate = totalSent > 0 && readCountsKnown > 0
            ? Math.round((totalRead / totalSent) * 100)
            : null;
        return {
            totalBroadcasts: list.length,
            totalSent,
            totalRead,
            overallRate,
            allCountsLoaded: readCountsKnown === list.length,
        };
    }, [broadcasts, broadcastReadCounts]);

    // Filtre + gruplama (Toplu Duyurular / Direkt Mesajlar)
    const groupedBroadcasts = useMemo(() => {
        const q = monitorSearchTerm.toLowerCase().trim();
        const filtered = (broadcasts || []).filter((b) =>
            !q
            || (b.title || '').toLowerCase().includes(q)
            || (b.body || '').toLowerCase().includes(q)
            || (b.type || '').toLowerCase().includes(q)
            || targetLabel(b.target).toLowerCase().includes(q),
        );
        return {
            broadcast: filtered.filter((b) => (b.type || 'broadcast') === 'broadcast'),
            dm: filtered.filter((b) => b.type === 'dm'),
        };
    }, [broadcasts, monitorSearchTerm]);

    // Hedef gruba göre kullanıcıları filtrele (broadcast)
    const targetUsers = useMemo(() => {
        if (!allUsers || !target) return [];
        switch (target) {
            case 'all':
                return allUsers;
            case 'all-ngos':
                return allUsers.filter(u => u.role === 'ngo-admin' && u.managedNgoId);
            case 'all-clubs':
                return allUsers.filter(u => u.managedClubId);
            case 'all-brands':
                return allUsers.filter(u => u.managedBrandId);
            case 'all-ngo-admins':
                return allUsers.filter(u =>
                    u.role === 'ngo-admin' || u.managedNgoId || u.managedClubId || u.managedBrandId,
                );
            default:
                return [];
        }
    }, [allUsers, target]);

    // DM için arama sonuçları
    const filteredEntities = useMemo(() => {
        const q = entitySearchTerm.toLowerCase();
        if (recipientType === 'user') {
            return (allUsers || []).filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.personalInfo?.email || '').toLowerCase().includes(q) ||
                (u.personalInfo?.phone || '').includes(entitySearchTerm),
            ).slice(0, 50).map(u => ({
                id: u.id,
                name: u.name || u.username || 'Kullanıcı',
                sub: u.username || u.personalInfo?.email || '',
                phone: u.personalInfo?.phone || '',
                avatar: u.avatarUrl,
                icon: User,
            }));
        }
        if (recipientType === 'ngo') {
            return (allUsers || []).filter(u =>
                (u.role === 'ngo-admin' || u.managedNgoId) &&
                ((u.name || '').toLowerCase().includes(q)),
            ).slice(0, 50).map(u => ({
                id: u.id,
                name: u.name || 'STK Admin',
                sub: 'STK Yöneticisi',
                phone: '',
                avatar: u.avatarUrl,
                icon: Building,
            }));
        }
        if (recipientType === 'brand') {
            return (allUsers || []).filter(u =>
                u.managedBrandId && (u.name || '').toLowerCase().includes(q),
            ).slice(0, 50).map(u => ({
                id: u.id,
                name: u.name || 'Marka Admin',
                sub: 'Marka Yöneticisi',
                phone: '',
                avatar: u.avatarUrl,
                icon: Building,
            }));
        }
        if (recipientType === 'club') {
            return (allUsers || []).filter(u =>
                u.managedClubId && (u.name || '').toLowerCase().includes(q),
            ).slice(0, 50).map(u => ({
                id: u.id,
                name: u.name || 'Kulüp Admin',
                sub: 'Kulüp Yöneticisi',
                phone: '',
                avatar: u.avatarUrl,
                icon: School,
            }));
        }
        return [];
    }, [recipientType, entitySearchTerm, allUsers]);

    const handleBroadcast = async () => {
        if (!target) {
            toast({ variant: 'destructive', title: 'Hedef seç', description: 'Hedef grup seçin.' });
            return;
        }
        if (!bcTitle.trim() || !bcBody.trim()) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Başlık ve mesaj gerekli.' });
            return;
        }
        if (targetUsers.length === 0) {
            toast({ variant: 'destructive', title: 'Hedef boş', description: 'Bu hedef grupta hiç kullanıcı yok.' });
            return;
        }

        setBcSending(true);
        try {
            // Toplu duyuru için tek bir parent doc — başına broadcastId üretir,
            // her bildirime damgalanır (per-message analytics için).
            const broadcastRef = await addDoc(collection(db, COLLECTIONS.broadcasts), {
                type: 'broadcast',
                title: bcTitle.trim(),
                body: bcBody.trim(),
                target,
                targetCount: targetUsers.length,
                status: 'sent',
                createdAt: serverTimestamp(),
                createdBy: authUser?.uid || 'super-admin',
            });

            // Batched write — Firestore 500/batch limiti, biz 450 kullanıyoruz
            const batches: ReturnType<typeof writeBatch>[] = [];
            let current = writeBatch(db);
            let count = 0;
            for (const u of targetUsers) {
                const notifRef = doc(collection(db, COLLECTIONS.notifications));
                current.set(notifRef, {
                    userId: u.id,
                    type: 'broadcast',
                    title: bcTitle.trim(),
                    body: bcBody.trim(),
                    data: { target },
                    broadcastId: broadcastRef.id,
                    read: false,
                    createdAt: serverTimestamp(),
                    createdBy: authUser?.uid || 'super-admin',
                });
                count += 1;
                if (count >= 450) {
                    batches.push(current);
                    current = writeBatch(db);
                    count = 0;
                }
            }
            if (count > 0) batches.push(current);
            await Promise.all(batches.map(b => b.commit()));

            toast({
                title: '✅ Duyuru Gönderildi',
                description: `${targetUsers.length} kullanıcıya bildirim ulaştırıldı.`,
            });
            setBcTitle('');
            setBcBody('');
            setTarget('');
        } catch (e) {
            console.error('Broadcast failed:', e);
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Hata.';
            toast({
                variant: 'destructive',
                title: 'Gönderilemedi',
                description: code === 'permission-denied'
                    ? 'Super-admin yetkisi gerekli.'
                    : message,
            });
        } finally {
            setBcSending(false);
        }
    };

    const handleSendDM = async () => {
        if (!selectedEntityId) {
            toast({ variant: 'destructive', title: 'Alıcı seç', description: 'Bir alıcı seçin.' });
            return;
        }
        if (!dmSubject.trim() || !dmBody.trim()) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Konu ve mesaj gerekli.' });
            return;
        }

        setDmSending(true);
        try {
            // DM = tek alıcılı bir broadcast — parent doc + broadcastId damgası ile
            // Trafik İzleme'de aynı şekilde özetlenir.
            const broadcastRef = await addDoc(collection(db, COLLECTIONS.broadcasts), {
                type: 'dm',
                title: dmSubject.trim(),
                body: dmBody.trim(),
                target: recipientType,
                targetCount: 1,
                status: 'sent',
                createdAt: serverTimestamp(),
                createdBy: authUser?.uid || 'super-admin',
            });

            await addDoc(collection(db, COLLECTIONS.notifications), {
                userId: selectedEntityId,
                type: 'dm',
                title: dmSubject.trim(),
                body: dmBody.trim(),
                data: { recipientType },
                broadcastId: broadcastRef.id,
                read: false,
                createdAt: serverTimestamp(),
                createdBy: authUser?.uid || 'super-admin',
            });

            // Kuruluş yöneticilerine DM giderken kurumun kurumsal mesaj inbox'ına
            // (/messages → entity-admin görür) de aynı içeriği yaz. Böylece yönetici
            // kişisel bildirim yanında kuruluşunun panelinden de erişebilir.
            if (recipientType === 'ngo' || recipientType === 'brand' || recipientType === 'club') {
                const targetUser = (allUsers || []).find(u => u.id === selectedEntityId);
                const entityId =
                    recipientType === 'ngo' ? targetUser?.managedNgoId :
                    recipientType === 'brand' ? targetUser?.managedBrandId :
                    targetUser?.managedClubId;
                const entityList =
                    recipientType === 'ngo' ? ngos :
                    recipientType === 'brand' ? brands :
                    clubs;
                const entityName = entityId
                    ? ((entityList || []).find(e => e.id === entityId)?.name || entityId)
                    : null;
                if (entityId) {
                    try {
                        await addDoc(collection(db, COLLECTIONS.messages), {
                            sender: { id: authUser?.uid || 'super-admin', name: 'hangel Süper Admin', avatarUrl: null },
                            senderId: authUser?.uid || 'super-admin',
                            recipient: { id: entityId, name: entityName, avatarUrl: null },
                            recipientId: entityId,
                            subject: dmSubject.trim(),
                            content: dmBody.trim(),
                            timestamp: serverTimestamp(),
                            status: 'sent',
                            broadcastId: broadcastRef.id,
                            source: 'super-admin-dm',
                        });
                    } catch (e2) {
                        // Kurumsal inbox yazımı başarısızsa DM yine de iletilmiş sayılır.
                        console.warn('Kurumsal inbox yazılamadı:', e2);
                    }
                }
            }

            toast({ title: '✅ Mesaj Gönderildi', description: 'Alıcıya bildirim ulaştırıldı; kuruluş ise panelin mesaj kutusuna da kopyalandı.' });
            setDmSubject('');
            setDmBody('');
            setSelectedEntityId(null);
            setEntitySearchTerm('');
        } catch (e) {
            console.error('DM failed:', e);
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Hata.';
            toast({
                variant: 'destructive',
                title: 'Gönderilemedi',
                description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : message,
            });
        } finally {
            setDmSending(false);
        }
    };

    // İzleme tablosu
    const filteredLog = useMemo(() => {
        const q = logSearchTerm.toLowerCase();
        return (sentNotifs || []).filter((n) =>
            (n.title || '').toLowerCase().includes(q) ||
            (n.body || '').toLowerCase().includes(q) ||
            (n.type || '').toLowerCase().includes(q),
        );
    }, [sentNotifs, logSearchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div>
                <h1 className="text-2xl font-bold font-headline">İletişim Merkezi</h1>
                <p className="text-muted-foreground text-sm">
                    Direkt mesaj, toplu bildirim ve duyuru gönderimlerinizi yönetin. Bildirimler kullanıcının
                    /notifications sayfasında ve header zil ikonunda anlık görünür.
                </p>
            </div>

            <Tabs defaultValue="broadcast">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                    <TabsTrigger value="broadcast"><Bell className="mr-2 h-4 w-4" /> Toplu Bildirim</TabsTrigger>
                    <TabsTrigger value="dm"><MessageSquare className="mr-2 h-4 w-4" /> Direkt Mesaj</TabsTrigger>
                    <TabsTrigger value="monitor"><History className="mr-2 h-4 w-4" /> Trafik İzleme</TabsTrigger>
                </TabsList>

                {/* TOPLU BİLDİRİM */}
                <TabsContent value="broadcast" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Yeni Toplu Duyuru Oluştur</CardTitle>
                                <CardDescription>
                                    Seçilen hedef gruptaki tüm kullanıcılara anlık in-app bildirim gönderir.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Hedef Grup</Label>
                                    <Select value={target} onValueChange={(v: TargetGroup) => setTarget(v)}>
                                        <SelectTrigger><SelectValue placeholder="Grup seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TARGET_LABELS).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {target && (
                                        <p className="text-xs text-muted-foreground">
                                            {usersLoading
                                                ? 'Eşleşen kullanıcı sayısı hesaplanıyor...'
                                                : <>
                                                    <strong>{targetUsers.length}</strong> kullanıcıya gönderilecek
                                                </>}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Duyuru Başlığı</Label>
                                    <Input
                                        placeholder="Önemli Bilgilendirme"
                                        value={bcTitle}
                                        onChange={e => setBcTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mesaj İçeriği</Label>
                                    <Textarea
                                        rows={6}
                                        placeholder="Duyuru detaylarını buraya yazın..."
                                        value={bcBody}
                                        onChange={e => setBcBody(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end gap-2">
                                <Button
                                    onClick={handleBroadcast}
                                    disabled={bcSending || !target || !bcTitle.trim() || !bcBody.trim() || targetUsers.length === 0}
                                >
                                    {bcSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Duyuruyu Yayınla ({targetUsers.length})
                                </Button>
                            </CardFooter>
                        </Card>
                        <div className="space-y-6">
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-sm">Erişim İstatistikleri</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-xs">
                                    <div className="flex justify-between">
                                        <span>Toplam Kullanıcı</span>
                                        <span className="font-bold">{(allUsers?.length || 0).toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>STK Yöneticisi</span>
                                        <span className="font-bold">{(allUsers || []).filter(u => u.managedNgoId).length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kulüp Yöneticisi</span>
                                        <span className="font-bold">{(allUsers || []).filter(u => u.managedClubId).length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Marka Yöneticisi</span>
                                        <span className="font-bold">{(allUsers || []).filter(u => u.managedBrandId).length}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-amber-200 bg-amber-50/40">
                                <CardContent className="p-4 text-xs space-y-1">
                                    <p className="font-bold text-amber-900">⚡ Anlık Yansıma</p>
                                    <p className="text-amber-800 leading-relaxed">
                                        Bildirimler Firestore'a yazılır yazılmaz kullanıcının zil ikonunda
                                        sayaç artar ve /notifications sayfasında görünür. SMS/e-posta
                                        gönderimi için ayrıca Cloud Function gerekir.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* DİREKT MESAJ */}
                <TabsContent value="dm" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bireysel Direkt Mesaj</CardTitle>
                            <CardDescription>
                                Belirli bir kullanıcıya, STK / kulüp / marka yöneticisine direkt bildirim gönderin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Alıcı Türü</Label>
                                    <Select
                                        value={recipientType}
                                        onValueChange={(v) => {
                                            setRecipientType(v as 'user' | 'ngo' | 'brand' | 'club' | '');
                                            setSelectedEntityId(null);
                                            setEntitySearchTerm('');
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Kullanıcı</SelectItem>
                                            <SelectItem value="ngo">STK Yöneticisi</SelectItem>
                                            <SelectItem value="brand">Marka Yöneticisi</SelectItem>
                                            <SelectItem value="club">Kulüp Yöneticisi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {recipientType && (
                                    <div className="space-y-2 p-3 border rounded-xl bg-muted/20">
                                        <Label>Alıcı Ara</Label>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={recipientType === 'user' ? 'İsim, e-posta, telefon...' : 'İsim ile ara...'}
                                                className="pl-8"
                                                value={entitySearchTerm}
                                                onChange={(e) => setEntitySearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                            {filteredEntities.length > 0 ? filteredEntities.map(entity => {
                                                const Icon = entity.icon;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={entity.id}
                                                        onClick={() => setSelectedEntityId(entity.id)}
                                                        className={cn(
                                                            'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border text-left',
                                                            selectedEntityId === entity.id
                                                                ? 'bg-primary/10 border-primary'
                                                                : 'hover:bg-accent border-transparent',
                                                        )}
                                                    >
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={entity.avatar} />
                                                            <AvatarFallback>{(entity.name || '?')[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{entity.name}</p>
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                                                <Icon className="h-2.5 w-2.5" />
                                                                {entity.sub} {entity.phone && `• ${entity.phone}`}
                                                            </p>
                                                        </div>
                                                        {selectedEntityId === entity.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                                    </button>
                                                );
                                            }) : (
                                                <p className="text-center py-4 text-xs text-muted-foreground">
                                                    Eşleşen alıcı bulunamadı.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Mesaj Konusu</Label>
                                    <Input
                                        placeholder="Resmi Bilgilendirme"
                                        value={dmSubject}
                                        onChange={e => setDmSubject(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mesaj İçeriği</Label>
                                    <Textarea
                                        rows={5}
                                        placeholder="İletmek istediğiniz mesajı yazın..."
                                        value={dmBody}
                                        onChange={e => setDmBody(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={dmSending || !selectedEntityId || !dmSubject.trim() || !dmBody.trim()}
                                    onClick={handleSendDM}
                                >
                                    {dmSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Mesajı Gönder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TRAFİK İZLEME */}
                <TabsContent value="monitor" className="mt-6 space-y-6">
                    {/* ÖZET — toplam duyuru / gönderim / okuma / okuma oranı */}
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Trafik Özeti
                            </CardTitle>
                            <CardDescription>
                                Gönderilen tüm mesaj ve bildirimlerin toplam erişim ve okuma istatistikleri.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl border bg-background">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        <Bell className="h-3 w-3" />
                                        Toplam Duyuru
                                    </div>
                                    <p className="text-2xl font-bold mt-1">
                                        {monitorSummary.totalBroadcasts.toLocaleString('tr-TR')}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl border bg-background">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        <Send className="h-3 w-3" />
                                        Toplam Gönderim
                                    </div>
                                    <p className="text-2xl font-bold mt-1">
                                        {monitorSummary.totalSent.toLocaleString('tr-TR')}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl border bg-background">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        <MailOpen className="h-3 w-3" />
                                        Okuyan Kişi
                                    </div>
                                    <p className="text-2xl font-bold mt-1">
                                        {monitorSummary.allCountsLoaded
                                            ? monitorSummary.totalRead.toLocaleString('tr-TR')
                                            : <span className="text-muted-foreground text-base">hesaplanıyor…</span>}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl border bg-background">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        <Eye className="h-3 w-3" />
                                        Okuma Oranı
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-2xl font-bold">
                                            {monitorSummary.overallRate !== null
                                                ? `%${monitorSummary.overallRate}`
                                                : <span className="text-muted-foreground text-base">—</span>}
                                        </p>
                                    </div>
                                    {monitorSummary.overallRate !== null && (
                                        <Progress value={monitorSummary.overallRate} className="h-1.5 mt-2" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ARAMA */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Başlık, mesaj, tip veya hedef grup ile ara..."
                            className="pl-10 h-10"
                            value={monitorSearchTerm}
                            onChange={(e) => setMonitorSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* GRUPLU LİSTE — Toplu Duyurular */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Bell className="h-4 w-4" />
                                Toplu Duyurular
                                <Badge variant="secondary" className="ml-1 text-[10px]">
                                    {groupedBroadcasts.broadcast.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Tıklayarak alıcı listesini ve kurum bazlı okuma kırılımını görüntüleyin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {groupedBroadcasts.broadcast.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Bell className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p>Henüz toplu duyuru gönderilmedi.</p>
                                </div>
                            ) : (
                                <div className="border rounded-xl overflow-hidden">
                                    <Accordion
                                        type="multiple"
                                        value={openBroadcastIds}
                                        onValueChange={handleAccordionChange}
                                    >
                                        {groupedBroadcasts.broadcast.map((b) => (
                                            <BroadcastAccordionItem
                                                key={b.id}
                                                broadcast={b}
                                                readCount={broadcastReadCounts.get(b.id) ?? null}
                                                recipients={recipientsCache.get(b.id) ?? null}
                                                isLoading={recipientsLoading.has(b.id)}
                                                userById={userById}
                                            />
                                        ))}
                                    </Accordion>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* GRUPLU LİSTE — Direkt Mesajlar */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="h-4 w-4" />
                                Direkt Mesajlar
                                <Badge variant="secondary" className="ml-1 text-[10px]">
                                    {groupedBroadcasts.dm.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Süper admin tarafından bireysel olarak gönderilen mesajlar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {groupedBroadcasts.dm.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <MessageSquare className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p>Henüz direkt mesaj gönderilmedi.</p>
                                </div>
                            ) : (
                                <div className="border rounded-xl overflow-hidden">
                                    <Accordion
                                        type="multiple"
                                        value={openBroadcastIds}
                                        onValueChange={handleAccordionChange}
                                    >
                                        {groupedBroadcasts.dm.map((b) => (
                                            <BroadcastAccordionItem
                                                key={b.id}
                                                broadcast={b}
                                                readCount={broadcastReadCounts.get(b.id) ?? null}
                                                recipients={recipientsCache.get(b.id) ?? null}
                                                isLoading={recipientsLoading.has(b.id)}
                                                userById={userById}
                                            />
                                        ))}
                                    </Accordion>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* HAM BİLDİRİM KAYITLARI — son 100 satır düz liste */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Ham Bildirim Akışı</CardTitle>
                            <CardDescription>
                                Son 100 bildirim — tip, başlık, alıcı, tarih (broadcast'e bağlı olmayanlar dahil).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Başlık, mesaj veya tip ile ara..."
                                    className="pl-10 h-10"
                                    value={logSearchTerm}
                                    onChange={(e) => setLogSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="border rounded-xl overflow-hidden divide-y">
                                {filteredLog.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <Bell className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                        <p>Bildirim yok.</p>
                                    </div>
                                ) : filteredLog.slice(0, 50).map((n) => (
                                    <div key={n.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/30">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-sm truncate">{n.title}</p>
                                                <Badge variant="outline" className="text-[9px] uppercase">{n.type || 'mesaj'}</Badge>
                                                {n.read && <Badge variant="secondary" className="text-[9px]">okundu</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {n.userId?.slice(0, 8)}… · {(n.createdAt as { toDate?: () => Date } | null)?.toDate
                                                    ? (n.createdAt as { toDate: () => Date }).toDate().toLocaleString('tr-TR')
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
