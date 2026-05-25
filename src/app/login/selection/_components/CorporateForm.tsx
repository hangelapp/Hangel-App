'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import {
    Mail,
    Activity,
    Target,
    Upload,
    Loader2,
    Building2,
    FileText,
    Store,
    UserCircle,
    MapPin,
    School,
    Search,
    CheckCircle2,
    Phone,
    Globe,
    GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { allCountries, allSdgs, neighborhoodsData } from '@/lib/data';
import { COUNTRY_PHONE_CODES } from '@/lib/phone-codes';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { LocationFields } from '@/components/shared/location-fields';
import {
    FileUpload,
    SectionTitle,
    FormLabel,
    FormInput,
    IconInput,
    clubUniversityOptions,
    brandSectorOptions,
    ngoPlatformOptions,
    ngoBeneficiaryOptions,
    clubCategoryGroups,
    yearOptions,
} from './shared';

// CorporateForm — extracted verbatim from login/selection/page.tsx (P2-6c).
// IMPORTANT: NGO/Brand/Club branches share the same formData/agreements state,
// so they are intentionally co-located here. Do not alter the submit logic or
// the agreement gates.
export const CorporateForm = ({ initialEntity }: { initialEntity: string }) => {
    const db = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entityType, setEntityType] = useState<string>(initialEntity);

    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        orgSubType: '',
        // NGO alt türü: 'Dernek' | 'Vakif' | 'OzelIzinli' (Dernek/Vakıf/Özel İzinli)
        ngoSubType: '',
        sector: '',
        // Detaylı Faaliyet Alanı (registryDernekler doc'undan auto-fill ile gelir)
        detayliFaaliyetAlani: '',
        email: '',
        phone: '',
        phoneCountryCode: '+90',
        website: '',
        legalTitle: '',
        iban: '',
        // Banka Hesap Adı (NGO YASAL & FİNANSAL — Kütük No alanı registryNo'ya
        // taşındı, burada artık hesap sahibi adı girilir).
        bankAccountName: '',
        registryNo: '',
        country: 'Türkiye',
        city: '',
        district: '',
        neighborhood: '',
        addressLine: '',
        brandStatus: '',
        clubType: '',
        clubAffiliation: '',
        universityName: '',
        clubCategory: '',
        foundedYear: '',
        about: '',
        physicalDonationsEnabled: false,
        posRequested: false,
        authorized: { name: '', role: '', email: '', phone: '', phoneCountryCode: '+90' },
        affiliateId: '',
        trackingLink: '',
        pixelScript: '',
        // CLUB-specific yeni alanlar
        clubShortDescription: '',
        clubEventFrequency: '', // Haftalık / Aylık / Dönemsel / Düzensiz
        clubContactPhone: '',
        clubContactPhoneCountryCode: '+90',
        clubContactEmail: '',
        clubSocialInstagram: '',
        clubSocialLinkedin: '',
        clubSocialTwitter: '',
        clubSocialWebsite: '',
        clubAdvisorName: '',
        clubAdvisorEmail: '',
        clubAdvisorPhone: '',
        clubAdvisorPhoneCountryCode: '+90',
        clubPresidentName: '',
        clubPresidentPhone: '',
        clubPresidentPhoneCountryCode: '+90',
        clubPresidentEmail: '',
        // NGO ek alanlar (kullanıcı talebi)
        doorNo: '',
        instagram: '',
        twitter: '',
        linkedin: '',
        kamuYarariStatusu: false,
        authorizedPhone: '',
        authorizedEmail: '',
        // Özel İzinli alanları
        ozelIzinTarihi: '',
        ozelIzinBitisTarihi: '',
        ozelIzinVerenValilik: '',
        ozelIzinAmaci: '',
        ozelIzinAmaciDiger: '',
        authorizedRelation: '', // 'görevi' yerine 'yakınlığı'
    });
    // Diğer sosyal medya platformları (+Ekle ile)
    const [otherSocials, setOtherSocials] = useState<{ platform: string; url: string }[]>([]);
    const ABOUT_MAX = 1000;
    // Özel İzinli: İzin amaçları (multi-select). FAYDALANICILARINIZ gibi.
    const [selectedIzinAmaclari, setSelectedIzinAmaclari] = useState<string[]>([]);
    const OZEL_IZIN_AMAC_OPTIONS = ['Yardım Toplama', 'Eğitim Faaliyeti', 'Sosyal Etkinlik', 'Afet Yardımı', 'Sağlık Destek', 'Kültürel Etkinlik', 'Diğer'];
    // Sosyal medya platform önerileri (diğer platformlar için)
    const SOCIAL_PLATFORM_OPTIONS = ['TikTok', 'YouTube', 'Facebook', 'Snapchat', 'Threads', 'Pinterest', 'Mastodon', 'Behance', 'Telegram', 'WhatsApp Kanalı', 'Diğer'];

    // Türkiye il plaka kodları — kütük no'nun ilk 2 hanesi il plaka kodudur.
    // Auto-fill: kütük lookup başarılıysa city alanını da plate code'dan doldur.
    const TR_IL_PLATES: Record<string, string> = {
        '01': 'Adana', '02': 'Adıyaman', '03': 'Afyonkarahisar', '04': 'Ağrı', '05': 'Amasya',
        '06': 'Ankara', '07': 'Antalya', '08': 'Artvin', '09': 'Aydın', '10': 'Balıkesir',
        '11': 'Bilecik', '12': 'Bingöl', '13': 'Bitlis', '14': 'Bolu', '15': 'Burdur',
        '16': 'Bursa', '17': 'Çanakkale', '18': 'Çankırı', '19': 'Çorum', '20': 'Denizli',
        '21': 'Diyarbakır', '22': 'Edirne', '23': 'Elazığ', '24': 'Erzincan', '25': 'Erzurum',
        '26': 'Eskişehir', '27': 'Gaziantep', '28': 'Giresun', '29': 'Gümüşhane', '30': 'Hakkari',
        '31': 'Hatay', '32': 'Isparta', '33': 'Mersin', '34': 'İstanbul', '35': 'İzmir',
        '36': 'Kars', '37': 'Kastamonu', '38': 'Kayseri', '39': 'Kırklareli', '40': 'Kırşehir',
        '41': 'Kocaeli', '42': 'Konya', '43': 'Kütahya', '44': 'Malatya', '45': 'Manisa',
        '46': 'Kahramanmaraş', '47': 'Mardin', '48': 'Muğla', '49': 'Muş', '50': 'Nevşehir',
        '51': 'Niğde', '52': 'Ordu', '53': 'Rize', '54': 'Sakarya', '55': 'Samsun',
        '56': 'Siirt', '57': 'Sinop', '58': 'Sivas', '59': 'Tekirdağ', '60': 'Tokat',
        '61': 'Trabzon', '62': 'Tunceli', '63': 'Şanlıurfa', '64': 'Uşak', '65': 'Van',
        '66': 'Yozgat', '67': 'Zonguldak', '68': 'Aksaray', '69': 'Bayburt', '70': 'Karaman',
        '71': 'Kırıkkale', '72': 'Batman', '73': 'Şırnak', '74': 'Bartın', '75': 'Ardahan',
        '76': 'Iğdır', '77': 'Yalova', '78': 'Karabük', '79': 'Kilis', '80': 'Osmaniye',
        '81': 'Düzce',
    };

    // Kütük no auto-format: kullanıcı sadece rakam girer (e.g. "34262102"),
    // sistem otomatik tire ekler → "34-262-102" (XX-XXX-XXX standardı).
    // Lookup için tire'lı format kullanılır (registryDernekler doc id = "06-154-120").
    const formatKutukNo = (raw: string): string => {
        const digits = raw.replace(/\D/g, '').slice(0, 8); // max 8 digit: 2+3+3
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    };

    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
    const [selectedSdgs, setSelectedSdgs] = useState<string[]>([]);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
    const [selectedClubCategories, setSelectedClubCategories] = useState<string[]>([]);
    const [donationCategories, _setDonationCategories] = useState([{ id: '1', category: '', rate: '' }]);
    const [agreements, setAgreements] = useState({
        userAgreement: false,
        kvkk: false,
        privacy: false,
        cookies: false,
        ngoMembership: false,
        transparency: false,
        brandMembership: false,
        affiliate: false,
        clubAgreement: false,
    });
    const baseAgreementsAccepted =
        agreements.userAgreement && agreements.kvkk && agreements.privacy && agreements.cookies;
    const ngoAgreementsAccepted =
        baseAgreementsAccepted && agreements.ngoMembership && agreements.transparency;
    const brandAgreementsAccepted =
        baseAgreementsAccepted && agreements.brandMembership && agreements.affiliate;
    const clubAgreementsAccepted =
        baseAgreementsAccepted && agreements.clubAgreement;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // /my-applications sayfası type='Kulüpler' / 'STK' / 'Marka' filtresiyle çalışır.
            // Onlara uyacak şekilde entityType'tan tab type'ı türetiyoruz.
            const tabType =
                entityType === 'NGO' ? 'STK' :
                entityType === 'BRAND' ? 'Marka' :
                entityType === 'CLUB' ? 'Kulüpler' : 'Kurumsal Başvuru';

            await addDoc(collection(db, COLLECTIONS.applications), {
                ...formData,
                entityType,
                type: tabType,
                title: formData.name || 'Kurumsal Başvuru',
                org: formData.name || '',
                location: [formData.city, formData.country].filter(Boolean).join(', ') || '',
                userId: authUser?.uid || null, // Login'liyse /my-applications'da görünür
                userName: authUser?.displayName || formData.authorized?.name || '',
                userEmail: authUser?.email || formData.email || '',
                selectedBeneficiaries,
                selectedSdgs,
                selectedNetworks,
                selectedClubCategories,
                categories: selectedClubCategories,
                donationCategories,
                otherSocials,
                selectedIzinAmaclari,
                status: 'Beklemede',
                createdAt: serverTimestamp(),
            });
            toast({ title: "Başvuru Alındı", description: "En kısa sürede sizinle iletişime geçeceğiz." });
            router.push(authUser ? '/my-applications' : '/login');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Bir hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCorporatePhone = COUNTRY_PHONE_CODES.find(c => c.code === formData.phoneCountryCode) ?? COUNTRY_PHONE_CODES[0];

    // --- Registry (kütük) auto-fill: Dernek lookup by kütük no, Vakıf search by name ---
    type RegistryMatch = {
        name?: string;
        faaliyetAlani?: string;
        adres?: string;
        webSite?: string;
        il?: string;
        ilce?: string;
    };
    type VakifResult = {
        id: string;
        name: string;
        adres?: string;
        il?: string;
        ilce?: string;
        ePosta?: string;
        telefon1?: string;
    };
    // 'idle' | 'loading' | 'found' | 'notFound' | 'error'
    const [registryLookupStatus, setRegistryLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notFound' | 'error'>('idle');
    const [registryMatch, setRegistryMatch] = useState<RegistryMatch | null>(null);
    const [vakifSearchText, setVakifSearchText] = useState('');
    const [vakifSearchStatus, setVakifSearchStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
    const [vakifResults, setVakifResults] = useState<VakifResult[]>([]);

    const handleDernekLookup = async () => {
        const key = formData.registryNo.trim();
        if (!key) return;
        setRegistryLookupStatus('loading');
        setRegistryMatch(null);
        try {
            const snap = await getDoc(doc(db, COLLECTIONS.registryDernekler, key));
            if (!snap.exists()) {
                setRegistryLookupStatus('notFound');
                return;
            }
            const r = snap.data() as Record<string, unknown>;
            const name = typeof r.name === 'string' ? r.name : '';
            const foundedYear = typeof r.foundedYear === 'number'
                ? String(r.foundedYear)
                : typeof r.foundedYear === 'string' ? r.foundedYear : '';
            const faaliyetAlani = typeof r.faaliyetAlani === 'string' ? r.faaliyetAlani : '';
            const detayliFaaliyetAlani = typeof r.detayliFaaliyetAlani === 'string'
                ? r.detayliFaaliyetAlani
                : typeof r['Detaylı Faaliyet Alanı'] === 'string' ? r['Detaylı Faaliyet Alanı'] as string : '';
            const adres = typeof r.adres === 'string' ? r.adres : '';
            const webSite = typeof r.webSite === 'string' ? r.webSite : '';
            // İl plate code: kütük no'nun ilk 2 hanesi (e.g. "06-154-120" → "06" → "Ankara").
            // Kullanıcı manuel girdiği city'i ezme; yalnız boşsa doldur.
            const platePrefix = key.split('-')[0]?.padStart(2, '0') || '';
            const ilFromPlate = TR_IL_PLATES[platePrefix] || '';
            setFormData(prev => ({
                ...prev,
                name: name || prev.name,
                foundedYear: foundedYear && !prev.foundedYear ? foundedYear : prev.foundedYear,
                sector: faaliyetAlani && !prev.sector ? faaliyetAlani : prev.sector,
                detayliFaaliyetAlani: detayliFaaliyetAlani && !prev.detayliFaaliyetAlani
                    ? detayliFaaliyetAlani : prev.detayliFaaliyetAlani,
                country: prev.country || 'Türkiye',
                city: ilFromPlate && !prev.city ? ilFromPlate : prev.city,
                addressLine: adres && !prev.addressLine ? adres : prev.addressLine,
                website: webSite && !prev.website ? webSite : prev.website,
            }));
            setRegistryMatch({
                name,
                faaliyetAlani: faaliyetAlani || undefined,
                adres: adres || undefined,
                webSite: webSite || undefined,
                il: ilFromPlate || undefined,
            });
            setRegistryLookupStatus('found');
        } catch {
            // Registry may not be imported yet, or rules deny → never crash the form.
            setRegistryLookupStatus('error');
        }
    };

    const handleVakifSearch = async () => {
        const q = vakifSearchText.trim().toLocaleLowerCase('tr');
        if (q.length < 3) return;
        setVakifSearchStatus('loading');
        setVakifResults([]);
        try {
            const snap = await getDocs(query(
                collection(db, COLLECTIONS.registryVakiflar),
                where('nameLower', '>=', q),
                where('nameLower', '<=', q + ''),
                orderBy('nameLower'),
                limit(8),
            ));
            const results: VakifResult[] = snap.docs.map(d => {
                const r = d.data() as Record<string, unknown>;
                return {
                    id: d.id,
                    name: typeof r.name === 'string' ? r.name : '',
                    adres: typeof r.adres === 'string' ? r.adres : undefined,
                    il: typeof r.il === 'string' ? r.il : undefined,
                    ilce: typeof r.ilce === 'string' ? r.ilce : undefined,
                    ePosta: typeof r.ePosta === 'string' ? r.ePosta : undefined,
                    telefon1: typeof r.telefon1 === 'string' ? r.telefon1 : undefined,
                };
            });
            setVakifResults(results);
            setVakifSearchStatus(results.length === 0 ? 'empty' : 'idle');
        } catch {
            // nameLower index may not be deployed → graceful manual entry.
            setVakifSearchStatus('error');
        }
    };

    const handleSelectVakif = (v: VakifResult) => {
        const cleanEmail = v.ePosta && v.ePosta !== '-' ? v.ePosta : '';
        const localPhone = v.telefon1 ? v.telefon1.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '') : '';
        setFormData(prev => ({
            ...prev,
            name: v.name || prev.name,
            city: v.il || prev.city,
            district: v.ilce || prev.district,
            // adres → about/notes only if empty (do not overwrite user text).
            about: prev.about ? prev.about : (v.adres || prev.about),
            email: !prev.email && cleanEmail ? cleanEmail : prev.email,
            phone: !prev.phone && localPhone ? localPhone : prev.phone,
        }));
        setRegistryMatch({ name: v.name, adres: v.adres, il: v.il, ilce: v.ilce });
        setRegistryLookupStatus('found');
        setVakifResults([]);
        setVakifSearchStatus('idle');
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-10 animate-in fade-in-0 pb-10">
            <div className="space-y-6">
                <div className="space-y-2">
                    <FormLabel>Ülke</FormLabel>
                    <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val})}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold text-left"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {allCountries.map((c, i) => <SelectItem key={`${c}-${i}`} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <FormLabel>Kuruluş Türü</FormLabel>
                    <Select value={entityType} onValueChange={setEntityType}>
                        <SelectTrigger className="h-12 rounded-xl border-primary bg-primary/5 shadow-sm font-bold text-left"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NGO">Sivil Toplum Kuruluşu (STK)</SelectItem>
                            <SelectItem value="BRAND">Marka / Sosyal İşletme</SelectItem>
                            <SelectItem value="CLUB">Öğrenci Kulübü</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="border-dashed" />

            {entityType === 'NGO' && (() => {
                const ngoSub = formData.ngoSubType;
                const isOzelIzinli = ngoSub === 'OzelIzinli';
                const isSpor = ngoSub === 'SporKulubu';
                const isDernek = ngoSub === 'Dernek';
                const isVakif = ngoSub === 'Vakif';
                const identityTitle = isDernek ? 'DERNEĞİN KİMLİĞİ'
                    : isVakif ? "VAKIF'IN KİMLİĞİ"
                    : isSpor ? 'SPOR KULÜBÜNÜN KİMLİĞİ'
                    : isOzelIzinli ? 'ÖZEL İZİNLİ KİŞİ KİMLİĞİ'
                    : 'KURULUŞ KİMLİĞİ';
                const shortNameLabel = isDernek ? 'Dernek Kısa Adı'
                    : isVakif ? 'Vakıf Kısa Adı'
                    : isSpor ? 'Spor Kulübü Kısa Adı'
                    : '';
                const allProvinces = Object.values(TR_IL_PLATES).sort((a, b) => a.localeCompare(b, 'tr'));
                return (
                <div className="space-y-12">
                    {/* Alt tür seçimi — başlık kaldırıldı (kullanıcı talebi).
                        Lookup formları alt türe göre değişir. */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <FormLabel>Kuruluş Alt Türü</FormLabel>
                            <Select value={formData.ngoSubType} onValueChange={(val) => {
                                setFormData(prev => ({ ...prev, ngoSubType: val }));
                                setRegistryLookupStatus('idle');
                                setRegistryMatch(null);
                                setVakifResults([]);
                                setVakifSearchStatus('idle');
                            }}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold text-left">
                                    <SelectValue placeholder="Seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dernek">Dernek</SelectItem>
                                    <SelectItem value="Vakif">Vakıf</SelectItem>
                                    <SelectItem value="SporKulubu">Spor Kulübü</SelectItem>
                                    <SelectItem value="OzelIzinli">Özel İzinli Kişi</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground ml-1 leading-snug">
                                Alt tür seçiminize göre alanlar şekillenir.
                            </p>
                        </div>

                        {formData.ngoSubType === 'Dernek' && (
                            <p className="text-[12px] text-muted-foreground -mt-2 leading-snug">
                                Kütük numaranızı girip <span className="font-bold text-foreground">Bilgileri Getir</span>&apos;e basın; STK&apos;nın bilgileri (ad, adres, faaliyet alanı, kuruluş yılı, il) otomatik doldurulur. Tire (-) işaretleri sistem tarafından eklenir; sadece rakamları yazın.
                            </p>
                        )}
                        {formData.ngoSubType === 'Vakif' && (
                            <p className="text-[12px] text-muted-foreground -mt-2 leading-snug">
                                Vakfınızın adını girip <span className="font-bold text-foreground">Ara</span>&apos;ya basın; eşleşen vakıflardan birini seçerseniz adres ve iletişim bilgileri otomatik doldurulur. Vakıflar kütük numarası kullanmaz, isimle eşleştirilir.
                            </p>
                        )}
                        {formData.ngoSubType === 'OzelIzinli' && (
                            <p className="text-[12px] text-muted-foreground -mt-2 leading-snug">
                                Özel izinli kuruluşlar için otomatik kayıt sorgulaması yoktur. Lütfen aşağıdaki alanları elle doldurun. Yetkili kişinin ad-soyadı bilgisi gerekir.
                            </p>
                        )}

                        {formData.ngoSubType === 'Dernek' && (
                        <div className="space-y-2">
                            <FormLabel>Kütük Numarası</FormLabel>
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <FormInput
                                    placeholder="örn. 34-262-102"
                                    value={formData.registryNo}
                                    onChange={e => { setFormData({...formData, registryNo: formatKutukNo(e.target.value)}); setRegistryLookupStatus('idle'); }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleDernekLookup(); } }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 rounded-xl px-4 font-bold border-primary/30"
                                    disabled={registryLookupStatus === 'loading' || !formData.registryNo.trim()}
                                    onClick={() => void handleDernekLookup()}
                                >
                                    {registryLookupStatus === 'loading'
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : "Bilgileri Getir"}
                                </Button>
                            </div>
                            {registryLookupStatus === 'notFound' && (
                                <p className="text-[11px] text-muted-foreground ml-1">Bu kütük numarasıyla kayıt bulunamadı. Bilgileri elle girebilirsiniz.</p>
                            )}
                            {registryLookupStatus === 'error' && (
                                <p className="text-[11px] text-muted-foreground ml-1">Kayıt sorgulanamadı. Bilgileri elle girebilirsiniz.</p>
                            )}
                        </div>
                        )}

                        {formData.ngoSubType === 'Vakif' && (
                        <div className="space-y-2">
                            <FormLabel>Vakıf Adı</FormLabel>
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <FormInput
                                    placeholder="örn. Türkiye Eğitim Vakfı (en az 3 harf)"
                                    value={vakifSearchText}
                                    onChange={e => setVakifSearchText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleVakifSearch(); } }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 rounded-xl px-4 font-bold border-primary/30"
                                    disabled={vakifSearchStatus === 'loading' || vakifSearchText.trim().length < 3}
                                    onClick={() => void handleVakifSearch()}
                                >
                                    {vakifSearchStatus === 'loading'
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <><Search className="mr-2 h-4 w-4" />Vakfı Bul</>}
                                </Button>
                            </div>
                            {vakifResults.length > 0 && (
                                <div className="rounded-2xl border bg-card divide-y overflow-hidden">
                                    {vakifResults.map(v => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => handleSelectVakif(v)}
                                            className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors"
                                        >
                                            <p className="text-[13px] font-bold leading-tight">{v.name}</p>
                                            {(v.il || v.ilce) && (
                                                <p className="text-[11px] text-muted-foreground">{[v.ilce, v.il].filter(Boolean).join(' / ')}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {vakifSearchStatus === 'empty' && (
                                <p className="text-[11px] text-muted-foreground ml-1">Bu adla kayıt bulunamadı. Bilgileri elle girebilirsiniz.</p>
                            )}
                            {vakifSearchStatus === 'error' && (
                                <p className="text-[11px] text-muted-foreground ml-1">Arama şu anda kullanılamıyor, bilgileri elle girin.</p>
                            )}
                        </div>
                        )}

                        {/* Bulunan kayıt onayı — hem Dernek hem Vakif (handleSelectVakif) için.
                            registryMatch ve registryLookupStatus state'leri ortak. */}
                        {registryLookupStatus === 'found' && registryMatch && (
                            <div className="rounded-2xl border border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600 p-4 flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div className="space-y-1 text-left">
                                    <p className="text-[13px] font-black text-green-800 dark:text-green-300 leading-tight">{registryMatch.name}</p>
                                    {registryMatch.faaliyetAlani && (
                                        <p className="text-[11px] text-muted-foreground">{registryMatch.faaliyetAlani}</p>
                                    )}
                                    {registryMatch.adres && (
                                        <p className="text-[11px] text-muted-foreground">{registryMatch.adres}</p>
                                    )}
                                    {registryMatch.webSite && (
                                        <p className="text-[11px] text-primary break-all">{registryMatch.webSite}</p>
                                    )}
                                    {registryMatch.il && (
                                        <p className="text-[11px] text-muted-foreground">İl: {registryMatch.il}</p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground pt-1">Bilgiler forma aktarıldı; gerekirse düzenleyebilirsiniz.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Kimlik — başlık alt türe göre değişir */}
                    <div className="space-y-6">
                        <SectionTitle icon={Building2}>{identityTitle}</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel required>{isOzelIzinli ? 'Özel İzinli Kişinin Adı Soyadı' : 'Kuruluş Tam Adı'}</FormLabel>
                            <FormInput placeholder={isOzelIzinli ? 'Ad Soyad' : 'Tam resmi ad'} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        {!isOzelIzinli && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormLabel>Kuruluş Yılı</FormLabel>
                                    <Select value={formData.foundedYear} onValueChange={v => setFormData({...formData, foundedYear: v})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Yıl Seç" /></SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Faaliyet Alanı'nın eski yerine kısa ad (alt türe göre etiket) */}
                                <div className="space-y-2">
                                    <FormLabel>{shortNameLabel}</FormLabel>
                                    <FormInput
                                        placeholder="Örn. AİP, TEMA, MEB-OS"
                                        value={formData.shortName}
                                        onChange={e => setFormData({...formData, shortName: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Faaliyet Alanı tek başına bir satır (yarım genişlik) — sadece Dernek/Vakıf/Spor */}
                        {!isOzelIzinli && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormLabel>Faaliyet Alanı</FormLabel>
                                    <FormInput
                                        placeholder="Örn. Eğitim, Sağlık"
                                        value={formData.sector}
                                        onChange={e => setFormData({...formData, sector: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Detaylı Faaliyet Alanı</FormLabel>
                                    <FormInput
                                        placeholder="Detay"
                                        value={formData.detayliFaaliyetAlani}
                                        onChange={e => setFormData({...formData, detayliFaaliyetAlani: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Özel İzinli için ek alanlar — izin tarihi + bitiş + valilik + amaç */}
                        {isOzelIzinli && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FormLabel required>İzin Tarihi</FormLabel>
                                        <FormInput type="date" value={formData.ozelIzinTarihi} onChange={e => setFormData({...formData, ozelIzinTarihi: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel required>İzin Bitiş Tarihi</FormLabel>
                                        <FormInput type="date" value={formData.ozelIzinBitisTarihi} onChange={e => setFormData({...formData, ozelIzinBitisTarihi: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <FormLabel required>İzni Veren Valilik</FormLabel>
                                    <Select value={formData.ozelIzinVerenValilik} onValueChange={v => setFormData({...formData, ozelIzinVerenValilik: v})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Valilik seç..." /></SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {allProvinces.map(il => <SelectItem key={il} value={`${il} Valiliği`}>{il} Valiliği</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <FormLabel required>İzin Amacı (Birden fazla seçebilirsiniz)</FormLabel>
                                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                                        {OZEL_IZIN_AMAC_OPTIONS.map(item => (
                                            <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                                <Checkbox checked={selectedIzinAmaclari.includes(item)} onCheckedChange={c => setSelectedIzinAmaclari(prev => c ? [...prev, item] : prev.filter(i => i !== item))} />
                                                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedIzinAmaclari.includes('Diğer') && (
                                        <FormInput
                                            placeholder="Diğer amaç açıklaması..."
                                            value={formData.ozelIzinAmaciDiger}
                                            onChange={e => setFormData({...formData, ozelIzinAmaciDiger: e.target.value})}
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel>Hakkınızda</FormLabel>
                                <span className={cn(
                                    "text-[10px] font-mono",
                                    formData.about.length > ABOUT_MAX ? 'text-destructive font-bold' : 'text-muted-foreground'
                                )}>
                                    {formData.about.length} / {ABOUT_MAX}
                                </span>
                            </div>
                            <Textarea
                                className="rounded-2xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 min-h-[96px]"
                                placeholder={isOzelIzinli ? 'Kendinizi ve faaliyetinizi kısaca anlatın' : 'Kuruluşunuzu kısaca tanıtın'}
                                value={formData.about}
                                maxLength={ABOUT_MAX}
                                onChange={e => setFormData({...formData, about: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Faydalanıcılar — Özel İzinli için gizli */}
                    {!isOzelIzinli && (
                        <div className="space-y-6">
                            <SectionTitle icon={Target}>FAYDALANICILARINIZ</SectionTitle>
                            <div className="space-y-3">
                                <FormLabel>Faydalanıcı Gruplar (Birden fazla seçebilirsiniz)</FormLabel>
                                <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                                    {ngoBeneficiaryOptions.map(item => (
                                        <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                            <Checkbox checked={selectedBeneficiaries.includes(item)} onCheckedChange={checked => setSelectedBeneficiaries(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SKA — Özel İzinli için gizli */}
                    {!isOzelIzinli && (
                        <div className="space-y-6">
                            <SectionTitle icon={Target}>Sürdürülebilir Kalkınma Amaçlarını kapsamaktadır? (Birden fazla seçebilirsiniz)</SectionTitle>
                            <div className="grid grid-cols-1 gap-2 p-4 border rounded-2xl bg-card">
                                {allSdgs.slice(0, 8).map(item => (
                                    <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                        <Checkbox checked={selectedSdgs.includes(item)} onCheckedChange={checked => setSelectedSdgs(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Platformlar — Özel İzinli için 'Katıldığınız Platformlar', diğerleri 'STK OLARAK PLATFORMLAR' */}
                    <div className="space-y-6">
                        <SectionTitle icon={Activity}>{isOzelIzinli ? 'KATILDIĞINIZ PLATFORMLAR' : 'STK OLARAK PLATFORMLAR'}</SectionTitle>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                            {ngoPlatformOptions.map(item => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                    <Checkbox checked={selectedNetworks.includes(item)} onCheckedChange={checked => setSelectedNetworks(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                </label>
                            ))}
                        </div>
                        {/* Kamu Yararı Statüsü — sadece Dernek/Vakıf/Spor */}
                        {!isOzelIzinli && (
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                                <Checkbox
                                    checked={formData.kamuYarariStatusu}
                                    onCheckedChange={(c) => setFormData({...formData, kamuYarariStatusu: !!c})}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Kamu Yararı Statüsü</p>
                                    <p className="text-[10px] text-muted-foreground">Bakanlar Kurulu kararıyla kamu yararına çalışan {isDernek ? 'dernek' : isVakif ? 'vakıf' : 'kuruluş'} statüsünde misiniz?</p>
                                </div>
                            </label>
                        )}
                    </div>

                    {/* Adres — herbiri tek satır */}
                    <div className="space-y-6">
                        <SectionTitle icon={MapPin}>ADRES BİLGİLERİ</SectionTitle>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel required>İl</FormLabel>
                                <Select value={formData.city} onValueChange={v => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl seç..." /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {allProvinces.map(il => <SelectItem key={il} value={il}>{il}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>İlçe</FormLabel>
                                <Select value={formData.district} onValueChange={v => setFormData({...formData, district: v, neighborhood: ''})} disabled={!formData.city}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder={formData.city ? 'İlçe seç...' : 'Önce il seçin'} /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {formData.city && neighborhoodsData[formData.city] && Object.keys(neighborhoodsData[formData.city]).sort((a, b) => a.localeCompare(b, 'tr')).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Mahalle</FormLabel>
                                <Select value={formData.neighborhood} onValueChange={v => setFormData({...formData, neighborhood: v})} disabled={!formData.district}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder={formData.district ? 'Mahalle seç...' : 'Önce ilçe seçin'} /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {formData.city && formData.district && (neighborhoodsData[formData.city]?.[formData.district] || []).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Açık Adres</FormLabel>
                                <FormInput placeholder="Sokak, cadde, bina adı" value={formData.addressLine} onChange={e => setFormData({...formData, addressLine: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Kapı No</FormLabel>
                                <FormInput placeholder="Bina/Daire no" value={formData.doorNo} onChange={e => setFormData({...formData, doorNo: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* İletişim & Sosyal Medya */}
                    <div className="space-y-6">
                        <SectionTitle icon={Mail}>İLETİŞİM & SOSYAL MEDYA</SectionTitle>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel required>Kurumsal E-posta</FormLabel>
                                <IconInput icon={Mail} type="email" placeholder="iletisim@kurum.org" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>Kurumsal Telefon</FormLabel>
                                <div className="grid grid-cols-[140px_1fr] gap-2">
                                    <Select value={formData.phoneCountryCode} onValueChange={v => setFormData({...formData, phoneCountryCode: v})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold">
                                            <SelectValue>
                                                <span className="text-base">{selectedCorporatePhone.flag}</span>
                                                <span className="ml-1">{selectedCorporatePhone.code}</span>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {COUNTRY_PHONE_CODES.map((c) => (
                                                <SelectItem key={`${c.iso}-${c.code}`} value={c.code}>
                                                    <span className="text-base mr-2">{c.flag}</span>
                                                    {c.country} ({c.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormInput type="tel" placeholder="5XXXXXXXXX" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            {/* Sosyal medya sabit alanlar */}
                            <div className="space-y-2">
                                <FormLabel>Web Sitesi</FormLabel>
                                <IconInput icon={Globe} type="url" placeholder="https://kurum.org" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormLabel>Instagram</FormLabel>
                                    <FormInput placeholder="@kurum" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>X (Twitter)</FormLabel>
                                    <FormInput placeholder="@kurum" value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    {/* Özel İzinli için LinkedIn yerine ikinci Instagram (kişisel/kurumsal ayrımı) */}
                                    <FormLabel>{isOzelIzinli ? 'Instagram (Kişisel/İkinci)' : 'LinkedIn'}</FormLabel>
                                    <FormInput
                                        placeholder={isOzelIzinli ? '@kullanici' : 'linkedin.com/company/kurum'}
                                        value={formData.linkedin}
                                        onChange={e => setFormData({...formData, linkedin: e.target.value})}
                                    />
                                </div>
                            </div>
                            {/* Diğer platformlar — +Ekle ile dinamik, platform dropdown'lu */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <FormLabel>Diğer Platformlar (Opsiyonel)</FormLabel>
                                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl gap-1" onClick={() => setOtherSocials(prev => [...prev, { platform: '', url: '' }])}>
                                        <span className="text-base leading-none">+</span> Ekle
                                    </Button>
                                </div>
                                {otherSocials.map((s, idx) => (
                                    <div key={idx} className="grid grid-cols-[160px_1fr_auto] gap-2 items-center">
                                        <Select value={s.platform} onValueChange={(v) => setOtherSocials(prev => prev.map((p, i) => i === idx ? { ...p, platform: v } : p))}>
                                            <SelectTrigger className="h-10 rounded-xl bg-card border"><SelectValue placeholder="Platform seç..." /></SelectTrigger>
                                            <SelectContent>
                                                {SOCIAL_PLATFORM_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormInput placeholder="URL veya @handle" value={s.url} onChange={e => setOtherSocials(prev => prev.map((p, i) => i === idx ? { ...p, url: e.target.value } : p))} />
                                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0" onClick={() => setOtherSocials(prev => prev.filter((_, i) => i !== idx))} aria-label="Kaldır">
                                            <span className="text-xl leading-none">×</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Yasal & Finansal — Kütük No artık yukarıda KAYIT SORGULAMA'da
                        alınır (Dernek için). Burada banka hesap bilgileri girilir. */}
                    <div className="space-y-6">
                        <SectionTitle icon={FileText}>YASAL & FİNANSAL</SectionTitle>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>Banka Hesap Adı</FormLabel>
                                <FormInput
                                    placeholder="Hesap sahibinin tam adı"
                                    value={formData.bankAccountName}
                                    onChange={e => setFormData({...formData, bankAccountName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>IBAN</FormLabel>
                                <FormInput placeholder="TR..." value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* YASAL BELGELER — alt türe göre */}
                    <div className="space-y-6">
                        <SectionTitle icon={Upload}>YASAL BELGELER</SectionTitle>
                        {isDernek && (
                            <>
                                <FileUpload label="DERNEK TÜZÜĞÜ" accept=".pdf,.png,.jpg,.jpeg" hint="DERBİS'ten alınmış güncel dernek tüzüğü." required />
                                <FileUpload label="FAALİYET BELGESİ" accept=".pdf,.png,.jpg,.jpeg" hint="DERBİS'ten alınmış faaliyet belgesi." required />
                            </>
                        )}
                        {isVakif && (
                            <>
                                <FileUpload label="VAKIF SENEDİ" accept=".pdf,.png,.jpg,.jpeg" hint="VBS sisteminden alınmış güncel vakıf senedi." required />
                                <FileUpload label="FAALİYET BELGESİ" accept=".pdf,.png,.jpg,.jpeg" hint="VBS sisteminden alınmış faaliyet belgesi." required />
                            </>
                        )}
                        {isSpor && (
                            <>
                                <FileUpload label="SPOR KULÜBÜ TÜZÜĞÜ" accept=".pdf,.png,.jpg,.jpeg" hint="GSB Bakanlık sisteminden alınmış spor kulübü tüzüğü." required />
                                <FileUpload label="FAALİYET (TESCİL) BELGESİ" accept=".pdf,.png,.jpg,.jpeg" hint="GSB Bakanlık sisteminden alınmış spor kulübü tescil/faaliyet belgesi." required />
                            </>
                        )}
                        {isOzelIzinli && (
                            <>
                                <FileUpload label="ÖZEL İZİNLİ KİŞİNİN FOTOĞRAFI" accept=".jpg,.jpeg,.png" hint="JPG veya PNG formatında vesikalık/portre." required />
                                <FileUpload label="İZİN BELGESİ" accept=".pdf,.jpg,.jpeg,.png" hint="Valilik tarafından düzenlenmiş izin belgesi (PDF/JPG/PNG)." required />
                            </>
                        )}
                        {!ngoSub && (
                            <p className="text-[11px] text-muted-foreground italic">Önce alt türü seçin (Dernek/Vakıf/Spor Kulübü/Özel İzinli), belge listesi otomatik gelir.</p>
                        )}
                    </div>

                    {/* Yetkili Kişi — Özel İzinli için 'görevi' → 'yakınlığı', diğerleri için 'görevi' */}
                    <div className="space-y-6">
                        <SectionTitle icon={UserCircle}>YETKİLİ KİŞİ BİLGİLERİ</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel required>Ad Soyad</FormLabel>
                                <FormInput placeholder="Yetkili ad soyad" required value={formData.authorized.name} onChange={e => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>{isOzelIzinli ? 'Yakınlığı' : 'Görevi'}</FormLabel>
                                <FormInput
                                    placeholder={isOzelIzinli ? 'Örn. Kardeşi, Babası' : 'Örn. Genel Sekreter'}
                                    required
                                    value={isOzelIzinli ? formData.authorizedRelation : formData.authorized.role}
                                    onChange={e => isOzelIzinli
                                        ? setFormData({...formData, authorizedRelation: e.target.value})
                                        : setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>Telefon</FormLabel>
                                <FormInput
                                    type="tel"
                                    placeholder="0532 XXX XX XX"
                                    required
                                    value={formData.authorizedPhone}
                                    onChange={e => setFormData({...formData, authorizedPhone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>E-posta</FormLabel>
                                <FormInput
                                    type="email"
                                    placeholder="yetkili@example.com"
                                    required
                                    value={formData.authorizedEmail}
                                    onChange={e => setFormData({...formData, authorizedEmail: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-6 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.userAgreement}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, userAgreement: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kullanici-sozlesmesi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Kullanıcı Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.kvkk}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, kvkk: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kvkk-aydinlatma-metni" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">KVKK Aydınlatma Metni</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.privacy}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, privacy: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.cookies}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, cookies: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Çerez Politikası</a>&apos;nı kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.ngoMembership}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, ngoMembership: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/stk-uyelik" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">STK Üyelik Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.transparency}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, transparency: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/seffaflik" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Şeffaflık Endeksi Esasları</a>&apos;nı kabul ediyorum
                            </span>
                        </label>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting || !ngoAgreementsAccepted}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "BAŞVURUYU TAMAMLA"}
                    </Button>
                </div>
                );
            })()}

            {entityType === 'BRAND' && (
                <div className="space-y-12">
                    <div className="space-y-6">
                        <SectionTitle icon={Store}>MARKA KİMLİĞİ</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel required>Marka Adı</FormLabel>
                            <FormInput placeholder="Markanızın adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>İşletme Statüsü</FormLabel>
                            <Select value={formData.brandStatus} onValueChange={v => setFormData({...formData, brandStatus: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Ticari Marka</SelectItem>
                                    <SelectItem value="cooperative">Kooperatif</SelectItem>
                                    <SelectItem value="social-enterprise">Sosyal İşletme</SelectItem>
                                    <SelectItem value="economic-enterprise">İktisadi İşletme</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Sektör</FormLabel>
                            <Select value={formData.sector} onValueChange={v => setFormData({...formData, sector: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Sektör Seçin" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {brandSectorOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Adres */}
                    <div className="space-y-6">
                        <SectionTitle icon={MapPin}>ADRES BİLGİLERİ</SectionTitle>
                        <LocationFields
                            value={{
                                country: formData.country,
                                city: formData.city,
                                district: formData.district,
                                neighborhood: formData.neighborhood,
                            }}
                            onChange={(next) => setFormData({
                                ...formData,
                                city: next.city ?? '',
                                district: next.district ?? '',
                                neighborhood: next.neighborhood ?? '',
                            })}
                            showCountry={false}
                        />
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={Target}>AFFILIATE & TEKNİK TAKİP</SectionTitle>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel>Affiliate ID</FormLabel>
                                <FormInput placeholder="HNG-2024-X" value={formData.affiliateId} onChange={e => setFormData({...formData, affiliateId: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Tracking Link</FormLabel>
                                <FormInput placeholder="https://..." value={formData.trackingLink} onChange={e => setFormData({...formData, trackingLink: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Pixel Script</FormLabel>
                                <Textarea className="font-mono text-xs h-24 rounded-xl" placeholder="<script>...</script>" value={formData.pixelScript} onChange={e => setFormData({...formData, pixelScript: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Kategori Bazlı Bağış Oranları */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>KATEGORİ BAZLI BAĞIŞ ORANLARI</SectionTitle>
                        <p className="text-[11px] text-muted-foreground -mt-2">
                            Bağış oranlarınızı kategori bazında yönetim panelinden detaylandırabilirsiniz.
                        </p>

                        {/* Fiziksel Alışveriş alt başlığı */}
                        <div className="space-y-3 pt-4 border-t border-dashed">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fiziksel Alışveriş</h4>
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-card border">
                                <Checkbox
                                    checked={formData.physicalDonationsEnabled}
                                    onCheckedChange={checked => setFormData({...formData, physicalDonationsEnabled: !!checked})}
                                />
                                <span className="text-[12px] font-medium leading-snug">Fiziksel alışverişlerde de bağışlar geçerli olsun</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-card border">
                                <Checkbox
                                    checked={formData.posRequested}
                                    onCheckedChange={checked => setFormData({...formData, posRequested: !!checked})}
                                />
                                <span className="text-[12px] font-medium leading-snug">Pos Cihazı talep ediyorum</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2 pt-6 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.userAgreement}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, userAgreement: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kullanici-sozlesmesi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Kullanıcı Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.kvkk}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, kvkk: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kvkk-aydinlatma-metni" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">KVKK Aydınlatma Metni</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.privacy}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, privacy: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.cookies}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, cookies: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Çerez Politikası</a>&apos;nı kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.brandMembership}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, brandMembership: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/marka-uyelik" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Marka Üyelik Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.affiliate}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, affiliate: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/affiliate-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Bağış ve Affiliate Politikası</a>&apos;nı kabul ediyorum
                            </span>
                        </label>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting || !brandAgreementsAccepted}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "KAYDI TAMAMLA"}
                    </Button>
                </div>
            )}

            {entityType === 'CLUB' && (
                <div className="space-y-12">
                    <div className="space-y-6">
                        <SectionTitle icon={School}>KULÜP BİLGİLERİ</SectionTitle>

                        {/* Kulüp Türü — Ad'dan ÖNCE (kullanıcı talebi) */}
                        <div className="space-y-2">
                            <FormLabel required>Kulüp Türü</FormLabel>
                            <Select value={formData.clubType} onValueChange={v => setFormData({...formData, clubType: v, clubAffiliation: ''})}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Kulüp Türünü Seçin" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Üniversite">Üniversite</SelectItem>
                                    <SelectItem value="Lise">Lise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.clubType === 'Üniversite' && (
                            <div className="space-y-2">
                                <FormLabel>Bağlı olduğunuz Üniversite</FormLabel>
                                <Select value={formData.clubAffiliation} onValueChange={v => setFormData({...formData, clubAffiliation: v, universityName: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Üniversite Seçin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {clubUniversityOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {formData.clubType === 'Lise' && (
                            <div className="space-y-2">
                                <FormLabel>Bağlı olduğunuz İl Milli Eğitim Müdürlüğü</FormLabel>
                                <Select value={formData.clubAffiliation} onValueChange={v => setFormData({...formData, clubAffiliation: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl Seçin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {Object.keys(neighborhoodsData).sort((a,b) => a.localeCompare(b, 'tr')).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <FormLabel required>Kulüp Adı</FormLabel>
                            <FormInput placeholder="Kulübün tam adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>

                        {/* Kısa tanıtım */}
                        <div className="space-y-2">
                            <FormLabel required>Kulübünüzü kısaca tanıtın</FormLabel>
                            <Textarea
                                placeholder="Kulübünüzün amacı, faaliyetleri ve hedefleri hakkında 2-3 cümle..."
                                value={formData.clubShortDescription}
                                onChange={e => setFormData({...formData, clubShortDescription: e.target.value})}
                                rows={3}
                                className="rounded-xl bg-card border-none"
                                required
                            />
                        </div>

                        {/* Etkinlik sıklığı */}
                        <div className="space-y-2">
                            <FormLabel required>Düzenli Etkinlik Yapıyor musunuz?</FormLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['Haftalık', 'Aylık', 'Dönemsel', 'Düzensiz'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setFormData({...formData, clubEventFrequency: opt})}
                                        className={cn(
                                            'h-12 rounded-xl border px-3 text-sm font-bold transition-colors',
                                            formData.clubEventFrequency === opt
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card hover:bg-accent border-transparent'
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Kulüp Kategorisi — UI iyileştirildi */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>KULÜP KATEGORİSİ</SectionTitle>
                        <p className="text-xs text-muted-foreground -mt-2 leading-relaxed">
                            Kulübünüze uyan kategorileri seçin. <strong>Herhangi bir gruptan istediğiniz kadar seçim yapabilirsiniz</strong> — gruplar zorunlu değil, sadece sınıflandırma için.
                        </p>
                        <div className="rounded-2xl border bg-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                Seçili: {selectedClubCategories.length} kategori
                            </p>
                            <div className="space-y-4">
                                {clubCategoryGroups.map(group => (
                                    <div key={group.group} className="space-y-1.5">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-primary/70 border-b border-dashed border-primary/20 pb-1">
                                            {group.group}
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {group.items.map(item => {
                                                const checked = selectedClubCategories.includes(item);
                                                return (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() => setSelectedClubCategories(prev =>
                                                            checked ? prev.filter(i => i !== item) : [...prev, item]
                                                        )}
                                                        className={cn(
                                                            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                                                            checked
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'bg-background border-border hover:bg-accent hover:border-accent-foreground/20'
                                                        )}
                                                    >
                                                        {item}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* İletişim Bilgileri */}
                    <div className="space-y-6">
                        <SectionTitle icon={Phone}>İLETİŞİM BİLGİLERİ</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel required>Kulübün Telefon Numarası</FormLabel>
                                <FormInput
                                    type="tel"
                                    placeholder="0532 XXX XX XX"
                                    value={formData.clubContactPhone}
                                    onChange={e => setFormData({...formData, clubContactPhone: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>Kulübün Mail Adresi</FormLabel>
                                <FormInput
                                    type="email"
                                    placeholder="kulup@example.com"
                                    value={formData.clubContactEmail}
                                    onChange={e => setFormData({...formData, clubContactEmail: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sosyal Medya Hesapları */}
                    <div className="space-y-6">
                        <SectionTitle icon={Globe}>SOSYAL MEDYA HESAPLARI</SectionTitle>
                        <p className="text-[11px] text-muted-foreground -mt-2">Opsiyonel. Kullanıcı adınızı veya tam URL'yi yazabilirsiniz.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>Instagram</FormLabel>
                                <FormInput placeholder="@kulubunuz" value={formData.clubSocialInstagram} onChange={e => setFormData({...formData, clubSocialInstagram: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>LinkedIn</FormLabel>
                                <FormInput placeholder="linkedin.com/company/kulubunuz" value={formData.clubSocialLinkedin} onChange={e => setFormData({...formData, clubSocialLinkedin: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>X (Twitter)</FormLabel>
                                <FormInput placeholder="@kulubunuz" value={formData.clubSocialTwitter} onChange={e => setFormData({...formData, clubSocialTwitter: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Web Sitesi</FormLabel>
                                <FormInput type="url" placeholder="https://kulubunuz.com" value={formData.clubSocialWebsite} onChange={e => setFormData({...formData, clubSocialWebsite: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Akademik Danışman */}
                    <div className="space-y-6">
                        <SectionTitle icon={GraduationCap}>AKADEMİK DANIŞMAN</SectionTitle>
                        <p className="text-[11px] text-muted-foreground -mt-2">KVKK gereği iletişim bilgileri profilde yayınlanmaz, sadece admin görür.</p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel required>Akademik Danışmanın Adı Soyadı</FormLabel>
                                <FormInput placeholder="Prof. Dr. ..." value={formData.clubAdvisorName} onChange={e => setFormData({...formData, clubAdvisorName: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormLabel required>Mail Adresi</FormLabel>
                                    <FormInput type="email" placeholder="danisman@universite.edu.tr" value={formData.clubAdvisorEmail} onChange={e => setFormData({...formData, clubAdvisorEmail: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel required>Telefon Numarası</FormLabel>
                                    <FormInput
                                        type="tel"
                                        placeholder="0532 XXX XX XX"
                                        value={formData.clubAdvisorPhone}
                                        onChange={e => setFormData({...formData, clubAdvisorPhone: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Yasal Belgeler & Logolar */}
                    <div className="space-y-6">
                        <SectionTitle icon={Upload}>YASAL BELGELER & LOGOLAR</SectionTitle>
                        <FileUpload label="KULÜP LOGOSU" accept=".png,.jpg,.jpeg,.svg" hint="PNG, JPG veya SVG formatında logonuzu yükleyin." />
                        {formData.clubType === 'Üniversite' ? (
                            <FileUpload
                                label="SKS / ÖĞRENCİ DEKANLIĞI YAZISI"
                                accept=".pdf,.png,.jpg,.jpeg"
                                hint="SKS veya Öğrenci Dekanlığı'ndan kulübünüzün faal olduğuna dair yazı (PDF veya resim)."
                            />
                        ) : (
                            <FileUpload
                                label="FAALİYET BELGESİ"
                                accept=".pdf,.png,.jpg,.jpeg"
                                hint="Bağlı olduğunuz okuldan aldığınız faaliyet belgesini yükleyin (PDF veya resim)."
                            />
                        )}
                    </div>

                    {/* Başkan Bilgileri — KVKK private */}
                    <div className="space-y-6">
                        <SectionTitle icon={UserCircle}>BAŞKAN BİLGİLERİ</SectionTitle>
                        <p className="text-[11px] text-muted-foreground -mt-2 leading-relaxed">
                            KVKK gereği başkanın iletişim bilgileri profilde yayınlanmaz, sadece admin görür.
                            <br />
                            <strong>Mail adresi:</strong> hangele kayıt olduğunuz veya olacağınız mail adresinizi yazınız.
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel required>Başkanın Adı Soyadı</FormLabel>
                                <FormInput placeholder="Adı Soyadı" value={formData.clubPresidentName} onChange={e => setFormData({...formData, clubPresidentName: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormLabel required>Başkanın Telefon Numarası</FormLabel>
                                    <FormInput
                                        type="tel"
                                        placeholder="0532 XXX XX XX"
                                        value={formData.clubPresidentPhone}
                                        onChange={e => setFormData({...formData, clubPresidentPhone: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel required>Başkanın Mail Adresi (hangel kayıt mail)</FormLabel>
                                    <FormInput type="email" placeholder="baskan@example.com" value={formData.clubPresidentEmail} onChange={e => setFormData({...formData, clubPresidentEmail: e.target.value})} required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-6 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.userAgreement}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, userAgreement: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kullanici-sozlesmesi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Kullanıcı Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.kvkk}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, kvkk: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kvkk-aydinlatma-metni" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">KVKK Aydınlatma Metni</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.privacy}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, privacy: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.cookies}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, cookies: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Çerez Politikası</a>&apos;nı kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={agreements.clubAgreement}
                                onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, clubAgreement: !!checked }))}
                            />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/ogrenci-kulup" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Öğrenci Kulüp Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting || !clubAgreementsAccepted}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "KAYDI TAMAMLA"}
                    </Button>
                </div>
            )}
        </form>
    );
};
