
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getCountFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/firebase/collections';

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
                        <div className="relative h-40">
                            <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            fill
                            className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
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
      toast({ title: 'Beğenmek için giriş yapmalısın', variant: 'destructive' });
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
      toast({ title: 'Beğeni kaydedilemedi', variant: 'destructive' });
    } finally {
      setPendingPostId(null);
    }
  };

  const handleReport = async (post: Post) => {
    if (!authUser?.uid) {
      toast({ title: 'Bildirmek için giriş yapmalısın', variant: 'destructive' });
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
      toast({ title: 'Bildirim alındı', description: 'Hangel ekibi inceleyecek. Teşekkürler.' });
    } catch {
      toast({ variant: 'destructive', title: 'Bildirim gönderilemedi', description: 'Lütfen tekrar dene.' });
    }
  };

  const handleShare = async (post: Post) => {
    // TODO(permalink): replace once /posts/[id] permalink view ships.
    // For now we deep-link back to the timeline anchor for this card.
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org.tr';
    const url = `${origin}/timeline#post-${post.id}`;
    const shareData = { title: post.author?.name || 'Hangel', text: post.content?.slice(0, 120) || '', url };
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
      toast({ title: 'Bağlantı kopyalandı' });
    } catch {
      toast({ title: 'Bağlantı kopyalanamadı', variant: 'destructive' });
    }
  };

  const postsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.posts), [db]);
  const { data: postsData, isLoading } = useCollection<Post>(postsQuery);

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
  }, [postsData, sortKey, sortDir, filterSponsored, searchTerm]);

  const getEntityLink = (authorName: string) => {
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

  return (
    <div className="animate-in fade-in-0 bg-secondary">
       <Tabs defaultValue="special" className="w-full">
            <div className="p-2 sm:p-4 border-b bg-background/80 backdrop-blur-xl sticky top-12 z-10 space-y-4">
                 <div className="flex gap-2 items-center">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Akışta ara..."
                            className="pl-10 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Filtrele">
                                <Filter className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filtrele</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={filterSponsored} onCheckedChange={setFilterSponsored}>
                                Sadece Sponsorlu
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Sırala">
                                <ArrowDownUp className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {setSortKey('id'); setSortDir('desc')}}>En Yeni</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {setSortKey('id'); setSortDir('asc')}}>En Eski</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {setSortKey('likes'); setSortDir('desc')}}>En Çok Beğenilen</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="special">Sana Özel</TabsTrigger>
                    <TabsTrigger value="country">Ülkende</TabsTrigger>
                    <TabsTrigger value="city">Şehrinde</TabsTrigger>
                    <TabsTrigger value="school">Okulunda</TabsTrigger>
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
                                <CardTitle className="text-lg">Sana Özel</CardTitle>
                                <ChevronDown className={cn(
                                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                                    isSanaOzelExpanded && "rotate-180"
                                )} />
                            </CardHeader>
                        </button>
                        {isSanaOzelExpanded && (
                            <CardContent className="space-y-4 pt-0">
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Yaklaşan Gönüllülük Etkinliği</h3>
                                    <Link href="/volunteering/1" className="block p-3 rounded-lg border hover:bg-accent">
                                        <p className="font-semibold text-sm">Afet Bölgesi Yardım Dağıtımı</p>
                                        <p className="text-xs text-muted-foreground">Ahbap Derneği - 1 Ağustos'ta başlıyor</p>
                                    </Link>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Rozet Hedefi</h3>
                                    <Link href="/my-badges" className="block p-3 rounded-lg border hover:bg-accent">
                                        <div className="flex items-center gap-4">
                                            <Leaf className="h-8 w-8 text-green-600"/>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">Gümüş Çevre Koruyucusu</p>
                                                <Progress value={80} className="mt-1 h-2" />
                                                <p className="text-xs text-muted-foreground mt-1">1000 puandan 800'ü tamamlandı.</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
                <div className="p-2 sm:p-4 space-y-4">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)
                    ) : sortedAndFilteredPosts.map((post, index) => {
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
                                            <span className="font-bold text-sm truncate">{post.author.name}</span>
                                            <span className="text-muted-foreground text-xs shrink-0">· {post.timestamp}</span>
                                        </Link>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {post.sponsored && (
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    <Star className="h-3 w-3 mr-1" /> Sponsorlu
                                                </Badge>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Daha fazla seçenek">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleReport(post)} className="text-destructive focus:text-destructive">
                                                        <Flag className="mr-2 h-4 w-4" /> Bildir
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
                                    <span>Beğen</span>
                                </Button>
                                <div className="w-[1px] h-6 bg-border self-center" />
                                <Button
                                    variant="ghost"
                                    className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base"
                                    onClick={() => handleShare(post)}
                                >
                                    <Share2 className="h-5 w-5" /> <span>Paylaş</span>
                                </Button>
                            </CardFooter>
                        </Card>
                        {(index + 1) % 5 === 0 && <AdCarousel />}
                     </React.Fragment>
                    );
                    })}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
