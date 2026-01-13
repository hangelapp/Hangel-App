'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { timelinePosts, adBanners } from '@/lib/data';
import { Heart, Share2, MoreHorizontal, Star } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import Link from 'next/link';

const AdCarousel = () => {
    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
    )

    return (
         <Carousel
            plugins={[plugin.current]}
            opts={{
            align: 'start',
            loop: true,
            }}
            className="w-full rounded-lg overflow-hidden"
        >
            <CarouselContent>
            {adBanners.map((ad) => (
                <CarouselItem key={ad.id}>
                    <Link href={ad.link} passHref>
                        <div className="relative h-32">
                            <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            fill
                            className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                                <h3 className="font-bold text-lg">{ad.title}</h3>
                                <p className="text-sm">{ad.description}</p>
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
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Should be replaced with real auth check
  const router = useRouter();

  useEffect(() => {
    // This is a mock authentication check.
    // In a real app, you would check a token, context, or session.
    const userIsLoggedIn = true; // Change to false to test redirection
    if (!userIsLoggedIn) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);
  
  if (!isAuthenticated) {
      // You can show a loading spinner here while checking auth
      return null;
  }

  return (
    <div className="animate-in fade-in-0">
      <Tabs defaultValue="foryou" className="w-full">
        <div className='px-4 pt-4'>
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="foryou">Sana Özel</TabsTrigger>
                <TabsTrigger value="country">Ülkemde</TabsTrigger>
                <TabsTrigger value="city">Şehrimde</TabsTrigger>
                <TabsTrigger value="school">Okulumda</TabsTrigger>
                <TabsTrigger value="interests">İlgi Alanlarım</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="foryou" className="p-4 space-y-4">
            {timelinePosts.map((post, index) => (
            <React.Fragment key={post.id}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                        <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {post.sponsored && (
                        <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-500">
                            <Star className="h-3 w-3" />
                            <span>Sponsorlu</span>
                        </Badge>
                        )}
                        <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <p className="mb-4">{post.content}</p>
                    {post.imageUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                        <Image src={post.imageUrl} alt="Post image" fill objectFit="cover" data-ai-hint={post.imageHint}/>
                        </div>
                    )}
                    </CardContent>
                    <CardFooter className="flex justify-around">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Heart className="h-5 w-5" /> Beğen
                    </Button>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" /> Paylaş
                    </Button>
                    </CardFooter>
                </Card>
                {(index + 1) % 4 === 0 && <AdCarousel />}
             </React.Fragment>
            ))}
        </TabsContent>
        {/* Other TabsContent can be added here */}
         <TabsContent value="country" className="p-4 text-center text-muted-foreground">Ülke genelindeki gönderiler yakında burada olacak.</TabsContent>
         <TabsContent value="city" className="p-4 text-center text-muted-foreground">Şehrinizdeki gönderiler yakında burada olacak.</TabsContent>
         <TabsContent value="school" className="p-4 text-center text-muted-foreground">Okulunuzla ilgili gönderiler yakında burada olacak.</TabsContent>
         <TabsContent value="interests" className="p-4 text-center text-muted-foreground">İlgi alanlarınıza özel gönderiler yakında burada olacak.</TabsContent>
      </Tabs>
    </div>
  );
}
