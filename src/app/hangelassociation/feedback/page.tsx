
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';
import { useAssociationContent } from '@/hooks/use-site-content';

export default function AssociationFeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { get } = useAssociationContent();
    const [rating, setRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Geri Bildiriminiz Alındı",
            description: "Daha iyi bir sosyal etki ekosistemi için katkınız çok değerli.",
        });
    };

    return (
        <div className="min-h-screen bg-background font-sans text-center">
            <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">GERİ BİLDİRİM</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-32 pb-24">
                <section className="container mx-auto px-6 max-w-3xl space-y-12">
                    <div className="space-y-4">
                        <Heart className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">{get('feedback.title', 'Fikirleriniz Geleceğimiz.')}</h1>
                        <p className="text-xl text-muted-foreground font-medium">{get('feedback.description', 'SBG ekosistemini geliştirmemize yardımcı olun.')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 text-left bg-muted p-8 md:p-16 rounded-[3rem] border border-border">
                        <div className="space-y-6 text-center">
                            <Label className="text-lg font-bold">Deneyiminizi puanlayın</Label>
                            <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={cn(
                                            "w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center group",
                                            rating >= star ? "bg-primary text-white shadow-lg scale-110" : "bg-card text-muted-foreground hover:bg-primary/10"
                                        )}
                                    >
                                        <Star className={cn("h-7 w-7", rating >= star && "fill-current")} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">DÜŞÜNCELERİNİZ</Label>
                            <Textarea 
                                className="min-h-[200px] rounded-[2rem] border-none bg-card p-8 focus-visible:ring-primary text-lg"
                                placeholder="Neleri çok sevdiniz? Neleri daha iyi yapabiliriz?"
                                required
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full h-16 rounded-[2rem] text-xl font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]">
                            Geri Bildirimi Gönder
                        </Button>
                    </form>
                </section>
            </main>

            <PublicFooter currentPageLabel="GERİ BİLDİRİM" />
        </div>
    );
}
