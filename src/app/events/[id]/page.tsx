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
                                <p className="text-sm text-muted-foreground line-clamp-4">{organizerEntity.description || (organizerEntity as any).about}</p>
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
            <div className="my-4 flex flex-col items-center justify-center p-0">
                <div className="w-full max-w-[320px] aspect-[105/148] bg-background p-6 rounded-lg shadow-md text-center border flex flex-col justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{event.organizer}</p>
                        <h3 className="text-xl font-bold text-primary leading-tight">{event.name}</h3>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2 my-4">
                         <Image src={qrCodeUrl} alt="Katılımcı QR Kodu" width={128} height={128} className="mx-auto rounded-md" />
                    </div>

                    <div className='space-y-1'>
                        <p className="text-2xl font-bold">{user.name}</p>
                        <p className="text-base text-muted-foreground">{user.username}</p>
                        <p className="text-sm font-medium uppercase pt-2">Katılımcı</p>
                    </div>
                    
                    <div className='text-xs text-muted-foreground border-t pt-2 mt-4 space-y-1'>
                        <p>{event.date}</p>
                        <p>{event.location}</p>
                    </div>
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
