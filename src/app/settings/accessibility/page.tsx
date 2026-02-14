
'use client';

import { useState, useEffect } from 'react';
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
    Undo2,
    BookText,
    BellOff,
    Keyboard,
    MousePointerClick,
    History,
    MessageSquareWarning,
    Rss,
    FileVideo,
    ListOrdered,
    Files,
    Loader2
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
    { feature: "Yüksek Kontrast", wcag: "1.4.3 Contrast (Min)", level: "AA", status: "Sağlanıyor", desc: "Metin–arka plan kontrastı kullanıcı tarafından artırılabiliyor" },
    { feature: "Yazı Tipi Boyutu", wcag: "1.4.4 Resize Text", level: "AA", status: "Sağlanıyor", desc: "Metin ölçekleme arayüz bozulmadan destekleniyor" },
    { feature: "Satır Aralığı", wcag: "1.4.12 Text Spacing", level: "AA", status: "Sağlanıyor", desc: "Satır ve paragraf aralığı ayarlanabiliyor" },
    { feature: "Renk Körlüğü Filtresi", wcag: "1.4.1 Use of Color", level: "A", status: "Sağlanıyor", desc: "Bilgi yalnızca renkle aktarılmıyor" },
    { feature: "Disleksi Dostu Yazı Tipi", wcag: "1.4.8 Visual Presentation", level: "AAA (destekleyici)", status: "Sağlanıyor", desc: "Okunabilirliği artıran alternatif yazı tipi" },
    { feature: "Animasyonları Azalt", wcag: "2.3.3 Animation", level: "AAA (destekleyici)", status: "Sağlanıyor", desc: "Hareket hassasiyeti olan kullanıcılar için" },
    { feature: "Büyük Dokunma Alanları", wcag: "2.5.5 Target Size", level: "AA", status: "Sağlanıyor", desc: "Dokunma hedefleri minimum boyutun üzerine çıkarılabiliyor" },
    { feature: "Uzun Basma Süresi", wcag: "2.1.1 Key/Pointer Control", level: "A", status: "Sağlanıyor", desc: "Yanlış tetikleme azaltılıyor" },
    { feature: "Basitleştirilmiş Dil", wcag: "3.1.5 Reading Level", level: "AAA (destekleyici)", status: "Sağlanıyor", desc: "Arayüz dili sade, içerik için rehber gerekli" },
    { feature: "Sade Mod (Odak Modu)", wcag: "2.2.2 Pause, Stop, Hide", level: "A", status: "Sağlanıyor", desc: "Dikkat dağıtıcı öğeler kullanıcı kontrolünde" },
    { feature: "ARIA ve Anonslar", wcag: "4.1.2 Name, Role, Value", level: "A", status: "Sağlanıyor", desc: "Semantik yapı ve ARIA etiketleri mevcut" },
    { feature: "Sesli Geri Bildirim", wcag: "1.1.1 Non-text Content", level: "A", status: "Sağlanıyor", desc: "Metinsel uyarılar sesli geri bildirimle destekleniyor" },
    { feature: "Zaman Sınırlarını Kapat", wcag: "2.2.1 Timing Adjustable", level: "A", status: "Sağlanıyor", desc: "Süre kısıtları kullanıcı tarafından kontrol ediliyor" },
    { feature: "İşlem Onayları", wcag: "3.3.4 Error Prevention", level: "AA", status: "Sağlanıyor", desc: "Kritik işlemler için ek onay adımı var" },
];

