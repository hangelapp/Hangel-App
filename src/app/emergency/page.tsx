'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, Siren, Zap, CloudRain, Flame, Ambulance, UserSearch, Info, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const activeCalls = [
    { id: 1, type: 'Kan İhtiyacı', details: 'A Rh+ (Acil)', location: 'Ankara Şehir Hastanesi', time: '15 dakika önce' },
    { id: 2, type: 'Afet Gönüllüsü', details: 'Lojistik Destek', location: 'İzmir Deprem Bölgesi', time: '1 saat önce' },
];

const pastApplications = [
    { id: 1, type: 'Kan İhtiyacı', details: '0 Rh-', location: 'İstanbul Çapa Tıp Fak.', status: 'Başvuruldu' as const },
    { id: 2, type: 'Afet Gönüllüsü', details: 'Arama Kurtarma', location: 'Van Deprem Bölgesi', status: 'Kaçırıldı' as const },
];

export default function EmergencyPage() {
    const { toast } = useToast();
    
    const handleReportClick = (type: 'disaster' | 'blood', details?: string) => {
        let description = type === 'blood'
            ? 'Kan ihtiyacı çağrısı oluşturuluyor.'
            : `${details} durumu ilgili birimlere iletiliyor.`;

        toast({
            title: 'Bildirim Gönderiliyor...',
            description: description,
        });
    };

    const EmergencyTile = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
        <button 
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2rem] active:scale-95 transition-all duration-200 group"
        >
            <div className="p-4 bg-destructive text-white rounded-2xl shadow-lg shadow-destructive/20 group-hover:scale-110 transition-transform">
                <Icon className="h-7 w-7" />
            </div>
            <span className="text-sm font-bold tracking-tight">{label}</span>
        </button>
    );

    const ReportTabContent = () => (
        <div className='flex flex-col gap-6'>
            {/* Disaster Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Siren className="h-5 w-5 text-destructive" /> Afet Bildirimi</h2>
                    <Badge variant="outline" className="rounded-full bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold">ACİL</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <EmergencyTile icon={Zap} label="Deprem" onClick={() => handleReportClick('disaster', 'Deprem')} />
                    <EmergencyTile icon={CloudRain} label="Sel" onClick={() => handleReportClick('disaster', 'Sel')} />
                    <EmergencyTile icon={Flame} label="Yangın" onClick={() => handleReportClick('disaster', 'Yangın')} />
                    <EmergencyTile icon={Ambulance} label="Kaza" onClick={() => handleReportClick('disaster', 'Kaza')} />
                    <div className="col-span-2">
                        <button 
                            onClick={() => handleReportClick('disaster', 'Kayıp')}
                            className="w-full flex items-center justify-between p-5 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2rem] active:scale-[0.98] transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-destructive text-white rounded-xl shadow-md">
                                    <UserSearch className="h-6 w-6" />
                                </div>
                                <span className="text-base font-bold tracking-tight">Kayıp Şahıs Bildir</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-2xl border border-dashed flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                        Konum, iletişim ve kan grubu bilgileriniz ilgili kamu kuruluşları ile otomatik olarak paylaşılacaktır.
                    </p>
                </div>
            </div>

            {/* Blood Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Droplets className="h-5 w-5 text-destructive" /> Kan İhtiyacı</h2>
                </div>
                
                <button 
                    onClick={() => handleReportClick('blood')}
                    className="w-full relative overflow-hidden p-6 bg-gradient-to-br from-destructive to-red-700 text-white rounded-[2rem] active:scale-[0.98] transition-all shadow-xl shadow-destructive/20"
                >
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <Droplets className="h-10 w-10 animate-pulse" />
                        <span className="text-xl font-black tracking-tight uppercase">ACİL KAN ÇAĞRISI</span>
                        <p className="text-white/80 text-xs font-medium">Konumunuzdaki potansiyel bağışçılara ulaşın</p>
                    </div>
                    {/* Abstract blood background decoration */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/10 rounded-full blur-3xl" />
                </button>
            </div>
        </div>
    );

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 animate-in fade-in-0">
        {/* iOS Style Header */}
        <div className="px-6 pt-12 pb-6 space-y-1">
            <h1 className="text-4xl font-black font-headline tracking-tighter">Acil Durum</h1>
            <p className="text-muted-foreground text-sm font-medium">Topluluğun gücüyle hayat kurtar.</p>
        </div>
        
        <div className="px-4">
            <Tabs defaultValue="report" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1.5 h-14 rounded-3xl backdrop-blur-xl">
                    <TabsTrigger value="report" className="rounded-2xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">
                        Bildirimde Bulun
                    </TabsTrigger>
                    <TabsTrigger value="calls" className="rounded-2xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">
                        Çağrılar & Kayıtlar
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="report" className="mt-8">
                    <ReportTabContent />
                </TabsContent>

                <TabsContent value="calls" className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-base font-bold">Aktif Acil Çağrılar</h3>
                            <Badge variant="outline" className="rounded-full bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold">CANLI</Badge>
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
                                        <Button variant="outline" className="w-full rounded-xl font-bold group-hover:bg-destructive group-hover:text-white transition-colors">
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

        {/* Warning Banner */}
        <div className="fixed bottom-24 left-4 right-4 z-10">
            <div className="p-4 bg-slate-900/90 backdrop-blur-lg text-white rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                <div className="p-2 bg-white/10 rounded-lg">
                    <Info className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-[10px] font-medium leading-snug">
                    <span className="font-bold text-red-400 uppercase tracking-widest mr-1">YASAL UYARI:</span> 
                    Sadece gerçekten acil durumlarda kullanın. Asılsız bildirimler yasal sorumluluk ve cezai yaptırım doğurur.
                </p>
            </div>
        </div>
    </div>
  );
}
