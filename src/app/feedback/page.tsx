'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, 
    ArrowLeft,
    MessageSquare,
    Star,
    Zap,
    Users,
    Target,
    Heart,
    ShieldCheck,
    Lightbulb,
    HelpCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

const FeedbackValueSection = ({ 
    title, 
    subtitle, 
    description, 
    icon: Icon,
    theme = 'light',
    imageUrl,
    imageHint
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    icon: any,
    theme?: 'light' | 'dark',
    imageUrl?: string,
    imageHint?: string
}) => (
    <section className={cn(
        "relative min-h-[60vh] flex flex-col items-center justify-center py-20 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]"
    )}>
        <div className="relative z-10 space-y-6 px-6 max-w-4xl">
            <div className={cn(
                "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4",
                theme === 'dark' ? "bg-white/10" : "bg-primary/10"
            )}>
                <Icon className={cn("h-8 w-8", theme === 'dark' ? "text-white" : "text-primary")} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
        </div>
        
        {imageUrl && (
            <div className="absolute inset-0 z-0 opacity-20">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover" 
                    data-ai-hint={imageHint}
                />
            </div>
        )}
    </section>
);

export default function FeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [rating, setRating] = useState<number>(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Geri Bildiriminiz Alındı",
            description: "Daha iyi bir deneyim oluşturmamıza yardımcı olduğunuz için teşekkürler.",
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Header / Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">Geri Bildirim</span>
                    <div className="w-20" />
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="pt-32 pb-20 px-6 text-center space-y-4 bg-[#f5f5f7]">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">Fikirleriniz Değerli.</h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                        Platformumuzu her geçen gün sizinle birlikte geliştiriyoruz. Deneyimlerinizi bizimle paylaşın.
                    </p>
                </section>

                {/* Why Feedback Matters Sections */}
                <FeedbackValueSection 
                    icon={Lightbulb}
                    title="İyiliği Birlikte Tasarlıyoruz."
                    subtitle="Her öneri, yeni bir çözüm demek."
                    description="Gönderdiğiniz her geri bildirim, Hangel ekibi tarafından dikkatle incelenir. Yazılımsal geliştirmelerden yeni sosyal etki modellerine kadar pek çok özelliği sizden aldığımız ilhamla hayata geçiriyoruz."
                />

                <FeedbackValueSection 
                    theme="dark"
                    icon={ShieldCheck}
                    title="Şeffaf ve Güvenilir Deneyim."
                    subtitle="Geri bildirimleriniz denetim mekanizmamızdır."
                    description="STK başvuruları, bağış süreçleri veya gönüllülük ilanları hakkındaki görüşleriniz, platformumuzun güvenliğini ve şeffaflığını en üst düzeyde tutmamıza yardımcı olur."
                />

                {/* Interactive Feedback Form Section */}
                <section className="py-24 px-6 bg-[#fafafa]">
                    <div className="container mx-auto max-w-3xl">
                        <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl border border-black/5 space-y-12">
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-bold tracking-tight">Geri Bildirim Formu</h3>
                                <p className="text-muted-foreground">Deneyiminizi paylaşmak için aşağıdaki alanları doldurun.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-6 text-center">
                                    <Label className="text-lg font-bold">Hangel deneyiminizi puanlayın</Label>
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={cn(
                                                    "w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center group",
                                                    rating >= star ? "bg-primary text-white shadow-lg" : "bg-[#f5f5f7] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                )}
                                            >
                                                <Star className={cn("h-7 w-7 transition-transform group-active:scale-90", rating >= star && "fill-current")} />
                                            </button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <p className="text-sm font-bold text-primary animate-in fade-in slide-in-from-top-1">
                                            {rating === 5 ? "Harika! Çok sevindik." : rating >= 3 ? "Teşekkürler, daha iyi olmak için çalışacağız." : "Görüşleriniz bizim için çok kritik."}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Konu Seçin</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['Genel Deneyim', 'Bağış Süreçleri', 'Gönüllülük', 'Hata Bildirimi', 'Öneri', 'Diğer'].map((topic) => (
                                            <button 
                                                key={topic}
                                                type="button"
                                                className="px-4 py-3 rounded-xl border text-xs font-bold hover:border-primary hover:text-primary transition-all bg-white"
                                            >
                                                {topic}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="feedback-text">Düşüncelerinizi Paylaşın</Label>
                                    <Textarea 
                                        id="feedback-text"
                                        className="min-h-[200px] rounded-[2rem] border-none bg-[#f5f5f7] p-6 focus-visible:ring-primary text-lg leading-relaxed"
                                        placeholder="Neyi çok sevdiniz? Neyi geliştirmeliyiz?"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="feedback-email">E-posta Adresiniz (İsteğe Bağlı)</Label>
                                    <Input 
                                        id="feedback-email"
                                        type="email"
                                        className="h-14 rounded-2xl border-none bg-[#f5f5f7] px-6 focus-visible:ring-primary"
                                        placeholder="Gerekirse size dönüş yapabilmemiz için"
                                    />
                                </div>

                                <Button type="submit" size="lg" className="w-full h-16 rounded-[2rem] text-xl font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]">
                                    Geri Bildirimi Gönder
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Help Centers Grid */}
                <section className="py-24 px-6 container mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-10 bg-[#f5f5f7] rounded-[2.5rem] flex flex-col items-start gap-6 border border-black/5 hover:bg-white hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Yardım Merkezi</h3>
                                <p className="text-muted-foreground leading-relaxed">Teknik bir sorun mu yaşıyorsunuz? Sıkça sorulan soruları ve rehberlerimizi inceleyin.</p>
                            </div>
                            <Link href="/support" className="text-blue-600 font-bold flex items-center group-hover:underline">
                                Destek Al <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>

                        <div className="p-10 bg-[#f5f5f7] rounded-[2.5rem] flex flex-col items-start gap-6 border border-black/5 hover:bg-white hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Topluluk Kütüphanesi</h3>
                                <p className="text-muted-foreground leading-relaxed">Sivil toplum ve sosyal etki hakkında güncel kaynaklara, verilere ve sözlüklere göz atın.</p>
                            </div>
                            <Link href="/library" className="text-green-600 font-bold flex items-center group-hover:underline">
                                Kütüphaneye Git <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Detailed Apple-style Footer */}
            <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-20 pb-12 px-4 sm:px-6">
                <div className="container mx-auto max-w-4xl space-y-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-black/10 pt-12">
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">Kurumsal</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/about" className="hover:underline">Biz Kimiz?</Link>
                                <Link href="/social-impact" className="hover:underline">Sosyal Etkimiz</Link>
                                <Link href="/press" className="hover:underline">Basın Odası</Link>
                                <Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">İşbirlikleri</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/merchant" className="hover:underline">Üye İşyeri</Link>
                                <Link href="/ngo-onboarding" className="hover:underline">STK Başvurusu</Link>
                                <Link href="/corporate" className="hover:underline">Kamu İşbirlikleri</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">Destek</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/support" className="hover:underline">Yardım Merkezi</Link>
                                <Link href="/feedback" className="hover:underline font-bold text-primary">Geri Bildirim</Link>
                                <Link href="/accessibility" className="hover:underline">Erişilebilirlik</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">Yasal</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/settings/contracts" className="hover:underline">Politikalar</Link>
                                <Link href="/sitemap" className="hover:underline">Site Haritası</Link>
                            </nav>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <span className="font-bold text-xl tracking-tighter text-[#1d1d1f]">hangel A.Ş.</span>
                            </div>
                            <p className="text-[11px] text-[#86868b] max-w-xs leading-relaxed">
                                © 2024 hangel A.Ş. Deneyim ve İnovasyon Merkezi. Tüm hakları saklıdır.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
