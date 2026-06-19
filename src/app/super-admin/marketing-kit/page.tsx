'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Loader2,
  Upload,
  Trash2,
  Pencil,
  Download,
  Megaphone,
  Globe,
  FileText,
  ImageOff,
  CheckCircle2,
  Eye,
  EyeOff,
  PackagePlus,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLLECTIONS } from '@/firebase/collections';
import {
  MARKETING_CATEGORIES,
  MARKETING_TARGET_KINDS,
  MARKETING_MAX_FILE_MB,
  MARKETING_FILE_ACCEPT,
  MARKETING_THUMB_ACCEPT,
  categoryLabel,
  targetKindLabel,
  MARKETING_STARTER_PACK,
  MARKETING_ASSET_BASE,
  type MarketingAsset,
  type MarketingCategory,
  type MarketingTargetKind,
} from '@/lib/marketing-kit';

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

type FormState = {
  title: string;
  description: string;
  category: MarketingCategory;
  targetKinds: MarketingTargetKind[];
  isPublic: boolean;
  status: 'taslak' | 'yayinda';
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  category: 'sunum',
  targetKinds: ['ngo', 'brand', 'club'],
  isPublic: false,
  status: 'taslak',
};

export default function MarketingKitPage() {
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const assetsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.marketingAssets), [db]);
  const { data: assets, isLoading, error: assetsError } = useCollection<MarketingAsset>(assetsQuery);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingAsset | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<MarketingAsset | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [previewing, setPreviewing] = useState<MarketingAsset | null>(null);

  const permError = useMemo(() => {
    if (!assetsError) return null;
    const code = (assetsError as { code?: string } | null)?.code;
    return code === 'permission-denied'
      ? 'Bu sayfa için super-admin yetkisi gerekli. (Firestore: marketingAssets erişimi reddedildi.)'
      : (assetsError instanceof Error ? assetsError.message : 'Materyaller yüklenemedi.');
  }, [assetsError]);

  const sorted = useMemo(() => {
    if (!assets) return [];
    return [...assets].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [assets]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setThumb(null);
    setDialogOpen(true);
  };

  const openEdit = (a: MarketingAsset) => {
    setEditing(a);
    setForm({
      title: a.title || '',
      description: a.description || '',
      category: a.category || 'diger',
      targetKinds: a.targetKinds?.length ? a.targetKinds : ['ngo', 'brand', 'club'],
      isPublic: !!a.isPublic,
      status: a.status === 'yayinda' ? 'yayinda' : 'taslak',
    });
    setFile(null);
    setThumb(null);
    setDialogOpen(true);
  };

  const toggleKind = (kind: MarketingTargetKind) => {
    setForm((f) => ({
      ...f,
      targetKinds: f.targetKinds.includes(kind)
        ? f.targetKinds.filter((k) => k !== kind)
        : [...f.targetKinds, kind],
    }));
  };

  const uploadToStorage = async (f: File, sub: string): Promise<{ url: string; path: string }> => {
    const storage = getStorage();
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `marketing-assets/${sub}/${Date.now()}-${safe}`;
    const r = storageRef(storage, path);
    await uploadBytes(r, f, { contentType: f.type || 'application/octet-stream' });
    const url = await getDownloadURL(r);
    return { url, path };
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ variant: 'destructive', title: 'Başlık gerekli', description: 'Lütfen materyale bir başlık verin.' });
      return;
    }
    if (!editing && !file) {
      toast({ variant: 'destructive', title: 'Dosya gerekli', description: 'Yeni materyal için indirilecek bir dosya yükleyin.' });
      return;
    }
    if (form.targetKinds.length === 0 && !form.isPublic) {
      toast({ variant: 'destructive', title: 'Hedef seçilmedi', description: 'En az bir hedef kitle seçin veya "Herkese açık" işaretleyin.' });
      return;
    }
    const maxBytes = MARKETING_MAX_FILE_MB * 1024 * 1024;
    if (file && file.size > maxBytes) {
      toast({ variant: 'destructive', title: 'Dosya çok büyük', description: `En fazla ${MARKETING_MAX_FILE_MB}MB yükleyebilirsiniz.` });
      return;
    }
    if (thumb && thumb.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Önizleme görseli çok büyük', description: 'Önizleme görseli en fazla 5MB olabilir.' });
      return;
    }

    setSaving(true);
    try {
      const publicListed = form.status === 'yayinda' && form.isPublic;
      const base: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        targetKinds: form.targetKinds,
        isPublic: form.isPublic,
        publicListed,
        status: form.status,
        updatedAt: new Date().toISOString(),
      };

      if (file) {
        const { url, path } = await uploadToStorage(file, form.category);
        base.fileUrl = url;
        base.storagePath = path;
        base.fileName = file.name;
        base.fileSize = file.size;
        base.contentType = file.type || 'application/octet-stream';
      }
      if (thumb) {
        const { url, path } = await uploadToStorage(thumb, 'thumbnails');
        base.thumbnailUrl = url;
        base.thumbnailPath = path;
      }

      if (editing) {
        await updateDoc(doc(db, COLLECTIONS.marketingAssets, editing.id), base);
        toast({ title: 'Materyal güncellendi', description: `${form.title} kaydedildi.` });
      } else {
        await addDoc(collection(db, COLLECTIONS.marketingAssets), {
          ...base,
          createdBy: currentUser?.uid || null,
          createdAt: new Date().toISOString(),
        });
        toast({ title: 'Materyal eklendi', description: `${form.title} ${form.status === 'yayinda' ? 'yayına alındı' : 'taslak olarak kaydedildi'}.` });
      }
      setDialogOpen(false);
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: code === 'permission-denied' ? 'Bu işlem için super-admin yetkisi gerekli.' : message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (a: MarketingAsset) => {
    const next = a.status === 'yayinda' ? 'taslak' : 'yayinda';
    try {
      await updateDoc(doc(db, COLLECTIONS.marketingAssets, a.id), {
        status: next,
        publicListed: next === 'yayinda' && !!a.isPublic,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: next === 'yayinda' ? 'Yayına alındı' : 'Taslağa alındı',
        description: next === 'yayinda'
          ? `${a.title} artık hedef panellerde görünür.`
          : `${a.title} panellerden kaldırıldı.`,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({ variant: 'destructive', title: 'Durum güncellenemedi', description: message });
    }
  };

  // Başlangıç paketi — hazır hangel materyallerini TASLAK olarak içe aktarır.
  // seedKey ile mükerrer önlenir; sadece eksik olanlar eklenir. Dosyalar
  // public/marketing-kit/ altında statik servis edilir (deploy ile yayında).
  const handleImportStarterPack = async () => {
    setSeeding(true);
    const existingKeys = new Set((assets || []).map((a) => a.seedKey).filter(Boolean));
    let created = 0;
    try {
      for (const item of MARKETING_STARTER_PACK) {
        if (existingKeys.has(item.seedKey)) continue;
        const now = new Date().toISOString();
        await addDoc(collection(db, COLLECTIONS.marketingAssets), {
          title: item.title,
          description: item.description,
          category: item.category,
          fileUrl: `${MARKETING_ASSET_BASE}${item.fileName}`,
          storagePath: '',
          fileName: item.fileName,
          contentType: item.contentType,
          thumbnailUrl: item.thumbnailFile ? `${MARKETING_ASSET_BASE}${item.thumbnailFile}` : null,
          targetKinds: item.targetKinds,
          isPublic: item.isPublic,
          publicListed: false, // taslak — yayınlanınca türetilir
          status: 'taslak',
          seedKey: item.seedKey,
          createdBy: currentUser?.uid || null,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
      toast({
        title: created > 0 ? 'Başlangıç paketi eklendi' : 'Hepsi zaten ekli',
        description: created > 0
          ? `${created} materyal TASLAK olarak eklendi. Her birini “Yayınla” ile onaylayın.`
          : 'Başlangıç paketindeki tüm materyaller zaten mevcut.',
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'İçe aktarılamadı',
        description: code === 'permission-denied' ? 'Bu işlem için super-admin yetkisi gerekli.' : message,
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (a: MarketingAsset) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.marketingAssets, a.id));
      toast({ variant: 'destructive', title: 'Materyal silindi', description: `${a.title} kaldırıldı.` });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({ variant: 'destructive', title: 'Silinemedi', description: message });
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tanıtım Araçları Yükleniyor...</p>
      </div>
    );
  }

  const publishedCount = sorted.filter((a) => a.status === 'yayinda').length;
  const publicCount = sorted.filter((a) => a.publicListed).length;

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Tanıtım Araçları</h1>
          <p className="text-muted-foreground text-sm font-medium">
            hangel’i tanıtacak tüm materyalleri yönetin: profesyonel sunum, 15 günlük sosyal medya içerikleri,
            döner kartlar, mağaza içi ekipmanlar, kasa önü A5 kartlar, örümcek stand görselleri. Yayına aldığınızda
            STK, marka ve kulüp panellerinde indirilebilir; herkese açık işaretlediklerinizi konferanslarda
            <a href="/tanitim" target="_blank" className="text-primary font-bold"> /tanitim</a> sayfasından açabilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Button asChild variant="outline" className="rounded-xl font-bold h-11 px-4">
            <Link href="/super-admin/marketing-kit/tanitim">
              <Globe className="mr-2 h-4 w-4" /> Konferans Sayfası
            </Link>
          </Button>
          <Button variant="outline" className="rounded-xl font-bold h-11 px-4" onClick={handleImportStarterPack} disabled={seeding}>
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
            Başlangıç Paketi
          </Button>
          <Button onClick={openCreate} className="rounded-xl font-bold h-11 px-5">
            <Plus className="mr-2 h-4 w-4" /> Yeni Materyal
          </Button>
        </div>
      </div>

      {permError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{permError}</div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <p className="text-2xl font-black">{sorted.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Toplam Materyal</p>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4">
          <p className="text-2xl font-black text-green-600">{publishedCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Yayında</p>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4">
          <p className="text-2xl font-black text-blue-600">{publicCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Herkese Açık</p>
        </CardContent></Card>
      </div>

      {sorted.length === 0 ? (
        <Card className="rounded-[2rem] border-black/5 shadow-xl">
          <CardContent className="p-16 text-center text-muted-foreground italic">
            Henüz materyal yok. “Yeni Materyal” ile ilk tanıtım dosyanızı ekleyin.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((a) => {
            const isImage = (a.contentType || '').startsWith('image/');
            const preview = a.thumbnailUrl || (isImage ? a.fileUrl : null);
            return (
              <Card key={a.id} className="rounded-2xl border-black/5 shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-40 bg-muted/40 flex items-center justify-center">
                  {preview ? (
                    <Image src={preview} alt={a.title} fill className="object-cover" unoptimized />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground/40" />
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewing(a)}
                    title="Önizle"
                    className="absolute inset-0 z-10 group/preview cursor-pointer bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center"
                  >
                    <span className="opacity-0 group-hover/preview:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1d1d1f] shadow">
                      <Eye className="h-3.5 w-3.5" /> Önizle
                    </span>
                  </button>
                  <div className="absolute top-2 left-2 z-20 flex gap-1">
                    {a.status === 'yayinda' ? (
                      <Badge className="bg-green-600 text-white text-[9px] font-black uppercase">Yayında</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] font-black uppercase">Taslak</Badge>
                    )}
                    {a.publicListed && (
                      <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase gap-1"><Globe className="h-2.5 w-2.5" />Herkese açık</Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col gap-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase">{categoryLabel(a.category)}</Badge>
                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{a.title}</h3>
                    {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(a.targetKinds || []).map((k) => (
                      <span key={k} className="text-[9px] font-bold uppercase tracking-wide rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">{targetKindLabel(k)}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-auto truncate">
                    {a.fileName}{a.fileSize ? ` · ${formatBytes(a.fileSize)}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant={a.status === 'yayinda' ? 'outline' : 'default'}
                      className="rounded-lg font-bold h-8 flex-1 text-xs"
                      onClick={() => handlePublishToggle(a)}
                    >
                      {a.status === 'yayinda' ? <><EyeOff className="mr-1 h-3.5 w-3.5" />Taslağa al</> : <><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Yayınla</>}
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-lg h-8 w-8" title="Önizle" onClick={() => setPreviewing(a)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button asChild size="icon" variant="outline" className="rounded-lg h-8 w-8" title="İndir">
                      <a href={a.fileUrl} download={a.fileName} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /></a>
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-lg h-8 w-8" title="Düzenle" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-lg h-8 w-8 text-red-600 hover:text-red-700" title="Sil" onClick={() => setDeleting(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="rounded-2xl sm:max-w-[600px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />{editing ? 'Materyali Düzenle' : 'Yeni Tanıtım Materyali'}</DialogTitle>
            <DialogDescription>Dosyayı yükleyin, hedef kitleyi seçin ve hazır olduğunda yayına alın.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input className="rounded-xl" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Örn. hangel Kurumsal Tanıtım Sunumu" />
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea className="rounded-xl" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Kısa açıklama (opsiyonel)" />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as MarketingCategory }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARKETING_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hedef Kitle (panelde kimler görsün)</Label>
              <div className="flex flex-wrap gap-2">
                {MARKETING_TARGET_KINDS.map((k) => {
                  const active = form.targetKinds.includes(k.value);
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => toggleKind(k.value)}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-xs font-bold border transition',
                        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-input hover:bg-muted',
                      )}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label className="font-bold">Herkese açık (konferans)</Label>
                <p className="text-xs text-muted-foreground">Yayındayken /tanitim sayfasında giriş yapmamış ziyaretçiler de görür.</p>
              </div>
              <Switch checked={form.isPublic} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublic: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label className="font-bold">Yayında</Label>
                <p className="text-xs text-muted-foreground">Açıkken hedef panellerde görünür. Kapalıyken taslak.</p>
              </div>
              <Switch checked={form.status === 'yayinda'} onCheckedChange={(v) => setForm((f) => ({ ...f, status: v ? 'yayinda' : 'taslak' }))} />
            </div>

            <div className="space-y-2">
              <Label>Dosya {editing ? '(değiştirmek için yükleyin)' : '*'}</Label>
              <label className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl font-bold cursor-pointer w-full justify-start')}>
                <Upload className="mr-2 h-4 w-4" />
                <span className="truncate">{file ? file.name : (editing?.fileName || 'Dosya seç (PDF, görsel, sunum, zip, video)')}</span>
                <input type="file" accept={MARKETING_FILE_ACCEPT} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <p className="text-[11px] text-muted-foreground">En fazla {MARKETING_MAX_FILE_MB}MB.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><ImageOff className="h-3.5 w-3.5" />Önizleme görseli (opsiyonel)</Label>
              <label className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl font-bold cursor-pointer w-full justify-start')}>
                <Upload className="mr-2 h-4 w-4" />
                <span className="truncate">{thumb ? thumb.name : 'Kapak görseli seç (görsel olmayan dosyalar için)'}</span>
                <input type="file" accept={MARKETING_THUMB_ACCEPT} className="hidden" onChange={(e) => setThumb(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setDialogOpen(false)} disabled={saving}>İptal</Button>
            <Button className="rounded-xl font-bold" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Kaydet' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Önizleme (lightbox) — görsel inline, PDF iframe */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[860px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />{previewing?.title}</DialogTitle>
            <DialogDescription>
              {previewing ? categoryLabel(previewing.category) : ''}
              {previewing?.description ? ` · ${previewing.description}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/30 overflow-hidden">
            {previewing && (previewing.contentType || '').startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewing.fileUrl} alt={previewing.title} className="w-full h-auto max-h-[72vh] object-contain mx-auto bg-white" />
            ) : previewing && (previewing.contentType || '').includes('pdf') ? (
              <iframe src={previewing.fileUrl} title={previewing.title} className="w-full h-[72vh] bg-white" />
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>Bu dosya türü önizlenemiyor. İndirerek görüntüleyin.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button asChild variant="outline" className="rounded-xl font-bold">
              <a href={previewing?.fileUrl} download={previewing?.fileName} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> İndir
              </a>
            </Button>
            {previewing && previewing.status !== 'yayinda' && (
              <Button className="rounded-xl font-bold" onClick={() => { handlePublishToggle(previewing); setPreviewing(null); }}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Yayınla
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Materyali sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleting?.title}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
              onClick={() => deleting && handleDelete(deleting)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
