'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, limit } from 'firebase/firestore';
import type { Event as EventType, NGO, StudentClub, User as UserType } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Tag, Download, CheckCircle, Building, Languages, UserCheck, Clock, Phone, Mail, ChevronRight, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


import { useState, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/firebase/collections';

const InfoRow = ({ icon: Icon, label, children, href }: { icon: React.ElementType; label: string; children: React.ReactNode, href?: string }) => {

    const content = (
        <div className="flex items-start gap-4 text-sm py-4 px-4 sm:px-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
                <div className="text-foreground font-medium mt-1">{children}</div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="hover:bg-primary/5 block transition-colors">{content}</Link>;
    }

    return content;
};


export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.id as string;
  const db = useFirestore();
  const { user: authUser } = useUser();
  const [profileUrl, setProfileUrl] = useState('');
  const { toast } = useToast();
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadBadgePdf = async () => {
    if (!cardFrontRef.current || !cardBackRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const opts = { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false };
      const frontCanvas = await html2canvas(cardFrontRef.current, opts);
      const backCanvas = await html2canvas(cardBackRef.current, opts);

      // A4 portre, iki kart yan yana ortalanır
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      // Kart oranı 105/148 (A6). Genişlik 70mm, yükseklik = 70*148/105 ≈ 98.67mm
      const cardW = 70;
      const cardH = (cardW * 148) / 105;
      const gap = 8;
      const totalW = cardW * 2 + gap;
      const startX = (pageW - totalW) / 2;
      const startY = (pageH - cardH) / 2;

      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', startX, startY, cardW, cardH);
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', startX + cardW + gap, startY, cardW, cardH);

      pdf.setFontSize(8);
      pdf.setTextColor(120);
      pdf.text('hangel — etkinlik yaka kartı', pageW / 2, pageH - 10, { align: 'center' });

      pdf.save(`yaka-karti-${event?.id || 'hangel'}.pdf`);
    } catch (err) {
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'PDF oluşturulamadı', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Fetch event by slug (falls back to doc id lookup if no slug match)
  const eventsQuery = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return query(collection(db, COLLECTIONS.events), where('slug', '==', slug), limit(1));
  }, [db, slug]);
  const { data: eventsBySlug, isLoading: isEventsBySlugLoading } = useCollection<EventType>(eventsQuery);

  const eventByIdRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, COLLECTIONS.events, slug);
  }, [db, slug]);
  const { data: eventById, isLoading: isEventByIdLoading } = useDoc<EventType>(eventByIdRef);

  const event = (eventsBySlug && eventsBySlug[0]) || eventById || null;
  const isEventLoading = isEventsBySlugLoading || isEventByIdLoading;

  // Fetch organizer (NGO or student club) by name
  const ngoQuery = useMemoFirebase(() => {
    if (!db || !event?.organizer) return null;
    return query(collection(db, COLLECTIONS.ngos), where('name', '==', event.organizer), limit(1));
  }, [db, event?.organizer]);
  const { data: orgNgo } = useCollection<NGO>(ngoQuery);

  const clubQuery = useMemoFirebase(() => {
    if (!db || !event?.organizer) return null;
    return query(collection(db, COLLECTIONS.clubs), where('name', '==', event.organizer), limit(1));
  }, [db, event?.organizer]);
  const { data: orgClub } = useCollection<StudentClub>(clubQuery);

  // Fetch current authenticated user profile for QR / contact info
  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser?.uid]);
  const { data: userData } = useDoc<UserType>(userDocRef);

  // FEAT-EVENT-RSVP — subscribe to user's own RSVP doc.
  const resolvedEventId = (eventsBySlug && eventsBySlug[0]?.id) || eventById?.id || null;
  const rsvpDocRef = useMemoFirebase(() => {
    if (!db || !authUser?.uid || !resolvedEventId) return null;
    return doc(db, COLLECTIONS.events, resolvedEventId, COLLECTIONS.eventRsvps, authUser.uid);
  }, [db, authUser?.uid, resolvedEventId]);
  const { data: rsvpData } = useDoc<{ status?: 'going' | 'cancelled' }>(rsvpDocRef);
  const isGoing = rsvpData?.status === 'going';
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);

  const submitRsvp = async (action: 'going' | 'cancel') => {
    if (!authUser || !resolvedEventId) {
      toast({ variant: 'destructive', title: 'Giriş yap', description: 'Etkinliğe katılmak için giriş yapmalısın.' });
      return;
    }
    setIsRsvpLoading(true);
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/events/${resolvedEventId}/rsvp`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as { errorCode?: string; message?: string; status?: string };
      if (!res.ok) {
        if (data.errorCode === 'EVENT_FULL') {
          toast({ variant: 'destructive', title: 'Etkinlik dolu', description: 'Kapasite dolduğu için kayıt alınamadı.' });
        } else {
          toast({ variant: 'destructive', title: 'Kayıt başarısız', description: data.message || 'Beklenmeyen hata.' });
        }
        return;
      }
      toast({
        title: data.status === 'going' ? 'Kayıt alındı' : 'Kaydın iptal edildi',
        description: data.status === 'going' ? 'Etkinliğe katılıyorsun.' : 'RSVP iptal edildi.',
      });
    } catch (err) {
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'Kayıt başarısız', description: e?.message || 'Beklenmeyen hata.' });
    } finally {
      setIsRsvpLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && event) {
      setProfileUrl(`${window.location.origin}/events/${event.slug || slug}`);
    }
  }, [event, slug]);

  if (isEventLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!event) {
    notFound();
  }

  const organizerEntity = (orgNgo && orgNgo[0]) || (orgClub && orgClub[0]) || null;
  const organizerCategory = (organizerEntity as (NGO | StudentClub) & { category?: string })?.category;
  const organizerLogo = organizerEntity?.avatarUrl;

  let organizerLink = '#';
  if (organizerEntity) {
    if ('transparencyScore' in organizerEntity) {
      organizerLink = `/ngos/${organizerEntity.id}`;
    } else if ('university' in organizerEntity) {
      organizerLink = `/clubs/profile/${organizerEntity.id}`;
    }
  }

  const user = (userData || {
    name: authUser?.displayName || authUser?.email?.split('@')[0] || 'Katılımcı',
    personalInfo: {
      email: authUser?.email || '',
      phone: '',
      social: {} as Record<string, string>,
    },
    volunteerInfo: { education: [] as unknown[] },
  }) as UserType;

  const nameQrData = user.name;
  const nameQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(nameQrData)}`;

  const socialLinks = [];
    if (user.personalInfo?.social?.linkedin) socialLinks.push(`URL;TYPE=linkedin:https://linkedin.com/in/${user.personalInfo.social.linkedin}`);

  const backQrData = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${user.name}`,
    `TEL;TYPE=CELL:${user.personalInfo?.phone || ''}`,
    `EMAIL:${user.personalInfo?.email || ''}`,
    ...socialLinks,
    'END:VCARD'
  ].join('\n');
    
  const backQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(backQrData)}`;
  
  const eventHashtag = (() => {
    const base = `#hangel${(event.name || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
    try {
      const d = parse(event.startDate || '', 'yyyy-MM-dd HH:mm', new Date());
      if (isNaN(d.getTime())) return base;
      return `${base}${format(d, 'yy')}`;
    } catch {
      return base;
    }
  })();
  
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return '—';
    try {
        let date = parse(dateStr, 'yyyy-MM-dd HH:mm', new Date());
        if (isNaN(date.getTime())) {
            date = parse(dateStr, 'yyyy-MM-dd', new Date());
            if (isNaN(date.getTime())) return dateStr;
            return format(date, 'dd MMMM yyyy', { locale: tr });
        }
        return format(date, 'dd MMMM yyyy, HH:mm', { locale: tr });
    } catch {
        return dateStr;
    }
  };

  // /events?month=YYYY-MM linki için güvenli ay parametresi (saatsiz/boş tarihte null).
  const eventMonthParam = (() => {
    if (!event.startDate) return null;
    try {
      let d = parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date());
      if (isNaN(d.getTime())) d = parse(event.startDate, 'yyyy-MM-dd', new Date());
      return isNaN(d.getTime()) ? null : format(d, 'yyyy-MM');
    } catch {
      return null;
    }
  })();

  const safeImageUrl = event.imageUrl && event.imageUrl.trim().length > 0
    ? event.imageUrl
    : 'https://placehold.co/600x800/eee/aaa?text=Etkinlik';

  return (
    <div className="animate-in fade-in-0 w-full pb-8">
        {/* ===== HERO: A4 portre poster (210/297) + başlık üzerinde, kulüp afişleri için optimize ===== */}
        <div className="relative w-full bg-muted/30">
            <div className="max-w-md mx-auto pt-3 pb-4 sm:pt-4 px-3 sm:px-0 relative">
                {/* Üst sol: Geri butonu (poster dışında, üstte) */}
                <div className="absolute top-2 left-2 sm:left-0 z-20">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-full bg-white/80 backdrop-blur-md text-foreground hover:bg-white shadow-md h-10 w-10" aria-label="Geri">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>
                {/* Üst sağ: Share */}
                <div className="absolute top-2 right-2 sm:right-0 z-20">
                    <ShareButtons url={profileUrl} title={`${event.name} — hangel etkinliği`} buttonClassName="rounded-full bg-white/80 backdrop-blur-md text-foreground hover:bg-white shadow-md h-10 w-10" />
                </div>

                {/* A4 portre poster — 210/297 oranı, kulüp afişleri için ideal */}
                <div className="relative aspect-[210/297] w-full rounded-3xl overflow-hidden shadow-2xl border border-black/5 bg-muted">
                    <Image
                        src={safeImageUrl}
                        alt={event.name}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 448px"
                        data-ai-hint="event poster a4 portrait"
                    />
                </div>
            </div>

            {/* Başlık + organizer + tür/kategori — poster altında */}
            <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 pb-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1">{event.type}</Badge>
                    {organizerCategory && (
                        <Badge variant="outline" className="text-[10px] font-medium rounded-full px-3 py-1">{organizerCategory}</Badge>
                    )}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline leading-tight break-words">{event.name}</h1>
                <p className="text-sm sm:text-base font-bold text-primary">
                    <Link href={organizerLink} className="hover:underline">{event.organizer}</Link>
                </p>
            </div>

            {/* Quick info chips — hero altında, hangel orange accent */}
            <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 relative z-10">
                <div className="glass-surface rounded-3xl shadow-xl border border-white/40 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(event.startDate).split(',')[0]}
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-muted">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(event.startDate).split(',')[1]?.trim() || '—'}
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-muted">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location.type === 'Online' ? 'Online' : `${event.location.district}, ${event.location.city}`}
                    </div>
                    {event.capacity?.max > 0 && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-muted">
                            <Users className="h-3.5 w-3.5" />
                            {event.capacity.current}/{event.capacity.max}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-muted">
                        <Languages className="h-3.5 w-3.5" />
                        {event.language}
                    </div>
                    {event.providesCertificate && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Sertifika
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* PRIMARY RSVP CTA — sabit bar yerine sayfa akışında, posterin hemen altında (her zaman görünür) */}
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-4">
          <Button
            size="lg"
            disabled={isRsvpLoading}
            onClick={() => submitRsvp(isGoing ? 'cancel' : 'going')}
            variant={isGoing ? 'outline' : 'default'}
            className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
          >
            {isRsvpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isGoing ? 'Katıldın ✓ — Vazgeç' : 'Etkinliğe Katıl')}
          </Button>
        </div>

        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">
      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Hero zaten poster'ı içeriyor; içerik alanı tek kolon (geniş okuma) */}
            <div className="space-y-6">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 rounded-2xl glass-surface border border-white/40 p-1">
                        <TabsTrigger value="details" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Etkinlik Detayları</TabsTrigger>
                        <TabsTrigger value="organization" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Kuruluş Hakkında</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="mt-6 space-y-6">
                        <Card className="glass-surface rounded-3xl border-white/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Etkinlik Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y p-0">
                                <InfoRow icon={Calendar} label="Başlangıç" href={eventMonthParam ? `/events?month=${eventMonthParam}` : '/events'}>{formatDateTime(event.startDate)}</InfoRow>
                                <InfoRow icon={Clock} label="Bitiş">{formatDateTime(event.endDate)}</InfoRow>
                                <InfoRow icon={MapPin} label="Adres">
                                    <div className="flex flex-col gap-2">
                                        <span>{event.location.type === 'Online' ? 'Online' : `${event.location.address}`}</span>
                                        {event.location.type !== 'Online' && (
                                            <Button variant="outline" size="sm" className="w-fit h-7 rounded-lg text-[10px] font-bold gap-1.5 border-primary/20 text-primary hover:bg-primary/5" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location.address + ' ' + event.location.district + ' ' + event.location.city)}`, '_blank')}>
                                                <Map className="h-3 w-3" /> Adres Tarifi Al
                                            </Button>
                                        )}
                                    </div>
                                </InfoRow>
                                <InfoRow icon={Languages} label="Dil">
                                    <Link href={`/events?tag=${encodeURIComponent(event.language)}`}>
                                        <Badge variant="secondary" className="font-bold hover:bg-primary/10 transition-colors">{event.language}</Badge>
                                    </Link>
                                </InfoRow>
                                <InfoRow icon={Users} label="Kapasite">{event.capacity?.current ?? 0} / {event.capacity?.max ?? 0}</InfoRow>
                                <InfoRow icon={UserCheck} label="Katılım Koşulu">{event.participationCondition}</InfoRow>
                                <InfoRow icon={CheckCircle} label="Sertifika">{event.providesCertificate ? `Veriliyor (${event.location.type}, ${event.language})` : 'Verilmiyor'}</InfoRow>
                                
                                <InfoRow icon={Tag} label="Etkinlik Türü">
                                    <Link href={`/events?tag=${encodeURIComponent(event.type)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 font-bold">{event.type}</Badge></Link>
                                </InfoRow>
                                {organizerCategory && (
                                    <InfoRow icon={Tag} label="Etkinlik Kategorisi">
                                        <Link href={`/ngos?category=${encodeURIComponent(organizerCategory)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 font-bold">{organizerCategory}</Badge></Link>
                                    </InfoRow>
                                )}
                                <InfoRow icon={Building} label="Düzenleyen">
                                    <Link href={organizerLink} className="text-muted-foreground hover:underline font-bold text-primary">{event.organizer}</Link>
                                </InfoRow>
                                <InfoRow icon={MapPin} label="Konum (İlçe / İl)">
                                    <div className="flex gap-2">
                                        <Link href={`/events?tag=${encodeURIComponent(event.location.district)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 font-bold">{event.location.district}</Badge></Link>
                                        <Link href={`/events?tag=${encodeURIComponent(event.location.city)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 font-bold">{event.location.city}</Badge></Link>
                                    </div>
                                </InfoRow>
                            </CardContent>
                        </Card>

                        <Card className="glass-surface rounded-3xl border-white/40 shadow-sm">
                            <CardHeader>
                                <CardTitle>Açıklama</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed font-medium">{event.description}</p>
                            </CardContent>
                        </Card>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="rules" className="border-none glass-surface rounded-3xl px-4 sm:px-6">
                                <AccordionTrigger className="hover:no-underline font-bold text-sm">Etkinlik Kuralları</AccordionTrigger>
                                <AccordionContent>
                                <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-5 font-medium leading-relaxed">
                                    <li>Etkinlik 4 yaş ve üstü katılımcılar için uygundur.</li>
                                    <li>Etkinlik başlangıç saatinden en az 1 saat önce biletle birlikte etkinliğin kapısında olacak şekilde hazır olunması gerekmektedir.</li>
                                    <li>Etkinlik başladıktan sonra salona seyirci alınmayacaktır.</li>
                                    <li>Misafirlerin belirtilen oturma düzenine uyması zorunludur. Etkinlik boyunca belirlenen koltuklarda oturulması gerekmektedir.</li>
                                    <li>Organizatör, indirimli bilet satın alma koşullarında değişiklik yapma hakkını saklı tutar.</li>
                                    <li>Organizatör etkinlik alanı ve saatinde değişiklik yapma hakkına sahiptir.</li>
                                    <li>Organizatör etkinlik için uygun görmediği kişileri, bilet ücretini iade ederek etkinlik mekanına almama hakkına sahiptir.</li>
                                    <li>Etkinlik mekanına yiyecek ve içecek sokmak yasaktır.</li>
                                    <li>Etkinlik mekanına kamera ve fotoğraf makinası sokmak yasaktır.</li>
                                </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>
                    <TabsContent value="organization" className="mt-6">
                        <Card className="glass-surface rounded-3xl border-white/40 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-6 border-b">
                                <CardTitle className="text-lg flex items-center gap-3">
                                    <Building className="h-5 w-5 text-primary" />
                                    Kuruluş Hakkında
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {organizerEntity ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground leading-relaxed font-medium line-clamp-6">{'about' in organizerEntity ? organizerEntity.about : organizerEntity.description}</p>
                                        <Button asChild variant="outline" className="w-full rounded-xl font-bold h-11">
                                            <Link href={organizerLink}>Kuruluş Profilini İncele <ChevronRight className="ml-1 h-4 w-4"/></Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Kuruluş bilgisi bulunamadı.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

        </div>

        {/* FEAT-EVENT-RSVP — capacity progress */}
        {event.capacity?.max > 0 && (
          <div className="glass-surface rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">Kapasite</span>
              <span className="text-primary">{event.capacity.current} / {event.capacity.max}</span>
            </div>
            <Progress value={Math.min(100, (event.capacity.current / event.capacity.max) * 100)} className="h-2 rounded-full" />
          </div>
        )}
      </div>
      </div>{/* end max-w-6xl wrapper */}

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-2 pb-10">
        <div className="flex flex-wrap gap-2 sm:gap-3">
            {isGoing ? (
              <>
              <Button
                size="lg"
                variant="outline"
                disabled={isRsvpLoading}
                onClick={() => submitRsvp('cancel')}
                className="flex-1 h-14 rounded-2xl text-lg font-black"
              >
                {isRsvpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Katıldın ✓ — vazgeç'}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={async () => {
                  if (!authUser) return;
                  try {
                    const idToken = await authUser.getIdToken();
                    const res = await fetch(`/api/passkit/event/${resolvedEventId}`, {
                      headers: { authorization: `Bearer ${idToken}` },
                    });
                    if (!res.ok) throw new Error('PassKit hazır değil');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    // iOS Safari pkpass'i otomatik Wallet'a ekler
                    window.location.href = url;
                  } catch (e) {
                    alert(e instanceof Error ? e.message : 'Apple Wallet hazırlanamadı');
                  }
                }}
                className="h-14 rounded-2xl font-black px-4 hidden sm:flex items-center gap-2"
                aria-label="Apple Wallet'a Ekle"
                title="Apple Wallet'a Ekle"
              >
                🎫 Wallet
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={async () => {
                  if (!authUser) return;
                  try {
                    const { readNdefUrl } = await import('@/lib/native-nfc');
                    const result = await readNdefUrl();
                    if (!result.ok || !result.url) {
                      alert(result.errorMessage || 'NFC okunamadı.');
                      return;
                    }
                    const tagMatch = result.url.match(/\/tag\/([^/?#]+)/);
                    const tagId = tagMatch ? tagMatch[1] : null;
                    const idToken = await authUser.getIdToken();
                    const res = await fetch(`/api/events/${resolvedEventId}/auto-checkin`, {
                      method: 'POST',
                      headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
                      body: JSON.stringify({ source: 'nfc', tagId }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.message || 'Check-in başarısız');
                    alert(data.already ? '✓ Zaten check-in yapılmış' : '🎉 Check-in başarılı');
                  } catch (e) {
                    alert(e instanceof Error ? e.message : 'NFC hatası');
                  }
                }}
                className="h-14 rounded-2xl font-black px-4 hidden sm:flex items-center gap-2"
                aria-label="NFC ile Check-in"
                title="NFC ile Check-in"
              >
                📲 NFC
              </Button>
              </>
            ) : (
              <Button
                size="lg"
                disabled={isRsvpLoading}
                onClick={() => submitRsvp('going')}
                className="flex-1 h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
              >
                {isRsvpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Etkinliğe Katıl'}
              </Button>
            )}
            {isGoing && (
            <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="lg" variant="secondary" className="h-14 rounded-2xl font-black">Yaka Kartı</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem]">
                <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black tracking-tight">Kaydınız Alındı!</AlertDialogTitle>
                <AlertDialogDescription className="text-base font-medium">
                    Etkinlik için QR kodlu yaka kartınız oluşturuldu. Giriş için kartınızı hazır bulundurun.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-6 flex flex-col items-center gap-8">
                    <div>
                    <h3 className="font-bold text-center mb-3 text-xs uppercase tracking-widest text-muted-foreground">Kart Ön Yüzü</h3>
                    <div ref={cardFrontRef} className="w-full max-w-[300px] aspect-[105/148] bg-white rounded-3xl shadow-2xl border flex flex-col justify-between overflow-hidden mx-auto">
                        <div className="p-4 bg-[#f5f5f7] flex justify-between items-center border-b">
                            <span className="text-xl font-black text-primary">hangel</span>
                            {organizerLogo && (
                                <Avatar className="h-10 w-10 bg-white border">
                                    <AvatarImage src={organizerLogo} alt={event.organizer} className="p-1 object-contain"/>
                                    <AvatarFallback>{event.organizer.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between items-center text-center">
                            <div className="space-y-1">
                                <p className="text-lg font-black text-foreground leading-tight">{event.name}</p>
                                <p className="text-xs font-bold text-primary uppercase">{formatDateTime(event.startDate)}</p>
                            </div>
                            <div className='w-full'>
                                <Image src={nameQrCodeUrl} alt="İsim QR Kodu" width={100} height={100} className="mx-auto my-4 rounded-2xl border p-1 bg-white shadow-sm" />
                                <div className="bg-primary text-primary-foreground py-1.5 w-full rounded-lg mb-2">
                                    <p className="text-sm font-black uppercase tracking-[0.2em]">KATILIMCI</p>
                                </div>
                                <p className="text-xl font-black pt-2 truncate">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                                    {user.volunteerInfo?.education?.[0]?.school || 'Eğitim Bilgisi Yok'}
                                </p>
                            </div>
                        </div>
                        <div className='bg-[#f5f5f7] p-3 text-[10px] text-muted-foreground border-t text-center font-mono'>
                            <p>{eventHashtag}</p>
                        </div>
                    </div>
                    </div>

                    <div>
                    <h3 className="font-bold text-center mb-3 text-xs uppercase tracking-widest text-muted-foreground">Kart Arka Yüzü</h3>
                    <div ref={cardBackRef} className="w-full max-w-[300px] aspect-[105/148] bg-white rounded-3xl shadow-2xl border flex flex-col justify-between overflow-hidden mx-auto">
                        <div className="p-4 bg-[#f5f5f7] flex justify-between items-center border-b">
                            <span className="text-xl font-black text-primary">hangel</span>
                            {organizerLogo && (
                                <Avatar className="h-10 w-10 bg-white border">
                                    <AvatarImage src={organizerLogo} alt={event.organizer} className="p-1 object-contain"/>
                                    <AvatarFallback>{event.organizer.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-6">
                            <h3 className="text-lg font-black uppercase tracking-widest">İLETİŞİM BİLGİLERİ</h3>
                            <div className="my-2">
                                <Image src={backQrCodeUrl} alt="İletişim QR Kodu" width={120} height={120} className="mx-auto rounded-2xl border-2 border-primary/20 p-1 bg-white shadow-sm" />
                            </div>
                            <div className="text-left w-full space-y-3">
                                <div className="flex items-center gap-3"><UserCheck className="h-4 w-4 text-primary" /> <span className="font-bold text-sm">{user.name}</span></div>
                                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> <span className="text-xs font-bold">{user.personalInfo?.email || ''}</span></div>
                                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> <span className="text-xs font-bold">{user.personalInfo?.phone || ''}</span></div>
                            </div>
                        </div>
                        <div className='bg-primary/5 p-3 text-[10px] text-primary font-black border-t text-center uppercase tracking-widest'>
                            <p>Sadece Etkinlik Alanında Geçerlidir</p>
                        </div>
                    </div>
                    </div>
                </div>
                <AlertDialogFooter className="flex-col sm:flex-row gap-3">
                <AlertDialogCancel className="rounded-xl h-12 font-bold">Kapat</AlertDialogCancel>
                <Button
                    type="button"
                    onClick={handleDownloadBadgePdf}
                    disabled={isGeneratingPdf}
                    className="rounded-xl h-12 font-bold"
                >
                    {isGeneratingPdf ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PDF hazırlanıyor…</>
                    ) : (
                        <><Download className="mr-2 h-4 w-4" /> Yaka Kartını İndir</>
                    )}
                </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
            )}

            <ShareButtons url={profileUrl} title={`${event.name} - hangel Etkinliği`} />
        </div>
      </div>
    </div>
  );

    
}
