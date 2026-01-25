'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { adBanners as initialAdBanners } from "@/lib/data";
import type { AdBanner } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PlusCircle } from 'lucide-react';

type AdBannerWithStatus = AdBanner & { status: 'Aktif' | 'Pasif' };

const AdForm = ({ ad, onSave }: { ad: Partial<AdBanner> | null, onSave: (ad: AdBanner) => void }) => {
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
        onSave({
            id: ad?.id || Date.now().toString(),
            title,
            description,
            imageUrl,
            link,
        });
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
            <Button onClick={handleSave} className="w-full">Kaydet</Button>
        </div>
    );
};

export default function AdsPage() {
    const { toast } = useToast();
    const [ads, setAds] = useState<AdBannerWithStatus[]>(initialAdBanners.map(ad => ({ ...ad, status: 'Aktif' })));
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<AdBanner | null>(null);

    const handleSaveAd = (ad: AdBanner) => {
        const isEditing = ads.some(a => a.id === ad.id);
        if (isEditing) {
            setAds(prev => prev.map(a => a.id === ad.id ? { ...ad, status: a.status } : a));
            toast({ title: 'Reklam Güncellendi' });
        } else {
            setAds(prev => [{ ...ad, status: 'Aktif' }, ...prev]);
            toast({ title: 'Yeni Reklam Eklendi' });
        }
        setIsFormOpen(false);
        setEditingAd(null);
    };
    
    const handleToggleStatus = (id: string) => {
        setAds(prev => prev.map(ad => {
            if (ad.id === id) {
                const newStatus = ad.status === 'Aktif' ? 'Pasif' : 'Aktif';
                toast({ title: 'Durum Güncellendi', description: `Reklam durumu "${newStatus}" olarak ayarlandı.` });
                return { ...ad, status: newStatus };
            }
            return ad;
        }));
    };

    const handleDeleteAd = (id: string) => {
        setAds(prev => prev.filter(ad => ad.id !== id));
        toast({ variant: 'destructive', title: 'Reklam Silindi' });
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
                    {ads.map(ad => (
                        <Card key={ad.id}>
                            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                                <div className="w-full md:w-48 h-24 relative rounded-md overflow-hidden flex-shrink-0">
                                    <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{ad.title}</p>
                                    <p className="text-sm text-muted-foreground">{ad.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Link: {ad.link}</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-2 self-start md:self-center w-full md:w-auto">
                                    <Button size="sm" variant="outline" onClick={() => { setEditingAd(ad); setIsFormOpen(true); }}>Düzenle</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleToggleStatus(ad.id)}>{ad.status === 'Aktif' ? 'Pasife Al' : 'Aktif Et'}</Button>
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
                    <AdForm ad={editingAd} onSave={handleSaveAd} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
