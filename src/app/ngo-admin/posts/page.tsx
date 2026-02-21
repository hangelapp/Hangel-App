
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { ImagePlus, Send, Heart, Share2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { timelinePosts } from '@/lib/data';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function PostsPage() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>(timelinePosts.filter(p => p.author.name === 'Uluslararası Sosyal Fayda Derneği'));
    const [newPostContent, setNewPostContent] = useState('');

    const handleCreatePost = () => {
        if (!newPostContent.trim()) {
            toast({ variant: 'destructive', title: 'Gönderi boş olamaz.' });
            return;
        }

        const newPost: Post = {
            id: `${Date.now()}`,
            author: { name: 'Uluslararası Sosyal Fayda Derneği', avatarUrl: 'https://logo.clearbit.com/socialbusinessglobal.org' },
            content: newPostContent,
            timestamp: 'Şimdi',
            likes: 0,
            comments: 0,
        };

        setPosts(prevPosts => [newPost, ...prevPosts]);
        setNewPostContent('');
        toast({ title: "Gönderi paylaşıldı!", description: "Yeni gönderiniz zaman tünelinde yayınlandı." });
    };
    
    const handleDeletePost = (id: string) => {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
        toast({ variant: 'destructive', title: "Gönderi silindi." });
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gönderi Yönetimi</h1>
        <p className="text-muted-foreground">
          Toplulukla etkileşim kurmak için gönderiler oluşturun ve yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Yeni Gönderi Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Neler oluyor?" 
            rows={4}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => toast({ title: 'Bu özellik yakında eklenecektir.' })}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Görsel Ekle
          </Button>
          <Button onClick={handleCreatePost}>
            <Send className="mr-2 h-4 w-4" />
            Paylaş
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mevcut Gönderiler</h2>
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
                <p className="text-sm text-muted-foreground">{post.timestamp}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{post.content}</p>
              {post.imageUrl && (
                <div className="relative aspect-video mt-4">
                  <Image
                    src={post.imageUrl}
                    alt="Post image"
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
              )}
            </CardContent>
             <CardFooter className="gap-2 border-t pt-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Heart className="mr-2 h-4 w-4" />
                    {post.likes} Beğeni
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Share2 className="mr-2 h-4 w-4" />
                    Paylaş
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" size="sm" className="ml-auto">
                           <Trash2 className="mr-2 h-4 w-4" /> Sil
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Gönderiyi Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu işlem geri alınamaz. Gönderi kalıcı olarak silinecektir.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => handleDeletePost(post.id)}>
                                Evet, Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
