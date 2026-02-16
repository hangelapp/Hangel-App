
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    Eye, 
    Ear, 
    MousePointer2, 
    Brain, 
    Move, 
    ShieldCheck, 
    Globe, 
    Scale, 
    UserCheck,
    CheckCircle2,
    Clock,
    Zap,
    Info,
    Type,
    Layers,
    Target,
    BookText,
    KeyRound,
    Volume2,
    FileText,
    History,
    Pointer,
    RotateCcw,
    MessageSquareWarning,
    Languages,
    Contrast,
    MoreHorizontal,
    AlignLeft,
    Pilcrow,
    Rows,
    Keyboard,
    Command,
    Undo2,
    Files,
    ShieldAlert,
    ListOrdered,
    CheckCircle,
    MousePointerClick,
    Maximize,
    VolumeX,
    ImageOff,
    Rss,
    FileVideo
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { user } from '@/lib/data';

const FeatureCard = ({ icon: Icon, title, description, badge }: { icon: any, title: string, description: string, badge?: string }) => (
    <Card className="bg-white rounded-[2rem] p-6 md:p-8 border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500 group h-full">
        <div className="flex flex-col h-full">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            </div>
            <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight">{title}</h3>
                    {badge && <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">{badge}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    </Card>
);

const TechnicalItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex gap-6 p-6 md:p-8 bg-[#f5f5f7] rounded-[2rem] border border-black/5 items-start">
        <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
            <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
            <h4 className="font-bold text-lg text-[#1d1d1f] tracking-tight">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
        </div>
    </div>
);

const complianceRates = [
    { standard: "European Accessibility Act (EAA)", region: "Avrupa Birliği", scope: "Dijital ürün ve hizmetlerde erişilebilirlik yükümlülükleri", rate: "75–80", desc: "Ürün mimarisi ve kullanıcı deneyimi EAA’ya uyumlu olacak şekilde tasarlanmıştır. Resmî uygunluk beyanı için sürekli izleme gereklidir." },
    { standard: "EN 301 549", region: "Avrupa", scope: "Kamuya açık dijital ürünler için teknik erişilebilirlik", rate: "80–85", desc: "WCAG tabanlı kriterlerin büyük bölümü sağlanmakta, bazı kamuya özgü dokümantasyon gereklilikleri kapsam dışındadır." },
    { standard: "ISO 9241-171", region: "Uluslararası", scope: "İnsan–bilgisayar etkileşimi ve kullanılabilirlik", rate: "70–75", desc: "Kullanılabilirlik ilkeleri uygulanmaktadır; kullanıcı testlerinin sürekliliğiyle artırılabilir." },
    { standard: "WAI-ARIA Authoring Practices", region: "Uluslararası", scope: "Ekran okuyucu ve semantik yapı uygulamaları", rate: "85–90", desc: "ARIA etiketleri ve semantik yapı büyük ölçüde uygulanmaktadır." },
    { standard: "Türkiye Erişilebilirlik Mevzuatı", region: "Türkiye", scope: "Ulusal erişilebilirlik çerçevesi", rate: "65–70", desc: "Doğrudan sertifikasyon yoktur, ancak mevzuat ilkeleri referans alınmıştır." },
    { standard: "Kamu Dijital Hizmet Rehberleri", region: "Türkiye", scope: "Kamu dijital servis beklentileri", rate: "60–65", desc: "Kamuya özel format ve raporlama gereksinimleri kapsam dışıdır." },
];

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


export default function AccessibilityPublicPage() {
    const router = useRouter();
    const { toast } = useToast();
    const heroImage = PlaceHolderImages.find(img => img.id === 'accessibility-hero');

    const [isSaving, setIsSaving] = useState(false);

    // --- State Definition ---
    // Visual
    const [highContrast, setHighContrast] = useState(false);
    const [fontSize, setFontSize] = useState('normal');
    const [lineHeight, setLineHeight] = useState('normal');
    const [wordSpacing, setWordSpacing] = useState('normal');
    const [paragraphSpacing, setParagraphSpacing] = useState('normal');
    const [colorFilter, setColorFilter] = useState('yok');
    const [dyslexiaFont, setDyslexiaFont] = useState(false);
    const [textAlignment, setTextAlignment] = useState('left');
    const [separateText, setSeparateText] = useState(false);
    const [showContrastInfo, setShowContrastInfo] = useState(true);
    const [reflowMode, setReflowMode] = useState(true);

    // Interaction
    const [reduceMotion, setReduceMotion] = useState(false);
    const [largeTouchTargets, setLargeTouchTargets] = useState(false);
    const [longPressDuration, setLongPressDuration] = useState('normal');
    const [fullKeyboard, setFullKeyboard] = useState(false);
    const [focusStrength, setFocusFrame] = useState('thin');
    const [dragDropAlt, setDragDropAlt] = useState(false);
    const [limitShortcuts, setLimitShortcuts] = useState(false);

    // Cognitive
    const [readingLevel, setReadingLevel] = useState('B2');
    const [stepByStep, setStepByStep] = useState(false);
    const [termConsistency, setTerminologyConsistency] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [termDefinitions, setTermDefinitions] = useState(true);
    const [errorPrevention, setErrorPrevention] = useState(true);

    // Audio/Media
    const [screenReader, setScreenReader] = useState(true);
    const [dynamicAnnouncements, setDynamicAnnouncements] = useState(true);
    const [mediaDescriptions, setMediaDescriptions] = useState(false);
    const [logicalOrder, setLogicalReadingOrder] = useState(true);
    const [audioFeedback, setAudioFeedback] = useState(false);
    const [visualAlerts, setVisualAlerts] = useState(false);
    const [muteAutoAudio, setMuteAutoAudio] = useState(true);
    const [ignoreDecorative, setIgnoreDecorative] = useState(true);

    // Control
    const [timeoutWarnings, setTimeoutWarnings] = useState(true);
    const [autoSave, setAutoSave] = useState(true);
    const [disableTimeLimits, setDisableTimeLimits] = useState(false);
    const [transactionConfirmation, setTransactionConfirmation] = useState(true);
    const [undoSupport, setUndoSupport] = useState(true);
    const [undoTime, setUndoTime] = useState('10s');

    // --- Persistence ---
    useEffect(() => {
        const saved = localStorage.getItem('hangel-a11y-v3');
        if (saved) {
            try {
                const s = JSON.parse(saved);
                // Visual
                if (s.highContrast !== undefined) setHighContrast(s.highContrast);
                if (s.fontSize) setFontSize(s.fontSize);
                if (s.lineHeight) setLineHeight(s.lineHeight);
                if (s.wordSpacing) setWordSpacing(s.wordSpacing);
                if (s.paragraphSpacing) setParagraphSpacing(s.paragraphSpacing);
                if (s.colorFilter) setColorFilter(s.colorFilter);
                if (s.dyslexiaFont !== undefined) setDyslexiaFont(s.dyslexiaFont);
                if (s.textAlignment) setTextAlignment(s.textAlignment);
                if (s.separateText !== undefined) setSeparateText(s.separateText);
                if (s.showContrastInfo !== undefined) setShowContrastInfo(s.showContrastInfo);
                if (s.reflowMode !== undefined) setReflowMode(s.reflowMode);

                // Interaction
                if (s.reduceMotion !== undefined) setReduceMotion(s.reduceMotion);
                if (s.largeTouchTargets !== undefined) setLargeTouchTargets(s.largeTouchTargets);
                if (s.longPressDuration) setLongPressDuration(s.longPressDuration);
                if (s.fullKeyboard !== undefined) setFullKeyboard(s.fullKeyboard);
                if (s.focusStrength) setFocusFrame(s.focusStrength);
                if (s.dragDropAlt !== undefined) setDragDropAlt(s.dragDropAlt);
                if (s.limitShortcuts !== undefined) setLimitShortcuts(s.limitShortcuts);

                // Cognitive
                if (s.readingLevel) setReadingLevel(s.readingLevel);
                if (s.stepByStep !== undefined) setStepByStep(s.stepByStep);
                if (s.termConsistency !== undefined) setTerminologyConsistency(s.termConsistency);
                if (s.focusMode !== undefined) setFocusMode(s.focusMode);
                if (s.termDefinitions !== undefined) setTermDefinitions(s.termDefinitions);
                if (s.errorPrevention !== undefined) setErrorPrevention(s.errorPrevention);

                // Audio/Media
                if (s.screenReader !== undefined) setScreenReader(s.screenReader);
                if (s.dynamicAnnouncements !== undefined) setDynamicAnnouncements(s.dynamicAnnouncements);
                if (s.mediaDescriptions !== undefined) setMediaDescriptions(s.mediaDescriptions);
                if (s.logicalOrder !== undefined) setLogicalReadingOrder(s.logicalOrder);
                if (s.audioFeedback !== undefined) setAudioFeedback(s.audioFeedback);
                if (s.visualAlerts !== undefined) setVisualAlerts(s.visualAlerts);
                if (s.muteAutoAudio !== undefined) setMuteAutoAudio(s.muteAutoAudio);
                if (s.ignoreDecorative !== undefined) setIgnoreDecorative(s.ignoreDecorative);

                // Control
                if (s.timeoutWarnings !== undefined) setTimeoutWarnings(s.timeoutWarnings);
                if (s.autoSave !== undefined) setAutoSave(s.autoSave);
                if (s.disableTimeLimits !== undefined) setDisableTimeLimits(s.disableTimeLimits);
                if (s.transactionConfirmation !== undefined) setTransactionConfirmation(s.transactionConfirmation);
                if (s.undoSupport !== undefined) setUndoSupport(s.undoSupport);
                if (s.undoTime) setUndoTime(s.undoTime);
            } catch (e) {
                console.error("Settings load error:", e);
            }
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        const settings = {
            highContrast, fontSize, lineHeight, wordSpacing, paragraphSpacing, colorFilter, dyslexiaFont, textAlignment, separateText, showContrastInfo, reflowMode,
            reduceMotion, largeTouchTargets, longPressDuration, fullKeyboard, focusStrength, dragDropAlt, limitShortcuts,
            readingLevel, stepByStep, termConsistency, focusMode, termDefinitions, errorPrevention,
            screenReader, dynamicAnnouncements, mediaDescriptions, logicalOrder, audioFeedback, visualAlerts, muteAutoAudio, ignoreDecorative,
            timeoutWarnings, autoSave, disableTimeLimits, transactionConfirmation, undoSupport, undoTime
        };
        
        localStorage.setItem('hangel-a11y-v3', JSON.stringify(settings));
        
        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: "Ayarlar Kaydedildi",
                description: "Erişilebilirlik tercihleriniz tüm platformda aktif hale getirildi.",
            });
        }, 800);
    };


    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Navigation */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[10px] font-bold tracking-tight uppercase hidden sm:inline">Erişilebilirlik Beyanı</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/settings/accessibility">Ayarları Yapılandır</Link>
                    </Button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-6 text-center bg-[#f5f5f7] overflow-hidden border-b border-black/5">
                    <div className="container mx-auto max-w-4xl space-y-6 relative z-10 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                            Herkes İçin <br /> Erişilebilir.
                        </h1>
                        <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-tight">
                            İyilikte engel tanımaz. hangel, teknolojinin birleştirici gücünü herkes için erişilebilir kılma vizyonuyla, WCAG 2.2 AAA standartlarını hedefleyerek geliştirilmiştir.
                        </p>
                    </div>
                    <div className="relative w-full max-w-6xl mx-auto aspect-[16/9] md:aspect-[21/9] mt-12 md:mt-16 rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden shadow-2xl">
                        <Image 
                            src={heroImage?.imageUrl || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop"} 
                            alt={heroImage?.description || "Modern Library"} 
                            fill 
                            className="object-cover"
                            data-ai-hint={heroImage?.imageHint || "modern library"}
                        />
                    </div>
                </section>
                
                 {/* --- Settings Groups --- */}
                <section className="p-4 space-y-10 animate-in fade-in-0 max-w-3xl mx-auto pb-32">
                    <div className="space-y-8 mt-16">
                        {/* Visual & Reading */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-indigo-500" />
                                    Görsel & Okuma
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">Okunabilirlik ve görsel algı tercihleriniz. (WCAG 1.3 / 1.4)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <SettingsItem label="Yüksek Kontrast" icon={Contrast} iconColor="bg-indigo-500" description="Metin ve arka plan belirginliğini artırır.">
                                        <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                                    </SettingsItem>
                                    <SettingsItem label="Metni Ekrana Sığdır (Reflow)" icon={Rows} iconColor="bg-indigo-500" description="Zoom yapıldığında yatay kaydırmayı engeller. (WCAG 1.4.10)">
                                        <Switch checked={reflowMode} onCheckedChange={setReflowMode} />
                                    </SettingsItem>
                                    <SettingsItem label="Kontrast Bilgisi Göster" icon={ShieldCheck} iconColor="bg-indigo-500" description="Tema için AA/AAA uyumluluk göstergesi sunar.">
                                        <Switch checked={showContrastInfo} onCheckedChange={setShowContrastInfo} />
                                    </SettingsItem>
                                    <SettingsItem label="Yazı Tipi Boyutu" icon={Type} iconColor="bg-indigo-500">
                                        <Select value={fontSize} onValueChange={setFontSize}>
                                            <SelectTrigger className='w-[130px] border-none bg-accent focus:ring-0'><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="small">Küçük</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="large">Büyük</SelectItem>
                                                <SelectItem value="huge">Çok Büyük</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsItem>
                                    <SettingsItem label="Satır Aralığı" icon={AlignLeft} iconColor="bg-indigo-500">
                                        <Select value={lineHeight} onValueChange={setLineHeight}>
                                            <SelectTrigger className='w-[130px] border-none bg-accent focus:ring-0'><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="1.5">1.5x Genişlik</SelectItem>
                                                <SelectItem value="2.0">2.0x Genişlik</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsItem>
                                    <SettingsItem label="Kelime Aralığı" icon={MoreHorizontal} iconColor="bg-indigo-500">
                                        <Select value={wordSpacing} onValueChange={setWordSpacing}>
                                            <SelectTrigger className='w-[130px] border-none bg-accent focus:ring-0'><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="wide">+%10 Geniş</SelectItem>
                                                <SelectItem value="extra">+%20 Geniş</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsItem>
                                    <SettingsItem label="Paragraf Aralığı" icon={Pilcrow} iconColor="bg-indigo-500">
                                        <Select value={paragraphSpacing} onValueChange={setParagraphSpacing}>
                                            <SelectTrigger className='w-[130px] border-none bg-accent focus:ring-0'><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="wide">Geniş</SelectItem>
                                                <SelectItem value="extra">Çok Geniş</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsItem>
                                    <SettingsItem label="Metinleri Görselden Ayır" icon={Files} iconColor="bg-indigo-500" description="Bannerlardaki metinleri HTML olarak render eder.">
                                        <Switch checked={separateText} onCheckedChange={setSeparateText} />
                                    </SettingsItem>
                                    <SettingsItem label="Disleksi Dostu Yazı Tipi" icon={Type} iconColor="bg-indigo-500" description="OpenDyslexic yazı tipini aktif eder.">
                                        <Switch checked={dyslexiaFont} onCheckedChange={setDyslexiaFont} />
                                    </SettingsItem>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cognitive & Understanding */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-orange-500" />
                                    Bilişsel & Anlama
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">Bilişsel yükü azaltma ve netlik ayarları. (WCAG 3.x / AAA)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <SettingsItem label="Hata Önleme Modu" icon={ShieldAlert} iconColor="bg-orange-500" description="Kritik işlemler öncesi hataları işlem öncesi engeller. (WCAG 3.3.4)">
                                        <Switch checked={errorPrevention} onCheckedChange={setErrorPrevention} />
                                    </SettingsItem>
                                    <SettingsItem label="Okuma Seviyesi" icon={Languages} iconColor="bg-orange-500" description="Dili sadeleştirir ve cümle yapısını düzenler.">
                                        <Select value={readingLevel} onValueChange={setReadingLevel}>
                                            <SelectTrigger className='w-[130px] border-none bg-accent focus:ring-0'><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A2">Kolay (A2)</SelectItem>
                                                <SelectItem value="B1">Orta (B1)</SelectItem>
                                                <SelectItem value="B2">Standart (B2)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsItem>
                                    <SettingsItem label="Adım Adım Rehber Modu" icon={ListOrdered} iconColor="bg-orange-500" description="Karmaşık formları tek ekran-tek görev yapısına böler.">
                                        <Switch checked={stepByStep} onCheckedChange={setStepByStep} />
                                    </SettingsItem>
                                    <SettingsItem label="Terim Tutarlılığı Modu" icon={CheckCircle} iconColor="bg-orange-500" description="Eş anlamlıları kapatır, tekil terminoloji kullanır.">
                                        <Switch checked={termConsistency} onCheckedChange={setTerminologyConsistency} />
                                    </SettingsItem>
                                    <SettingsItem label="Sade Mod (Odak Modu)" icon={Layers} iconColor="bg-orange-500" description="Dikkat dağıtıcıları gizler.">
                                        <Switch checked={focusMode} onCheckedChange={setFocusMode} />
                                    </SettingsItem>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interaction & Motor */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MousePointerClick className="h-5 w-5 text-teal-500" />
                                    Etkileşim & Motor
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">Motor beceri ve fiziksel erişim kolaylıkları. (WCAG 2.5 / 2.2)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <SettingsItem label="Klavye Kısayollarını Sınırla" icon={Command} iconColor="bg-teal-500" description="Tek tuş kısayollarını kapatarak hataları önler. (WCAG 2.1.4)">
                                        <Switch checked={limitShortcuts} onCheckedChange={setLimitShortcuts} />
                                    </SettingsItem>
                                    <SettingsItem label="Klavye ile Tam Kullanım" icon={Keyboard} iconColor="bg-teal-500" description="Tüm öğeleri klavye (Tab/Enter) ile erişilebilir yapar.">
                                        <Switch checked={fullKeyboard} onCheckedChange={setFullKeyboard} />
                                    </SettingsItem>
                                    <SettingsItem label="Odak Çerçevesini Güçlendir" icon={Maximize} iconColor="bg-teal-500">
                                        <Select value={focusStrength} onValueChange={setFocusFrame}>
                                            <SelectTrigger className='w-[130px] border-none bg-accent focus:ring-0'><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="thin">İnce</SelectItem>
                                                <SelectItem value="thick">Kalın</SelectItem>
                                                <SelectItem value="high">Yüksek Kontrastlı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsItem>
                                    <SettingsItem label="Sürükle-Bırak Alternatifi" icon={MousePointerClick} iconColor="bg-teal-500" description="Sürükleme yerine butonla taşıma desteği sağlar.">
                                        <Switch checked={dragDropAlt} onCheckedChange={setDragDropAlt} />
                                    </SettingsItem>
                                    <SettingsItem label="Büyük Dokunma Alanları" icon={Maximize} iconColor="bg-teal-500" description="Buton ve link tıklama alanlarını büyütür.">
                                        <Switch checked={largeTouchTargets} onCheckedChange={setLargeTouchTargets} />
                                    </SettingsItem>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Screen Reader & Media */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Volume2 className="h-5 w-5 text-blue-500" />
                                    Ekran Okuyucu & Medya
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">Sesli geri bildirim ve medya erişilebilirliği. (WCAG 1.1 / 1.2)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <SettingsItem label="Otomatik Sesleri Kapat" icon={VolumeX} iconColor="bg-blue-500" description="Otomatik başlayan sesleri ve müzikleri engeller. (WCAG 1.4.2)">
                                        <Switch checked={muteAutoAudio} onCheckedChange={setMuteAutoAudio} />
                                    </SettingsItem>
                                    <SettingsItem label="Dekoratif Görselleri Yoksay" icon={ImageOff} iconColor="bg-blue-500" description="Sadece süs amaçlı görselleri ekran okuyucuya okumaz.">
                                        <Switch checked={ignoreDecorative} onCheckedChange={setIgnoreDecorative} />
                                    </SettingsItem>
                                    <SettingsItem label="Dinamik İçerik Anonsları" icon={Rss} iconColor="bg-blue-500" description="Hata ve başarı bildirimlerini otomatik seslendirir.">
                                        <Switch checked={dynamicAnnouncements} onCheckedChange={setDynamicAnnouncements} />
                                    </SettingsItem>
                                    <SettingsItem label="Medya Açıklamaları" icon={FileVideo} iconColor="bg-blue-500" description="Video transkriptleri ve animasyon betimlemelerini sunar.">
                                        <Switch checked={mediaDescriptions} onCheckedChange={setMediaDescriptions} />
                                    </SettingsItem>
                                    <SettingsItem label="Mantıksal Okuma Sırası" icon={ListOrdered} iconColor="bg-blue-500" description="Görsel düzen ile ekran okuyucu sırasını eşitler.">
                                        <Switch checked={logicalOrder} onCheckedChange={setLogicalReadingOrder} />
                                    </SettingsItem>
                                    <SettingsItem label="ARIA ve Anonslar" icon={Ear} iconColor="bg-blue-500">
                                        <Switch checked={screenReader} onCheckedChange={setScreenReader} />
                                    </SettingsItem>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Time & Error Management */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-slate-600" />
                                    Zaman & Kontrol Yönetimi
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">Zaman kısıtları ve veri güvenliği ayarları. (WCAG 2.2 AAA)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <SettingsItem label="Geri Alma Süresi" icon={Undo2} iconColor="bg-slate-600" description="Yapılan işlemi geri alabilmek için tanınan süre. (WCAG 2.2.3)">
                                        <Select value={undoTime} onValueChange={setUndoTime}>
                                            <SelectTrigger className='w-[130px] border-none bg-accent focus:ring-0'><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5s">5 Saniye</SelectItem>
                                                <SelectItem value="10s">10 Saniye</SelectItem>
                                                <SelectItem value="30s">30 Saniye</SelectItem>
                                                <SelectItem value="unlimited">Sınırsız</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsItem>
                                    <SettingsItem label="Zaman Aşımı Uyarıları" icon={MessageSquareWarning} iconColor="bg-slate-600" description="Oturum dolmadan önce 'Devam Et' seçeneği sunar.">
                                        <Switch checked={timeoutWarnings} onCheckedChange={setTimeoutWarnings} />
                                    </SettingsItem>
                                    <SettingsItem label="Otomatik Taslak Kaydet" icon={History} iconColor="bg-slate-600" description="Form verilerini belirli aralıklarla yedekler.">
                                        <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                                    </SettingsItem>
                                    <SettingsItem label="Zaman Sınırlarını Kapat" icon={Clock} iconColor="bg-slate-600" description="Oturum sürelerini sınırsız hale getirir.">
                                        <Switch checked={disableTimeLimits} onCheckedChange={setDisableTimeLimits} />
                                    </SettingsItem>
                                    <SettingsItem label="İşlem Onayları" icon={ShieldCheck} iconColor="bg-slate-600" description="Kritik işlemlerde ek onay penceresi gösterir.">
                                        <Switch checked={transactionConfirmation} onCheckedChange={setTransactionConfirmation} />
                                    </SettingsItem>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
                

                {/* --- Footer Context Section --- */}
                <section className="p-4">
                    <div className="space-y-8 pt-10 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="p-3 bg-indigo-50 rounded-2xl w-fit"><Scale className="h-6 w-6 text-indigo-600" /></div>
                                <h4 className="font-bold text-sm">Yasal Uyumluluk</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">Tercihleriniz, EN 301 549 Avrupa standardı ve yerel mevzuatlarla tam uyumlu olacak şekilde işlenir.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="p-3 bg-orange-50 rounded-2xl w-fit"><Globe className="h-6 w-6 text-orange-600" /></div>
                                <h4 className="font-bold text-sm">Evrensel Tasarım</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">Erişilebilirlik bir 'eklenti' değil, hangel'in her hücresine entegre edilmiş bir tasarım felsefesidir.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="p-3 bg-teal-50 rounded-2xl w-fit"><Target className="h-6 w-6 text-teal-600" /></div>
                                <h4 className="font-bold text-sm">Sürekli İyileştirme</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">Deneyiminizi geliştirmek için WCAG güncellemelerini ve geri bildirimlerinizi anlık olarak takip ediyoruz.</p>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-primary/5 rounded-[2rem] text-center border border-primary/10">
                            <p className="text-sm font-bold text-primary">Daha kapsayıcı bir dünya için birlikte çalışıyoruz.</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-16 md:py-24 px-6 text-center bg-[#f5f5f7]">
                    <div className="container mx-auto max-w-3xl space-y-8 md:space-y-10">
                        <ShieldCheck className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-4 md:mb-6" />
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Sürekli İyileştirme Taahhüdü.</h2>
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                            hangel olarak erişilebilirliği bitmiş bir süreç değil, sürekli bir gelişim yolculuğu olarak görüyoruz. Teknik ve içerik ekiplerimiz, en yüksek erişilebilirlik farkındalığıyla platformu her gün daha kapsayıcı hale getirmek için çalışmaktadır.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button asChild size="lg" className="rounded-full px-10 md:px-12 h-12 md:h-14 font-bold shadow-xl shadow-primary/20 text-base md:text-lg w-full sm:w-auto">
                                <Link href="/feedback">Geri Bildirim Ver</Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="rounded-full px-10 md:px-12 h-12 md:h-14 font-bold border border-black/10 hover:bg-white text-base md:text-lg w-full sm:w-auto">
                                <Link href="/support">Destek Al</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel="Erişilebilirlik" />
        </div>
    );
}

