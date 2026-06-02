'use client';

import { librarySections } from '@/lib/library';
import type { LibrarySection } from '@/lib/library';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, ThumbsDown, Book, Film, Check, Loader2, BookOpen, Bookmark, BookmarkCheck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { TEMPLATES_SECTION_SLUG } from '@/lib/library-templates';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { parseBookMetadata } from '@/lib/library';

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
  const { t } = useTranslation();

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
  const [bookRating, setBookRating] = useState<number | null>(null);
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
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('librarySlug.backAria')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FallbackIcon className="h-5 w-5 text-muted-foreground" />
              {t('librarySlug.notReadyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              {t('librarySlug.notReadyBody')}
              {isLikelyFilm ? ' ' + t('librarySlug.notReadyFilmSuffix') : ''}
            </p>
            <Button asChild variant="outline">
              <Link href="/library">{t('librarySlug.backToLibrary')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const item = itemWithSection;
  const sectionSlugLower = (item.sectionSlug || '').toLowerCase();
  const isViewable = sectionSlugLower.includes('film') || sectionSlugLower.includes('belges') || sectionSlugLower.includes('sinema');
  const completionText = isViewable ? t('librarySlug.watched') : t('librarySlug.read');
  const CompletionIcon = isViewable ? Film : Book;
  const isTemplate = (item.sectionSlug || '') === TEMPLATES_SECTION_SLUG;

  const handleToggleComplete = async () => {
    if (!user || !userRef) {
      toast({ variant: 'destructive', title: t('librarySlug.loginRequiredTitle'), description: t('librarySlug.loginRequiredCompleteDesc') });
      return;
    }
    setBusy(true);
    try {
      if (isRead) {
        await updateDoc(userRef, { readLibraryItems: arrayRemove(slug) });
        toast({ title: t('librarySlug.unmarkedTitle'), description: `"${item.title}"` });
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
          title: alreadyAwarded ? `"${item.title}" ${t('librarySlug.markedSuffix')}` : `${t('librarySlug.congratsPrefix')} +${LIBRARY_READ_POINTS} ${t('librarySlug.impactPointsSuffix')} 🎉`,
          description: `"${item.title}" ${completionText.toLowerCase()} ${t('librarySlug.markedAsSuffix')}`,
        });
      }
    } catch {
      toast({ variant: 'destructive', title: t('librarySlug.saveFailedTitle'), description: t('librarySlug.saveFailedDesc') });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !userRef) {
      toast({ variant: 'destructive', title: t('librarySlug.loginRequiredTitle'), description: t('librarySlug.loginRequiredSaveDesc') });
      return;
    }
    setBusy(true);
    try {
      await updateDoc(userRef, { savedLibraryItems: isSaved ? arrayRemove(slug) : arrayUnion(slug) });
      toast({ title: isSaved ? t('librarySlug.removedFromSavedTitle') : t('librarySlug.savedTitle'), description: `"${item.title}"` });
    } catch {
      toast({ variant: 'destructive', title: t('librarySlug.saveFailedTitle'), description: t('librarySlug.saveFailedDesc') });
    } finally {
      setBusy(false);
    }
  };

  // Şablonu Word (.doc) olarak indir — içerik HTML'i Word uyumlu blob'a sarılır.
  const handleDownloadWord = () => {
    const safe = sanitizeHtml(item.content);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${item.title}</title></head><body><h1>${item.title}</h1>${safe}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: t('librarySlug.downloadingTitle'), description: `"${item.title}" ${t('librarySlug.downloadingDescSuffix')}` });
  };

  const handleRecommend = (rec: 'up' | 'down') => {
      const newRecommendation = recommendation === rec ? null : rec;
      setRecommendation(newRecommendation);
      toast({
          title: t('librarySlug.ratingThanksTitle'),
          description: t('librarySlug.ratingThanksDesc'),
      });
  };

  const handleBookRate = (value: number) => {
    setBookRating(value);
    toast({
      title: t('library.books.ratingSaved'),
      description: t('library.books.ratingSavedDesc'),
    });
  };

  const isBook = (item?.sectionSlug || '') === 'kitaplar';
  const bookMeta = isBook && item ? parseBookMetadata(item) : null;

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div className="flex items-center justify-between mb-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('librarySlug.backAria')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          {isTemplate && (
            <Button onClick={handleDownloadWord} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> {t('librarySlug.downloadWord')}
            </Button>
          )}
          <Button
            onClick={handleToggleSave}
            variant={isSaved ? 'default' : 'outline'}
            size="sm"
            disabled={busy}
            className="gap-2"
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {isSaved ? t('librarySlug.saved') : t('librarySlug.save')}
          </Button>
        </div>
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
          <CardTitle className="text-lg">{t('librarySlug.rateTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <p className="font-medium flex items-center gap-2">
                <CompletionIcon className="h-5 w-5 text-muted-foreground"/>
                {t('librarySlug.completedQuestion')}
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
             <p className="font-medium">{t('librarySlug.helpfulQuestion')}</p>
             <div className="flex gap-2">
                <Button
                  variant={recommendation === 'up' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('up')}
                >
                  <ThumbsUp className="h-4 w-4" /> {t('librarySlug.helpful')}
                </Button>
                <Button
                  variant={recommendation === 'down' ? 'destructive' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('down')}
                >
                  <ThumbsDown className="h-4 w-4" /> {t('librarySlug.notHelpful')}
                </Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
