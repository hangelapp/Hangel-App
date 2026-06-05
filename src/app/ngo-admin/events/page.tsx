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
    Users,
    MapPin,
    Landmark,
    Store,
    Building2,
    Info,
    CheckCircle2,
    ChevronRight,
    Building,
    ShieldAlert,
    Loader2,
    Hourglass,
    XCircle,
    Upload,
    Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { LocationFields } from '@/components/shared/location-fields';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

type EntityKind = 'ngo' | 'brand' | 'club';

interface EntityDoc {
    id: string;
    name?: string;
    adminUserId?: string;
}

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

interface VenueHall {
    id: string;
    name: string;
    type: string;
    fee: string;
    icon: React.ComponentType<{ className?: string }>;
    capacity: number;
    description?: string;
}

interface VenueOrg {
    id: string;
    name: string;
    type: string;
    logo: string;
    city: string;
    address?: string;
    hours?: string;
    reservationEmail?: string;
    venues: VenueHall[];
}

const organizations: VenueOrg[] = [
    {
        id: 'karsiyaka-stk',
        name: 'Karşıyaka Belediyesi Sancar Maruflu Sivil Toplum Yerleşkesi',
        type: 'Belediye · STK Yerleşkesi',
        logo: 'https://www.google.com/s2/favicons?domain=karsiyaka.bel.tr&sz=128',
        city: 'İzmir',
        address: 'Bahriye Üçok Mah. Doç. Dr. Bahriye Üçok Bul. No:5, 35580 Karşıyaka / İzmir (Bahçelievler Katlı Pazar Yeri, 1. kat)',
        hours: 'Haftanın 7 günü 10:00 – 22:00',
        reservationEmail: 'karsiyaka.stk@karsiyaka.bel.tr',
        venues: [
            { id: 'ksk-salon-1', name: 'Salon 1', type: 'Konferans Salonu', fee: 'Ücretsiz', icon: Landmark, capacity: 150, description: 'STK etkinlikleri, konferans ve panel için en büyük salon.' },
            { id: 'ksk-salon-2', name: 'Salon 2', type: 'Seminer Salonu', fee: 'Ücretsiz', icon: Landmark, capacity: 100, description: 'Orta ölçekli seminer ve eğitimler için.' },
            { id: 'ksk-salon-3', name: 'Salon 3', type: 'Toplantı Salonu', fee: 'Ücretsiz', icon: Landmark, capacity: 60, description: 'Toplantı ve atölye çalışmaları için.' },
            { id: 'ksk-fuaye', name: 'Sergi ve Fuaye Alanı', type: 'Sergi / Fuaye', fee: 'Ücretsiz', icon: Store, capacity: 60, description: 'Sergi, stant ve karşılama etkinlikleri için fuaye alanı.' },
        ],
    },
    {
        id: 'org2',
        name: 'hangel A.Ş.',
        type: 'İş Ortağı',
        logo: '',
        city: 'İstanbul',
        venues: [
            { id: 'v2', name: 'Levent Ortak Çalışma Alanı', type: 'Toplantı Odası', fee: 'Ücretsiz', icon: Building2, capacity: 20 },
            { id: 'v6', name: 'Moda İmece Ofisi', type: 'Workshop Alanı', fee: 'Ücretsiz', icon: Building2, capacity: 15 },
        ],
    },
];

