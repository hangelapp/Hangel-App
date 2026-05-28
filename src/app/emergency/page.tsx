'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, Siren, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { countryPhoneCodes } from '@/lib/data';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp } from 'firebase/firestore';
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


// Demo veriler kaldırıldı — gerçek çağrılar Firestore'dan beslenecek (henüz bağlanmadıysa boş gösterilir).
const initialActiveCalls: Array<{ id: number; type: string; details: string; location: string; time: string }> = [];

const initialPastApplications: Array<{ id: number; type: string; details: string; location: string; status: 'Başvuruldu' }> = [];

interface BloodNeedFormData {
    hospital: string;
    hospitalCity?: string;
    hospitalDistrict?: string;
    hospitalAddress?: string;
    hospitalPhone?: string;
    bloodType: string;
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

const ReportTabContent = ({ isReporting, onReportClick, onOpenBloodDialog }: ReportTabContentProps) => (
    <div className="flex flex-col gap-4 p-4">
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className="h-24 text-lg flex-col gap-2"
                    variant="destructive"
                    disabled={!!isReporting}
                >
                    {isReporting === 'Genel Afet Bildirimi' ? <Loader2 className="h-8 w-8 animate-spin" /> : <Siren className="h-8 w-8" />}
                    Afet Bildirimi
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>Genel Afet</strong> bildirimi yapmak üzeresiniz. Bu işlem konum ve iletişim bilgilerinizi acil durum ekipleriyle paylaşacaktır.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="disaster-details">Acil Durum Detayları (İsteğe Bağlı)</Label>
                    <Textarea
                        id="disaster-details"
                        placeholder="Durumu kısaca açıklayın. Örn: 'Bina çökmesi', 'Büyük trafik kazası', 'Ormanlık alanda duman görülüyor'..."
                        className="min-h-[80px] placeholder:text-xs"
                    />
                </div>
                <div className="py-2">
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
                        <Siren className="h-4 w-4" />
                        <AlertTitle className="font-black text-xs uppercase tracking-widest">YASAL UYARI</AlertTitle>
                        <AlertDescription className="text-xs font-bold leading-tight">
                            Asılsız bildirimler yasal sorumluluk ve cezai yaptırım doğurur.
                        </AlertDescription>
                    </Alert>
                </div>
                <AlertDialogFooter className="gap-2 mt-4">
                    <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onReportClick('disaster', 'Genel Afet Bildirimi')}
                        className="rounded-2xl font-bold bg-destructive hover:bg-destructive/90 text-white border-none"
                    >
                        Bildirimi Gönder
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
            Kan İhtiyacı Bildirimi
        </Button>
    </div>
);

