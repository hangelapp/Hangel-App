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
    Megaphone,
    Building2,
    Globe,
    Copy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { LocationFields } from '@/components/shared/location-fields';
import { VenueManager } from './_components/venue-manager';
import { EventAttendees } from '@/components/events/event-attendees';
import { EventCheckinQR } from '@/components/events/event-checkin-qr';
import { EventPhotosAdmin } from '@/components/events/event-photos-admin';
import { EventCompleteButton } from '@/components/events/event-complete-button';
import { RewardManager } from '@/components/rewards/reward-manager';
import { ExamManager } from '@/components/exam/exam-manager';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, getDoc, query, setDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type {
    EventContributor,
    EventContributorRole,
    EventAgendaItem,
    CorporateParticipant,
    CorporateParticipantType,
    EventSponsor,
    EventPoint,
} from '@/lib/types';
import { fireOrgLifecycle } from '@/lib/org-lifecycle-client';
import { SocialShareButton } from '@/components/ngo-admin/social-share-dialog';
import { BroadcastMessageButton } from '@/components/messaging/broadcast-message-button';
import { AssignManagerButton } from '@/components/ngo-admin/assign-manager-button';
import { EventChecklistButton } from '@/components/events/event-checklist-button';

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

const CORPORATE_PARTICIPANT_TYPE_OPTIONS: { value: CorporateParticipantType; label: string }[] = [
    { value: 'stk', label: 'STK' },
    { value: 'belediye', label: 'Belediye' },
    { value: 'valilik', label: 'Valilik' },
    { value: 'marka', label: 'Marka' },
    { value: 'universite', label: 'Üniversite' },
];

// Etkinlik tema rengi hazır paleti — seçilen renk yaka kartına (--acc) ve
// detay vurgularına yansır. Boş = hangel turuncusu.
const EVENT_COLOR_PALETTE: { value: string; label: string }[] = [
    { value: '#ff5722', label: 'hangel turuncu' },
    { value: '#e11d48', label: 'Kırmızı' },
    { value: '#7c3aed', label: 'Mor' },
    { value: '#2563eb', label: 'Mavi' },
    { value: '#0891b2', label: 'Turkuaz' },
    { value: '#059669', label: 'Yeşil' },
    { value: '#ca8a04', label: 'Altın' },
    { value: '#1f2937', label: 'Antrasit' },
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
    tags?: string[];
    time?: string;
    completed?: boolean;
    completedAt?: unknown;
    endDate?: string;
    managerChecklist?: Record<string, boolean>;
    // Bu ilana özel atanmış yönetici(ler) — "Yönetici Ata" ile eklenir.
    managerUids?: string[];
    managerNames?: string[];
}

const EVENT_TYPE_OPTIONS = ['Seminer', 'Atölye', 'Konferans', 'Panel', 'Söyleşi', 'Konser', 'Sergi', 'Gezi / Tur', 'Turnuva', 'Yarışma', 'Eğitim', 'Buluşma', 'Gönüllülük', 'Bağış Kampanyası', 'Diğer'];
const EVENT_LANGUAGE_OPTIONS = ['Türkçe', 'İngilizce', 'Türkçe + İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İşaret Dili', 'Diğer'];

// ── Gelir Modeli Konferansları seri yönetimi ────────────────────────────────
// Sadece seri organizatörü ULUSLARARASI SOSYAL FAYDA DERNEĞİ panelinde görünür.
// Buradan açılan konferans, seri standardıyla (tag + slug + açıklama + sertifika)
// oluşturulur ve /gelir-modeli-konferanslari sayfasında ANINDA listelenir.
const SERIES_ORGANIZER_ID = 'ZqFO7jP2R3DvvyNlPRsp';
const SERIES_TAG = 'gelir-modeli-konferansi';
const SERIES_DESCRIPTION =
    'Sivil Toplum Kuruluşlarında Gelir Modeli Oluşturma ve Sürdürülebilirlik Eğitim Konferansı. ' +
    'Dernek, vakıf ve spor kulüplerinin gönüllü ve yöneticilerine özel; bağışçı çeşitlendirme, kurumsal iş birlikleri, ' +
    'alışverişle bağış, sosyal girişimcilik ve şeffaflık başlıklarında uygulamalı eğitim. Katılım sertifikalıdır. ' +
    'Her STK için başkan + 2 kişilik kontenjan planlanmıştır; genç yöneticilere öncelik verilir. ' +
    'Bu proje İç İşleri Bakanlığı Sivil Toplum Kuruluşları Genel Müdürlüğü tarafından desteklenmektedir.';

