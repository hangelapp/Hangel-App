'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Eye, Palette, Newspaper, Handshake, Mail, CheckCircle, Dns, ShieldCheck, BarChart3 } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const themes = [
    { id: 'modern', name: 'Modern', imageUrl: 'https://picsum.photos/seed/theme-modern/400/300' },
    { id: 'minimalist', name: 'Minimalist', imageUrl: 'https://picsum.photos/seed/theme-minimal/400/300' },
    { id: 'impactful', name: 'Etkili', imageUrl: 'https://picsum.photos/seed/theme-impact/400/300' },
];

const contentSections = [
    { id: 'about', label: 'Hakkımızda ve İletişim', icon: Globe, default: true },
    { id: 'volunteer', label: 'Gönüllülük İlanları', icon: Handshake, default: true },
    { id: 'posts', label: 'Gönderiler', icon: Newspaper, default: true },
    { id: 'transparency', label: 'Şeffaflık Endeksi', icon: ShieldCheck, default: true },
    { id: 'stats', label: 'Bağış İstatistikleri', icon: BarChart3, default: false },
    { id: 'reports', label: 'Etki Raporları', icon: Newspaper, default: false },
];

export default function WebsiteBuilderPage() {
    const [isPublished, setIsPublished] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('modern');
    const { toast } = useToast();
    const [customDomain, setCustomDomain] = useState('');

    const handleSave = () => {
        toast({
            title: "Kaydedildi!",
            description: "Web sitesi ayarlarınız başarıyla güncellendi.",
        });
        if(customDomain) {
            toast({
                title: "Domain Kaydedildi!",
                description: `Lütfen ${customDomain} için DNS kayıtlarınızı güncelleyin. Siteniz 24 saat içinde aktif olacaktır.`,
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Web Sitesi Yönetimi</h1>
                <p className="text-muted-foreground">
                    Hangel'deki profil bilgilerinizle otomatik olarak bir web sitesi oluşturun ve yönetin.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Genel Durum</CardTitle>
                    <CardDescription>Web sitenizin yayın durumunu ve adresini yönetin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <Label htmlFor="publish-switch">Web Sitesini Yayınla</Label>
                            <p className="text-xs text-muted-foreground">Siteniz <a href="#" className="underline font-semibold">ahbap.hangel.site</a> adresinde yayınlanacak.</p>
                        </div>
                        <Switch id="publish-switch" checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                     <Button asChild className="w-full" disabled={!isPublished}>
                        <a href="#" target="_blank" rel="noopener noreferrer">
                            <Eye className="mr-2 h-4 w-4" /> Siteyi Önizle
                        </a>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Dns className="h-5 w-5 text-primary" />Alan Adı (Domain) ve DNS</CardTitle>
                    <CardDescription>Sitenizi kendi alan adınızda yayınlayın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="custom-domain">Kendi Alan Adınız</Label>
                        <Input 
                            id="custom-domain" 
                            placeholder="ornek-stk.org.tr" 
                            value={customDomain} 
                            onChange={(e) => setCustomDomain(e.target.value)} 
                        />
                    </div>
                    <Alert>
                        <Dns className="h-4 w-4" />
                        <AlertTitle>DNS Kayıtlarını Güncelleyin</AlertTitle>
                        <AlertDescription>
                            Alan adınızı kaydettikten sonra, alan adı sağlayıcınızın (örn: GoDaddy, Natro) DNS paneline giderek aşağıdaki CNAME kaydını oluşturun. Değişikliklerin internete yayılması 24 saati bulabilir.
                            <div className="mt-2 p-2 bg-muted rounded font-mono text-xs">
                                <p><strong>Tür:</strong> CNAME</p>
                                <p><strong>İsim:</strong> www</p>
                                <p><strong>Değer:</strong> host.hangel.site</p>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tema Seçimi</CardTitle>
                    <CardDescription>Web sitenizin görünümünü seçin.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themes.map(theme => (
                        <div 
                            key={theme.id}
                            className={cn(
                                "relative rounded-lg border-2 cursor-pointer transition-all",
                                selectedTheme === theme.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border hover:border-primary/50"
                            )}
                            onClick={() => setSelectedTheme(theme.id)}
                        >
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                               {selectedTheme === theme.id && <CheckCircle className="h-12 w-12 text-white" />}
                            </div>
                            <Image 
                                src={theme.imageUrl} 
                                alt={theme.name} 
                                width={400} 
                                height={300} 
                                className="rounded-md object-cover aspect-[4/3]" 
                            />
                            <p className="p-2 text-center font-medium text-sm bg-muted/50 rounded-b-md">{theme.name}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>İçerik Yönetimi</CardTitle>
                    <CardDescription>Sitenizde hangi bölümlerin gösterileceğini seçin. Bu veriler Hangel profilinizden otomatik olarak çekilir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {contentSections.map(section => (
                         <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor={`section-${section.id}`} className="flex items-center gap-2 font-medium cursor-pointer">
                                <section.icon className="h-5 w-5 text-muted-foreground" />
                                {section.label}
                            </Label>
                            <Switch id={`section-${section.id}`} defaultChecked={section.default} />
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
            </div>
        </div>
    );
}
