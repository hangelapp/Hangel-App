
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Eye, Palette, Newspaper, Handshake, Mail, CheckCircle, Server, ShieldCheck, BarChart3, Copy, CreditCard, MessageSquare, QrCode, Link as LinkIcon, Menu } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { ngos } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const themes = [
    { id: 'modern', name: 'Modern', imageUrl: 'https://picsum.photos/seed/theme-modern/400/300' },
    { id: 'minimalist', name: 'Minimalist', imageUrl: 'https://picsum.photos/seed/theme-minimal/400/300' },
    { id: 'impactful', name: 'Etkili', imageUrl: 'https://picsum.photos/seed/theme-impact/400/300' },
];


export default function WebsiteBuilderPage() {
    const [isPublished, setIsPublished] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('modern');
    const { toast } = useToast();
    const [customDomain, setCustomDomain] = useState('');
    const ngo = ngos.find(n => n.id === '2'); // Ahbap Derneği for preview data

    const contentSections = [
        { id: 'about', label: 'Hakkımızda ve İletişim', icon: Globe, default: true, description: ngo?.about },
        { id: 'counter', label: 'Sayaç İstatistikleri', icon: BarChart3, default: true, description: 'Sitenizde öne çıkan rakamlar (kuruluş yılı, gönüllü sayısı vb.).' },
        { id: 'volunteer', label: 'Gönüllülük İlanları', icon: Handshake, default: true, description: `${ngo?.opportunities.length || 0} aktif ilan bulunuyor.` },
        { id: 'posts', label: 'Gönderiler', icon: Newspaper, default: true, description: `${ngo?.posts.length || 0} gönderi mevcut.` },
        { id: 'transparency', label: 'Şeffaflık Endeksi', icon: ShieldCheck, default: true, description: `Mevcut puan: ${ngo?.transparencyScore}/100` },
        { id: 'stats', label: 'Bağış İstatistikleri', icon: BarChart3, default: false, description: `Toplam ${ngo?.stats.totalDonation.toLocaleString('tr-TR')} ₺ bağış toplandı.` },
        { id: 'reports', label: 'Etki Raporları', icon: Newspaper, default: false, description: "Yayınlanmış etki raporları listelenir." },
        { id: 'banking', label: 'Banka ve Ödeme Bilgileri', icon: CreditCard, default: false, description: "Doğrudan bağışlar için IBAN ve Sanal POS bilgileri." },
        { id: 'sms', label: 'SMS Kampanyası', icon: MessageSquare, default: false, description: "SMS ile bağış kampanyası bilgilerinizi girin ve sitenizde yayınlayın." }
    ];
    
    const contentSectionIds = contentSections.map(s => s.id);
    const [enabledSections, setEnabledSections] = useState<string[]>(contentSections.filter(s => s.default).map(s => s.id));
    const [allSectionsEnabled, setAllSectionsEnabled] = useState(contentSections.filter(s => s.default).length === contentSections.length);


    const handleMasterSwitch = (checked: boolean) => {
        setAllSectionsEnabled(checked);
        if (checked) {
            setEnabledSections(contentSectionIds);
        } else {
            setEnabledSections([]);
        }
    };


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
                     <div className="space-y-2">
                        <Label htmlFor="domain-provider">Domain Hizmet Sağlayıcınız</Label>
                        <Select>
                            <SelectTrigger id="domain-provider"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="natro">Natro</SelectItem>
                                <SelectItem value="turhost">Turhost</SelectItem>
                                <SelectItem value="isimtescil">İsimtescil</SelectItem>
                                <SelectItem value="godaddy">GoDaddy</SelectItem>
                                <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Alert>
                        <Server className="h-4 w-4" />
                        <AlertTitle>DNS Kayıtlarını Güncelleyin</AlertTitle>
                        <AlertDescription>
                            Alan adınızı kaydettikten sonra, alan adı sağlayıcınızın DNS paneline giderek aşağıdaki kayıtları oluşturun. Değişikliklerin internete yayılması 24 saati bulabilir.
                            <div className="mt-2 space-y-2 p-2 bg-muted rounded font-mono text-xs">
                                <div>
                                    <p><strong>Tür:</strong> CNAME</p>
                                    <p><strong>İsim/Host:</strong> www</p>
                                    <p><strong>Değer/Yönlendirilen:</strong> host.hangel.org</p>
                                </div>
                                <div className="pt-2 border-t border-muted-foreground/20">
                                     <p>Ayrıca, alan adınızın isim sunucularını (NS) aşağıdaki gibi güncelleyin:</p>
                                     <div className="flex items-center justify-between">
                                        <p><strong>NS1:</strong> ns1.hangel.org</p>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText('ns1.hangel.org'); toast({ title: 'Kopyalandı!' }); }}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p><strong>NS2:</strong> ns2.hangel.org</p>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText('ns2.hangel.org'); toast({ title: 'Kopyalandı!' }); }}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />Tema Renkleri</CardTitle>
                    <CardDescription>Sitenizin ana renklerini belirleyin. Logonuzla uyumlu renkler seçmeniz önerilir.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="primary-color">Ana Renk</Label>
                        <Input type="color" id="primary-color" defaultValue="#f34723" className="p-1 h-12 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secondary-color">İkinci Renk (Arka Plan)</Label>
                        <Input type="color" id="secondary-color" defaultValue="#f1f5f9" className="p-1 h-12 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accent-color">Vurgu Rengi (Metin)</Label>
                        <Input type="color" id="accent-color" defaultValue="#042654" className="p-1 h-12 w-full" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>İçerik Yönetimi</CardTitle>
                            <CardDescription>Sitenizde hangi bölümlerin gösterileceğini seçin.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="publish-all" className="text-sm font-medium">Tümünü Yayınla</Label>
                            <Switch id="publish-all" checked={allSectionsEnabled} onCheckedChange={handleMasterSwitch} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Accordion type="multiple" className="w-full" defaultValue={['about']}>
                        {contentSections.map(section => (
                        <AccordionItem value={section.id} key={section.id} className="border-b last:border-b-0">
                            <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex items-center gap-3 text-base">
                                <section.icon className="h-5 w-5 text-primary" />
                                <p className="font-semibold">{section.label}</p>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                               <div className="text-sm p-4 bg-muted/50 rounded-lg border">
                                    <p className="font-semibold">Bölüm Detayları:</p>
                                    <p className="text-muted-foreground line-clamp-2">{section.description}</p>
                                 </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
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
                                {section.id === 'banking' && (
                                    <div className="space-y-4 pt-4 border-t mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank-iban">Banka IBAN Numarası</Label>
                                            <Input id="bank-iban" placeholder="TR..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank-account-holder">Hesap Sahibi</Label>
                                            <Input id="bank-account-holder" placeholder="Kuruluşun yasal adı" />
                                        </div>
                                    </div>
                                )}
                                 {section.id === 'sms' && (
                                    <div className="space-y-4 pt-4 border-t mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sms-keyword">Anahtar Kelime (Keyword)</Label>
                                            <Input id="sms-keyword" placeholder="DESTEK" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sms-number">Numara</Label>
                                            <Input id="sms-number" placeholder="3406" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sms-description">Açıklama (Örn: Bir SMS 20 TL değerindedir.)</Label>
                                            <Input id="sms-description" placeholder="Bir SMS 20 TL değerindedir." />
                                        </div>
                                    </div>
                                )}
                                {section.id === 'counter' && (
                                    <div className="space-y-4 pt-4 border-t mt-4">
                                        <p className="text-sm text-muted-foreground">Sitenizin ana sayfasında gösterilecek önemli rakamları buradan yönetin.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="counter-year">Kuruluş Yılı</Label>
                                                <Input id="counter-year" placeholder="Örn: 1992" defaultValue={ngo?.foundationYear || ''}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="counter-volunteers">Toplam Gönüllü</Label>
                                                <Input id="counter-volunteers" placeholder="Örn: 80000" type="number" defaultValue={ngo?.stats.volunteers || ''} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="counter-projects">Tamamlanan Proje</Label>
                                                <Input id="counter-projects" placeholder="Örn: 150" type="number" defaultValue={ngo?.stats.projects || ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="counter-reached">Ulaşılan İnsan</Label>
                                                <Input id="counter-reached" placeholder="Örn: 500000" type="number" defaultValue={ngo?.stats.peopleReached || ''} />
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                     <Button asChild className="w-full" disabled={!isPublished}>
                        <Link href="/ngo-admin/website/preview" target="_blank">
                            <Eye className="mr-2 h-4 w-4" /> Siteyi Önizle
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
            </div>
        </div>
    );
}
    

    