
'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { ImagePlus, Send, Heart, Share2, Trash2, Pencil, X, Check, Loader2, Inbox } from 'lucide-react';
import Image from 'next/image';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useCollection, useMemoFirebase, useFirebaseApp, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, Timestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';

export default function PostsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const firebaseApp = useFirebaseApp();
    const { user: authUser } = useUser();

    const [newPostContent, setNewPostContent] = useState('');
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Image upload state
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Lütfen 5 MB\'dan küçük bir görsel seçin.' });
            return;
        }
        setSelectedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreviewUrl(null);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadImage = async (file: File, uid: string): Promise<string> => {
        const storage = getStorage(firebaseApp);
        const fileRef = storageRef(storage, `posts/${uid}/${Date.now()}_${file.name}`);
        setIsUploading(true);
        setUploadProgress(0);

        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(fileRef, file);
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setUploadProgress(pct);
                },
                (error) => {
                    setIsUploading(false);
                    reject(error);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    setIsUploading(false);
                    resolve(url);
                }
            );
        });
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            toast({ variant: 'destructive', title: 'Gönderi boş olamaz.' });
            return;
        }

        if (!authUser?.uid) {
            toast({ variant: 'destructive', title: 'Oturum açmanız gerekiyor.' });
            return;
        }

        setIsCreating(true);

        let imageUrl = '';
        if (selectedImage) {
            try {
                imageUrl = await uploadImage(selectedImage, authUser.uid);
            } catch {
                toast({ variant: 'destructive', title: 'Görsel yüklenemedi.', description: 'Gönderi görselsiz paylaşılıyor.' });
            }
        }

        const newPost = {
            authorId: authUser.uid,
            author: {
                name: authUser.displayName || 'Kuruluşunuz',
                avatarUrl: authUser.photoURL || '',
            },
            content: newPostContent,
            imageUrl,
            timestamp: new Date().toLocaleDateString('tr-TR'),
            createdAt: Timestamp.now(),
            likes: 0,
            comments: 0,
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'posts'), newPost);
            setNewPostContent('');
            handleRemoveImage();
            toast({ title: "Gönderi paylaşıldı!", description: "Yeni gönderiniz zaman tünelinde yayınlandı." });
        } catch {
            toast({ variant: 'destructive', title: 'Gönderi paylaşılamadı.', description: 'Bir hata oluştu, lütfen tekrar deneyin.' });
        }

        setIsCreating(false);
    };

    const handleDeletePost = (id: string) => {
        if (!authUser?.uid) return;
        try {
            deleteDocumentNonBlocking(doc(firestore, 'posts', id));
            toast({ variant: 'destructive', title: "Gönderi silindi." });
        } catch {
            toast({ variant: 'destructive', title: 'Gönderi silinemedi.' });
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

    const handleSaveEdit = (id: string) => {
        if (!editContent.trim()) {
            toast({ variant: 'destructive', title: 'Gönderi boş olamaz.' });
            return;
        }

        try {
            updateDocumentNonBlocking(doc(firestore, 'posts', id), {
                content: editContent,
                updatedAt: Timestamp.now(),
            });
            toast({ title: "Gönderi güncellendi!" });
            setEditingPostId(null);
            setEditContent('');
        } catch {
            toast({ variant: 'destructive', title: 'Gönderi güncellenemedi.' });
        }
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
                <CardContent className="space-y-3">
                    <Textarea
                        placeholder="Neler oluyor?"
                        rows={4}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                    />

                    {/* Image preview */}
                    {imagePreviewUrl && (
                        <div className="relative rounded-xl overflow-hidden border bg-muted">
                            <div className="relative aspect-video w-full">
                                <Image src={imagePreviewUrl} alt="Seçilen görsel" fill className="object-cover" />
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 rounded-full"
                                onClick={handleRemoveImage}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <p className="text-xs text-muted-foreground px-3 py-1.5">
                                {selectedImage?.name} ({((selectedImage?.size || 0) / 1024).toFixed(0)} KB)
                            </p>
                        </div>
                    )}

                    {/* Upload progress */}
                    {isUploading && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Görsel yükleniyor... %{uploadProgress}</p>
                            <Progress value={uploadProgress} className="h-1.5" />
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                    />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCreating || isUploading}
                    >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {selectedImage ? 'Görseli Değiştir' : 'Görsel Ekle'}
                    </Button>
                    <Button onClick={handleCreatePost} disabled={isCreating || isUploading}>
                        {(isCreating || isUploading) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Paylaş
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
                                                <X className="mr-2 h-4 w-4" /> Vazgeç
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
