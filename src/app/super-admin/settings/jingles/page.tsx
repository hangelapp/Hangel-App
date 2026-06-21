'use client';

/**
 * Süper-admin · Jenerikler & Sesler — çağrı merkezi sesi + 5 hangel jeneriği.
 * Ses dosyaları Firebase Storage'a yüklenir; referanslar siteSettings/jingles'a yazılır.
 * (Gerçek ses içeriği — örn. çocuk korosu jingle'ı — yönetici/AI müzik tarafından sağlanır.)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Upload, Trash2, Music2, PhoneCall } from 'lucide-react';

type Slot = { url: string; name: string } | null;
interface JinglesDoc { callCenter?: Slot; jingles?: Slot[] }

const JINGLE_COUNT = 5;

export default function JinglesSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const docRef = useMemoFirebase(() => (db ? doc(db, COLLECTIONS.siteSettings, 'jingles') : null), [db]);
  const { data } = useDoc<JinglesDoc>(docRef);
  const [busy, setBusy] = useState<string | null>(null);

  const callCenter = data?.callCenter ?? null;
  const jingles: Slot[] = Array.from({ length: JINGLE_COUNT }, (_, i) => data?.jingles?.[i] ?? null);

  const upload = async (slot: string, file: File) => {
    if (!docRef) return;
    if (!file.type.startsWith('audio/')) {
      toast({ variant: 'destructive', title: 'Ses dosyası seç', description: 'Yalnızca ses (mp3/m4a/wav) yüklenebilir.' });
      return;
    }
    setBusy(slot);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const r = storageRef(getStorage(), `jingles/${slot}-${Date.now()}-${safe}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      const entry: Slot = { url, name: file.name };
      if (slot === 'callCenter') {
        await setDoc(docRef, { callCenter: entry }, { merge: true });
      } else {
        const idx = Number(slot.replace('jingle', ''));
        const next = [...jingles]; next[idx] = entry;
        await setDoc(docRef, { jingles: next }, { merge: true });
      }
      toast({ title: 'Yüklendi 🧡', description: file.name });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally { setBusy(null); }
  };

  const remove = async (slot: string) => {
    if (!docRef) return;
    setBusy(slot);
    try {
      if (slot === 'callCenter') {
        await setDoc(docRef, { callCenter: null }, { merge: true });
      } else {
        const idx = Number(slot.replace('jingle', ''));
        const next = [...jingles]; next[idx] = null;
        await setDoc(docRef, { jingles: next }, { merge: true });
      }
      toast({ title: 'Kaldırıldı' });
    } catch {
      toast({ variant: 'destructive', title: 'Kaldırılamadı' });
    } finally { setBusy(null); }
  };

  const SlotRow = ({ slot, entry, label, sub, Icon }: { slot: string; entry: Slot; label: string; sub?: string; Icon: React.ElementType }) => (
    <Card className="rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">{label}</p>
          {sub && <p className="text-xs font-medium text-muted-foreground">{sub}</p>}
          {entry ? (
            <div className="mt-2.5 space-y-2">
              <p className="truncate text-xs text-muted-foreground">{entry.name}</p>
              <audio controls src={entry.url} className="h-9 w-full">
                <track kind="captions" />
              </audio>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy === slot}
                onClick={() => void remove(slot)}>
                {busy === slot ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />} Kaldır
              </Button>
            </div>
          ) : (
            <div className="mt-2.5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3.5 py-2 text-sm font-bold text-primary hover:bg-primary/10">
                {busy === slot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Ses Yükle
                <input type="file" accept="audio/*" className="hidden" disabled={busy === slot}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(slot, f); e.currentTarget.value = ''; }} />
              </label>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="space-y-1.5">
        <Button variant="ghost" size="sm" className="-ml-2 rounded-xl text-muted-foreground" asChild>
          <Link href="/super-admin/settings"><ArrowLeft className="mr-1.5 h-4 w-4" /> Ayarlar</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Jenerikler & Sesler</h1>
        <p className="text-sm font-medium text-muted-foreground">
          Çağrı merkezi karşılama sesi + hangel jenerikleri. Ses dosyalarını buradan yükle.
          (İçerik — örn. çocuk korosu jingle'ı — senin/AI müzik üreticisiyle hazırlanır.)
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Çağrı Merkezi</h2>
        <SlotRow slot="callCenter" entry={callCenter} label="Çağrı Merkezi Karşılama Sesi"
          sub="Arama bağlanınca / beklemede çalar" Icon={PhoneCall} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">hangel Jenerikleri (5)</h2>
        <div className="space-y-3">
          {jingles.map((entry, i) => (
            <SlotRow key={i} slot={`jingle${i}`} entry={entry} label={`Jenerik ${i + 1}`} Icon={Music2} />
          ))}
        </div>
      </section>
    </div>
  );
}
