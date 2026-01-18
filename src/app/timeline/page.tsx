'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { timelinePosts, adBanners } from '@/lib/data';
import { Heart, MessageCircle, Share2, MoreHorizontal, Star } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import Link from 'next/link';

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
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Mocking auth
  const router = useRouter();
  
  if (!isAuthenticated) {
      return null;
  }

  return (
    <div className="animate-in fade-in-0 bg-secondary">
        <div className="p-2 sm:p-4 space-y-4">
            {timelinePosts.map((post, index) => (
            <React.Fragment key={post.id}>
                <Card className="overflow-hidden shadow-none rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                        <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {post.sponsored && (
                        <Badge variant="outline" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Sponsorlu
                        </Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent className="space-y-4 px-3 sm:px-4 pb-3">
                    <p className="text-base">{post.content}</p>
                    {post.imageUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                        <Image src={post.imageUrl} alt="Post image" fill className="object-cover" data-ai-hint={post.imageHint}/>
                        </div>
                    )}
                    </CardContent>
                    <CardFooter className="flex justify-start gap-0 border-t p-0">
                        <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                            <Heart className="h-5 w-5" /> 
                            <span>Beğen</span>
                        </Button>
                        <div className="w-[1px] h-6 bg-border self-center" />
                        <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                            <Share2 className="h-5 w-5" /> 
                            <span>Paylaş</span>
                        </Button>
                    </CardFooter>
                </Card>
                {(index + 1) % 4 === 0 && <AdCarousel />}
             </React.Fragment>
            ))}
        </div>
    </div>
  );
}
