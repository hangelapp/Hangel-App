'use client';

/**
 * Süper-admin STK düzenleme sayfasına gömülü ŞEFFAFLIK editörü.
 *
 * STK'nın şeffaflık endeksi kriterlerini (belge/link/metin/çoklu-seçim) süper-admin
 * adına düzenler. Belgeler Storage'a `transparency/{ownerUid}/...` altına yüklenir
 * (storage.rules süper-admin'e izin verir). Kriterler ise Firestore'da owner-only
 * yazılabildiğinden /api/super-admin/transparency/save (Admin SDK) ile kaydedilir;
 * route ayrıca NGO transparencyScore'unu yeniden hesaplar.
 */

import { useEffect, useMemo, useState } from 'react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Upload, Loader2, ExternalLink, Save, AlertTriangle } from 'lucide-react';

interface CriteriaItem {
  id: number;
  name: string;
  points: number;
  isCompleted: boolean;
  type: 'document' | 'link' | 'text' | 'document-link' | 'multi-select';
  fileName?: string;
  fileUrl?: string;
  storagePath?: string;
  linkUrl?: string;
  textValue?: string;
  selectedOptions?: string[];
  options?: string[];
  updatedAt?: string;
  status?: 'pending' | 'approved';
}

const MEMBERSHIP_OPTIONS = [
  'Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool',
  'HelpSteps', 'Candid', 'Global Compact', 'Idealist', 'www.gonulluyuzbiz.gov.tr',
  'TGSP', 'Diğer',
];

