'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, Siren, Zap, CloudRain, Flame, Ambulance, UserSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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

    const ReportTabContent = () => (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className='text-base flex items-center gap-2 text-destructive'><Siren className='h-5 w-5' /> Afet Bildirimi</CardTitle>
                </CardHeader>
                <CardContent className='flex-1 flex flex-col space-y-2'>
                     <Alert variant="destructive" className='text-xs'>
                      <Siren className="h-4 w-4" />
                      <AlertTitle>Uyarı!</AlertTitle>
                      <AlertDescription>
                        Konum, iletişim ve kan grubu bilgileriniz ilgili kamu kuruluşları ile paylaşılacaktır.
                      </AlertDescription>
                    </Alert>
                    <div className="flex-1 grid grid-cols-2 gap-2 pt-2">
                        <Button variant="destructive" className="h-full flex-col gap-1 text-sm sm:text-base" onClick={() => handleReportClick('disaster', 'Deprem')}>
                            <Zap className="h-5 w-5" />
                            <span>Deprem</span>
                        </Button>
                        <Button variant="destructive" className="h-full flex-col gap-1 text-sm sm:text-base" onClick={() => handleReportClick('disaster', 'Sel')}>
                            <CloudRain className="h-5 w-5" />
                            <span>Sel</span>
                        </Button>
                        <Button variant="destructive" className="h-full flex-col gap-1 text-sm sm:text-base" onClick={() => handleReportClick('disaster', 'Yangın')}>
                            <Flame className="h-5 w-5" />
                            <span>Yangın</span>
                        </Button>
                        <Button variant="destructive" className="h-full flex-col gap-1 text-sm sm:text-base" onClick={() => handleReportClick('disaster', 'Kaza')}>
                            <Ambulance className="h-5 w-5" />
                            <span>Kaza</span>
                        </Button>
                        <div className="col-span-2">
                            <Button variant="destructive" className="h-full w-full flex-col gap-1 text-sm sm:text-base" onClick={() => handleReportClick('disaster', 'Kayıp')}>
                                <UserSearch className="h-5 w-5" />
                                <span>Kayıp</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className='text-base flex items-center gap-2 text-destructive'><Droplets className='h-5 w-5' /> Kan İhtiyacı</CardTitle>
                </CardHeader>
                <CardContent className='flex-1 flex flex-col space-y-2'>
                    <Alert variant="destructive" className='text-xs'>
                      <Droplets className="h-4 w-4" />
                      <AlertTitle>Uyarı!</AlertTitle>
                      <AlertDescription>
                        Konum ve iletişim bilgileriniz potansiyel bağışçılarla paylaşılacaktır.
                      </AlertDescription>
                    </Alert>
                     <Button variant="destructive" className="w-full flex-1" onClick={() => handleReportClick('blood')}>
                        <Droplets className="mr-2 h-4 w-4" />
                        Kan İhtiyacı Bildir
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
        <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold font-headline">Acil Durum Merkezi</h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto">
                Sadece gerçekten acil durumlarda kullanın. Asılsız bildirimler yasal sorumluluk doğurur.
            </p>
        </div>
        
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report">Bildirimde Bulun</TabsTrigger>
            <TabsTrigger value="calls">Çağrılar & Başvurular</TabsTrigger>
          </TabsList>
          <TabsContent value="report" className="mt-4">
             <ReportTabContent />
          </TabsContent>
          <TabsContent value="calls" className="mt-4">
              <Tabs defaultValue="active" className="w-full">
                  <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value="active">Aktif Çağrılar</TabsTrigger>
                      <TabsTrigger value="history">Geçmiş Başvurularım</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="mt-4 space-y-3">
                      {activeCalls.map(call => (
                          <Card key={call.id}>
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-destructive">{call.type}</p>
                                        <p className="text-sm">{call.details}</p>
                                        <p className="text-xs text-muted-foreground">{call.location}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex-shrink-0">{call.time}</p>
                                </div>
                                <Button size="sm" className="mt-2 w-full">Yanıt Ver</Button>
                            </CardContent>
                          </Card>
                      ))}
                        {activeCalls.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Şu anda aktif bir acil çağrı bulunmuyor.</p>}
                  </TabsContent>
                   <TabsContent value="history" className="mt-4 space-y-3">
                      {pastApplications.map(app => (
                           <Card key={app.id}>
                             <CardContent className="p-3 flex justify-between items-center">
                                 <div>
                                    <p className="font-semibold">{app.type}</p>
                                    <p className="text-sm text-muted-foreground">{app.details}</p>
                                     <p className="text-xs text-muted-foreground">{app.location}</p>
                                 </div>
                                 <Badge variant={app.status === 'Başvuruldu' ? 'default' : 'secondary'}>{app.status}</Badge>
                             </CardContent>
                           </Card>
                      ))}
                        {pastApplications.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Geçmişte bir acil durum başvurunuz bulunmuyor.</p>}
                  </TabsContent>
              </Tabs>
          </TabsContent>
        </Tabs>
    </div>
  );
}
