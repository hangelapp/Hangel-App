'use client';

/**
 * Süper-admin · Jenerikler & Sesler.
 * 3 bölüm: Çağrı Merkezi Anonsları (5, umut veren) · Çocuk Sesleri (5, sevimli) ·
 * Sözsüz Müzik Jenerikleri (3, enstrümantal). Sesler scripts/generate-*.mjs ile
 * üretilir; bu sayfadan manuel yükleme/oynatma/kaldırma da yapılabilir.
 * Referanslar Storage'a yüklenip siteSettings/jingles'a yazılır.
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
import { ArrowLeft, Loader2, Upload, Trash2, Music2, PhoneCall, Baby } from 'lucide-react';

type Slot = { url: string; name: string } | null;
interface JinglesDoc { santral?: Slot[]; cocuk?: Slot[]; muzik?: Slot[] }

const SECTIONS = [
  { key: 'santral', title: 'Çağrı Merkezi Anonsları', sub: 'Umut veren, heyecanlandıran karşılama', short: 'Anons', count: 5, Icon: PhoneCall },
  { key: 'cocuk', title: 'Çocuk Sesleri', sub: 'Sevimli, dili dönmeyen anonslar', short: 'Çocuk', count: 5, Icon: Baby },
  { key: 'muzik', title: 'Sözsüz Müzik Jenerikleri', sub: 'Enstrümantal jenerik (çan + pad)', short: 'Müzik', count: 3, Icon: Music2 },
] as const;

export default function JinglesSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const docRef = useMemoFirebase(() => (db ? doc(db, COLLECTIONS.siteSettings, 'jingles') : null), [db]);
  const { data } = useDoc<JinglesDoc>(docRef);
  const [busy, setBusy] = useState<string | null>(null);

  const arrOf = (key: keyof JinglesDoc, count: number): Slot[] =>
    Array.from({ length: count }, (_, i) => (data?.[key]?.[i]) ?? null);

  const save = async (key: keyof JinglesDoc, idx: number, value: Slot) => {
    if (!docRef) return;
    const section = SECTIONS.find((s) => s.key === key)!;
    const arr = arrOf(key, section.count);
    arr[idx] = value;
    await setDoc(docRef, { [key]: arr.map((x) => x ?? null) }, { merge: true });
  };

  const upload = async (key: keyof JinglesDoc, idx: number, file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({ variant: 'destructive', title: 'Ses dosyası seç', description: 'Yalnızca ses (mp3/m4a/wav) yüklenebilir.' });
      return;
    }
    const slotId = `${key}${idx}`;
    setBusy(slotId);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const r = storageRef(getStorage(), `jingles/${slotId}-${Date.now()}-${safe}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      await save(key, idx, { url, name: file.name });
      toast({ title: 'Yüklendi 🧡', description: file.name });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally { setBusy(null); }
  };

  const remove = async (key: keyof JinglesDoc, idx: number) => {
    const slotId = `${key}${idx}`;
    setBusy(slotId);
    try { await save(key, idx, null); toast({ title: 'Kaldırıldı' }); }
    catch { toast({ variant: 'destructive', title: 'Kaldırılamadı' }); }
    finally { setBusy(null); }
  };

  const SlotRow = ({ sectionKey, idx, label, Icon }: { sectionKey: keyof JinglesDoc; idx: number; label: string; Icon: React.ElementType }) => {
    const entry = (data?.[sectionKey]?.[idx]) ?? null;
    const slotId = `${sectionKey}${idx}`;
    return (
      <Card className="rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">{label}</p>
            {entry ? (
              <div className="mt-2.5 space-y-2">
                <p className="truncate text-xs text-muted-foreground">{entry.name}</p>
                <audio controls src={entry.url} className="h-9 w-full">
                  <track kind="captions" />
                </audio>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy === slotId}
                  onClick={() => void remove(sectionKey, idx)}>
                  {busy === slotId ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />} Kaldır
                </Button>
              </div>
            ) : (
              <div className="mt-2.5">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3.5 py-2 text-sm font-bold text-primary hover:bg-primary/10">
                  {busy === slotId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Ses Yükle
                  <input type="file" accept="audio/*" className="hidden" disabled={busy === slotId}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(sectionKey, idx, f); e.currentTarget.value = ''; }} />
                </label>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-7">
      <div className="space-y-1.5">
        <Button variant="ghost" size="sm" className="-ml-2 rounded-xl text-muted-foreground" asChild>
          <Link href="/super-admin/settings"><ArrowLeft className="mr-1.5 h-4 w-4" /> Ayarlar</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Jenerikler & Sesler</h1>
        <p className="text-sm font-medium text-muted-foreground">
          Çağrı merkezi anonsları, çocuk sesleri ve sözsüz müzik jenerikleri. Sesler otomatik üretildi;
          istersen herhangi bir slota kendi dosyanı da yükleyebilirsin.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.key} className="space-y-3">
          <div>
            <h2 className="text-sm font-black tracking-tight">{section.title}</h2>
            <p className="text-xs font-medium text-muted-foreground">{section.sub}</p>
          </div>
          <div className="space-y-3">
            {Array.from({ length: section.count }, (_, i) => (
              <SlotRow key={i} sectionKey={section.key} idx={i} label={`${section.short} ${i + 1}`} Icon={section.Icon} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