export default function AccessibilitySettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Visual States
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

    // Interaction States
    const [reduceMotion, setReduceMotion] = useState(false);
    const [largeTouchTargets, setLargeTouchTargets] = useState(false);
    const [longPressDuration, setLongPressDuration] = useState('normal');
    const [fullKeyboard, setFullKeyboard] = useState(false);
    const [focusStrength, setFocusFrame] = useState('thin');
    const [dragDropAlt, setDragDropAlt] = useState(false);

    // Reading States
    const [readingLevel, setReadingLevel] = useState('B2');
    const [stepByStep, setStepByStep] = useState(false);
    const [termConsistency, setTerminologyConsistency] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [termDefinitions, setTermDefinitions] = useState(true);

    // Sound & Media States
    const [screenReader, setScreenReader] = useState(true);
    const [dynamicAnnouncements, setDynamicAnnouncements] = useState(true);
    const [mediaDescriptions, setMediaDescriptions] = useState(false);
    const [logicalOrder, setLogicalReadingOrder] = useState(true);
    const [audioFeedback, setAudioFeedback] = useState(false);
    const [visualAlerts, setVisualAlerts] = useState(false);

    // Control States
    const [timeoutWarnings, setTimeoutWarnings] = useState(true);
    const [autoSave, setAutoSave] = useState(true);
    const [disableTimeLimits, setDisableTimeLimits] = useState(false);
    const [transactionConfirmation, setTransactionConfirmation] = useState(true);
    const [undoSupport, setUndoSupport] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('hangel-a11y-v2');
        if (saved) {
            try {
                const s = JSON.parse(saved);
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
                if (s.reduceMotion !== undefined) setReduceMotion(s.reduceMotion);
                if (s.largeTouchTargets !== undefined) setLargeTouchTargets(s.largeTouchTargets);
                if (s.longPressDuration) setLongPressDuration(s.longPressDuration);
                if (s.fullKeyboard !== undefined) setFullKeyboard(s.fullKeyboard);
                if (s.focusStrength) setFocusFrame(s.focusStrength);
                if (s.dragDropAlt !== undefined) setDragDropAlt(s.dragDropAlt);
                if (s.readingLevel) setReadingLevel(s.readingLevel);
                if (s.stepByStep !== undefined) setStepByStep(s.stepByStep);
                if (s.termConsistency !== undefined) setTerminologyConsistency(s.termConsistency);
                if (s.focusMode !== undefined) setFocusMode(s.focusMode);
                if (s.termDefinitions !== undefined) setTermDefinitions(s.termDefinitions);
                if (s.screenReader !== undefined) setScreenReader(s.screenReader);
                if (s.dynamicAnnouncements !== undefined) setDynamicAnnouncements(s.dynamicAnnouncements);
                if (s.mediaDescriptions !== undefined) setMediaDescriptions(s.mediaDescriptions);
                if (s.logicalOrder !== undefined) setLogicalReadingOrder(s.logicalOrder);
                if (s.audioFeedback !== undefined) setAudioFeedback(s.audioFeedback);
                if (s.visualAlerts !== undefined) setVisualAlerts(s.visualAlerts);
                if (s.timeoutWarnings !== undefined) setTimeoutWarnings(s.timeoutWarnings);
                if (s.autoSave !== undefined) setAutoSave(s.autoSave);
                if (s.disableTimeLimits !== undefined) setDisableTimeLimits(s.disableTimeLimits);
                if (s.transactionConfirmation !== undefined) setTransactionConfirmation(s.transactionConfirmation);
                if (s.undoSupport !== undefined) setUndoSupport(s.undoSupport);
            } catch (e) {
                console.error("Settings load error:", e);
            }
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        const settings = {
            highContrast, fontSize, lineHeight, wordSpacing, paragraphSpacing, colorFilter, dyslexiaFont, textAlignment, separateText, showContrastInfo,
            reduceMotion, largeTouchTargets, longPressDuration, fullKeyboard, focusStrength, dragDropAlt,
            readingLevel, stepByStep, termConsistency, focusMode, termDefinitions,
            screenReader, dynamicAnnouncements, mediaDescriptions, logicalOrder, audioFeedback, visualAlerts,
            timeoutWarnings, autoSave, disableTimeLimits, transactionConfirmation, undoSupport
        };
        
        localStorage.setItem('hangel-a11y-v2', JSON.stringify(settings));
        
        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: "Ayarlar Kaydedildi",
                description: "Erişilebilirlik tercihleriniz tüm platformda aktif hale getirildi.",
            });
        }, 800);
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0 max-w-3xl mx-auto pb-32">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="space-y-1">
                <h1 className="text-3xl font-bold font-headline">Erişilebilirlik Ayarları</h1>
                <p className="text-muted-foreground text-sm">WCAG 2.2 AAA ve EN 301 549 standartlarıyla uyumlu 360 derece kapsayıcı deneyim.</p>
            </div>

            {/* Visual & Reading */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5 text-indigo-500" />
                        Görsel & Okuma
                    </CardTitle>
                    <CardDescription>Okunabilirlik ve görsel algı tercihleriniz.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        <SettingsItem label="Yüksek Kontrast" icon={Contrast} iconColor="bg-indigo-500" description="Metin ve arka plan belirginliğini artırır.">
                            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-orange-500" />
                        Bilişsel & Anlama
                    </CardTitle>
                    <CardDescription>Bilişsel yükü azaltma ve netlik ayarları.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col">
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MousePointerClick className="h-5 w-5 text-teal-500" />
                        Etkileşim & Motor
                    </CardTitle>
                    <CardDescription>Motor beceri ve fiziksel erişim kolaylıkları.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col">
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-blue-500" />
                        Ekran Okuyucu & Medya
                    </CardTitle>
                    <CardDescription>Sesli geri bildirim ve medya erişilebilirliği.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col">
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-600" />
                        Zaman & Hata Yönetimi
                    </CardTitle>
                    <CardDescription>Zaman kısıtları ve veri güvenliği ayarları.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col">
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

            {/* Final Save Panel */}
            <div className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none">
                <Card className="bg-background/90 backdrop-blur-xl border-primary/20 shadow-2xl max-w-lg w-full pointer-events-auto">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="text-left hidden sm:block">
                            <p className="font-bold text-sm">Tercihlerinizi Kaydedin</p>
                            <p className="text-[10px] text-muted-foreground">Aktif Profil: {user.name}</p>
                        </div>
                        <Button 
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-xl shadow-primary/20"
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
