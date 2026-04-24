'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { NGO } from '@/lib/types';

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
    const [raw, setRaw] = useState(value.join(', '));
    useEffect(() => { setRaw(value.join(', ')); }, [value]);
    return (
        <Input
            value={raw}
            placeholder={placeholder}
            onChange={e => { setRaw(e.target.value); onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean)); }}
        />
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
    const [form, setForm] = useState<Partial<NGO> & { [k: string]: any }>({});
    const [initialized, setInitialized] = useState(false);

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
                cur[keys[i]] = { ...cur[keys[i]] };
                cur = cur[keys[i]];
            }
            cur[keys[keys.length - 1]] = value;
            return copy;
        });
    };

    const handleSave = async () => {
        if (!ngoDocRef) return;
        setSaving(true);
        try {
            await updateDoc(ngoDocRef, form as any);
            toast({ title: 'Kaydedildi', description: 'STK bilgileri güncellendi.' });
            router.back();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Hata', description: e?.message || 'Güncelleme başarısız.' });
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
    const c = (form.contact ?? {}) as any;
    const social = c?.social ?? {};
    const address = c?.address ?? {};

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
                    <Field label="Kategori">
                        <Input value={form.category ?? ''} onChange={e => set('category', e.target.value)} />
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
                    <Field label="Avatar / Logo URL">
                        <Input value={form.avatarUrl ?? ''} onChange={e => set('avatarUrl', e.target.value)} />
                    </Field>
                    <Field label="Kapak Fotoğrafı URL">
                        <Input value={form.coverPhotoUrl ?? ''} onChange={e => set('coverPhotoUrl', e.target.value)} />
                    </Field>
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
                    <div className="md:col-span-2">
                        <Field label="Tam Adres">
                            <Input value={address.fullAddress ?? ''} onChange={e => set('contact.address.fullAddress', e.target.value)} />
                        </Field>
                    </div>
                    <Field label="İl">
                        <Input value={address.city ?? ''} onChange={e => set('contact.address.city', e.target.value)} />
                    </Field>
                    <Field label="İlçe">
                        <Input value={address.district ?? ''} onChange={e => set('contact.address.district', e.target.value)} />
                    </Field>
                </CardContent>
            </Card>

            {/* Üyelikler & Alanlar */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base">Üyelikler & Alanlar</CardTitle>
                    <p className="text-xs text-muted-foreground">Birden fazla değeri virgülle ayırın.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Üye Olunan Platformlar">
                        <TagInput value={form.memberOf ?? []} onChange={v => set('memberOf', v)} placeholder="Hangel, TÜSEV, ..." />
                    </Field>
                    <Field label="Federasyonlar">
                        <TagInput value={form.federations ?? []} onChange={v => set('federations', v)} placeholder="TÜFED, ..." />
                    </Field>
                    <Field label="Desteklenen SKA'lar">
                        <TagInput value={form.supportedSDGs ?? []} onChange={v => set('supportedSDGs', v)} placeholder="SKA 1, SKA 4, ..." />
                    </Field>
                    <Field label="Faydalanıcı Gruplar">
                        <TagInput value={form.beneficiaryGroups ?? []} onChange={v => set('beneficiaryGroups', v)} placeholder="Çocuklar, Gençler, ..." />
                    </Field>
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
