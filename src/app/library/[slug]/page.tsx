'use client';

import { librarySections, getSocialSensitivities } from '@/lib/library';
import type { LibrarySection, LibraryItem } from '@/lib/library';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ThumbsUp, ThumbsDown, Book, Film, Check, Loader2, BookOpen, Bookmark, BookmarkCheck, Download, Share2, Calendar, FileText, Languages, Tag, Building2, User as UserIcon, Star, Clock, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { TEMPLATES_SECTION_SLUG } from '@/lib/library-templates';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { parseBookMetadata } from '@/lib/library';
import { BookRatingStars } from '../_components/books';
import { cn } from '@/lib/utils';
import { isAllowedImageHost } from '@/lib/image-host';
import { ListenButton } from '@/components/shared/listen-button';
import { downloadBlobSmart } from '@/lib/native-file';

// Bir içeriği ilk kez "okudum" işaretleyince verilen etki puanı (kötüye kullanım
// engellemek için yalnızca daha önce ödüllenmemiş içeriklerde verilir).
const LIBRARY_READ_POINTS = 5;

// Sosyal hassasiyet etiketleri — kitap/film/veri/akademik detayında ortak rozet bloğu.
// Boş liste gelirse hiçbir şey render etmez.
function SocialSensitivities({ item }: { item: LibraryItem }) {
  const tags = getSocialSensitivities(item);
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">Sosyal hassasiyetler</span>
      {tags.map(tag => (
        <span
          key={tag}
          className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[12px]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

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
    // Statik section'ları Firestore verisiyle zenginleştir: aynı slug'lı item'larda
    // Firestore alanları statik alanları override eder (per-field merge), Firestore'da
    // olup statikte olmayan item'lar da eklenir.
    const merged: LibrarySection[] = librarySections.map(staticSec => {
      const fsSec = fsMap.get(staticSec.slug);
      if (!fsSec) return staticSec;
      const fsByslug = new Map((fsSec.items ?? []).map(i => [i.slug, i]));
      const mergedItems = staticSec.items.map(s => {
        const fs = fsByslug.get(s.slug);
        return fs ? { ...s, ...fs } : s; // Firestore wins per field
      });
      const staticSlugs = new Set(staticSec.items.map(i => i.slug));
      const extra = (fsSec.items ?? []).filter(i => !staticSlugs.has(i.slug));
      return { ...staticSec, items: [...mergedItems, ...extra] };
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
  const handleDownloadWord = async () => {
    const safe = sanitizeHtml(item.content);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${item.title}</title></head><body><h1>${item.title}</h1>${safe}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    // <a download> native WebView'de sessiz no-op — tek kapı: downloadBlobSmart.
    await downloadBlobSmart(blob, `${slug}.doc`, { title: item.title, dialogTitle: 'Belgeyi kaydet veya paylaş' });
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

  // "Kapağı Paylaş" — Web Share API ile (fallback: clipboard).
  const handleShareCover = async () => {
    if (!bookMeta) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `${bookMeta.title}${bookMeta.author ? ' — ' + bookMeta.author : ''}`;
    try {
      const nav = (typeof navigator !== 'undefined' ? navigator : null) as (Navigator & { share?: (data: ShareData) => Promise<void> }) | null;
      if (nav?.share) {
        await nav.share({ title: shareText, text: shareText, url });
      } else if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(`${shareText}\n${url}`);
      }
      toast({ title: t('library.books.sharedTitle'), description: t('library.books.sharedDesc') });
    } catch {
      toast({ variant: 'destructive', title: t('library.books.shareFailed') });
    }
  };

  // ============= BOOK DETAIL =============
  // Kitap detayında: gradient bg + büyük kapak (300x450) + zengin metadata +
  // 10-üzerinden puanlama + paylaş/kütüphaneye ekle.
  if (isBook && bookMeta) {
    const rawCoverSrc = bookMeta.coverUrl || bookMeta.cover;
    const coverSrc = isAllowedImageHost(rawCoverSrc) ? rawCoverSrc : undefined;
    return (
      <div className="relative min-h-[100dvh] animate-in fade-in-0">
        {/* Gradient background — Liquid Glass altı */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" aria-hidden />
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('librarySlug.backAria')}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={handleShareCover} variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" /> {t('library.books.shareCover')}
              </Button>
              <Button
                onClick={handleToggleSave}
                variant={isSaved ? 'default' : 'outline'}
                size="sm"
                disabled={busy}
                className="gap-2"
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {isSaved ? t('library.books.addedToShelf') : t('library.books.addToShelf')}
              </Button>
            </div>
          </div>

          {/* Üst banner: kapak + başlık/metadata */}
          <Card className="glass-surface rounded-3xl overflow-hidden p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
              {/* Kapak — 300x450 oranı (2:3) */}
              <div className="mx-auto sm:mx-0">
                <div className="relative w-[200px] h-[300px] sm:w-[240px] sm:h-[360px] md:w-[300px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                  {coverSrc ? (
                    <Image
                      src={coverSrc}
                      alt={bookMeta.title || t('library.books.coverAlt')}
                      fill
                      sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, 300px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background flex flex-col items-center justify-center">
                      <span className="font-black text-5xl tracking-tight text-primary">hangel</span>
                      <span className="text-[11px] uppercase tracking-widest text-muted-foreground mt-2">
                        {t('library.books.coverPlaceholderAlt')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline leading-tight">{bookMeta.title}</h1>
                {bookMeta.author && (
                  <p className="text-base text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4" />
                    {bookMeta.author}
                  </p>
                )}

                {/* Yıldız (ortalama puan görselleştirme) */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <Star
                        key={n}
                        className={cn(
                          'h-4 w-4',
                          n <= Math.round(bookMeta.rating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-muted-foreground/30',
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {bookMeta.rating.toFixed(1)}{t('library.books.ratingOutOf')}
                  </span>
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-1.5">
                  {bookMeta.publisher && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Building2 className="h-3 w-3" /> {bookMeta.publisher}
                    </Badge>
                  )}
                  {bookMeta.year > 0 && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Calendar className="h-3 w-3" /> {bookMeta.year}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1 font-normal">
                    <FileText className="h-3 w-3" /> {bookMeta.pages} {t('library.books.pages')}
                  </Badge>
                  {bookMeta.language && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Languages className="h-3 w-3" /> {bookMeta.language}
                    </Badge>
                  )}
                  {bookMeta.category && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Tag className="h-3 w-3" /> {bookMeta.category}
                    </Badge>
                  )}
                </div>

                <SocialSensitivities item={item} />

                {bookMeta.shortDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {bookMeta.shortDescription}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Künye — kitabın tam bibliyografik bilgisi + hangel kitlesi için bağlam */}
          <Card className="glass-surface rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold mb-3">Künye</h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              {[bookMeta.author, bookMeta.title].filter(Boolean).join('. ')}
              {bookMeta.publisher ? `. ${bookMeta.publisher}` : ''}
              {bookMeta.year > 0 ? `, ${bookMeta.year}` : ''}.
            </p>
            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
              {bookMeta.author && (<div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Yazar</dt><dd className="font-medium">{bookMeta.author}</dd></div>)}
              {bookMeta.publisher && (<div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Yayınevi</dt><dd className="font-medium">{bookMeta.publisher}</dd></div>)}
              {bookMeta.year > 0 && (<div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Yıl</dt><dd className="font-medium">{bookMeta.year}</dd></div>)}
              {bookMeta.pages > 0 && (<div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Sayfa</dt><dd className="font-medium">{bookMeta.pages}</dd></div>)}
              {bookMeta.language && (<div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Dil</dt><dd className="font-medium">{bookMeta.language}</dd></div>)}
              {bookMeta.category && (<div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Kategori</dt><dd className="font-medium">{bookMeta.category}</dd></div>)}
              {bookMeta.topic && bookMeta.topic !== bookMeta.category && (<div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Konu</dt><dd className="font-medium">{bookMeta.topic}</dd></div>)}
            </dl>
            {/* hangel kitlesi için bağlam */}
            <div className="mt-4 pt-4 border-t flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">hangel kütüphanesinde:</span>{' '}
                {bookMeta.category
                  ? `${bookMeta.category} alanında; sivil toplum kuruluşları, gönüllüler ve sosyal etki çalışanları için seçildi.`
                  : 'Sivil toplum, gönüllülük ve sosyal etki alanında çalışanlar için seçildi.'}
              </p>
            </div>
          </Card>

          {/* Synopsis */}
          {bookMeta.synopsis && bookMeta.synopsis !== bookMeta.shortDescription && (
            <Card className="glass-surface rounded-3xl p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{t('library.books.synopsisTitle')}</h2>
                {/* Sesli "Dinle" — kitap tanıtımını yüksek sesle okur (erişilebilirlik + multitasking) */}
                <ListenButton getText={() => bookMeta.synopsis} />
              </div>
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-foreground/90">
                {bookMeta.synopsis}
              </p>
            </Card>
          )}

          {/* 10-üzerinden puan ver */}
          <Card className="glass-surface rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold mb-3">{t('library.books.rateOutOfTen')}</h2>
            <BookRatingStars
              value={bookRating}
              average={bookMeta.rating}
              onRate={handleBookRate}
              label={t('library.books.yourRating')}
              hint={t('library.books.tapToRate')}
            />
            <div className="mt-5 pt-5 border-t flex items-center justify-between gap-3 flex-wrap">
              <p className="font-medium flex items-center gap-2 text-sm">
                <CompletionIcon className="h-5 w-5 text-muted-foreground" />
                {t('librarySlug.completedQuestion')}
              </p>
              <div className="flex gap-2">
                <Button
                  variant={isRead ? 'default' : 'outline'}
                  onClick={handleToggleComplete}
                  disabled={busy}
                  size="sm"
                  className="gap-2"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRead && <Check className="h-4 w-4" />)}
                  {completionText}
                </Button>
                <Button
                  variant={recommendation === 'up' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('up')}
                  aria-label={t('librarySlug.helpful')}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={recommendation === 'down' ? 'destructive' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('down')}
                  aria-label={t('librarySlug.notHelpful')}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ============= FILM DETAIL =============
  // Filmler bölümünde: poster + başlık + yıl + süre/dil/ülke/tür/kategori
  // badge'leri + synopsis. posterUrl/description/durationMinutes Firestore'dan
  // gelir; eksikse content HTML'inden extract edilir.
  const isFilm = sectionSlugLower.includes('film') || sectionSlugLower === 'filmler';
  if (isFilm) {
    // Yeni alanlar henüz LibraryItem interface'inde tanımlı değil; type-safe okuma.
    const filmFields = item as LibraryItem & {
      posterUrl?: string;
      durationMinutes?: number;
      country?: string;
      genre?: string;
    };
    const content = item.content || '';
    // Poster: posterUrl > coverUrl > cover (eski alan)
    const rawPosterSrc = filmFields.posterUrl || item.coverUrl || item.cover;
    const posterSrc = isAllowedImageHost(rawPosterSrc) ? rawPosterSrc : undefined;

    // Yıl: explicit > title'dan 4 haneli yıl > content'ten
    let filmYear = item.year ?? 0;
    if (!filmYear) {
      const m = `${item.title} ${content.replace(/<[^>]*>/g, ' ')}`.match(/\b(19[2-9]\d|20[0-4]\d)\b/);
      if (m) filmYear = Number(m[1]);
    }

    // Açıklama: explicit > content'in ilk <p> bloğu
    const filmDescription = (() => {
      if (item.description) return item.description;
      const m = content.match(/<p>([\s\S]*?)<\/p>/);
      if (!m) return '';
      return m[1].replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    })();

    // Süre: durationMinutes (sayı) → "X sa Y dk" veya "Z dk"
    const formatDuration = (mins: number | undefined): string => {
      if (!mins || mins <= 0) return '';
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return `${h} sa ${m} dk`;
      if (h > 0) return `${h} sa`;
      return `${m} dk`;
    };

    // Etiketli alanlardan (Süre, Dil, Ülke, Tür, Kategori) extract
    const extractLabel = (label: string): string => {
      const re = new RegExp(`<strong>\\s*${label}\\s*:?\\s*</strong>\\s*([^<]+)`, 'i');
      const mm = content.match(re);
      return mm ? mm[1].trim().replace(/[,;.]$/, '') : '';
    };

    const durationText = formatDuration(filmFields.durationMinutes) || extractLabel('Süre');
    const filmLanguage = item.language || extractLabel('Dil');
    const filmCountry = filmFields.country || extractLabel('Ülke');
    const filmGenre = filmFields.genre || extractLabel('Tür') || item.topic || '';
    const filmCategory = item.category || extractLabel('Kategori');

    // Title'dan yıl parantezini ayır (örn "Selma (2014)")
    const titleClean = item.title.replace(/\s*\(\d{4}\)\s*$/, '').trim();

    // Türkçe dublaj: item.dub dolu ve 'yok'/'no' değilse "var". undefined ise gösterme.
    const dubRaw = item.dub;
    const hasDub = dubRaw !== undefined
      ? !['yok', 'no'].includes(dubRaw.trim().toLowerCase())
      : null;

    // IMDb puanı: imdbRating öncelikli, yoksa rating.
    const imdbScore = item.imdbRating ?? item.rating;

    return (
      <div className="relative min-h-[100dvh] animate-in fade-in-0">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" aria-hidden />
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('librarySlug.backAria')}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
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

          {/* Üst banner: poster + başlık/metadata */}
          <Card className="glass-surface rounded-3xl overflow-hidden p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
              {/* Poster — 2:3 oranı (240x360 mobile, 300x450 desktop) */}
              <div className="mx-auto sm:mx-0">
                <div className="relative w-[200px] h-[300px] sm:w-[240px] sm:h-[360px] md:w-[300px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                  {posterSrc ? (
                    <Image
                      src={posterSrc}
                      alt={titleClean || t('librarySlug.backAria')}
                      fill
                      sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, 300px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background flex flex-col items-center justify-center">
                      <Film className="h-14 w-14 text-primary/70" />
                      <span className="text-[11px] uppercase tracking-widest text-muted-foreground mt-2">
                        hangel
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline leading-tight">{titleClean}</h1>
                {filmYear > 0 && (
                  <p className="text-base text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {filmYear}
                  </p>
                )}

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-1.5">
                  {durationText && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Clock className="h-3 w-3" /> {durationText}
                    </Badge>
                  )}
                  {filmLanguage && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Languages className="h-3 w-3" /> {filmLanguage}
                    </Badge>
                  )}
                  {filmCountry && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Globe2 className="h-3 w-3" /> {filmCountry}
                    </Badge>
                  )}
                  {filmGenre && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Tag className="h-3 w-3" /> {filmGenre}
                    </Badge>
                  )}
                  {filmCategory && filmCategory !== filmGenre && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Tag className="h-3 w-3" /> {filmCategory}
                    </Badge>
                  )}
                  {typeof imdbScore === 'number' && imdbScore > 0 && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> IMDb {imdbScore.toFixed(1)}
                    </Badge>
                  )}
                  {hasDub !== null && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Languages className="h-3 w-3" /> Türkçe dublaj {hasDub ? 'var' : 'yok'}
                    </Badge>
                  )}
                </div>

                <SocialSensitivities item={item} />

                {filmDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1 line-clamp-4">
                    {filmDescription}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Synopsis */}
          {filmDescription && (
            <Card className="glass-surface rounded-3xl p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-3">{t('library.books.synopsisTitle')}</h2>
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-foreground/90">
                {filmDescription}
              </p>
            </Card>
          )}

          {/* Tamamlandı + tavsiye */}
          <Card className="glass-surface rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="font-medium flex items-center gap-2 text-sm">
                <CompletionIcon className="h-5 w-5 text-muted-foreground" />
                {t('librarySlug.completedQuestion')}
              </p>
              <div className="flex gap-2">
                <Button
                  variant={isRead ? 'default' : 'outline'}
                  onClick={handleToggleComplete}
                  disabled={busy}
                  size="sm"
                  className="gap-2"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRead && <Check className="h-4 w-4" />)}
                  {completionText}
                </Button>
                <Button
                  variant={recommendation === 'up' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('up')}
                  aria-label={t('librarySlug.helpful')}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={recommendation === 'down' ? 'destructive' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('down')}
                  aria-label={t('librarySlug.notHelpful')}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ============= DEFAULT (templates / glossary / etc.) =============
  // Akademik item tespiti — sözlük/şablon item'larını BOZMADAN sadece akademik
  // makalelerde meta-rozet satırı gösterilsin.
  const isAcademic = slug.startsWith('akademik') || Boolean(item.citation && item.origin);
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
        {/* Künye — yayın başlığının hemen altında: tam akademik/kaynak künyesi + kaynak linki */}
        {(item.citation || item.sourceUrl) && (
          <div className="mt-3 rounded-xl border-l-4 border-primary bg-primary/5 p-3 text-sm leading-relaxed">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Künye</p>
            {item.citation && <p className="text-foreground/90">{item.citation}</p>}
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline break-all"
              >
                Kaynağa git ↗
              </a>
            )}
          </div>
        )}
      </div>

      {/* Akademik meta-rozet satırı — abstract (content) ÖNCESİNDE. Sadece akademik item'larda. */}
      {isAcademic && (item.author || item.year || item.university || item.source || item.origin) && (
        <div className="flex flex-wrap gap-1.5">
          {item.author && (
            <Badge variant="outline" className="gap-1 font-normal">
              <UserIcon className="h-3 w-3" /> {item.author}
            </Badge>
          )}
          {item.year && item.year > 0 && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Calendar className="h-3 w-3" /> {item.year}
            </Badge>
          )}
          {item.university && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Building2 className="h-3 w-3" /> {item.university}
            </Badge>
          )}
          {item.source && (
            <Badge variant="outline" className="gap-1 font-normal">
              <FileText className="h-3 w-3" /> {item.source}
            </Badge>
          )}
          {item.origin && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Globe2 className="h-3 w-3" /> {item.origin}
            </Badge>
          )}
        </div>
      )}

      <SocialSensitivities item={item} />

      {/* Sesli "Dinle" — uzun makale/bilgi içeriğini yüksek sesle okur (erişilebilirlik + multitasking) */}
      {item.content?.trim() && (
        <div className="flex items-center gap-2">
          <ListenButton getText={() => item.content || ''} size="default" />
          <span className="text-xs text-muted-foreground">İçeriği sesli dinle</span>
        </div>
      )}

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
