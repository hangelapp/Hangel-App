'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Loader2, Search, Eye, FileText, Info, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type SitePage = {
  id: string;
  slug: string;
  title: string;
  category?: string;
  excerpt?: string;
  coverImageUrl?: string;
  content: string;
  published?: boolean;
  publishedAt?: string;
  updatedAt?: string;
};

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const PageEditDialog = ({ page, onSave }: { page?: SitePage; onSave: (p: SitePage) => Promise<void> }) => {
  const [open, setOpen] = useState(false);
  const isNew = !page;
  const [title, setTitle] = useState(page?.title || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [category, setCategory] = useState(page?.category || '');
  const [excerpt, setExcerpt] = useState(page?.excerpt || '');
  const [coverImageUrl, setCoverImageUrl] = useState(page?.coverImageUrl || '');
  const [content, setContent] = useState(page?.content || '');
  const [published, setPublished] = useState(page?.published ?? true);
  const [saving, setSaving] = useState(false);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o && page) {
      setTitle(page.title);
      setSlug(page.slug);
      setCategory(page.category || '');
      setExcerpt(page.excerpt || '');
      setCoverImageUrl(page.coverImageUrl || '');
      setContent(page.content);
      setPublished(page.published ?? true);
    } else if (o) {
      setTitle('');
      setSlug('');
      setCategory('');
      setExcerpt('');
      setCoverImageUrl('');
      setContent('');
      setPublished(true);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    const finalSlug = (slug || slugify(title)).trim();
    setSaving(true);
    try {
      await onSave({
        id: finalSlug,
        slug: finalSlug,
        title: title.trim(),
        category: category.trim(),
        excerpt: excerpt.trim(),
        coverImageUrl: coverImageUrl.trim(),
        content,
        published,
        updatedAt: new Date().toISOString(),
        ...(isNew ? { publishedAt: new Date().toISOString() } : {}),
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
          ? <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Sayfa Aç</Button>
          : <Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-4 w-4" /> Düzenle</Button>
        }
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Yeni İçerik Sayfası' : `Düzenle: ${page?.title}`}</DialogTitle>
          <DialogDescription>
            Basın, etkinlik, kariyer, duyuru gibi sayfalar oluşturun. HTML formatı destekleniyor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Sayfa başlığı" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder={title ? slugify(title) : 'sayfa-slug'}
                disabled={!isNew}
              />
              <p className="text-[10px] text-muted-foreground">/p/{slug || (title ? slugify(title) : 'slug')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Basın / Etkinlik / Duyuru / Kariyer..." />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Kapak Fotoğrafı (URL)</Label>
              <Input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Özet</Label>
            <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} placeholder="Sayfanın kısa özeti, listeleme/SEO için." />
          </div>
          <div className="space-y-2">
            <Label>İçerik (HTML) *</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={14}
              className="font-mono text-xs"
              placeholder={`<h2>Bölüm Başlığı</h2>\n<p>Metin paragrafı...</p>\n<img src="https://..." alt="..." />`}
            />
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Switch checked={published} onCheckedChange={setPublished} />
            <Label className="font-medium">Yayında</Label>
            <span className="text-xs text-muted-foreground ml-auto">{published ? 'Sayfa herkese açık' : 'Sadece super-admin görür'}</span>
          </div>
          {content && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Önizleme</Label>
              <div
                className="prose prose-sm max-w-none p-4 border rounded-lg bg-muted/30 max-h-60 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNew ? 'Sayfayı Oluştur' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function SitePagesAdmin() {
  const { toast } = useToast();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const pagesQuery = useMemoFirebase(() => collection(db, 'sitePages'), [db]);
  const { data: pages, isLoading } = useCollection<SitePage>(pagesQuery);

  const filtered = useMemo(() => {
    const list = pages || [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [pages, searchTerm]);

  const handleSave = async (p: SitePage) => {
    try {
      await setDoc(doc(db, 'sitePages', p.slug), p, { merge: true });
      toast({ title: 'Sayfa Kaydedildi', description: `"${p.title}" güncellendi.` });
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

  const handleDelete = async (p: SitePage) => {
    try {
      await deleteDoc(doc(db, 'sitePages', p.slug));
      toast({ variant: 'destructive', title: 'Sayfa Silindi', description: `"${p.title}" kaldırıldı.` });
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

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter">İçerik Sayfaları</h1>
          <p className="text-muted-foreground text-sm">Basın, etkinlik, duyuru, kariyer gibi içerik sayfalarını oluştur ve düzenle.</p>
        </div>
        <PageEditDialog onSave={handleSave} />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Sayfa URL'leri</AlertTitle>
        <AlertDescription>
          Oluşturulan sayfalar <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/p/&lt;slug&gt;</code> URL'sinde herkesin erişimine açıktır.
          Yayından kaldırılırsa sadece super-admin görür.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Başlık, slug, kategori ara..."
              className="pl-10 h-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground italic p-12">
              {pages && pages.length === 0 ? 'Henüz sayfa eklenmemiş. "Yeni Sayfa Aç" butonu ile başla.' : 'Eşleşen sayfa yok.'}
            </p>
          ) : (
            <div className="divide-y border-t">
              {filtered.map(p => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {p.coverImageUrl ? (
                      <img src={p.coverImageUrl} alt="" className="h-12 w-16 object-cover rounded-md border" />
                    ) : (
                      <div className="h-12 w-16 bg-muted rounded-md flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold truncate">{p.title}</p>
                        {p.published === false ? (
                          <Badge variant="secondary" className="text-[9px] uppercase">Taslak</Badge>
                        ) : (
                          <Badge className="text-[9px] uppercase bg-green-600">Yayında</Badge>
                        )}
                        {p.category && <Badge variant="outline" className="text-[9px]">{p.category}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">/p/{p.slug}</p>
                      {p.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.excerpt}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" asChild className="gap-1.5">
                      <Link href={`/p/${p.slug}`} target="_blank">
                        <Eye className="h-4 w-4" /> Önizle
                      </Link>
                    </Button>
                    <PageEditDialog page={p} onSave={handleSave} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sayfayı Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{p.title}" sayfası kalıcı olarak silinecek. Geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                          <AlertDialogAction
                            className={cn(buttonVariants({ variant: 'destructive' }))}
                            onClick={() => handleDelete(p)}>
                            Evet, Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
