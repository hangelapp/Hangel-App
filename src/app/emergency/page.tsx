'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, Siren, Zap, CloudRain, Flame, Ambulance, UserSearch, Info, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const initialActiveCalls = [
    { id: 1, type: 'Kan İhtiyacı', details: 'A Rh+ (Acil)', location: 'Ankara Şehir Hastanesi', time: '5 dk önce' },
    { id: 2, type: 'Deprem', details: 'Enkaz Kaldırma Gönüllüsü', location: 'Hatay Antakya', time: '12 dk önce' },
    { id: 3, type: 'Kan İhtiyacı', details: '0 Rh- (Kritik)', location: 'İstanbul Çapa Tıp Fakültesi', time: '18 dk önce' },
    { id: 4, type: 'Yangın', details: 'Söndürme Destek Ekibi', location: 'Muğla Marmaris', time: '25 dk önce' },
    { id: 5, type: 'Kan İhtiyacı', details: 'B Rh+', location: 'Antalya Akdeniz Üniv. Hastanesi', time: '32 dk önce' },
    { id: 6, type: 'Sel', details: 'Tahliye Operasyonu', location: 'Giresun Dereli', time: '40 dk önce' },
    { id: 7, type: 'Kaza', details: 'Çoklu Trafik Kazası Destek', location: 'Bursa TEM Otoyolu', time: '45 dk önce' },
    { id: 8, type: 'Kayıp', details: 'Arama Kurtarma Ekibi', location: 'Bolu Kartalkaya', time: '52 dk önce' },
    { id: 9, type: 'Kan İhtiyacı', details: 'AB Rh-', location: 'İzmir Ege Üniv. Hastanesi', time: '1 saat önce' },
    { id: 10, type: 'Yangın', details: 'Lojistik Destek', location: 'Çanakkale Ayvacık', time: '1 saat önce' },
    { id: 11, type: 'Deprem', details: 'Çadır Kent Kurulumu', location: 'Adıyaman Merkez', time: '1 saat önce' },
    { id: 12, type: 'Kan İhtiyacı', details: 'A Rh-', location: 'Gaziantep Şehir Hastanesi', time: '2 saat önce' },
    { id: 13, type: 'Sel', details: 'Gıda ve İhtiyaç Dağıtımı', location: 'Sinop Ayancık', time: '2 saat önce' },
    { id: 14, type: 'Kaza', details: 'Tünel Kazası Müdahale', location: 'Kocaeli Bolu Dağı', time: '2 saat önce' },
    { id: 15, type: 'Kayıp', details: 'Şehir Merkezi Arama', location: 'İstanbul Beyoğlu', time: '3 saat önce' },
    { id: 16, type: 'Kan İhtiyacı', details: '0 Rh+', location: 'Konya Şehir Hastanesi', time: '3 saat önce' },
    { id: 17, type: 'Yangın', details: 'Rehabilitasyon Çalışması', location: 'Antalya Manavgat', time: '4 saat önce' },
    { id: 18, type: 'Deprem', details: 'Saha Koordinasyon Gönüllüsü', location: 'Malatya Doğanşehir', time: '4 saat önce' },
    { id: 19, type: 'Kan İhtiyacı', details: 'B Rh-', location: 'Adana Şehir Hastanesi', time: '5 saat önce' },
    { id: 20, type: 'Kaza', details: 'Zincirleme Kaza Yardım', location: 'Eskişehir Yolu', time: '5 saat önce' },
    { id: 21, type: 'Kayıp', details: 'Doğa Araması', location: 'Rize Kaçkar Dağları', time: '6 saat önce' },
];

const initialPastApplications = [
    { id: 100, type: 'Kan İhtiyacı', details: '0 Rh-', location: 'İstanbul Çapa Tıp Fak.', status: 'Başvuruldu' as const },
];

