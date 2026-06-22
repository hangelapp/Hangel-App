'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, Siren, MapPin, Loader2, Check, X, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { countryPhoneCodes, allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';


// Demo veriler kaldırıldı — gerçek çağrılar Firestore'dan beslenecek (henüz bağlanmadıysa boş gösterilir).
const initialActiveCalls: Array<{ id: number; type: string; details: string; location: string; time: string }> = [];

const initialPastApplications: Array<{ id: number; type: string; details: string; location: string; status: 'Başvuruldu' }> = [];

interface BloodNeedFormData {
    hospital: string;
    hospitalCity?: string;
    hospitalDistrict?: string;
    hospitalAddress?: string;
    hospitalPhone?: string;
    city: string; // il (çoktan seçmeli — hastaneden otomatik dolar)
    district: string; // ilçe
    neighborhood: string; // mahalle
    bloodType: string;
    needType: string; // Kan | Trombosit | Aferez | Plazma Aferezi | Kök Hücre (TÜRKÖK) | Kordon Kanı
    units: number; // kaç ünite kan
    patientName: string; // hasta adı soyadı
    patientBirthYear: string; // hastanın doğum yılı
    contactName: string;
    contactPhone: string;
    notes: string;
}

interface ReportTabContentProps {
    isReporting: string | null;
    onReportClick: (type: string, details: string) => void;
    onOpenBloodDialog: () => void;
}

