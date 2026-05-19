'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ExternalLink, PlusCircle, ShoppingCart, Megaphone, Target, ShieldCheck, Settings2 } from 'lucide-react';
import { transparencyDocs } from './constants';

export function AboutSection() {
    return (
        <>
            <p className="text-sm text-muted-foreground">Bu bölümdeki veriler kuruluş profilinizle senkronize çalışır.</p>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/manage-profile">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Profilde Düzenle
                </Link>
            </Button>
        </>
    );
}

export function VolunteeringSection() {
    return (
        <>
            <div className="space-y-3 p-3 border rounded-xl bg-muted/5">
                <div className="flex items-center space-x-2">
                    <Checkbox id="only-active" defaultChecked />
                    <Label htmlFor="only-active">Sadece Aktif İlanları Göster</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-all" />
                    <Label htmlFor="show-all">Tüm İlanları Göster</Label>
                </div>
            </div>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/volunteer">
                    <PlusCircle className="mr-2 h-4 w-4" /> Gönüllülük Paneline Git
                </Link>
            </Button>
        </>
    );
}

export function EventsSection() {
    return (
        <>
            <p className="text-sm text-muted-foreground">Etkinlikleriniz ve takvim verileriniz buradan yönetilir.</p>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/events">
                    <ExternalLink className="mr-2 h-4 w-4" /> Etkinlikleri Yönet
                </Link>
            </Button>
        </>
    );
}

export function EcommerceSection() {
    return (
        <>
            <p className="text-sm text-muted-foreground">Pazar yeri entegrasyonu ve aktif ürün listesini yönetin.</p>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/ecommerce">
                    <ShoppingCart className="mr-2 h-4 w-4" /> Mağaza Paneline Git
                </Link>
            </Button>
        </>
    );
}

export function NewsSection() {
    return (
        <>
            <div className="space-y-2">
                <Label>Listelenecek Haber Sayısı</Label>
                <Select defaultValue="3">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3">Son 3 Haber</SelectItem>
                        <SelectItem value="6">Son 6 Haber</SelectItem>
                        <SelectItem value="9">Son 9 Haber</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/posts">
                    <Megaphone className="mr-2 h-4 w-4" /> Mini Blog Sayfasına Git
                </Link>
            </Button>
        </>
    );
}

export function SdgSection() {
    return (
        <>
            <p className="text-sm text-muted-foreground">SKA seçimlerinizi profilinizden yönetebilirsiniz.</p>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/manage-profile">
                    <Target className="mr-2 h-4 w-4" /> SKA Hedeflerini Düzenle
                </Link>
            </Button>
        </>
    );
}

export function TransparencySection() {
    return (
        <>
            <div className="space-y-4 p-3 border rounded-xl bg-muted/5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Yayınlanacak Belgeleri Onayla</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {transparencyDocs.map(doc => (
                        <div key={doc.id} className="flex items-center space-x-2 p-2.5 border rounded-xl bg-background hover:bg-muted/30 transition-colors">
                            <Checkbox id={`pub-doc-${doc.id}`} defaultChecked />
                            <Label htmlFor={`pub-doc-${doc.id}`} className="text-xs font-medium cursor-pointer">{doc.label}</Label>
                        </div>
                    ))}
                </div>
            </div>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/transparency">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Belgeleri Profilde Güncelle
                </Link>
            </Button>
        </>
    );
}

export function ContactSection() {
    return (
        <>
            <div className="grid grid-cols-2 gap-3 p-3 border rounded-xl bg-muted/5">
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-phone" defaultChecked />
                    <Label htmlFor="show-phone" className="text-xs">Telefon</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-email" defaultChecked />
                    <Label htmlFor="show-email" className="text-xs">E-posta</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-address" defaultChecked />
                    <Label htmlFor="show-address" className="text-xs">Adres</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-social" defaultChecked />
                    <Label htmlFor="show-social" className="text-xs">Sosyal Medya</Label>
                </div>
            </div>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/manage-profile">
                    <Settings2 className="mr-2 h-4 w-4" /> İletişim Bilgilerini Düzenle
                </Link>
            </Button>
        </>
    );
}
