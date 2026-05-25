'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, ShieldCheck, Database, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COLLECTIONS } from '@/firebase/collections';

type ScoringItem = {
  id: string;
  taskType: string;            // "Öğretmenlik", "Boyama" gibi iş kalemi
  pointsPerHour: number;       // Bir saatlik gönüllülük için kazandırılan etki puanı
  manHourCost: number;         // Bir saat bu işin piyasa adam-saat maliyeti (TL)
  description?: string;
  isActive: boolean;
  order: number;
};

type FormData = Omit<ScoringItem, 'id'>;

const SEED_DATA: FormData[] = [
  { taskType: 'Öğretmenlik / Eğitim Verme', pointsPerHour: 100, manHourCost: 200, isActive: true, order: 1, description: 'Çocuklara/yetişkinlere ders, atölye, kurs verme.' },
  { taskType: 'Danışmanlık', pointsPerHour: 80, manHourCost: 250, isActive: true, order: 2, description: 'Mesleki/uzman danışmanlık desteği.' },
  { taskType: 'Tercümanlık / Çeviri', pointsPerHour: 70, manHourCost: 180, isActive: true, order: 3, description: 'Yazılı veya sözlü çeviri desteği.' },
  { taskType: 'Hukuki Destek', pointsPerHour: 100, manHourCost: 300, isActive: true, order: 4, description: 'Pro-bono hukuki danışmanlık ve süreç yönetimi.' },
  { taskType: 'Sağlık Desteği', pointsPerHour: 90, manHourCost: 220, isActive: true, order: 5, description: 'Sağlık taramaları, ilk yardım, hemşirelik desteği.' },
  { taskType: 'Mentorluk / Koçluk', pointsPerHour: 80, manHourCost: 200, isActive: true, order: 6, description: 'Genç/girişimci mentorluğu, kariyer koçluğu.' },
  { taskType: 'Web / Yazılım Desteği', pointsPerHour: 80, manHourCost: 200, isActive: true, order: 7, description: 'STK web sitesi, dijital araç ve sistem desteği.' },
  { taskType: 'Tasarım / Görsel İletişim', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 8, description: 'Logo, afiş, sosyal medya görselleri.' },
  { taskType: 'Sosyal Medya / İletişim', pointsPerHour: 50, manHourCost: 100, isActive: true, order: 9, description: 'İçerik üretimi, hesap yönetimi, paylaşım planlama.' },
  { taskType: 'Etkinlik Organizasyonu', pointsPerHour: 50, manHourCost: 100, isActive: true, order: 10, description: 'Etkinlik koordinasyonu, lojistik, saha düzeni.' },
  { taskType: 'Anlık Müdahale (Afet)', pointsPerHour: 100, manHourCost: 250, isActive: true, order: 11, description: 'Afet bölgesinde acil müdahale, arama-kurtarma desteği.' },
  { taskType: 'Yardım Dağıtımı', pointsPerHour: 30, manHourCost: 50, isActive: true, order: 12, description: 'Gıda, giysi, kit dağıtımı saha çalışması.' },
  { taskType: 'Boyama / Tadilat', pointsPerHour: 50, manHourCost: 80, isActive: true, order: 13, description: 'Okul, barınak vb. mekan boyama, küçük tadilat.' },
  { taskType: 'Temizlik', pointsPerHour: 30, manHourCost: 60, isActive: true, order: 14, description: 'Mekan temizliği veya çevre temizliği.' },
  { taskType: 'Doğa / Çevre Çalışması', pointsPerHour: 40, manHourCost: 70, isActive: true, order: 15, description: 'Ağaçlandırma, sahil temizliği, biyoçeşitlilik.' },
  { taskType: 'Hayvan Bakımı', pointsPerHour: 40, manHourCost: 70, isActive: true, order: 16, description: 'Sokak/barınak hayvanlarına bakım, mama dağıtımı.' },
  { taskType: 'Yaşlı Bakımı', pointsPerHour: 50, manHourCost: 90, isActive: true, order: 17, description: 'Refakat, sosyal aktivite, evde destek.' },
  { taskType: 'Çocuk Bakımı / Refakat', pointsPerHour: 50, manHourCost: 90, isActive: true, order: 18, description: 'Çocuk refakatı, hastane, etkinlik desteği.' },
  { taskType: 'Veri Girişi / Arşivleme', pointsPerHour: 25, manHourCost: 50, isActive: true, order: 19, description: 'Form girişi, veri tabanı düzenleme, arşivleme.' },
  { taskType: 'Saha Görevlisi (Genel)', pointsPerHour: 30, manHourCost: 60, isActive: true, order: 20, description: 'Genel saha desteği, görev rotasyonu.' },
];

