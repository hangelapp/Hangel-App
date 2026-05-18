"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, Siren, Zap, CloudRain, Flame, Ambulance, UserSearch } from "lucide-react";
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';

const activeCalls = [
    { id: 1, type: 'Kan İhtiyacı', details: 'A Rh+ (Acil)', location: 'Ankara Şehir Hastanesi', time: '15 dakika önce' },
    { id: 2, type: 'Afet Gönüllüsü', details: 'Lojistik Destek', location: 'İzmir Deprem Bölgesi', time: '1 saat önce' },
];

const pastApplications = [
    { id: 1, type: 'Kan İhtiyacı', details: '0 Rh-', location: 'İstanbul Çapa Tıp Fak.', status: 'Başvuruldu' as const },
    { id: 2, type: 'Afet Gönüllüsü', details: 'Arama Kurtarma', location: 'Van Deprem Bölgesi', status: 'Kaçırıldı' as const },
];


export function EmergencyDialog({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const handleReportClick = (type: 'disaster' | 'blood', details?: string) => {
        const description = type === 'blood'
            ? 'Kan ihtiyacı çağrısı oluşturuluyor.'
            : `${details} durumu ilgili birimlere iletiliyor.`;

        toast({
            title: 'Bildirim Gönderiliyor...',
            description: description,
        });
        setIsOpen(false);
    };

    if (!isMounted) {
        return null;
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acil Durum Merkezi</DialogTitle>
          <DialogDescription>
            Acil bir durumu bildirin veya mevcut çağrılara yanıt verin. Lütfen sadece gerçekten acil durumlarda kullanın.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="report" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report">Bildirimde Bulun</TabsTrigger>
            <TabsTrigger value="calls">Çağrılar & Başvurular</TabsTrigger>
          </TabsList>
          <TabsContent value="report" className="mt-4 space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle className='text-base flex items-center gap-2 text-destructive'><Siren className='h-5 w-5' /> Afet Bildirimi</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                     <Alert variant="destructive" className='text-xs'>
                      <Siren className="h-4 w-4" />
                      <AlertTitle>Uyarı!</AlertTitle>
                      <AlertDescription>
                        Konum, iletişim ve kan grubu bilgileriniz ilgili kamu kuruluşları ile paylaşılacaktır.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button variant="destructive" className="h-20 flex-col gap-2 text-base" onClick={() => handleReportClick('disaster', 'Deprem')}>
                            <Zap className="h-6 w-6" />
                            <span>Deprem</span>
                        </Button>
                        <Button variant="destructive" className="h-20 flex-col gap-2 text-base" onClick={() => handleReportClick('disaster', 'Sel')}>
                            <CloudRain className="h-6 w-6" />
                            <span>Sel</span>
                        </Button>
                        <Button variant="destructive" className="h-20 flex-col gap-2 text-base" onClick={() => handleReportClick('disaster', 'Yangın')}>
                            <Flame className="h-6 w-6" />
                            <span>Yangın</span>
                        </Button>
                        <Button variant="destructive" className="h-20 flex-col gap-2 text-base" onClick={() => handleReportClick('disaster', 'Kaza')}>
                            <Ambulance className="h-6 w-6" />
                            <span>Kaza</span>
                        </Button>
                        <div className="col-span-2">
                            <Button variant="destructive" className="h-20 w-full flex-col gap-2 text-base" onClick={() => handleReportClick('disaster', 'Kayıp')}>
                                <UserSearch className="h-6 w-6" />
                                <span>Kayıp</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className='text-base flex items-center gap-2 text-destructive'><Droplets className='h-5 w-5' /> Kan İhtiyacı</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Alert variant="destructive" className='text-xs'>
                      <Droplets className="h-4 w-4" />
                      <AlertTitle>Uyarı!</AlertTitle>
                      <AlertDescription>
                        Konum ve iletişim bilgileriniz potansiyel bağışçılarla paylaşılacaktır.
                      </AlertDescription>
                    </Alert>
                     <Button variant="destructive" className="w-full" onClick={() => handleReportClick('blood')}>
                        <Droplets className="mr-2 h-4 w-4" />
                        Kan İhtiyacı Bildir
                    </Button>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="calls" className="mt-4">
              <Tabs defaultValue="active" className="w-full">
                  <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value="active">Aktif Çağrılar</TabsTrigger>
                      <TabsTrigger value="history">Geçmiş Başvurularım</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="mt-4 space-y-3">
                      {activeCalls.map(call => (
                          <div key={call.id} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <p className="font-semibold text-destructive">{call.type}</p>
                                      <p className="text-sm">{call.details}</p>
                                      <p className="text-xs text-muted-foreground">{call.location}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{call.time}</p>
                              </div>
                              <Button size="sm" className="mt-2 w-full">Yanıt Ver</Button>
                          </div>
                      ))}
                        {activeCalls.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Şu anda aktif bir acil çağrı bulunmuyor.</p>}
                  </TabsContent>
                   <TabsContent value="history" className="mt-4 space-y-3">
                      {pastApplications.map(app => (
                           <div key={app.id} className="p-3 border rounded-lg flex justify-between items-center">
                               <div>
                                  <p className="font-semibold">{app.type}</p>
                                  <p className="text-sm text-muted-foreground">{app.details}</p>
                                   <p className="text-xs text-muted-foreground">{app.location}</p>
                               </div>
                               <Badge variant={app.status === 'Başvuruldu' ? 'default' : 'secondary'}>{app.status}</Badge>
                           </div>
                      ))}
                        {pastApplications.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Geçmişte bir acil durum başvurunuz bulunmuyor.</p>}
                  </TabsContent>
              </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
