
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Eye, Palette, Newspaper, Handshake, Mail, CheckCircle, Server, ShieldCheck, BarChart3, Copy, CreditCard, MessageSquare, QrCode, Link as LinkIcon, Menu, Edit, Store, Landmark, Target } from 'lucide-react';
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

// A new component for read-only sections with an edit link
const ReadOnlySectionCard = ({ icon: Icon, title, description, editHref }: { icon: React.ElementType, title: string, description: string, editHref: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-start justify-between">
            <div>
                <CardTitle className="flex items-center gap-3 text-lg"><Icon className="h-5 w-5 text-primary" /> {title}</CardTitle>
                <CardDescription className="pt-1 line-clamp-2">{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2 pl-4">
                <Switch id={`publish-${title.toLowerCase().replace(' ', '-')}`} defaultChecked />
            </div>
        </CardHeader>
        <CardContent>
            <Button asChild variant="secondary" className="w-full">
                <Link href={editHref}>
                    <Edit className="mr-2 h-4 w-4" /> İçeriği Düzenle
                </Link>
            </Button>
        </CardContent>
    </Card>
);


export default function WebsiteBuilderPage() {
    const [isPublished, setIsPublished] = useState(false);
    const { toast } = useToast();
    const [customDomain, setCustomDomain] = useState('');
    const [domainProvider, setDomainProvider] = useState('');
    const ngo = ngos.find(n => n.id === '2'); // Ahbap Derneği for preview data
    const [primaryColor, setPrimaryColor] = useState('#f34723');
    const [secondaryColor, setSecondaryColor] = useState('#f1f5f9');
    const [accentColor, setAccentColor] = useState('#042654');

    const previewLink = `/ngo-admin/website/preview?primary=${primaryColor.substring(1)}&secondary=${secondaryColor.substring(1)}&accent=${accentColor.substring(1)}`;


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
                        <Select onValueChange={setDomainProvider}>
                            <SelectTrigger id="domain-provider"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="natro">Natro</SelectItem>
                                <SelectItem value="turhost">Turhost</SelectItem>
                                <SelectItem value="isimtescil">İsimtescil</SelectItem>
                                <SelectItem value="godaddy">GoDaddy</SelectItem>
                                <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                        </Select>
                        {domainProvider === 'other' && (
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="other-domain-provider">Diğer Sağlayıcı</Label>
                                <Input id="other-domain-provider" placeholder="Alan adı sağlayıcınızı yazın..." />
                            </div>
                        )}
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
                        <Label htmlFor="primary-color-text">Ana Renk</Label>
                        <div className="flex items-center gap-2">
                            <Input type="color" id="primary-color-picker" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="p-1 h-12 w-16" />
                            <Input id="primary-color-text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secondary-color-text">İkinci Renk (Arka Plan)</Label>
                        <div className="flex items-center gap-2">
                            <Input type="color" id="secondary-color-picker" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="p-1 h-12 w-16" />
                            <Input id="secondary-color-text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accent-color-text">Vurgu Rengi (Metin)</Label>
                         <div className="flex items-center gap-2">
                            <Input type="color" id="accent-color-picker" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="p-1 h-12 w-16" />
                            <Input id="accent-color-text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono"/>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-1">
                <h2 className="text-xl font-semibold">İçerik Yönetimi</h2>
                <p className="text-sm text-muted-foreground">
                    Sitenizde hangi bölümlerin gösterileceğini seçin.
                </p>
            </div>

            <div className="space-y-4">
                <ReadOnlySectionCard 
                    icon={Globe} 
                    title="Hakkımızda ve İletişim" 
                    description={ngo?.about ?? "Kuruluş açıklaması, odak alanları ve iletişim bilgileri."}
                    editHref="/ngo-admin/manage-profile"
                />

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-lg"><BarChart3 className="h-5 w-5 text-primary" /> Sayaç İstatistikleri</CardTitle>
                            <CardDescription className="pt-1">Sitenizin ana sayfasında gösterilecek önemli rakamlar.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                            <Switch id="publish-counter" defaultChecked />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                </Card>

                <ReadOnlySectionCard 
                    icon={Target}
                    title="Bağış Kampanyaları"
                    description="Devam eden veya tamamlanmış bağış kampanyalarınız."
                    editHref="/ngo-admin/campaigns"
                />

                <ReadOnlySectionCard 
                    icon={Handshake} 
                    title="Gönüllülük İlanları" 
                    description={`${ngo?.opportunities.length || 0} aktif ilan bulunuyor.`}
                    editHref="/ngo-admin/volunteer"
                />
                 <ReadOnlySectionCard 
                    icon={Newspaper} 
                    title="Haberler (Gönderiler)" 
                    description={`${ngo?.posts.length || 0} gönderi mevcut.`}
                    editHref="/ngo-admin/posts"
                />
                <ReadOnlySectionCard 
                    icon={ShieldCheck} 
                    title="Şeffaflık" 
                    description={`Mevcut puan: ${ngo?.transparencyScore}/100.`}
                    editHref="/ngo-admin/transparency"
                />

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-lg"><Store className="h-5 w-5 text-primary" /> İktisadi İşletme</CardTitle>
                            <CardDescription className="pt-1">İktisadi işletmenize ait ürünleri sergileyin.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                            <Switch id="publish-ecommerce" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="xml-feed">XML Ürün Feed Linki</Label>
                            <Input id="xml-feed" placeholder="https://ornek.com/urunler.xml" />
                            <p className="text-xs text-muted-foreground">Ürünlerinizi otomatik olarak çekmek için XML linkini girin.</p>
                        </div>
                    </CardContent>
                </Card>
                
                 <ReadOnlySectionCard 
                    icon={CreditCard}
                    title="Banka ve Ödeme Bilgileri"
                    description="Doğrudan bağışlar için IBAN ve Sanal POS bilgileri."
                    editHref="/ngo-admin/manage-profile"
                />
                
                 <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-lg"><MessageSquare className="h-5 w-5 text-primary" /> SMS Kampanyası</CardTitle>
                            <CardDescription className="pt-1">SMS ile bağış kampanyası bilgilerinizi girin.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                            <Switch id="publish-sms" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                </Card>

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
                            <p className="text-xs text-muted-foreground">Siteniz <a href="https://ahbap.hangel.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">ahbap.hangel.org</a> adresinde yayınlanacak.</p>
                        </div>
                        <Switch id="publish-switch" checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                     <Button asChild className="w-full" disabled={!isPublished}>
                        <Link href={previewLink} target="_blank">
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
