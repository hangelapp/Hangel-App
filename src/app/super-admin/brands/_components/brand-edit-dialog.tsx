'use client';

import React from 'react';
import { ImageUp, Loader2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Brand } from "@/lib/types";
import { LocationFields } from '@/components/shared/location-fields';

import type { BrandItem, EditFormData } from './types';

interface BrandEditDialogProps {
    brand: BrandItem;
    editFormData: EditFormData;
    onEditFormDataChange: (next: EditFormData) => void;
    logoUploading: boolean;
    onLogoFile: (file: File, kind: 'logo' | 'cover') => void | Promise<void>;
    onSave: () => void | Promise<void>;
    onCancel: () => void;
}

export const BrandEditDialog = ({ brand, editFormData, onEditFormDataChange, logoUploading, onLogoFile, onSave, onCancel }: BrandEditDialogProps) => {
    return (
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]">
            <DialogHeader>
                <DialogTitle>{brand.name} - Detaylar</DialogTitle>
                <DialogDescription>Marka bilgilerini düzenleyin.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-6 py-4">

                {/* --- Genel Bilgiler --- */}
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Genel Bilgiler</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-name" className="text-sm font-semibold">Marka Adı</Label>
                            <Input
                                id="edit-name"
                                value={editFormData.name || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, name: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-slug" className="text-sm font-semibold">Kısa Ad / Slug</Label>
                            <Input
                                id="edit-slug"
                                value={editFormData.slug || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, slug: e.target.value })}
                                className="rounded-xl"
                                placeholder="ornek-marka"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-category" className="text-sm font-semibold">Birincil Kategori</Label>
                            <Input
                                id="edit-category"
                                value={editFormData.category || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, category: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-categories" className="text-sm font-semibold">Ek Kategoriler (çoklu seçim)</Label>
                            {/* Çip stilinde multi-select — tıkla ekle/çıkar */}
                            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border bg-card">
                                {[
                                    'Gıda', 'Tekstil', 'Teknoloji', 'Sağlık', 'Eğitim', 'Finans', 'Lojistik',
                                    'Turizm', 'İnşaat', 'Otomotiv', 'Enerji', 'Tarım', 'Hizmet', 'Perakende',
                                    'Üretim', 'Medya', 'Kozmetik', 'Mobilya', 'Giyim', 'Spor', 'Outdoor',
                                    'Ev & Yaşam', 'Hediyelik', 'Elektronik', 'Mücevher', 'Kitap', 'Müzik',
                                    'Oyuncak', 'Hayvan', 'Diğer',
                                ].map(opt => {
                                    const sel = (editFormData.categories || []).includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                                const current = editFormData.categories || [];
                                                const next = sel ? current.filter(c => c !== opt) : [...current, opt];
                                                onEditFormDataChange({ ...editFormData, categories: next });
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                                sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Manuel ekleme — listede olmayan kategori için */}
                            <Input
                                id="edit-categories-manual"
                                placeholder="Listede olmayan kategori? Buraya yaz + Enter"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.currentTarget.value.trim();
                                        if (val && !(editFormData.categories || []).includes(val)) {
                                            onEditFormDataChange({ ...editFormData, categories: [...(editFormData.categories || []), val] });
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                                className="rounded-xl text-xs"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Marka birden fazla kategoride ürün satıyorsa hepsini seç; market sayfasında her kategoride görünür ve profilde rozet olarak listelenir.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type" className="text-sm font-semibold">Tür</Label>
                            <Select
                                value={editFormData.type || ''}
                                onValueChange={(v) => onEditFormDataChange({ ...editFormData, type: v as Brand['type'] })}
                            >
                                <SelectTrigger id="edit-type" className="rounded-xl">
                                    <SelectValue placeholder="Tür seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Marka</SelectItem>
                                    <SelectItem value="cooperative">Kooperatif</SelectItem>
                                    <SelectItem value="social">Sosyal Girişim</SelectItem>
                                    <SelectItem value="economic">Ekonomik Birlik</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-donation" className="text-sm font-semibold">Bağış Oranı %</Label>
                            <Input
                                id="edit-donation"
                                type="number"
                                value={editFormData.donationRate ?? 0}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, donationRate: parseFloat(e.target.value) })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-logo" className="text-sm font-semibold">Logo</Label>
                            <div className="flex items-center gap-3">
                                {editFormData.logoUrl ? (
                                    <Avatar className="h-14 w-14 border-2 border-white shadow-md bg-white shrink-0">
                                        <AvatarImage src={editFormData.logoUrl} alt="logo" className="object-contain p-1" />
                                        <AvatarFallback className="font-black">{(editFormData.name || '?')[0]}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="h-14 w-14 rounded-full border-2 border-dashed border-black/10 flex items-center justify-center text-muted-foreground shrink-0">
                                        <ImageUp className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <Input
                                        id="edit-logo"
                                        value={editFormData.logoUrl || ''}
                                        onChange={(e) => onEditFormDataChange({ ...editFormData, logoUrl: e.target.value })}
                                        className="rounded-xl"
                                        placeholder="https://... veya yükleyin"
                                    />
                                    <div className="flex items-center gap-2">
                                        <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl font-bold cursor-pointer h-9')}>
                                            {logoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                                            Logo Yükle (JPG/PNG)
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                hidden
                                                disabled={logoUploading}
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) onLogoFile(f, 'logo');
                                                    e.currentTarget.value = '';
                                                }}
                                            />
                                        </label>
                                        <p className="text-[11px] text-muted-foreground">Maks 5MB. Storage erişilemezse Base64 (max 500KB).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-cover" className="text-sm font-semibold">Kapak Fotoğrafı</Label>
                            <div className="flex items-center gap-3">
                                {editFormData.coverPhotoUrl ? (
                                    <div className="h-14 w-24 rounded-xl border-2 border-white shadow-md bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${editFormData.coverPhotoUrl})` }} />
                                ) : (
                                    <div className="h-14 w-24 rounded-xl border-2 border-dashed border-black/10 flex items-center justify-center text-muted-foreground shrink-0">
                                        <ImageUp className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <Input
                                        id="edit-cover"
                                        value={editFormData.coverPhotoUrl || ''}
                                        onChange={(e) => onEditFormDataChange({ ...editFormData, coverPhotoUrl: e.target.value })}
                                        className="rounded-xl"
                                        placeholder="https://... veya yükleyin"
                                    />
                                    <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl font-bold cursor-pointer h-9 w-fit')}>
                                        {logoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                                        Kapak Yükle (JPG/PNG)
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            hidden
                                            disabled={logoUploading}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) onLogoFile(f, 'cover');
                                                e.currentTarget.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-about" className="text-sm font-semibold">Hakkında</Label>
                            <Textarea
                                id="edit-about"
                                value={editFormData.about || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, about: e.target.value })}
                                className="rounded-xl min-h-[80px]"
                                placeholder="Marka hakkında kısa bilgi..."
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-agency" className="text-sm font-semibold">Ajans</Label>
                            <Input
                                id="edit-agency"
                                value={editFormData.agency || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, agency: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-link" className="text-sm font-semibold">Affiliate / Alışveriş Linki</Label>
                            <Input
                                id="edit-link"
                                value={editFormData.link || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, link: e.target.value })}
                                className="rounded-xl"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-black/5" />

                {/* --- İletişim --- */}
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">İletişim</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-email" className="text-sm font-semibold">E-posta</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editFormData._email || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _email: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone" className="text-sm font-semibold">Telefon</Label>
                            <Input
                                id="edit-phone"
                                value={editFormData._phone || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _phone: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-website" className="text-sm font-semibold">Web Sitesi</Label>
                            <Input
                                id="edit-website"
                                value={editFormData._website || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _website: e.target.value })}
                                className="rounded-xl"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-black/5" />

                {/* --- Sosyal Medya --- */}
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sosyal Medya</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-instagram" className="text-sm font-semibold">Instagram</Label>
                            <Input
                                id="edit-instagram"
                                value={editFormData._instagram || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _instagram: e.target.value })}
                                className="rounded-xl"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-twitter" className="text-sm font-semibold">Twitter / X</Label>
                            <Input
                                id="edit-twitter"
                                value={editFormData._twitter || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _twitter: e.target.value })}
                                className="rounded-xl"
                                placeholder="https://x.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-facebook" className="text-sm font-semibold">Facebook</Label>
                            <Input
                                id="edit-facebook"
                                value={editFormData._facebook || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _facebook: e.target.value })}
                                className="rounded-xl"
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-linkedin" className="text-sm font-semibold">LinkedIn</Label>
                            <Input
                                id="edit-linkedin"
                                value={editFormData._linkedin || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _linkedin: e.target.value })}
                                className="rounded-xl"
                                placeholder="https://linkedin.com/..."
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-black/5" />

                {/* --- Adres --- */}
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adres</p>
                    <div className="space-y-4">
                        <LocationFields
                            value={{
                                country: editFormData._country || 'Türkiye',
                                city: editFormData._city || '',
                                district: editFormData._district || '',
                                neighborhood: editFormData._neighborhood || '',
                            }}
                            onChange={(next) => onEditFormDataChange({
                                ...editFormData,
                                _country: next.country || 'Türkiye',
                                _city: next.city || '',
                                _district: next.district || '',
                                _neighborhood: next.neighborhood || '',
                            })}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="edit-street" className="text-sm font-semibold">Sokak / Cadde / No</Label>
                            <Input
                                id="edit-street"
                                value={editFormData._street || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, _street: e.target.value })}
                                className="rounded-xl"
                                placeholder="Örn: Atatürk Cad. No:12 Daire:3"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel} className="rounded-xl font-bold">Vazgeç</Button>
                <Button onClick={onSave} className="rounded-xl font-bold" disabled={logoUploading}>
                    {logoUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};