const BloodNeedDialog = ({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: BloodNeedFormData) => void }) => {
    const [formData, setFormData] = useState<BloodNeedFormData>({
        hospital: '',
        hospitalCity: '',
        hospitalDistrict: '',
        hospitalAddress: '',
        hospitalPhone: '',
        bloodType: '',
        units: 1,
        patientName: '',
        patientBirthYear: '',
        contactName: '',
        contactPhone: '',
        notes: '',
    });

    const bloodTypes = ["A Rh+", "A Rh-", "B Rh+", "B Rh-", "AB Rh+", "AB Rh-", "0 Rh+", "0 Rh-", "Bilinmiyor"];

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
                        Kan İhtiyacı Bildirimi
                    </DialogTitle>
                    <DialogDescription>
                        Lütfen acil kan ihtiyacı ile ilgili detayları eksiksiz doldurun. Bu bilgiler ilgili birimlere ve gönüllülere iletilecektir.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <HospitalAutocompleteField
                        value={formData.hospital}
                        onChange={(name, hit) => {
                            setFormData(prev => ({
                                ...prev,
                                hospital: name,
                                hospitalCity: hit?.city ?? prev.hospitalCity,
                                hospitalDistrict: hit?.district ?? prev.hospitalDistrict,
                                hospitalAddress: hit?.address ?? prev.hospitalAddress,
                                hospitalPhone: hit?.phone ?? prev.hospitalPhone,
                            }));
                        }}
                    />
                    {/* Seçilen hastanenin detayları (Bilgileri Getir sonrası seçim yapılırsa görünür) */}
                    {(formData.hospitalCity || formData.hospitalAddress || formData.hospitalPhone) && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1">
                            <p className="font-bold text-emerald-900">✓ Hastane bilgileri</p>
                            {(formData.hospitalDistrict || formData.hospitalCity) && (
                                <p className="text-emerald-800">📍 {[formData.hospitalDistrict, formData.hospitalCity].filter(Boolean).join(', ')}</p>
                            )}
                            {formData.hospitalAddress && (
                                <p className="text-emerald-800 leading-snug">{formData.hospitalAddress}</p>
                            )}
                            {formData.hospitalPhone && (
                                <p className="text-emerald-800">☎ {formData.hospitalPhone}</p>
                            )}
                        </div>
                    )}
                    {/* Hasta bilgileri */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patient-name">Hasta Adı Soyadı</Label>
                            <Input
                                id="patient-name"
                                value={formData.patientName}
                                onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                                placeholder="Ad Soyad"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-birth-year">Doğum Yılı</Label>
                            <Input
                                id="patient-birth-year"
                                type="number"
                                inputMode="numeric"
                                min={1900}
                                max={new Date().getFullYear()}
                                value={formData.patientBirthYear}
                                onChange={e => setFormData({ ...formData, patientBirthYear: e.target.value })}
                                placeholder="1985"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="blood-type">Kan Grubu</Label>
                            <Select required onValueChange={value => setFormData({...formData, bloodType: value})}>
                                <SelectTrigger id="blood-type">
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bloodTypes.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="units">Ünite</Label>
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
                             <Label htmlFor="contact-phone">İrtibat Telefon</Label>
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
                        <Label htmlFor="contact-name">İrtibat Kişisi Adı</Label>
                        <Input id="contact-name" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="İsmail Hilmi ADIGÜZEL" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Özel Durumlar (İsteğe Bağlı)</Label>
                        <Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Hasta durumu, aciliyet seviyesi veya diğer önemli notlar..." />
                    </div>
                     <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700">Bildirimi Gönder</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function EmergencyPage() {
    const router = useRouter();
    const { toast } = useToast();
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
                title: 'Giriş gerekli',
                description: 'Acil durum bildirimi göndermek için giriş yapmalısınız.',
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
                title: 'İhbar İletildi',
                description: `${details} durumu konumunuzla birlikte ilgili birimlere başarıyla ulaştırıldı.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Gönderilemedi',
                description: 'İhbar iletilemedi. Lütfen tekrar deneyin.',
            });
        } finally {
            setIsReporting(null);
        }
    };

    const handleBloodNeedSubmit = async (data: BloodNeedFormData) => {
        if (!authUser) {
            toast({
                variant: 'destructive',
                title: 'Giriş gerekli',
                description: 'Acil kan talebi göndermek için giriş yapmalısınız.',
            });
            return;
        }
        try {
            const addr = userDoc?.personalInfo?.address;
            await addDoc(collection(db, COLLECTIONS.emergencyRequests), {
                type: 'blood',
                hospitalName: data.hospital || '',
                hospitalCity: data.hospitalCity || '',
                hospitalDistrict: data.hospitalDistrict || '',
                hospitalAddress: data.hospitalAddress || '',
                hospitalPhone: data.hospitalPhone || '',
                bloodType: data.bloodType || '',
                units: data.units || 1,
                patientName: data.patientName || '',
                patientBirthYear: data.patientBirthYear || '',
                contactName: data.contactName || '',
                contactPhone: data.contactPhone || '',
                message: data.notes || '',
                status: 'pending', // süper admin onayı bekleniyor
                // Talep edenin profil konumu — süper admin formu ön-doldurma için.
                scope: addr?.city ? 'city' : 'all',
                city: addr?.city || null,
                district: addr?.district || null,
                neighborhood: addr?.neighborhood || null,
                requestedBy: authUser.uid,
                requestedByName: authUser.displayName || authUser.email || '',
                requestedByEmail: authUser.email || '',
                createdAt: serverTimestamp(),
            });
            toast({
                title: '✅ Kan İhtiyacı Bildirimi Alındı',
                description: 'Talebiniz süper admin onayından sonra yakındaki kullanıcılara bildirim olarak gönderilecek.',
            });
        } catch (e) {
            const err = e as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: 'Gönderilemedi',
                description: err?.code === 'permission-denied'
                    ? 'Sunucu izin vermedi. Yetkilerinizi kontrol edin.'
                    : (err?.message || 'Beklenmeyen bir hata oluştu.'),
            });
        }
    };

    const handleHelpClick = async (call: typeof initialActiveCalls[0]) => {
        if (!authUser) {
            toast({
                variant: 'destructive',
                title: 'Giriş gerekli',
                description: 'Yardım için giriş yapmalısınız.',
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
                title: 'Yardım Talebi Alındı',
                description: `"${call.details}" için yardım talebiniz onaylandı. Koordinasyon ekibi sizinle iletişime geçecek.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Gönderilemedi',
                description: 'Yardım talebiniz gönderilemedi. Lütfen tekrar deneyin.',
            });
        }
    };

  return (
    <div className="min-h-full bg-secondary/30 animate-in fade-in-0 flex flex-col">
        <div className="px-4 sm:px-6 pt-6 pb-3 space-y-1 shrink-0">
            <h1 className="text-3xl sm:text-4xl font-black font-headline tracking-tighter">Acil Durum</h1>
            <p className="text-muted-foreground text-sm font-medium">Topluluğun gücüyle hayat kurtar.</p>
        </div>

        <div className="px-4">
            <Tabs defaultValue="report" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1.5 h-14 rounded-3xl backdrop-blur-xl shrink-0">
                    <TabsTrigger value="report" className="rounded-2xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">
                        Bildirimde Bulun
                    </TabsTrigger>
                    <TabsTrigger value="calls" className="rounded-2xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">
                        Çağrılar & Kayıtlar
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
                            <h3 className="text-base font-bold">Aktif Acil Çağrılar</h3>
                            <Badge variant="outline" className="rounded-full bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold uppercase">Canlı</Badge>
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
                                            Yardım Et
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {activeCalls.length === 0 && (
                                <div className="text-center py-16 bg-white/5 rounded-[2rem] border-2 border-dashed border-muted-foreground/20">
                                    <p className="text-sm font-medium text-muted-foreground">Şu anda aktif bir acil çağrı bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-base font-bold px-1">Geçmiş Başvurularım</h3>
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
                                <p className="text-center text-xs text-muted-foreground py-8 italic">Geçmişte bir acil durum başvurunuz bulunmuyor.</p>
                            )}
                        </div>
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
                    <span className="font-bold text-red-400 uppercase tracking-widest mr-1">YASAL UYARI:</span>
                    Sadece gerçekten acil durumlarda kullanın. Asılsız bildirimler yasal sorumluluk ve cezai yaptırım doğurur. Konum ve iletişim bilgileriniz paylaşılacaktır.
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
            <Label htmlFor="hospital">Hastane Adı</Label>
            <div className="flex gap-2">
                <Input
                    id="hospital"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(false); }}
                    placeholder="Örn: Ankara Şehir Hastanesi"
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
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bilgileri Getir'}
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
                <p className="text-xs text-muted-foreground px-1">Sonuç yok. Yazıyı kontrol et veya elle yaz.</p>
            )}
        </div>
    );
}