function StatusBadge({ status }: { status?: EventStatus }) {
    const { t } = useTranslation();
    const s = status || 'Beklemede';
    if (s === 'Beklemede') {
        return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                <Hourglass className="mr-1 h-3 w-3" /> {t('ngo_admin_events.statusPending')}
            </Badge>
        );
    }
    if (s === 'Reddedildi') {
        return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider">
                <XCircle className="mr-1 h-3 w-3" /> {t('ngo_admin_events.statusRejected')}
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold uppercase tracking-wider">
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
    const isClub = activeEntity?.kind === 'club';

    // ---- Existing events for this club ----
    const myEventsQ = useMemoFirebase(
        () =>
            firestore && isClub && activeEntity?.data.id
                ? query(collection(firestore, COLLECTIONS.events), where('organizerId', '==', activeEntity.data.id))
                : null,
        [firestore, isClub, activeEntity?.data.id],
    );
    const { data: myEvents } = useCollection<ClubEventDoc>(myEventsQ);

    // ---- New event dialog state ----
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [venueDetail, setVenueDetail] = useState<{ org: VenueOrg; venue: VenueHall } | null>(null);
    const [evName, setEvName] = useState('');
    const [evDate, setEvDate] = useState('');
    const [evCity, setEvCity] = useState('');
    const [evDistrict, setEvDistrict] = useState('');
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
    const posterInputRef = useRef<HTMLInputElement>(null);

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
        if (evPosterPreview) URL.revokeObjectURL(evPosterPreview);
        setEvPosterFile(null);
        setEvPosterPreview(null);
        if (posterInputRef.current) posterInputRef.current.value = '';
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !activeEntity || activeEntity.kind !== 'club') return;
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

            // Afiş upload (varsa) — Firebase Storage'a yükle
            let posterUrl = '';
            if (evPosterFile) {
                setEvPosterUploading(true);
                try {
                    const storage = getStorage();
                    const ext = (evPosterFile.name.split('.').pop() || 'jpg').toLowerCase();
                    const r = storageRef(storage, `event-posters/${activeEntity.data.id}/${finalSlug}.${ext}`);
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

            // Force status='Beklemede' regardless of any other inputs
            await addDoc(collection(firestore, COLLECTIONS.events), {
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
                    lat: evLat || '',
                    lon: evLon || '',
                },
                description: evDescription.trim(),
                imageUrl: posterUrl,
                status: 'Beklemede' as EventStatus,
                createdAt: Date.now(),
                createdBy: authUser?.uid || null,
            });

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

    // Salon rezervasyon talebi — reservationEmail varsa mailto ile mail taslağı açar.
    const reserveVenue = (org: VenueOrg, venue: VenueHall) => {
        if (!org.reservationEmail) {
            toast({ title: t('ngo_admin_events.reservationRequestToast'), description: `${org.name}${t('ngo_admin_events.reservationRequestDescSuffix')}` });
            return;
        }
        const subject = `Salon Rezervasyon Talebi — ${venue.name} (${org.name})`;
        const body = [
            'Merhaba,',
            '',
            `"${venue.name}" (${venue.type}, ${venue.capacity} kişilik) salonu için rezervasyon talep ediyoruz.`,
            '',
            `Kuruluş: ${activeEntity?.data?.name || ''}`,
            'Etkinlik adı: ',
            'Etkinlik tarihi / saati: ',
            'Tahmini katılımcı sayısı: ',
            'İletişim (telefon / e-posta): ',
            '',
            'Teşekkürler.',
        ].join('\n');
        if (typeof window !== 'undefined') {
            // Not: window.location.href ATAMASI react-hooks/immutability ile build'i
            // kırıyor; method çağrısı .assign() güvenli ve mailto için eşdeğer.
            window.location.assign(`mailto:${org.reservationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
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
                <Card className="border-2 border-amber-200 bg-amber-50/60 rounded-2xl">
                    <CardHeader className="flex flex-row items-start gap-3 p-4">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
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

            <Tabs defaultValue="venues">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="venues"><Landmark className="mr-2 h-4 w-4" /> {t('ngo_admin_events.tabVenues')}</TabsTrigger>
                    <TabsTrigger value="my-events"><Calendar className="mr-2 h-4 w-4" /> {t('ngo_admin_events.tabMyEvents')}</TabsTrigger>
                    <TabsTrigger value="booking"><CheckCircle2 className="mr-2 h-4 w-4" /> {t('ngo_admin_events.tabBooking')}</TabsTrigger>
                </TabsList>

                <TabsContent value="venues" className="mt-6 space-y-8">
                    {organizations.map((org) => (
                        <Card key={org.id} className="overflow-hidden border-2 shadow-sm">
                            <CardHeader className="bg-muted/30 border-b p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={org.logo} />
                                            <AvatarFallback><Building className="h-6 w-6" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{org.name}</CardTitle>
                                            <CardDescription className="text-xs font-bold text-primary uppercase tracking-widest">{org.type}</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-primary font-bold">{t('ngo_admin_events.viewAll')} <ChevronRight className="ml-1 h-4 w-4"/></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 bg-background">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {org.venues.map((venue) => (
                                        <Card key={venue.id} onClick={() => setVenueDetail({ org, venue })} className="hover:border-primary transition-all hover:shadow-md cursor-pointer group">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                        <venue.icon className="h-5 w-5" />
                                                    </div>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] font-bold",
                                                        venue.fee === 'Ücretsiz' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}>
                                                        {venue.fee}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{venue.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">{venue.type}</p>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t">
                                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {venue.capacity} {t('ngo_admin_events.peopleSuffix')}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {org.city}</span>
                                                </div>
                                                <Button size="sm" className="w-full text-xs h-8" onClick={(e) => { e.stopPropagation(); reserveVenue(org, venue); }}>{t('ngo_admin_events.reserveBtn')}</Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

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
                                onClick={() => isClub && setCreateOpen(true)}
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
                                            className="p-4 border rounded-2xl flex items-center justify-between group hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold">{event.name || t('ngo_admin_events.unnamedEvent')}</h4>
                                                    <StatusBadge status={event.status} />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {event.date || event.startDate || '—'}
                                                    {event.location?.city ? ` • ${event.location.city}` : ''}
                                                </p>
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
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-bold">{t('ngo_admin_events.dialogTitle')}</DialogTitle>
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
                                    <span className="text-[10px] text-muted-foreground/70">PNG / JPG / WEBP · max 5 MB</span>
                                    <span className="text-[10px] text-muted-foreground/60 px-3 text-center">A4 portre tasarladığın dosyayı direkt yükle</span>
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
                            value={{ country: 'Türkiye', city: evCity, district: evDistrict, openAddress: evAddress, lat: evLat, lon: evLon }}
                            onChange={(next) => {
                                setEvCity(next.city ?? '');
                                setEvDistrict(next.district ?? '');
                                setEvAddress(next.openAddress ?? '');
                                setEvLat(next.lat ?? '');
                                setEvLon(next.lon ?? '');
                            }}
                            showCountry={false}
                            showNeighborhood={false}
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-xl bg-card max-h-44 overflow-y-auto">
                                {EVENT_TYPE_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={evTypes.includes(opt)}
                                            onCheckedChange={(c) => setEvTypes((prev) => (c === true ? [...prev, opt] : prev.filter((x) => x !== opt)))}
                                        />
                                        <span>{opt}</span>
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

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting || evPosterUploading}>{t('ngo_admin_events.cancelBtn')}</Button>
                            <Button type="submit" disabled={submitting || evPosterUploading}>
                                {(submitting || evPosterUploading)
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {evPosterUploading ? 'Afiş yükleniyor...' : t('ngo_admin_events.submitting')}</>
                                    : t('ngo_admin_events.submitBtn')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Salon detay modalı — pencereye (karta) tıklayınca açılır */}
            <Dialog open={!!venueDetail} onOpenChange={(o) => { if (!o) setVenueDetail(null); }}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    {venueDetail && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                        <venueDetail.venue.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="font-bold">{venueDetail.venue.name}</DialogTitle>
                                        <DialogDescription className="text-xs">{venueDetail.venue.type} · {venueDetail.org.name}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-3 text-sm">
                                {venueDetail.venue.description && (
                                    <p className="text-muted-foreground">{venueDetail.venue.description}</p>
                                )}
                                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {venueDetail.venue.capacity} kişi kapasiteli</div>
                                <div>
                                    <Badge variant="outline" className={cn('text-[10px] font-bold', venueDetail.venue.fee === 'Ücretsiz' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200')}>{venueDetail.venue.fee}</Badge>
                                </div>
                                {venueDetail.org.address && (
                                    <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span className="text-muted-foreground">{venueDetail.org.address}</span></div>
                                )}
                                {venueDetail.org.hours && (
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> <span className="text-muted-foreground">{venueDetail.org.hours}</span></div>
                                )}
                                {venueDetail.org.address && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => { const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueDetail.org.address as string)}`; if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer'); }}>
                                        <MapPin className="h-4 w-4 mr-1.5" /> Google Maps'te aç
                                    </Button>
                                )}
                            </div>
                            <DialogFooter>
                                <Button className="w-full" onClick={() => reserveVenue(venueDetail.org, venueDetail.venue)}>{t('ngo_admin_events.reserveBtn')}</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