const Editor = ({ initial, onSave, trigger }: {
  initial?: ScoringItem;
  onSave: (data: FormData, id?: string) => Promise<void>;
  trigger: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<FormData>(initial || {
    taskType: '', pointsPerHour: 0, manHourCost: 0, description: '', isActive: true, order: 999,
  });
  const [saving, setSaving] = useState(false);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) {
      setData(initial || { taskType: '', pointsPerHour: 0, manHourCost: 0, description: '', isActive: true, order: 999 });
    }
  };

  const handleSave = async () => {
    if (!data.taskType.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...data, taskType: data.taskType.trim() }, initial?.id);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Kalemi Düzenle' : 'Yeni İş Kalemi Ekle'}</DialogTitle>
          <DialogDescription>
            Gönüllülük ilanlarında seçilebilen iş kalemi; etki puanı ve adam-saat maliyetini buradan yönet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>İş Kalemi Adı *</Label>
            <Input value={data.taskType} onChange={e => setData({ ...data, taskType: e.target.value })} placeholder="Örn: Öğretmenlik" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Saat Başı Etki Puanı *</Label>
              <Input
                type="number"
                min={0}
                value={data.pointsPerHour}
                onChange={e => setData({ ...data, pointsPerHour: Number(e.target.value) || 0 })}
                placeholder="Örn: 80"
              />
              <p className="text-[10px] text-muted-foreground">Bir saatlik gönüllülük için kazandırılır.</p>
            </div>
            <div className="space-y-2">
              <Label>Adam-Saat Maliyeti (₺) *</Label>
              <Input
                type="number"
                min={0}
                value={data.manHourCost}
                onChange={e => setData({ ...data, manHourCost: Number(e.target.value) || 0 })}
                placeholder="Örn: 200"
              />
              <p className="text-[10px] text-muted-foreground">Sosyal etki mali değer hesaplamasında kullanılır.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Açıklama (opsiyonel)</Label>
            <Input
              value={data.description || ''}
              onChange={e => setData({ ...data, description: e.target.value })}
              placeholder="Bu kalem hangi tür işleri kapsar?"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input
                type="number"
                value={data.order}
                onChange={e => setData({ ...data, order: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end justify-between gap-3 p-3 border rounded-lg">
              <Label className="font-medium">Aktif</Label>
              <Switch checked={data.isActive} onCheckedChange={(v) => setData({ ...data, isActive: v })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving || !data.taskType.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function VolunteerScoringPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  const itemsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.volunteerScoring), orderBy('order', 'asc')) : null),
    [db],
  );
  const { data: items, isLoading } = useCollection<ScoringItem>(itemsQuery);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(i => i.taskType.toLowerCase().includes(q));
  }, [items, search]);

  const handleSave = async (data: FormData, id?: string) => {
    try {
      if (id) {
        await updateDoc(doc(db, COLLECTIONS.volunteerScoring, id), { ...data, updatedAt: serverTimestamp() });
        toast({ title: 'Güncellendi', description: `${data.taskType} kaydedildi.` });
      } else {
        await addDoc(collection(db, COLLECTIONS.volunteerScoring), {
          ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        toast({ title: 'Eklendi', description: `${data.taskType} kataloğa eklendi.` });
      }
    } catch (e) {
      const err = e as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: err.code === 'permission-denied'
          ? 'Bu işlem için süper-admin yetkisi gerekli.'
          : (err.message || 'Beklenmeyen bir hata oluştu.'),
      });
    }
  };

  const handleDelete = async (item: ScoringItem) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.volunteerScoring, item.id));
      toast({ title: 'Silindi', description: `${item.taskType} kataloğdan kaldırıldı.` });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Silinemedi',
        description: err.code === 'permission-denied'
          ? 'Bu işlem için süper-admin yetkisi gerekli.'
          : (err.message || 'Beklenmeyen hata.'),
      });
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      // Seed yalnızca koleksiyon BOŞSA çalışsın — duplicate olmasın.
      if ((items?.length || 0) > 0) {
        toast({ variant: 'destructive', title: 'Zaten veri var', description: 'Önce mevcut katalogu temizleyin ya da elle ekleyin.' });
        return;
      }
      for (const it of SEED_DATA) {
        const ref = doc(collection(db, COLLECTIONS.volunteerScoring));
        await setDoc(ref, { ...it, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      toast({ title: 'Katalog dolduruldu', description: `${SEED_DATA.length} varsayılan iş kalemi eklendi.` });
    } catch (e) {
      const err = e as { message?: string };
      toast({ variant: 'destructive', title: 'Seed hatası', description: err.message || 'Beklenmeyen hata.' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" aria-label="Geri">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Gönüllülük Puantajı</h1>
          <p className="text-sm text-muted-foreground">
            STK gönüllülük ilanlarının saat başı etki puanı + adam-saat maliyeti merkezi olarak buradan yönetilir.
          </p>
        </div>
      </div>

      <Card className="bg-amber-50/40 border-amber-200">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-bold">Süper-Admin Politikası</p>
            <p className="text-muted-foreground">
              STK yöneticileri ilan açarken artık puan giremez; bu kataloğdan iş kalemi seçer.
              Puan = saat başı puan × tahmini gönüllülük süresi (saat).
              Adam-saat maliyeti, kullanıcının "Sosyal Etki Mali Değeri" hesabında kullanılır.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>İş Kalemleri Kataloğu</CardTitle>
            <CardDescription>
              Süper-admin yeni kalem ekleyebilir, mevcut kalemlerin puan ve adam-saat maliyetini değiştirebilir.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {(!items || items.length === 0) && (
              <Button variant="outline" onClick={handleSeed} disabled={seeding}>
                {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                Varsayılanları Yükle ({SEED_DATA.length})
              </Button>
            )}
            <Editor
              onSave={handleSave}
              trigger={
                <Button><Plus className="mr-2 h-4 w-4" /> Yeni Kalem Ekle</Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İş kalemi adı ile ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Kayıtlı iş kalemi yok. "Varsayılanları Yükle" ile başlayabilirsin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>İş Kalemi</TableHead>
                    <TableHead className="text-right">Saat / Puan</TableHead>
                    <TableHead className="text-right">Adam-Saat (₺)</TableHead>
                    <TableHead className="text-center w-20">Durum</TableHead>
                    <TableHead className="text-right w-32">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.taskType}</div>
                        {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {item.pointsPerHour.toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {item.manHourCost.toLocaleString('tr-TR')} ₺
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.isActive ? 'default' : 'outline'} className="text-[10px]">
                          {item.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Editor
                            initial={item}
                            onSave={handleSave}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>İş kalemini silmek istediğine emin misin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <span className="font-bold">{item.taskType}</span> kataloğdan kaldırılacak. STK yöneticileri bu kalemi yeni ilanlarda seçemez. Eski ilanlardaki kayıtlı puan değişmez.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                <AlertDialogAction
                                  className={cn(buttonVariants({ variant: 'destructive' }))}
                                  onClick={() => handleDelete(item)}>
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <Link href="/super-admin/settings" className="hover:underline">← Panel Ayarları'na dön</Link>
      </div>
    </div>
  );
}
