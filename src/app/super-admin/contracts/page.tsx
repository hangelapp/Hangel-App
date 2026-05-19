'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Search, Eye, FileText, Upload as UploadIcon, Info } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { contractsData as seedContracts } from '@/lib/contracts';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

type Contract = {
  id: string;        // == slug
  slug: string;
  title: string;
  content: string;
  group?: string;
  updatedAt?: unknown;
  source?: 'firestore' | 'seed';
};

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const ContractEditDialog = ({ contract, onSave }: { contract?: Contract; onSave: (c: Contract) => Promise<void> }) => {
  const [open, setOpen] = useState(false);
  const isNew = !contract;
  const [title, setTitle] = useState(contract?.title || '');
  const [slug, setSlug] = useState(contract?.slug || '');
  const [content, setContent] = useState(contract?.content || '');
  const [group, setGroup] = useState(contract?.group || '');
  const [saving, setSaving] = useState(false);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) {
      setTitle(contract?.title || '');
      setSlug(contract?.slug || '');
      setContent(contract?.content || '');
      setGroup(contract?.group || '');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const finalSlug = (slug || slugify(title)).trim();
    setSaving(true);
    try {
      await onSave({
        id: finalSlug,
        slug: finalSlug,
        title: title.trim(),
        content: content,
        group: group.trim(),
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isNew
          ? <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Sözleşme Ekle</Button>
          : <Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-4 w-4" /> Düzenle</Button>
        }
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Yeni Sözleşme / Politika Ekle' : `Düzenle: ${contract?.title}`}</DialogTitle>
          <DialogDescription>
            Görsel düzenleyici ile yazın; istersen sağ üstten <code>HTML</code> moduna geçip kaynak kodu görebilirsin. Slug değiştirilirse eski URL bozulur.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Kullanıcı Sözleşmesi" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder={title ? slugify(title) : 'kullanici-sozlesmesi'}
                disabled={!isNew}
              />
              <p className="text-[10px] text-muted-foreground">/settings/contracts/{slug || (title ? slugify(title) : 'slug')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Grup</Label>
            <Input value={group} onChange={e => setGroup(e.target.value)} placeholder="A. Ana Sözleşmeler / B. Gizlilik Politikaları / vb." />
          </div>
          <div className="space-y-2">
            <Label>İçerik *</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Sözleşme metnini buraya yazın. Toolbar'dan başlık, liste, bağlantı vb. ekleyebilirsiniz."
              minHeight={320}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNew ? 'Sözleşme Oluştur' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ContractsAdminPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);

  const contractsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.contracts), [db]);
  const { data: firestoreContracts, isLoading } = useCollection<Contract>(contractsQuery);

  // Firestore'dakiler ile birlikte tohum (seed) içeriği — Firestore'dakiler önceliklidir
  const allContracts = useMemo<Contract[]>(() => {
    const fsBySlug = new Map<string, Contract>();
    (firestoreContracts || []).forEach(c => fsBySlug.set(c.slug || c.id, { ...c, source: 'firestore' }));

    const merged: Contract[] = [];
    seedContracts.forEach(s => {
      if (fsBySlug.has(s.slug)) {
        merged.push(fsBySlug.get(s.slug)!);
        fsBySlug.delete(s.slug);
      } else {
        merged.push({ id: s.slug, slug: s.slug, title: s.title, content: s.content, source: 'seed' });
      }
    });
    // Sadece Firestore'da olup seed'de olmayanlar (yeni eklenenler)
    fsBySlug.forEach(c => merged.push(c));
    return merged;
  }, [firestoreContracts]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return allContracts;
    const q = searchTerm.toLowerCase();
    return allContracts.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.group || '').toLowerCase().includes(q)
    );
  }, [allContracts, searchTerm]);

  const handleSave = async (c: Contract) => {
    try {
      await setDoc(doc(db, COLLECTIONS.contracts, c.slug), {
        slug: c.slug,
        title: c.title,
        content: c.content,
        group: c.group || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      toast({ title: 'Kaydedildi', description: `"${c.title}" güncellendi.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Hata.';
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: code === 'permission-denied' ? 'Bu işlem için super-admin yetkisi gerekli.' : message,
      });
      throw e;
    }
  };

  const handleDelete = async (c: Contract) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.contracts, c.slug));
      toast({ variant: 'destructive', title: 'Silindi', description: `"${c.title}" kaldırıldı (varsayılan içerik gösterilebilir).` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Hata.';
      toast({
        variant: 'destructive',
        title: 'Silinemedi',
        description: code === 'permission-denied' ? 'Bu işlem için super-admin yetkisi gerekli.' : message,
      });
    }
  };

  const handleSeedAll = async () => {
    setSeeding(true);
    try {
      let count = 0;
      for (const s of seedContracts) {
        await setDoc(doc(db, COLLECTIONS.contracts, s.slug), {
          slug: s.slug,
          title: s.title,
          content: s.content,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        count += 1;
      }
      toast({ title: 'İçe Aktarma Tamamlandı', description: `${count} sözleşme Firestore'a aktarıldı. Artık düzenlenebilir.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Hata.';
      toast({
        variant: 'destructive',
        title: 'Aktarma başarısız',
        description: code === 'permission-denied' ? 'Bu işlem için super-admin yetkisi gerekli.' : message,
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter">Sözleşmeler ve Politikalar</h1>
          <p className="text-muted-foreground text-sm">Kullanıcı, kurumsal ve gönüllülük sözleşmelerini, gizlilik / KVKK metinlerini düzenleyin.</p>
        </div>
        <ContractEditDialog onSave={handleSave} />
      </div>

      {/* Bilgilendirme */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Düzenleme akışı</AlertTitle>
        <AlertDescription>
          Sözleşmeler iki kaynaktan gelir: <strong>varsayılan içerik (kod içi)</strong> ve <strong>Firestore'da düzenlenmiş içerik</strong>. Bir sözleşme düzenlendiğinde Firestore'a yazılır ve kod içindeki varsayılanın üzerine biner.
          Tüm varsayılanları toplu olarak Firestore'a aktarmak istersen "Tümünü İçe Aktar" butonunu kullanabilirsin.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Başlık, slug veya grup ara..."
                className="pl-10 h-10"
              />
            </div>
            <Button variant="outline" onClick={handleSeedAll} disabled={seeding} className="gap-1.5">
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
              Varsayılan Şablonları İçe Aktar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="divide-y border-t">
              {filtered.map(c => (
                <div key={c.slug} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold truncate">{c.title}</p>
                        {c.source === 'seed' ? (
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest">Varsayılan</Badge>
                        ) : (
                          <Badge className="text-[9px] uppercase tracking-widest bg-green-600">Düzenlendi</Badge>
                        )}
                        {c.group && <Badge variant="secondary" className="text-[9px]">{c.group}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">/{c.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" asChild className="gap-1.5">
                      <Link href={`/settings/contracts/${c.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" /> Önizle
                      </Link>
                    </Button>
                    <ContractEditDialog contract={c} onSave={handleSave} />
                    {c.source === 'firestore' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" aria-label="Sil">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sözleşmeyi sil?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{c.title}" Firestore kaydı silinecek. Eğer bu slug için varsayılan kod içeriği varsa, kullanıcılar onu görmeye devam eder.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                              className={cn(buttonVariants({ variant: 'destructive' }))}
                              onClick={() => handleDelete(c)}>
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground italic p-12">Sonuç bulunamadı.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
