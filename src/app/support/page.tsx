
'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useWebPage } from '@/hooks/use-site-content';
import { 
  Search,
  ChevronRight,
  Bot,
  User,
  Building,
  Store,
  School,
  HelpCircle,
  Settings,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { helpTopics } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const CategoryLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => (
    <Link href={href} className="group flex flex-col items-center gap-2 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Icon className="h-8 w-8 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</span>
    </Link>
);

const QuickActionCard = ({ title, href }: { title: string; href: string }) => (
    <Link href={href} className="block">
        <Card className="rounded-[1.25rem] bg-muted/50 hover:bg-muted transition-all h-full">
            <CardContent className="p-6 flex items-center justify-between">
                <span className="font-semibold text-lg">{title}</span>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </CardContent>
        </Card>
    </Link>
);

export default function SupportPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();
    const cms = useWebPage('support');
    const [searchTerm, setSearchTerm] = useState('');

    // Yeni destek talebi formu
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [ticketPriority, setTicketPriority] = useState<'low' | 'normal' | 'high'>('normal');
    const [ticketEmail, setTicketEmail] = useState('');
    const [ticketName, setTicketName] = useState('');
    const [submittingTicket, setSubmittingTicket] = useState(false);

    const _popularArticles = helpTopics.flatMap(t => t.subtopics).slice(0,3);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketSubject.trim() || !ticketMessage.trim()) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Konu ve mesaj alanları gerekli.' });
            return;
        }
        if (!authUser) {
            toast({
                variant: 'destructive',
                title: 'Giriş gerekli',
                description: 'Destek talebi oluşturmak için giriş yapmalısınız.',
            });
            return;
        }
        setSubmittingTicket(true);
        try {
            await addDoc(collection(db, 'supportTickets'), {
                userId: authUser.uid,
                userName: ticketName.trim() || authUser.displayName || 'Kullanıcı',
                userEmail: ticketEmail.trim() || authUser.email || null,
                subject: ticketSubject.trim(),
                message: ticketMessage.trim(),
                priority: ticketPriority,
                status: 'open',
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Talebiniz alındı',
                description: 'Destek ekibimiz en kısa sürede yanıt verecektir.',
            });
            setTicketSubject('');
            setTicketMessage('');
            setTicketPriority('normal');
        } catch (err: unknown) {
            console.error('Ticket create failed:', err);
            const code = (err as { code?: string } | null)?.code;
            const message = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
            toast({
                variant: 'destructive',
                title: 'Talep oluşturulamadı',
                description: code === 'permission-denied'
                    ? 'Sunucu izin vermedi. Yetkilerinizi kontrol edin.'
                    : message,
            });
        } finally {
            setSubmittingTicket(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            toast({ variant: 'destructive', title: 'Arama terimi boş olamaz.'});
            return;
        }
        toast({ title: 'Arama Yapılıyor...', description: `"${searchTerm}" için sonuçlar getiriliyor.` });
    };

    const faqSection = (
        <section className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Sıkça Sorulan Sorular</h2>
            </div>
            <Accordion type="single" collapsible className="w-full bg-white p-4 rounded-3xl shadow-lg border border-black/5">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Sosyal etki puanı nedir?</AccordionTrigger>
                    <AccordionContent>
                        Sosyal etki puanı, platformdaki olumlu katkılarınızı ölçen bir sistemdir. Gönüllülük faaliyetleri, bağışlar ve platforma yeni üyeler kazandırma gibi eylemlerle puan kazanırsınız. Bu puanlar, hem topluluk içindeki statünüzü gösterir hem de size özel avantajlar sunar.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>hangel'i kullanmak ücretli mi?</AccordionTrigger>
                    <AccordionContent>
                        hangel'i kullanmak tamamen ücretsizdir. Alışverişlerinizden doğan bağışlar, markalar tarafından karşılanır ve size ek bir maliyet yansıtılmaz.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Gönüllülük faaliyetlerinden puan kazanıyor muyum?</AccordionTrigger>
                    <AccordionContent>
                        Evet, tamamladığınız her gönüllülük faaliyeti için sosyal etki puanı kazanırsınız. Bu puanlar liderlik tablosundaki sıralamanızı ve rozetlerinizi etkiler.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Yaptığım bağışların doğru STK'ya ulaştığından nasıl emin olabilirim?</AccordionTrigger>
                    <AccordionContent>
                        Tüm bağış süreçleri şeffaftır. Profilinizdeki "Bağışlarım" bölümünden her işlemin detayını, hangi STK'ya ne kadar bağış yapıldığını ve işlem durumunu anlık olarak takip edebilirsiniz.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );

  return (
    <div className="bg-[#f5f5f7] min-h-screen">
      <main className="container mx-auto px-4 py-12 md:py-20 space-y-20">
        
        {/* Hero Section */}
        <section className="text-center space-y-6">
            <HangelLogo className="text-6xl mx-auto" />
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">{cms.title || 'hangel Destek'}</h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">{cms.description || cms.subtitle || 'Yardıma mı ihtiyacınız var? Buradan başlayın.'}</p>
        </section>

        {/* Categories Section */}
        <section className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-8 max-w-4xl mx-auto">
            <CategoryLink href="/support/bireysel-kullanicilar" icon={User} label="Bireysel" />
            <CategoryLink href="/support/stk-yoneticileri" icon={Building} label="STK'lar" />
            <CategoryLink href="/support/marka-yoneticileri" icon={Store} label="Markalar" />
            <CategoryLink href="/support/kulup-yoneticileri" icon={School} label="Kulüpler" />
            <CategoryLink href="/support" icon={HelpCircle} label="Genel" />
            <CategoryLink href="/support" icon={Settings} label="Teknik" />
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <QuickActionCard title="Etki Puanım neden artmıyor?" href="/support/bireysel-kullanicilar" />
            <QuickActionCard title="Şeffaflık belgelerim neden reddedildi?" href="/support/stk-yoneticileri" />
            <QuickActionCard title="Bağış oranlarımı nasıl ayarlarım?" href="/support/marka-yoneticileri" />
        </section>

        {/* Search Section */}
        <section className="max-w-xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-bold">Daha Fazla Konu Ara</h3>
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Arama yapın..."
                    className="pl-12 h-14 rounded-full text-lg border-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </form>
        </section>

        {/* Featured Sections */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            <div className="relative aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-muted">
                <Image src="https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=1974&auto=format&fit=crop" alt="AI Assistant" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent" />
            </div>
            <div className="text-center lg:text-left space-y-4">
                <div className="inline-block p-3 bg-primary/10 rounded-2xl">
                    <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold">Yapay Zeka Destekli Asistan</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Sorularınıza anında yanıt alın. Yapay zeka asistanımız, kütüphanemizdeki binlerce makale ve yardım belgesini tarayarak size en doğru bilgiyi saniyeler içinde sunar.
                </p>
                 <Button asChild variant="link" className="text-lg px-0">
                    <Link href="/library">Asistanı Dene <ChevronRight className="ml-1" /></Link>
                 </Button>
            </div>
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
             <div className="relative aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-muted lg:order-2">
                <Image src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop" alt="NGO Transparency" fill className="object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent" />
            </div>
             <div className="text-center lg:text-left space-y-4 lg:order-1">
                 <div className="inline-block p-3 bg-primary/10 rounded-2xl">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold">Şeffaflık & Raporlama</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Bağışlarınızın yolculuğunu ve STK'ların finansal raporlarını şeffaflık ilkemiz gereği kolayca inceleyebilirsiniz. Güven üzerine kurulu bir ekosistem için çalışıyoruz.
                </p>
                 <Button asChild variant="link" className="text-lg px-0">
                    <Link href="/ngo-admin/transparency">Raporları İncele <ChevronRight className="ml-1" /></Link>
                 </Button>
            </div>
        </section>

        {/* More to Explore */}
        <section className="max-w-6xl mx-auto space-y-12 pt-12">
            <h3 className="text-3xl font-bold text-center">Keşfedilecek Daha Fazla Şey Var</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="relative aspect-[4/3]">
                            <Image src="https://images.unsplash.com/photo-1586717791821-3f4ea5654ff3?q=80&w=2070&auto=format&fit=crop" alt="Library" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-6 space-y-2">
                            <h4 className="font-bold text-xl">hangel Kütüphanesi</h4>
                            <p className="text-sm text-muted-foreground">Sosyal etki, gönüllülük ve sivil toplum hakkında yüzlerce makale, rapor ve rehbere ulaşın.</p>
                            <Button asChild variant="link" className="px-0">
                                <Link href="/library">Kütüphaneye git</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="rounded-[2rem] overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="relative aspect-[4/3]">
                            <Image src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop" alt="Video Guides" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-6 space-y-2">
                            <h4 className="font-bold text-xl">Video Rehberler</h4>
                            <p className="text-sm text-muted-foreground">Platformu nasıl daha etkili kullanabileceğinizi anlatan kısa ve eğitici videolarımızı izleyin.</p>
                             <Button asChild variant="link" className="px-0">
                                <Link href="#">Yakında...</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="rounded-[2rem] overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="relative aspect-[4/3]">
                            <Image src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" alt="Community" fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint="university students" />
                        </div>
                        <div className="p-6 space-y-2">
                            <h4 className="font-bold text-xl">Topluluk Forumu</h4>
                            <p className="text-sm text-muted-foreground">Diğer kullanıcılar, STK yöneticileri ve marka temsilcileriyle fikir alışverişinde bulunun.</p>
                            <Button asChild variant="link" className="px-0">
                                <Link href="#">Yakında...</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
        
        {faqSection}

        {/* Bize Ulaşın - Yeni destek talebi oluştur */}
        <section className="max-w-3xl mx-auto">
            <Card className="rounded-[2.5rem] overflow-hidden shadow-xl">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="text-2xl">Bize Ulaşın</CardTitle>
                    <CardDescription>
                        Sorununuzu yazın, destek ekibimiz size hızlıca dönüş yapsın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ticket-name">Adınız (opsiyonel)</Label>
                                <Input
                                    id="ticket-name"
                                    placeholder={authUser?.displayName || 'Adınız'}
                                    value={ticketName}
                                    onChange={(e) => setTicketName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ticket-email">E-posta (opsiyonel)</Label>
                                <Input
                                    id="ticket-email"
                                    type="email"
                                    placeholder={authUser?.email || 'ornek@hangel.org'}
                                    value={ticketEmail}
                                    onChange={(e) => setTicketEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-subject">Konu *</Label>
                            <Input
                                id="ticket-subject"
                                required
                                placeholder="Örn: Bağışım STK profilinde görünmüyor"
                                value={ticketSubject}
                                onChange={(e) => setTicketSubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-priority">Öncelik</Label>
                            <Select value={ticketPriority} onValueChange={(v: string) => setTicketPriority(v as 'low' | 'normal' | 'high')}>
                                <SelectTrigger id="ticket-priority"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Düşük</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">Yüksek (acil)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-message">Mesajınız *</Label>
                            <Textarea
                                id="ticket-message"
                                required
                                rows={6}
                                placeholder="Sorununuzu detaylı olarak açıklayın..."
                                value={ticketMessage}
                                onChange={(e) => setTicketMessage(e.target.value)}
                                className="resize-none"
                            />
                        </div>
                        {!authUser && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                Talep oluşturmak için giriş yapmanız gerekir.
                                <Link href="/login/selection?action=login" className="ml-1 underline font-bold">Giriş yap</Link>
                            </p>
                        )}
                        <Button
                            type="submit"
                            disabled={submittingTicket || !authUser}
                            className="w-full h-12 rounded-full font-bold text-base"
                        >
                            {submittingTicket ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-5 w-5" />
                            )}
                            Destek Talebi Gönder
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </section>

        <section className="max-w-4xl mx-auto pt-16 text-center">
            <h4 className="text-xl font-bold">Toplumsal Fayda için Tasarım</h4>
            <p className="mt-4 text-muted-foreground leading-relaxed">
                Hangel olarak, paydaşlarımız için her zaman en iyi deneyimi yaratmak için çalışıyoruz. Bu nedenle tüm ürünlerimiz, en yüksek şeffaflık, güvenlik ve sosyal etki standartları göz önünde bulundurularak tasarlanmıştır. Bu güven, emniyet ve gizlilikten ödün vermeden bilinçli ve sürdürülebilir bir gelecek inşa etme taahhüdümüzdür.
            </p>
        </section>

      </main>
      <PublicFooter currentPageLabel="Destek Merkezi" />
    </div>
  );
}
