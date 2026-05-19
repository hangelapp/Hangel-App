
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Instagram, Linkedin, Youtube, ArrowLeft, MapPin, Palette, FileText, X, Save, Building2, Users, Loader2, ShieldAlert } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { countryPhoneCodes, sportsFederations, neighborhoodsData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre'];
const allSdgs = [
    '1. Yoksulluğa Son',
    '2. Açlığa Son',
    '3. Sağlıklı ve Kaliteli Yaşam',
    '4. Nitelikli Eğitim',
    '5. Toplumsal Cinsiyet Eşitliği',
    '6. Temiz Su ve Sanitasyon',
    '7. Erişilebilir ve Temiz Enerji',
    '8. İnsana Yakışır İş ve Ekonomik Büyüme',
    '9. Sanayi, Yenilikçilik ve Altyapı',
    '10. Eşitsizliklerin Azaltılması',
    '11. Sürdürülebilir Şehirler ve Topluluklar',
    '12. Sorumlu Üretim ve Tüketim',
    '13. İklim Eylemi',
    '14. Sudaki Yaşam',
    '15. Karasal Yaşam',
    '16. Barış, Adalet ve Güçlü Kurumlar',
    '17. Amaçlar için Ortaklıklar'
];
const allMemberships = ['Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool', 'HelpSteps', 'Candid'];
const years = Array.from({ length: 2025 - 1900 }, (_, i) => (2024 - i).toString());

type EntityKind = 'ngo' | 'brand' | 'club';

interface EntityDoc {
    id: string;
    name?: string;
    shortName?: string;
    adminUserId?: string;
    ngoType?: string;
    foundedYear?: string;
    economicEntity?: string;
    purpose?: string;
    about?: string;
    sportsFederations?: string[];
    beneficiaries?: string[];
    sdgs?: string[];
    memberships?: string[];
    address?: {
        country?: string;
        city?: string;
        district?: string;
        neighborhood?: string;
        street?: string;
    };
    contact?: {
        email?: string;
        phoneCountryCode?: string;
        phone?: string;
    };
    socialMedia?: {
        instagram?: string;
        twitter?: string;
        linkedin?: string;
        youtube?: string;
    };
    files?: {
        logo?: string;
        activityCertificate?: string;
        charter?: string;
    };
    representative?: {
        fullName?: string;
        title?: string;
        email?: string;
    };
}

interface UserDocData {
    id: string;
    managedNgoId?: string;
    managedBrandId?: string;
    managedClubId?: string;
}

const FileUpload = ({label, currentFile, required}: {label: string, currentFile?: string, required?: boolean}) => (
    <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label} {required && "*"}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20">
            <input id={`${label}-upload`} type="file" className="hidden" required={required && !currentFile} />
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5">
                <label htmlFor={`${label}-upload`} className="cursor-pointer font-bold"><Upload className="mr-2 h-4 w-4" />{currentFile ? 'Değiştir' : 'Belge Seç'}</label>
            </Button>
            <div className="flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{currentFile ? `Mevcut: ${currentFile}` : "Henüz dosya yüklenmedi."}</p>
            </div>
        </div>
    </div>
)

const CheckboxGroup = ({ title, options, values, onChange }: { title: string, options: string[], values: string[], onChange: (next: string[]) => void }) => {
    return (
        <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{title}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border p-4 bg-background">
                {options.map(option => {
                    const id = `${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`;
                    const checked = values.includes(option);
                    return (
                      <div key={option} className="flex items-center gap-2">
                          <Checkbox
                              id={id}
                              checked={checked}
                              onCheckedChange={(c) => {
                                  if (c) onChange([...values, option]);
                                  else onChange(values.filter(v => v !== option));
                              }}
                          />
                          <Label htmlFor={id} className="text-xs font-medium cursor-pointer leading-none">{option}</Label>
                      </div>
                    );
                })}
            </div>
        </div>
    )
}

