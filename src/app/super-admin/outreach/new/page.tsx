'use client';

/**
 * /super-admin/outreach/new — Manuel yeni kontak ekleme
 *
 * Form alanları detay panelinin tüm alanlarını kapsar (vakıf+dernek+outreach
 * union). Tür'e göre relevant alanlar görünür/gizlenir.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';

const TYPES = [
  { value: 'Vakıf', label: 'Vakıf' },
  { value: 'Dernek', label: 'Dernek' },
  { value: 'SivilToplumMüdürlüğü', label: 'İl Sivil Toplum Müdürlüğü' },
  { value: 'Federasyon', label: 'Federasyon' },
  { value: 'SporKulübü', label: 'Spor Kulübü' },
  { value: 'GencSporMudurlugu', label: 'Gençlik ve Spor İl Müdürlüğü' },
  { value: 'MailHizmet', label: 'Mail / SMS Hizmet Sağlayıcısı' },
  { value: 'Diğer', label: 'Diğer' },
];

const PLATFORMS = [
  'Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool',
  'HelpSteps', 'Candid', 'Global Compact', 'Idealist', 'gonulluyuzbiz.gov.tr', 'TGSP',
];

export default function NewOutreachContactPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    // Temel
    name: '', shortName: '', type: 'Diğer',
    // İletişim
    phone: '', phone2: '', email: '', etebligat: '', website: '',
    // Adres
    address: '', city: '', district: '', neighborhood: '',
    // Sınıflandırma
    faaliyetAlani: '', detayliFaaliyetAlani: '',
    // Kütük + tarih
    kutukNo: '', kurulusTarihi: '',
    // Kamu Yararı (dernek)
    isKamuYarari: false, kamuYariNo: '', kamuYariTarihi: '',
    // Diğer
    notes: '',
    status: 'active',
  });
  const [platforms, setPlatforms] = useState<Set<string>>(new Set());

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: 'Ad zorunlu', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Giriş gerekli', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/outreach/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, platforms: Array.from(platforms) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Kayıt eklenemedi');
      toast({ title: 'Kontak eklendi' });
      router.push('/super-admin/outreach');
    } catch (e) {
      toast({ title: 'Hata', description: e instanceof Error ? e.message : 'Kayıt eklenemedi', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const showKamuYarari = form.type === 'Dernek';
  const showKutuk = form.type === 'Dernek' || form.type === 'Vakıf';
  const showPlatforms = form.type === 'Dernek' || form.type === 'Vakıf';

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/super-admin/outreach"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">Yeni Outreach Kontağı</h1>
      </div>

      {/* Temel Bilgiler */}
      <Card>
        <CardHeader><CardTitle className="text-base">Temel Bilgiler</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="name">Ad *</Label>
              <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Kuruluş adı" />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select value={form.type} onValueChange={(v) => update('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Kısa Ad</Label>
            <Input value={form.shortName} onChange={(e) => update('shortName', e.target.value)} placeholder="Kısaltma (ör. TEV, KEDV)" />
          </div>
        </CardContent>
      </Card>

      {/* Sınıflandırma */}
      <Card>
        <CardHeader><CardTitle className="text-base">Faaliyet Alanı</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Faaliyet Alanı</Label>
            <Input value={form.faaliyetAlani} onChange={(e) => update('faaliyetAlani', e.target.value)} placeholder="Eğitim, sağlık, çevre, afet..." />
          </div>
          <div className="space-y-1.5">
            <Label>Detaylı Faaliyet Alanı</Label>
            <Textarea value={form.detayliFaaliyetAlani} onChange={(e) => update('detayliFaaliyetAlani', e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* İletişim */}
      <Card>
        <CardHeader><CardTitle className="text-base">İletişim</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Telefon-1</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+90 555 123 45 67" /></div>
            <div className="space-y-1.5"><Label>Telefon-2</Label><Input value={form.phone2} onChange={(e) => update('phone2', e.target.value)} placeholder="+90 …" /></div>
            <div className="space-y-1.5"><Label>E-Posta</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="iletisim@example.com" /></div>
            <div className="space-y-1.5"><Label>E-Tebligat</Label><Input value={form.etebligat} onChange={(e) => update('etebligat', e.target.value)} placeholder="KEP adresi" /></div>
          </div>
          <div className="space-y-1.5"><Label>Web Sitesi</Label><Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" /></div>
        </CardContent>
      </Card>

      {/* Adres */}
      <Card>
        <CardHeader><CardTitle className="text-base">Adres</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label>Açık Adres</Label><Textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>İl</Label><Input value={form.city} onChange={(e) => update('city', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>İlçe</Label><Input value={form.district} onChange={(e) => update('district', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Mahalle</Label><Input value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Kütük + Tarih — sadece Dernek/Vakıf */}
      {showKutuk && (
        <Card>
          <CardHeader><CardTitle className="text-base">Kütük Bilgileri</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Kütük No</Label><Input value={form.kutukNo} onChange={(e) => update('kutukNo', e.target.value)} placeholder="06-154-120" /></div>
              <div className="space-y-1.5"><Label>Kuruluş Tarihi</Label><Input value={form.kurulusTarihi} onChange={(e) => update('kurulusTarihi', e.target.value)} placeholder="YYYY-MM-DD" /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kamu Yararı — sadece Dernek */}
      {showKamuYarari && (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader><CardTitle className="text-base">🏛 Kamu Yararı Statüsü</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <Checkbox checked={form.isKamuYarari} onCheckedChange={(v) => update('isKamuYarari', !!v)} />
              <span>Kamu Yararına Çalışan Dernek</span>
            </label>
            {form.isKamuYarari && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Kamu Yararı No</Label><Input value={form.kamuYariNo} onChange={(e) => update('kamuYariNo', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Kamu Yararı Tarihi</Label><Input value={form.kamuYariTarihi} onChange={(e) => update('kamuYariTarihi', e.target.value)} placeholder="YYYY-MM-DD" /></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Platformlar — Dernek/Vakıf */}
      {showPlatforms && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader><CardTitle className="text-base">Kayıtlı Olduğu Platformlar</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {PLATFORMS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={platforms.has(p)} onCheckedChange={() => togglePlatform(p)} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notlar */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notlar (yalnızca süper-admin görür)</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} placeholder="Görüşme geçmişi, hatırlatmalar..." />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline"><Link href="/super-admin/outreach">İptal</Link></Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Kaydet
        </Button>
      </div>
    </div>
  );
}
