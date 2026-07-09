'use client';

/**
 * Afet Modu (AFAD) — süper-admin global afet/acil anahtarı.
 *
 * `settings/disaster` doc'una yazar: { active, message, updatedAt }. Açıkken tüm
 * gönüllülük ekranlarında (liste + detay) kırmızı "acil çağrı" şeridi görünür
 * (bkz. /volunteering — DisasterBanner). AFAD API entegrasyonu (gerçek-zamanlı
 * afet verisi) sonraki adımda anahtar sağlanınca bu doc'u otomatik besleyecek.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Siren, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function DisasterModePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const ref = useMemoFirebase(() => (db ? doc(db, 'settings', 'disaster') : null), [db]);
  const { data } = useDoc<{ active?: boolean; message?: string }>(ref);

  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setActive(Boolean(data.active));
      setMessage(data.message || '');
    }
  }, [data]);

  const save = async () => {
    if (!db) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'settings', 'disaster'),
        { active, message: message.trim() || 'Acil gönüllülük çağrısı — desteğine şimdi ihtiyaç var.', updatedAt: serverTimestamp() },
        { merge: true },
      );
      toast({ title: active ? 'Afet Modu AÇIK 🚨' : 'Afet Modu kapatıldı', description: 'Değişiklik tüm gönüllülük ekranlarına yansır.' });
    } catch {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: 'Lütfen tekrar dene.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0">
          <Link href="/super-admin/settings" aria-label="Geri"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Siren className="h-6 w-6 text-red-600" /> Afet Modu (AFAD)</h1>
          <p className="text-sm text-muted-foreground">Afet/acil durumunda gönüllü seferberliği — global acil şerit.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-red-600/20">
        <CardHeader>
          <CardTitle className="text-lg">Global Afet Modu</CardTitle>
          <CardDescription>Açıkken tüm gönüllülük ekranlarının üstünde kırmızı acil çağrı şeridi görünür.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <span className="font-semibold">Afet Modu {active ? '— AÇIK' : '— kapalı'}</span>
            <Switch checked={active} onCheckedChange={setActive} aria-label="Afet Modu" />
          </label>
          <div className="space-y-2">
            <label htmlFor="disaster-msg" className="text-sm font-medium">Acil şerit mesajı</label>
            <Input
              id="disaster-msg"
              placeholder="Acil gönüllülük çağrısı — desteğine şimdi ihtiyaç var."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button onClick={save} disabled={saving} className="w-full h-11 rounded-xl font-bold">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Kaydet'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Not: Gerçek-zamanlı AFAD API entegrasyonu (otomatik afet tetikleme) anahtar sağlandığında bu anahtarı besleyecek şekilde bağlanacak.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