export default function ManageProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  // 1) Try to find entities admin'd by current user
  const adminNgosQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminBrandsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminClubsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );

  const { data: adminNgos, isLoading: ngosLoading } = useCollection<EntityDoc>(adminNgosQ);
  const { data: adminBrands, isLoading: brandsLoading } = useCollection<EntityDoc>(adminBrandsQ);
  const { data: adminClubs, isLoading: clubsLoading } = useCollection<EntityDoc>(adminClubsQ);

  // 2) Fallback through user.managedNgoId / managedBrandId / managedClubId
  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData } = useDoc<UserDocData>(userDocRef);

  const fallbackNgoRef = useMemoFirebase(
    () => (firestore && userData?.managedNgoId ? doc(firestore, COLLECTIONS.ngos, userData.managedNgoId) : null),
    [firestore, userData?.managedNgoId],
  );
  const fallbackBrandRef = useMemoFirebase(
    () => (firestore && userData?.managedBrandId ? doc(firestore, COLLECTIONS.brands, userData.managedBrandId) : null),
    [firestore, userData?.managedBrandId],
  );
  const fallbackClubRef = useMemoFirebase(
    () => (firestore && userData?.managedClubId ? doc(firestore, COLLECTIONS.clubs, userData.managedClubId) : null),
    [firestore, userData?.managedClubId],
  );
  const { data: fallbackNgo } = useDoc<EntityDoc>(fallbackNgoRef);
  const { data: fallbackBrand } = useDoc<EntityDoc>(fallbackBrandRef);
  const { data: fallbackClub } = useDoc<EntityDoc>(fallbackClubRef);

  // Last resort: try user uid as ngo doc id (common convention)
  const selfNgoRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.ngos, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: selfNgo } = useDoc<EntityDoc>(selfNgoRef);

  const activeEntity = useMemo<{ kind: EntityKind; data: EntityDoc } | null>(() => {
    const ngo = (adminNgos && adminNgos[0]) || fallbackNgo || selfNgo;
    if (ngo?.id) return { kind: 'ngo', data: ngo };
    const brand = (adminBrands && adminBrands[0]) || fallbackBrand;
    if (brand?.id) return { kind: 'brand', data: brand };
    const club = (adminClubs && adminClubs[0]) || fallbackClub;
    if (club?.id) return { kind: 'club', data: club };
    return null;
  }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub, selfNgo]);

  const initialLoading = ngosLoading || brandsLoading || clubsLoading;

  // -------- Form state (initialized empty; hydrated from Firestore) --------
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [ngoType, setNgoType] = useState('dernek');
  const [foundedYear, setFoundedYear] = useState('');
  const [economicEntity, setEconomicEntity] = useState('yok');
  const [purpose, setPurpose] = useState('both');
  const [aboutText, setAboutText] = useState('');
  const ABOUT_MAX_LENGTH = 1000;
  const [selectedFeds, setSelectedFeds] = useState<string[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<string[]>([]);
  const [sdgs, setSdgs] = useState<string[]>([]);
  const [memberships, setMemberships] = useState<string[]>([]);
  const [country, setCountry] = useState('Türkiye');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('90');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [youtube, setYoutube] = useState('');
  const [logoFile, setLogoFile] = useState<string | undefined>(undefined);
  const [activityCertificate, setActivityCertificate] = useState<string | undefined>(undefined);
  const [charterFile, setCharterFile] = useState<string | undefined>(undefined);
  const [repFullName, setRepFullName] = useState('');
  const [repTitle, setRepTitle] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isTurkey = country === 'Türkiye';

  // Türkiye il/ilçe/mahalle options — memoized for perf (large lists)
  const countryOptions = useMemo(() => ['Türkiye', 'KKTC (Kuzey Kıbrıs)', 'Diğer'], []);

  const cityOptions = useMemo<string[]>(
    () => Object.keys(neighborhoodsData).sort((a, b) => a.localeCompare(b, 'tr')),
    [],
  );

  const districtOptions = useMemo<string[]>(() => {
    if (!city || !neighborhoodsData[city]) return [];
    return Object.keys(neighborhoodsData[city]).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [city]);

  const neighborhoodOptions = useMemo<string[]>(() => {
    if (!city || !district) return [];
    const list = neighborhoodsData[city]?.[district];
    if (!list) return [];
    return list.slice().sort((a, b) => a.localeCompare(b, 'tr'));
  }, [city, district]);

  // Hydrate form state when entity loads
  useEffect(() => {
    if (!activeEntity) return;
    const d = activeEntity.data;
    setName(d.name || '');
    setShortName(d.shortName || '');
    setNgoType(d.ngoType || 'dernek');
    setFoundedYear(d.foundedYear || '');
    setEconomicEntity(d.economicEntity || 'yok');
    setPurpose(d.purpose || 'both');
    setAboutText(d.about || '');
    setSelectedFeds(d.sportsFederations || []);
    setBeneficiaries(d.beneficiaries || []);
    setSdgs(d.sdgs || []);
    setMemberships(d.memberships || []);
    setCountry(d.address?.country || 'Türkiye');
    setCity(d.address?.city || '');
    setDistrict(d.address?.district || '');
    setNeighborhood(d.address?.neighborhood || '');
    setStreet((d.address as { street?: string } | undefined)?.street || '');
    setEmail(d.contact?.email || '');
    setPhoneCode(d.contact?.phoneCountryCode || '90');
    setPhone(d.contact?.phone || '');
    setInstagram(d.socialMedia?.instagram || '');
    setTwitter(d.socialMedia?.twitter || '');
    setLinkedin(d.socialMedia?.linkedin || '');
    setYoutube(d.socialMedia?.youtube || '');
    setLogoFile(d.files?.logo);
    setActivityCertificate(d.files?.activityCertificate);
    setCharterFile(d.files?.charter);
    setRepFullName(d.representative?.fullName || '');
    setRepTitle(d.representative?.title || '');
    setRepEmail(d.representative?.email || '');
  }, [activeEntity]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeEntity) {
        toast({ variant: 'destructive', title: 'Varlık bulunamadı', description: 'Yönettiğiniz bir kuruluş bulunamadı.' });
        return;
      }
      setIsSaving(true);
      try {
        const collectionName = activeEntity.kind === 'ngo' ? 'ngos' : activeEntity.kind === 'brand' ? 'brands' : 'clubs';
        await updateDoc(doc(firestore, collectionName, activeEntity.data.id), {
          name,
          shortName,
          ngoType,
          foundedYear,
          economicEntity,
          purpose,
          about: aboutText,
          sportsFederations: selectedFeds,
          beneficiaries,
          sdgs,
          memberships,
          address: { country, city, district, neighborhood, street },
          contact: { email, phoneCountryCode: phoneCode, phone },
          socialMedia: { instagram, twitter, linkedin, youtube },
          representative: { fullName: repFullName, title: repTitle, email: repEmail },
          updatedAt: new Date().toISOString(),
        });
        toast({ title: 'Değişiklikler Kaydedildi', description: 'Kuruluş profiliniz başarıyla güncellendi.' });
      } catch (err) {
        console.error('Profile save failed:', err);
        const e2 = err as { code?: string; message?: string };
        const description = e2?.code === 'permission-denied'
          ? 'Bu kuruluşu güncelleme yetkiniz yok. Hesabınız bu kuruluşun yöneticisi olarak atanmamış olabilir; lütfen Hangel ekibi ile iletişime geçin.'
          : e2?.code === 'not-found'
            ? 'Kuruluş kaydı bulunamadı. Sayfayı yenileyip tekrar deneyin.'
            : (e2?.message || 'Beklenmeyen bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
        toast({ variant: 'destructive', title: 'Kaydedilemedi', description });
      } finally {
        setIsSaving(false);
      }
  };

  const toggleFed = (fed: string) => {
    if (selectedFeds.includes(fed)) {
        setSelectedFeds(selectedFeds.filter(f => f !== fed));
    } else if (selectedFeds.length < 3) {
        setSelectedFeds([...selectedFeds, fed]);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeEntity) {
    return (
      <div className="space-y-6 p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline">Profili Güncelle</h1>
            <p className="text-muted-foreground text-sm">Yönettiğiniz varlığı buradan düzenleyin.</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Yönetici olduğunuz bir varlık bulunamadı.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Profil oluşturulduktan sonra bilgileri buradan güncelleyebilirsiniz.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entityKindLabel = activeEntity.kind === 'ngo' ? 'STK' : activeEntity.kind === 'brand' ? 'Marka' : 'Kulüp';

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">{entityKindLabel} Profili Güncelle</h1>
                <p className="text-muted-foreground text-sm">
                  <span className="font-semibold text-foreground">{name || activeEntity.data.name || activeEntity.data.id}</span>
                  <span className="mx-2 text-muted-foreground/40">·</span>
                  Platformda görünen bilgilerinizi yönetin.
                </p>
            </div>
          </div>
          <Button onClick={handleSave} size="sm" className="shadow-lg" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Kaydet
          </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Kuruluş Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {activeEntity.kind === 'ngo' && (
              <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                  <Select required onValueChange={setNgoType} value={ngoType}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="dernek">Dernek</SelectItem>
                          <SelectItem value="vakif">Vakıf</SelectItem>
                          <SelectItem value="spor-kulubu">Spor Kulübü</SelectItem>
                          <SelectItem value="ozel-izinli">Özel İzinli</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
            )}

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Tam Adı</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Kısa Adı</Label>
                    <Input value={shortName} onChange={(e) => setShortName(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Yılı</Label>
                    <Select value={foundedYear} onValueChange={setFoundedYear}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Yıl seçiniz..." /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {activeEntity.kind === 'ngo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İktisadi İşletme Durumu</Label>
                      <Select value={economicEntity} onValueChange={setEconomicEntity}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="var">Var</SelectItem>
                              <SelectItem value="yok">Yok</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kullanım Amacı</Label>
                      <Select value={purpose} onValueChange={setPurpose}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="donation">Bağış toplamak</SelectItem>
                              <SelectItem value="volunteer">Gönüllülük ilanı vermek</SelectItem>
                              <SelectItem value="both">Bağış ve Gönüllülük ilanı vermek</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
            )}

            {ngoType === 'spor-kulubu' && (
                <div className="space-y-4 p-4 border rounded-[2rem] bg-primary/5 border-primary/10 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Kayıt Olduğunuz Federasyonlar</Label>
                    <Select onValueChange={toggleFed}>
                        <SelectTrigger className="h-11 rounded-xl bg-white shadow-sm"><SelectValue placeholder="Federasyon ekleyin..." /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {sportsFederations.map(fed => <SelectItem key={fed} value={fed}>{fed}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                        {selectedFeds.map(fed => (
                            <Badge key={fed} className="bg-white text-foreground border shadow-sm px-3 py-1.5 rounded-xl gap-2 h-auto flex items-center">
                                <span className="text-[11px] font-medium">{fed}</span>
                                <button type="button" onClick={() => toggleFed(fed)}><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Hakkında</Label>
                    <span className={cn("text-[10px] font-bold text-muted-foreground")}>{aboutText.length} / {ABOUT_MAX_LENGTH}</span>
                </div>
                <Textarea
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    maxLength={ABOUT_MAX_LENGTH}
                    className="min-h-[120px] rounded-2xl"
                    placeholder="Kuruluşunuzu kısaca tanıtın..."
                />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8">
            <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} values={beneficiaries} onChange={setBeneficiaries} />
            <CheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri (SKA)" options={allSdgs} values={sdgs} onChange={setSdgs} />
            <CheckboxGroup title="Üye Olunan Platformlar" options={allMemberships} values={memberships} onChange={setMemberships} />
        </div>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Adres & İletişim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ülke</Label>
                    <Select value={country || 'Türkiye'} onValueChange={(val) => { setCountry(val); setCity(''); setDistrict(''); setNeighborhood(''); }}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Türkiye" /></SelectTrigger>
                        <SelectContent>
                            {countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İl</Label>
                        {isTurkey ? (
                            <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                <SelectContent className="max-h-72">{cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Şehir / Eyalet" className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İlçe</Label>
                        {isTurkey ? (
                            <Select
                                value={district}
                                onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }}
                                disabled={!city || districtOptions.length === 0}
                            >
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder={!city ? 'Önce il seçin' : 'İlçe seçin...'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="İlçe / Bölge" className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mahalle</Label>
                        {isTurkey ? (
                            <Select
                                value={neighborhood}
                                onValueChange={setNeighborhood}
                                disabled={!district || neighborhoodOptions.length === 0}
                            >
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder={!district ? 'Önce ilçe seçin' : 'Mahalle seçin...'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    {neighborhoodOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Mahalle" className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sokak / Açık Adres</Label>
                        <Input
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            placeholder="Sokak, kapı no..."
                            className="h-11 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal E-posta</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal Telefon</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <Select value={phoneCode} onValueChange={setPhoneCode}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{countryPhoneCodes.map(code => <SelectItem key={code} value={code}>+{code}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl flex-1" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Sosyal Medya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {[
                    { label: 'Instagram', icon: Instagram, prefix: 'instagram.com/', value: instagram, set: setInstagram },
                    { label: 'X (Twitter)', icon: XIcon, prefix: 'x.com/', value: twitter, set: setTwitter },
                    { label: 'LinkedIn', icon: Linkedin, prefix: 'linkedin.com/company/', value: linkedin, set: setLinkedin },
                    { label: 'YouTube', icon: Youtube, prefix: 'youtube.com/@', value: youtube, set: setYoutube },
                ].map((social) => (
                    <div key={social.label} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{social.label}</Label>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-muted rounded-lg"><social.icon className="h-4 w-4 text-muted-foreground" /></div>
                            <Input value={social.value} onChange={(e) => social.set(e.target.value)} placeholder={social.prefix + "kullaniciadi"} className="h-11 rounded-xl" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Yasal Belgeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <FileUpload label="Kuruluş Logosu (PNG/JPG)" currentFile={logoFile} required={true} />
             <FileUpload label="Faaliyet Belgesi (PNG/PDF)" currentFile={activityCertificate} required={true} />
             <FileUpload label={ngoType === 'vakif' ? 'Vakıf Senedi (PDF)' : 'Tüzük (PDF)'} currentFile={charterFile} required={true} />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Yetkili Kişi Bilgileri</CardTitle>
                <CardDescription>Kuruluşu platformda temsil eden ana yetkili bilgileri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ad Soyad</Label>
                    <Input value={repFullName} onChange={(e) => setRepFullName(e.target.value)} className="h-11 rounded-xl bg-white" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Görevi</Label>
                    <Input value={repTitle} onChange={(e) => setRepTitle(e.target.value)} className="h-11 rounded-xl bg-white" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Şahsi E-posta</Label>
                    <Input value={repEmail} onChange={(e) => setRepEmail(e.target.value)} className="h-11 rounded-xl bg-white" />
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-10">
          <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
          <Button type="submit" className="px-10 font-bold" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Tümünü Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
}
