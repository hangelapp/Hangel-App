'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AboutPageForm = ({ onSave }: { onSave: (pageName: string) => void }) => {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave('Hakkımızda'); }}>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-foreground">Ana Başlık Bölümü</h4>
                    <div className="space-y-2">
                        <Label>Ana Başlık</Label>
                        <Input defaultValue="İyiliği Dijitalleştirdik." />
                    </div>
                    <div className="space-y-2">
                        <Label>Alt Başlık</Label>
                        <Input defaultValue="Geleceğin dayanışma modelini inşa ediyoruz." />
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama</Label>
                        <Textarea defaultValue="Bireyleri, sivil toplum kuruluşlarını ve markaları toplumsal fayda odağında birleştiren, en kapsamlı sosyal etki platformuyuz." />
                    </div>
                </div>
                <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-foreground">Sosyal Girişim Bölümü</h4>
                    <div className="space-y-2">
                        <Label>Başlık</Label>
                        <Input defaultValue="Bir Sosyal Girişim Hikayesi." />
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama</Label>
                        <Textarea defaultValue="Hangel, kârını toplumsal faydaya yatıran bir sosyal girişimdir. Amacımız ticari başarıyı, sosyal sorunlara sürdürülebilir çözümler üretmek için bir araç olarak kullanmaktır. Bu model, finansal bağımsızlık ve kalıcı etki yaratma gücü sunar." />
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-foreground">Kuruluş Felsefesi Bölümü</h4>
                    <div className="space-y-2">
                        <Label>Başlık</Label>
                        <Input defaultValue="Kuruluş Felsefemiz." />
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama</Label>
                        <Textarea defaultValue="Yola çıkarken tek bir mottomuz vardı: 'Yok öyle yalnız başına mücadele etmek'. Toplumsal sorunların bireysel çabalarla aşılamayacağına, kolektif bir bilinç ve teknoloji destekli bir altyapı ile gerçek değişimin mümkün olduğuna inanıyoruz." />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit">Hakkımızda Sayfasını Güncelle</Button>
            </CardFooter>
        </form>
    );
};

export default function WebContentPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (pageName: string) => {
        toast({ title: 'Kaydedildi', description: `${pageName} sayfası başarıyla güncellendi.` });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">WEB İçerik Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Genel web sayfalarının metin ve görsel içeriklerini yönetin.</p>
                </div>
            </div>

            <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="about">Hakkımızda</TabsTrigger>
                    <TabsTrigger value="social-impact" disabled>Sosyal Etki</TabsTrigger>
                    <TabsTrigger value="press" disabled>Basın Odası</TabsTrigger>
                    <TabsTrigger value="careers" disabled>Kariyer</TabsTrigger>
                    <TabsTrigger value="contact" disabled>İletişim</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hakkımızda Sayfası İçerikleri</CardTitle>
                            <CardDescription>/about adresindeki sayfanın metinlerini buradan düzenleyebilirsiniz.</CardDescription>
                        </CardHeader>
                        <AboutPageForm onSave={handleSave} />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
