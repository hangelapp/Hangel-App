'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Country, State, City } from 'country-state-city';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Upload, ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import type { NGO } from '@/lib/types';

const MEMBERSHIP_OPTIONS = [
    'Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool',
    'HelpSteps', 'Candid', 'Global Compact', 'Idealist', 'www.gonulluyuzbiz.gov.tr',
    'TGSP', 'Diğer',
];

const FEDERATION_OPTIONS = [
    'TÜFED', 'TÜRKONFED', 'STGM', 'TÜSEV', 'KASİAD', 'TÜRKKAY', 'TFF', 'TBF', 'TVF', 'Diğer',
];

const SDG_OPTIONS = [
    '1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam',
    '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon',
    '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme',
    '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması',
    '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim',
    '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam',
    '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar',
];

const BENEFICIARY_OPTIONS = [
    'Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar',
    'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre',
];

const CATEGORY_OPTIONS = [
    'Eğitim', 'Sağlık', 'Çevre', 'Afet ve Yardım', 'Hayvan Hakları',
    'Çocuk Hakları', 'Kadın Hakları', 'İnsan Hakları', 'Sosyal Adalet',
    'Yoksullukla Mücadele', 'Mülteciler', 'Engelliler', 'Yaşlılar',
    'Gençlik', 'Sanat & Kültür', 'Spor', 'Bilim & Teknoloji',
    'Sürdürülebilirlik', 'Din ve Maneviyat', 'Diğer',
];

