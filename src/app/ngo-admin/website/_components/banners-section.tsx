'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import type { Banner } from './types';

interface BannersSectionProps {
    banners: Banner[];
    onAdd: () => void;
    onRemove: (id: string) => void;
    onReplaceClick: () => void;
}

export function BannersSection({ banners, onRemove }: BannersSectionProps) {
    const db = useFirestore();
    const { id: activeId, kind } = useActiveEntity();
    const ngoId = kind === 'ngo' ? activeId : null;
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Görseller yüklendikçe yerel olarak güncellenen liste (custom-domain-section ile aynı
    // self-contained pattern). Prop ilk hydrate kaynağı; sonrası bu state üzerinden ilerler.
    const [items, setItems] = useState<Banner[]>(banners);
    const hydratedRef = useRef(banners.length > 0);
    // Parent NGO verisini sonradan hydrate eder (mount anında banners boş olabilir).
    // İlk dolu prop geldiğinde yerel listeyi bir kez tohumla; sonrası yerel state'e ait.
    useEffect(() => {
        if (!hydratedRef.current && banners.length > 0) {
            hydratedRef.current = true;
            setItems(banners);
        }
    }, [banners]);

    // Yüklenen görselin hangi banner'ı hedeflediği: null = yeni banner ekle, id = o banner'ı değiştir.
    const [targetId, setTargetId] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    // siteSettings.banners'a yaz (page.tsx buildPayload ile aynı şekil).
    const persistBanners = async (next: Banner[]) => {
        await updateDoc(doc(db!, COLLECTIONS.ngos, ngoId!), {
            'siteSettings.banners': next.map(b => ({ id: b.id, url: b.url, isPrimary: b.isPrimary })),
            'siteSettings.updatedAt': serverTimestamp(),
        });
    };

    const openPicker = (id: string | null) => {
        setTargetId(id);
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Aynı dosya tekrar seçilebilsin diye input'u sıfırla.
        e.target.value = '';
        if (!file) return;
        if (!db || !ngoId) {
            toast({ variant: 'destructive', title: 'Kurum bulunamadı', description: 'Banner yüklemek için aktif bir STK gerekli.' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 10 MB görsel yükleyebilirsiniz.' });
            return;
        }
        const replacing = targetId !== null;
        setBusyId(replacing ? targetId : 'new');
        try {
            const storage = getStorage();
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `ngos/${ngoId}/banners/banner-${Date.now()}-${safe}`;
            const r = storageRef(storage, path);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);

            let next: Banner[];
            if (replacing) {
                next = items.map(b => (b.id === targetId ? { ...b, url } : b));
            } else {
                const newId = String(Math.max(0, ...items.map(b => Number(b.id) || 0)) + 1);
                next = [...items, { id: newId, url, isPrimary: items.length === 0 }];
            }
            await persistBanners(next);
            setItems(next);
            toast({ title: replacing ? 'Banner değiştirildi' : 'Banner eklendi', description: 'Görsel yüklendi ve kaydedildi.' });
        } catch (err) {
            const e2 = err as { message?: string };
            toast({ variant: 'destructive', title: 'Yükleme başarısız', description: e2?.message?.slice(0, 160) || 'Görsel yüklenemedi.' });
        } finally {
            setBusyId(null);
            setTargetId(null);
        }
    };

    const handleRemove = async (id: string) => {
        const next = items.filter(b => b.id !== id);
        setItems(next);
        onRemove(id);
        try {
            if (db && ngoId) await persistBanners(next);
        } catch (err) {
            const e2 = err as { message?: string };
            toast({ variant: 'destructive', title: 'Silme kaydedilemedi', description: e2?.message?.slice(0, 160) || 'Lütfen tekrar deneyin.' });
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((banner, index) => (
                    <div key={banner.id} className="relative group">
                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-all shadow-sm">
                            <img src={banner.url} alt={`Banner ${banner.id}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <Button variant="secondary" size="sm" className="h-8 text-xs font-bold" disabled={busyId === banner.id} onClick={() => openPicker(banner.id)}>
                                    {busyId === banner.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <ImageIcon className="mr-1.5 h-3.5 w-3.5"/>} Değiştir
                                </Button>
                                {!banner.isPrimary && (
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemove(banner.id)} aria-label="Banner'ı sil">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="absolute top-2 left-2 flex gap-1.5">
                                {banner.isPrimary ? (
                                    <Badge className="bg-primary text-[9px] font-black uppercase tracking-wider h-5 px-2 border-none">ANA BANNER</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-white/90 text-foreground text-[9px] font-black uppercase tracking-wider h-5 px-2 border-none">SIRALAMA: {index + 1}</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div
                    className="border-2 border-dashed rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer group bg-muted/10"
                    onClick={() => openPicker(null)}
                >
                    <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        {busyId === 'new' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary">Yeni Banner Ekle</p>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                <p className="text-xs font-medium italic leading-relaxed">
                    <span className="font-bold">Önerilen boyut:</span> 1920x600px. İlk banner ana sayfa kapak görseli (Hero) olarak kullanılır.
                </p>
            </div>
        </>
    );
}
