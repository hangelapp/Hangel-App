
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { ImagePlus, Send, Heart, Share2, Trash2, Pencil, X, Check, Loader2, Inbox, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type EntityKind = 'ngo' | 'brand' | 'club';
interface ManagedEntityDoc {
    id: string;
    name?: string;
    shortName?: string;
    adminUserId?: string;
    files?: { logo?: string };
    logoUrl?: string;
}
interface UserDocData {
    id: string;
    managedNgoId?: string;
    managedBrandId?: string;
    managedClubId?: string;
}

export default function PostsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const [newPostContent, setNewPostContent] = useState('');
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageDraft, setImageDraft] = useState('');
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // ---- Resolve managed entity (NGO / brand / club) so posts publish on entity's behalf ----
    const adminNgosQ = useMemoFirebase(
        () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid)) : null),
        [firestore, authUser?.uid],
    );
    const adminBrandsQ = useMemoFirebase(
        () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid)) : null),
        [firestore, authUser?.uid],
    );
    const adminClubsQ = useMemoFirebase(
        () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid)) : null),
        [firestore, authUser?.uid],
    );
    const { data: adminNgos } = useCollection<ManagedEntityDoc>(adminNgosQ);
    const { data: adminBrands } = useCollection<ManagedEntityDoc>(adminBrandsQ);
    const { data: adminClubs } = useCollection<ManagedEntityDoc>(adminClubsQ);

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
        [firestore, authUser?.uid],
    );
    const { data: userData } = useDoc<UserDocData>(userDocRef);

    const fallbackNgoRef = useMemoFirebase(
        () => (firestore && userData?.managedNgoId ? doc(firestore, COLLECTIONS.ngos, userData.managedNgoId) : null),
        [firestore, userData?.managedNgoId],
    );
    const fallbackBrandRef = useMemoFirebase(
        () => (firestore && userData?.managedBrandId ? doc(firestore, COLLECTIONS.brands, userData.managedBrandId) : null),
        [firestore, userData?.managedBrandId],
    );
    const fallbackClubRef = useMemoFirebase(
        () => (firestore && userData?.managedClubId ? doc(firestore, COLLECTIONS.clubs, userData.managedClubId) : null),
        [firestore, userData?.managedClubId],
    );
    const { data: fallbackNgo } = useDoc<ManagedEntityDoc>(fallbackNgoRef);
    const { data: fallbackBrand } = useDoc<ManagedEntityDoc>(fallbackBrandRef);
    const { data: fallbackClub } = useDoc<ManagedEntityDoc>(fallbackClubRef);

    const selfNgoRef = useMemoFirebase(
        () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.ngos, authUser.uid) : null),
        [firestore, authUser?.uid],
    );
    const { data: selfNgo } = useDoc<ManagedEntityDoc>(selfNgoRef);

    const activeEntity = useMemo<{ kind: EntityKind; data: ManagedEntityDoc } | null>(() => {
        const ngo = (adminNgos && adminNgos[0]) || fallbackNgo || selfNgo;
        if (ngo?.id) return { kind: 'ngo', data: ngo };
        const brand = (adminBrands && adminBrands[0]) || fallbackBrand;
        if (brand?.id) return { kind: 'brand', data: brand };
        const club = (adminClubs && adminClubs[0]) || fallbackClub;
        if (club?.id) return { kind: 'club', data: club };
        return null;
    }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub, selfNgo]);

    // Load posts from Firestore (client-side sort to avoid composite index requirement
    // and to include legacy posts that may be missing the createdAt field)
    const postsQuery = useMemoFirebase(() => {
        if (!authUser?.uid) return null;
        return query(
            collection(firestore, COLLECTIONS.posts),
            where('authorId', '==', authUser.uid),
        );
    }, [firestore, authUser?.uid]);

    const { data: firestorePosts, isLoading } = useCollection<Post & { authorId: string; createdAt: unknown }>(postsQuery);

    const posts = useMemo(() => {
        const list = firestorePosts || [];
        const ts = (p: Post & { createdAt?: unknown; timestamp?: string }): number => {
            const c = p.createdAt as { toDate?: () => Date } | number | string | undefined;
            if (c && typeof c === 'object' && typeof c.toDate === 'function') { try { return c.toDate().getTime(); } catch {} }
            if (typeof c === 'number') return c;
            if (typeof c === 'string') { const t = Date.parse(c); if (!Number.isNaN(t)) return t; }
            if (p.timestamp) { const t = Date.parse(p.timestamp); if (!Number.isNaN(t)) return t; }
            return 0;
        };
        return [...list].sort((a, b) => ts(b) - ts(a));
    }, [firestorePosts]);

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

        // Resolve author identity: prefer managed entity (NGO/brand/club),
        // fall back to user display name for individual accounts.
        const entityName = activeEntity?.data?.name || activeEntity?.data?.shortName;
        const entityLogo = activeEntity?.data?.files?.logo || activeEntity?.data?.logoUrl;
        const authorName = entityName || authUser.displayName || 'Kuruluşunuz';
        const authorAvatar = entityLogo || authUser.photoURL || '';

        const author: Record<string, unknown> = {
            name: authorName,
            avatarUrl: authorAvatar,
        };
        if (activeEntity?.data?.id) {
            author.entityId = activeEntity.data.id;
            author.entityKind = activeEntity.kind;
        }

        const newPost: Record<string, unknown> = {
            authorId: authUser.uid,
            author,
            content: newPostContent,
            timestamp: new Date().toLocaleDateString('tr-TR'),
            createdAt: Timestamp.now(),
            likes: 0,
            comments: 0,
        };

        if (imageUrl.trim()) {
            newPost.imageUrl = imageUrl.trim();
        }

        try {
            await addDoc(collection(firestore, COLLECTIONS.posts), newPost);
            setNewPostContent('');
            setImageUrl('');
            toast({ title: 'Gönderi paylaşıldı!', description: 'Yeni gönderiniz zaman tünelinde yayınlandı.' });
        } catch (error) {
            console.error('Post create failed:', error);
            const err = error as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: 'Gönderi paylaşılamadı.',
                description: err?.code === 'permission-denied' ? 'Sunucu izin vermedi.' : (err?.message || 'Beklenmeyen bir hata oluştu.'),
            });
        }

        setIsCreating(false);
    };

    const handleDeletePost = async (id: string) => {
        if (!authUser?.uid) return;
        try {
            await deleteDoc(doc(firestore, COLLECTIONS.posts, id));
            toast({ variant: 'destructive', title: 'Gönderi silindi.' });
        } catch (error) {
            console.error('Post delete failed:', error);
            const err = error as { message?: string };
            toast({ variant: 'destructive', title: 'Gönderi silinemedi.', description: err?.message });
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
            await updateDoc(doc(firestore, COLLECTIONS.posts, id), {
                content: editContent,
                updatedAt: Timestamp.now(),
            });
            toast({ title: 'Gönderi güncellendi!' });
            setEditingPostId(null);
            setEditContent('');
        } catch (error) {
            console.error('Post update failed:', error);
            const err = error as { message?: string };
            toast({ variant: 'destructive', title: 'Gönderi güncellenemedi.', description: err?.message });
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
        <CardFooter className="flex justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button variant="outline" onClick={() => { setImageDraft(imageUrl); setIsImageDialogOpen(true); }}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {imageUrl ? 'Görseli Değiştir' : 'Görsel Ekle'}
            </Button>
            {imageUrl && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                <span className="truncate max-w-[200px]">{imageUrl.startsWith('data:') ? 'Yerel görsel (base64)' : imageUrl}</span>
                <Button variant="ghost" size="sm" onClick={() => setImageUrl('')} className="h-7 px-2">Kaldır</Button>
              </div>
            )}
          </div>
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

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Görsel Ekle</DialogTitle>
            <DialogDescription>
              Bir görsel URL&apos;si yapıştırabilir ya da küçük bir görseli (max 1MB) doğrudan yükleyebilirsiniz. Storage henüz aktif değil — küçük resimler base64 olarak kaydedilir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="image-url">Görsel URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://..."
                value={imageDraft.startsWith('data:') ? '' : imageDraft}
                onChange={(e) => setImageDraft(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-file">Veya cihazdan yükle</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1024 * 1024) {
                    toast({ variant: 'destructive', title: 'Görsel çok büyük', description: 'Lütfen 1MB altında bir görsel seçin (Storage aktif değil).' });
                    e.target.value = '';
                    return;
                  }
                  setIsUploading(true);
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === 'string' ? reader.result : '';
                    setImageDraft(result);
                    setIsUploading(false);
                  };
                  reader.onerror = () => {
                    toast({ variant: 'destructive', title: 'Görsel okunamadı' });
                    setIsUploading(false);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {isUploading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Görsel hazırlanıyor...</p>
              )}
            </div>
            {imageDraft && (/^https?:\/\//i.test(imageDraft) || imageDraft.startsWith('data:image/')) && (
              <div className="rounded-md border overflow-hidden relative aspect-video bg-muted">
                <Image src={imageDraft} alt="Önizleme" fill className="object-cover" unoptimized />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsImageDialogOpen(false)}>İptal</Button>
            <Button onClick={() => {
              const trimmed = imageDraft.trim();
              if (trimmed && !/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image/')) {
                toast({ variant: 'destructive', title: 'Geçersiz görsel', description: 'Görsel URL\'si http(s) ile başlamalı veya yüklenen bir dosya olmalıdır.' });
                return;
              }
              setImageUrl(trimmed);
              setIsImageDialogOpen(false);
              toast({ title: trimmed ? 'Görsel eklendi' : 'Görsel kaldırıldı' });
            }}>Onayla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{post.author?.name || 'Kuruluşunuz'}</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                </div>
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
