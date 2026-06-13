'use client';

/**
 * hangel — Gönüllülük (volunteering) ilanı OLUŞTURMA editörü.
 *
 * `events/page.tsx` pattern'ine birebir sadık: active-entity-context ile aktif
 * kurumu çözer, "Yeni İlan" dialog'u açar, LocationFields (PlaceAutocomplete +
 * Nominatim lat/lon), çoklu giriş (skills/interests/languages/requirements),
 * afiş yükleme (Firebase Storage) ve Firestore'a tek bir addDoc ile yazar.
 *
 * Yazım hedefi: COLLECTIONS.volunteering (Volunteering type — @/lib/types).
 * status='Beklemede' (events gibi süper-admin onayı bekler). undefined alan
 * yazılmaz — boş array/string/0 kullanılır.
 *
 * Yetki: events editörü sadece kulüpler içindi; gönüllülük ilanını STK (ngo)
 * VE kulüp (club) açabilir.
 */

import React, { useMemo, useState, useRef } from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    ArrowLeft,
    HeartHandshake,
    Plus,
    ShieldAlert,
    CheckCircle2,
    Loader2,
    Hourglass,
    XCircle,
    Upload,
    Trash2,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LocationFields } from '@/components/shared/location-fields';
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
    logoUrl?: string;
    avatarUrl?: string;
}

type ListingStatus = 'Beklemede' | 'Aktif' | 'Pasif' | 'Tamamlandı';

interface VolunteeringListDoc {
    id: string;
    title?: string;
    ngoId?: string;
    location?: { city?: string; district?: string; type?: string };
    status?: ListingStatus;
    createdAt?: number;
}

const LOCATION_TYPE_OPTIONS: Array<'Saha' | 'Online' | 'Hibrit'> = ['Saha', 'Online', 'Hibrit'];
const TASK_TYPE_OPTIONS: Array<'Tek Gün' | 'Dönemsel' | 'Sürekli'> = ['Tek Gün', 'Dönemsel', 'Sürekli'];
const SOCIAL_AREA_OPTIONS = [
    'Eğitim',
    'Sağlık',
    'Çevre',
    'Hayvan Hakları',
    'Sosyal Yardım',
    'Afet ve Acil Durum',
    'Kültür ve Sanat',
    'Spor',
    'İnsan Hakları',
    'Teknoloji',
    'Kadın ve Aile',
    'Engelli Hakları',
    'Diğer',
];

function StatusBadge({ status }: { status?: ListingStatus }) {
    const s = status || 'Beklemede';
    if (s === 'Beklemede') {
        return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                <Hourglass className="mr-1 h-3 w-3" /> Beklemede
            </Badge>
        );
    }
    if (s === 'Pasif') {
        return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider">
                <XCircle className="mr-1 h-3 w-3" /> Pasif
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="mr-1 h-3 w-3" /> {s}
        </Badge>
    );
}

