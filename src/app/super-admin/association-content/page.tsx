'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Form for /hangelassociation/page.tsx
const HomePageForm = ({ onSave }: { onSave: (pageName: string) => void }) => {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave('Dernek Ana Sayfa'); }}>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-foreground">Çalıştay Bölümü</h4>
                    <div className="space-y-2">
                        <Label>Alt Başlık</Label>
                        <Input defaultValue="Küresel Diyalog" />
                    </div>
                    <div className="space-y-2">
                        <Label>Ana Başlık</Label>
                        <Input defaultValue="Uluslararası Sosyal Girişimcilik Çalıştayı." />
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama</Label>
                        <Textarea defaultValue="54 ülkeden vizyoner liderlerle ortak sorunlara kolektif çözümler üretiyoruz. Türkiye'nin ilk, dünyanın 27. Sosyal Girişimcilik Yüksek Lisans programına ilham verdik." />
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-foreground">Mevzuat Bölümü</h4>
                    <div className="space-y-2">
                        <Label>Alt Başlık</Label>
                        <Input defaultValue="Hukuki Reform" />
                    </div>
                    <div className="space-y-2">
                        <Label>Ana Başlık</Label>
                        <Input defaultValue="Sosyal Girişimcilik Kanunu Teklifi." />
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama</Label>
                        <Textarea defaultValue="29 maddelik kanun teklifimizle, sosyal girişimciliğin yasal statüsünü, denetim standartlarını ve teşvik mekanizmalarını tanımlıyoruz." />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit">Ana Sayfayı Güncelle</Button>
            </CardFooter>
        </form>
    );
};

// Form for /hangelassociation/about/page.tsx
const AboutPageForm = ({ onSave }: { onSave: (pageName: string) => void }) => {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave('Dernek Hakkında'); }}>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-foreground">Ana Başlık Bölümü</h4>
                    <div className="space-y-2"><Label>Badge</Label><Input defaultValue="BİZ KİMİZ?" /></div>
                    <div className="space-y-2"><Label>Ana Başlık</Label><Input defaultValue="Daha İyi Bir Dünya İçin Kolektif Bir Bilinç." /></div>
                    <div className="space-y-2"><Label>Açıklama</Label><Textarea defaultValue="Biz, dünyayı daha iyi bir yer haline getirme vizyonumuzu ve ideallerimizi paylaşan insanları dünyanın dört bir yanından bir araya getiriyoruz. Zorluklardan kaçmıyor, onları fırsata dönüştürmek için harekete geçiyoruz." /></div>
                </div>
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-foreground">Misyon & Vizyon Bölümü</h4>
                    <div className="space-y-2"><Label>Misyon Başlığı</Label><Input defaultValue="Misyonumuz." /></div>
                    <div className="space-y-2"><Label>Misyon Açıklaması</Label><Textarea defaultValue="hangel ve Social Business Global olarak misyonumuz; hayatın her kesiminden, kurum ve sivil toplumdan herkesin iyilik yapmaya katılabildiği adil ve kapsayıcı bir sistem inşa etmektir..." /></div>
                    <div className="space-y-2"><Label>Vizyon Başlığı</Label><Input defaultValue="Küresel Ağ Hedefimiz." /></div>
                    <div className="space-y-2"><Label>Vizyon Açıklaması</Label><Textarea defaultValue="Ulusal ve uluslararası paydaşlarımız ile hayata sosyal fayda odaklı bakan sosyal girişimcileri bir araya getirerek, birbirlerinden ilham almalarını sağlayacak doğal bir ağ oluşturuyoruz..." /></div>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit">Hakkında Sayfasını Güncelle</Button>
            </CardFooter>
        </form>
    );
};

// ... and so on for other pages ...

export default function AssociationContentPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (pageName: string) => {
        toast({ title: 'Kaydedildi', description: `${pageName} sayfası başarıyla güncellendi.` });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.push('/super-admin')} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Dernek Web Sitesi Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Dernek sayfalarının metin ve görsel içeriklerini yönetin.</p>
                </div>
            </div>

            <Tabs defaultValue="homepage" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="homepage">Ana Sayfa</TabsTrigger>
                    <TabsTrigger value="about">Hakkında</TabsTrigger>
                    <TabsTrigger value="events">Etkinlikler</TabsTrigger>
                    <TabsTrigger value="workshop">Çalıştay</TabsTrigger>
                    <TabsTrigger value="legislation">Mevzuat</TabsTrigger>
                </TabsList>

                <TabsContent value="homepage" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dernek Ana Sayfası</CardTitle>
                            <CardDescription>/hangelassociation sayfasının içeriklerini düzenleyin.</CardDescription>
                        </CardHeader>
                        <HomePageForm onSave={handleSave} />
                    </Card>
                </TabsContent>

                <TabsContent value="about" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Hakkında Sayfası</CardTitle>
                            <CardDescription>/hangelassociation/about sayfasının içeriklerini düzenleyin.</CardDescription>
                        </CardHeader>
                        <AboutPageForm onSave={handleSave} />
                    </Card>
                </TabsContent>
                
                 <TabsContent value="events" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Etkinlikler Sayfası</CardTitle></CardHeader>
                        <CardContent><p className="text-center p-8 text-muted-foreground">Bu bölüm yakında geliştirilecektir.</p></CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="workshop" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Çalıştay Sayfası</CardTitle></CardHeader>
                        <CardContent><p className="text-center p-8 text-muted-foreground">Bu bölüm yakında geliştirilecektir.</p></CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="legislation" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Mevzuat Sayfası</CardTitle></CardHeader>
                        <CardContent><p className="text-center p-8 text-muted-foreground">Bu bölüm yakında geliştirilecektir.</p></CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
