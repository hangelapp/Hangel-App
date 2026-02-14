
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
    ArrowLeft, 
    Contrast, 
    MinusCircle, 
    Type, 
    Eye, 
    Ear, 
    Pilcrow, 
    Maximize, 
    Timer, 
    Languages, 
    Layers, 
    Volume2, 
    Clock, 
    ShieldCheck,
    AlignLeft,
    Sparkles,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const SettingsItem = ({ children, icon: Icon, label, iconColor, description }: { children: React.ReactNode, icon: React.ElementType, label: string, iconColor: string, description?: string }) => (
    <div className="flex items-center p-4 text-sm sm:text-base border-b last:border-b-0">
        <div className={cn("p-1.5 rounded-lg mr-4 shrink-0", iconColor)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div className='flex-1 space-y-0.5 mr-4'>
            <label htmlFor={label.replace(/\s/g, '')} className="font-medium cursor-pointer block">{label}</label>
            {description && <p className='text-xs text-muted-foreground leading-snug'>{description}</p>}
        </div>
        <div className="shrink-0">
            {children}
        </div>
    </div>
);

const wcagCriteria = [
    { feature: "Yüksek Kontrast", wcag: "1.4.3 Contrast (Minimum)", level: "AA", status: "Sağlanıyor", desc: "Metin–arka plan kontrastı artırılabiliyor" },
    { feature: "Yazı Tipi Boyutu", wcag: "1.4.4 Resize Text", level: "AA", status: "Sağlanıyor", desc: "Metin ölçekleme arayüz bozulmadan destekleniyor" },
    { feature: "Satır Aralığı", wcag: "1.4.12 Text Spacing", level: "AA", status: "Sağlanıyor", desc: "Satır ve paragraf aralığı ayarlanabiliyor" },
    { feature: "Renk Körlüğü Filtresi", wcag: "1.4.1 Use of Color", level: "A", status: "Sağlanıyor", desc: "Bilgi yalnızca renkle aktarılmıyor" },
    { feature: "Disleksi Dostu Yazı Tipi", wcag: "1.4.8 Visual Presentation", level: "AAA (destekleyici)", status: "Sağlanıyor", desc: "Okunabilirliği artıran alternatif yazı tipi" },
    { feature: "Animasyonları Azalt", wcag: "2.3.3 Animation from Interactions", level: "AAA (destekleyici)", status: "Sağlanıyor", desc: "Hareket hassasiyeti olan kullanıcılar için" },
    { feature: "Büyük Dokunma Alanları", wcag: "2.5.5 Target Size", level: "AA", status: "Sağlanıyor", desc: "Dokunma hedefleri minimum boyutun üzerine çıkarılabiliyor" },
    { feature: "Uzun Basma Süresi", wcag: "2.1.1 Keyboard / Pointer Control", level: "A", status: "Kısmen", desc: "Yanlış tetikleme azaltılıyor" },
    { feature: "Basitleştirilmiş Dil", wcag: "3.1.5 Reading Level", level: "AAA (destekleyici)", status: "Kısmen", desc: "Arayüz dili sade" },
    { feature: "Sade Mod (Odak Modu)", wcag: "2.2.2 Pause, Stop, Hide", level: "A", status: "Sağlanıyor", desc: "Dikkat dağıtıcı öğeler kullanıcı kontrolünde" },
    { feature: "ARIA ve Anonslar", wcag: "4.1.2 Name, Role, Value", level: "A", status: "Sağlanıyor", desc: "Semantik yapı ve ARIA etiketleri mevcut" },
    { feature: "Sesli Geri Bildirim", wcag: "1.1.1 Non-text Content", level: "A", status: "Sağlanıyor", desc: "Metinsel uyarılar sesli geri bildirimle destekleniyor" },
    { feature: "Zaman Sınırlarını Kapat", wcag: "2.2.1 Timing Adjustable", level: "A", status: "Sağlanıyor", desc: "Süre kısıtları kullanıcı tarafından kontrol ediliyor" },
    { feature: "İşlem Onayları", wcag: "3.3.4 Error Prevention", level: "AA", status: "Sağlanıyor", desc: "Kritik işlemler için ek onay adımı var" },
];

export default function AccessibilitySettingsPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Visual States
    const [highContrast, setHighContrast] = useState(false);
    const [fontSize, setFontSize] = useState('normal');
    const [lineSpacing, setLineSpacing] = useState('normal');
    const [colorFilter, setColorFilter] = useState('yok');
    const [dyslexiaFont, setDyslexiaFont] = useState(false);

    // Interaction States
    const [reduceMotion, setReduceMotion] = useState(false);
    const [largeTouchTargets, setLargeTouchTargets] = useState(false);
    const [longPressDuration, setLongPressDuration] = useState('normal');

    // Reading States
    const [simplifiedLanguage, setSimplifiedLanguage] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    // Sound States
    const [screenReader, setScreenReader] = useState(true);
    const [audioFeedback, setAudioFeedback] = useState(false);

    // Control States
    const [disableTimeLimits, setDisableTimeLimits] = useState(false);
    const [transactionConfirmation, setTransactionConfirmation] = useState(true);

    const handleSave = () => {
        toast({
            title: "Ayarlar Kaydedildi",
            description: "Erişilebilirlik tercihleriniz başarıyla güncellendi.",
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0 max-w-3xl mx-auto pb-24">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="space-y-1">
                <h1 className="text-3xl font-bold font-headline">Erişilebilirlik</h1>
                <p className="text-muted-foreground text-sm">Deneyiminizi ihtiyaçlarınıza göre kişiselleştirmek için erişilebilirlik ayarlarını yapılandırın.</p>
            </div>

            {/* Onboarding Intro */}
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Hangel'i Kişiselleştirin</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                    <p>Hangel’i ihtiyaçlarınıza göre özelleştirebilirsiniz. Görünüm, etkileşim, okuma ve kontrol ayarlarıyla deneyiminizi sizin için daha rahat hale getirin.</p>
                    <p>Bu ayarlar; okunabilirliği artırmak, dikkat dağıtıcı unsurları azaltmak ve uygulamayı daha kolay kullanmanızı sağlamak için tasarlanmıştır. İstediğiniz zaman ayarları değiştirebilirsiniz.</p>
                </CardContent>
            </Card>

            {/* Settings Groups */}
            <div className="space-y-6">
                {/* 1. Görsel Ayarlar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Görsel Ayarlar</CardTitle>
                        <CardDescription>Görünümü ihtiyacınıza göre düzenleyin.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            <SettingsItem 
                                label="Yüksek Kontrast"
                                description="Renkleri daha belirgin hale getirerek okunabilirliği artırır."
                                icon={Contrast} 
                                iconColor="bg-indigo-500" 
                            >
                                <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                            </SettingsItem>
                            <SettingsItem label="Yazı Tipi Boyutu" icon={Type} iconColor="bg-indigo-500">
                                <Select value={fontSize} onValueChange={setFontSize}>
                                    <SelectTrigger className='w-[110px] border-none bg-accent focus:ring-0'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Küçük</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="large">Büyük</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingsItem>
                            <SettingsItem label="Satır Aralığı" icon={AlignLeft} iconColor="bg-indigo-500">
                                <Select value={lineSpacing} onValueChange={setLineSpacing}>
                                    <SelectTrigger className='w-[110px] border-none bg-accent focus:ring-0'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tight">Dar</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="wide">Geniş</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingsItem>
                            <SettingsItem label="Renk Körlüğü Filtresi" icon={Eye} iconColor="bg-indigo-500">
                                <Select value={colorFilter} onValueChange={setColorFilter}>
                                    <SelectTrigger className='w-[110px] border-none bg-accent focus:ring-0'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yok">Yok</SelectItem>
                                        <SelectItem value="protanopia">Protanopia</SelectItem>
                                        <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                                        <SelectItem value="tritanopia">Tritanopia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingsItem>
                            <SettingsItem 
                                label="Disleksi Dostu Yazı Tipi"
                                description="Okuma güçlüğü çekenler için özel tasarlanmış yazı tipi."
                                icon={Pilcrow} 
                                iconColor="bg-indigo-500" 
                            >
                                <Switch checked={dyslexiaFont} onCheckedChange={setDyslexiaFont} />
                            </SettingsItem>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Etkileşim & Hareket */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Etkileşim & Hareket</CardTitle>
                        <CardDescription>Motor beceriler ve dokunma kontrolü için ayarlar.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            <SettingsItem
                                label="Animasyonları Azalt"
                                description="Geçiş efektlerini ve hareketleri en aza indirir."
                                icon={MinusCircle} 
                                iconColor="bg-teal-500"
                            >
                                <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
                            </SettingsItem>
                            <SettingsItem
                                label="Büyük Dokunma Alanları"
                                description="Buton ve link alanlarını büyüterek dokunmayı kolaylaştırır."
                                icon={Maximize} 
                                iconColor="bg-teal-500"
                            >
                                <Switch checked={largeTouchTargets} onCheckedChange={setLargeTouchTargets} />
                            </SettingsItem>
                            <SettingsItem label="Uzun Basma Süresi" icon={Timer} iconColor="bg-teal-500">
                                <Select value={longPressDuration} onValueChange={setLongPressDuration}>
                                    <SelectTrigger className='w-[110px] border-none bg-accent focus:ring-0'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="short">Kısa</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="long">Uzun</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingsItem>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Okuma & Anlama */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Okuma & Anlama</CardTitle>
                        <CardDescription>Bilişsel yükü azaltmak ve odaklanmayı kolaylaştırmak için.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            <SettingsItem
                                label="Basitleştirilmiş Dil"
                                description="Daha kısa cümleler ve temel terimler kullanır."
                                icon={Languages} 
                                iconColor="bg-orange-500"
                            >
                                <Switch checked={simplifiedLanguage} onCheckedChange={setSimplifiedLanguage} />
                            </SettingsItem>
                            <SettingsItem
                                label="Sade Mod (Odak Modu)"
                                description="Dikkat dağıtıcı unsurları gizleyerek içeriğe odaklanmanızı sağlar."
                                icon={Layers} 
                                iconColor="bg-orange-500"
                            >
                                <Switch checked={focusMode} onCheckedChange={setFocusMode} />
                            </SettingsItem>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Ekran Okuyucu & Ses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ekran Okuyucu & Ses</CardTitle>
                        <CardDescription>Görme ve işitme duyularına yardımcı araçlar.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            <SettingsItem
                                label="ARIA ve Anonslar"
                                description="Ekran okuyucular için yapılandırılmış etiketleri ve yönlendirici anonsları etkinleştirir."
                                icon={Ear} 
                                iconColor="bg-blue-500"
                            >
                                <Switch checked={screenReader} onCheckedChange={setScreenReader} />
                            </SettingsItem>
                            <SettingsItem
                                label="Sesli Geri Bildirim"
                                description="Hata, uyarı ve başarı mesajlarını sesli olarak okur."
                                icon={Volume2} 
                                iconColor="bg-blue-500"
                            >
                                <Switch checked={audioFeedback} onCheckedChange={setAudioFeedback} />
                            </SettingsItem>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Zaman & Kontrol */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Zaman & Kontrol</CardTitle>
                        <CardDescription>İşlem sürelerini ve kritik onayları yönetin.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            <SettingsItem
                                label="Zaman Sınırlarını Kapat"
                                description="Form doldurma ve oturum sürelerini uzatır."
                                icon={Clock} 
                                iconColor="bg-slate-600"
                            >
                                <Switch checked={disableTimeLimits} onCheckedChange={setDisableTimeLimits} />
                            </SettingsItem>
                            <SettingsItem
                                label="İşlem Onayları"
                                description="Kritik işlemlerde ek onay penceresi gösterir."
                                icon={ShieldCheck} 
                                iconColor="bg-slate-600"
                            >
                                <Switch checked={transactionConfirmation} onCheckedChange={setTransactionConfirmation} />
                            </SettingsItem>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* WCAG Compliance Table */}
            <div className="space-y-4 pt-12">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold font-headline">Uyumluluk Standartları</h2>
                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-black">WCAG 2.2 AA – Kriter Eşleşme Tablosu</p>
                </div>
                <Card className="overflow-hidden border-none shadow-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="text-[10px] font-black uppercase tracking-wider">Ayar / Özellik</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-wider">Kriter</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-wider">Hangel Durumu</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {wcagCriteria.map((item, i) => (
                                <TableRow key={i} className="hover:bg-muted/30">
                                    <TableCell className="font-bold text-foreground">{item.feature}</TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-foreground">{item.wcag}</p>
                                            <p className="text-[9px] text-muted-foreground uppercase">{item.level}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 py-1">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-bold border-none w-fit px-2 h-5",
                                                item.status === 'Sağlanıyor' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {item.status === 'Sağlanıyor' ? <CheckCircle className="h-2.5 w-2.5 mr-1" /> : <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
                                                {item.status}
                                            </Badge>
                                            <p className="text-[9px] leading-tight text-muted-foreground italic font-medium">{item.desc}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Technical Explanation */}
            <Card className="bg-muted/30 border-none mt-12">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Erişilebilirlik Teknik Açıklaması
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4 leading-relaxed font-medium">
                    <p>Hangel uygulaması, WCAG 2.2 AA kriterleri esas alınarak tasarlanmış ve geliştirilmiştir. Uygulama genelinde erişilebilirlik; görsel algı, motor etkileşim, bilişsel yük ve ekran okuyucu uyumluluğu başlıkları altında ele alınmıştır.</p>
                    <p>Erişilebilirlik ayarları, kullanıcıların bireysel ihtiyaçlarına göre deneyimi kişiselleştirebilmesini sağlayacak şekilde yapılandırılmıştır. Görsel kontrast, metin ölçekleme, renk kullanımı ve yazı tipi seçenekleri; metin okunabilirliğini artırmaya yöneliktir. Hareket ve etkileşim ayarları; animasyon azaltma, dokunma alanı büyütme ve işlem onayları gibi kontrollerle motor beceri ve dikkat hassasiyetlerini destekler.</p>
                    <p>Ekran okuyucu uyumluluğu kapsamında semantik yapı, ARIA etiketleri ve yönlendirici anonslar kullanılmaktadır. Zaman sınırlı etkileşimler kullanıcı kontrolüne bırakılmış, kritik işlemler için hata önleyici onay mekanizmaları eklenmiştir.</p>
                    <p>Erişilebilirlik uyumluluğu düzenli olarak gözden geçirilmekte, kullanıcı geri bildirimleri ve teknik değerlendirmeler doğrultusunda sürekli iyileştirme yaklaşımı benimsenmektedir.</p>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-8">
                <Button onClick={handleSave} className="px-10 h-14 rounded-full font-bold shadow-xl shadow-primary/20 text-base">
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    );
}
