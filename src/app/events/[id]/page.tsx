'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { events, user, ngos, studentClubs } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Tag, Download, CheckCircle, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { useState, useEffect } from 'react';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const event = events.find(e => e.id === id);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
  }, []);

  if (!event) {
    notFound();
  }

  const organizerEntity = ngos.find(n => n.name === event.organizer) || studentClubs.find(c => c.name === event.organizer);
  const organizerLink = organizerEntity ? (('university' in organizerEntity) ? `/admin/clubs/profile/${organizerEntity.id}` : `/ngos/${organizerEntity.id}`) : '#';

  const qrData = `hangel-event-ticket:${event.id}:${user.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-48 w-full bg-muted">
        <Image src={event.imageUrl} alt={`${event.name} Cover`} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4">
            <ShareButtons url={profileUrl} title={`${event.name} - Hangel Etkinliği`} buttonClassName="border-white/50 text-white hover:bg-white/20"/>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="-mt-12 relative z-10">
          <h1 className="text-3xl font-bold font-headline text-white drop-shadow-md">{event.name}</h1>
          <p className="text-lg font-medium text-white drop-shadow-md">{event.organizer}</p>
        </div>

        <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Etkinlik Detayları</TabsTrigger>
                <TabsTrigger value="organization">Kuruluş Hakkında</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Etkinlik Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-base">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-base">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-base">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span>Kapasite: {event.capacity.current} / {event.capacity.max}</span>
                    </div>
                     <div className="flex items-center gap-3 text-base">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      <span>Sertifika: {event.providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</span>
                    </div>
                    <div className="flex items-start gap-3 text-base">
                      <Tag className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Açıklama</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{event.description}</p>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="organization" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                            Kuruluş Hakkında
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {organizerEntity ? (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-4">{organizerEntity.description || (organizerEntity as NGO).about}</p>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={organizerLink}>Kuruluş Profilini İncele</Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Kuruluş bilgisi bulunamadı.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" className="w-full">Etkinliğe Katıl</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kaydınız Alındı!</AlertDialogTitle>
              <AlertDialogDescription>
                Etkinlik için QR kodlu yaka kartınız oluşturuldu. Etkinlik girişinde bu QR kodu göstermeniz gerekmektedir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/50">
                <div className="w-full max-w-[280px] bg-background p-4 rounded-lg shadow-md text-center border">
                    <h3 className="text-lg font-bold text-primary">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.organizer}</p>
                    <div className="my-4">
                         <Image src={qrCodeUrl} alt="Katılımcı QR Kodu" width={120} height={120} className="mx-auto" />
                    </div>
                    <p className="text-xl font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">Katılımcı</p>
                </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Kapat</AlertDialogCancel>
              <AlertDialogAction asChild>
                <a href={qrCodeUrl} download={`yaka-karti-${event.id}.png`}>
                    <Download className="mr-2 h-4 w-4" /> Yaka Kartını İndir
                </a>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
