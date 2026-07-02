'use client';

import React, { useMemo, useState, useRef } from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    ArrowLeft,
    Calendar,
    Plus,
    Landmark,
    Info,
    CheckCircle2,
    ShieldAlert,
    Loader2,
    Hourglass,
    XCircle,
    Upload,
    Trash2,
    Mic2,
    ListOrdered,
    Pencil,
    MapPin,
    Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { LocationFields } from '@/components/shared/location-fields';
import { VenueManager } from './_components/venue-manager';
import { EventAttendees } from '@/components/events/event-attendees';
import { EventCheckinQR } from '@/components/events/event-checkin-qr';
import { EventCompleteButton } from '@/components/events/event-complete-button';
import { EventBadgeCards, EventCertificates } from '@/components/events/event-bulk-docs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { EventContributor, EventContributorRole, EventAgendaItem } from '@/lib/types';
import { fireOrgLifecycle } from '@/lib/org-lifecycle-client';
import { SocialShareButton } from '@/components/ngo-admin/social-share-dialog';

type EntityKind = 'ngo' | 'brand' | 'club';

interface EntityDoc {
    id: string;
    name?: string;
    adminUserId?: string;
    logoUrl?: string;
    avatarUrl?: string;
}

const CONTRIBUTOR_ROLE_OPTIONS: { value: EventContributorRole; label: string }[] = [
    { value: 'speaker', label: 'Konuşmacı' },
    { value: 'moderator', label: 'Moderatör' },
    { value: 'panelist', label: 'Panelist' },
    { value: 'instructor', label: 'Eğitmen' },
    { value: 'host', label: 'Sunucu' },
    { value: 'artist', label: 'Sanatçı' },
    { value: 'musician', label: 'Müzisyen' },
    { value: 'dj', label: 'DJ' },
    { value: 'performer', label: 'Performans Sanatçısı' },
    { value: 'writer', label: 'Yazar' },
    { value: 'academic', label: 'Akademisyen' },
    { value: 'jury', label: 'Jüri Üyesi' },
    { value: 'guest', label: 'Özel Konuk' },
];

type EventStatus = 'Beklemede' | 'Yayında' | 'Aktif' | 'Reddedildi';

interface ClubEventDoc {
    id: string;
    name?: string;
    slug?: string;
    organizer?: string;
    organizerId?: string;
    date?: string;
    startDate?: string;
    location?: { type?: string; address?: string; city?: string; district?: string };
    description?: string;
    status?: EventStatus;
    createdAt?: number;
}

const EVENT_TYPE_OPTIONS = ['Seminer', 'Atölye', 'Konferans', 'Panel', 'Söyleşi', 'Konser', 'Sergi', 'Gezi / Tur', 'Turnuva', 'Yarışma', 'Eğitim', 'Buluşma', 'Gönüllülük', 'Bağış Kampanyası', 'Diğer'];
const EVENT_LANGUAGE_OPTIONS = ['Türkçe', 'İngilizce', 'Türkçe + İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İşaret Dili', 'Diğer'];

function StatusBadge({ status }: { status?: EventStatus }) {
    const { t } = useTranslation();
    const s = status || 'Beklemede';
    if (s === 'Beklemede') {
        return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                <Hourglass className="mr-1 h-3 w-3" /> {t('ngo_admin_events.statusPending')}
            </Badge>
        );
    }
    if (s === 'Reddedildi') {
        return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/40 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                <XCircle className="mr-1 h-3 w-3" /> {t('ngo_admin_events.statusRejected')}
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/40 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            <CheckCircle2 className="mr-1 h-3 w-3" /> {t('ngo_admin_events.statusPublished')}
        </Badge>
    );
}

