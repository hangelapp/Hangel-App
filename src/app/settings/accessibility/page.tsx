'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
    ArrowLeft, 
    Contrast, 
    Type, 
    Eye, 
    Ear, 
    Pilcrow, 
    Maximize, 
    Languages, 
    Layers, 
    Volume2, 
    Clock, 
    ShieldCheck,
    AlignLeft,
    Sparkles,
    CheckCircle,
    Undo2,
    Keyboard,
    MousePointerClick,
    History,
    MessageSquareWarning,
    Rss,
    FileVideo,
    ListOrdered,
    Files,
    Loader2,
    MoreHorizontal,
    Scale,
    Globe,
    Target,
    ShieldAlert,
    VolumeX,
    ImageOff,
    Command,
    Rows
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

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
    const { user: authUser } = useUser();
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
        // Apply settings immediately to current page
        window.dispatchEvent(new StorageEvent('storage', { key: 'hangel-a11y-v3', newValue: JSON.stringify(settings) }));

        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: "Ayarlar Kaydedildi",
                description: "Erişilebilirlik tercihleriniz tüm platformda aktif hale getirildi.",
            });
        }, 800);
    };

    return (
        <div className="p-4 space-y-10 animate-in fade-in-0 max-w-3xl mx-auto pb-32">
            {/* --- Header Section --- */}
            <div className="space-y-6">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Kapsayıcı Deneyim Modülü</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter font-headline leading-[0.95]">Herkes İçin Erişilebilir.</h1>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                        hangel olarak teknolojinin sadece bir grup için değil, herkes için eşit derecede kullanılabilir olması gerektiğine inanıyoruz. 
                        Aşağıdaki ayarlar, WCAG 2.2 AAA ve EN 301 549 standartlarını temel alarak, nöroçeşitlilikten motor engellere kadar her türlü ihtiyaca çözüm sunmak için tasarlanmıştır.
                    </p>
                </div>
            </div>

            {/* --- Settings Groups --- */}
            <div className="space-y-8">
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
                            Zaman & Hata Yönetimi
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

            {/* --- Footer Context Section --- */}
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

            {/* --- Final Action Bar --- */}
            <div className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none">
                <Card className="bg-background/90 backdrop-blur-xl border-primary/20 shadow-2xl max-w-lg w-full pointer-events-auto">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="text-left hidden sm:block">
                            <p className="font-bold text-sm">Tercihlerinizi Kaydedin</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">Aktif Profil: {authUser?.displayName?.split(' ')[0] || 'Kullanıcı'}</p>
                        </div>
                        <Button 
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                            disabled={isSaving}
                            onClick={handleSave}
                        >
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                            Ayarları Uygula ve Kaydet
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
