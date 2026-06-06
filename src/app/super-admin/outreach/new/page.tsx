'use client';

/**
 * /super-admin/outreach/new — Manuel yeni kontak ekleme
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
import { ArrowLeft, Loader2 } from 'lucide-react';

const TYPES = [
  { value: 'Vakıf', label: 'Vakıf' },
  { value: 'Dernek', label: 'Dernek' },
  { value: 'SivilToplumMüdürlüğü', label: 'İl Sivil Toplum Müdürlüğü' },
  { value: 'SporKulübü', label: 'Spor Kulübü' },
  { value: 'MailHizmet', label: 'Mail / SMS Hizmet Sağlayıcısı' },
  { value: 'Diğer', label: 'Diğer' },
];

export default function NewOutreachContactPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'Diğer', city: '', district: '',
    phone: '', email: '', website: '', address: '', notes: '',
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
        body: JSON.stringify(form),
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

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/super-admin/outreach"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">Yeni Outreach Kontağı</h1>
      </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>İl</Label><Input value={form.city} onChange={(e) => update('city', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>İlçe</Label><Input value={form.district} onChange={(e) => update('district', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Telefon</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+90 555 123 45 67" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="iletisim@example.com" /></div>
          </div>

          <div className="space-y-1.5"><Label>Web Sitesi</Label><Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" /></div>
          <div className="space-y-1.5"><Label>Adres</Label><Textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Notlar</Label><Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} placeholder="Görüşme geçmişi, hatırlatmalar..." /></div>
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