export default function EventManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    // Aktif kuruluş (ActiveEntityProvider) — banner ve sayfa içeriği tek kaynak.
    const { id: activeIdFromCtx, kind: activeKind, isLoading: activeLoading } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<EntityDoc>();

    const activeEntity = useMemo<{ kind: EntityKind; data: EntityDoc } | null>(() => {
        if (!activeIdFromCtx || !activeKind || !activeDoc) return null;
        return { kind: activeKind, data: activeDoc };
    }, [activeIdFromCtx, activeKind, activeDoc]);

    const initialLoading = activeLoading;
    // Etkinlik oluşturabilen entity: öğrenci kulübü VEYA STK (marka hariç).
    // (Değişken adı geçmişten 'isClub'; artık STK'yı da kapsıyor.)
    const isClub = activeEntity?.kind === 'club' || activeEntity?.kind === 'ngo';

    // ---- Existing events for this club ----
    const myEventsQ = useMemoFirebase(
        () =>
            firestore && isClub && activeEntity?.data.id
                ? query(collection(firestore, COLLECTIONS.events), where('organizerId', '==', activeEntity.data.id))
                : null,
        [firestore, isClub, activeEntity?.data.id],
    );
    const { data: myEvents } = useCollection<ClubEventDoc>(myEventsQ);

    // ---- New / edit event dialog state ----
    const [createOpen, setCreateOpen] = useState(false);
    // null = oluşturma modu; doc id = o etkinliği düzenleme modu.
    const [editingId, setEditingId] = useState<string | null>(null);
    const [existingPosterUrl, setExistingPosterUrl] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [evName, setEvName] = useState('');
    const [evDate, setEvDate] = useState('');
    const [evCity, setEvCity] = useState('');
    const [evDistrict, setEvDistrict] = useState('');
    const [evNeighborhood, setEvNeighborhood] = useState('');
    const [evAddress, setEvAddress] = useState('');
    const [evLat, setEvLat] = useState('');
    const [evLon, setEvLon] = useState('');
    const [evDescription, setEvDescription] = useState('');
    const [evPosterFile, setEvPosterFile] = useState<File | null>(null);
    const [evPosterPreview, setEvPosterPreview] = useState<string | null>(null);
    const [evPosterUploading, setEvPosterUploading] = useState(false);
    const [evStartTime, setEvStartTime] = useState('');
    const [evEndDate, setEvEndDate] = useState('');
    const [evEndTime, setEvEndTime] = useState('');
    const [evTypes, setEvTypes] = useState<string[]>([]);
    const [evCapacity, setEvCapacity] = useState('');
    const [evLanguage, setEvLanguage] = useState('Türkçe');
    const [evCertificate, setEvCertificate] = useState(false);
    // Konuşmacılar / Sanatçılar. Kişi hangel üyesiyse TELEFONLA sorgulanır; üyeyse
    // adı otomatik gelir + userId bağlanır (isim kilitlenir, ünvan elle girilir).
    // Üye değilse isim-soyisim elle yazılır, userId boş kalır.
    const [contributors, setContributors] = useState<EventContributor[]>([]);
    // Her contributor satırının telefon sorgu durumu (paralel dizi).
    type ContributorLookup = {
        phone: string;
        status: 'idle' | 'loading' | 'member' | 'notfound';
        locked: boolean; // üye bulundu → isim alanı readonly
    };
    const [contributorLookups, setContributorLookups] = useState<ContributorLookup[]>([]);
    const [agenda, setAgenda] = useState<EventAgendaItem[]>([]);
    const posterInputRef = useRef<HTMLInputElement>(null);

    const addContributor = () => {
        setContributors((prev) => [...prev, { name: '', title: '', role: 'speaker' }]);
        setContributorLookups((prev) => [...prev, { phone: '', status: 'idle', locked: false }]);
    };
    const updateContributor = (idx: number, patch: Partial<EventContributor>) => {
        setContributors((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
    };
    const updateContributorLookup = (idx: number, patch: Partial<ContributorLookup>) => {
        setContributorLookups((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    };
    // Telefonu değiştirince üyelik bağı sıfırlanır (yeniden elle isim girilebilsin).
    const handleContributorPhoneChange = (idx: number, phone: string) => {
        updateContributorLookup(idx, { phone, status: 'idle', locked: false });
        updateContributor(idx, { userId: undefined });
    };
    const lookupContributorPhone = async (idx: number) => {
        const phone = (contributorLookups[idx]?.phone || '').trim();
        if (!phone) return;
        if (!authUser) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Sorgu için giriş yapın.' });
            return;
        }
        updateContributorLookup(idx, { status: 'loading' });
        try {
            const idToken = await authUser.getIdToken();
            const res = await fetch('/api/ngo-admin/users/lookup-by-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ phone }),
            });
            const data = (await res.json().catch(() => null)) as
                | { found?: boolean; uid?: string; name?: string; message?: string }
                | null;
            if (!res.ok) {
                updateContributorLookup(idx, { status: 'idle', locked: false });
                toast({ variant: 'destructive', title: 'Sorgu başarısız', description: data?.message || 'Telefon sorgulanamadı.' });
                return;
            }
            if (data?.found && data.uid) {
                updateContributor(idx, { userId: data.uid, name: data.name || contributors[idx]?.name || '' });
                updateContributorLookup(idx, { status: 'member', locked: true });
            } else {
                updateContributor(idx, { userId: undefined });
                updateContributorLookup(idx, { status: 'notfound', locked: false });
            }
        } catch {
            updateContributorLookup(idx, { status: 'idle', locked: false });
            toast({ variant: 'destructive', title: 'Sorgu başarısız', description: 'Telefon sorgulanamadı.' });
        }
    };
    const removeContributor = (idx: number) => {
        setContributors((prev) => prev.filter((_, i) => i !== idx));
        setContributorLookups((prev) => prev.filter((_, i) => i !== idx));
    };

    const addAgendaItem = () => setAgenda((prev) => [...prev, { time: '', title: '' }]);
    const updateAgendaItem = (idx: number, patch: Partial<EventAgendaItem>) => {
        setAgenda((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
    };
    const removeAgendaItem = (idx: number) => setAgenda((prev) => prev.filter((_, i) => i !== idx));

    const handlePosterFile = (file: File | null) => {
        if (!file) {
            setEvPosterFile(null);
            setEvPosterPreview(null);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Afiş en fazla 5 MB olmalı.' });
            return;
        }
        setEvPosterFile(file);
        setEvPosterPreview(URL.createObjectURL(file));
    };

    const resetForm = () => {
        setEvName('');
        setEvDate('');
        setEvCity('');
        setEvDistrict('');
        setEvNeighborhood('');
        setEvAddress('');
        setEvLat('');
        setEvLon('');
        setEvDescription('');
        setEvStartTime('');
        setEvEndDate('');
        setEvEndTime('');
        setEvTypes([]);
        setEvCapacity('');
        setEvLanguage('Türkçe');
        setEvCertificate(false);
        setContributors([]);
        setContributorLookups([]);
        setAgenda([]);
        if (evPosterPreview) URL.revokeObjectURL(evPosterPreview);
        setEvPosterFile(null);
        setEvPosterPreview(null);
        setEditingId(null);
        setExistingPosterUrl('');
        if (posterInputRef.current) posterInputRef.current.value = '';
    };

    // Mevcut bir etkinliği düzenlemek için formu doldurup dialog'u açar.
    const openCreate = () => {
        resetForm();
        setCreateOpen(true);
    };
    const openEdit = (ev: ClubEventDoc) => {
        const e = ev as ClubEventDoc & {
            time?: string; endDate?: string; tags?: string[]; type?: string;
            capacity?: { max?: number }; language?: string; providesCertificate?: boolean;
            location?: { address?: string; city?: string; district?: string; neighborhood?: string; lat?: string; lon?: string };
            description?: string; imageUrl?: string;
            contributors?: EventContributor[]; agenda?: EventAgendaItem[];
        };
        setEvName(e.name || '');
        setEvDate(e.date || (e.startDate || '').split(' ')[0] || '');
        setEvStartTime(e.time || '');
        const [endD, endT] = (e.endDate || '').split(' ');
        setEvEndDate(endD || '');
        setEvEndTime(endT || '');
        setEvCity(e.location?.city || '');
        setEvDistrict(e.location?.district || '');
        setEvNeighborhood(e.location?.neighborhood || '');
        setEvAddress(e.location?.address || '');
        setEvLat(e.location?.lat || '');
        setEvLon(e.location?.lon || '');
        setEvDescription(e.description || '');
        setEvTypes(e.tags && e.tags.length ? e.tags : (e.type ? [e.type] : []));
        setEvCapacity(e.capacity?.max ? String(e.capacity.max) : '');
        setEvLanguage(e.language || 'Türkçe');
        setEvCertificate(Boolean(e.providesCertificate));
        const contribs = e.contributors || [];
        setContributors(contribs.map((c) => ({ name: c.name || '', title: c.title || '', role: c.role || 'speaker', ...(c.userId ? { userId: c.userId } : {}) })));
        setContributorLookups(contribs.map((c) => ({ phone: '', status: c.userId ? 'member' as const : 'idle' as const, locked: Boolean(c.userId) })));
        setAgenda((e.agenda || []).map((a) => ({ time: a.time || '', title: a.title || '' })));
        setEvPosterFile(null);
        setEvPosterPreview(e.imageUrl || null);
        setExistingPosterUrl(e.imageUrl || '');
        setEditingId(ev.id);
        setCreateOpen(true);
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !activeEntity || !isClub) return;
        if (!evName.trim() || !evDate.trim()) {
            toast({ title: t('ngo_admin_events.missingFieldToast'), description: t('ngo_admin_events.missingFieldDesc'), variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const slug = evName
                .toLowerCase()
                .replace(/[ıİ]/g, 'i')
                .replace(/[şŞ]/g, 's')
                .replace(/[ğĞ]/g, 'g')
                .replace(/[üÜ]/g, 'u')
                .replace(/[öÖ]/g, 'o')
                .replace(/[çÇ]/g, 'c')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const finalSlug = `${slug}-${Date.now().toString(36)}`;
            const posterKey = editingId || finalSlug;

            // Afiş upload (varsa) — Firebase Storage'a yükle. Düzenlemede yeni dosya
            // yoksa mevcut afiş korunur.
            let posterUrl = editingId ? existingPosterUrl : '';
            if (evPosterFile) {
                setEvPosterUploading(true);
                try {
                    const storage = getStorage();
                    const ext = (evPosterFile.name.split('.').pop() || 'jpg').toLowerCase();
                    const r = storageRef(storage, `event-posters/${activeEntity.data.id}/${posterKey}.${ext}`);
                    await uploadBytes(r, evPosterFile, { contentType: evPosterFile.type });
                    posterUrl = await getDownloadURL(r);
                } catch (uploadErr) {
                    console.error('Poster upload failed', uploadErr);
                    toast({ variant: 'destructive', title: 'Afiş yüklenemedi', description: 'Etkinlik afişsiz kaydedildi; sonra düzenleyebilirsin.' });
                } finally {
                    setEvPosterUploading(false);
                }
            }

            const startDateStr = evStartTime ? `${evDate} ${evStartTime}` : evDate;
            const endDateStr = evEndDate
                ? (evEndTime ? `${evEndDate} ${evEndTime}` : evEndDate)
                : '';

            // Konuşmacı/sanatçı listesi — boş isimli satırları at, undefined alan yazma.
            // Telefon sorgusu üyeyi bulduysa satırda userId set olur; yoksa undefined kalır.
            const cleanContributors: EventContributor[] = contributors
                .map((c) => ({ ...c, name: c.name.trim(), title: c.title.trim() }))
                .filter((c) => c.name.length > 0)
                .map((c) => {
                    const out: EventContributor = { name: c.name, title: c.title, role: c.role };
                    if (c.userId) out.userId = c.userId; // undefined yazmaktan kaçın
                    return out;
                });

            // Program/akış — saat ya da başlığı olan satırları al.
            const cleanAgenda: EventAgendaItem[] = agenda
                .map((a) => ({ time: a.time.trim(), title: a.title.trim() }))
                .filter((a) => a.time.length > 0 || a.title.length > 0);

            // Düzenleyen kuruluşun logosu (avatarUrl/logoUrl); yoksa boş string.
            const organizerLogoUrl = activeEntity.data.logoUrl || activeEntity.data.avatarUrl || '';

            // ---- DÜZENLEME modu: server-side update + tüm katılımcı/konuşmacıya bildirim ----
            if (editingId) {
                if (!authUser) {
                    toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Düzenleme için giriş yapın.' });
                    return;
                }
                const idToken = await authUser.getIdToken();
                const res = await fetch(`/api/events/${editingId}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify({
                        name: evName.trim(),
                        date: evDate,
                        startDate: startDateStr,
                        endDate: endDateStr,
                        time: evStartTime || '',
                        type: evTypes[0] || '',
                        tags: evTypes,
                        language: evLanguage,
                        capacity: { max: Number(evCapacity) || 0 },
                        participationCondition: 'Herkese Açık',
                        providesCertificate: evCertificate,
                        location: {
                            type: 'Fiziksel',
                            address: evAddress.trim(),
                            city: evCity.trim(),
                            district: evDistrict.trim(),
                            neighborhood: evNeighborhood.trim(),
                            lat: evLat || '',
                            lon: evLon || '',
                        },
                        description: evDescription.trim(),
                        imageUrl: posterUrl,
                        contributors: cleanContributors,
                        agenda: cleanAgenda,
                        organizerLogoUrl,
                    }),
                });
                const resBody = (await res.json().catch(() => null)) as { notified?: number; message?: string } | null;
                if (!res.ok) {
                    toast({ variant: 'destructive', title: 'Güncellenemedi', description: resBody?.message || 'Etkinlik güncellenemedi.' });
                    return;
                }
                const notified = typeof resBody?.notified === 'number' ? resBody.notified : 0;
                toast({
                    title: 'Etkinlik güncellendi',
                    description: notified > 0 ? `Değişiklikler kaydedildi · ${notified} katılımcı/konuşmacıya bildirim gönderildi.` : 'Değişiklikler kaydedildi.',
                });
                resetForm();
                setCreateOpen(false);
                return;
            }

            // ---- OLUŞTURMA modu ----
            // Force status='Beklemede' regardless of any other inputs
            const eventRef = await addDoc(collection(firestore, COLLECTIONS.events), {
                name: evName.trim(),
                slug: finalSlug,
                organizer: activeEntity.data.name || t('ngo_admin_events.defaultOrganizer'),
                organizerId: activeEntity.data.id,
                organizerKind: 'club',
                date: evDate,
                startDate: startDateStr,
                endDate: endDateStr,
                time: evStartTime || '',
                type: evTypes[0] || '',
                tags: evTypes,
                language: evLanguage,
                capacity: { current: 0, max: Number(evCapacity) || 0 },
                participationCondition: 'Herkese Açık' as const,
                providesCertificate: evCertificate,
                location: {
                    type: 'Fiziksel' as const,
                    address: evAddress.trim(),
                    city: evCity.trim(),
                    district: evDistrict.trim(),
                    neighborhood: evNeighborhood.trim(),
                    lat: evLat || '',
                    lon: evLon || '',
                },
                description: evDescription.trim(),
                imageUrl: posterUrl,
                contributors: cleanContributors,
                agenda: cleanAgenda,
                organizerLogoUrl,
                status: 'Beklemede' as EventStatus,
                createdAt: Date.now(),
                createdBy: authUser?.uid || null,
            });

            // Yaşam döngüsü: "etkinlik kaydınız alındı" (bildirim + kurumsal SMS)
            try {
                const lifecycleToken = await authUser?.getIdToken();
                await fireOrgLifecycle(lifecycleToken, { kind: 'event', stage: 'received', refId: eventRef.id });
            } catch { /* best-effort */ }

            toast({
                title: t('ngo_admin_events.requestReceivedToast'),
                description: t('ngo_admin_events.requestReceivedDesc'),
            });
            resetForm();
            setCreateOpen(false);
        } catch (err) {
            console.error('Event create failed', err);
            toast({
                title: t('ngo_admin_events.errorToast'),
                description: t('ngo_admin_events.errorDesc'),
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_events.backAria')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_events.title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('ngo_admin_events.subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* Restrictive banner when not a club */}
            {!initialLoading && activeEntity && !isClub && (
                <Card className="border-2 border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-900/20 rounded-2xl">
                    <CardHeader className="flex flex-row items-start gap-3 p-4">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">{t('ngo_admin_events.restrictiveBannerTitle')}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                                {t('ngo_admin_events.restrictiveBannerDescPrefix')}{activeEntity.kind === 'ngo' ? t('ngo_admin_events.restrictiveBannerDescNgo') : t('ngo_admin_events.restrictiveBannerDescBrand')}{t('ngo_admin_events.restrictiveBannerDescSuffix')}
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            )}

            <Tabs defaultValue="my-events">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="my-events" className="gap-1.5 px-2"><Calendar className="h-4 w-4 shrink-0" /> <span className="truncate">{t('ngo_admin_events.tabMyEvents')}</span></TabsTrigger>
                    <TabsTrigger value="venues" className="gap-1.5 px-2"><Landmark className="h-4 w-4 shrink-0" /> <span className="truncate">{t('ngo_admin_events.tabVenues')}</span></TabsTrigger>
                    <TabsTrigger value="booking" className="gap-1.5 px-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> <span className="truncate">{t('ngo_admin_events.tabBooking')}</span></TabsTrigger>
                </TabsList>

                <TabsContent value="venues" className="mt-6 space-y-8">
                    <VenueManager activeEntityName={activeEntity?.data?.name} />

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-primary">
                                <Info className="h-5 w-5"/> {t('ngo_admin_events.howItWorksTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {t('ngo_admin_events.howItWorksDesc')}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="my-events" className="mt-6 space-y-6">
                    <Card className="rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{t('ngo_admin_events.currentEvents')}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    {isClub
                                        ? t('ngo_admin_events.currentEventsDescClub')
                                        : t('ngo_admin_events.currentEventsDescNonClub')}
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                disabled={!isClub}
                                onClick={() => isClub && openCreate()}
                                aria-disabled={!isClub}
                            >
                                <Plus className="mr-2 h-4 w-4" /> {t('ngo_admin_events.newEventBtn')}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {initialLoading && (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('ngo_admin_events.loading')}
                                </div>
                            )}

                            {!initialLoading && isClub && (myEvents?.length ?? 0) === 0 && (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    {t('ngo_admin_events.noEventsYet')}
                                </p>
                            )}

                            {!initialLoading && (myEvents?.length ?? 0) > 0 && (
                                <div className="space-y-3">
                                    {myEvents!.map((event) => (
                                        <div
                                            key={event.id}
                                            className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md flex flex-col gap-3.5"
                                        >
                                            {/* Başlık + durum + İncele (public sayfayı yeni sekmede açar) */}
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="font-bold text-[15px] leading-snug break-words text-foreground">{event.name || t('ngo_admin_events.unnamedEvent')}</h4>
                                                    <StatusBadge status={event.status} />
                                                </div>
                                                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.date || event.startDate || '—'}</span>
                                                    {event.location?.city ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location.city}</span> : null}
                                                </p>
                                              </div>
                                              <a href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer" title="İncele — public sayfayı aç" aria-label="İncele" className="shrink-0 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                                <Eye className="h-4 w-4" />
                                              </a>
                                            </div>
                                            {/* Aksiyonlar — sarılan ızgara (mobilde de hepsi görünür, taşma/sıkışma yok) */}
                                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                                                <SocialShareButton
                                                    kind="event"
                                                    item={{
                                                        title: event.name || '',
                                                        description: event.description || '',
                                                        date: event.date || event.startDate || '',
                                                        location: event.location?.address || '',
                                                        city: event.location?.city || '',
                                                        ngoName: activeEntity?.data.name || '',
                                                        url: typeof window !== 'undefined' ? `${window.location.origin}/events/${event.id}` : '',
                                                    }}
                                                />
                                                <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto" onClick={() => openEdit(event)}>
                                                    <Pencil className="h-4 w-4 mr-1.5" /> Düzenle
                                                </Button>
                                                <EventCheckinQR eventId={event.id} logoUrl={activeEntity?.data.logoUrl || activeEntity?.data.avatarUrl} />
                                                <EventCompleteButton eventId={event.id} />
                                                <EventAttendees eventId={event.id} />
                                                <EventBadgeCards eventId={event.id} eventName={event.name || ''} ngoName={activeEntity?.data.name || ''} logoUrl={activeEntity?.data.logoUrl || activeEntity?.data.avatarUrl} />
                                                <EventCertificates eventId={event.id} eventName={event.name || ''} ngoName={activeEntity?.data.name || ''} logoUrl={activeEntity?.data.logoUrl || activeEntity?.data.avatarUrl} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!initialLoading && !isClub && activeEntity && (
                                <p className="text-xs text-muted-foreground py-4">
                                    {t('ngo_admin_events.noPermission')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="booking" className="mt-6">
                    <Card><CardContent className="p-12 text-center text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>{t('ngo_admin_events.noBooking')}</p></CardContent></Card>
                </TabsContent>
            </Tabs>

            {/* Create-event dialog (clubs only) */}
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-bold">{editingId ? 'Etkinliği Düzenle' : t('ngo_admin_events.dialogTitle')}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {t('ngo_admin_events.dialogDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                        {/* Afiş yükleme — A4 portre (210/297) preview + dosya seçici */}
                        <div className="space-y-2">
                            <Label>Etkinlik Afişi (A4 portre önerilir)</Label>
                            <input
                                ref={posterInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => handlePosterFile(e.target.files?.[0] || null)}
                            />
                            {evPosterPreview ? (
                                <div className="relative">
                                    <div className="relative aspect-[210/297] max-w-[200px] mx-auto rounded-2xl overflow-hidden border bg-muted shadow-md">
                                        <NextImage src={evPosterPreview} alt="Afiş önizleme" fill className="object-cover" unoptimized />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => posterInputRef.current?.click()} disabled={evPosterUploading || submitting}>
                                            <Upload className="h-3.5 w-3.5 mr-1.5" /> Değiştir
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handlePosterFile(null)} disabled={evPosterUploading || submitting}>
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Kaldır
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => posterInputRef.current?.click()}
                                    disabled={submitting}
                                    className="w-full aspect-[210/297] max-w-[200px] mx-auto rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                                >
                                    <Upload className="h-8 w-8" />
                                    <span className="text-xs font-medium">Afiş yükle</span>
                                    <span className="text-xs text-muted-foreground/70">PNG / JPG / WEBP · max 5 MB</span>
                                    <span className="text-xs text-muted-foreground/60 px-3 text-center">A4 portre tasarladığın dosyayı direkt yükle</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ev-name">{t('ngo_admin_events.labelName')}</Label>
                            <Input id="ev-name" value={evName} onChange={(e) => setEvName(e.target.value)} placeholder={t('ngo_admin_events.placeholderName')} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="ev-date">{t('ngo_admin_events.labelDate')}</Label>
                                <Input id="ev-date" type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ev-start-time">Başlangıç Saati</Label>
                                <Input id="ev-start-time" type="time" value={evStartTime} onChange={(e) => setEvStartTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="ev-end-date">Bitiş Tarihi</Label>
                                <Input id="ev-end-date" type="date" value={evEndDate} onChange={(e) => setEvEndDate(e.target.value)} min={evDate || undefined} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ev-end-time">Bitiş Saati (tercihen)</Label>
                                <Input id="ev-end-time" type="time" value={evEndTime} onChange={(e) => setEvEndTime(e.target.value)} />
                            </div>
                        </div>
                        <LocationFields
                            value={{ country: 'Türkiye', city: evCity, district: evDistrict, neighborhood: evNeighborhood, openAddress: evAddress, lat: evLat, lon: evLon }}
                            onChange={(next) => {
                                setEvCity(next.city ?? '');
                                setEvDistrict(next.district ?? '');
                                setEvNeighborhood(next.neighborhood ?? '');
                                setEvAddress(next.openAddress ?? '');
                                setEvLat(next.lat ?? '');
                                setEvLon(next.lon ?? '');
                            }}
                            showCountry={false}
                            showOpenAddress
                            labelCity={t('ngo_admin_events.labelCity')}
                            labelOpenAddress={t('ngo_admin_events.labelAddress')}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="ev-desc">{t('ngo_admin_events.labelDescription')}</Label>
                            <Textarea id="ev-desc" rows={3} value={evDescription} onChange={(e) => setEvDescription(e.target.value)} placeholder={t('ngo_admin_events.placeholderDescription')} />
                        </div>

                        {/* Etkinlik Türü — çoktan seçmeli */}
                        <div className="space-y-2">
                            <Label>Etkinlik Türü (birden fazla seçebilirsiniz)</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border border-border rounded-xl bg-card max-h-44 overflow-y-auto overflow-x-hidden min-w-0">
                                {EVENT_TYPE_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer min-w-0">
                                        <Checkbox
                                            className="shrink-0"
                                            checked={evTypes.includes(opt)}
                                            onCheckedChange={(c) => setEvTypes((prev) => (c === true ? [...prev, opt] : prev.filter((x) => x !== opt)))}
                                        />
                                        <span className="break-words min-w-0">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="ev-capacity">Kapasite (kişi)</Label>
                                <Input id="ev-capacity" type="number" min={0} inputMode="numeric" value={evCapacity} onChange={(e) => setEvCapacity(e.target.value)} placeholder="Örn. 100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ev-language">Etkinlik Dili</Label>
                                <Select value={evLanguage} onValueChange={setEvLanguage}>
                                    <SelectTrigger id="ev-language"><SelectValue placeholder="Dil seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {EVENT_LANGUAGE_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Sertifika */}
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border rounded-xl bg-card">
                            <Checkbox checked={evCertificate} onCheckedChange={(c) => setEvCertificate(c === true)} />
                            <span>Bu etkinlik katılımcılara <strong>sertifika</strong> veriyor</span>
                        </label>

                        {/* Konuşmacılar / Sanatçılar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Mic2 className="h-4 w-4 text-muted-foreground" /> Konuşmacılar / Sanatçılar
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={addContributor}>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Ekle
                                </Button>
                            </div>
                            {contributors.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-1">
                                    Konuşmacı, sanatçı veya moderatör eklemek için “Ekle”ye dokun.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {contributors.map((c, idx) => {
                                        const lookup = contributorLookups[idx] ?? { phone: '', status: 'idle' as const, locked: false };
                                        return (
                                        <div key={idx} className="p-3 border rounded-xl bg-card space-y-2">
                                            {/* hangel üyesi mi? Telefonla sorgula */}
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">hangel üye telefonu (opsiyonel)</Label>
                                                <div className="flex items-end gap-2">
                                                    <Input
                                                        type="tel"
                                                        inputMode="tel"
                                                        value={lookup.phone}
                                                        onChange={(e) => handleContributorPhoneChange(idx, e.target.value)}
                                                        placeholder="05XX XXX XX XX"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="shrink-0"
                                                        disabled={lookup.status === 'loading' || !lookup.phone.trim()}
                                                        onClick={() => lookupContributorPhone(idx)}
                                                    >
                                                        {lookup.status === 'loading'
                                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            : 'Sorgula'}
                                                    </Button>
                                                </div>
                                                {lookup.status === 'member' && (
                                                    <Badge variant="secondary" className="mt-1 gap-1 text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800/40">
                                                        <CheckCircle2 className="h-3 w-3" /> hangel üyesi
                                                    </Badge>
                                                )}
                                                {lookup.status === 'notfound' && (
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Üye bulunamadı, ismi elle girin.</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <Input
                                                    value={c.name}
                                                    onChange={(e) => updateContributor(idx, { name: e.target.value })}
                                                    placeholder="İsim (örn. Ayşe Yılmaz)"
                                                    readOnly={lookup.locked}
                                                    className={lookup.locked ? 'bg-muted/60 cursor-not-allowed' : undefined}
                                                />
                                                <Input
                                                    value={c.title}
                                                    onChange={(e) => updateContributor(idx, { title: e.target.value })}
                                                    placeholder="Ünvan (örn. Prof. Dr., Müzisyen)"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Rol</Label>
                                                    <Select
                                                        value={c.role}
                                                        onValueChange={(v) => updateContributor(idx, { role: v as EventContributorRole })}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {CONTRIBUTOR_ROLE_OPTIONS.map((r) => (
                                                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeContributor(idx)}>
                                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Sil
                                                </Button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Program / Akış (Agenda) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <ListOrdered className="h-4 w-4 text-muted-foreground" /> Program / Akış
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Ekle
                                </Button>
                            </div>
                            {agenda.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-1">
                                    Etkinlik akışını saat saat eklemek için “Ekle”ye dokun.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {agenda.map((a, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={a.time}
                                                onChange={(e) => updateAgendaItem(idx, { time: e.target.value })}
                                                className="w-28 shrink-0"
                                            />
                                            <Input
                                                value={a.title}
                                                onChange={(e) => updateAgendaItem(idx, { title: e.target.value })}
                                                placeholder="Başlık (örn. Açılış konuşması)"
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAgendaItem(idx)} aria-label="Satırı sil">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting || evPosterUploading}>{t('ngo_admin_events.cancelBtn')}</Button>
                            <Button type="submit" disabled={submitting || evPosterUploading}>
                                {(submitting || evPosterUploading)
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {evPosterUploading ? 'Afiş yükleniyor...' : (editingId ? 'Güncelleniyor...' : t('ngo_admin_events.submitting'))}</>
                                    : (editingId ? 'Güncelle' : t('ngo_admin_events.submitBtn'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
