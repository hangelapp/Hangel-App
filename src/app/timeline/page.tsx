
'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { adBanners, ngos, allEntityLists } from '@/lib/data';
import { Heart, MessageCircle, Share2, MoreHorizontal, Star, Search, Filter, ArrowDownUp, Leaf, X } from 'lucide-react';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Post } from '@/lib/types';

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
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [filterSponsored, setFilterSponsored] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSanaOzelVisible, setIsSanaOzelVisible] = useState(true);

  const postsQuery = useMemoFirebase(() => collection(db, 'posts'), [db]);
  const { data: postsData, isLoading } = useCollection<Post>(postsQuery);

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
        let valA, valB;
        if (sortKey === 'id') {
            valA = a.id;
            valB = b.id;
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
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
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
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
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
                {isSanaOzelVisible && (
                    <div className="p-2 sm:p-4">
                        <Card className="relative">
                            <CardHeader>
                                <CardTitle className="text-lg">Sana Özel</CardTitle>
                                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setIsSanaOzelVisible(false)}><X className="h-4 w-4" /></Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                        </Card>
                    </div>
                )}
                <div className="p-2 sm:p-4 space-y-4">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)
                    ) : sortedAndFilteredPosts.map((post, index) => (
                    <React.Fragment key={post.id}>
                        <Card className="overflow-hidden shadow-none rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4">
                                <Link href={getEntityLink(post.author.name)} className="flex items-center gap-3">
                                    <Avatar>
                                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                    <p className="font-semibold">{post.author.name}</p>
                                    <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-1">
                                    {post.sponsored && (
                                    <Badge variant="outline" className="text-xs">
                                        <Star className="h-3 w-3 mr-1" /> Sponsorlu
                                    </Badge>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-5 w-5" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 px-3 sm:px-4 pb-3">
                            <p className="text-base">{post.content}</p>
                            {post.imageUrl && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                                <Image src={post.imageUrl} alt="Post image" fill className="object-cover" />
                                </div>
                            )}
                            </CardContent>
                            <CardFooter className="flex justify-start gap-0 border-t p-0">
                                <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                                    <Heart className="h-5 w-5" /> <span>Beğen</span>
                                </Button>
                                <div className="w-[1px] h-6 bg-border self-center" />
                                <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                                    <Share2 className="h-5 w-5" /> <span>Paylaş</span>
                                </Button>
                            </CardFooter>
                        </Card>
                        {(index + 1) % 5 === 0 && <AdCarousel />}
                     </React.Fragment>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