function MultiSelect({
    title,
    options,
    value,
    onChange,
}: {
    title: string;
    options: string[];
    value: string[];
    onChange: (next: string[]) => void;
}) {
    const toggle = (opt: string) => {
        if (value.includes(opt)) onChange(value.filter(v => v !== opt));
        else onChange([...value, opt]);
    };
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl border p-3 bg-background max-h-64 overflow-y-auto">
                {options.map(opt => {
                    const id = `${title}-${opt}`.replace(/\s/g, '-');
                    const checked = value.includes(opt);
                    return (
                        <div key={opt} className="flex items-center gap-2">
                            <Checkbox
                                id={id}
                                checked={checked}
                                onCheckedChange={() => toggle(opt)}
                            />
                            <Label htmlFor={id} className="text-xs font-medium cursor-pointer leading-tight">{opt}</Label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

export default function NgoEditPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    const id = params.id as string;

    const ngoDocRef = useMemoFirebase(() => (db && id ? doc(db, 'ngos', id) : null), [db, id]);
    const { data: ngo, isLoading } = useDoc<NGO>(ngoDocRef);

    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [form, setForm] = useState<Partial<NGO> & { [k: string]: any }>({});
    const [initialized, setInitialized] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ngo && !initialized) {
            setForm({ ...ngo });
            setInitialized(true);
        }
    }, [ngo, initialized]);

    const set = (path: string, value: any) => {
        setForm(prev => {
            const copy = { ...prev };
            const keys = path.split('.');
            let cur: any = copy;
            for (let i = 0; i < keys.length - 1; i++) {
                cur[keys[i]] = { ...(cur[keys[i]] ?? {}) };
                cur = cur[keys[i]];
            }
            cur[keys[keys.length - 1]] = value;
            return copy;
        });
    };

    const c = (form.contact ?? {}) as any;
    const social = c?.social ?? {};
    const address = c?.address ?? {};
    const currentCountry = address.country ?? '';
    const currentCity = address.city ?? '';
    const currentDistrict = address.district ?? '';
    const currentNeighborhood = address.neighborhood ?? '';
    const isTurkey = currentCountry === 'Türkiye' || currentCountry === 'Turkey' || currentCountry === 'TR' || currentCountry === '';

    const allCountriesList = useMemo(() => {
        return Country.getAllCountries()
            .map(c => ({ name: c.name, code: c.isoCode }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    const countryISO = useMemo(() => {
        if (!currentCountry) return null;
        if (isTurkey) return 'TR';
        return Country.getAllCountries().find(c => c.name === currentCountry || c.isoCode === currentCountry)?.isoCode || null;
    }, [currentCountry, isTurkey]);

    const cityOptions = useMemo(() => {
        if (isTurkey) return (allProvinces || []).slice().sort((a, b) => a.localeCompare(b, 'tr'));
        if (!countryISO) return [];
        const states = State.getStatesOfCountry(countryISO).map(s => s.name);
        if (states.length > 0) return states.sort((a, b) => a.localeCompare(b));
        return City.getCitiesOfCountry(countryISO)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
    }, [isTurkey, countryISO]);

    const districtOptions = useMemo(() => {
        if (isTurkey) return (districtsData[currentCity] || []).slice().sort((a, b) => a.localeCompare(b, 'tr'));
        if (!countryISO) return [];
        const stateObj = State.getStatesOfCountry(countryISO).find(s => s.name === currentCity);
        if (!stateObj) return [];
        return City.getCitiesOfState(countryISO, stateObj.isoCode)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
    }, [isTurkey, countryISO, currentCity]);

    const neighborhoodOptions = useMemo(() => {
        if (!isTurkey || !currentCity || !currentDistrict) return [];
        return ((neighborhoodsData as any)?.[currentCity]?.[currentDistrict] ?? []) as string[];
    }, [isTurkey, currentCity, currentDistrict]);

    const handleLogoUpload = async (file: File) => {
        if (!file) return;
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            toast({ variant: 'destructive', title: 'Geçersiz format', description: 'Sadece JPG veya PNG dosyası yükleyebilirsiniz.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 5MB yükleyebilirsiniz.' });
            return;
        }
        setUploadingLogo(true);
        try {
            const storage = getStorage();
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `ngos/${id}/logo-${Date.now()}-${safe}`;
            const r = storageRef(storage, path);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            set('avatarUrl', url);
            toast({ title: 'Logo yüklendi', description: 'Kaydete bastığınızda kalıcı olarak kaydedilecek.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Yükleme hatası', description: e?.message || 'Bilinmeyen hata.' });
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        if (!ngoDocRef) return;
        setSaving(true);
        try {
            // updateDoc undefined değerleri reddeder; ayrıca id ve subcollection benzeri
            // alanları yazmamak için temizliyoruz.
            const stripUndefined = (v: any): any => {
                if (Array.isArray(v)) return v.map(stripUndefined).filter(x => x !== undefined);
                if (v && typeof v === 'object' && !(v instanceof Date) && typeof v.toDate !== 'function') {
                    const out: any = {};
                    for (const [k, val] of Object.entries(v)) {
                        const cleaned = stripUndefined(val);
                        if (cleaned !== undefined) out[k] = cleaned;
                    }
                    return out;
                }
                return v === undefined ? undefined : v;
            };

            const { id: _id, posts: _posts, opportunities: _opps, campaigns: _camps, ...rest } = form as any;
            const payload = stripUndefined(rest);

            await updateDoc(ngoDocRef, payload);
            toast({ title: 'Kaydedildi', description: 'STK bilgileri güncellendi.' });
            router.back();
        } catch (e: any) {
            console.error('NGO update failed:', e);
            const code = e?.code;
            const description = code === 'permission-denied'
                ? 'Sunucu izin vermedi. Süper admin yetkinizi ve Firestore kurallarını kontrol edin.'
                : code === 'invalid-argument'
                    ? `Geçersiz veri: ${e?.message || ''}`
                    : (e?.message || 'Güncelleme başarısız.');
            toast({ variant: 'destructive', title: 'Hata', description });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !initialized) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-8 w-64" />
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
            </div>
        );
    }

    if (!ngo) {
        return <div className="p-8 text-center text-muted-foreground">Kuruluş bulunamadı.</div>;
    }

    const s = (form.stats ?? {}) as any;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">{ngo.name}</h1>
                        <p className="text-xs text-muted-foreground">STK Profili Düzenleniyor</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Kaydet
                </Button>
            </div>

            {/* Temel Bilgiler */}
            <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-base">Temel Bilgiler</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Kuruluş Adı">
                        <Input value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
                    </Field>
                    <Field label="Kısa Ad">
                        <Input value={form.shortName ?? ''} onChange={e => set('shortName', e.target.value)} />
                    </Field>
                    <Field label="Kuruluş Türü">
                        <Select value={form.type ?? ''} onValueChange={v => set('type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Dernek">Dernek</SelectItem>
                                <SelectItem value="Vakıf">Vakıf</SelectItem>
                                <SelectItem value="Spor Kulübü">Spor Kulübü</SelectItem>
                                <SelectItem value="Özel İzinli">Özel İzinli</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Kuruluş Yılı">
                        <Input type="number" value={form.foundationYear ?? ''} onChange={e => set('foundationYear', Number(e.target.value))} />
                    </Field>
                    <Field label="Şeffaflık Puanı (0–100)">
                        <Input type="number" min={0} max={100} value={form.transparencyScore ?? 0} onChange={e => set('transparencyScore', Number(e.target.value))} />
                    </Field>
                    <Field label="Platform Durumu">
                        <Select value={(form as any).status ?? 'Aktif'} onValueChange={v => set('status', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Aktif">Aktif</SelectItem>
                                <SelectItem value="Pasif">Pasif</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Kullanım Amacı">
                        <Select value={form.usagePurpose ?? 'both'} onValueChange={v => set('usagePurpose', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="donation">Sadece Bağış</SelectItem>
                                <SelectItem value="volunteer">Sadece Gönüllülük</SelectItem>
                                <SelectItem value="both">Her İkisi</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="İktisadi İşletme">
                        <Select value={form.economicEnterpriseStatus ?? 'yok'} onValueChange={v => set('economicEnterpriseStatus', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="var">Var</SelectItem>
                                <SelectItem value="yok">Yok</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="İktisadi İşletme URL">
                        <Input value={form.economicEnterpriseUrl ?? ''} onChange={e => set('economicEnterpriseUrl', e.target.value)} />
                    </Field>

                    {/* Logo: file upload (jpg/png) */}
                    <div className="md:col-span-2">
                        <Field label="Logo (JPG / PNG)">
                            <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/20 border-dashed">
                                <div className="h-16 w-16 rounded-lg bg-background border flex items-center justify-center overflow-hidden shrink-0">
                                    {form.avatarUrl ? (
                                        <img src={form.avatarUrl} alt="logo" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2 min-w-0">
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleLogoUpload(f);
                                            if (logoInputRef.current) logoInputRef.current.value = '';
                                        }}
                                    />
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={uploadingLogo}
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {form.avatarUrl ? 'Değiştir' : 'Logo Yükle'}
                                        </Button>
                                        {form.avatarUrl && (
                                            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => set('avatarUrl', '')}>
                                                Kaldır
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">JPG veya PNG, en fazla 5MB.</p>
                                </div>
                            </div>
                        </Field>
                    </div>

                    <div className="md:col-span-2">
                        <Field label="Kapak Fotoğrafı URL">
                            <Input value={form.coverPhotoUrl ?? ''} onChange={e => set('coverPhotoUrl', e.target.value)} />
                        </Field>
                    </div>
                    <div className="md:col-span-2">
                        <Field label="Hakkında">
                            <Textarea rows={5} value={form.about ?? ''} onChange={e => set('about', e.target.value)} />
                        </Field>
                    </div>
                </CardContent>
            </Card>

            {/* İletişim */}
            <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-base">İletişim</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="E-posta">
                        <Input value={c.email ?? ''} onChange={e => set('contact.email', e.target.value)} />
                    </Field>
                    <Field label="Telefon">
                        <Input value={c.phone ?? ''} onChange={e => set('contact.phone', e.target.value)} />
                    </Field>
                    <Field label="Web Sitesi">
                        <Input value={c.website ?? ''} onChange={e => set('contact.website', e.target.value)} />
                    </Field>
                    <Field label="Twitter / X">
                        <Input value={social.twitter ?? ''} onChange={e => set('contact.social.twitter', e.target.value)} placeholder="@kullanici" />
                    </Field>
                    <Field label="Instagram">
                        <Input value={social.instagram ?? ''} onChange={e => set('contact.social.instagram', e.target.value)} placeholder="@kullanici" />
                    </Field>
                    <Field label="Facebook">
                        <Input value={social.facebook ?? ''} onChange={e => set('contact.social.facebook', e.target.value)} />
                    </Field>
                    <Field label="LinkedIn">
                        <Input value={social.linkedin ?? ''} onChange={e => set('contact.social.linkedin', e.target.value)} />
                    </Field>

                    {/* Address: country / city / district / neighborhood as dropdowns */}
                    <Field label="Ülke">
                        <Select
                            value={currentCountry || 'Türkiye'}
                            onValueChange={v => set('contact.address', { ...address, country: v, city: '', district: '', neighborhood: '' })}
                        >
                            <SelectTrigger><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                            <SelectContent className="max-h-72">
                                <SelectItem value="Türkiye">Türkiye</SelectItem>
                                {allCountriesList.filter(c => c.name !== 'Turkey').map(c => (
                                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label={isTurkey ? 'İl' : 'Şehir'}>
                        {cityOptions.length > 0 ? (
                            <Select
                                value={currentCity || ''}
                                onValueChange={v => set('contact.address', { ...address, city: v, district: '', neighborhood: '' })}
                            >
                                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                value={currentCity}
                                onChange={e => set('contact.address', { ...address, city: e.target.value })}
                                placeholder="Şehir girin"
                            />
                        )}
                    </Field>
                    <Field label={isTurkey ? 'İlçe' : 'Bölge'}>
                        {districtOptions.length > 0 ? (
                            <Select
                                value={currentDistrict || ''}
                                onValueChange={v => set('contact.address', { ...address, district: v, neighborhood: '' })}
                                disabled={!currentCity}
                            >
                                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                value={currentDistrict}
                                onChange={e => set('contact.address', { ...address, district: e.target.value })}
                                placeholder="İlçe girin"
                            />
                        )}
                    </Field>
                    <Field label="Mahalle">
                        {isTurkey && neighborhoodOptions.length > 0 ? (
                            <Select
                                value={currentNeighborhood || ''}
                                onValueChange={v => set('contact.address', { ...address, neighborhood: v })}
                                disabled={!currentDistrict}
                            >
                                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {neighborhoodOptions.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                value={currentNeighborhood}
                                onChange={e => set('contact.address', { ...address, neighborhood: e.target.value })}
                                placeholder="Mahalle girin"
                            />
                        )}
                    </Field>
                    <Field label="Açık Adres">
                        <Input
                            value={address.fullAddress ?? ''}
                            onChange={e => set('contact.address', { ...address, fullAddress: e.target.value })}
                            placeholder="Cadde, sokak, bina vb."
                        />
                    </Field>
                    <Field label="Kapı No">
                        <Input
                            value={address.doorNo ?? ''}
                            onChange={e => set('contact.address', { ...address, doorNo: e.target.value })}
                            placeholder="Örn: 12/3"
                        />
                    </Field>
                </CardContent>
            </Card>

            {/* Üyelikler & Alanlar — multi-select */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base">Üyelikler & Alanlar</CardTitle>
                    <p className="text-xs text-muted-foreground">Birden fazla seçenek işaretleyebilirsiniz.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MultiSelect
                        title="Kategoriler"
                        options={CATEGORY_OPTIONS}
                        value={Array.isArray(form.categories)
                            ? form.categories
                            : (form.category ? [form.category] : [])}
                        onChange={v => {
                            set('categories', v);
                            set('category', v.join(', '));
                        }}
                    />
                    <MultiSelect
                        title="Üye Olunan Platformlar"
                        options={MEMBERSHIP_OPTIONS}
                        value={form.memberOf ?? []}
                        onChange={v => set('memberOf', v)}
                    />
                    <MultiSelect
                        title="Federasyonlar"
                        options={FEDERATION_OPTIONS}
                        value={form.federations ?? []}
                        onChange={v => set('federations', v)}
                    />
                    <MultiSelect
                        title="Desteklenen SKA'lar"
                        options={SDG_OPTIONS}
                        value={form.supportedSDGs ?? []}
                        onChange={v => set('supportedSDGs', v)}
                    />
                    <MultiSelect
                        title="Faydalanıcı Gruplar"
                        options={BENEFICIARY_OPTIONS}
                        value={form.beneficiaryGroups ?? []}
                        onChange={v => set('beneficiaryGroups', v)}
                    />
                </CardContent>
            </Card>

            {/* İstatistikler */}
            <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-base">İstatistikler</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {([
                        ['followers', 'Takipçi'],
                        ['donors', 'Bağışçı'],
                        ['volunteers', 'Gönüllü'],
                        ['volunteerHours', 'Gönüllülük Saati'],
                        ['projects', 'Proje'],
                        ['totalDonation', 'Toplam Bağış (₺)'],
                        ['donationCount', 'Bağış İşlem Adedi'],
                        ['avgDonation', 'Ort. Bağış (₺)'],
                        ['highestSingleDonation', 'En Yüksek Tek Bağış (₺)'],
                        ['peopleReached', 'Ulaşılan Kişi'],
                    ] as [string, string][]).map(([key, label]) => (
                        <Field key={key} label={label}>
                            <Input
                                type="number"
                                value={(s as any)[key] ?? 0}
                                onChange={e => set(`stats.${key}`, Number(e.target.value))}
                            />
                        </Field>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>İptal</Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold px-8">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Kaydet
                </Button>
            </div>
        </div>
    );
}
