
'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { adBanners, ngos, allEntityLists } from '@/lib/data';
import { Heart, Share2, MoreHorizontal, Star, Search, Filter, ArrowDownUp, Leaf, ChevronDown, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getCountFromServer,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/firebase/collections';
import { TimelineBanner } from '@/components/shared/timeline-banner';
import { ListenButton } from '@/components/shared/listen-button';
import { useTranslation } from '@/components/providers/language-provider';

const AdCarousel = () => {
    const plugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
    )

    return (
         <Carousel
            plugins={[plugin.current]}
            opts={{
            align: 'start',
            loop: true,
            }}
            className="w-full rounded-xl overflow-hidden"
        >
            <CarouselContent>
            {adBanners.map((ad) => (
                <CarouselItem key={ad.id}>
                    <Link href={ad.link} passHref>
                        {/* aspect-video CLS engellemek için (önceden h-40 fixed
                            yüksekti; geniş ekranda dar görünüyordu). */}
                        <div className="relative w-full aspect-video sm:aspect-[3/1] sm:h-40">
                            <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            fill
                            className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                                <h3 className="font-bold text-xl">{ad.title}</h3>
                                <p className="text-base">{ad.description}</p>
                            </div>
                        </div>
                    </Link>
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
    )
}

export default function TimelinePage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [filterSponsored, setFilterSponsored] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSanaOzelExpanded, setIsSanaOzelExpanded] = useState(false);
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  // Wave 2A: like state moved off the post doc into posts/{id}/likes/{uid}.
  // We keep a per-post count + isLikedByMe cache, primed on mount via
  // getCountFromServer + getDoc(likes/{uid}). Toggle is optimistic with rollback.
  const [likeState, setLikeState] = useState<Record<string, { count: number; isLikedByMe: boolean }>>({});

  const handleLike = async (post: Post) => {
    if (!authUser?.uid) {
      toast({ title: t('timelinePage.toastLoginToLike'), variant: 'destructive' });
      return;
    }
    if (!db) return;
    if (pendingPostId === post.id) return;
    const current = likeState[post.id] ?? {
      count: post.likedBy?.length ?? post.likes ?? 0,
      isLikedByMe: !!(authUser.uid && post.likedBy?.includes(authUser.uid)),
    };
    const next = {
      count: current.isLikedByMe ? Math.max(0, current.count - 1) : current.count + 1,
      isLikedByMe: !current.isLikedByMe,
    };
    setPendingPostId(post.id);
    setLikeState(prev => ({ ...prev, [post.id]: next }));
    try {
      const likeRef = doc(db, COLLECTIONS.posts, post.id, COLLECTIONS.postLikes, authUser.uid);
      if (current.isLikedByMe) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
      }
    } catch {
      // rollback
      setLikeState(prev => ({ ...prev, [post.id]: current }));
      toast({ title: t('timelinePage.toastLikeFailed'), variant: 'destructive' });
    } finally {
      setPendingPostId(null);
    }
  };

  const handleReport = async (post: Post) => {
    if (!authUser?.uid) {
      toast({ title: t('timelinePage.toastLoginToReport'), variant: 'destructive' });
      return;
    }
    if (!db) return;
    try {
      await addDoc(collection(db, COLLECTIONS.postReports), {
        postId: post.id,
        postAuthorName: post.author?.name || '',
        reporterId: authUser.uid,
        reporterEmail: authUser.email || null,
        contentPreview: (post.content || '').slice(0, 200),
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      toast({ title: t('timelinePage.toastReportReceived'), description: t('timelinePage.toastReportReceivedDesc') });
    } catch {
      toast({ variant: 'destructive', title: t('timelinePage.toastReportFailed'), description: t('timelinePage.toastTryAgain') });
    }
  };

  const handleShare = async (post: Post) => {
    // TODO(permalink): replace once /posts/[id] permalink view ships.
    // For now we deep-link back to the timeline anchor for this card.
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
    const url = `${origin}/timeline#post-${post.id}`;
    const shareData = { title: post.author?.name || 'hangel', text: post.content?.slice(0, 120) || '', url };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // user cancelled
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t('timelinePage.toastLinkCopied') });
    } catch {
      toast({ title: t('timelinePage.toastLinkCopyFailed'), variant: 'destructive' });
    }
  };

  // PERF: gönderiler en yeni → eski sıralı ve sınırlı çekilir (eskiden TÜM
  // posts koleksiyonu sınırsız indiriliyordu). "Daha fazla" ile limit artar;
  // arama/filtre/sıralama yine yüklenen küme üzerinde çalışır.
  const POSTS_PAGE_SIZE = 50;
  const [postsLimit, setPostsLimit] = useState(POSTS_PAGE_SIZE);
  const postsQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.posts), orderBy('createdAt', 'desc'), limit(postsLimit)),
    [db, postsLimit],
  );
  const { data: postsData, isLoading } = useCollection<Post>(postsQuery);
  // Çekilen sayı limiti dolduruyorsa muhtemelen daha fazla gönderi var.
  const hasMorePosts = (postsData?.length ?? 0) >= postsLimit;

  // Canlı kurum logoları + profil linkleri — statik @/lib/data'da logolar boş/eski
  // olabildiğinden gönderi yazarını Firestore'daki ngo/marka/kulüp ile eşleştir.
  type LiveEntity = { id: string; name?: string; avatarUrl?: string; logoUrl?: string; files?: { logo?: string }; address?: { country?: string; city?: string }; city?: string; country?: string; university?: string };
  const ngosLiveQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.ngos) : null), [db]);
  const { data: ngosLive } = useCollection<LiveEntity>(ngosLiveQuery);
  const brandsLiveQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.brands) : null), [db]);
  const { data: brandsLive } = useCollection<LiveEntity>(brandsLiveQuery);
  const clubsLiveQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.clubs) : null), [db]);
  const { data: clubsLive } = useCollection<LiveEntity>(clubsLiveQuery);

  const entityResolver = useMemo(() => {
    const norm = (s: string) => (s || '').trim().toLocaleLowerCase('tr');
    const map = new Map<string, { link: string; logo?: string; id: string; type: 'ngo' | 'brand' | 'club'; country: string; city: string; university: string }>();
    const add = (list: LiveEntity[] | null | undefined, type: 'ngo' | 'brand' | 'club', linkFor: (e: LiveEntity) => string) => {
      (list || []).forEach(e => {
        if (!e.name) return;
        const logo = e.files?.logo || e.logoUrl || e.avatarUrl;
        map.set(norm(e.name), {
          link: linkFor(e), logo, id: e.id, type,
          country: norm(e.address?.country || e.country || (type === 'club' ? 'Türkiye' : '')),
          city: norm(e.address?.city || e.city || ''),
          university: norm(e.university || ''),
        });
      });
    };
    add(ngosLive, 'ngo', e => `/ngos/${e.id}`);
    add(brandsLive, 'brand', e => `/market/${e.id}`);
    add(clubsLive, 'club', e => `/clubs/profile/${e.id}`);
    return map;
  }, [ngosLive, brandsLive, clubsLive]);

  // Akış filtresi için kullanıcının ilişki verisi (bağış/gönüllü/takip/üyelik).
  const userRelRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: userRel } = useDoc<{
    supportedNgos?: string[]; volunteerNgos?: string[]; followedBrands?: string[]; joinedClubs?: string[];
    personalInfo?: { address?: { country?: string; city?: string } };
    volunteerInfo?: { education?: Array<{ school?: string }> };
  }>(userRelRef);
  const relSets = useMemo(() => ({
    supported: new Set(userRel?.supportedNgos || []),
    volunteered: new Set(userRel?.volunteerNgos || []),
    followed: new Set(userRel?.followedBrands || []),
    joined: new Set(userRel?.joinedClubs || []),
  }), [userRel]);
  // Sekme filtreleri için kullanıcının konumu + okulu (kurum adresiyle eşleştirilir).
  const userLoc = useMemo(() => {
    const norm = (s: string) => (s || '').trim().toLocaleLowerCase('tr');
    const normCountry = (s: string) => { const n = norm(s); return (n === 'turkey' || n === 'tr' || n === 'türkiye cumhuriyeti' || n === '') ? 'türkiye' : n; };
    return {
      country: normCountry(userRel?.personalInfo?.address?.country || ''),
      city: norm(userRel?.personalInfo?.address?.city || ''),
      schools: new Set((userRel?.volunteerInfo?.education || []).map(e => norm(e.school || '')).filter(Boolean)),
    };
  }, [userRel]);
  const [relFilter, setRelFilter] = useState<'all' | 'supported' | 'volunteered' | 'followed' | 'joined'>('all');

  // Prime likeState once per (postsData, authUser) using one-shot reads.
  // Avoids N+1 listeners; counts refresh only on mount + optimistic toggle.
  useEffect(() => {
    if (!db || !postsData || postsData.length === 0) return;
    let cancelled = false;
    (async () => {
      const uid = authUser?.uid;
      const entries = await Promise.all(
        postsData.map(async (post) => {
          try {
            const likesCol = collection(db, COLLECTIONS.posts, post.id, COLLECTIONS.postLikes);
            const [countSnap, mineSnap] = await Promise.all([
              getCountFromServer(likesCol),
              uid ? getDoc(doc(db, COLLECTIONS.posts, post.id, COLLECTIONS.postLikes, uid)) : Promise.resolve(null),
            ]);
            const count = countSnap.data().count;
            const isLikedByMe = !!(mineSnap && mineSnap.exists());
            return [post.id, { count, isLikedByMe }] as const;
          } catch {
            // fall back to legacy fields without throwing
            const fallbackCount = post.likedBy?.length ?? post.likes ?? 0;
            const fallbackMine = !!(uid && post.likedBy?.includes(uid));
            return [post.id, { count: fallbackCount, isLikedByMe: fallbackMine }] as const;
          }
        }),
      );
      if (cancelled) return;
      setLikeState(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [db, postsData, authUser?.uid]);

  const sortedAndFilteredPosts = useMemo(() => {
    if (!postsData) return [];
    let posts = [...postsData];

    if (filterSponsored) {
        posts = posts.filter(p => p.sponsored);
    }

    if (relFilter !== 'all') {
        const norm = (s: string) => (s || '').trim().toLocaleLowerCase('tr');
        posts = posts.filter(p => {
            const ent = entityResolver.get(norm(p.author?.name || ''));
            if (!ent) return false;
            if (relFilter === 'supported') return relSets.supported.has(ent.id);
            if (relFilter === 'volunteered') return relSets.volunteered.has(ent.id);
            if (relFilter === 'followed') return relSets.followed.has(ent.id);
            if (relFilter === 'joined') return relSets.joined.has(ent.id);
            return true;
        });
    }

    if (searchTerm.trim()) {
        const lowercased = searchTerm.toLowerCase();
        posts = posts.filter(post => 
            post.content.toLowerCase().includes(lowercased) ||
            post.author.name.toLowerCase().includes(lowercased)
        );
    }
    
    posts.sort((a, b) => {
        let valA: number | string, valB: number | string;
        if (sortKey === 'id') {
            // Prefer createdAt (Firestore Timestamp or ISO), fallback to id
            const toTime = (p: Post): number => {
                const ca = (p as Post & { createdAt?: { toMillis?: () => number; seconds?: number } | string }).createdAt;
                if (ca && typeof ca === 'object' && ca.toMillis) return ca.toMillis();
                if (ca && typeof ca === 'object' && ca.seconds) return (ca.seconds || 0) * 1000;
                if (typeof ca === 'string') return new Date(ca).getTime() || 0;
                return 0;
            };
            const tA = toTime(a);
            const tB = toTime(b);
            if (tA || tB) {
                valA = tA;
                valB = tB;
            } else {
                valA = a.id;
                valB = b.id;
            }
        } else { // likes
            valA = a.likes;
            valB = b.likes;
        }

        if (sortDir === 'desc') {
            return valB > valA ? 1 : -1;
        } else {
            return valA > valB ? 1 : -1;
        }
    });

    return posts;
  }, [postsData, sortKey, sortDir, filterSponsored, searchTerm, relFilter, entityResolver, relSets]);

  // Sekme filtreleri — gönderi yazarının (kurum) adresine göre. Konum/okul yoksa
  // kısıtlama yapmaz (boş sekme yerine akışı gösterir).
  const tabPosts = useMemo(() => {
    const ent = (name: string) => entityResolver.get((name || '').trim().toLocaleLowerCase('tr'));
    const country = sortedAndFilteredPosts.filter(p => {
      const e = ent(p.author?.name || '');
      if (!e) return false;
      return !e.country || e.country === userLoc.country;
    });
    const city = userLoc.city
      ? sortedAndFilteredPosts.filter(p => ent(p.author?.name || '')?.city === userLoc.city)
      : sortedAndFilteredPosts;
    const school = userLoc.schools.size > 0
      ? sortedAndFilteredPosts.filter(p => { const e = ent(p.author?.name || ''); return e?.type === 'club' && (userLoc.schools.has(e.university) || (!!e.city && e.city === userLoc.city)); })
      : sortedAndFilteredPosts.filter(p => ent(p.author?.name || '')?.type === 'club');
    return { country, city, school };
  }, [sortedAndFilteredPosts, entityResolver, userLoc]);

  const normName = (s: string) => (s || '').trim().toLocaleLowerCase('tr');
  const getEntityLink = (authorName: string) => {
    const live = entityResolver.get(normName(authorName));
    if (live) return live.link;
    const ngo = ngos.find(n => n.name === authorName);
    if (ngo) return `/ngos/${ngo.id}`;
    const brand = allEntityLists.find(b => b.name === authorName);
    if (brand) return `/market/${brand.id}`;
    return '#';
  }

  // Why: bazı eski gönderilerde post.author.avatarUrl yazıma sırasında boş kaydedilmiş
  // (entity henüz logo yüklememişti veya files.logo path'i farklı). Render anında
  // entity adından ngo/brand listesinde lookup ile en güncel logoyu döndür.
  const getEntityLogo = (authorName: string): string | undefined => {
    const live = entityResolver.get(normName(authorName));
    if (live?.logo) return live.logo;
    const ngo = ngos.find(n => n.name === authorName);
    if (ngo) {
      const ngoData = ngo as typeof ngo & { files?: { logo?: string }; logoUrl?: string; avatarUrl?: string };
      return ngoData.files?.logo || ngoData.logoUrl || ngoData.avatarUrl;
    }
    const brand = allEntityLists.find(b => b.name === authorName);
    if (brand) {
      const brandData = brand as typeof brand & { files?: { logo?: string }; logoUrl?: string; avatarUrl?: string };
      return brandData.files?.logo || brandData.logoUrl || brandData.avatarUrl;
    }
    return undefined;
  }

  const renderFeed = (list: Post[]) => (
                <div className="p-2 sm:p-4 space-y-4">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)
                    ) : list.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground text-sm">{t('timelinePage.emptyTabFeed')}</div>
                    ) : list.map((post, index) => {
                    const cached = likeState[post.id];
                    const fallbackMine = !!(authUser?.uid && post.likedBy?.includes(authUser.uid));
                    const isLiked = cached ? cached.isLikedByMe : fallbackMine;
                    return (
                    <React.Fragment key={post.id}>
                        <Card id={`post-${post.id}`} className="overflow-hidden shadow-none rounded-xl scroll-mt-24">
                            {/* X.com tarzı yerleşim: avatar sol, ad + zaman + ... butonu aynı satırda */}
                            <div className="flex items-start gap-3 p-3 sm:p-4">
                                <Link href={getEntityLink(post.author.name)} className="shrink-0">
                                    <Avatar className="h-11 w-11">
                                        <AvatarImage src={post.author.avatarUrl || getEntityLogo(post.author.name)} alt={post.author.name} />
                                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <Link
                                            href={getEntityLink(post.author.name)}
                                            className="flex items-baseline gap-1.5 min-w-0 hover:underline"
                                        >
                                            <span className="font-bold text-sm break-words">{post.author.name}</span>
                                            <span className="text-muted-foreground text-xs shrink-0">· {post.timestamp}</span>
                                        </Link>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {post.sponsored && (
                                                <Badge variant="outline" className="text-[11px] h-6 px-2">
                                                    <Star className="h-3 w-3 mr-1" /> {t('timelinePage.sponsoredBadge')}
                                                </Badge>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" aria-label={t('timelinePage.moreOptionsAria')}>
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleReport(post)} className="text-destructive focus:text-destructive">
                                                        <Flag className="mr-2 h-4 w-4" /> {t('timelinePage.reportCta')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <p className="text-[15px] leading-relaxed mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                                    {post.imageUrl && (
                                        <div className="relative aspect-video w-full overflow-hidden rounded-xl mt-3 border">
                                            <Image src={post.imageUrl} alt="Post image" fill className="object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <CardFooter className="flex justify-start gap-0 border-t p-0">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "flex-1 flex items-center gap-2 h-12 text-base",
                                        isLiked ? "text-red-500" : "text-muted-foreground"
                                    )}
                                    onClick={() => handleLike(post)}
                                    disabled={pendingPostId === post.id}
                                    aria-pressed={isLiked}
                                >
                                    <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                                    <span>{t('timelinePage.likeCta')}</span>
                                </Button>
                                <div className="w-[1px] h-6 bg-border self-center" />
                                <Button
                                    variant="ghost"
                                    className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base"
                                    onClick={() => handleShare(post)}
                                >
                                    <Share2 className="h-5 w-5" /> <span>{t('timelinePage.shareCta')}</span>
                                </Button>
                                {post.content?.trim() ? (
                                    <>
                                        <div className="w-[1px] h-6 bg-border self-center" />
                                        {/* Sesli "Dinle" — erişilebilirlik + multitasking; gönderi metnini okur */}
                                        <ListenButton
                                            getText={() => post.content || ''}
                                            variant="ghost"
                                            size="default"
                                            className="flex-1 justify-center [&>button]:h-12 [&>button]:w-full [&>button]:text-base"
                                        />
                                    </>
                                ) : null}
                            </CardFooter>
                        </Card>
                        {(index + 1) % 5 === 0 && <AdCarousel />}
                     </React.Fragment>
                    );
                    })}
                    {!isLoading && list.length > 0 && hasMorePosts && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => setPostsLimit((n) => n + POSTS_PAGE_SIZE)}
                            >
                                {t('timelinePage.loadMore')}
                            </Button>
                        </div>
                    )}
                </div>
  );

  return (
    <div className="animate-in fade-in-0 bg-secondary">
       <TimelineBanner />
       <Tabs defaultValue="special" className="w-full">
            <div className="p-2 sm:p-4 border-b bg-background sticky top-12 z-10 space-y-4">
                 <div className="flex gap-2 items-center">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder={t('timelinePage.searchPlaceholder')}
                            className="pl-10 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label={t('aria.filter')}>
                                <Filter className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{t('aria.filter')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={filterSponsored} onCheckedChange={setFilterSponsored}>
                                {t('timelinePage.onlySponsored')}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{t('timelinePage.byRelation')}</DropdownMenuLabel>
                            {([
                                { key: 'all', labelKey: 'timelinePage.relAll' },
                                { key: 'supported', labelKey: 'timelinePage.relSupported' },
                                { key: 'volunteered', labelKey: 'timelinePage.relVolunteered' },
                                { key: 'followed', labelKey: 'timelinePage.relFollowed' },
                                { key: 'joined', labelKey: 'timelinePage.relJoined' },
                            ] as const).map(opt => (
                                <DropdownMenuCheckboxItem
                                    key={opt.key}
                                    checked={relFilter === opt.key}
                                    onCheckedChange={() => setRelFilter(opt.key)}
                                >
                                    {t(opt.labelKey)}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label={t('aria.sort')}>
                                <ArrowDownUp className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {setSortKey('id'); setSortDir('desc')}}>{t('timelinePage.sortNewest')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {setSortKey('id'); setSortDir('asc')}}>{t('timelinePage.sortOldest')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {setSortKey('likes'); setSortDir('desc')}}>{t('timelinePage.sortMostLiked')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="special">{t('timelinePage.tabSpecial')}</TabsTrigger>
                    <TabsTrigger value="country">{t('timelinePage.tabCountry')}</TabsTrigger>
                    <TabsTrigger value="city">{t('timelinePage.tabCity')}</TabsTrigger>
                    <TabsTrigger value="school">{t('timelinePage.tabSchool')}</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="special" className="mt-0">
                <div className="p-2 sm:p-4">
                    <Card>
                        <button
                            type="button"
                            onClick={() => setIsSanaOzelExpanded(prev => !prev)}
                            className="w-full text-left"
                            aria-expanded={isSanaOzelExpanded}
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2 hover:bg-accent/30 transition-colors rounded-t-xl">
                                <CardTitle className="text-lg">{t('timelinePage.forYouTitle')}</CardTitle>
                                <ChevronDown className={cn(
                                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                                    isSanaOzelExpanded && "rotate-180"
                                )} />
                            </CardHeader>
                        </button>
                        {isSanaOzelExpanded && (
                            <CardContent className="space-y-4 pt-0">
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">{t('timelinePage.upcomingVolunteeringTitle')}</h3>
                                    <Link href="/volunteering/1" className="block p-3 rounded-lg border hover:bg-accent">
                                        <p className="font-semibold text-sm">{t('timelinePage.sampleEventTitle')}</p>
                                        <p className="text-xs text-muted-foreground">{t('timelinePage.sampleEventOrg')}</p>
                                    </Link>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">{t('timelinePage.badgeGoalTitle')}</h3>
                                    <Link href="/my-badges" className="block p-3 rounded-lg border hover:bg-accent">
                                        <div className="flex items-center gap-4">
                                            <Leaf className="h-8 w-8 text-green-600"/>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{t('timelinePage.sampleBadgeName')}</p>
                                                <Progress value={80} className="mt-1 h-2" />
                                                <p className="text-xs text-muted-foreground mt-1">{t('timelinePage.sampleBadgeProgress')}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
                {renderFeed(sortedAndFilteredPosts)}
            </TabsContent>
            <TabsContent value="country" className="mt-0">{renderFeed(tabPosts.country)}</TabsContent>
            <TabsContent value="city" className="mt-0">{renderFeed(tabPosts.city)}</TabsContent>
            <TabsContent value="school" className="mt-0">{renderFeed(tabPosts.school)}</TabsContent>
        </Tabs>
    </div>
  );
}