const defaultCriteria: CriteriaItem[] = [
  { id: 1, name: 'Faaliyet Belgesi', points: 10, isCompleted: false, type: 'document' },
  { id: 2, name: 'Tüzük / Vakıf Senedi', points: 10, isCompleted: false, type: 'document' },
  { id: 3, name: 'Yönetim Kurulu Listesi', points: 5, isCompleted: false, type: 'document-link' },
  { id: 4, name: 'Yıllık Faaliyet Raporu', points: 10, isCompleted: false, type: 'document-link' },
  { id: 5, name: 'Finansal Tablolar', points: 10, isCompleted: false, type: 'document-link' },
  { id: 6, name: 'Bağımsız Denetim Raporu', points: 10, isCompleted: false, type: 'document-link' },
  { id: 7, name: 'Etki Raporu', points: 10, isCompleted: false, type: 'document-link' },
  { id: 8, name: 'Web Sitesi', points: 5, isCompleted: false, type: 'link' },
  { id: 9, name: 'Posta Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 10, name: 'Ofis Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 11, name: 'E-posta Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 12, name: 'Telefon Numarası', points: 5, isCompleted: false, type: 'text' },
  { id: 13, name: 'Açık Açık Üyeliği', points: 5, isCompleted: false, type: 'link' },
  { id: 14, name: 'Afet Platformu Üyeliği', points: 5, isCompleted: false, type: 'multi-select', options: MEMBERSHIP_OPTIONS },
];

const mergeWithDefaults = (saved: CriteriaItem[] | undefined): CriteriaItem[] => {
  if (!saved || saved.length === 0) return defaultCriteria.map(c => ({ ...c }));
  const byId = new Map(saved.map(c => [c.id, c]));
  return defaultCriteria.map(def => ({ ...def, ...(byId.get(def.id) || {}) }));
};

export default function TransparencyEditor({ ngoId, ownerUid, ngoName }: { ngoId: string; ownerUid: string | null; ngoName?: string }) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const tRef = useMemoFirebase(
    () => (firestore && ownerUid ? doc(firestore, COLLECTIONS.transparency, ownerUid) : null),
    [firestore, ownerUid],
  );
  const { data: tData, isLoading } = useDoc<{ criteria?: CriteriaItem[] }>(tRef);

  const [criteria, setCriteria] = useState<CriteriaItem[]>(defaultCriteria);
  const [hydrated, setHydrated] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated && ownerUid && !isLoading) {
      setCriteria(mergeWithDefaults(tData?.criteria));
      setHydrated(true);
    }
  }, [hydrated, ownerUid, isLoading, tData]);

  const totalPoints = useMemo(() => criteria.reduce((s, c) => s + c.points, 0), [criteria]);
  const currentPoints = useMemo(() => criteria.filter(c => c.isCompleted).reduce((s, c) => s + c.points, 0), [criteria]);

  const patch = (id: number, changes: Partial<CriteriaItem>) =>
    setCriteria(prev => prev.map(c => (c.id === id ? { ...c, ...changes } : c)));

  const handleUpload = async (item: CriteriaItem, file: File) => {
    if (!ownerUid) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 10MB.' });
      return;
    }
    setUploadingId(item.id);
    try {
      const storage = getStorage();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `transparency/${ownerUid}/${item.id}-${Date.now()}-${safe}`;
      const r = storageRef(storage, path);
      await uploadBytes(r, file, { contentType: file.type || 'application/octet-stream' });
      const url = await getDownloadURL(r);
      patch(item.id, { isCompleted: true, fileName: file.name, fileUrl: url, storagePath: path });
      toast({ title: 'Yüklendi', description: `"${file.name}" eklendi. Kaydete basın.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Yükleme hatası';
      toast({ variant: 'destructive', title: 'Yükleme başarısız', description: msg });
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async () => {
    if (!ngoId) return;
    setSaving(true);
    try {
      const token = await authUser?.getIdToken();
      const res = await fetch('/api/super-admin/transparency/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ngoId, ownerUid, criteria }),
      });
      const data = await res.json().catch(() => null) as { score?: number; message?: string } | null;
      if (!res.ok) throw new Error(data?.message || 'Kaydedilemedi');
      toast({ title: 'Şeffaflık kaydedildi', description: `STK şeffaflık puanı: ${data?.score ?? currentPoints}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : 'Kaydedilemedi' });
    } finally {
      setSaving(false);
    }
  };

  if (!ownerUid) {
    return (
      <Card className="rounded-2xl border-amber-300/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Şeffaflık Endeksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p>Bu STK&apos;ya bağlı bir yönetici hesabı bulunamadı. Şeffaflık bilgileri yönetici hesabına bağlandığından, önce başvuru onayı/yönetici ataması ile bir hesap bağlanmalı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Şeffaflık Endeksi</CardTitle>
          <Badge className="font-black px-3 py-1">{currentPoints} / {totalPoints} puan</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{ngoName ? `${ngoName} — ` : ''}Belge yükle, link/metin gir, işaretle. Süper-admin düzenlemeleri doğrudan onaylı sayılır.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && !hydrated ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : criteria.map(item => {
          const canUpload = item.type === 'document' || item.type === 'document-link';
          const canLink = item.type === 'link' || item.type === 'document-link';
          const isText = item.type === 'text';
          const isMulti = item.type === 'multi-select';
          return (
            <div key={item.id} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    id={`tcrit-${item.id}`}
                    checked={item.isCompleted}
                    onCheckedChange={(v) => patch(item.id, { isCompleted: !!v })}
                  />
                  <Label htmlFor={`tcrit-${item.id}`} className="text-sm font-semibold cursor-pointer truncate">{item.name}</Label>
                </div>
                <Badge variant="outline" className="shrink-0 font-bold">+{item.points}</Badge>
              </div>

              <div className="pl-6 space-y-2">
                {canUpload && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      id={`tfile-${item.id}`}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(item, f); e.target.value = ''; }}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingId === item.id} onClick={() => document.getElementById(`tfile-${item.id}`)?.click()}>
                      {uploadingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {item.fileUrl ? 'Belgeyi Değiştir' : 'Belge Yükle'}
                    </Button>
                    {item.fileUrl && (
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-[180px]">
                        <ExternalLink className="h-3 w-3 shrink-0" />{item.fileName || 'Belge'}
                      </a>
                    )}
                  </div>
                )}
                {canLink && (
                  <Input
                    value={item.linkUrl ?? ''}
                    placeholder="https://... (link)"
                    className="h-9"
                    onChange={(e) => patch(item.id, { linkUrl: e.target.value, isCompleted: item.isCompleted || !!e.target.value.trim() })}
                  />
                )}
                {isText && (
                  <Input
                    value={item.textValue ?? ''}
                    placeholder="Bilgi girin"
                    className="h-9"
                    onChange={(e) => patch(item.id, { textValue: e.target.value, isCompleted: !!e.target.value.trim() })}
                  />
                )}
                {isMulti && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {(item.options || MEMBERSHIP_OPTIONS).map(opt => {
                      const sel = item.selectedOptions || [];
                      const checked = sel.includes(opt);
                      return (
                        <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = v ? [...sel, opt] : sel.filter(o => o !== opt);
                              patch(item.id, { selectedOptions: next, isCompleted: next.length > 0 });
                            }}
                          />
                          <span className="truncate">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Şeffaflığı Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
