'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Eye, Palette, Newspaper, Handshake, Mail, CheckCircle, Server, ShieldCheck, BarChart3 } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

const WebsitePreview = ({ theme, enabledSections }: { theme: string, enabledSections: string[] }) => {
    const ngo = {
        name: 'Ahbap Derneği',
        logoUrl: 'https://logo.clearbit.com/ahbap.org',
        about: 'Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir.',
    };

    const sectionsToRender = contentSections.filter(s => enabledSections.includes(s.id));

    return (
        <div className="w-full h-[70vh] bg-muted rounded-lg overflow-hidden flex flex-col">
            {/* Browser chrome */}
            <div className="flex-shrink-0 h-8 bg-gray-200 dark:bg-gray-800 flex items-center px-2 gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            {/* Website Content */}
            <div className="flex-1 overflow-y-auto">
                <header className="p-8 text-center border-b bg-background">
                    <h1 className="text-3xl font-bold text-foreground">{ngo.name}</h1>
                    <nav className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
                        {sectionsToRender.map(section => (
                            <a key={section.id} href="#" className="hover:text-foreground">{section.label}</a>
                        ))}
                    </nav>
                </header>
                <main className="p-8 bg-background">
                    <h2 className="text-2xl font-semibold mb-4">Hakkımızda</h2>
                    <p className="text-muted-foreground">{ngo.about}</p>
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Gönüllülük Fırsatları</h3>
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-bold">Afet Bölgesi Yardım Dağıtımı</h4>
                                <p className="text-sm text-muted-foreground">Hatay, Antakya</p>
                            </div>
                             <div className="p-4 border rounded-lg">
                                <h4 className="font-bold">Ağaç Dikme Şenliği</h4>
                                <p className="text-sm text-muted-foreground">İstanbul, Çekmeköy</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};


export default function WebsiteBuilderPage() {
    const [isPublished, setIsPublished] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('modern');
    const [enabledSections, setEnabledSections] = useState<string[]>(
        contentSections.filter(s => s.default).map(s => s.id)
    );
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
                    <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" />Alan Adı (Domain) ve DNS</CardTitle>
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
                        <Server className="h-4 w-4" />
                        <AlertTitle>DNS Kayıtlarını Güncelleyin</AlertTitle>
                        <AlertDescription>
                            Alan adınızı kaydettikten sonra, alan adı sağlayıcınızın (örn: GoDaddy, Natro) DNS paneline giderek aşağıdaki kayıtları oluşturun. Değişikliklerin internete yayılması 24 saati bulabilir.
                            <div className="mt-2 space-y-2 p-2 bg-muted rounded font-mono text-xs">
                                <div>
                                    <p><strong>Tür:</strong> CNAME</p>
                                    <p><strong>İsim/Host:</strong> www</p>
                                    <p><strong>Değer/Yönlendirilen:</strong> host.hangel.org</p>
                                </div>
                                <div className="pt-2 border-t border-muted-foreground/20">
                                     <p>Ayrıca, alan adınızın isim sunucularını (NS) aşağıdaki gibi güncelleyin:</p>
                                     <p><strong>NS1:</strong> ns1.hangel.org</p>
                                     <p><strong>NS2:</strong> ns2.hangel.org</p>
                                </div>
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
                <CardContent className="p-0">
                    <Accordion type="multiple" className="w-full">
                        {contentSections.map(section => (
                        <AccordionItem value={section.id} key={section.id} className="border-b last:border-b-0">
                            <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex items-center gap-3 text-base">
                                <section.icon className="h-5 w-5 text-primary" />
                                <p className="font-semibold">{section.label}</p>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                <Label htmlFor={`publish-${section.id}`} className="font-medium text-sm">
                                    Bu bölümü sitede yayınla
                                </Label>
                                <Switch 
                                    id={`publish-${section.id}`} 
                                    checked={enabledSections.includes(section.id)}
                                    onCheckedChange={(checked) => {
                                        setEnabledSections(prev => 
                                        checked ? [...prev, section.id] : prev.filter(id => id !== section.id)
                                        )
                                    }}
                                />
                            </div>
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Genel Durum</CardTitle>
                    <CardDescription>Web sitenizin yayın durumunu ve adresini yönetin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <Label htmlFor="publish-switch">Web Sitesini Yayınla</Label>
                            <p className="text-xs text-muted-foreground">Siteniz <a href="https://ahbap.hangel.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">ahbap.hangel.org</a> adresinde yayınlanacak.</p>
                        </div>
                        <Switch id="publish-switch" checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full" disabled={!isPublished}>
                                <Eye className="mr-2 h-4 w-4" /> Siteyi Önizle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 border-0">
                           <WebsitePreview theme={selectedTheme} enabledSections={enabledSections} />
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
            </div>
        </div>
    );
}
