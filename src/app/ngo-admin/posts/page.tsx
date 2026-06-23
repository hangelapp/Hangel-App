
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp, addDoc, updateDoc, deleteDoc, setDoc, getDoc, increment } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';

type EntityKind = 'ngo' | 'brand' | 'club';
interface ManagedEntityDoc {
    id: string;
    name?: string;
    shortName?: string;
    adminUserId?: string;
    files?: { logo?: string };
    logoUrl?: string;
}

export default function PostsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const { t } = useTranslation();

    const [newPostContent, setNewPostContent] = useState('');
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageDraft, setImageDraft] = useState('');
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // ---- Aktif kurum (ActiveEntityProvider'dan) — banner ve sayfa tek kaynak ----
    const { id: activeId, kind: activeKind } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<ManagedEntityDoc>();

    const activeEntity = useMemo<{ kind: EntityKind; data: ManagedEntityDoc } | null>(() => {
        if (!activeId || !activeKind || !activeDoc) return null;
        return { kind: activeKind, data: activeDoc };
    }, [activeId, activeKind, activeDoc]);

    // Load the ACTIVE ORG's own posts from Firestore. We query by the org id
    // (authorId == org id) so each org sees and manages only its own content.
    // Client-side sort avoids a composite index requirement and tolerates legacy
    // posts that may be missing the createdAt field.
    const activeOrgId = activeEntity?.data?.id ?? null;
    const postsQuery = useMemoFirebase(() => {
        if (!activeOrgId) return null;
        return query(
            collection(firestore, COLLECTIONS.posts),
            where('authorId', '==', activeOrgId),
        );
    }, [firestore, activeOrgId]);

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

    const handleImageUpload = async (file: File) => {
        if (!activeEntity?.data?.id) {
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastNoEntityTitle'), description: t('ngo_admin_posts.toastNoEntityDesc') });
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Geçersiz dosya', description: 'Lütfen bir görsel dosyası seçin.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Görsel çok büyük', description: 'Lütfen 5MB altında bir görsel seçin.' });
            return;
        }
        setIsUploading(true);
        try {
            const storage = getStorage();
            const folder = activeEntity.kind === 'ngo' ? 'ngos' : activeEntity.kind === 'brand' ? 'brands' : 'clubs';
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${folder}/${activeEntity.data.id}/posts/${Date.now()}-${safeName}`;
            const r = storageRef(storage, path);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            setImageDraft(url);
            toast({ title: 'Görsel yüklendi', description: 'Onayla butonuna basınca gönderiye eklenir.' });
        } catch (error) {
            const err = error as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: 'Görsel yüklenemedi',
                description: err?.code === 'storage/unauthorized' ? t('ngo_admin_posts.toastPermissionDenied') : (err?.message?.slice(0, 160) || t('ngo_admin_posts.toastUnexpected')),
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastEmptyPost') });
            return;
        }

        if (!authUser?.uid) {
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastAuthRequired') });
            return;
        }

        if (!activeEntity?.data?.id) {
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastNoEntityTitle'), description: t('ngo_admin_posts.toastNoEntityDesc') });
            return;
        }

        setIsCreating(true);

        // Author the post AS the active org (NGO/brand/club). The top-level
        // authorId is the ORG id (not the managing user) so the post can be
        // queried back as the org's own content and appears in the public
        // timeline under the org's identity.
        const entityName = activeEntity.data.name || activeEntity.data.shortName;
        const entityLogo = activeEntity.data.files?.logo || activeEntity.data.logoUrl;
        const authorName = entityName || t('ngo_admin_posts.orgFallback');
        const authorAvatar = entityLogo || '';

        const author: Record<string, unknown> = {
            name: authorName,
            avatarUrl: authorAvatar,
            entityId: activeEntity.data.id,
            entityKind: activeEntity.kind,
        };

        const newPost: Record<string, unknown> = {
            authorId: activeEntity.data.id,
            authorType: activeEntity.kind,
            // Record the managing user that published on the org's behalf (audit trail).
            managerUserId: authUser.uid,
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
            toast({ title: t('ngo_admin_posts.toastPostShared'), description: t('ngo_admin_posts.toastPostSharedDesc') });
        } catch (error) {
            console.error('Post create failed:', error);
            const err = error as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: t('ngo_admin_posts.toastPostShareFailed'),
                description: err?.code === 'permission-denied' ? t('ngo_admin_posts.toastPermissionDenied') : (err?.message || t('ngo_admin_posts.toastUnexpected')),
            });
        }

        setIsCreating(false);
    };

    const handleDeletePost = async (id: string) => {
        if (!authUser?.uid) return;
        try {
            await deleteDoc(doc(firestore, COLLECTIONS.posts, id));
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastPostDeleted') });
        } catch (error) {
            console.error('Post delete failed:', error);
            const err = error as { message?: string };
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastPostDeleteFailed'), description: err?.message });
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

    const [busyAction, setBusyAction] = React.useState<{ postId: string; kind: 'like' | 'share' } | null>(null);

    const handleToggleLike = async (postId: string) => {
        if (!authUser?.uid) {
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastSessionRequired') });
            return;
        }
        setBusyAction({ postId, kind: 'like' });
        try {
            const likeRef = doc(firestore, COLLECTIONS.posts, postId, 'likes', authUser.uid);
            const postRef = doc(firestore, COLLECTIONS.posts, postId);
            const existing = await getDoc(likeRef);
            if (existing.exists()) {
                await deleteDoc(likeRef);
                await updateDoc(postRef, { likes: increment(-1) }).catch(() => {
                    toast({ variant: 'destructive', title: 'Beğeni güncellenemedi, lütfen tekrar deneyin.' });
                });
                toast({ title: t('ngo_admin_posts.toastLikeRemoved') });
            } else {
                await setDoc(likeRef, { createdAt: Timestamp.now(), userId: authUser.uid });
                await updateDoc(postRef, { likes: increment(1) }).catch(() => {
                    toast({ variant: 'destructive', title: 'Beğeni güncellenemedi, lütfen tekrar deneyin.' });
                });
                toast({ title: t('ngo_admin_posts.toastLiked') });
            }
        } catch (error) {
            console.error('Like toggle failed:', error);
            const err = error as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: t('ngo_admin_posts.toastLikeFailedTitle'),
                description: err?.code === 'permission-denied'
                    ? t('ngo_admin_posts.toastLikePermDenied')
                    : (err?.message || t('ngo_admin_posts.toastUnexpected')),
            });
        } finally {
            setBusyAction(null);
        }
    };

    const handleSharePost = async (postId: string, content?: string) => {
        if (typeof window === 'undefined') return;
        setBusyAction({ postId, kind: 'share' });
        try {
            const url = `${window.location.origin}/timeline?post=${postId}`;
            const shareData = {
                title: t('ngo_admin_posts.shareDataTitle'),
                text: (content || '').slice(0, 140),
                url,
            };
            const navAny = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
            if (typeof navAny.share === 'function') {
                try {
                    await navAny.share(shareData);
                    toast({ title: t('ngo_admin_posts.toastShared') });
                    return;
                } catch (shareErr) {
                    const e = shareErr as { name?: string };
                    if (e?.name === 'AbortError') return; // user cancelled
                }
            }
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                toast({ title: t('ngo_admin_posts.toastLinkCopied'), description: t('ngo_admin_posts.toastLinkCopiedDesc') });
            } else {
                toast({ variant: 'destructive', title: t('ngo_admin_posts.toastShareUnsupportedTitle'), description: t('ngo_admin_posts.toastShareUnsupportedDesc') });
            }
        } catch (error) {
            console.error('Share failed:', error);
            const err = error as { message?: string };
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastShareFailed'), description: err?.message });
        } finally {
            setBusyAction(null);
        }
    };

    const handleSaveEdit = async (id: string) => {
        if (!editContent.trim()) {
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastEmptyPostEdit') });
            return;
        }

        try {
            await updateDoc(doc(firestore, COLLECTIONS.posts, id), {
                content: editContent,
                updatedAt: Timestamp.now(),
            });
            toast({ title: t('ngo_admin_posts.toastPostUpdated') });
            setEditingPostId(null);
            setEditContent('');
        } catch (error) {
            console.error('Post update failed:', error);
            const err = error as { message?: string };
            toast({ variant: 'destructive', title: t('ngo_admin_posts.toastPostUpdateFailed'), description: err?.message });
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t('ngo_admin_posts.pageTitle')}</h1>
          <p className="text-muted-foreground">
            {t('ngo_admin_posts.pageSubtitle')}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/timeline">
            <ExternalLink className="mr-2 h-4 w-4" /> {t('ngo_admin_posts.openTimeline')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('ngo_admin_posts.newPostTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t('ngo_admin_posts.newPostPlaceholder')}
            rows={4}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button variant="outline" onClick={() => { setImageDraft(imageUrl); setIsImageDialogOpen(true); }}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {imageUrl ? t('ngo_admin_posts.changeImage') : t('ngo_admin_posts.addImage')}
            </Button>
            {imageUrl && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                <span className="truncate max-w-[200px]">{imageUrl.startsWith('data:') ? t('ngo_admin_posts.localImageLabel') : imageUrl}</span>
                <Button variant="ghost" size="sm" onClick={() => setImageUrl('')} className="h-7 px-2">{t('ngo_admin_posts.removeImage')}</Button>
              </div>
            )}
          </div>
          <Button onClick={handleCreatePost} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('ngo_admin_posts.shareBtn')}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('ngo_admin_posts.imageDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('ngo_admin_posts.imageDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="image-url">{t('ngo_admin_posts.imageUrlLabel')}</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://..."
                value={imageDraft.startsWith('data:') ? '' : imageDraft}
                onChange={(e) => setImageDraft(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-file">{t('ngo_admin_posts.imageFileLabel')}</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleImageUpload(file);
                  e.target.value = '';
                }}
              />
              {isUploading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Görsel yükleniyor...</p>
              )}
            </div>
            {imageDraft && (/^https?:\/\//i.test(imageDraft) || imageDraft.startsWith('data:image/')) && (
              <div className="rounded-md border overflow-hidden relative aspect-video bg-muted">
                <Image src={imageDraft} alt={t('ngo_admin_posts.imagePreviewAlt')} fill className="object-cover" unoptimized />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsImageDialogOpen(false)}>{t('ngo_admin_posts.cancel')}</Button>
            <Button onClick={() => {
              const trimmed = imageDraft.trim();
              if (trimmed && !/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image/')) {
                toast({ variant: 'destructive', title: t('ngo_admin_posts.invalidImageTitle'), description: t('ngo_admin_posts.invalidImageDesc') });
                return;
              }
              setImageUrl(trimmed);
              setIsImageDialogOpen(false);
              toast({ title: trimmed ? t('ngo_admin_posts.imageAddedToast') : t('ngo_admin_posts.imageRemovedToast') });
            }}>{t('ngo_admin_posts.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t('ngo_admin_posts.existingPosts')}</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{t('ngo_admin_posts.noPosts')}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">{t('ngo_admin_posts.noPostsHint')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{post.author?.name || t('ngo_admin_posts.orgFallback')}</p>
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
                      <Check className="mr-2 h-4 w-4" /> {t('ngo_admin_posts.saveEdit')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="mr-2 h-4 w-4" /> {t('ngo_admin_posts.cancelEdit')}
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
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => handleToggleLike(post.id)}
                    disabled={busyAction?.postId === post.id && busyAction.kind === 'like'}
                    aria-label={t('ngo_admin_posts.likeAria')}
                >
                    {busyAction?.postId === post.id && busyAction.kind === 'like'
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Heart className="mr-2 h-4 w-4" />}
                    {post.likes ?? 0} {t('ngo_admin_posts.likeSuffix')}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => handleSharePost(post.id, post.content)}
                    disabled={busyAction?.postId === post.id && busyAction.kind === 'share'}
                    aria-label={t('ngo_admin_posts.shareAria')}
                >
                    {busyAction?.postId === post.id && busyAction.kind === 'share'
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Share2 className="mr-2 h-4 w-4" />}
                    {t('ngo_admin_posts.shareLabel')}
                </Button>
                {editingPostId !== post.id && (
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleStartEdit(post)}>
                    <Pencil className="mr-2 h-4 w-4" /> {t('ngo_admin_posts.editBtn')}
                  </Button>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" size="sm" className={editingPostId === post.id ? "ml-auto" : ""}>
                           <Trash2 className="mr-2 h-4 w-4" /> {t('ngo_admin_posts.deleteBtn')}
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('ngo_admin_posts.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('ngo_admin_posts.deleteConfirmDesc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('ngo_admin_posts.deleteCancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => handleDeletePost(post.id)}>
                                {t('ngo_admin_posts.deleteConfirm')}
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
