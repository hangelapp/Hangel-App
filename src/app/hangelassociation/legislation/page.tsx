'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    ShieldCheck, 
    FileText, 
    ChevronRight, 
    Landmark, 
    ArrowRight, 
    Globe, 
    Gavel, 
    BarChart3,
    Shield,
    HeartHandshake,
    Eye,
    Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useAssociationContent } from '@/hooks/use-site-content';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/hangelassociation')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                    <a href="/hangelassociation/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</a>
                    <a href="/hangelassociation/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</a>
                    <a href="/hangelassociation/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</a>
                    <a href="/hangelassociation/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</a>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <a href="/login/selection?action=register">Gönüllü Ol</a>
                </Button>
            </div>
        </header>
    );
};

export default function AssociationLegislationPage() {
    const { toast } = useToast();
    const { get } = useAssociationContent();

    const handleDownload = () => {
        toast({
            title: "Dosya Hazırlanıyor",
            description: "29 maddelik Kanun Teklifi taslağı PDF formatında indiriliyor.",
        });
    };

    const handleFeedback = () => {
        toast({
            title: "Görüş Bildir",
            description: "Mevzuat taslağı hakkındaki görüşleriniz için iletişim formu açılıyor.",
        });
    };

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="legislation" />

            {/* Hero Section - Preface focus */}
            <section className="relative min-h-[90vh] flex flex-col items-center pt-32 text-center border-b border-border overflow-hidden bg-muted">
                <div className="relative z-10 space-y-6 px-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-4 py-1.5 rounded-full">TBMM Kanun Teklifi Taslağı</Badge>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.95] text-foreground">
                        {get('legislation.title', 'Yok artık, öyle yalnız başına mücadele etmek!')}
                    </h1>
                    <p className="text-xl md:text-3xl font-medium text-muted-foreground max-w-3xl mx-auto leading-tight">
                        {get('legislation.subtitle', 'Sosyal Fayda ve Sürdürülebilirlik Odaklı Sosyal Girişimcilik Kanunu Teklifi.')}
                    </p>
                    <div className="pt-12 flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="text-left max-w-2xl bg-card p-8 rounded-[2.5rem] shadow-xl border border-border">
                            <p className="text-lg leading-relaxed text-muted-foreground italic">
                                "Bu tasarı sadece bir kanun teklifi değil; vicdanın gücüyle, küresel sorumlulukla ve umut ile yazılmış bir toplumsal sözleşmedir. Gerçek değişim; dayanışmayla, kolektif güçle, yan yana birlikte mücadele ettiğimizde mümkün olur."
                            </p>
                            <p className="mt-6 font-bold text-sm text-primary">— İsmail Hilmi ADIGÜZEL</p>
                        </div>
                    </div>
                </div>
                <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
                    <div className="relative w-full aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl">
                        <Image src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop" alt="Legislation" fill className="object-cover" data-ai-hint="legal documents gavel scales" />
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-32 px-6 bg-background">
                <div className="container mx-auto max-w-5xl space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Bir Paradigma Değişikliği.</h2>
                        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                            Hedefimiz net: Sosyal girişimcilikte yasa ithal eden değil, yasa ihraç eden bir ülke olmak. Ahilikten vakıf kültürüne uzanan mirasımızı çağın ihtiyaçlarıyla buluşturuyoruz.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { title: "Yasal Tanım", desc: "Sosyal girişimciliğin tanımı, ruhsatı ve denetimi ilk kez açık kurallarla belirleniyor.", icon: ShieldCheck },
                            { title: "Gönüllülük Yasası", desc: "Gönüllülük ilk kez sistematik bir çerçeveye oturuyor ve iş tecrübesi olarak tanınıyor.", icon: HeartHandshake },
                            { title: "Şeffaf Denetim", desc: "DERBİS üzerinden izlenebilir, şeffaf ve hesap verebilir bir etki raporlama standartı geliyor.", icon: Eye },
                            { title: "Kamu İşbirliği", desc: "Kamu, sivil toplum ve özel sektör arasında sürdürülebilir bir işbirliği modeli inşaa ediliyor.", icon: Landmark }
                        ].map((item, i) => (
                            <div key={i} className="p-10 bg-muted rounded-[2.5rem] flex flex-col gap-6 hover:bg-card hover:shadow-2xl transition-all border border-transparent hover:border-border">
                                <div className="p-4 bg-card rounded-2xl w-fit shadow-sm">
                                    <item.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">{item.title}</h3>
                                <p className="text-base text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The 29 Articles Breakdown */}
            <section className="py-32 px-6 bg-black text-white overflow-hidden">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                        <div className="space-y-4">
                            <Gavel className="h-12 w-12 text-primary" />
                            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter">Kanun Taslağı Kapsamı.</h2>
                        </div>
                        <p className="text-xl text-white/60 font-medium max-w-md">29 maddeden oluşan bütüncül bir kalkınma modeli.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            <AccordionItem value="bolum-1" className="border border-white/10 rounded-[2rem] bg-white/5 px-8 py-2 hover:bg-white/10 transition-colors overflow-hidden">
                                <AccordionTrigger className="hover:no-underline py-6">
                                    <div className="flex items-center gap-4 text-left">
                                        <span className="text-primary font-black text-2xl">01</span>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-bold">Amaç, İlkeler ve Tanımlar</h4>
                                            <p className="text-xs text-white/40 uppercase tracking-widest font-black">Madde 1 - 6</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-8 space-y-4 text-white/70 text-lg leading-relaxed">
                                    <p>Sosyal girişimlerin yasal statülerinin belirlenmesi, şeffaflık ve hesap verebilirlik ilkelerinin tanımlanması. "Sosyal İnovasyon", "Sosyal Fayda Bilançosu" ve "Ulusal Sosyal İhtiyaç Haritası" gibi kavramların hukuki tanımı.</p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="bolum-2" className="border border-white/10 rounded-[2rem] bg-white/5 px-8 py-2 hover:bg-white/10 transition-colors overflow-hidden">
                                <AccordionTrigger className="hover:no-underline py-6">
                                    <div className="flex items-center gap-4 text-left">
                                        <span className="text-primary font-black text-2xl">02</span>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-bold">Yasal Yapı ve Yükümlülükler</h4>
                                            <p className="text-xs text-white/40 uppercase tracking-widest font-black">Madde 7 - 22</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-8 space-y-6 text-white/70 text-lg leading-relaxed">
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="h-2 w-2 rounded-full bg-primary mt-3 shrink-0" />
                                            <p><strong>Madde 8:</strong> Sosyal girişimler kârın en az %60'ını sosyal etkiye yönlendirmek zorundadır.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-2 w-2 rounded-full bg-primary mt-3 shrink-0" />
                                            <p><strong>Madde 14:</strong> DERBİS sistemi üzerinden anlık faaliyet raporlaması ve rezervasyon yöntemi.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-2 w-2 rounded-full bg-primary mt-3 shrink-0" />
                                            <p><strong>Madde 22:</strong> Vergi levhalarında "Sosyal Şirket" (S.LTD. ŞTİ veya S.A.Ş.) ibaresinin kullanımı.</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="bolum-3" className="border border-white/10 rounded-[2rem] bg-white/5 px-8 py-2 hover:bg-white/10 transition-colors overflow-hidden">
                                <AccordionTrigger className="hover:no-underline py-6">
                                    <div className="flex items-center gap-4 text-left">
                                        <span className="text-primary font-black text-2xl">03</span>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-bold">DERBİS ve İhtiyaç Bildirimi</h4>
                                            <p className="text-xs text-white/40 uppercase tracking-widest font-black">Madde 23 - 25</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-8 space-y-4 text-white/70 text-lg leading-relaxed">
                                    <p>Bakanlıkların bölgesel sosyal ihtiyaçları (Kırmızı, Turuncu, Sarı kodlarla) belirleyerek açık veri olarak paylaşması. Sosyal projelerin standartlarının ve sürelerinin bu veriler ışığında belirlenmesi.</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* Global Context Section */}
            <section className="py-32 bg-muted">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-20 space-y-4">
                        <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Uluslararası Kıyaslama.</h2>
                        <p className="text-xl text-muted-foreground font-medium">Dünyadaki başarılı modellerle uyumlu, özgün bir yapı.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { country: "Fransa", model: "ESUS", desc: "Sosyal fayda odaklı işletmelere özel vergi muafiyeti ve statü." },
                            { country: "İtalya", model: "Imprese Sociali", desc: "2006'dan beri ticari ama sosyal amaçlı yapılar yasal statüde." },
                            { country: "Güney Kore", model: "Promotion Act", desc: "Sosyal girişimler kamu alımlarında %100 öncelik hakkına sahip." },
                            { country: "ABD", model: "L3C / B-Corp", desc: "Düşük kârla çalışan sosyal işletmelere özel tüzel kişilik tanımı." }
                        ].map((item, i) => (
                            <button key={i} onClick={() => toast({ title: `${item.country} Modeli`, description: `${item.model} yapısı hakkında detaylı kıyaslama raporu yükleniyor.` })} className="p-8 bg-card rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all text-left">
                                <h4 className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-4">{item.country}</h4>
                                <h3 className="text-2xl font-bold mb-3">{item.model}</h3>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Research & Data Section */}
            <section className="py-32 px-6 bg-card border-b border-border">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <BarChart3 className="h-12 w-12 text-primary" />
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Veriye Dayalı Gerekçe.</h2>
                            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                                British Council, Marmara Üniversitesi ve KUSIF gibi kuruluşların araştırmaları, Türkiye'de yasal tanım eksikliğinin sosyal etkiyi %70 oranında sınırladığını gösteriyor.
                            </p>
                            <div className="space-y-4">
                                <button onClick={() => toast({ title: "Rapor Açılıyor", description: "Marmara Üniversitesi akademik analizi yükleniyor." })} className="flex w-full items-center gap-4 p-4 bg-muted rounded-2xl border border-border group cursor-pointer hover:bg-primary/5 transition-colors">
                                    <FileText className="h-6 w-6 text-primary" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-bold">Marmara Üni. Analizi (2024)</p>
                                        <p className="text-xs text-muted-foreground">Mevzuat eksikliği ve gelişim süreci raporu.</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button onClick={() => toast({ title: "Rapor Açılıyor", description: "British Council sosyal girişim durumu raporu yükleniyor." })} className="flex w-full items-center gap-4 p-4 bg-muted rounded-2xl border border-border group cursor-pointer hover:bg-primary/5 transition-colors">
                                    <FileText className="h-6 w-6 text-primary" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-bold">British Council Raporu (2019)</p>
                                        <p className="text-xs text-muted-foreground">Sosyal Girişimlerin Mevcut Durumu ve Engeller.</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                        <div className="p-12 bg-muted rounded-[3rem] space-y-8">
                            <div className="space-y-2">
                                <p className="text-6xl font-black tracking-tighter text-primary">%18.2</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kadın Girişimci Oranı (2024)</p>
                            </div>
                            <div className="h-px bg-border w-full" />
                            <div className="space-y-2">
                                <p className="text-6xl font-black tracking-tighter text-primary">587M$</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Toplam Girişim Yatırımı (2024 H1)</p>
                            </div>
                            <div className="h-px bg-border w-full" />
                            <div className="text-sm font-medium text-muted-foreground italic">
                                "Bu veriler, sosyal girişimin ekonomik büyümedeki potansiyelini ancak yasal güvenceyle gerçekleştirebileceğini kanıtlıyor."
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA Section */}
            <section className="py-32 px-6 text-center bg-card">
                <div className="container mx-auto max-w-3xl space-y-10">
                    <Shield className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Bu Değişimin Tarafı Olun.</h2>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                        Bu teklif, bir metinden öte toplumsal bir mirastır. Sosyal meselelerle uğraşan girişimcilerin yalnızca alkış değil, mevzuat desteği de gördüğü bir gelecek için çalışıyoruz.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="rounded-full px-12 h-14 font-bold bg-primary hover:bg-primary/90 text-lg shadow-2xl shadow-primary/20" onClick={handleDownload}>
                            Taslağı İndir <Download className="ml-2 h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="lg" className="rounded-full px-12 h-14 font-bold border border-border hover:bg-muted text-lg" onClick={handleFeedback}>
                            Görüş Bildir <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Mevzuat Taslağı" />
        </div>
    );
}
