
'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type PostStatus = 'Aktif' | 'Onay Bekliyor' | 'Pasif';

type Post = {
  id: number;
  author: string;
  avatar: string;
  content: string;
  imageUrl: string | null;
  status: PostStatus;
};

const initialPosts: Post[] = [
    { id: 1, author: 'TEMA Vakfı', avatar: 'https://logo.clearbit.com/tema.org.tr', content: 'Fidan dikme etkinliğimize katılan herkese teşekkürler!', imageUrl: 'https://picsum.photos/seed/post1/600/300', status: 'Aktif' },
    { id: 2, author: 'Ahbap Derneği', avatar: 'https://logo.clearbit.com/ahbap.org', content: 'Yardım kolilerimiz yola çıktı, destekleriniz için minnettarız.', imageUrl: null, status: 'Onay Bekliyor' },
    { id: 3, author: 'Doğa Dostu Giyim', avatar: 'https://logo.clearbit.com/patagonia.com', content: 'Yeni sürdürülebilir koleksiyonumuz yayında! Gelirlerin %10\'u denizleri korumak için bağışlanıyor.', imageUrl: 'https://picsum.photos/seed/post3/600/300', status: 'Aktif' },
    { id: 4, author: 'TEGV', avatar: 'https://logo.clearbit.com/tegv.org', content: 'Geleceğin bilim insanları için kodlama atölyelerimize gönüllü eğitmenler arıyoruz. Başvurular websitemizde!', imageUrl: null, status: 'Onay Bekliyor' },
];

export default function PostsPage() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>(initialPosts);

    const handleUpdateStatus = (id: number, newStatus: PostStatus) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === id ? { ...post, status: newStatus } : post
            )
        );
        toast({
            title: "Gönderi Durumu Güncellendi",
            description: `Gönderi durumu "${newStatus}" olarak ayarlandı.`,
        });
    };

    const handleDelete = (id: number) => {
        const postToDelete = posts.find(p => p.id === id);
        setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
        toast({
            variant: "destructive",
            title: "Gönderi Silindi",
            description: `"${postToDelete?.author}" tarafından oluşturulan gönderi silindi.`,
        });
    };

    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Gönderi Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Gönderiler</CardTitle>
                    <CardDescription>
                        Platformdaki gönderileri yönetin, onaylayın, pasife alın veya silin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {posts.map(post => (
                       <Card key={post.id}>
                           <CardHeader className="flex-row items-center gap-4">
                               <Avatar>
                                   <AvatarImage src={post.avatar} />
                                   <AvatarFallback>{post.author.slice(0, 1)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{post.author}</p>
                                   <p className="text-sm text-muted-foreground">{post.status}</p>
                               </div>
                           </CardHeader>
                           <CardContent>
                               <p>{post.content}</p>
                               {post.imageUrl && (
                                   <div className="relative mt-4 aspect-video rounded-md overflow-hidden">
                                       <Image src={post.imageUrl} alt="Post Image" fill className="object-cover" />
                                   </div>
                               )}
                           </CardContent>
                           <CardFooter className="flex gap-2">
                               {post.status === 'Onay Bekliyor' && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(post.id, 'Aktif')}>Onayla</Button>}
                               {post.status === 'Aktif' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(post.id, 'Pasif')}>Pasife Al</Button>}
                               {post.status === 'Pasif' && <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(post.id, 'Aktif')}>Aktif Et</Button>}
                               <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                       <Button variant="destructive" size="sm">Sil</Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                       <AlertDialogHeader>
                                           <AlertDialogTitle>Gönderiyi Silmek Üzeresiniz</AlertDialogTitle>
                                           <AlertDialogDescription>
                                            Bu işlem geri alınamaz. Gönderi kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
                                           </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter>
                                           <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                           <AlertDialogAction 
                                                className={cn(buttonVariants({ variant: "destructive" }))}
                                                onClick={() => handleDelete(post.id)}>
                                                Evet, Sil
                                            </AlertDialogAction>
                                       </AlertDialogFooter>
                                   </AlertDialogContent>
                               </AlertDialog>
                           </CardFooter>
                       </Card>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
