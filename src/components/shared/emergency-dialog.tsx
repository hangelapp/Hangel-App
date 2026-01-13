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
import { Droplets, Megaphone, Siren } from "lucide-react";
import { Badge } from '../ui/badge';

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

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <>{children}</>;
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
        <Tabs defaultValue="calls" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calls">Acil Çağrılar</TabsTrigger>
            <TabsTrigger value="disaster">Afet Bildirimi</TabsTrigger>
            <TabsTrigger value="blood">Kan İhtiyacı</TabsTrigger>
          </TabsList>
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
                  </TabsContent>
              </Tabs>
          </TabsContent>
          <TabsContent value="disaster" className="mt-4 text-center space-y-4">
            <Alert variant="destructive">
              <Siren className="h-4 w-4" />
              <AlertTitle>Uyarı!</AlertTitle>
              <AlertDescription>
                Afet bildirimi yaptığınızda konum, iletişim ve kan grubu bilgileriniz hangel iletişim merkezi ve ilgili kamu kuruluşları ile paylaşılacaktır.
              </AlertDescription>
            </Alert>
            <Button variant="destructive" className="w-full">
              <Megaphone className="mr-2 h-4 w-4" />
              Afet Bildiriminde Bulun
            </Button>
          </TabsContent>
          <TabsContent value="blood" className="mt-4 text-center space-y-4">
            <Alert variant="destructive">
              <Droplets className="h-4 w-4" />
              <AlertTitle>Uyarı!</AlertTitle>
              <AlertDescription>
                Kan ihtiyacı çağrısı yaptığınızda konum ve iletişim bilgileriniz ilgili kurumlarla ve potansiyel bağışçılarla paylaşılacaktır.
              </AlertDescription>
            </Alert>
             <Button variant="destructive" className="w-full">
                <Droplets className="mr-2 h-4 w-4" />
                Kan İhtiyacı Bildir
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
