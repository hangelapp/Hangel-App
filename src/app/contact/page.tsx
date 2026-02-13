'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, ArrowLeft, Building, School, Store, User, DollarSign, Landmark, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import Link from 'next/link';

const ContactCard = ({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string; description: string; }) => (
    <Link href={href} className="block group">
        <Card className="h-full hover:border-primary transition-all hover:shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
            <CardFooter>
                 <span className="text-sm font-bold text-primary flex items-center">
                    Devam Et <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
            </CardFooter>
        </Card>
    </Link>
);


export default function ContactPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate a form error for demonstration
        const hasError = Math.random() > 0.5;
        setError(hasError);

        if (!hasError) {
            toast({
                title: "Mesajınız Gönderildi",
                description: "hangel iş geliştirme ekibi en kısa sürede sizinle iletişime geçecektir.",
            });
        }
    };
    
    const countryOptions = ["Türkiye", "ABD", "Almanya", "İngiltere"];
    const institutionTypeOptions = ["Belediye", "Bakanlık", "Üniversite", "Lise", "Şirket", "Diğer"];

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold font-headline">İletişim Merkezi</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Doğru departmana daha hızlı ulaşmak için aşağıdaki kategorilerden birini seçin veya genel talepler için formu doldurun.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ContactCard 
                    href="/support"
                    icon={User}
                    title="Bireysel Destek"
                    description="Uygulama kullanımı, puanlar ve genel sorularınız için yardım merkezimizi ziyaret edin."
                />
                 <ContactCard 
                    href="/ngo-onboarding"
                    icon={Building}
                    title="STK Başvurusu"
                    description="Kuruluşunuzu hangel'e dahil etmek ve dijital araçlardan faydalanmak için başvurun."
                />
                 <ContactCard 
                    href="/merchant"
                    icon={Store}
                    title="Marka & İşletme İşbirliği"
                    description="Markanızla sosyal etki yaratmak veya QR ödeme sistemine dahil olmak için bize ulaşın."
                />
                 <ContactCard 
                    href="/contact/universities"
                    icon={School}
                    title="Üniversiteler için"
                    description="Kampüs programları, öğrenci kulübü yönetimi ve akademik işbirlikleri için bu formu kullanın."
                />
                 <ContactCard 
                    href="/contact/municipalities"
                    icon={Landmark}
                    title="Belediyeler için"
                    description="Akıllı şehir çözümleri, vatandaş katılımı ve yerel STK işbirlikleri hakkında bilgi alın."
                />
                 <ContactCard 
                    href="/contact/funds"
                    icon={DollarSign}
                    title="Uluslararası Fonlar"
                    description="Türkiye'deki sosyal etki ekosistemine yatırım ve fon desteği sağlamak için iletişime geçin."
                />
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-4">
                         <div className="p-3 bg-primary/10 rounded-xl">
                            <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Genel Kurumsal İletişim Formu</CardTitle>
                            <CardDescription>
                                Yukarıdaki kategorilere uymayan genel kurumsal talepleriniz için formu doldurun.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
                            Gönderiminizde bir sorun oluştu. Lütfen tüm bilgilerin doğru olduğundan emin olmak için aşağıdaki alanları kontrol edin.
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="institution-type">Kurum Türü</Label>
                            <Select required>
                                <SelectTrigger id="institution-type">
                                    <SelectValue placeholder="Birini seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {institutionTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">İşbirliği Amacı</Label>
                            <Textarea id="purpose" placeholder="Kurmak istediğiniz işbirliğinin amacını kısaca açıklayınız..." required />
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">İlk adı</Label>
                                <Input id="first-name" placeholder="Adınız" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name">Soyadı</Label>
                                <Input id="last-name" placeholder="Soyadınız" required />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" type="email" placeholder="kurumsal@sirket.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <Input id="phone" type="tel" placeholder="+90..." required />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="department">Departman</Label>
                            <Input id="department" placeholder="Departmanınız (örn: Kurumsal İletişim)" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Ülke</Label>
                            <Select required>
                                <SelectTrigger id="country">
                                    <SelectValue placeholder="Birini seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="comments">Ek Yorumlar (isteğe bağlı)</Label>
                            <Textarea id="comments" placeholder="İşbirliği yapmak istediğiniz alanlar, sorularınız veya önerileriniz..." />
                        </div>
                        
                        <div className="space-y-4 pt-4">
                             <div className="flex items-start space-x-3">
                                <Checkbox id="marketing-consent" />
                                <Label htmlFor="marketing-consent" className="text-xs font-normal text-muted-foreground">
                                    hangel'in kurumsal teklifleri ve daha fazlası hakkında duyurular, öneriler ve güncellemeler almak istiyorum.
                                </Label>
                            </div>
                             <Button type="submit" className="w-full">Gönder</Button>
                              <p className="text-xs text-muted-foreground">
                                “Gönder” düğmesine tıklayarak, talebinizi karşılamak için bilgilerinizi yetkili ortaklarımızla paylaşmayı kabul ediyorsunuz. Bilgileriniz yalnızca gerekli operasyonel ve işlemsel iletişimler için kullanılacaktır.
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