export default function EmergencyPage() {
    const { toast } = useToast();
    const [activeCalls, setActiveCalls] = useState(initialActiveCalls);
    const [pastApplications, setPastApplications] = useState(initialPastApplications);
    const [isReporting, setIsReporting] = useState<string | null>(null);
    
    const handleReportClick = (type: string, details: string) => {
        setIsReporting(details);
        
        setTimeout(() => {
            toast({
                title: 'İhbar İletildi',
                description: `${details} durumu konumunuzla birlikte ilgili birimlere başarıyla ulaştırıldı.`,
            });
            setIsReporting(null);
        }, 2000);
    };

    const handleHelpClick = (call: typeof initialActiveCalls[0]) => {
        setActiveCalls(prev => prev.filter(c => c.id !== call.id));
        
        const newApp = {
            ...call,
            status: 'Başvuruldu' as const,
        };
        setPastApplications(prev => [newApp, ...prev]);

        toast({
            title: 'Yardım Talebi Alındı',
            description: `"${call.details}" için yardım talebiniz onaylandı. Koordinasyon ekibi sizinle iletişime geçecek.`,
        });
    };

    const EmergencyTile = ({ icon: Icon, label, color = "bg-destructive", onClick }: { icon: any, label: string, color?: string, onClick: () => void }) => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button 
                    disabled={!!isReporting}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2rem] active:scale-95 transition-all duration-200 group disabled:opacity-50"
                >
                    <div className={cn("p-4 text-white rounded-2xl shadow-lg transition-transform group-hover:scale-110 flex items-center justify-center", color)}>
                        {isReporting === label ? <Loader2 className="h-7 w-7 animate-spin" /> : <Icon className="h-7 w-7" />}
                    </div>
                    <span className="text-[13px] font-bold tracking-tight text-center leading-tight">{label}</span>
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                        <p className="text-foreground/80">
                            <strong>{label}</strong> bildirimi yapmak üzeresiniz. Bu işlem konum ve iletişim bilgilerinizi acil durum ekipleriyle paylaşacaktır.
                        </p>
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
                            <Siren className="h-4 w-4" />
                            <AlertTitle className="font-black text-xs uppercase tracking-widest">YASAL UYARI</AlertTitle>
                            <AlertDescription className="text-xs font-bold leading-tight">
                                Asılsız bildirimler yasal sorumluluk ve cezai yaptırım doğurur.
                            </AlertDescription>
                        </Alert>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onClick}
                        className="rounded-2xl font-bold bg-destructive hover:bg-destructive/90 text-white border-none"
                    >
                        Bildirimi Gönder
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    const ReportTabContent = () => (
        <div className='flex flex-col gap-6'>
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Siren className="h-5 w-5 text-destructive" /> Acil Bildirimler</h2>
                    <Badge variant="outline" className="rounded-full bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold uppercase tracking-widest">Canlı</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-3 px-1">
                    <EmergencyTile icon={Zap} label="Deprem" onClick={() => handleReportClick('earthquake', 'Deprem')} />
                    <EmergencyTile icon={CloudRain} label="Sel" onClick={() => handleReportClick('flood', 'Sel')} />
                    <EmergencyTile icon={Flame} label="Yangın" onClick={() => handleReportClick('fire', 'Yangın')} />
                    <EmergencyTile icon={Ambulance} label="Kaza" onClick={() => handleReportClick('accident', 'Kaza')} />
                    <EmergencyTile icon={UserSearch} label="Kayıp" onClick={() => handleReportClick('missing', 'Kayıp')} />
                    <EmergencyTile 
                        icon={Droplets} 
                        label="Kan" 
                        color="bg-red-600"
                        onClick={() => handleReportClick('blood', 'Kan İhtiyacı')} 
                    />
                </div>

                <div className="p-4 bg-muted/50 rounded-2xl border border-dashed flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                        Sadece gerçekten acil durumlarda kullanın. Asılsız bildirimler yasal sorumluluk ve cezai yaptırım doğurur. Konum ve iletişim bilgileriniz paylaşılacaktır.
                    </p>
                </div>
            </div>
        </div>
    );

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-secondary/30 animate-in fade-in-0 flex flex-col">
        <div className="px-6 pt-12 pb-6 space-y-1 shrink-0">
            <h1 className="text-4xl font-black font-headline tracking-tighter">Acil Durum</h1>
            <p className="text-muted-foreground text-sm font-medium">Topluluğun gücüyle hayat kurtar.</p>
        </div>
        
        <div className="px-4 flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="report" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1.5 h-14 rounded-3xl backdrop-blur-xl shrink-0">
                    <TabsTrigger value="report" className="rounded-2xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">
                        Bildirimde Bulun
                    </TabsTrigger>
                    <TabsTrigger value="calls" className="rounded-2xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">
                        Çağrılar & Kayıtlar
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="report" className="mt-8 overflow-y-auto no-scrollbar">
                    <ReportTabContent />
                </TabsContent>

                <TabsContent value="calls" className="mt-8 space-y-6 overflow-y-auto no-scrollbar pb-32">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-base font-bold">Aktif Acil Çağrılar</h3>
                            <Badge variant="outline" className="rounded-full bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold uppercase">Canlı</Badge>
                        </div>
                        <div className="space-y-3">
                            {activeCalls.map(call => (
                                <Card key={call.id} className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                    <div className="bg-destructive/5 p-4 flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                                                <p className="font-black text-sm text-destructive uppercase tracking-widest">{call.type}</p>
                                            </div>
                                            <p className="text-lg font-bold tracking-tight leading-tight">{call.details}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {call.location}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{call.time}</p>
                                    </div>
                                    <div className="p-3 bg-background border-t border-dashed">
                                        <Button 
                                            variant="outline" 
                                            className="w-full rounded-xl font-bold group-hover:bg-destructive group-hover:text-white transition-colors"
                                            onClick={() => handleHelpClick(call)}
                                        >
                                            Yardım Et
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {activeCalls.length === 0 && (
                                <div className="text-center py-16 bg-white/5 rounded-[2rem] border-2 border-dashed border-muted-foreground/20">
                                    <p className="text-sm font-medium text-muted-foreground">Şu anda aktif bir acil çağrı bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-base font-bold px-1">Geçmiş Başvurularım</h3>
                        <div className="space-y-3">
                            {pastApplications.map(app => (
                                <Card key={app.id} className="rounded-2xl border-none shadow-sm hover:bg-accent/5 transition-colors">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm">{app.type}</p>
                                            <p className="text-xs text-muted-foreground">{app.details} • {app.location}</p>
                                        </div>
                                        <Badge variant={app.status === 'Başvuruldu' ? 'default' : 'secondary'} className="rounded-full text-[10px] font-black uppercase px-3">
                                            {app.status}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                            {pastApplications.length === 0 && (
                                <p className="text-center text-xs text-muted-foreground py-8 italic">Geçmişte bir acil durum başvurunuz bulunmuyor.</p>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        <div className="fixed bottom-24 left-4 right-4 z-10">
            <div className="p-4 bg-slate-900/90 backdrop-blur-lg text-white rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                <div className="p-2 bg-white/10 rounded-lg">
                    <Info className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-[10px] font-medium leading-snug">
                    <span className="font-bold text-red-400 uppercase tracking-widest mr-1">YASAL UYARI:</span> 
                    Sadece gerçekten acil durumlarda kullanın. Asılsız bildirimler yasal sorumluluk ve cezai yaptırım doğurur. Konum ve iletişim bilgileriniz paylaşılacaktır.
                </p>
            </div>
        </div>
    </div>
  );
}