const ReportTabContent = ({ isReporting, onReportClick, onOpenBloodDialog }: ReportTabContentProps) => {
    const { t } = useTranslation();
    return (
    <div className="flex flex-col gap-4 p-4">
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className="h-24 text-lg flex-col gap-2"
                    variant="destructive"
                    disabled={!!isReporting}
                >
                    {isReporting === 'Genel Afet Bildirimi' ? <Loader2 className="h-8 w-8 animate-spin" /> : <Siren className="h-8 w-8" />}
                    {t('emergency_root.btnDisaster')}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">{t('emergency_root.disasterConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>{t('emergency_root.disasterConfirmKind')}</strong> {t('emergency_root.disasterConfirmDescPrefix')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="disaster-details">{t('emergency_root.detailsLabel')}</Label>
                    <Textarea
                        id="disaster-details"
                        placeholder={t('emergency_root.detailsPlaceholder')}
                        className="min-h-[80px] placeholder:text-xs"
                    />
                </div>
                <div className="py-2">
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
                        <Siren className="h-4 w-4" />
                        <AlertTitle className="font-black text-xs uppercase tracking-widest">{t('emergency_root.legalWarningTitle')}</AlertTitle>
                        <AlertDescription className="text-xs font-bold leading-tight">
                            {t('emergency_root.legalWarningShort')}
                        </AlertDescription>
                    </Alert>
                </div>
                <AlertDialogFooter className="gap-2 mt-4">
                    <AlertDialogCancel className="rounded-2xl font-bold">{t('emergency_root.btnCancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onReportClick('disaster', 'Genel Afet Bildirimi')}
                        className="rounded-2xl font-bold bg-destructive hover:bg-destructive/90 text-white border-none"
                    >
                        {t('emergency_root.btnSendReport')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Button
            className="h-24 text-lg flex-col gap-2"
            variant="outline"
            disabled={!!isReporting}
            onClick={onOpenBloodDialog}
        >
            <Droplets className="h-8 w-8 text-red-600" />
            {t('emergency_root.btnBloodNeed')}
        </Button>
    </div>
    );
};

const BloodNeedDialog = ({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: BloodNeedFormData) => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<BloodNeedFormData>({
        hospital: '',
        hospitalCity: '',
        hospitalDistrict: '',
        hospitalAddress: '',
        hospitalPhone: '',
        city: '',
        district: '',
        neighborhood: '',
        bloodType: '',
        needType: 'Kan',
        units: 1,
        patientName: '',
        patientBirthYear: '',
        contactName: '',
        contactPhone: '',
        notes: '',
    });

    // il/ilçe/mahalle cascading options
    const districtOptions = formData.city ? (districtsData[formData.city] ?? []) : [];
    const neighborhoodOptions = (formData.city && formData.district)
        ? ((neighborhoodsData as Record<string, Record<string, string[]>>)[formData.city]?.[formData.district] ?? [])
        : [];

    // Hastane şehir adını allProvinces ile normalize et (büyük/küçük harf + İ/ı farkı).
    const normalizeProvince = (raw?: string): string => {
        if (!raw) return '';
        const lower = raw.toLocaleLowerCase('tr-TR').trim();
        const match = allProvinces.find(p => p.toLocaleLowerCase('tr-TR') === lower);
        return match || '';
    };

    const bloodTypes = ["A Rh+", "A Rh-", "B Rh+", "B Rh-", "AB Rh+", "AB Rh-", "0 Rh+", "0 Rh-", "Bilinmiyor"];
    const needTypes = ["Kan", "Trombosit", "Aferez", "Plazma Aferezi", "Kök Hücre (TÜRKÖK)", "Kordon Kanı"];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onOpenChange(false); // Close dialog on submit
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-red-600" />
                        {t('emergency_root.bloodDialogTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('emergency_root.bloodDialogDesc')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <HospitalAutocompleteField
                        value={formData.hospital}
                        onChange={(name, hit) => {
                            setFormData(prev => {
                                // Hastane seçilince il/ilçe çoktan seçmeli menüde otomatik seçilsin.
                                const matchedProvince = hit?.city ? normalizeProvince(hit.city) : '';
                                // İlçe: hastane district'i o ildeki ilçe listesinde varsa otomatik seç.
                                let matchedDistrict = '';
                                if (matchedProvince && hit?.district) {
                                    const opts = districtsData[matchedProvince] ?? [];
                                    const dLower = hit.district.toLocaleLowerCase('tr-TR').trim();
                                    matchedDistrict = opts.find(d => d.toLocaleLowerCase('tr-TR') === dLower) || '';
                                }
                                return {
                                    ...prev,
                                    hospital: name,
                                    hospitalCity: hit?.city ?? prev.hospitalCity,
                                    hospitalDistrict: hit?.district ?? prev.hospitalDistrict,
                                    hospitalAddress: hit?.address ?? prev.hospitalAddress,
                                    hospitalPhone: hit?.phone ?? prev.hospitalPhone,
                                    // Çoktan seçmeli menüler otomatik dolsun (kullanıcı düzenleyebilir)
                                    city: matchedProvince || prev.city,
                                    district: matchedDistrict || (matchedProvince ? '' : prev.district),
                                    neighborhood: '',
                                };
                            });
                        }}
                    />
                    {/* Seçilen hastanenin detayları (Bilgileri Getir sonrası seçim yapılırsa görünür) */}
                    {(formData.hospitalCity || formData.hospitalAddress || formData.hospitalPhone) && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1 dark:border-emerald-800 dark:bg-emerald-900/20">
                            <p className="font-bold text-emerald-900 dark:text-emerald-100">{t('emergency_root.hospitalInfoOk')}</p>
                            {(formData.hospitalDistrict || formData.hospitalCity) && (
                                <p className="text-emerald-800 dark:text-emerald-200">📍 {[formData.hospitalDistrict, formData.hospitalCity].filter(Boolean).join(', ')}</p>
                            )}
                            {formData.hospitalAddress && (
                                <p className="text-emerald-800 leading-snug dark:text-emerald-200">{formData.hospitalAddress}</p>
                            )}
                            {formData.hospitalPhone && (
                                <p className="text-emerald-800 dark:text-emerald-200">☎ {formData.hospitalPhone}</p>
                            )}
                        </div>
                    )}
                    {/* İl / İlçe / Mahalle — hastaneden otomatik dolar, kullanıcı düzenleyebilir.
                        Kan ihtiyacı bu konumdaki uygun bağışçılara iletilir. */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="ev-city">{t('emergency_root.labelCity')}</Label>
                            <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v, district: '', neighborhood: '' })}>
                                <SelectTrigger id="ev-city"><SelectValue placeholder={t('emergency_root.selectPlaceholder')} /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {allProvinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ev-district">{t('emergency_root.labelDistrict')}</Label>
                            <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v, neighborhood: '' })} disabled={!formData.city}>
                                <SelectTrigger id="ev-district"><SelectValue placeholder={formData.city ? t('emergency_root.selectPlaceholder') : t('emergency_root.selectFirstCity')} /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {districtOptions.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ev-neighborhood">{t('emergency_root.labelNeighborhood')}</Label>
                            <Select value={formData.neighborhood} onValueChange={(v) => setFormData({ ...formData, neighborhood: v })} disabled={!formData.district}>
                                <SelectTrigger id="ev-neighborhood"><SelectValue placeholder={formData.district ? t('emergency_root.selectPlaceholder') : t('emergency_root.selectFirstDistrict')} /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {neighborhoodOptions.map((n: string) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Hasta bilgileri */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patient-name">{t('emergency_root.labelPatientName')}</Label>
                            <Input
                                id="patient-name"
                                value={formData.patientName}
                                onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                                placeholder={t('emergency_root.placeholderPatientName')}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-birth-year">{t('emergency_root.labelBirthYear')}</Label>
                            <Input
                                id="patient-birth-year"
                                type="number"
                                inputMode="numeric"
                                min={1900}
                                max={new Date().getFullYear()}
                                value={formData.patientBirthYear}
                                onChange={e => setFormData({ ...formData, patientBirthYear: e.target.value })}
                                placeholder={t('emergency_root.placeholderBirthYear')}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="need-type">{t('emergency_root.labelNeedType')}</Label>
                        <Select value={formData.needType} onValueChange={value => setFormData({ ...formData, needType: value })}>
                            <SelectTrigger id="need-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {needTypes.map(nt => <SelectItem key={nt} value={nt}>{nt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="blood-type">{t('emergency_root.labelPatientBloodType')}</Label>
                            <Select required onValueChange={value => setFormData({...formData, bloodType: value})}>
                                <SelectTrigger id="blood-type">
                                    <SelectValue placeholder={t('emergency_root.selectPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {bloodTypes.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="units">{t('emergency_root.labelUnits')}</Label>
                            <Input
                                id="units"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={50}
                                value={formData.units}
                                onChange={e => setFormData({ ...formData, units: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                             <Label htmlFor="contact-phone">{t('emergency_root.labelContactPhone')}</Label>
                             <div className="flex gap-1">
                                <div className="w-[70px] shrink-0">
                                    <Select defaultValue="90" required>
                                        <SelectTrigger className="h-10 px-2 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countryPhoneCodes.map(code => (
                                                <SelectItem key={code} value={code} className="text-xs">+{code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Input id="contact-phone" type="tel" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} placeholder="5XX..." required className="flex-1 min-w-0 h-10" />
                             </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact-name">{t('emergency_root.labelContactName')}</Label>
                        <Input id="contact-name" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder={t('emergency_root.placeholderContactName')} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">{t('emergency_root.labelNotes')}</Label>
                        <Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder={t('emergency_root.placeholderNotes')} />
                    </div>
                     <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('emergency_root.btnCancel')}</Button>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700">{t('emergency_root.btnSendReport')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ── İlan sahibinin kan ilanları + bağışçı listesi ─────────────────────────────
interface MyBloodRequest {
    id: string;
    type?: string;
    hospitalName?: string;
    hospitalCity?: string;
    bloodType?: string;
    needType?: string;
    units?: number;
    status?: string;
}

interface DonorRow {
    uid: string;
    name: string;
    phoneLast4: string;
    status: 'coming' | 'came' | 'noshow' | string;
    certIssued: boolean;
}

const DonorList = ({ request, authUser }: { request: MyBloodRequest; authUser: User }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [donors, setDonors] = useState<DonorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [marking, setMarking] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const idToken = await authUser.getIdToken();
                const res = await fetch(`/api/emergency/${request.id}/donors`, {
                    headers: { authorization: `Bearer ${idToken}` },
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) throw new Error(data.message || t('emergency_root.donorsLoadError'));
                if (active) setDonors(data.donors ?? []);
            } catch (e) {
                if (active) setError(e instanceof Error ? e.message : t('emergency_root.donorsLoadError'));
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [request.id, authUser, t]);

    const handleMark = async (donorUid: string, status: 'came' | 'noshow') => {
        if (marking) return;
        setMarking(donorUid);
        try {
            const idToken = await authUser.getIdToken();
            const res = await fetch(`/api/emergency/${request.id}/donor-status`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ donorUid, status }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) throw new Error(data.message || t('emergency_root.donorMarkError'));
            setDonors((prev) => prev.map((d) =>
                d.uid === donorUid ? { ...d, status, certIssued: status === 'came' ? true : d.certIssued } : d,
            ));
            if (status === 'came') {
                toast({ title: t('emergency_root.donorCertTitle'), description: t('emergency_root.donorCertDesc') });
            }
        } catch (e) {
            toast({
                variant: 'destructive',
                title: t('emergency_root.toastSendFailedTitle'),
                description: e instanceof Error ? e.message : t('emergency_root.donorMarkError'),
            });
        } finally {
            setMarking(null);
        }
    };

    if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
    if (error) return <p className="text-xs text-destructive py-2">{error}</p>;
    if (donors.length === 0) return <p className="text-xs text-muted-foreground italic py-2">{t('emergency_root.noDonorsYet')}</p>;

    return (
        <div className="space-y-2 pt-2">
            {donors.map((d) => (
                <div key={d.uid} className="flex items-center justify-between gap-2 rounded-xl border bg-background p-3">
                    <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> •••{d.phoneLast4 || '••••'}
                        </p>
                    </div>
                    {d.status === 'came' ? (
                        <Badge className="rounded-full text-[10px] font-black uppercase gap-1 bg-primary text-primary-foreground shrink-0">
                            <Check className="h-3 w-3" /> {t('emergency_root.donorCertGiven')}
                        </Badge>
                    ) : d.status === 'noshow' ? (
                        <Badge variant="secondary" className="rounded-full text-[10px] font-black uppercase shrink-0">
                            {t('emergency_root.donorNoShow')}
                        </Badge>
                    ) : (
                        <div className="flex gap-1.5 shrink-0">
                            <Button
                                size="sm"
                                className="rounded-xl h-8 px-3 font-bold"
                                disabled={marking === d.uid}
                                onClick={() => handleMark(d.uid, 'came')}
                            >
                                {marking === d.uid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                {t('emergency_root.donorMarkCame')}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl h-8 px-3 font-bold"
                                disabled={marking === d.uid}
                                onClick={() => handleMark(d.uid, 'noshow')}
                            >
                                <X className="h-3.5 w-3.5 mr-1" /> {t('emergency_root.donorMarkNoShow')}
                            </Button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const MyBloodRequestsTab = ({ authUser }: { authUser: User }) => {
    const { t } = useTranslation();
    const db = useFirestore();

    const myRequestsQuery = useMemoFirebase(() => {
        if (!db || !authUser?.uid) return null;
        return query(
            collection(db, COLLECTIONS.emergencyRequests),
            where('requestedBy', '==', authUser.uid),
            where('type', '==', 'blood'),
        );
    }, [db, authUser?.uid]);
    const { data: myRequests, isLoading } = useCollection<MyBloodRequest>(myRequestsQuery);

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    const requests = myRequests ?? [];
    if (requests.length === 0) {
        return (
            <div className="text-center py-16 bg-white/5 rounded-[2rem] border-2 border-dashed border-muted-foreground/20">
                <Droplets className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t('emergency_root.noMyBloodRequests')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-6">
            {requests.map((r) => (
                <Card key={r.id} className="rounded-[1.5rem] border-none shadow-sm overflow-hidden">
                    <div className="bg-destructive/5 p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-red-600" />
                            <p className="font-bold text-base tracking-tight leading-tight">{r.hospitalName || t('emergency_root.bloodRequestFallback')}</p>
                        </div>
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                            {r.bloodType && <span className="font-mono font-bold text-foreground">{r.bloodType}</span>}
                            {r.needType && <span>· {r.needType}</span>}
                            {r.hospitalCity && <span className="flex items-center gap-1">· <MapPin className="h-3 w-3" /> {r.hospitalCity}</span>}
                            {typeof r.units === 'number' && <span>· {r.units} {t('emergency_root.unitsSuffix')}</span>}
                        </p>
                    </div>
                    <CardContent className="p-4 border-t border-dashed">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('emergency_root.donorsTitle')}</p>
                        <DonorList request={r} authUser={authUser} />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default function EmergencyPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const db = useFirestore();
    const { user: authUser, isUserLoading } = useUser();

    // Anon ziyaretçi /emergency'ye düşerse (eski link, bookmark, paylaşılan URL)
    // tanıtım sayfasına yönlendir — canlı talep akışı yalnızca auth'lu kullanıcılara.
    useEffect(() => {
        if (!isUserLoading && !authUser) {
            router.replace('/emergency/about');
        }
    }, [authUser, isUserLoading, router]);

    // Talep edenin profil konumu — pending talebe damgalanır, böylece süper admin
    // formu il/ilçe/mahalle ile ön-doldurabilir.
    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser?.uid) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser?.uid]);
    const { data: userDoc } = useDoc<{
        personalInfo?: { address?: { city?: string; district?: string; neighborhood?: string } };
    }>(userDocRef);

    const [activeCalls, setActiveCalls] = useState(initialActiveCalls);
    const [pastApplications, setPastApplications] = useState(initialPastApplications);
    const [isReporting, setIsReporting] = useState<string | null>(null);
    const [isBloodDialogOpen, setIsBloodDialogOpen] = useState(false);
    
    const handleReportClick = async (type: string, details: string) => {
        if (!authUser) {
            toast({
                variant: 'destructive',
                title: t('emergency_root.toastLoginRequiredTitle'),
                description: t('emergency_root.toastLoginReportDesc'),
            });
            return;
        }
        setIsReporting(details);
        try {
            await addDoc(collection(db, COLLECTIONS.emergencyRequests), {
                type,
                details,
                status: 'pending',
                requestedBy: authUser.uid,
                requestedByName: authUser.displayName || authUser.email || '',
                requestedByEmail: authUser.email || '',
                createdAt: serverTimestamp(),
            });
            toast({
                title: t('emergency_root.toastReportSentTitle'),
                description: `${details} ${t('emergency_root.toastReportSentDescSuffix')}`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: t('emergency_root.toastSendFailedTitle'),
                description: t('emergency_root.toastReportSendFailedDesc'),
            });
        } finally {
            setIsReporting(null);
        }
    };

    const handleBloodNeedSubmit = async (data: BloodNeedFormData) => {
        if (!authUser) {
            toast({
                variant: 'destructive',
                title: t('emergency_root.toastLoginRequiredTitle'),
                description: t('emergency_root.toastLoginBloodDesc'),
            });
            return;
        }
        try {
            const addr = userDoc?.personalInfo?.address;
            // Konum önceliği: kullanıcının formda seçtiği (hastaneden otomatik dolan) il/ilçe/mahalle;
            // boşsa profil adresine düş.
            const finalCity = data.city || addr?.city || null;
            const finalDistrict = data.district || addr?.district || null;
            const finalNeighborhood = data.neighborhood || addr?.neighborhood || null;
            // Hastane konumunu koordinata çevir (best-effort) → bildirimde "xx km · ~xx dk mesafede".
            let hospitalCoords: { lat: number; lng: number } | null = null;
            try {
              const gq = [data.hospital, data.hospitalDistrict || finalDistrict, data.hospitalCity || finalCity, 'Türkiye'].filter(Boolean).join(', ');
              if (gq) {
                const gr = await fetch(`/api/geocode?q=${encodeURIComponent(gq)}`);
                if (gr.ok) {
                  const gj = await gr.json() as { lat?: number; lon?: number };
                  if (typeof gj.lat === 'number' && typeof gj.lon === 'number') hospitalCoords = { lat: gj.lat, lng: gj.lon };
                }
              }
            } catch { /* geocode best-effort */ }
            await addDoc(collection(db, COLLECTIONS.emergencyRequests), {
                type: 'blood',
                hospitalName: data.hospital || '',
                hospitalCity: data.hospitalCity || '',
                hospitalDistrict: data.hospitalDistrict || '',
                hospitalAddress: data.hospitalAddress || '',
                hospitalPhone: data.hospitalPhone || '',
                bloodType: data.bloodType || '',
                needType: data.needType || 'Kan',
                units: data.units || 1,
                patientName: data.patientName || '',
                patientBirthYear: data.patientBirthYear || '',
                contactName: data.contactName || '',
                contactPhone: data.contactPhone || '',
                message: data.notes || '',
                status: 'pending', // süper admin onayı bekleniyor
                // Formda seçilen (hastaneden otomatik) konum — süper admin ön-doldurma + hedefleme için.
                scope: finalCity ? 'city' : 'all',
                city: finalCity,
                district: finalDistrict,
                neighborhood: finalNeighborhood,
                coordinates: hospitalCoords,
                requestedBy: authUser.uid,
                requestedByName: authUser.displayName || authUser.email || '',
                requestedByEmail: authUser.email || '',
                createdAt: serverTimestamp(),
            });
            // Talep sahibine KALICI bildirim — kaybolan toast'a ek olarak bildirim
            // sayfasında da görünsün ("onay sonrası yakındakilere gönderilecek").
            try {
                await addDoc(collection(db, COLLECTIONS.notifications), {
                    userId: authUser.uid,
                    type: 'emergency-blood-received',
                    title: t('emergency_root.toastBloodReceivedTitle'),
                    body: t('emergency_root.toastBloodReceivedDesc'),
                    data: { hospitalName: data.hospital || '', bloodType: data.bloodType || '', coordinates: hospitalCoords },
                    read: false,
                    pushSent: true,
                    createdAt: serverTimestamp(),
                    createdBy: 'emergency-system',
                });
            } catch { /* bildirim yazılamasa da talep oluştu */ }
            toast({
                title: t('emergency_root.toastBloodReceivedTitle'),
                description: t('emergency_root.toastBloodReceivedDesc'),
            });
        } catch (e) {
            const err = e as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: t('emergency_root.toastSendFailedTitle'),
                description: err?.code === 'permission-denied'
                    ? t('emergency_root.toastPermDeniedDesc')
                    : (err?.message || t('emergency_root.toastGenericErrDesc')),
            });
        }
    };

    const handleHelpClick = async (call: typeof initialActiveCalls[0]) => {
        if (!authUser) {
            toast({
                variant: 'destructive',
                title: t('emergency_root.toastLoginRequiredTitle'),
                description: t('emergency_root.toastLoginHelpDesc'),
            });
            return;
        }
        // Optimistic UI update
        setActiveCalls(prev => prev.filter(c => c.id !== call.id));
        const newApp = { ...call, status: 'Başvuruldu' as const };
        setPastApplications(prev => [newApp, ...prev]);
        try {
            await addDoc(collection(db, COLLECTIONS.emergencyResponses), {
                callId: call.id,
                callType: call.type,
                callDetails: call.details,
                callLocation: call.location,
                volunteerUid: authUser.uid,
                volunteerName: authUser.displayName || authUser.email || '',
                status: 'applied',
                createdAt: serverTimestamp(),
            });
            toast({
                title: t('emergency_root.toastHelpReceivedTitle'),
                description: `"${call.details}" ${t('emergency_root.toastHelpReceivedDescPrefix')}`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: t('emergency_root.toastSendFailedTitle'),
                description: t('emergency_root.toastHelpSendFailedDesc'),
            });
        }
    };

  return (
    <div className="min-h-full bg-secondary/30 animate-in fade-in-0 flex flex-col">
        <div className="px-4 sm:px-6 pt-6 pb-3 space-y-1 shrink-0">
            <h1 className="text-3xl sm:text-4xl font-black font-headline tracking-tighter">{t('emergency_root.headerTitle')}</h1>
            <p className="text-muted-foreground text-sm font-medium">{t('emergency_root.headerSubtitle')}</p>
        </div>

        <div className="px-4">
            <Tabs defaultValue="report" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1.5 h-14 rounded-3xl backdrop-blur-xl shrink-0">
                    {/* min-w-0 + whitespace-normal + line-clamp: dar ekranda (≤375px)
                        uzun sekme etiketleri ("Çağrılar & Kayıtlar") taşıp yatay
                        kaydırma yaratmasın; min-h-[44px] dokunma hedefi korunur. */}
                    <TabsTrigger value="report" className="min-w-0 min-h-[44px] whitespace-normal rounded-2xl px-1 text-xs font-bold leading-tight data-[state=active]:bg-background data-[state=active]:shadow-md sm:text-sm">
                        <span className="line-clamp-2">{t('emergency_root.tabReport')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="calls" className="min-w-0 min-h-[44px] whitespace-normal rounded-2xl px-1 text-xs font-bold leading-tight data-[state=active]:bg-background data-[state=active]:shadow-md sm:text-sm">
                        <span className="line-clamp-2">{t('emergency_root.tabCalls')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="my-requests" className="min-w-0 min-h-[44px] whitespace-normal rounded-2xl px-1 text-xs font-bold leading-tight data-[state=active]:bg-background data-[state=active]:shadow-md sm:text-sm">
                        <span className="line-clamp-2">{t('emergency_root.tabMyRequests')}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="report" className="mt-0">
                    <ReportTabContent
                        isReporting={isReporting}
                        onReportClick={handleReportClick}
                        onOpenBloodDialog={() => setIsBloodDialogOpen(true)}
                    />
                </TabsContent>

                <TabsContent value="calls" className="mt-4 space-y-6 pb-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-base font-bold">{t('emergency_root.activeCallsTitle')}</h3>
                            <Badge variant="outline" className="rounded-full bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold uppercase">{t('emergency_root.liveBadge')}</Badge>
                        </div>
                        <div className="space-y-3">
                            {activeCalls.map(call => (
                                <Card key={call.id} className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                    <div className="bg-destructive/5 p-4 flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                                                <p className="font-black text-sm text-destructive uppercase tracking-widest">{call.type}</p>
                                            </div>
                                            <p className="text-lg font-bold tracking-tight leading-tight">{call.details}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {call.location}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{call.time}</p>
                                    </div>
                                    <div className="p-3 bg-background border-t border-dashed">
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl font-bold group-hover:bg-destructive group-hover:text-white transition-colors"
                                            onClick={() => handleHelpClick(call)}
                                        >
                                            {t('emergency_root.btnHelp')}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {activeCalls.length === 0 && (
                                <div className="text-center py-16 bg-white/5 rounded-[2rem] border-2 border-dashed border-muted-foreground/20">
                                    <p className="text-sm font-medium text-muted-foreground">{t('emergency_root.noActiveCalls')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-base font-bold px-1">{t('emergency_root.pastAppsTitle')}</h3>
                        <div className="space-y-3">
                            {pastApplications.map(app => (
                                <Card key={app.id} className="rounded-2xl border-none shadow-sm hover:bg-accent/5 transition-colors">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm">{app.type}</p>
                                            <p className="text-xs text-muted-foreground">{app.details} • {app.location}</p>
                                        </div>
                                        <Badge variant={app.status === 'Başvuruldu' ? 'default' : 'secondary'} className="rounded-full text-[10px] font-black uppercase px-3">
                                            {app.status}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                            {pastApplications.length === 0 && (
                                <p className="text-center text-xs text-muted-foreground py-8 italic">{t('emergency_root.noPastApps')}</p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="my-requests" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-base font-bold">{t('emergency_root.myRequestsTitle')}</h3>
                            <Badge variant="outline" className="rounded-full bg-red-100 text-red-700 border-red-200 text-[10px] font-bold uppercase">{t('emergency_root.bloodBadge')}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground px-1">{t('emergency_root.myRequestsHint')}</p>
                        {authUser
                            ? <MyBloodRequestsTab authUser={authUser} />
                            : <p className="text-center text-xs text-muted-foreground py-8 italic">{t('emergency_root.noMyBloodRequests')}</p>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        <BloodNeedDialog open={isBloodDialogOpen} onOpenChange={setIsBloodDialogOpen} onSubmit={handleBloodNeedSubmit} />

        <div className="mt-4 mx-4 mb-4">
            <div className="p-4 bg-slate-900/90 backdrop-blur-lg text-white rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                <div className="p-2 bg-white/10 rounded-lg">
                    <Siren className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-[10px] font-medium leading-snug">
                    <span className="font-bold text-red-400 uppercase tracking-widest mr-1">{t('emergency_root.footerLegalLabel')}</span>
                    {t('emergency_root.footerLegalBody')}
                </div>
            </div>
        </div>
    </div>
  );
}

/**
 * Hastane adı autocomplete — kullanıcı yazınca /api/hospitals/lookup'ı çağırır,
 * önerilerle dropdown gösterir. Seçim yapılınca onChange tetiklenir + dolu adres
 * bilgisi parent state'e geçer.
 */
interface HospitalHit {
    id: string;
    name?: string;
    city?: string;
    district?: string;
    address?: string;
    phone?: string;
    website?: string;
}

function HospitalAutocompleteField({
    value,
    onChange,
}: {
    value: string;
    onChange: (name: string, hit?: HospitalHit) => void;
}) {
    const { t } = useTranslation();
    const [hits, setHits] = useState<HospitalHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleLookup = async () => {
        if (value.trim().length < 2) return;
        setLoading(true);
        setOpen(true);
        try {
            const res = await fetch(`/api/hospitals/lookup?q=${encodeURIComponent(value.trim())}`);
            const data = await res.json().catch(() => ({}));
            setHits(Array.isArray(data.hits) ? data.hits : []);
        } catch {
            setHits([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="hospital">{t('emergency_root.labelHospital')}</Label>
            <div className="flex gap-2">
                <Input
                    id="hospital"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(false); }}
                    placeholder={t('emergency_root.placeholderHospital')}
                    required
                    className="flex-1"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleLookup}
                    disabled={loading || value.trim().length < 2}
                    className="shrink-0"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('emergency_root.btnFetchInfo')}
                </Button>
            </div>
            {open && hits.length > 0 && (
                <div className="border rounded-lg bg-card divide-y max-h-72 overflow-y-auto">
                    {hits.map((h) => (
                        <button
                            key={h.id}
                            type="button"
                            onClick={() => { onChange(h.name || '', h); setOpen(false); }}
                            className="w-full text-left p-2.5 hover:bg-accent transition-colors"
                        >
                            <p className="font-semibold text-sm leading-tight">{h.name}</p>
                            {(h.city || h.district || h.address) && (
                                <p className="text-[11px] text-muted-foreground leading-tight">
                                    {[h.district, h.city, h.address].filter(Boolean).join(' · ').slice(0, 100)}
                                </p>
                            )}
                            {h.phone && (
                                <p className="text-[11px] text-primary leading-tight">{h.phone}</p>
                            )}
                        </button>
                    ))}
                </div>
            )}
            {open && hits.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground px-1">{t('emergency_root.noLookupResults')}</p>
            )}
        </div>
    );
}
