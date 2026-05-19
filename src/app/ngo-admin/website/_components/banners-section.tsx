'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { Banner } from './types';

interface BannersSectionProps {
    banners: Banner[];
    onAdd: () => void;
    onRemove: (id: string) => void;
    onReplaceClick: () => void;
}

export function BannersSection({ banners, onAdd, onRemove, onReplaceClick }: BannersSectionProps) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner, index) => (
                    <div key={banner.id} className="relative group">
                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-all shadow-sm">
                            <img src={banner.url} alt={`Banner ${banner.id}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <Button variant="secondary" size="sm" className="h-8 text-xs font-bold" onClick={onReplaceClick}>
                                    <ImageIcon className="mr-1.5 h-3.5 w-3.5"/> Değiştir
                                </Button>
                                {!banner.isPrimary && (
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onRemove(banner.id)} aria-label="Banner'ı sil">
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
                    onClick={onAdd}
                >
                    <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus className="h-6 w-6" />
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
