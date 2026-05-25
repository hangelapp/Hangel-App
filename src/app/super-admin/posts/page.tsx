'use client';

import React, { useMemo, useState } from 'react';
import {
    Card, CardContent, CardHeader, CardFooter,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import {
    Loader2, Trash2, Pencil, Power, PowerOff, Search, MessageSquare, Heart, Calendar, Save,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

type Post = {
    id: string;
    authorId?: string;
    author?: { name?: string; avatarUrl?: string };
    content?: string;
    imageUrl?: string;
    timestamp?: string;
    createdAt?: unknown;
    likes?: number;
    comments?: number;
    sponsored?: boolean;
    status?: 'Aktif' | 'Pasif' | 'Onay Bekliyor' | string;
};

const fmtDate = (v: unknown) => {
    if (!v) return '';
    try {
        const maybeDate = v as { toDate?: () => Date } | null;
        if (maybeDate?.toDate) return format(maybeDate.toDate(), 'd MMM yyyy HH:mm', { locale: tr });
        if (typeof v === 'string') {
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) return format(d, 'd MMM yyyy HH:mm', { locale: tr });
            return v;
        }
    } catch {}
    return '';
};

export default function PostsAdminPage() {
    const db = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive' | 'pending'>('all');
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editImageUrl, setEditImageUrl] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const postsQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.posts), orderBy('createdAt', 'desc')) : null),
        [db],
    );
    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    const filtered = useMemo(() => {
        let list = posts || [];
        const status = (p: Post) => p.status || 'Aktif';
        if (statusFilter === 'active') list = list.filter(p => status(p) === 'Aktif');
        else if (statusFilter === 'passive') list = list.filter(p => status(p) === 'Pasif');
        else if (statusFilter === 'pending') list = list.filter(p => status(p) === 'Onay Bekliyor');

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(p =>
                (p.content || '').toLowerCase().includes(q) ||
                (p.author?.name || '').toLowerCase().includes(q),
            );
        }
        return list;
    }, [posts, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const all = posts || [];
        return {
            total: all.length,
            active: all.filter(p => (p.status || 'Aktif') === 'Aktif').length,
            passive: all.filter(p => p.status === 'Pasif').length,
            pending: all.filter(p => p.status === 'Onay Bekliyor').length,
        };
    }, [posts]);

    const handleToggleStatus = async (id: string, current?: string) => {
        const newStatus = current === 'Pasif' ? 'Aktif' : 'Pasif';
        try {
            await updateDoc(doc(db, COLLECTIONS.posts, id), { status: newStatus });
            toast({
                title: newStatus === 'Aktif' ? 'Gönderi Aktifleştirildi' : 'Gönderi Pasife Alındı',
                description: newStatus === 'Aktif' ? 'Akışta görünür olacak.' : 'Akıştan kaldırıldı, kullanıcılar göremez.',
            });
        } catch (e) {
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Hata.';
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : message,
            });
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.posts, id), { status: 'Aktif' });
            toast({ title: 'Onaylandı', description: 'Gönderi aktifleştirildi.' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        }
    };

    const handleDelete = async (id: string, authorName?: string) => {
        try {
            await deleteDoc(doc(db, COLLECTIONS.posts, id));
            toast({
                variant: 'destructive',
                title: 'Gönderi Silindi',
                description: `${authorName || 'Yazarın'} gönderisi kalıcı olarak silindi.`,
            });
        } catch (e) {
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Hata.';
            toast({
                variant: 'destructive',
                title: 'Silinemedi',
                description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : message,
            });
        }
    };

    const handleStartEdit = (p: Post) => {
        setEditingPost(p);
        setEditContent(p.content || '');
        setEditImageUrl(p.imageUrl || '');
    };

    const handleSaveEdit = async () => {
        if (!editingPost) return;
        setSavingEdit(true);
        try {
            await updateDoc(doc(db, COLLECTIONS.posts, editingPost.id), {
                content: editContent,
                imageUrl: editImageUrl || null,
            });
            toast({ title: 'Kaydedildi', description: 'Gönderi içeriği güncellendi.' });
            setEditingPost(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setSavingEdit(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Gönderi Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">
                    Platformdaki gönderileri yönet, içerik düzenle, pasife al veya sil.
                </p>
            </div>

            {/* Stat kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-2xl cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('all')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-black">{stats.total}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Tümü</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-green-300/50 cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('active')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-green-600">{stats.active}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Aktif</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-amber-300/50 cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('pending')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Onay Bekliyor</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('passive')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-muted-foreground">{stats.passive}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Pasif</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtre & arama */}
            <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="İçerik veya yazar ara..."
                            className="pl-10 h-10 rounded-xl"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'passive' | 'pending')}>
                        <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="pending">Onay Bekleyen</SelectItem>
                            <SelectItem value="passive">Pasif</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground ml-auto">
                        <strong>{filtered.length}</strong> gönderi gösteriliyor
                    </p>
                </CardContent>
            </Card>

            {/* Gönderi listesi */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground border rounded-2xl">
                        <MessageSquare className="h-10 w-10 mx-auto opacity-30 mb-2" />
                        <p>Bu filtreye uyan gönderi bulunamadı.</p>
                    </div>
                ) : filtered.map(post => {
                    const status = post.status || 'Aktif';
                    const isPassive = status === 'Pasif';
                    const isPending = status === 'Onay Bekliyor';
                    return (
                        <Card key={post.id} className={cn('rounded-2xl', isPassive && 'opacity-60')}>
                            <CardHeader className="flex-row items-center gap-3 p-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={post.author?.avatarUrl} />
                                    <AvatarFallback>{(post.author?.name || '?').slice(0, 1)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-sm truncate">{post.author?.name || 'Bilinmeyen'}</p>
                                        {status === 'Aktif' && <Badge className="bg-green-600 text-[10px]">AKTİF</Badge>}
                                        {isPending && <Badge className="bg-amber-500 text-[10px]">ONAY BEKLİYOR</Badge>}
                                        {isPassive && <Badge variant="secondary" className="text-[10px]">PASİF</Badge>}
                                        {post.sponsored && <Badge variant="outline" className="text-[10px]">Sponsorlu</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <Calendar className="h-3 w-3" /> {fmtDate(post.createdAt) || post.timestamp || '—'}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                                {post.imageUrl && (
                                    <div className="relative mt-3 aspect-video rounded-xl overflow-hidden border">
                                        <Image src={post.imageUrl} alt={post.content ? post.content.slice(0, 80) : 'Gönderi görseli'} fill className="object-cover" />
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes || 0}</span>
                                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.comments || 0}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 px-4 pb-4">
                                {isPending && (
                                    <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700" onClick={() => handleApprove(post.id)}>
                                        Onayla
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleStartEdit(post)}>
                                    <Pencil className="h-3.5 w-3.5 mr-1" /> Düzenle
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => handleToggleStatus(post.id, status)}
                                >
                                    {isPassive ? <><Power className="h-3.5 w-3.5 mr-1" /> Aktif Et</> : <><PowerOff className="h-3.5 w-3.5 mr-1" /> Pasife Al</>}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-[2rem]">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Gönderiyi sil?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bu işlem geri alınamaz. Gönderi platformdan kalıcı olarak silinecek.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                            <AlertDialogAction
                                                className={cn(buttonVariants({ variant: 'destructive' }))}
                                                onClick={() => handleDelete(post.id, post.author?.name)}
                                            >
                                                Evet, Sil
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Düzenle dialog */}
            <Dialog open={!!editingPost} onOpenChange={(o) => !o && setEditingPost(null)}>
                <DialogContent className="rounded-[2rem] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Gönderiyi Düzenle</DialogTitle>
                        <DialogDescription>
                            {editingPost?.author?.name} tarafından yazılmış gönderi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>İçerik</Label>
                            <Textarea
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                rows={6}
                                placeholder="Gönderi metni..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Görsel URL (opsiyonel)</Label>
                            <Input
                                value={editImageUrl}
                                onChange={e => setEditImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
                            {editImageUrl && (
                                <div className="relative aspect-video rounded-lg overflow-hidden border">
                                    <Image src={editImageUrl} alt="Gönderi görseli önizleme" fill className="object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPost(null)}>İptal</Button>
                        <Button onClick={handleSaveEdit} disabled={savingEdit} className="font-bold">
                            {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
