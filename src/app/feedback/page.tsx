'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, 
    ArrowLeft,
    MessageSquare,
    Star,
    Zap,
    Users,
    Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function FeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Geri Bildiriminiz Alındı",
            description: "Daha iyi bir deneyim oluşturmamıza yardımcı olduğunuz için teşekkürler.",
        });
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30 pb-24">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">Geri Bildirim</span>
                    <div className="w-20" /> {/* Spacer */}
                </div>
            </header>

            <main className="container mx-auto px-4 pt-32 max-w-2xl space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Fikirleriniz Değerli.</h1>
                    <p className="text-xl text-muted-foreground font-medium">Platformu geliştirmek için bize yol gösterin.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-black/5">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <Label className="text-lg font-bold">Nasıl bir deneyim yaşadınız?</Label>
                            <div className="flex justify-between gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        type="button"
                                        className="flex-1 aspect-square rounded-2xl bg-[#f5f5f7] hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center group"
                                    >
                                        <Star className="h-6 w-6 group-active:scale-90 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-lg font-bold">Düşüncelerinizi paylaşın</Label>
                            <Textarea 
                                className="min-h-[150px] rounded-2xl border-2 border-[#f5f5f7] focus:border-primary transition-colors bg-[#f5f5f7]/50"
                                placeholder="Neyi çok sevdiniz? Neyi daha iyi yapabiliriz?"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-lg font-bold">İletişim Bilgileri (İsteğe Bağlı)</Label>
                            <Input 
                                className="h-14 rounded-2xl border-2 border-[#f5f5f7] focus:border-primary transition-colors bg-[#f5f5f7]/50"
                                placeholder="E-posta adresiniz"
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                            Gönder
                        </Button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-white rounded-3xl border border-black/5 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold">Yardım Gerekiyor mu?</h3>
                        <p className="text-sm text-muted-foreground">Teknik bir sorun yaşıyorsanız destek merkezimizi ziyaret edin.</p>
                        <Link href="/support" className="text-blue-600 font-bold text-sm hover:underline">Yardım Al</Link>
                    </div>
                    <div className="p-8 bg-white rounded-3xl border border-black/5 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold">Topluluğa Katılın</h3>
                        <p className="text-sm text-muted-foreground">Deneyimlerinizi diğer gönüllülerle paylaşmak için foruma göz atın.</p>
                        <Link href="/library" className="text-green-600 font-bold text-sm hover:underline">Topluluğa Git</Link>
                    </div>
                </div>
            </main>

            {/* Simplified Footer */}
            <footer className="container mx-auto px-4 text-center text-[11px] text-muted-foreground pt-20">
                <p>© 2024 hangel A.Ş. Deneyim Merkezi.</p>
            </footer>
        </div>
    );
}
