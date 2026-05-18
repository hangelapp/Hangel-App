
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';
import { useAssociationContent } from '@/hooks/use-site-content';

export default function AssociationContactPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { get } = useAssociationContent();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Mesajınız İletildi",
            description: "Sosyal Business Global kurumsal ekibi sizinle iletişime geçecektir.",
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#1d1d1f]/40">İLETİŞİM</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6 max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#1d1d1f]">{get('contact.title', 'Bize Ulaşın.')}</h1>
                            <p className="text-xl text-muted-foreground font-medium">{get('contact.description', 'İş birlikleri, projeler ve kurumsal talepleriniz için buradayız.')}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-lg font-medium">
                                <Mail className="h-6 w-6 text-primary" />
                                <a href="mailto:info@socialbusinessglobal.org" className="hover:underline">info@socialbusinessglobal.org</a>
                            </div>
                            <div className="flex items-center gap-4 text-lg font-medium">
                                <Phone className="h-6 w-6 text-primary" />
                                <span>0554 700 70 07</span>
                            </div>
                            <div className="flex items-start gap-4 text-lg font-medium">
                                <MapPin className="h-6 w-6 text-primary mt-1" />
                                <span>Caferağa Mah. Moda Cad. No: 123 D:4, Kadıköy, İstanbul</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-[#f5f5f7] p-10 rounded-[3rem] space-y-6 border border-black/5">
                        <div className="space-y-2">
                            <Label>Adınız Soyadınız</Label>
                            <Input placeholder="Tam adınızı girin" required className="bg-white rounded-xl border-none h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>E-posta Adresiniz</Label>
                            <Input type="email" placeholder="ornek@mail.com" required className="bg-white rounded-xl border-none h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>Mesajınız</Label>
                            <Textarea placeholder="Kurumsal talebinizi buraya yazın..." rows={6} required className="bg-white rounded-[2rem] border-none p-6" />
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl font-bold bg-primary shadow-lg shadow-primary/20">
                            <Send className="mr-2 h-5 w-5" /> Mesajı Gönder
                        </Button>
                    </form>
                </div>
            </main>

            <PublicFooter currentPageLabel="İLETİŞİM" />
        </div>
    );
}
