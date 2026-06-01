'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
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

const organizations = [
    {
        id: 'org1',
        name: 'Kadıköy Belediyesi',
        type: 'Belediye',
        logo: 'https://www.google.com/s2/favicons?domain=kadikoy.bel.tr&sz=128',
        venues: [
            { id: 'v1', name: 'Barış Manço Kültür Merkezi', type: 'Konferans Salonu', fee: 'Ücretsiz', icon: Landmark, capacity: 250 },
            { id: 'v4', name: 'Kozyatağı Kültür Merkezi', type: 'Tiyatro Salonu', fee: 'Ücretsiz', icon: Landmark, capacity: 400 },
            { id: 'v5', name: 'Caddebostan Kültür Merkezi', type: 'Çok Amaçlı Salon', fee: 'İndirimli', icon: Landmark, capacity: 600 },
        ]
    },
    {
        id: 'org2',
        name: 'hangel A.Ş.',
        type: 'İş Ortağı',
        logo: '',
        venues: [
            { id: 'v2', name: 'Levent Ortak Çalışma Alanı', type: 'Toplantı Odası', fee: 'Ücretsiz', icon: Building2, capacity: 20 },
            { id: 'v6', name: 'Moda İmece Ofisi', type: 'Workshop Alanı', fee: 'Ücretsiz', icon: Building2, capacity: 15 },
        ]
    },
    {
        id: 'org3',
        name: 'X Teknoloji Şirketi',
        type: 'Kurumsal Destekçi',
        logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=128',
        venues: [
            { id: 'v3', name: 'Maslak Oditoryum', type: 'Seminer Salonu', fee: 'İndirimli', icon: Store, capacity: 150 },
        ]
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
    const [evName, setEvName] = useState('');
    const [evDate, setEvDate] = useState('');
    const [evCity, setEvCity] = useState('');
    const [evAddress, setEvAddress] = useState('');
    const [evDescription, setEvDescription] = useState('');

    const resetForm = () => {
        setEvName('');
        setEvDate('');
        setEvCity('');
        setEvAddress('');
        setEvDescription('');
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

            // Force status='Beklemede' regardless of any other inputs
            await addDoc(collection(firestore, COLLECTIONS.events), {
                name: evName.trim(),
                slug: `${slug}-${Date.now().toString(36)}`,
                organizer: activeEntity.data.name || t('ngo_admin_events.defaultOrganizer'),
                organizerId: activeEntity.data.id,
                organizerKind: 'club',
                date: evDate,
                startDate: evDate,
                location: {
                    type: 'Fiziksel' as const,
                    address: evAddress.trim(),
                    city: evCity.trim(),
                    district: '',
                },
                description: evDescription.trim(),
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
                                        <Card key={venue.id} className="hover:border-primary transition-all hover:shadow-md cursor-pointer group">
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
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {t('ngo_admin_events.cityIstanbul')}</span>
                                                </div>
                                                <Button size="sm" className="w-full text-xs h-8" onClick={() => toast({title: t('ngo_admin_events.reservationRequestToast'), description: `${org.name}${t('ngo_admin_events.reservationRequestDescSuffix')}`})}>{t('ngo_admin_events.reserveBtn')}</Button>
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
                        <div className="space-y-2">
                            <Label htmlFor="ev-name">{t('ngo_admin_events.labelName')}</Label>
                            <Input id="ev-name" value={evName} onChange={(e) => setEvName(e.target.value)} placeholder={t('ngo_admin_events.placeholderName')} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="ev-date">{t('ngo_admin_events.labelDate')}</Label>
                                <Input id="ev-date" type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ev-city">{t('ngo_admin_events.labelCity')}</Label>
                                <Input id="ev-city" value={evCity} onChange={(e) => setEvCity(e.target.value)} placeholder={t('ngo_admin_events.placeholderCity')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ev-address">{t('ngo_admin_events.labelAddress')}</Label>
                            <Input id="ev-address" value={evAddress} onChange={(e) => setEvAddress(e.target.value)} placeholder={t('ngo_admin_events.placeholderAddress')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ev-desc">{t('ngo_admin_events.labelDescription')}</Label>
                            <Textarea id="ev-desc" rows={3} value={evDescription} onChange={(e) => setEvDescription(e.target.value)} placeholder={t('ngo_admin_events.placeholderDescription')} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>{t('ngo_admin_events.cancelBtn')}</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngo_admin_events.submitting')}</>) : t('ngo_admin_events.submitBtn')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