const slugifyTr = (s: string) =>
    s.toLocaleLowerCase('tr')
        .replaceAll('ı', 'i').replaceAll('ğ', 'g').replaceAll('ü', 'u')
        .replaceAll('ş', 's').replaceAll('ö', 'o').replaceAll('ç', 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');

function SeriesConferenceManager({ fs, organizer, events }: {
    fs: NonNullable<ReturnType<typeof useFirestore>>;
    organizer: { id: string; name: string; logoUrl?: string | null };
    events: ClubEventDoc[];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
}) {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [date, setDate] = useState('');
    const [start, setStart] = useState('14:00');
    const [end, setEnd] = useState('17:00');
    const [venue, setVenue] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const seriesEvents = events
        .filter((e) => (e.tags || []).includes(SERIES_TAG))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const create = async () => {
        if (!city.trim() || !date || !venue.trim()) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Şehir, tarih ve mekan zorunludur.' });
            return;
        }
        setSaving(true);
        try {
            // Slug: şehir (+ ilçe, şehirde ikinci etkinlikse) — çakışırsa -2, -3…
            const base = `${SERIES_TAG}-${slugifyTr(city)}`;
            let id = base;
            if ((await getDoc(doc(fs, COLLECTIONS.events, id))).exists() && district.trim()) {
                id = `${base}-${slugifyTr(district)}`;
            }
            for (let n = 2; (await getDoc(doc(fs, COLLECTIONS.events, id))).exists(); n++) {
                id = `${base}-${n}`;
            }
            await setDoc(doc(fs, COLLECTIONS.events, id), {
                name: `STK Gelir Modeli ve Sürdürülebilirlik — ${city.trim()}`,
                slug: id,
                type: 'Konferans',
                status: 'Yayında',
                language: 'Türkçe',
                participationCondition: 'Herkese Açık',
                providesCertificate: true,
                tags: ['Konferans', 'Gelir Modeli', 'Sürdürülebilirlik', SERIES_TAG],
                description: SERIES_DESCRIPTION,
                organizer: organizer.name,
                organizerId: organizer.id,
                organizerKind: 'ngo',
                organizerLogoUrl: organizer.logoUrl || null,
                date,
                time: start,
                endDate: `${date} ${end}`,
                location: { type: 'Fiziksel', address: venue.trim(), city: city.trim(), district: district.trim(), neighborhood: '', lat: '', lon: '' },
                capacity: { max: 0, current: 0 },
                imageUrl: imageUrl.trim(),
                imageHint: `${city.trim()} manzarası`,
                createdAt: Date.now(),
                createdBy: authUser?.uid || null,
                approvedBy: authUser?.uid || null,
                approvedAt: Date.now(),
            });
            toast({ title: 'Konferans yayında 🧡', description: `${city.trim()} konferansı seri sayfasına eklendi.` });
            setOpen(false);
            setCity(''); setDistrict(''); setDate(''); setStart('14:00'); setEnd('17:00'); setVenue(''); setImageUrl('');
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'Oluşturulamadı', description: (e?.message || '').slice(0, 160) || 'Bilinmeyen hata.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="rounded-2xl border-primary/25 bg-primary/[0.03]">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-primary">Gelir Modeli Konferansları</CardTitle>
                    <CardDescription className="text-xs mt-1">
                        Seri etkinlikleri buradan yönetilir; yeni şehir açıldığında{' '}
                        <a href="/gelir-modeli-konferanslari" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">seri sayfasında</a>{' '}
                        anında yayınlanır.
                    </CardDescription>
                </div>
                <Button size="sm" onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Konferans
                </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {seriesEvents.length === 0 && <p className="text-sm text-muted-foreground">Henüz seri konferansı yok.</p>}
                {seriesEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2">
                        <div className="min-w-0">
                            <p className="text-sm font-bold break-words">{ev.location?.city || ev.name}</p>
                            <p className="text-xs text-muted-foreground">{ev.date} {ev.time || ''} · {ev.location?.district || ''}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={ev.status} />
                            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                                <a href={`/events/${ev.slug || ev.id}`} target="_blank" rel="noopener noreferrer">Görüntüle</a>
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yeni Gelir Modeli Konferansı</DialogTitle>
                        <DialogDescription>Seri standardı (açıklama, sertifika, kontenjan kuralları) otomatik uygulanır.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Şehir *</Label>
                                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Afyonkarahisar" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>İlçe</Label>
                                <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Merkez" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5 col-span-1">
                                <Label>Tarih *</Label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Başlangıç</Label>
                                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Bitiş</Label>
                                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Mekan + açık adres *</Label>
                            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Afyon Valiliği B Blok Konferans Salonu — Burmalı Mah. …" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Görsel URL (opsiyonel)</Label>
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
                        </div>
                    </div>
                    <DialogFooter className="flex flex-row gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Vazgeç</Button>
                        <Button type="button" className="flex-1" disabled={saving} onClick={create}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yayınla'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

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

    // Aktif (henüz tamamlanmamış) ve tamamlanan etkinlikleri ayır. Tamamlananlar
    // ayrı "Tamamlananlar" tab'ında listelenir; public listeden 24 saat sonra
    // otomatik düşer (events/page.tsx COMPLETED_VISIBLE_WINDOW_MS). Yönetim
    // panelinde ise kalıcı arşiv olarak görünürler.
    const activeEvents = useMemo(() => (myEvents ?? []).filter((e) => e.completed !== true), [myEvents]);
    const completedEvents = useMemo(() => (myEvents ?? []).filter((e) => e.completed === true), [myEvents]);

    // Tek etkinlik kartı — hem "Etkinliklerim" hem "Tamamlananlar" tab'ında kullanılır.
    const renderEventCard = (event: ClubEventDoc) => (
        <div
            key={event.id}
            className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md flex flex-col gap-3.5"
        >
            {/* Başlık + durum + İncele (public sayfayı yeni sekmede açar) */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-[15px] leading-snug break-words text-foreground">{event.name || t('ngo_admin_events.unnamedEvent')}</h4>
                    {event.completed ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Tamamlandı</Badge> : <StatusBadge status={event.status} />}
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
                        ngoId: event.organizerId || activeEntity?.data.id || '',
                        itemId: event.id,
                    }}
                />
                <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto" onClick={() => openEdit(event)}>
                    <Pencil className="h-4 w-4 mr-1.5" /> Düzenle
                </Button>
                {/* Kopyala — etkinliği çoğaltıp düzenleme dialogunu açar (önce onay sorar). */}
                <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto" onClick={() => setDuplicateTarget(event)}>
                    <Copy className="h-4 w-4 mr-1.5" /> Kopyala
                </Button>
                <EventChecklistButton eventId={event.id} checklist={event.managerChecklist} className="rounded-xl w-full sm:w-auto" />
                <Button asChild variant="outline" size="sm" className="rounded-xl w-full sm:w-auto min-w-0 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700">
                    <a href="/ngo-admin/ads?tab=google" title="Google'da Ücretsiz Tanıt — Reklam Yönetimi (Google Ad Grants)" className="flex items-center justify-center min-w-0">
                        <Megaphone className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Ücretsiz Tanıt</span>
                    </a>
                </Button>
                <EventCheckinQR eventId={event.id} logoUrl={activeEntity?.data.logoUrl || activeEntity?.data.avatarUrl} />
                <EventPhotosAdmin eventId={event.id} />
                <RewardManager kind="event" id={event.id} />
                <ExamManager id={event.id} />
                <EventCompleteButton eventId={event.id} />
                <EventAttendees eventId={event.id} />
                <BroadcastMessageButton targetId={event.id} kind="event" title={event.name || ''} className="rounded-xl w-full sm:w-auto" />
                <EventBadgeCards eventId={event.id} eventName={event.name || ''} ngoName={activeEntity?.data.name || ''} logoUrl={activeEntity?.data.logoUrl || activeEntity?.data.avatarUrl} />
                <EventCertificates eventId={event.id} eventName={event.name || ''} ngoName={activeEntity?.data.name || ''} logoUrl={activeEntity?.data.logoUrl || activeEntity?.data.avatarUrl} />
                <AssignManagerButton
                    kind="event"
                    listingId={event.id}
                    title={event.name || ''}
                    currentManagers={(event.managerUids || []).map((uid, i) => ({ uid, name: (event.managerNames || [])[i] || '' }))}
                />
            </div>
        </div>
    );

    // ---- New / edit event dialog state ----
    const [createOpen, setCreateOpen] = useState(false);
    // null = oluşturma modu; doc id = o etkinliği düzenleme modu.
    const [editingId, setEditingId] = useState<string | null>(null);
    // Düzenlenen etkinliğin mevcut slug'ı — kaydederken KORUNUR (paylaşılan link
    // kırılmasın). Yeni etkinlikte / slug yoksa yeniden üretilir.
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
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
    // Etkinliğe özel logo (kurum logosundan ayrı) — canlı ekran + paylaşım önizlemesinde görünür.
    const [evLogoFile, setEvLogoFile] = useState<File | null>(null);
    const [evLogoPreview, setEvLogoPreview] = useState<string | null>(null);
    const [evLogoUploading, setEvLogoUploading] = useState(false);
    const [existingLogoUrl, setExistingLogoUrl] = useState<string>('');
    const [evStartTime, setEvStartTime] = useState('');
    const [evEndDate, setEvEndDate] = useState('');
    const [evEndTime, setEvEndTime] = useState('');
    const [evTypes, setEvTypes] = useState<string[]>([]);
    const [evCapacity, setEvCapacity] = useState('');
    const [evLanguage, setEvLanguage] = useState('Türkçe');
    const [evCertificate, setEvCertificate] = useState(false);
    // Sertifika teslim türü — varsayılan online. Yalnız sertifika verilirken görünür/anlamlı.
    const [evCertificateDelivery, setEvCertificateDelivery] = useState<'online' | 'physical'>('online');
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
    // Kurumsal / özel katılımcılar (STK / belediye / valilik / marka / üniversite).
    const [corporateParticipants, setCorporateParticipants] = useState<CorporateParticipant[]>([]);
    // Sponsorlar / destekleyenler (ad + logo + web) — katılımcılardan ayrı.
    const [sponsors, setSponsors] = useState<EventSponsor[]>([]);
    // Etkinlik tema rengi (hex) — yaka kartı + detay vurgularına yansır.
    const [eventColor, setEventColor] = useState<string>('');
    // Katılım noktaları — çok-noktalı etkinlik (81 il vb.). Tek-noktalı etkinlikte boş kalır.
    const [points, setPoints] = useState<EventPoint[]>([]);
    // Katılımcı logo yükleme durumu (satır id → yükleniyor mu).
    const [participantLogoUploading, setParticipantLogoUploading] = useState<Record<string, boolean>>({});
    // Sponsor logo yükleme durumu (satır id → yükleniyor mu).
    const [sponsorLogoUploading, setSponsorLogoUploading] = useState<Record<string, boolean>>({});
    const posterInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

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

    // ── Kurumsal / özel katılımcılar (contributors satır-yöneticisiyle aynı desen) ──
    const addCorporateParticipant = () =>
        setCorporateParticipants((prev) => [...prev, { id: crypto.randomUUID(), type: 'stk', name: '', website: '', logoUrl: '' }]);
    const updateCorporateParticipant = (idx: number, patch: Partial<CorporateParticipant>) =>
        setCorporateParticipants((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
    const removeCorporateParticipant = (idx: number) =>
        setCorporateParticipants((prev) => prev.filter((_, i) => i !== idx));

    // Katılımcı logosunu Storage'a yükle → logoUrl set et.
    const handleParticipantLogoFile = async (idx: number, file: File | null) => {
        if (!file || !activeEntity) return;
        if (file.size > 3 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Logo en fazla 3 MB olmalı.' });
            return;
        }
        const rowId = corporateParticipants[idx]?.id || crypto.randomUUID();
        setParticipantLogoUploading((prev) => ({ ...prev, [rowId]: true }));
        try {
            const storage = getStorage();
            const ext = (file.name.split('.').pop() || 'png').toLowerCase();
            const r = storageRef(storage, `event-participants/${activeEntity.data.id}/${rowId}.${ext}`);
            await uploadBytes(r, file, { contentType: file.type });
            const url = await getDownloadURL(r);
            updateCorporateParticipant(idx, { logoUrl: url });
        } catch (uploadErr) {
            console.error('Participant logo upload failed', uploadErr);
            toast({ variant: 'destructive', title: 'Logo yüklenemedi', description: 'Tekrar deneyin.' });
        } finally {
            setParticipantLogoUploading((prev) => ({ ...prev, [rowId]: false }));
        }
    };

    // ── Sponsorlar (katılımcı deseniyle aynı; tür/başlık yok) ──
    const addSponsor = () =>
        setSponsors((prev) => [...prev, { id: crypto.randomUUID(), name: '', website: '', logoUrl: '' }]);
    const updateSponsor = (idx: number, patch: Partial<EventSponsor>) =>
        setSponsors((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    const removeSponsor = (idx: number) =>
        setSponsors((prev) => prev.filter((_, i) => i !== idx));
    const handleSponsorLogoFile = async (idx: number, file: File | null) => {
        if (!file || !activeEntity) return;
        if (file.size > 3 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Logo en fazla 3 MB olmalı.' });
            return;
        }
        const rowId = sponsors[idx]?.id || crypto.randomUUID();
        setSponsorLogoUploading((prev) => ({ ...prev, [rowId]: true }));
        try {
            const storage = getStorage();
            const ext = (file.name.split('.').pop() || 'png').toLowerCase();
            const r = storageRef(storage, `event-sponsors/${activeEntity.data.id}/${rowId}.${ext}`);
            await uploadBytes(r, file, { contentType: file.type });
            const url = await getDownloadURL(r);
            updateSponsor(idx, { logoUrl: url });
        } catch (uploadErr) {
            console.error('Sponsor logo upload failed', uploadErr);
            toast({ variant: 'destructive', title: 'Logo yüklenemedi', description: 'Tekrar deneyin.' });
        } finally {
            setSponsorLogoUploading((prev) => ({ ...prev, [rowId]: false }));
        }
    };

    // ── Katılım noktaları (çok-noktalı etkinlik) ──
    const addPoint = () =>
        setPoints((prev) => [...prev, { id: crypto.randomUUID(), name: '', address: '', city: '', district: '', mapsUrl: '' }]);
    const updatePoint = (idx: number, patch: Partial<EventPoint>) =>
        setPoints((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
    const removePoint = (idx: number) => setPoints((prev) => prev.filter((_, i) => i !== idx));

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

    // Etkinliğe özel logo seçici (afişle aynı desen; 5 MB + image/* kontrolü).
    const handleLogoFile = (file: File | null) => {
        if (!file) {
            setEvLogoFile(null);
            setEvLogoPreview(null);
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Geçersiz dosya', description: 'Lütfen bir görsel dosyası seçin.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Logo en fazla 5 MB olmalı.' });
            return;
        }
        setEvLogoFile(file);
        setEvLogoPreview(URL.createObjectURL(file));
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
        setEvCertificateDelivery('online');
        setContributors([]);
        setContributorLookups([]);
        setAgenda([]);
        setCorporateParticipants([]);
        setSponsors([]);
        setEventColor('');
        setPoints([]);
        setParticipantLogoUploading({});
        if (evPosterPreview) URL.revokeObjectURL(evPosterPreview);
        setEvPosterFile(null);
        setEvPosterPreview(null);
        if (evLogoPreview && evLogoFile) URL.revokeObjectURL(evLogoPreview);
        setEvLogoFile(null);
        setEvLogoPreview(null);
        setExistingLogoUrl('');
        setEditingId(null);
        setEditingSlug(null);
        setExistingPosterUrl('');
        if (posterInputRef.current) posterInputRef.current.value = '';
        if (logoInputRef.current) logoInputRef.current.value = '';
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
            certificateDelivery?: 'online' | 'physical';
            location?: { address?: string; city?: string; district?: string; neighborhood?: string; lat?: string; lon?: string };
            description?: string; imageUrl?: string; eventLogoUrl?: string;
            contributors?: EventContributor[]; agenda?: EventAgendaItem[];
            corporateParticipants?: CorporateParticipant[]; points?: EventPoint[];
            sponsors?: EventSponsor[]; color?: string;
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
        setEvCertificateDelivery(e.certificateDelivery === 'physical' ? 'physical' : 'online');
        const contribs = e.contributors || [];
        setContributors(contribs.map((c) => ({ name: c.name || '', title: c.title || '', role: c.role || 'speaker', ...(c.userId ? { userId: c.userId } : {}) })));
        setContributorLookups(contribs.map((c) => ({ phone: '', status: c.userId ? 'member' as const : 'idle' as const, locked: Boolean(c.userId) })));
        setAgenda((e.agenda || []).map((a) => ({ time: a.time || '', title: a.title || '' })));
        setCorporateParticipants(
            (e.corporateParticipants || []).map((c) => ({
                id: c.id || crypto.randomUUID(),
                type: c.type || 'stk',
                name: c.name || '',
                website: c.website || '',
                logoUrl: c.logoUrl || '',
            })),
        );
        setSponsors(
            (e.sponsors || []).map((s) => ({
                id: s.id || crypto.randomUUID(),
                name: s.name || '',
                website: s.website || '',
                logoUrl: s.logoUrl || '',
            })),
        );
        setEventColor(e.color || '');
        setPoints(
            (e.points || []).map((p) => ({
                id: p.id || crypto.randomUUID(),
                name: p.name || '',
                address: p.address || '',
                city: p.city || '',
                district: p.district || '',
                mapsUrl: p.mapsUrl || '',
            })),
        );
        setParticipantLogoUploading({});
        setEvPosterFile(null);
        setEvPosterPreview(e.imageUrl || null);
        setExistingPosterUrl(e.imageUrl || '');
        // Etkinliğe özel logo — mevcutsa önizlemeye yükle (yeni dosya seçilmezse korunur).
        setEvLogoFile(null);
        setEvLogoPreview(e.eventLogoUrl || null);
        setExistingLogoUrl(e.eventLogoUrl || '');
        setEditingId(ev.id);
        setEditingSlug((ev as { slug?: string }).slug || null);
        setCreateOpen(true);
    };

    // ── Kopyala (etkinliği çoğalt) ──
    // Önce onay dialogu (duplicateTarget) çıkar; onaylanınca mevcut etkinlik
    // dokümanını COLLECTIONS.events'e klonlar (id + tamamlanma + zaman damgaları
    // düşürülür, kapasite.current sıfırlanır, isme "(Kopya)" eklenir, status
    // 'Beklemede'). Ardından "Düzenle"ye basılmış gibi yeni dokümanın edit
    // dialog'unu açar → kullanıcı düzenleyip yeniden yayına alabilir.
    const [duplicateTarget, setDuplicateTarget] = useState<ClubEventDoc | null>(null);
    const [duplicating, setDuplicating] = useState(false);

    const handleDuplicate = async (ev: ClubEventDoc) => {
        if (!firestore || !activeEntity) return;
        setDuplicating(true);
        try {
            // Tüm alanları taşımak için mevcut dokümanı yeniden oku (kart yalnız
            // özet alanları tutuyor; contributors/agenda/points vb. da kopyalansın).
            const snap = await getDoc(doc(firestore, COLLECTIONS.events, ev.id));
            const src = (snap.exists() ? snap.data() : {}) as Record<string, unknown>;
            // Kopyalanmaması gereken alanları düş.
            const {
                completed: _completed,
                completedAt: _completedAt,
                createdAt: _createdAt,
                approvedAt: _approvedAt,
                approvedBy: _approvedBy,
                updatedAt: _updatedAt,
                ...rest
            } = src;
            void _completed; void _completedAt; void _createdAt; void _approvedAt; void _approvedBy; void _updatedAt;
            const srcName = (src.name as string) || ev.name || '';
            const srcCapacity = (src.capacity as { max?: number; current?: number } | undefined) || {};
            // KRİTİK: slug'ı kopyalama — benzersiz üret. Aksi halde kopya, orijinalle
            // AYNI slug'a sahip olur; detay sayfası where('slug'==...).limit(1) ile
            // çözdüğü için yanlış (genelde eski) etkinliği gösterir. (2026-07 bug'ı:
            // "Bergama 2" kopyası eski Bergama linkiyle açılıyordu.)
            const copyBaseSlug = `${srcName} (Kopya)`
                .toLowerCase()
                .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
                .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
                .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            // eslint-disable-next-line react-hooks/purity -- event handler'da çalışır (render değil)
            const copySlug = `${copyBaseSlug || 'etkinlik'}-${Date.now().toString(36)}`;
            const ref = await addDoc(collection(firestore, COLLECTIONS.events), {
                ...rest,
                name: `${srcName} (Kopya)`,
                slug: copySlug,
                capacity: { max: srcCapacity.max ?? 0, current: 0 },
                status: 'Beklemede' as EventStatus,
                organizerId: activeEntity.data.id,
                // eslint-disable-next-line react-hooks/purity -- event handler'da çalışır (render değil); create akışıyla aynı desen
                createdAt: Date.now(),
                createdBy: authUser?.uid || null,
            });
            toast({ title: 'Etkinlik kopyalandı', description: 'Düzenleyip yayına alabilirsiniz.' });
            setDuplicateTarget(null);
            // "Düzenle"ye basılmış gibi: yeni dokümanı bellekten kurup edit dialog'unu aç.
            openEdit({ ...(rest as Partial<ClubEventDoc>), id: ref.id, name: `${srcName} (Kopya)`, slug: copySlug } as ClubEventDoc);
        } catch (err) {
            console.error('Event duplicate failed', err);
            toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Etkinlik kopyalanırken bir hata oluştu. Lütfen tekrar deneyin.' });
        } finally {
            setDuplicating(false);
        }
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

            // Düzenlemede mevcut slug KORUNUR → paylaşılan link kırılmaz. Yalnız yeni
            // etkinlikte (veya slug yoksa) benzersiz slug üretilir.
            const finalSlug = (editingId && editingSlug) ? editingSlug : `${slug}-${Date.now().toString(36)}`;
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

            // Etkinliğe özel logo upload (varsa) — Storage'a yükle. Düzenlemede yeni
            // dosya yoksa mevcut logo korunur.
            let logoUrl = editingId ? existingLogoUrl : '';
            if (evLogoFile) {
                setEvLogoUploading(true);
                try {
                    const storage = getStorage();
                    const ext = (evLogoFile.name.split('.').pop() || 'png').toLowerCase();
                    const r = storageRef(storage, `event-logos/${activeEntity.data.id}/${posterKey}.${ext}`);
                    await uploadBytes(r, evLogoFile, { contentType: evLogoFile.type });
                    logoUrl = await getDownloadURL(r);
                } catch (uploadErr) {
                    console.error('Event logo upload failed', uploadErr);
                    toast({ variant: 'destructive', title: 'Logo yüklenemedi', description: 'Etkinlik logosuz kaydedildi; sonra düzenleyebilirsin.' });
                } finally {
                    setEvLogoUploading(false);
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

            // Kurumsal / özel katılımcılar — ismi olan satırları al, boş opsiyonelleri yazma.
            const cleanCorporateParticipants: CorporateParticipant[] = corporateParticipants
                .map((c) => ({
                    id: c.id || crypto.randomUUID(),
                    type: c.type,
                    name: (c.name || '').trim(),
                    website: (c.website || '').trim(),
                    logoUrl: (c.logoUrl || '').trim(),
                }))
                .filter((c) => c.name.length > 0)
                .map((c) => {
                    const out: CorporateParticipant = { id: c.id, type: c.type, name: c.name };
                    if (c.website) out.website = c.website;
                    if (c.logoUrl) out.logoUrl = c.logoUrl;
                    return out;
                });

            // Sponsorlar — ismi olan satırları al, boş opsiyonelleri yazma.
            const cleanSponsors: EventSponsor[] = sponsors
                .map((s) => ({
                    id: s.id || crypto.randomUUID(),
                    name: (s.name || '').trim(),
                    website: (s.website || '').trim(),
                    logoUrl: (s.logoUrl || '').trim(),
                }))
                .filter((s) => s.name.length > 0)
                .map((s) => {
                    const out: EventSponsor = { id: s.id, name: s.name };
                    if (s.website) out.website = s.website;
                    if (s.logoUrl) out.logoUrl = s.logoUrl;
                    return out;
                });
            const cleanColor = /^#[0-9a-fA-F]{6}$/.test(eventColor) ? eventColor : '';

            // Katılım noktaları — adı VEYA adresi olan satırları al.
            const cleanPoints: EventPoint[] = points
                .map((p) => ({
                    id: p.id || crypto.randomUUID(),
                    name: (p.name || '').trim(),
                    address: (p.address || '').trim(),
                    city: (p.city || '').trim(),
                    district: (p.district || '').trim(),
                    mapsUrl: (p.mapsUrl || '').trim(),
                }))
                .filter((p) => p.name.length > 0 || p.address.length > 0)
                .map((p) => {
                    const out: EventPoint = { id: p.id, name: p.name, address: p.address, city: p.city };
                    if (p.district) out.district = p.district;
                    if (p.mapsUrl) out.mapsUrl = p.mapsUrl;
                    return out;
                });

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
                        certificateDelivery: evCertificate ? evCertificateDelivery : null,
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
                        eventLogoUrl: logoUrl,
                        contributors: cleanContributors,
                        agenda: cleanAgenda,
                        corporateParticipants: cleanCorporateParticipants,
                        sponsors: cleanSponsors,
                        color: cleanColor,
                        points: cleanPoints,
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
                certificateDelivery: evCertificate ? evCertificateDelivery : null,
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
                eventLogoUrl: logoUrl,
                contributors: cleanContributors,
                agenda: cleanAgenda,
                corporateParticipants: cleanCorporateParticipants,
                sponsors: cleanSponsors,
                color: cleanColor,
                points: cleanPoints,
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
                <TabsList className="grid w-full grid-cols-3 max-w-xl">
                    <TabsTrigger value="my-events" className="gap-1.5 px-2"><Calendar className="h-4 w-4 shrink-0" /> <span className="truncate">{t('ngo_admin_events.tabMyEvents')}</span></TabsTrigger>
                    <TabsTrigger value="completed" className="gap-1.5 px-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> <span className="truncate">Tamamlananlar{completedEvents.length > 0 ? ` (${completedEvents.length})` : ''}</span></TabsTrigger>
                    <TabsTrigger value="venues" className="gap-1.5 px-2"><Landmark className="h-4 w-4 shrink-0" /> <span className="truncate">{t('ngo_admin_events.tabVenues')}</span></TabsTrigger>
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
                    {/* Gelir Modeli Konferansları — yalnız seri organizatörü USFD görür. */}
                    {firestore && activeEntity?.data.id === SERIES_ORGANIZER_ID && (
                        <SeriesConferenceManager
                            fs={firestore}
                            organizer={{
                                id: activeEntity.data.id,
                                name: activeEntity.data.name || 'ULUSLARARASI SOSYAL FAYDA DERNEĞİ',
                                logoUrl: (activeEntity.data as { avatarUrl?: string; logoUrl?: string }).avatarUrl
                                    || (activeEntity.data as { logoUrl?: string }).logoUrl || null,
                            }}
                            events={myEvents || []}
                        />
                    )}
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

                            {!initialLoading && isClub && activeEvents.length === 0 && (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    {t('ngo_admin_events.noEventsYet')}
                                </p>
                            )}

                            {!initialLoading && activeEvents.length > 0 && (
                                <div className="space-y-3">
                                    {activeEvents.map(renderEventCard)}
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

                <TabsContent value="completed" className="mt-6 space-y-6">
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle>Tamamlanan Etkinlikler</CardTitle>
                            <CardDescription className="text-xs mt-1">
                                Tamamlanmış etkinlikler burada arşivlenir. Public etkinlik sayfasından tamamlanma anından 24 saat sonra otomatik kaldırılır.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {initialLoading && (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('ngo_admin_events.loading')}
                                </div>
                            )}
                            {!initialLoading && completedEvents.length === 0 && (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    Henüz tamamlanan etkinlik yok.
                                </p>
                            )}
                            {!initialLoading && completedEvents.length > 0 && (
                                <div className="space-y-3">
                                    {completedEvents.map(renderEventCard)}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* Kopyala onay dialogu — çoğaltmadan önce kullanıcıya sorar. */}
            <AlertDialog open={!!duplicateTarget} onOpenChange={(o) => { if (!o && !duplicating) setDuplicateTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Etkinliği Kopyala</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu etkinlikten bir kopya daha oluşturulsun mu? Kopya oluşturulunca düzenleme paneli açılır.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={duplicating}>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); if (duplicateTarget) void handleDuplicate(duplicateTarget); }}
                            disabled={duplicating}
                        >
                            {duplicating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Copy className="h-4 w-4 mr-1.5" />} Evet, Çoğalt
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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

                        {/* Etkinlik Logosu (opsiyonel) — kurum logosundan AYRI; canlı ekranda ve
                            paylaşım önizlemesinde (link kartı) görünür. Kare/yuvarlak logo önerilir. */}
                        <div className="space-y-2">
                            <Label>Etkinlik Logosu (opsiyonel)</Label>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={(e) => handleLogoFile(e.target.files?.[0] || null)}
                            />
                            <div className="flex items-center gap-3">
                                {evLogoPreview ? (
                                    <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border bg-muted">
                                        <NextImage src={evLogoPreview} alt="Etkinlik logosu önizleme" fill className="object-contain" unoptimized />
                                    </div>
                                ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={evLogoUploading || submitting}>
                                            <Upload className="h-3.5 w-3.5 mr-1.5" /> {evLogoPreview ? 'Değiştir' : 'Logo yükle'}
                                        </Button>
                                        {evLogoPreview && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleLogoFile(null)} disabled={evLogoUploading || submitting}>
                                                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Kaldır
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Canlı ekranda ve paylaşım önizlemesinde görünür. PNG / JPG / WEBP · max 5 MB</p>
                                </div>
                            </div>
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

                        {/* Sertifika türü — yalnız sertifika verilirken görünür, varsayılan Online */}
                        {evCertificate && (
                            <div className="space-y-2 p-3 border rounded-xl bg-card">
                                <Label className="text-sm">Sertifika türü</Label>
                                <RadioGroup
                                    value={evCertificateDelivery}
                                    onValueChange={(v) => setEvCertificateDelivery(v === 'physical' ? 'physical' : 'online')}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    <label className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border p-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]">
                                        <RadioGroupItem value="online" id="ev-cert-online" />
                                        <span>Online <span className="text-xs text-muted-foreground">(varsayılan)</span></span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border p-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]">
                                        <RadioGroupItem value="physical" id="ev-cert-physical" />
                                        <span>Fiziksel</span>
                                    </label>
                                </RadioGroup>
                            </div>
                        )}

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

                        {/* Kurumsal / Özel Katılımcılar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" /> Kurumsal / Özel Katılımcılar
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={addCorporateParticipant}>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Ekle
                                </Button>
                            </div>
                            {corporateParticipants.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-1">
                                    Belediye, valilik, marka, üniversite veya STK eklemek için “Ekle”ye dokun.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {corporateParticipants.map((c, idx) => {
                                        const uploading = Boolean(participantLogoUploading[c.id]);
                                        return (
                                            <div key={c.id} className="p-3 border rounded-xl bg-card space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">Tür</Label>
                                                        <Select
                                                            value={c.type}
                                                            onValueChange={(v) => updateCorporateParticipant(idx, { type: v as CorporateParticipantType })}
                                                        >
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {CORPORATE_PARTICIPANT_TYPE_OPTIONS.map((o) => (
                                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">Ad</Label>
                                                        <Input
                                                            value={c.name}
                                                            onChange={(e) => updateCorporateParticipant(idx, { name: e.target.value })}
                                                            placeholder="Örn. İstanbul Büyükşehir Belediyesi"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Web sitesi</Label>
                                                    <Input
                                                        type="url"
                                                        value={c.website || ''}
                                                        onChange={(e) => updateCorporateParticipant(idx, { website: e.target.value })}
                                                        placeholder="https://…"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Logo</Label>
                                                    <div className="flex items-center gap-3">
                                                        {c.logoUrl ? (
                                                            <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border bg-muted">
                                                                <NextImage src={c.logoUrl} alt={`${c.name} logosu`} fill className="object-contain" unoptimized />
                                                            </div>
                                                        ) : null}
                                                        <input
                                                            id={`participant-logo-${c.id}`}
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                            className="hidden"
                                                            onChange={(e) => handleParticipantLogoFile(idx, e.target.files?.[0] || null)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={uploading}
                                                            onClick={() => document.getElementById(`participant-logo-${c.id}`)?.click()}
                                                        >
                                                            {uploading
                                                                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Yükleniyor…</>
                                                                : <><Upload className="h-3.5 w-3.5 mr-1.5" /> {c.logoUrl ? 'Değiştir' : 'Logo yükle'}</>}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeCorporateParticipant(idx)}>
                                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Sil
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sponsorlar / Destekleyenler */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" /> Sponsorlar / Destekleyenler
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={addSponsor}>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Ekle
                                </Button>
                            </div>
                            {sponsors.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-1">
                                    Etkinliği destekleyen sponsorların logosunu eklemek için “Ekle”ye dokun. Logolar etkinlik sayfasında, yaka kartında ve sertifikada görünür.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {sponsors.map((s, idx) => {
                                        const uploading = Boolean(sponsorLogoUploading[s.id]);
                                        return (
                                            <div key={s.id} className="p-3 border rounded-xl bg-card space-y-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Sponsor adı</Label>
                                                    <Input
                                                        value={s.name}
                                                        onChange={(e) => updateSponsor(idx, { name: e.target.value })}
                                                        placeholder="Örn. Social Business Global"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Web sitesi</Label>
                                                    <Input
                                                        type="url"
                                                        value={s.website || ''}
                                                        onChange={(e) => updateSponsor(idx, { website: e.target.value })}
                                                        placeholder="https://…"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Logo</Label>
                                                    <div className="flex items-center gap-3">
                                                        {s.logoUrl ? (
                                                            <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border bg-muted">
                                                                <NextImage src={s.logoUrl} alt={`${s.name} logosu`} fill className="object-contain" unoptimized />
                                                            </div>
                                                        ) : null}
                                                        <input
                                                            id={`sponsor-logo-${s.id}`}
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                            className="hidden"
                                                            onChange={(e) => handleSponsorLogoFile(idx, e.target.files?.[0] || null)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={uploading}
                                                            onClick={() => document.getElementById(`sponsor-logo-${s.id}`)?.click()}
                                                        >
                                                            {uploading
                                                                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Yükleniyor…</>
                                                                : <><Upload className="h-3.5 w-3.5 mr-1.5" /> {s.logoUrl ? 'Değiştir' : 'Logo yükle'}</>}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSponsor(idx)}>
                                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Sil
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Etkinlik Rengi — yaka kartı + detay vurgu rengi */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <span className="inline-block h-4 w-4 rounded-full border" style={{ background: eventColor || '#ff5722' }} /> Etkinlik Rengi
                            </Label>
                            <p className="text-xs text-muted-foreground px-1">
                                Seçtiğin renk yaka kartına ve etkinlik vurgularına yansır. Boş bırakırsan hangel turuncusu kullanılır.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {EVENT_COLOR_PALETTE.map((col) => {
                                    const active = (eventColor || '#ff5722').toLowerCase() === col.value.toLowerCase();
                                    return (
                                        <button
                                            key={col.value}
                                            type="button"
                                            title={col.label}
                                            aria-label={col.label}
                                            onClick={() => setEventColor(col.value)}
                                            className={`h-9 w-9 rounded-full border-2 transition ${active ? 'border-foreground ring-2 ring-offset-2 ring-foreground/30' : 'border-transparent'}`}
                                            style={{ background: col.value }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Katılım Noktaları (çok-noktalı etkinlik) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" /> Katılım Noktaları (çok-noktalı etkinlik)
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={addPoint}>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Ekle
                                </Button>
                            </div>
                            {points.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-1">
                                    Etkinlik birden çok noktada (ör. 81 il) yapılıyorsa her nokta için “Ekle”ye dokun. Tek-noktalı etkinlikte boş bırakın.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {points.map((p, idx) => (
                                        <div key={p.id} className="p-3 border rounded-xl bg-card space-y-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Nokta adı</Label>
                                                <Input
                                                    value={p.name}
                                                    onChange={(e) => updatePoint(idx, { name: e.target.value })}
                                                    placeholder="Örn. İstanbul - Kadıköy Sahili"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Adres</Label>
                                                <Input
                                                    value={p.address}
                                                    onChange={(e) => updatePoint(idx, { address: e.target.value })}
                                                    placeholder="Açık adres"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Şehir</Label>
                                                    <Input
                                                        value={p.city}
                                                        onChange={(e) => updatePoint(idx, { city: e.target.value })}
                                                        placeholder="İstanbul"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">İlçe</Label>
                                                    <Input
                                                        value={p.district || ''}
                                                        onChange={(e) => updatePoint(idx, { district: e.target.value })}
                                                        placeholder="Kadıköy"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Google Maps linki</Label>
                                                <Input
                                                    type="url"
                                                    value={p.mapsUrl || ''}
                                                    onChange={(e) => updatePoint(idx, { mapsUrl: e.target.value })}
                                                    placeholder="https://maps.google.com/…"
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removePoint(idx)}>
                                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Sil
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting || evPosterUploading || evLogoUploading}>{t('ngo_admin_events.cancelBtn')}</Button>
                            <Button type="submit" disabled={submitting || evPosterUploading || evLogoUploading}>
                                {(submitting || evPosterUploading || evLogoUploading)
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {evPosterUploading ? 'Afiş yükleniyor...' : evLogoUploading ? 'Logo yükleniyor...' : (editingId ? 'Güncelleniyor...' : t('ngo_admin_events.submitting'))}</>
                                    : (editingId ? 'Güncelle' : t('ngo_admin_events.submitBtn'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
