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
import { neighborhoodsData } from '@/lib/neighborhoods-data';

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
                            <Label htmlFor="edit-category" className="text-sm font-semibold">Kategori</Label>
                            <Input
                                id="edit-category"
                                value={editFormData.category || ''}
                                onChange={(e) => onEditFormDataChange({ ...editFormData, category: e.target.value })}
                                className="rounded-xl"
                            />
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-country" className="text-sm font-semibold">Ülke</Label>
                            <Select
                                value={editFormData._country || 'Türkiye'}
                                onValueChange={(v) => onEditFormDataChange({ ...editFormData, _country: v, _city: '', _district: '', _neighborhood: '' })}
                            >
                                <SelectTrigger id="edit-country" className="rounded-xl">
                                    <SelectValue placeholder="Ülke seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Türkiye">Türkiye</SelectItem>
                                    <SelectItem value="KKTC">KKTC</SelectItem>
                                    <SelectItem value="Almanya">Almanya</SelectItem>
                                    <SelectItem value="ABD">ABD</SelectItem>
                                    <SelectItem value="İngiltere">İngiltere</SelectItem>
                                    <SelectItem value="Diğer">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-city" className="text-sm font-semibold">İl</Label>
                            {(editFormData._country || 'Türkiye') === 'Türkiye' ? (
                                <Select
                                    value={editFormData._city || ''}
                                    onValueChange={(v) => onEditFormDataChange({ ...editFormData, _city: v, _district: '', _neighborhood: '' })}
                                >
                                    <SelectTrigger id="edit-city" className="rounded-xl">
                                        <SelectValue placeholder="İl seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(neighborhoodsData).sort((a, b) => a.localeCompare(b, 'tr')).map(city => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="edit-city"
                                    value={editFormData._city || ''}
                                    onChange={(e) => onEditFormDataChange({ ...editFormData, _city: e.target.value })}
                                    className="rounded-xl"
                                    placeholder="Şehir adı"
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-district" className="text-sm font-semibold">İlçe</Label>
                            {(editFormData._country || 'Türkiye') === 'Türkiye' && editFormData._city && neighborhoodsData[editFormData._city] ? (
                                <Select
                                    value={editFormData._district || ''}
                                    onValueChange={(v) => onEditFormDataChange({ ...editFormData, _district: v, _neighborhood: '' })}
                                >
                                    <SelectTrigger id="edit-district" className="rounded-xl">
                                        <SelectValue placeholder="İlçe seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(neighborhoodsData[editFormData._city]).sort((a, b) => a.localeCompare(b, 'tr')).map(d => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="edit-district"
                                    value={editFormData._district || ''}
                                    onChange={(e) => onEditFormDataChange({ ...editFormData, _district: e.target.value })}
                                    className="rounded-xl"
                                    placeholder="İlçe"
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-neighborhood" className="text-sm font-semibold">Mahalle</Label>
                            {(editFormData._country || 'Türkiye') === 'Türkiye' && editFormData._city && editFormData._district && neighborhoodsData[editFormData._city]?.[editFormData._district] ? (
                                <Select
                                    value={editFormData._neighborhood || ''}
                                    onValueChange={(v) => onEditFormDataChange({ ...editFormData, _neighborhood: v })}
                                >
                                    <SelectTrigger id="edit-neighborhood" className="rounded-xl">
                                        <SelectValue placeholder="Mahalle seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {neighborhoodsData[editFormData._city][editFormData._district].slice().sort((a, b) => a.localeCompare(b, 'tr')).map(n => (
                                            <SelectItem key={n} value={n}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="edit-neighborhood"
                                    value={editFormData._neighborhood || ''}
                                    onChange={(e) => onEditFormDataChange({ ...editFormData, _neighborhood: e.target.value })}
                                    className="rounded-xl"
                                    placeholder="Mahalle"
                                />
                            )}
                        </div>
                        <div className="space-y-2 col-span-2">
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