export default function OpportunitiesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    // Aktif kuruluş (ActiveEntityProvider) — tek kaynak.
    const { id: activeIdFromCtx, kind: activeKind, isLoading: activeLoading } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<EntityDoc>();

    const activeEntity = useMemo<{ kind: EntityKind; data: EntityDoc } | null>(() => {
        if (!activeIdFromCtx || !activeKind || !activeDoc) return null;
        return { kind: activeKind, data: activeDoc };
    }, [activeIdFromCtx, activeKind, activeDoc]);

    const initialLoading = activeLoading;
    // Gönüllülük ilanını STK (ngo) ve kulüp (club) açabilir; marka açamaz.
    const canCreate = activeEntity?.kind === 'ngo' || activeEntity?.kind === 'club';

    // ---- Bu kurumun mevcut ilanları ----
    const myListingsQ = useMemoFirebase(
        () =>
            firestore && canCreate && activeEntity?.data.id
                ? query(collection(firestore, COLLECTIONS.volunteering), where('ngoId', '==', activeEntity.data.id))
                : null,
        [firestore, canCreate, activeEntity?.data.id],
    );
    const { data: myListings } = useCollection<VolunteeringListDoc>(myListingsQ);

    // ---- Oluşturma dialog state ----
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [participationCondition, setParticipationCondition] = useState('');

    // Konum
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [address, setAddress] = useState('');
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [locationType, setLocationType] = useState<'Saha' | 'Online' | 'Hibrit'>('Saha');

    // Tarihler (tarih + saat → "yyyy-MM-dd HH:mm")
    const [appStartDate, setAppStartDate] = useState('');
    const [appStartTime, setAppStartTime] = useState('');
    const [appEndDate, setAppEndDate] = useState('');
    const [appEndTime, setAppEndTime] = useState('');
    const [eventStartDate, setEventStartDate] = useState('');
    const [eventStartTime, setEventStartTime] = useState('');
    const [eventEndDate, setEventEndDate] = useState('');
    const [eventEndTime, setEventEndTime] = useState('');

    // Saatler (gönüllü başına)
    const [hoursStart, setHoursStart] = useState('');
    const [hoursEnd, setHoursEnd] = useState('');
    const [hoursTotal, setHoursTotal] = useState('');

    // Kapasite + sosyal alan + görev türü + etki puanı
    const [needed, setNeeded] = useState('');
    const [socialArea, setSocialArea] = useState('');
    const [taskType, setTaskType] = useState<'Tek Gün' | 'Dönemsel' | 'Sürekli'>('Tek Gün');
    const [points, setPoints] = useState('');

    // Çoklu giriş (chips)
    const [skills, setSkills] = useState<string[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [requirements, setRequirements] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [interestInput, setInterestInput] = useState('');
    const [languageInput, setLanguageInput] = useState('');
    const [requirementInput, setRequirementInput] = useState('');

    // Sertifika / olanaklar / ön eğitim
    const [providesCertificate, setProvidesCertificate] = useState(false);
    const [amenityTransport, setAmenityTransport] = useState(false);
    const [amenityFood, setAmenityFood] = useState(false);
    const [amenityAccommodation, setAmenityAccommodation] = useState(false);
    const [hasPreTraining, setHasPreTraining] = useState(false);

    // Afiş
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [posterPreview, setPosterPreview] = useState<string | null>(null);
    const [posterUploading, setPosterUploading] = useState(false);
    const posterInputRef = useRef<HTMLInputElement>(null);

    const addChip = (
        list: string[],
        setList: React.Dispatch<React.SetStateAction<string[]>>,
        raw: string,
        clear: () => void,
    ) => {
        const v = raw.trim();
        if (!v || list.includes(v)) return;
        setList([...list, v]);
        clear();
    };
    const removeChip = (
        setList: React.Dispatch<React.SetStateAction<string[]>>,
        val: string,
    ) => setList((prev) => prev.filter((s) => s !== val));

    const handlePosterFile = (file: File | null) => {
        if (!file) {
            setPosterFile(null);
            setPosterPreview(null);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Afiş en fazla 5 MB olmalı.' });
            return;
        }
        setPosterFile(file);
        setPosterPreview(URL.createObjectURL(file));
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setParticipationCondition('');
        setCity('');
        setDistrict('');
        setAddress('');
        setLat('');
        setLon('');
        setLocationType('Saha');
        setAppStartDate('');
        setAppStartTime('');
        setAppEndDate('');
        setAppEndTime('');
        setEventStartDate('');
        setEventStartTime('');
        setEventEndDate('');
        setEventEndTime('');
        setHoursStart('');
        setHoursEnd('');
        setHoursTotal('');
        setNeeded('');
        setSocialArea('');
        setTaskType('Tek Gün');
        setPoints('');
        setSkills([]);
        setInterests([]);
        setLanguages([]);
        setRequirements([]);
        setSkillInput('');
        setInterestInput('');
        setLanguageInput('');
        setRequirementInput('');
        setProvidesCertificate(false);
        setAmenityTransport(false);
        setAmenityFood(false);
        setAmenityAccommodation(false);
        setHasPreTraining(false);
        if (posterPreview) URL.revokeObjectURL(posterPreview);
        setPosterFile(null);
        setPosterPreview(null);
        if (posterInputRef.current) posterInputRef.current.value = '';
    };

    const openCreate = () => {
        resetForm();
        setCreateOpen(true);
    };

    // "yyyy-MM-dd HH:mm" — saat boşsa sadece tarih.
    const joinDateTime = (date: string, time: string): string =>
        date ? (time ? `${date} ${time}` : date) : '';

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !activeEntity || !canCreate) return;
        if (!title.trim()) {
            toast({ title: 'Eksik alan', description: 'İlan başlığı zorunludur.', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            // Afiş upload (varsa).
            let posterUrl = '';
            if (posterFile) {
                setPosterUploading(true);
                try {
                    const storage = getStorage();
                    const ext = (posterFile.name.split('.').pop() || 'jpg').toLowerCase();
                    const key = `${Date.now().toString(36)}`;
                    const r = storageRef(storage, `volunteering-posters/${activeEntity.data.id}/${key}.${ext}`);
                    await uploadBytes(r, posterFile, { contentType: posterFile.type });
                    posterUrl = await getDownloadURL(r);
                } catch (uploadErr) {
                    console.error('Poster upload failed', uploadErr);
                    toast({ variant: 'destructive', title: 'Afiş yüklenemedi', description: 'İlan afişsiz kaydedildi; sonra düzenleyebilirsin.' });
                } finally {
                    setPosterUploading(false);
                }
            }

            // Düzenleyen kurumun logosu; yoksa boş string (undefined yazma).
            const organizerLogoUrl = activeEntity.data.logoUrl || activeEntity.data.avatarUrl || '';

            // Koordinat — lat/lon geçerli sayıysa coordinates ekle, değilse atla.
            const latNum = Number(lat);
            const lonNum = Number(lon);
            const hasCoords = lat.trim() !== '' && lon.trim() !== '' && Number.isFinite(latNum) && Number.isFinite(lonNum);

            const location: {
                city: string;
                district: string;
                type: 'Saha' | 'Online' | 'Hibrit';
                address: string;
                coordinates?: { lat: number; lon: number };
            } = {
                city: city.trim(),
                district: district.trim(),
                type: locationType,
                address: address.trim(),
            };
            if (hasCoords) location.coordinates = { lat: latNum, lon: lonNum };

            await addDoc(collection(firestore, COLLECTIONS.volunteering), {
                title: title.trim(),
                organization: activeEntity.data.name || 'Kuruluş',
                ngoId: activeEntity.data.id,
                organizerKind: activeEntity.kind,
                organizerLogoUrl,
                imageUrl: posterUrl,
                location,
                participationCondition: participationCondition.trim(),
                dates: {
                    applicationStart: joinDateTime(appStartDate, appStartTime),
                    applicationEnd: joinDateTime(appEndDate, appEndTime),
                    eventStart: joinDateTime(eventStartDate, eventStartTime),
                    eventEnd: joinDateTime(eventEndDate, eventEndTime),
                },
                hours: {
                    start: hoursStart || '',
                    end: hoursEnd || '',
                    total: Number(hoursTotal) || 0,
                },
                volunteerCount: {
                    needed: Number(needed) || 0,
                    applications: 0,
                },
                socialArea: socialArea || '',
                taskType,
                // events 'commitment' alanını da tutuyor — taskType ile aynı anlam.
                commitment: taskType,
                skills,
                interests,
                languages,
                requirements,
                providesCertificate,
                amenities: {
                    transport: amenityTransport,
                    food: amenityFood,
                    accommodation: amenityAccommodation,
                },
                hasPreTraining,
                earnedBadges: [],
                ngoTransparencyScore: 0,
                description: description.trim(),
                points: Number(points) || 0,
                status: 'Beklemede' as ListingStatus,
                createdAt: Date.now(),
                createdBy: authUser?.uid || null,
            });

            toast({
                title: 'İlan alındı',
                description: 'Gönüllülük ilanın onay için gönderildi. Onaylandığında yayına alınır.',
            });
            resetForm();
            setCreateOpen(false);
        } catch (err) {
            console.error('Volunteering create failed', err);
            toast({ title: 'Bir hata oluştu', description: 'İlan kaydedilemedi, tekrar deneyin.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // Render helper (JSX component DEĞİL) — render içinde component tanımlamak
    // react-hooks/static-components uyarısı + her keystroke'ta input focus kaybı
    // yaratıyordu. Fonksiyon olarak çağrılır: {renderChipField({...})}.
    const renderChipField = ({
        id,
        label,
        placeholder,
        list,
        inputVal,
        setInputVal,
        setList,
    }: {
        id: string;
        label: string;
        placeholder: string;
        list: string[];
        inputVal: string;
        setInputVal: (v: string) => void;
        setList: React.Dispatch<React.SetStateAction<string[]>>;
    }) => (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex gap-2">
                <Input
                    id={id}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addChip(list, setList, inputVal, () => setInputVal(''));
                        }
                    }}
                    placeholder={placeholder}
                />
                <Button type="button" variant="secondary" onClick={() => addChip(list, setList, inputVal, () => setInputVal(''))}>
                    Ekle
                </Button>
            </div>
            {list.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {list.map((s) => (
                        <Badge key={s} variant="secondary" className="font-normal">
                            {s}
                            <button type="button" className="ml-1 inline-flex" onClick={() => removeChip(setList, s)} aria-label="Kaldır">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_opportunities.title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('ngo_admin_opportunities.description')}</p>
                    </div>
                </div>
            </div>

            {/* Yetki yoksa (marka) uyarı bandı */}
            {!initialLoading && activeEntity && !canCreate && (
                <Card className="border-2 border-amber-200 bg-amber-50/60 rounded-2xl">
                    <CardHeader className="flex flex-row items-start gap-3 p-4">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Bu kurum gönüllülük ilanı açamaz</CardTitle>
                            <CardDescription className="text-xs mt-1">
                                Gönüllülük ilanları yalnızca STK ve kulüpler tarafından açılabilir. Lütfen aktif kurum olarak bir STK veya kulüp seçin.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            )}

            <Card className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <HeartHandshake className="h-5 w-5 text-primary" /> Gönüllülük İlanları
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {canCreate
                                ? 'Açtığın ilanlar burada listelenir. Yeni ilan oluştur; onaylandığında yayına alınır.'
                                : 'Gönüllülük ilanı açabilmek için aktif kurum bir STK veya kulüp olmalı.'}
                        </CardDescription>
                    </div>
                    <Button size="sm" disabled={!canCreate} onClick={() => canCreate && openCreate()} aria-disabled={!canCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Yeni İlan
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {initialLoading && (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor...
                        </div>
                    )}

                    {!initialLoading && canCreate && (myListings?.length ?? 0) === 0 && (
                        <p className="text-sm text-muted-foreground py-6 text-center">Henüz açtığın bir ilan yok.</p>
                    )}

                    {!initialLoading && (myListings?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                            {myListings!.map((listing) => (
                                <div key={listing.id} className="p-4 border rounded-2xl flex items-center justify-between group hover:bg-accent/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold">{listing.title || 'İsimsiz ilan'}</h4>
                                            <StatusBadge status={listing.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {listing.location?.city || '—'}
                                            {listing.location?.district ? ` • ${listing.location.district}` : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Oluşturma dialog */}
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
                <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-bold">Yeni Gönüllülük İlanı</DialogTitle>
                        <DialogDescription className="text-xs">
                            Gönüllülerin başvurabileceği bir ilan oluştur. Onaylandığında yayına alınır.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {/* Afiş */}
                        <div className="space-y-2">
                            <Label>İlan Afişi (A4 portre önerilir)</Label>
                            <input
                                ref={posterInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => handlePosterFile(e.target.files?.[0] || null)}
                            />
                            {posterPreview ? (
                                <div className="relative">
                                    <div className="relative aspect-[210/297] max-w-[200px] mx-auto rounded-2xl overflow-hidden border bg-muted shadow-md">
                                        <NextImage src={posterPreview} alt="Afiş önizleme" fill className="object-cover" unoptimized />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => posterInputRef.current?.click()} disabled={posterUploading || submitting}>
                                            <Upload className="h-3.5 w-3.5 mr-1.5" /> Değiştir
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handlePosterFile(null)} disabled={posterUploading || submitting}>
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
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vol-title">İlan Başlığı *</Label>
                            <Input id="vol-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Sahil Temizliği Gönüllüsü" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vol-desc">Açıklama</Label>
                            <Textarea id="vol-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="İlanın detayları, görev tanımı, beklentiler..." />
                        </div>

                        {/* Konum türü */}
                        <div className="space-y-2">
                            <Label htmlFor="vol-loc-type">Konum Türü</Label>
                            <Select value={locationType} onValueChange={(v) => setLocationType(v as 'Saha' | 'Online' | 'Hibrit')}>
                                <SelectTrigger id="vol-loc-type"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {LOCATION_TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <LocationFields
                            value={{ country: 'Türkiye', city, district, openAddress: address, lat, lon }}
                            onChange={(next) => {
                                setCity(next.city ?? '');
                                setDistrict(next.district ?? '');
                                setAddress(next.openAddress ?? '');
                                setLat(next.lat ?? '');
                                setLon(next.lon ?? '');
                            }}
                            showCountry={false}
                            showNeighborhood={false}
                            showOpenAddress
                            labelCity="İl"
                            labelOpenAddress="Açık Adres"
                        />

                        {/* Başvuru tarihleri */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="vol-app-start">Başvuru Başlangıç</Label>
                                <Input id="vol-app-start" type="date" value={appStartDate} onChange={(e) => setAppStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-app-start-time">Saat</Label>
                                <Input id="vol-app-start-time" type="time" value={appStartTime} onChange={(e) => setAppStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-app-end">Başvuru Bitiş</Label>
                                <Input id="vol-app-end" type="date" value={appEndDate} onChange={(e) => setAppEndDate(e.target.value)} min={appStartDate || undefined} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-app-end-time">Saat</Label>
                                <Input id="vol-app-end-time" type="time" value={appEndTime} onChange={(e) => setAppEndTime(e.target.value)} />
                            </div>
                        </div>

                        {/* Etkinlik tarihleri */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="vol-ev-start">Etkinlik Başlangıç</Label>
                                <Input id="vol-ev-start" type="date" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-ev-start-time">Saat</Label>
                                <Input id="vol-ev-start-time" type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-ev-end">Etkinlik Bitiş</Label>
                                <Input id="vol-ev-end" type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} min={eventStartDate || undefined} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-ev-end-time">Saat</Label>
                                <Input id="vol-ev-end-time" type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} />
                            </div>
                        </div>

                        {/* Çalışma saatleri */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="vol-hours-start">Başlama Saati</Label>
                                <Input id="vol-hours-start" type="time" value={hoursStart} onChange={(e) => setHoursStart(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-hours-end">Bitiş Saati</Label>
                                <Input id="vol-hours-end" type="time" value={hoursEnd} onChange={(e) => setHoursEnd(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-hours-total">Toplam Saat</Label>
                                <Input id="vol-hours-total" type="number" min={0} inputMode="numeric" value={hoursTotal} onChange={(e) => setHoursTotal(e.target.value)} placeholder="Örn. 8" />
                            </div>
                        </div>

                        {/* Kapasite + sosyal alan */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="vol-needed">Aranan Gönüllü Sayısı</Label>
                                <Input id="vol-needed" type="number" min={0} inputMode="numeric" value={needed} onChange={(e) => setNeeded(e.target.value)} placeholder="Örn. 20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-social-area">Sosyal Alan</Label>
                                <Select value={socialArea} onValueChange={setSocialArea}>
                                    <SelectTrigger id="vol-social-area"><SelectValue placeholder="Seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {SOCIAL_AREA_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Görev türü + etki puanı */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="vol-task-type">Görev Türü</Label>
                                <Select value={taskType} onValueChange={(v) => setTaskType(v as 'Tek Gün' | 'Dönemsel' | 'Sürekli')}>
                                    <SelectTrigger id="vol-task-type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TASK_TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vol-points">Etki Puanı</Label>
                                <Input id="vol-points" type="number" min={0} inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Örn. 50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vol-part-cond">Katılım Koşulu (opsiyonel)</Label>
                            <Textarea id="vol-part-cond" rows={2} value={participationCondition} onChange={(e) => setParticipationCondition(e.target.value)} placeholder="Örn. 18 yaş üstü, sürücü belgesi gerekli..." />
                        </div>

                        {/* Çoklu giriş alanları */}
                        {renderChipField({ id: "vol-skills", label: "Aranan Yetenekler (opsiyonel)", placeholder: "Yetenek yazıp Ekle",
                            list: skills, inputVal: skillInput, setInputVal: setSkillInput, setList: setSkills })}
                        {renderChipField({ id: "vol-interests", label: "İlgi Alanları (opsiyonel)", placeholder: "İlgi alanı yazıp Ekle",
                            list: interests, inputVal: interestInput, setInputVal: setInterestInput, setList: setInterests })}
                        {renderChipField({ id: "vol-languages", label: "Diller (opsiyonel)", placeholder: "Dil yazıp Ekle",
                            list: languages, inputVal: languageInput, setInputVal: setLanguageInput, setList: setLanguages })}
                        {renderChipField({ id: "vol-requirements", label: "Gereksinimler / Belgeler (opsiyonel)", placeholder: "Gereksinim yazıp Ekle",
                            list: requirements, inputVal: requirementInput, setInputVal: setRequirementInput, setList: setRequirements })}

                        {/* Sertifika */}
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border rounded-xl bg-card">
                            <Checkbox checked={providesCertificate} onCheckedChange={(c) => setProvidesCertificate(c === true)} />
                            <span>Bu ilan gönüllülere <strong>sertifika</strong> veriyor</span>
                        </label>

                        {/* Ön eğitim */}
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border rounded-xl bg-card">
                            <Checkbox checked={hasPreTraining} onCheckedChange={(c) => setHasPreTraining(c === true)} />
                            <span>Katılımdan önce <strong>ön eğitim</strong> veriliyor</span>
                        </label>

                        {/* Olanaklar */}
                        <div className="space-y-2">
                            <Label>Sağlanan Olanaklar</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border rounded-xl bg-card">
                                    <Checkbox checked={amenityTransport} onCheckedChange={(c) => setAmenityTransport(c === true)} />
                                    <span>Ulaşım</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border rounded-xl bg-card">
                                    <Checkbox checked={amenityFood} onCheckedChange={(c) => setAmenityFood(c === true)} />
                                    <span>Yemek</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border rounded-xl bg-card">
                                    <Checkbox checked={amenityAccommodation} onCheckedChange={(c) => setAmenityAccommodation(c === true)} />
                                    <span>Konaklama</span>
                                </label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting || posterUploading}>İptal</Button>
                            <Button type="submit" disabled={submitting || posterUploading}>
                                {(submitting || posterUploading)
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {posterUploading ? 'Afiş yükleniyor...' : 'Kaydediliyor...'}</>
                                    : 'İlanı Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
