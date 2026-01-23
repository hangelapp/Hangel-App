'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, Siren, Zap, CloudRain, Flame, Ambulance, UserSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div className="p-4 flex flex-col h-full animate-in fade-in-0 space-y-4">
        <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold font-headline">Acil Durum Merkezi</h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Acil bir durumu bildirin veya mevcut çağrılara yanıt verin. Lütfen sadece gerçekten acil durumlarda kullanın.
            </p>
        </div>
        <div className='flex-1 grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                        <Button variant="destructive" className="h-full flex-col gap-1 text-base" onClick={() => handleReportClick('disaster', 'Deprem')}>
                            <Zap className="h-5 w-5" />
                            <span>Deprem</span>
                        </Button>
                        <Button variant="destructive" className="h-full flex-col gap-1 text-base" onClick={() => handleReportClick('disaster', 'Sel')}>
                            <CloudRain className="h-5 w-5" />
                            <span>Sel</span>
                        </Button>
                        <Button variant="destructive" className="h-full flex-col gap-1 text-base" onClick={() => handleReportClick('disaster', 'Yangın')}>
                            <Flame className="h-5 w-5" />
                            <span>Yangın</span>
                        </Button>
                        <Button variant="destructive" className="h-full flex-col gap-1 text-base" onClick={() => handleReportClick('disaster', 'Kaza')}>
                            <Ambulance className="h-5 w-5" />
                            <span>Kaza</span>
                        </Button>
                        <div className="col-span-2">
                            <Button variant="destructive" className="h-full w-full flex-col gap-1 text-base" onClick={() => handleReportClick('disaster', 'Kayıp')}>
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
    </div>
  );
}
