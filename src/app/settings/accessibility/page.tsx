
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
    AlignLeft
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
                <p className="text-muted-foreground text-sm">Deneyiminizi en iyi hale getirmek için platform özelliklerini kişiselleştirin.</p>
            </div>

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
                            description="Ekran okuyucular için yapılandırılmış etiketleri etkinleştirir."
                            icon={Ear} 
                            iconColor="bg-blue-500"
                        >
                            <Switch checked={screenReader} onCheckedChange={setScreenReader} />
                        </SettingsItem>
                        <SettingsItem
                            label="Sesli Geri Bildirim"
                            description="Hata ve başarı mesajlarını sesli olarak okur."
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

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} className="px-8 h-12 rounded-full font-bold shadow-lg shadow-primary/20">
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    );
}
