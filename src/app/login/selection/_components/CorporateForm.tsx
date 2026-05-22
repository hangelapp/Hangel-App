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
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { allCountries, allSdgs } from '@/lib/data';
import { COUNTRY_PHONE_CODES } from '@/lib/phone-codes';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import {
    FileUpload,
    SectionTitle,
    FormLabel,
    FormInput,
    IconInput,
    placeholderCities,
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
        sector: '',
        email: '',
        phone: '',
        phoneCountryCode: '+90',
        website: '',
        legalTitle: '',
        iban: '',
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
    });

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
            const foundedYear = typeof r.foundedYear === 'number' ? String(r.foundedYear) : '';
            setFormData(prev => ({
                ...prev,
                // name is the identity being looked up → always fill from record.
                name: name || prev.name,
                // foundedYear only if record has it and user hasn't set one.
                foundedYear: foundedYear && !prev.foundedYear ? foundedYear : prev.foundedYear,
            }));
            setRegistryMatch({
                name,
                faaliyetAlani: typeof r.faaliyetAlani === 'string' ? r.faaliyetAlani : undefined,
                adres: typeof r.adres === 'string' ? r.adres : undefined,
                webSite: typeof r.webSite === 'string' ? r.webSite : undefined,
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

            {entityType === 'NGO' && (
                <div className="space-y-12">
                    {/* Kayıt Sorgulama — kütük numarası ile otomatik doldurma (formun ilk adımı) */}
                    <div className="space-y-6">
                        <SectionTitle icon={Search}>KAYIT SORGULAMA</SectionTitle>
                        <p className="text-[12px] text-muted-foreground -mt-2 leading-snug">
                            Kütük numaranızı girip <span className="font-bold text-foreground">Bilgileri Getir</span>&apos;e basın; ilgili STK&apos;nın bilgileri formu otomatik doldursun. İsterseniz alanları düzenleyebilir veya kütük numaranız yoksa bilgileri elle girebilirsiniz.
                        </p>
                        <div className="space-y-2">
                            <FormLabel>Kütük Numarası</FormLabel>
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <FormInput
                                    placeholder="Kütük No"
                                    value={formData.registryNo}
                                    onChange={e => { setFormData({...formData, registryNo: e.target.value}); setRegistryLookupStatus('idle'); }}
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
                                    <p className="text-[10px] text-muted-foreground pt-1">Bilgiler forma aktarıldı; gerekirse düzenleyebilirsiniz.</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <FormLabel>Vakıf adıyla ara</FormLabel>
                            <p className="text-[11px] text-muted-foreground ml-1 -mt-1">Kütük numaranız yoksa vakfınızı adıyla arayabilirsiniz.</p>
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <FormInput
                                    placeholder="En az 3 harf girin"
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
                    </div>

                    {/* Kimlik */}
                    <div className="space-y-6">
                        <SectionTitle icon={Building2}>KURULUŞ KİMLİĞİ</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel required>Kuruluş Tam Adı</FormLabel>
                            <FormInput placeholder="Dernek veya vakfın tam resmi adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>Kuruluş Alt Türü</FormLabel>
                                <Select value={formData.orgSubType} onValueChange={v => setFormData({...formData, orgSubType: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Dernek">Dernek</SelectItem><SelectItem value="Vakıf">Vakıf</SelectItem><SelectItem value="Diğer">Diğer</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Kuruluş Yılı</FormLabel>
                                <Select value={formData.foundedYear} onValueChange={v => setFormData({...formData, foundedYear: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Yıl Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Hakkınızda</FormLabel>
                            <Textarea
                                className="rounded-2xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 min-h-[96px]"
                                placeholder="Kuruluşunuzu kısaca tanıtın"
                                value={formData.about}
                                onChange={e => setFormData({...formData, about: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Faydalanıcılar */}
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

                    {/* SKA */}
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

                    {/* STK Olarak Platformlar */}
                    <div className="space-y-6">
                        <SectionTitle icon={Activity}>STK OLARAK PLATFORMLAR</SectionTitle>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                            {ngoPlatformOptions.map(item => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                    <Checkbox checked={selectedNetworks.includes(item)} onCheckedChange={checked => setSelectedNetworks(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Adres */}
                    <div className="space-y-6">
                        <SectionTitle icon={MapPin}>ADRES BİLGİLERİ</SectionTitle>
                        {/* TODO: Replace placeholder city list with full Turkish address dataset (il/ilçe/mahalle). */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>İl</FormLabel>
                                <Select value={formData.city} onValueChange={v => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{placeholderCities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>İlçe</FormLabel>
                                <FormInput placeholder="İlçe" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Mahalle</FormLabel>
                            <FormInput placeholder="Mahalle" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
                    </div>

                    {/* İletişim */}
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
                        </div>
                    </div>

                    {/* Yasal & Finansal */}
                    <div className="space-y-6">
                        <SectionTitle icon={FileText}>YASAL & FİNANSAL</SectionTitle>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>Kütük Numarası</FormLabel>
                                <FormInput
                                    placeholder="Kütük No"
                                    value={formData.registryNo}
                                    onChange={e => { setFormData({...formData, registryNo: e.target.value}); setRegistryLookupStatus('idle'); }}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>IBAN</FormLabel>
                                <FormInput placeholder="TR..." value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Belgeler */}
                    <div className="space-y-6">
                        <SectionTitle icon={Upload}>YASAL BELGELER</SectionTitle>
                        <FileUpload label="TÜZÜK / VAKIF SENEDİ" accept=".pdf" required />
                        <FileUpload label="FAALİYET BELGESİ" accept=".pdf,.png,.jpg" required />
                    </div>

                    {/* Yetkili */}
                    <div className="space-y-6">
                        <SectionTitle icon={UserCircle}>YETKİLİ KİŞİ BİLGİLERİ</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel required>Ad Soyad</FormLabel>
                                <FormInput placeholder="Yetkili ad soyad" required value={formData.authorized.name} onChange={e => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>Görevi</FormLabel>
                                <FormInput placeholder="Örn: Genel Sekreter" required value={formData.authorized.role} onChange={e => setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})} />
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
            )}

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
                        {/* TODO: Replace placeholder city list with full Turkish address dataset (il/ilçe/mahalle). */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>İl</FormLabel>
                                <Select value={formData.city} onValueChange={v => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{placeholderCities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>İlçe</FormLabel>
                                <FormInput placeholder="İlçe" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Mahalle</FormLabel>
                            <FormInput placeholder="Mahalle" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
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
                        <div className="space-y-2">
                            <FormLabel required>Kulüp Adı</FormLabel>
                            <FormInput placeholder="Kulübün tam adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
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
                                        {placeholderCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Kulüp Kategorisi */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>KULÜP KATEGORİSİ</SectionTitle>
                        <p className="text-[11px] text-muted-foreground -mt-2">
                            Birden fazla kategori seçebilirsiniz.
                        </p>
                        <div className="space-y-5">
                            {clubCategoryGroups.map(group => (
                                <div key={group.group} className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{group.group}</h4>
                                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                                        {group.items.map(item => (
                                            <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                                <Checkbox
                                                    checked={selectedClubCategories.includes(item)}
                                                    onCheckedChange={checked => setSelectedClubCategories(prev => checked ? [...prev, item] : prev.filter(i => i !== item))}
                                                />
                                                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Yasal Belgeler & Logolar */}
                    <div className="space-y-6">
                        <SectionTitle icon={Upload}>YASAL BELGELER & LOGOLAR</SectionTitle>
                        <FileUpload label="KULÜP LOGOSU" accept=".png,.jpg,.jpeg,.svg" hint="PNG, JPG veya SVG formatında logonuzu yükleyin." />
                        <FileUpload
                            label="FAALİYET BELGESİ"
                            accept=".pdf,.png,.jpg,.jpeg"
                            hint="Bağlı olduğunuz okuldan veya ilgili makamdan aldığınız faaliyet belgesini yükleyin (PDF veya resim)."
                        />
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
