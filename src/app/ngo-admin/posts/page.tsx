
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { ImagePlus, Send, Heart, Share2, Trash2, Pencil, X, Check, Loader2, Inbox, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, Timestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function PostsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const [newPostContent, setNewPostContent] = useState('');
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Load posts from Firestore
    const postsQuery = useMemoFirebase(() => {
        if (!authUser?.uid) return null;
        return query(
            collection(firestore, 'posts'),
            where('authorId', '==', authUser.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, authUser?.uid]);

    const { data: firestorePosts, isLoading } = useCollection<Post & { authorId: string; createdAt: any }>(postsQuery);

    const posts = firestorePosts || [];

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            toast({ variant: 'destructive', title: 'Gonderi bos olamaz.' });
            return;
        }

        if (!authUser?.uid) {
            toast({ variant: 'destructive', title: 'Oturum acmaniz gerekiyor.' });
            return;
        }

        setIsCreating(true);

        const newPost = {
            authorId: authUser.uid,
            author: {
                name: authUser.displayName || 'Kurulusunuz',
                avatarUrl: authUser.photoURL || '',
            },
            content: newPostContent,
            timestamp: new Date().toLocaleDateString('tr-TR'),
            createdAt: Timestamp.now(),
            likes: 0,
            comments: 0,
        };

        try {
            await addDoc(collection(firestore, 'posts'), newPost);
            setNewPostContent('');
            toast({ title: 'Gönderi paylaşıldı!', description: 'Yeni gönderiniz zaman tünelinde yayınlandı.' });
        } catch (error: any) {
            console.error('Post create failed:', error);
            toast({
                variant: 'destructive',
                title: 'Gönderi paylaşılamadı.',
                description: error?.code === 'permission-denied' ? 'Sunucu izin vermedi.' : (error?.message || 'Beklenmeyen bir hata oluştu.'),
            });
        }

        setIsCreating(false);
    };

    const handleDeletePost = async (id: string) => {
        if (!authUser?.uid) return;
        try {
            await deleteDoc(doc(firestore, 'posts', id));
            toast({ variant: 'destructive', title: 'Gönderi silindi.' });
        } catch (error: any) {
            console.error('Post delete failed:', error);
            toast({ variant: 'destructive', title: 'Gönderi silinemedi.', description: error?.message });
        }
    };

    const handleStartEdit = (post: Post & { id: string }) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditContent('');
    };

    const handleSaveEdit = async (id: string) => {
        if (!editContent.trim()) {
            toast({ variant: 'destructive', title: 'Gönderi boş olamaz.' });
            return;
        }

        try {
            await updateDoc(doc(firestore, 'posts', id), {
                content: editContent,
                updatedAt: Timestamp.now(),
            });
            toast({ title: 'Gönderi güncellendi!' });
            setEditingPostId(null);
            setEditContent('');
        } catch (error: any) {
            console.error('Post update failed:', error);
            toast({ variant: 'destructive', title: 'Gönderi güncellenemedi.', description: error?.message });
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Gönderi Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplulukla etkileşim kurmak için gönderiler oluşturun ve yönetin. Yayınlanan gönderiler zaman tünelinde görünür.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/timeline">
            <ExternalLink className="mr-2 h-4 w-4" /> Zaman Tünelini Aç
          </Link>
        </Button>
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
          <Button onClick={handleCreatePost} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Paylas
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mevcut Gönderiler</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Henüz gönderi bulunmuyor.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Yukarıdaki formu kullanarak ilk gönderinizi oluşturun.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
                <p className="text-sm text-muted-foreground">{post.timestamp}</p>
            </CardHeader>
            <CardContent>
              {editingPostId === post.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(post.id)}>
                      <Check className="mr-2 h-4 w-4" /> Kaydet
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="mr-2 h-4 w-4" /> Vazgec
                    </Button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
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
                {editingPostId !== post.id && (
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleStartEdit(post)}>
                    <Pencil className="mr-2 h-4 w-4" /> Düzenle
                  </Button>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" size="sm" className={editingPostId === post.id ? "ml-auto" : ""}>
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
        ))
        )}
      </div>
    </div>
  );
}
