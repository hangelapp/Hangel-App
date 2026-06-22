'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { AdBanner } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PlusCircle, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type AdStatus = 'Aktif' | 'Pasif';

interface AdDoc {
    id: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    status?: AdStatus;
}

type AdFormValues = Omit<AdBanner, 'id'>;

const AdForm = ({ ad, onSave, saving }: { ad: AdDoc | null, onSave: (ad: AdFormValues) => void, saving: boolean }) => {
    const [title, setTitle] = useState(ad?.title || '');
    const [description, setDescription] = useState(ad?.description || '');
    const [imageUrl, setImageUrl] = useState(ad?.imageUrl || '');
    const [link, setLink] = useState(ad?.link || '');
    const { toast } = useToast();

    const handleSave = () => {
        if (!title || !description || !imageUrl || !link) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen tüm alanları doldurun.' });
            return;
        }
        onSave({ title, description, imageUrl, link });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ad-title">Reklam Başlığı</Label>
                <Input id="ad-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Okul Alışverişiyle Destek Ol!" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ad-description">Açıklama</Label>
                <Input id="ad-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kırtasiye ihtiyaçlarınızla TEGV'e bağış yapın." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ad-image-url">Görsel URL</Label>
                <Input id="ad-image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ad-link">Yönlendirme Linki</Label>
                <Input id="ad-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/market" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
            </Button>
        </div>
    );
};

export default function AdsPage() {
    const { toast } = useToast();
    const db = useFirestore();

    const adsQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.siteAds), orderBy('createdAt', 'desc')) : null),
        [db],
    );
    const { data: ads, isLoading } = useCollection<AdDoc>(adsQuery);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<AdDoc | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const handleSaveAd = async (values: AdFormValues) => {
        if (!db) return;
        setSaving(true);
        try {
            if (editingAd) {
                await updateDoc(doc(db, COLLECTIONS.siteAds, editingAd.id), {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Reklam Güncellendi' });
            } else {
                await addDoc(collection(db, COLLECTIONS.siteAds), {
                    ...values,
                    status: 'Aktif',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Yeni Reklam Eklendi' });
            }
            setIsFormOpen(false);
            setEditingAd(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İşlem tamamlanamadı.';
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: message });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (ad: AdDoc) => {
        if (!db) return;
        const newStatus: AdStatus = ad.status === 'Aktif' ? 'Pasif' : 'Aktif';
        setTogglingId(ad.id);
        try {
            await updateDoc(doc(db, COLLECTIONS.siteAds, ad.id), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Durum Güncellendi', description: `Reklam durumu "${newStatus}" olarak ayarlandı.` });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İşlem tamamlanamadı.';
            toast({ variant: 'destructive', title: 'Güncellenemedi', description: message });
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, COLLECTIONS.siteAds, id));
            toast({ variant: 'destructive', title: 'Reklam Silindi' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İşlem tamamlanamadı.';
            toast({ variant: 'destructive', title: 'Silinemedi', description: message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Reklam Yönetimi</h1>
                <Button onClick={() => { setEditingAd(null); setIsFormOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Yeni Reklam Ekle
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Reklam Alanları</CardTitle>
                    <CardDescription>
                        Platformdaki reklam bannerlarını yönetin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (ads || []).length === 0 ? (
                        <p className="text-center text-muted-foreground py-12">Henüz reklam eklenmedi. &quot;Yeni Reklam Ekle&quot; ile başlayın.</p>
                    ) : (ads || []).map(ad => (
                        <Card key={ad.id}>
                            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                                <div className="w-full md:w-48 h-24 relative rounded-md overflow-hidden flex-shrink-0">
                                    {ad.imageUrl && <Image src={ad.imageUrl} alt={ad.title || ''} fill className="object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{ad.title}</p>
                                    <p className="text-sm text-muted-foreground">{ad.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Link: {ad.link}</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-2 self-start md:self-center w-full md:w-auto">
                                    <Button size="sm" variant="outline" onClick={() => { setEditingAd(ad); setIsFormOpen(true); }}>Düzenle</Button>
                                    <Button size="sm" variant="outline" disabled={togglingId === ad.id} onClick={() => handleToggleStatus(ad)}>
                                        {togglingId === ad.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        {ad.status === 'Pasif' ? 'Aktif Et' : 'Pasife Al'}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive">Sil</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Reklamı silmek istediğinizden emin misiniz?</AlertDialogTitle>
                                                <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteAd(ad.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Evet, Sil</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAd ? 'Reklamı Düzenle' : 'Yeni Reklam Ekle'}</DialogTitle>
                    </DialogHeader>
                    <AdForm ad={editingAd} onSave={handleSaveAd} saving={saving} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
