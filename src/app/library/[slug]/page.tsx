'use client';

import { librarySections } from '@/lib/library';
import type { LibrarySection } from '@/lib/library';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, ThumbsDown, Book, Film, Check, Loader2, BookOpen, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { COLLECTIONS } from '@/firebase/collections';

// Bir içeriği ilk kez "okudum" işaretleyince verilen etki puanı (kötüye kullanım
// engellemek için yalnızca daha önce ödüllenmemiş içeriklerde verilir).
const LIBRARY_READ_POINTS = 5;

export default function LibraryItemPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  // Kullanıcının kaydet/okudu durumu (persist) — users/{uid} doc'undan.
  const userRef = useMemoFirebase(() => (user ? doc(db, COLLECTIONS.users, user.uid) : null), [db, user]);
  const { data: userData } = useDoc<{ readLibraryItems?: string[]; savedLibraryItems?: string[]; awardedLibraryItems?: string[] }>(userRef);

  // Statik + Firestore section'ları birleştir, slug'ı her iki kaynakta ara
  const libQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.library) : null), [db]);
  const { data: fsSections, isLoading: fsLoading } = useCollection<LibrarySection>(libQuery);

  const itemWithSection = useMemo(() => {
    const fsMap = new Map((fsSections ?? []).map(s => [s.slug, s]));
    // Statik section'ları Firestore extra item'larıyla zenginleştir
    const merged: LibrarySection[] = librarySections.map(staticSec => {
      const fsSec = fsMap.get(staticSec.slug);
      if (!fsSec) return staticSec;
      const staticSlugs = new Set(staticSec.items.map(i => i.slug));
      const extra = (fsSec.items ?? []).filter(i => !staticSlugs.has(i.slug));
      return { ...staticSec, items: [...staticSec.items, ...extra] };
    });
    const staticSlugs = new Set(librarySections.map(s => s.slug));
    const extraSections = (fsSections ?? []).filter(s => !staticSlugs.has(s.slug));
    const all = [...merged, ...extraSections];

    for (const section of all) {
      const found = (section.items ?? []).find(i => i.slug === slug);
      if (found) return { ...found, sectionSlug: section.slug };
    }
    return null;
  }, [fsSections, slug]);

  const [busy, setBusy] = useState(false);
  const [recommendation, setRecommendation] = useState<'up' | 'down' | null>(null);
  const isRead = Array.isArray(userData?.readLibraryItems) && userData!.readLibraryItems!.includes(slug);
  const isSaved = Array.isArray(userData?.savedLibraryItems) && userData!.savedLibraryItems!.includes(slug);

  // Firestore yüklenirken bekleyen ekran (statik section'da yoksa fs gelene kadar 404 gösterme)
  if (fsLoading && !itemWithSection) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!itemWithSection) {
    // Film veya başka bir bölümde içerik henüz Firestore'a aktarılmamış olabilir.
    // notFound() yerine kullanıcıya nazik bir geri dönüş ekranı gösteriyoruz.
    const isLikelyFilm = (slug || '').toLowerCase().includes('film')
      || (slug || '').toLowerCase().includes('belges')
      || (slug || '').toLowerCase().includes('sinema');
    const FallbackIcon = isLikelyFilm ? Film : BookOpen;
    return (
      <div className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FallbackIcon className="h-5 w-5 text-muted-foreground" />
              İçerik henüz hazır değil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Aradığın içerik şu anda kütüphanede bulunamadı.
              {isLikelyFilm ? ' Film detay sayfası için içerik kısa süre içinde eklenecek.' : ''}
            </p>
            <Button asChild variant="outline">
              <Link href="/library">Kütüphaneye dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const item = itemWithSection;
  const sectionSlugLower = (item.sectionSlug || '').toLowerCase();
  const isViewable = sectionSlugLower.includes('film') || sectionSlugLower.includes('belges') || sectionSlugLower.includes('sinema');
  const completionText = isViewable ? 'İzledim' : 'Okudum';
  const CompletionIcon = isViewable ? Film : Book;

  const handleToggleComplete = async () => {
    if (!user || !userRef) {
      toast({ variant: 'destructive', title: 'Giriş gerekli', description: 'Okuduğunu işaretlemek için giriş yapmalısın.' });
      return;
    }
    setBusy(true);
    try {
      if (isRead) {
        await updateDoc(userRef, { readLibraryItems: arrayRemove(slug) });
        toast({ title: 'Tamamlandı işareti kaldırıldı', description: `"${item.title}"` });
      } else {
        // Puan yalnızca daha önce ödüllenmemiş içerikte verilir (remove→re-add ile farm engellenir).
        const alreadyAwarded = Array.isArray(userData?.awardedLibraryItems) && userData!.awardedLibraryItems!.includes(slug);
        const update: Record<string, unknown> = { readLibraryItems: arrayUnion(slug) };
        if (!alreadyAwarded) {
          update.awardedLibraryItems = arrayUnion(slug);
          update.impactScore = increment(LIBRARY_READ_POINTS);
        }
        await updateDoc(userRef, update);
        toast({
          title: alreadyAwarded ? `"${item.title}" işaretlendi` : `Tebrikler! +${LIBRARY_READ_POINTS} etki puanı 🎉`,
          description: `"${item.title}" ${completionText.toLowerCase()} olarak işaretlendi.`,
        });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: 'Lütfen tekrar deneyin.' });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !userRef) {
      toast({ variant: 'destructive', title: 'Giriş gerekli', description: 'Kaydetmek için giriş yapmalısın.' });
      return;
    }
    setBusy(true);
    try {
      await updateDoc(userRef, { savedLibraryItems: isSaved ? arrayRemove(slug) : arrayUnion(slug) });
      toast({ title: isSaved ? 'Kayıtlardan çıkarıldı' : 'Kaydedildi 📑', description: `"${item.title}"` });
    } catch {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: 'Lütfen tekrar deneyin.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRecommend = (rec: 'up' | 'down') => {
      const newRecommendation = recommendation === rec ? null : rec;
      setRecommendation(newRecommendation);
      toast({
          title: "Değerlendirmeniz Alındı",
          description: "Geri bildiriminiz için teşekkürler!",
      });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div className="flex items-center justify-between mb-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          onClick={handleToggleSave}
          variant={isSaved ? 'default' : 'outline'}
          size="sm"
          disabled={busy}
          className="gap-2"
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {isSaved ? 'Kaydedildi' : 'Kaydet'}
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold font-headline">{item.title}</h1>
      </div>
      <article
        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
      />
       <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Bu İçeriği Değerlendir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <p className="font-medium flex items-center gap-2">
                <CompletionIcon className="h-5 w-5 text-muted-foreground"/>
                Bu içeriği tamamladın mı?
            </p>
            <Button
              variant={isRead ? 'default' : 'outline'}
              onClick={handleToggleComplete}
              disabled={busy}
              className="w-28"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isRead && <Check className="mr-2 h-4 w-4" />)}
              {completionText}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
             <p className="font-medium">Bu içeriği yararlı buldun mu?</p>
             <div className="flex gap-2">
                <Button
                  variant={recommendation === 'up' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('up')}
                >
                  <ThumbsUp className="h-4 w-4" /> Yararlı
                </Button>
                <Button
                  variant={recommendation === 'down' ? 'destructive' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('down')}
                >
                  <ThumbsDown className="h-4 w-4" /> Yararsız
                </Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
