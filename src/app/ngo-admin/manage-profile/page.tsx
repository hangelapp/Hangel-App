
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Instagram, Linkedin, Youtube, ArrowLeft, MapPin, Palette, FileText, X, Save, Building2, Users, Loader2, ShieldAlert, Eye } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { countryPhoneCodes, sportsFederations, neighborhoodsData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { useActiveEntity, useActiveEntityDoc, entityPossessive } from '@/app/ngo-admin/active-entity-context';
import { brandSectorOptions, ngoBeneficiaryOptions, ngoPlatformOptions } from '@/app/login/selection/_components/shared';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

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

// Faydalanıcı ve platform listeleri kayıt formuyla AYNI kaynaktan gelir
// (ngoBeneficiaryOptions / ngoPlatformOptions) — aksi halde kayıtta seçilen ama
// bu kısa listede olmayan değerler edit ekranında checkbox'ı olmadığı için
// işaretli görünmezdi.
const allBeneficiaries = ngoBeneficiaryOptions;
const allMemberships = ngoPlatformOptions;
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
const years = Array.from({ length: 2025 - 1900 }, (_, i) => (2024 - i).toString());

type EntityKind = 'ngo' | 'brand' | 'club';

interface EntityDoc {
    id: string;
    name?: string;
    avatarUrl?: string;
    logoUrl?: string;
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
        website?: string;
        social?: {
            instagram?: string;
            twitter?: string;
            linkedin?: string;
            facebook?: string;
            youtube?: string;
        };
        address?: {
            country?: string;
            city?: string;
            district?: string;
            neighborhood?: string;
            fullAddress?: string;
            doorNo?: string;
        };
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

const FileUpload = ({ label, currentFile, required, accept, uploading, onSelect }: {
    label: string; currentFile?: string; required?: boolean; accept?: string; uploading?: boolean; onSelect: (file: File) => void;
}) => {
    const { t } = useTranslation();
    return (
    <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label} {required && "*"}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20">
            <input
                id={`${label}-upload`}
                type="file"
                className="hidden"
                accept={accept}
                onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = ''; }}
            />
            <Button asChild variant="outline" size="sm" disabled={uploading} className="rounded-xl border-primary/20 hover:bg-primary/5">
                <label htmlFor={`${label}-upload`} className="cursor-pointer font-bold">
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {currentFile ? t('ngo_admin_manage_profile.fileBtnChange') : t('ngo_admin_manage_profile.fileBtnSelect')}
                </label>
            </Button>
            <div className="flex-1 min-w-0">
                {currentFile ? (
                    <a href={currentFile} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-700 font-bold inline-flex items-center gap-1 hover:underline">
                        <FileText className="h-3.5 w-3.5" /> {t('ngo_admin_manage_profile.fileViewLink')}
                    </a>
                ) : (
                    <p className="text-[10px] text-muted-foreground leading-tight">{required ? t('ngo_admin_manage_profile.fileRequiredEmpty') : t('ngo_admin_manage_profile.fileOptionalEmpty')}</p>
                )}
            </div>
        </div>
    </div>
    );
};

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
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  // Aktif kurum (ActiveEntityProvider) — banner ve sayfa içeriği tek kaynak.
  // Eski adminUserId / managedNgoId / selfNgo zinciri çoklu-kurum adminlerde
  // hep ilk STK'yı seçiyordu; artık layout banner'ı hangi kurumu gösteriyorsa
  // form da o kurumun verisini yükler.
  const { id: activeIdFromCtx, kind: activeKind, subType: activeSubType, isLoading: activeLoading } = useActiveEntity();
  const { data: activeDoc } = useActiveEntityDoc<EntityDoc>();

  const activeEntity = useMemo<{ kind: EntityKind; data: EntityDoc } | null>(() => {
    if (!activeIdFromCtx || !activeKind || !activeDoc) return null;
    return { kind: activeKind, data: activeDoc };
  }, [activeIdFromCtx, activeKind, activeDoc]);

  const initialLoading = activeLoading;

  // -------- Form state (initialized empty; hydrated from Firestore) --------
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [shortLink, setShortLink] = useState('');
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
  const [sector, setSector] = useState(''); // Marka: faaliyet sektörü
  const [university, setUniversity] = useState(''); // Kulüp: üniversite/bağlı okul
  // Marka: bağış kategorileri ve oranları (kayıt formuyla aynı yapı).
  const [donationCategories, setDonationCategories] = useState<{ id: string; category: string; rate: string }[]>([{ id: '1', category: '', rate: '' }]);
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
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);
  // Kaydetmeden önce inline doğrulama hataları (alan bazlı). Boş = hata yok.
  const [errors, setErrors] = useState<{ name?: string; email?: string; repEmail?: string }>({});
  // Formu kurum başına BİR kez doldur — canlı doc her snapshot'ta güncellenince
  // effect yeniden çalışıp kullanıcının girdiği değerleri ezmesin (adres bug'ı).
  const hydratedIdRef = useRef<string | null>(null);

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
    // Aynı kurum için tekrar doldurma → kullanıcı düzenlemeleri korunur.
    if (hydratedIdRef.current === activeEntity.data.id) return;
    hydratedIdRef.current = activeEntity.data.id;
    const d = activeEntity.data;
    setName(d.name || '');
    setShortName(d.shortName || '');
    setShortLink(((d as { shortLink?: string }).shortLink) || '');
    setNgoType(d.ngoType || 'dernek');
    setFoundedYear(d.foundedYear || '');
    setEconomicEntity(d.economicEntity || 'yok');
    setPurpose(d.purpose || 'both');
    setAboutText(d.about || '');
    setSelectedFeds(d.sportsFederations || []);
    setBeneficiaries(d.beneficiaries || []);
    setSdgs(d.sdgs || []);
    setMemberships(d.memberships || []);
    setSector((d as { sector?: string }).sector || '');
    setUniversity((d as { university?: string; clubAffiliation?: string }).university || (d as { clubAffiliation?: string }).clubAffiliation || '');
    const dcs = (d as { donationCategories?: { id?: string; category?: string; rate?: string }[] }).donationCategories;
    setDonationCategories(Array.isArray(dcs) && dcs.length > 0
      ? dcs.map((x, i) => ({ id: x.id || String(i + 1), category: x.category || '', rate: x.rate || '' }))
      : [{ id: '1', category: '', rate: '' }]);
    // Adres/sosyal kanonik konum: `contact.address` / `contact.social`
    // (super-admin edit + tüm detay sayfaları bunları okur). Eski top-level
    // `address`/`socialMedia` yalnızca geriye-dönük fallback.
    setCountry(d.contact?.address?.country || d.address?.country || 'Türkiye');
    setCity(d.contact?.address?.city || d.address?.city || '');
    setDistrict(d.contact?.address?.district || d.address?.district || '');
    setNeighborhood(d.contact?.address?.neighborhood || d.address?.neighborhood || '');
    setStreet(d.contact?.address?.fullAddress || (d.address as { street?: string } | undefined)?.street || '');
    setEmail(d.contact?.email || '');
    setPhoneCode(d.contact?.phoneCountryCode || '90');
    setPhone(d.contact?.phone || '');
    setInstagram(d.contact?.social?.instagram || d.socialMedia?.instagram || '');
    setTwitter(d.contact?.social?.twitter || d.socialMedia?.twitter || '');
    setLinkedin(d.contact?.social?.linkedin || d.socialMedia?.linkedin || '');
    setYoutube(d.contact?.social?.youtube || d.socialMedia?.youtube || '');
    // Logo gösterim alanı kurum tipine göre değişir: NGO/club → `avatarUrl`,
    // brand → `logoUrl`, eski → `files.logo`. Hangisi doluysa onu göster.
    setLogoFile(d.avatarUrl || d.logoUrl || d.files?.logo);
    setActivityCertificate(d.files?.activityCertificate);
    setCharterFile(d.files?.charter);
    setRepFullName(d.representative?.fullName || '');
    setRepTitle(d.representative?.title || '');
    setRepEmail(d.representative?.email || '');
  }, [activeEntity]);

  const handleFileUpload = async (file: File, kind: 'logo' | 'activityCertificate' | 'charter') => {
      if (!activeEntity) {
        toast({ variant: 'destructive', title: t('ngo_admin_manage_profile.toastEntityNotFound') });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: 'destructive', title: t('ngo_admin_manage_profile.toastFileTooLarge'), description: t('ngo_admin_manage_profile.toastFileTooLargeDesc') });
        return;
      }
      setUploadingKind(kind);
      try {
        const storage = getStorage();
        const folder = activeEntity.kind === 'ngo' ? 'ngos' : activeEntity.kind === 'brand' ? 'brands' : 'clubs';
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folder}/${activeEntity.data.id}/${kind}-${Date.now()}-${safe}`;
        const r = storageRef(storage, path);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        if (kind === 'logo') setLogoFile(url);
        else if (kind === 'activityCertificate') setActivityCertificate(url);
        else setCharterFile(url);

        // Super-admin "Arşiv" sekmesine kurum evrakı olarak ayna (best-effort).
        const docType = kind === 'logo' ? t('ngo_admin_manage_profile.docTypeLogo') : kind === 'activityCertificate' ? t('ngo_admin_manage_profile.docTypeActivity') : (ngoType === 'vakif' ? t('ngo_admin_manage_profile.docTypeVakif') : t('ngo_admin_manage_profile.docTypeCharter'));
        try {
          const token = await authUser?.getIdToken();
          if (token) {
            await fetch('/api/ngo/archive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ docType, fileUrl: url, entityType: activeEntity.kind, entityId: activeEntity.data.id, entityName: name || activeEntity.data.name || '' }),
            });
          }
        } catch { /* arşiv aynası best-effort */ }

        toast({ title: t('ngo_admin_manage_profile.toastUploaded'), description: t('ngo_admin_manage_profile.toastUploadedDesc') });
      } catch (err) {
        const e2 = err as { message?: string };
        toast({ variant: 'destructive', title: t('ngo_admin_manage_profile.toastUploadFailed'), description: e2?.message?.slice(0, 160) || t('ngo_admin_manage_profile.toastUploadFailedDesc') });
      } finally {
        setUploadingKind(null);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeEntity) {
        toast({ variant: 'destructive', title: t('ngo_admin_manage_profile.toastEntityNotFound'), description: t('ngo_admin_manage_profile.toastEntityNotFoundDesc') });
        return;
      }
      // İstemci tarafı doğrulama — geçersizse updateDoc çağrılmaz, hatalar
      // ilgili alanların altında inline gösterilir.
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const nextErrors: { name?: string; email?: string; repEmail?: string } = {};
      if (!name.trim()) {
        nextErrors.name = 'Bu alan zorunludur.';
      }
      if (email.trim() && !emailRegex.test(email.trim())) {
        nextErrors.email = 'Geçerli bir e-posta adresi girin.';
      }
      if (repEmail.trim() && !emailRegex.test(repEmail.trim())) {
        nextErrors.repEmail = 'Geçerli bir e-posta adresi girin.';
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        return;
      }
      setIsSaving(true);
      try {
        const collectionName = activeEntity.kind === 'ngo' ? COLLECTIONS.ngos : activeEntity.kind === 'brand' ? COLLECTIONS.brands : COLLECTIONS.clubs;
        await updateDoc(doc(firestore, collectionName, activeEntity.data.id), {
          name,
          shortName,
          shortLink: shortLink.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, ''),
          ngoType,
          foundedYear,
          economicEntity,
          purpose,
          about: aboutText,
          sportsFederations: selectedFeds,
          beneficiaries,
          sdgs,
          memberships,
          ...(activeEntity.kind === 'brand' ? { sector, donationCategories: donationCategories.filter(d => d.category.trim()) } : {}),
          ...(activeEntity.kind === 'club' ? { university, clubAffiliation: university } : {}),
          // KÖK NEDEN FIX: Adres + iletişim + sosyal medya KANONIK olarak
          // `contact.*` altında saklanır (super-admin edit bunu yazar, tüm detay
          // sayfaları + market bunu okur). Önceden manage-profile yanlış top-level
          // `address`/`socialMedia`'ya yazıyor ve `contact: {...}` ile tüm contact
          // objesini değiştirip mevcut `contact.social`/`contact.address`'i SİLİYORDU
          // → adres/sosyal/website güncellemeleri görünmüyor + kayboluyordu.
          // Dot-notation ile sadece ilgili nested alanları yazıyoruz (geri kalan
          // contact alanları — website, doorNo, facebook — korunur).
          'contact.email': email,
          'contact.phoneCountryCode': phoneCode,
          'contact.phone': phone,
          'contact.social.instagram': instagram || null,
          'contact.social.twitter': twitter || null,
          'contact.social.linkedin': linkedin || null,
          'contact.social.youtube': youtube || null,
          'contact.address.country': country || null,
          'contact.address.city': city || null,
          'contact.address.district': district || null,
          'contact.address.neighborhood': neighborhood || null,
          'contact.address.fullAddress': street || null,
          representative: { fullName: repFullName, title: repTitle, email: repEmail },
          // KÖK NEDEN FIX: Logo gösterim alanı kurum tipine göre farklı okunuyor —
          // NGO/club detay+kartlar `avatarUrl`, brand market `logoUrl`, eski yüzeyler
          // `files.logo`. Önceden yalnız `files.logo`'ya yazılıyordu → yüklenen logo
          // hiçbir yerde görünmüyordu ("logo yüklenmedi"). Üçüne de yaz ki her
          // yüzeyde görünsün.
          avatarUrl: logoFile ?? null,
          logoUrl: logoFile ?? null,
          'files.logo': logoFile ?? null,
          'files.activityCertificate': activityCertificate ?? null,
          'files.charter': charterFile ?? null,
          updatedAt: new Date().toISOString(),
        });
        // Şeffaflık skorunu tazele — profil (web/e-posta/telefon/adres/üyelik) ilgili
        // kriterleri otomatik karşılar; kart/liste/profildeki % anında güncellenir.
        if (activeEntity.kind === 'ngo') {
          authUser?.getIdToken?.().then((tk) => {
            if (tk) fetch('/api/ngo-admin/transparency/refresh', {
              method: 'POST',
              headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ngoId: activeEntity.data.id }),
            }).catch(() => {});
          }).catch(() => {});
        }
        toast({ title: t('ngo_admin_manage_profile.toastSaved'), description: t('ngo_admin_manage_profile.toastSavedDesc') });
      } catch (err) {
        console.error('Profile save failed:', err);
        const e2 = err as { code?: string; message?: string };
        const description = e2?.code === 'permission-denied'
          ? t('ngo_admin_manage_profile.toastPermDenied')
          : e2?.code === 'not-found'
            ? t('ngo_admin_manage_profile.toastNotFound')
            : (e2?.message || t('ngo_admin_manage_profile.toastGenericErr'));
        toast({ variant: 'destructive', title: t('ngo_admin_manage_profile.toastSaveFailed'), description });
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
          <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_manage_profile.backAria')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_manage_profile.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('ngo_admin_manage_profile.subtitle')}</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">{t('ngo_admin_manage_profile.notFoundMsg')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{t('ngo_admin_manage_profile.notFoundDesc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_manage_profile.backAria')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">{entityPossessive(activeEntity.kind, activeSubType)} {t('ngo_admin_manage_profile.headerSuffix')}</h1>
                <p className="text-muted-foreground text-sm">
                  <span className="font-semibold text-foreground">{name || activeEntity.data.name || activeEntity.data.id}</span>
                  <span className="mx-2 text-muted-foreground/40">·</span>
                  {t('ngo_admin_manage_profile.headerSub')}
                </p>
            </div>
          </div>
          <Button onClick={handleSave} size="sm" className="shadow-lg" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('ngo_admin_manage_profile.btnSave')}
          </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> {t('ngo_admin_manage_profile.orgInfoTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {activeEntity.kind === 'ngo' && (
              <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelOrgType')}</Label>
                  <Select required onValueChange={setNgoType} value={ngoType}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="dernek">{t('ngo_admin_manage_profile.orgTypeDernek')}</SelectItem>
                          <SelectItem value="vakif">{t('ngo_admin_manage_profile.orgTypeVakif')}</SelectItem>
                          <SelectItem value="spor-kulubu">{t('ngo_admin_manage_profile.orgTypeSporKulubu')}</SelectItem>
                          <SelectItem value="ozel-izinli">{t('ngo_admin_manage_profile.orgTypeOzelIzinli')}</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
            )}

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelFullName')}</Label>
                <Input value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }} className={cn("h-11 rounded-xl", errors.name && "border-destructive focus-visible:ring-destructive")} required />
                {errors.name && <p className="text-[11px] font-medium text-destructive ml-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelShortLink')}</Label>
                <div className="flex items-center rounded-xl border h-11 overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                    <span className="px-3 text-sm text-muted-foreground bg-muted/50 h-full flex items-center select-none whitespace-nowrap">hangel.org/s/</span>
                    <Input
                        value={shortLink}
                        onChange={(e) => setShortLink(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                        placeholder={t('ngo_admin_manage_profile.shortLinkPlaceholder')}
                        className="h-full border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                    />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">{t('ngo_admin_manage_profile.shortLinkHelp')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelShortName')}</Label>
                    <Input value={shortName} onChange={(e) => setShortName(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelFoundedYear')}</Label>
                    <Select value={foundedYear} onValueChange={setFoundedYear}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={t('ngo_admin_manage_profile.foundedYearPlaceholder')} /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {activeEntity.kind === 'brand' && (
              <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelSector')}</Label>
                  <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder={t('ngo_admin_manage_profile.sectorPlaceholder')} className="h-11 rounded-xl" />
              </div>
            )}

            {activeEntity.kind === 'club' && (
              <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelUniversity')}</Label>
                  <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder={t('ngo_admin_manage_profile.universityPlaceholder')} className="h-11 rounded-xl" />
              </div>
            )}

            {activeEntity.kind === 'ngo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelEconomicEntity')}</Label>
                      <Select value={economicEntity} onValueChange={setEconomicEntity}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="var">{t('ngo_admin_manage_profile.economicVar')}</SelectItem>
                              <SelectItem value="yok">{t('ngo_admin_manage_profile.economicYok')}</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelPurpose')}</Label>
                      <Select value={purpose} onValueChange={setPurpose}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="donation">{t('ngo_admin_manage_profile.purposeDonation')}</SelectItem>
                              <SelectItem value="volunteer">{t('ngo_admin_manage_profile.purposeVolunteer')}</SelectItem>
                              <SelectItem value="both">{t('ngo_admin_manage_profile.purposeBoth')}</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
            )}

            {ngoType === 'spor-kulubu' && (
                <div className="space-y-4 p-4 border rounded-[2rem] bg-primary/5 border-primary/10 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">{t('ngo_admin_manage_profile.labelFederations')}</Label>
                    <Select onValueChange={toggleFed}>
                        <SelectTrigger className="h-11 rounded-xl bg-background shadow-sm"><SelectValue placeholder={t('ngo_admin_manage_profile.federationPlaceholder')} /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {sportsFederations.map(fed => <SelectItem key={fed} value={fed}>{fed}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                        {selectedFeds.map(fed => (
                            <Badge key={fed} className="bg-card text-foreground border shadow-sm px-3 py-1.5 rounded-xl gap-2 h-auto flex items-center">
                                <span className="text-[11px] font-medium">{fed}</span>
                                <button type="button" onClick={() => toggleFed(fed)}><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelAbout')}</Label>
                    <span className={cn("text-[10px] font-bold text-muted-foreground")}>{aboutText.length} / {ABOUT_MAX_LENGTH}</span>
                </div>
                <Textarea
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    maxLength={ABOUT_MAX_LENGTH}
                    className="min-h-[120px] rounded-2xl"
                    placeholder={t('ngo_admin_manage_profile.aboutPlaceholder')}
                />
            </div>
          </CardContent>
        </Card>

        {activeEntity.kind === 'brand' && (
          <Card className="rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {t('ngo_admin_manage_profile.donationCatsTitle')}</CardTitle>
              <CardDescription>{t('ngo_admin_manage_profile.donationCatsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {donationCategories.map((dc, idx) => (
                <div key={dc.id} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1 min-w-0">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelCategory')}</Label>
                    <Select value={dc.category} onValueChange={(v) => setDonationCategories(prev => prev.map((p, i) => i === idx ? { ...p, category: v } : p))}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={t('ngo_admin_manage_profile.categoryPlaceholder')} /></SelectTrigger>
                      <SelectContent className="max-h-60">{brandSectorOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1 shrink-0">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelRate')}</Label>
                    <Input type="number" min="0" max="100" value={dc.rate} onChange={(e) => setDonationCategories(prev => prev.map((p, i) => i === idx ? { ...p, rate: e.target.value } : p))} placeholder={t('ngo_admin_manage_profile.ratePlaceholder')} className="h-11 rounded-xl" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-destructive" disabled={donationCategories.length <= 1} onClick={() => setDonationCategories(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)} aria-label={t('ngo_admin_manage_profile.removeAria')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setDonationCategories(prev => [...prev, { id: String(Date.now()), category: '', rate: '' }])}>
                {t('ngo_admin_manage_profile.btnAddCategory')}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-8">
            <CheckboxGroup title={t('ngo_admin_manage_profile.beneficiariesTitle')} options={allBeneficiaries} values={beneficiaries} onChange={setBeneficiaries} />
            <CheckboxGroup title={t('ngo_admin_manage_profile.sdgsTitle')} options={allSdgs} values={sdgs} onChange={setSdgs} />
            <CheckboxGroup title={t('ngo_admin_manage_profile.membershipsTitle')} options={allMemberships} values={memberships} onChange={setMemberships} />
        </div>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {t('ngo_admin_manage_profile.addressContactTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelCountry')}</Label>
                    <Select value={country || 'Türkiye'} onValueChange={(val) => { setCountry(val); setCity(''); setDistrict(''); setNeighborhood(''); }}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={t('ngo_admin_manage_profile.countryPlaceholder')} /></SelectTrigger>
                        <SelectContent>
                            {countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelCity')}</Label>
                        {isTurkey ? (
                            <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={t('ngo_admin_manage_profile.cityPlaceholderTr')} /></SelectTrigger>
                                <SelectContent className="max-h-72">{cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={city} onChange={e => setCity(e.target.value)} placeholder={t('ngo_admin_manage_profile.cityPlaceholderOther')} className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelDistrict')}</Label>
                        {isTurkey ? (
                            <Select
                                value={district}
                                onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }}
                                disabled={!city || districtOptions.length === 0}
                            >
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder={!city ? t('ngo_admin_manage_profile.districtPlaceholderEmpty') : t('ngo_admin_manage_profile.districtPlaceholderTr')} />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder={t('ngo_admin_manage_profile.districtPlaceholderOther')} className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelNeighborhood')}</Label>
                        {isTurkey ? (
                            <Select
                                value={neighborhood}
                                onValueChange={setNeighborhood}
                                disabled={!district || neighborhoodOptions.length === 0}
                            >
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder={!district ? t('ngo_admin_manage_profile.neighborhoodPlaceholderEmpty') : t('ngo_admin_manage_profile.neighborhoodPlaceholderTr')} />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    {neighborhoodOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder={t('ngo_admin_manage_profile.neighborhoodPlaceholderOther')} className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelStreet')}</Label>
                        <Input
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            placeholder={t('ngo_admin_manage_profile.streetPlaceholder')}
                            className="h-11 rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelCorpEmail')}</Label>
                    <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }} className={cn("h-11 rounded-xl", errors.email && "border-destructive focus-visible:ring-destructive")} />
                    {errors.email && <p className="text-[11px] font-medium text-destructive ml-1">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelCorpPhone')}</Label>
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
                <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> {t('ngo_admin_manage_profile.socialMediaTitle')}</CardTitle>
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
                            <Input value={social.value} onChange={(e) => social.set(e.target.value)} placeholder={social.prefix + t('ngo_admin_manage_profile.socialPlaceholderSuffix')} className="h-11 rounded-xl" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {t('ngo_admin_manage_profile.legalDocsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <FileUpload label={activeEntity.kind === 'brand' ? t('ngo_admin_manage_profile.logoLabelBrand') : t('ngo_admin_manage_profile.logoLabelDefault')} currentFile={logoFile} required={true}
                accept="image/png,image/jpeg,image/webp" uploading={uploadingKind === 'logo'}
                onSelect={(f) => handleFileUpload(f, 'logo')} />
             {/* Faaliyet Belgesi: STK + Öğrenci Kulübü (kulüpte okuldan alınır). Markaya sorulmaz. */}
             {activeEntity.kind !== 'brand' && (
               <FileUpload label={activeEntity.kind === 'club' ? t('ngo_admin_manage_profile.activityCertLabelClub') : t('ngo_admin_manage_profile.activityCertLabelDefault')} currentFile={activityCertificate} required={true}
                  accept=".pdf,image/png,image/jpeg" uploading={uploadingKind === 'activityCertificate'}
                  onSelect={(f) => handleFileUpload(f, 'activityCertificate')} />
             )}
             {/* Tüzük / Vakıf Senedi: yalnızca STK. */}
             {activeEntity.kind === 'ngo' && (
               <FileUpload label={ngoType === 'vakif' ? t('ngo_admin_manage_profile.charterLabelVakif') : t('ngo_admin_manage_profile.charterLabelDernek')} currentFile={charterFile} required={true}
                  accept=".pdf,image/png,image/jpeg" uploading={uploadingKind === 'charter'}
                  onSelect={(f) => handleFileUpload(f, 'charter')} />
             )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> {t('ngo_admin_manage_profile.repInfoTitle')}</CardTitle>
                <CardDescription>{t('ngo_admin_manage_profile.repInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelRepFullName')}</Label>
                    <Input value={repFullName} onChange={(e) => setRepFullName(e.target.value)} className="h-11 rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelRepTitle')}</Label>
                    <Input value={repTitle} onChange={(e) => setRepTitle(e.target.value)} className="h-11 rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('ngo_admin_manage_profile.labelRepEmail')}</Label>
                    <Input value={repEmail} onChange={(e) => { setRepEmail(e.target.value); if (errors.repEmail) setErrors(prev => ({ ...prev, repEmail: undefined })); }} className={cn("h-11 rounded-xl bg-background", errors.repEmail && "border-destructive focus-visible:ring-destructive")} />
                    {errors.repEmail && <p className="text-[11px] font-medium text-destructive ml-1">{errors.repEmail}</p>}
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-10">
          <Button type="button" variant="outline" onClick={() => router.back()}>{t('ngo_admin_manage_profile.btnCancel')}</Button>
          <Button type="submit" className="px-10 font-bold" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('ngo_admin_manage_profile.btnSaveAll')}
          </Button>
        </div>
      </form>
    </div>
  );
}
