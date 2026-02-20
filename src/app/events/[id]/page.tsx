
'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { events, user, ngos, studentClubs } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Tag, Download, CheckCircle, Building, Twitter, Instagram, Linkedin, Facebook, Languages, UserCheck, Clock, School, ShieldAlert, BadgeInfo, HeartPulse, Phone, Mail, Share2, Copy, Github, Palette, Briefcase, ChevronRight, X } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

const InfoRow = ({ icon: Icon, label, children, href }: { icon: React.ElementType; label: string; children: React.ReactNode, href?: string }) => {
    
    const content = (
        <div className="flex items-start gap-4 text-sm py-4">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
                <p className="font-semibold text-foreground">{label}</p>
                <div className="text-muted-foreground font-medium mt-1">{children}</div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="hover:bg-accent/50 -mx-4 px-4 block">{content}</Link>;
    }
    
    return content;
};


export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.id as string;
  const event = events.find(e => e.slug === slug);
  const [profileUrl, setProfileUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && event) {
      setProfileUrl(`${window.location.origin}/events/${event.slug}`);
    }
  }, [event]);

  if (!event) {
    notFound();
  }

  const organizerEntity = ngos.find(n => n.name === event.organizer) || studentClubs.find(c => c.name === event.organizer);
  const organizerCategory = (organizerEntity as any)?.category;
  const organizerLogo = organizerEntity?.avatarUrl;

  let organizerLink = '#';
  if (organizerEntity) {
    if ('transparencyScore' in organizerEntity) { // It's an NGO
      organizerLink = `/ngos/${ngo.id}`;
    } else if ('university' in organizerEntity) { // It's a Student Club
      organizerLink = `/clubs/profile/${organizerEntity.id}`;
    }
  }
  
  const nameQrData = user.name;
  const nameQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(nameQrData)}`;

  const socialLinks = [];
    if (user.personalInfo.social?.linkedin) socialLinks.push(`URL;TYPE=linkedin:https://linkedin.com/in/${user.personalInfo.social.linkedin}`);

  const backQrData = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${user.name}`,
    `TEL;TYPE=CELL:${user.personalInfo.phone}`,
    `EMAIL:${user.personalInfo.email}`,
    ...socialLinks,
    'END:VCARD'
  ].join('\n');
    
  const backQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(backQrData)}`;
  
  const eventHashtag = `#hangel${event.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}${format(parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date()), 'yy')}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({ title: 'Etkinlik linki kopyalandı!' });
  };

  const formatDateTime = (dateStr: string) => {
    try {
        const date = parse(dateStr, 'yyyy-MM-dd HH:mm', new Date());
        return format(date, 'dd MMMM yyyy, HH:mm', { locale: tr });
    } catch (e) {
        return dateStr;
    }
  };

  return (
    <div className="animate-in fade-in-0">
        <div className="p-4 bg-background">
            <div className="flex justify-between items-center mb-6">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <ShareButtons url={profileUrl} title={`${event.name} - hangel Etkinliği`} buttonClassName="border-border text-foreground hover:bg-accent"/>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-headline">{event.name}</h1>
              <p className="text-lg font-medium text-muted-foreground">{event.organizer}</p>
            </div>
        </div>

      <div className="p-4 space-y-4">
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
                   <CardContent className="divide-y p-0">
                        <InfoRow icon={Calendar} label="Başlangıç" href={`/events?month=${format(parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date()), 'yyyy-MM')}`}>{formatDateTime(event.startDate)}</InfoRow>
                        <InfoRow icon={Clock} label="Bitiş">{formatDateTime(event.endDate)}</InfoRow>
                        <InfoRow icon={MapPin} label="Adres">{event.location.type === 'Online' ? 'Online' : `${event.location.address}, ${event.location.district}, ${event.location.city}`}</InfoRow>
                        <InfoRow icon={Languages} label="Dil" href={`/events?tag=${encodeURIComponent(event.language)}`}>{event.language}</InfoRow>
                        <InfoRow icon={Users} label="Kapasite">{event.capacity.current} / {event.capacity.max}</InfoRow>
                        <InfoRow icon={UserCheck} label="Katılım Koşulu">{event.participationCondition}</InfoRow>
                        <InfoRow icon={CheckCircle} label="Sertifika">{event.providesCertificate ? `Veriliyor (${event.location.type}, ${event.language})` : 'Verilmiyor'}</InfoRow>
                        
                        <InfoRow icon={Tag} label="Etkinlik Türü">
                            <Link href={`/events?tag=${encodeURIComponent(event.type)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">{event.type}</Badge></Link>
                        </InfoRow>
                        {organizerCategory && (
                            <InfoRow icon={Tag} label="Etkinlik Kategorisi">
                                <Link href={`/ngos?category=${encodeURIComponent(organizerCategory)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">{organizerCategory}</Badge></Link>
                            </InfoRow>
                        )}
                        <InfoRow icon={Building} label="Düzenleyen">
                            <Link href={organizerLink} className="text-muted-foreground hover:underline">{event.organizer}</Link>
                        </InfoRow>
                        <InfoRow icon={MapPin} label="İl">
                            <Link href={`/events?tag=${encodeURIComponent(event.location.city)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">{event.location.city}</Badge></Link>
                        </InfoRow>
                        {event.location.district && event.location.type !== 'Online' && (
                            <InfoRow icon={MapPin} label="İlçe">
                                <Link href={`/events?tag=${encodeURIComponent(event.location.district)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">{event.location.district}</Badge></Link>
                            </InfoRow>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Açıklama</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{event.description}</p>
                    </CardContent>
                </Card>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="rules">
                        <AccordionTrigger>Etkinlik Kuralları</AccordionTrigger>
                        <AccordionContent>
                           <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                               <li>Etkinlik 4 yaş ve üstü katılımcılar için uygundur.</li>
                               <li>Etkinlik başlangıç saatinden en az 1 saat önce biletle birlikte etkinliğin kapısında olacak şekilde hazır olunması gerekmektedir.</li>
                               <li>Etkinlik başladıktan sonra salona seyirci alınmayacaktır.</li>
                               <li>Misafirlerin belirtilen oturma düzenine uyması zorunludur. Etkinlik boyunca belirlenen koltuklarda oturulması gerekmektedir.</li>
                               <li>Organizatör, indirimli bilet satın alma koşullarında değişiklik yapma hakkını saklı tutar.</li>
                               <li>Organizatör etkinlik alanı ve saatinde değişiklik yapma hakkına sahiptir.</li>
                               <li>Organizatör etkinlik için uygun görmediği kişileri, bilet ücretini iade ederek etkinlik mekanına almama hakkına sahiptir.</li>
                               <li>Etkinlik mekanına yiyecek ve içecek sokmak yasaktır.</li>
                               <li>Etkinlik mekanına kamera ve fotoğraf makinası sokmak yasaktır.</li>
                               <li>Etkinlik alanına ateşli silahlar, yanıcı, patlayıcı, parlayıcı (deodorant, sprey, parfüm, vb.), kesici, delici, bereleyici, saldırı ve savunma amacıyla olmasa bile fiilen saldırı ve savunmada kullanılmaya elverişli (kask, kamp sandalyesi, selfie çubuğu, tripod, pantolon zinciri vb.) her türlü alet ve lazer imleci ile girmek yasaktır.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
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
          <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar">
            <AlertDialogHeader>
              <AlertDialogTitle>Kaydınız Alındı!</AlertDialogTitle>
              <AlertDialogDescription>
                Etkinlik için QR kodlu yaka kartınız oluşturuldu. Etkinlik girişinde bu QR kodu göstermeniz gerekmektedir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 flex flex-col items-center gap-8">
                <div>
                  <h3 className="font-bold text-center mb-2">Ön Yüz</h3>
                  <div className="w-full max-w-[320px] aspect-[105/148] bg-background rounded-lg shadow-lg border flex flex-col justify-between overflow-hidden mx-auto">
                      <div className="p-3 bg-muted/50 flex justify-between items-center border-b">
                          <span className="text-xl font-bold text-primary">hangel</span>
                          {organizerLogo && (
                              <Avatar className="h-10 w-10 bg-white">
                                  <AvatarImage src={organizerLogo} alt={event.organizer} className="p-1 object-contain"/>
                                  <AvatarFallback>{event.organizer.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                          )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between items-center text-center">
                          <div className="space-y-1">
                              <p className="text-lg font-semibold text-foreground leading-tight">{event.name}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(event.startDate)}</p>
                          </div>
                          <div className='w-full'>
                               <Image src={nameQrCodeUrl} alt="İsim QR Kodu" width={80} height={80} className="mx-auto my-2 rounded-lg border p-0.5" />
                               <div className="bg-primary text-primary-foreground py-1 w-full mb-2">
                                 <p className="text-base font-semibold uppercase tracking-wider">Katılımcı</p>
                              </div>
                              <p className="text-2xl font-bold pt-2 whitespace-nowrap truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.volunteerInfo.education[0]?.school || 'Eğitim Bilgisi Yok'}<br/>
                                {user.volunteerInfo.profession && `${user.volunteerInfo.profession} @ ${user.volunteerInfo.sector}`}
                              </p>
                          </div>
                      </div>
                       <div className='bg-muted/50 p-2 text-xs text-muted-foreground border-t text-center'>
                          <p className='font-mono'>{eventHashtag}</p>
                       </div>
                  </div>
                </div>

                <div>
                   <h3 className="font-bold text-center mb-2">Arka Yüz</h3>
                   <div className="w-full max-w-[320px] aspect-[105/148] bg-background rounded-lg shadow-lg border flex flex-col justify-between overflow-hidden mx-auto">
                      <div className="p-3 bg-muted/50 flex justify-between items-center border-b">
                           <span className="text-xl font-bold text-primary">hangel</span>
                          {organizerLogo && (
                              <Avatar className="h-10 w-10 bg-white">
                                  <AvatarImage src={organizerLogo} alt={event.organizer} className="p-1 object-contain"/>
                                  <AvatarFallback>{event.organizer.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                          )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-center items-center text-center space-y-4">
                          <h3 className="text-xl font-bold">Kişisel Bilgiler</h3>
                          <div className="my-2">
                              <Image src={backQrCodeUrl} alt="İletişim QR Kodu" width={100} height={100} className="mx-auto rounded-lg border-2 border-primary/50 p-0.5" />
                          </div>
                          <div className="text-sm space-y-2 text-left w-full">
                             <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" /> <span className="font-bold">{user.name}</span></div>
                             <div className="flex items-center gap-2"><School className="h-4 w-4 text-primary" /> <span>{user.volunteerInfo.education[0]?.school || 'Eğitim Bilgisi Yok'}</span></div>
                              {user.volunteerInfo.profession && user.volunteerInfo.sector && (
                                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> <span>{user.volunteerInfo.profession} @ {user.volunteerInfo.sector}</span></div>
                              )}
                             <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> <span>{user.personalInfo.email}</span></div>
                             <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> <span>{user.personalInfo.phone}</span></div>
                          </div>
                      </div>
                       <div className='bg-muted/50 p-2 text-xs text-muted-foreground border-t text-center'>
                          <p>Bu kart sadece etkinlik alanında geçerlidir.</p>
                       </div>
                  </div>
                </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel>Kapat</AlertDialogCancel>
              <Button asChild>
                <a href={nameQrCodeUrl} download={`yaka-karti-qr-${event.id}.png`}>
                    <Download className="mr-2 h-4 w-4" /> Yaka Kartını İndir
                </a>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" /> Paylaş
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Etkinliği Paylaş</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="link" className="sr-only">
                        Link
                      </Label>
                      <Input
                        id="link"
                        defaultValue={profileUrl}
                        readOnly
                      />
                    </div>
                    <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                      <span className="sr-only">Copy</span>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

    
}

    
