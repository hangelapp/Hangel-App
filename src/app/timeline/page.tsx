'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { timelinePosts } from '@/lib/data';
import { Heart, Share2, MoreHorizontal, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="p-4 space-y-4 animate-in fade-in-0">
      {timelinePosts.map((post) => (
        <Card key={post.id}>
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
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <Star className="h-4 w-4" />
                  <span>Sponsorlu</span>
                </div>
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
                <Image src={post.imageUrl} alt="Post image" layout="fill" objectFit="cover" data-ai-hint={post.imageHint}/>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-around">
            <Button variant="ghost" className="flex items-center gap-2">
              <Heart className="h-5 w-5" /> {post.likes}
            </Button>
            <Button variant="ghost" className="flex items-center gap-2">
              <Share2 className="h-5 w-5" /> Paylaş
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
