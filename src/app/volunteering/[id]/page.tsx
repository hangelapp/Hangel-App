'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Award, Loader2, Users, UserCheck, Map, Download, Info, HeartHandshake, Mail, Phone, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import { differenceInDays, format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Volunteering, NGO, User as UserType } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTIONS } from '@/firebase/collections';
import { scoreMatch, type MatchingUserProfile } from '@/lib/volunteer-matching';
import { startVolunteerTaskActivity } from '@/lib/native-live-activity';
import { socialImpactValueTRY, formatTRY, socialImpactExplanation } from '@/lib/social-impact';

type WeatherDay = { date: string; tempMax: number; tempMin: number; label: string; emoji: string };

export default function VolunteeringDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const db = useFirestore();

  const oppDocRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, COLLECTIONS.volunteering, id);
  }, [db, id]);

  const { data: opportunity, isLoading: isOppLoading } = useDoc<Volunteering>(oppDocRef);

  const ngoDocRef = useMemoFirebase(() => {
    if (!db || !opportunity?.ngoId) return null;
    return doc(db, COLLECTIONS.ngos, opportunity.ngoId);
  }, [db, opportunity?.ngoId]);

  const { data: ngo } = useDoc<NGO>(ngoDocRef);

  const [profileUrl, setProfileUrl] = useState('');
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [weather, setWeather] = useState<WeatherDay[] | null>(null);
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);
  const { data: userData } = useDoc<UserType & {
    volunteerInfo?: MatchingUserProfile['volunteerInfo'];
    personalInfo?: MatchingUserProfile['personalInfo'];
  }>(userDocRef);

  // Başvuru durumu — kullanıcının bu fırsata yaptığı başvuru var mı (events RSVP benzeri sinyal).
  const myApplicationsQuery = useMemoFirebase(() => {
    if (!db || !authUser || !id) return null;
    return query(
      collection(db, COLLECTIONS.applications),
      where('userId', '==', authUser.uid),
      where('entityId', '==', id),
    );
  }, [db, authUser, id]);
  const { data: myApplications } = useCollection<{ status?: string }>(myApplicationsQuery);

  const matchingProfile = useMemo<MatchingUserProfile>(() => ({
    volunteerInfo: userData?.volunteerInfo ?? null,
    personalInfo: userData?.personalInfo ?? null,
  }), [userData]);

  const hasProfile = useMemo(() => {
    const vi = matchingProfile.volunteerInfo;
    const city = matchingProfile.personalInfo?.address?.city;
    const arrays = vi ? [vi.skills, vi.dailySkills, vi.interests, vi.languages, vi.availabilityDays, vi.availabilityTimes, vi.workModes, vi.motivations] : [];
    return arrays.some(a => Array.isArray(a) && a.length > 0) || Boolean(city && city.trim());
  }, [matchingProfile]);

  const matchPercentage = useMemo(() => {
    if (!opportunity || !hasProfile) return 0;
    const opp = opportunity as Volunteering & { dailySkills?: string[]; availabilityDays?: string[]; availabilityTimes?: string[] };
    const { score } = scoreMatch({
      id: opp.id,
      skills: opp.skills ?? null,
      dailySkills: opp.dailySkills ?? null,
      socialArea: opp.socialArea ?? null,
      interests: opp.interests ?? null,
      languages: opp.languages ?? null,
      location: { city: opp.location?.city ?? null, type: opp.location?.type ?? null },
      availabilityDays: opp.availabilityDays ?? null,
      availabilityTimes: opp.availabilityTimes ?? null,
    }, matchingProfile);
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [opportunity, matchingProfile, hasProfile]);

  const matchTone = matchPercentage >= 75
    ? { text: 'text-green-700', bar: 'bg-green-500' }
    : matchPercentage >= 50
      ? { text: 'text-amber-700', bar: 'bg-amber-500' }
      : { text: 'text-muted-foreground', bar: 'bg-muted-foreground/40' };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setProfileUrl(window.location.href);
    }
  }, []);

  // Hava durumu — yalnız fiziksel (Saha/Hibrit) gönüllülüklerde aktivite gün(ler)i için.
  const locType = opportunity?.location?.type;
  const coords = opportunity?.location?.coordinates;
  const oppCity = opportunity?.location?.city;
  const oppDistrict = opportunity?.location?.district;
  useEffect(() => {
    if (!opportunity) return;
    if (locType !== 'Saha' && locType !== 'Hibrit') {
      setWeather(null);
      return;
    }
    let active = true;
    const params = new URLSearchParams({ days: '3' });
    if (coords?.lat != null && coords?.lon != null) {
      params.set('lat', String(coords.lat));
      params.set('lon', String(coords.lon));
    } else if (oppCity) {
      params.set('city', oppCity);
      if (oppDistrict) params.set('district', oppDistrict);
    } else {
      return;
    }
    fetch(`/api/weather?${params.toString()}`)
      .then(r => (r.ok ? r.json() : null))
      .then((j: { days?: WeatherDay[] } | null) => {
        if (active && j?.days?.length) setWeather(j.days);
      })
      .catch(() => { /* hava durumu best-effort; hata sayfayı bozmaz */ });
    return () => { active = false; };
  }, [opportunity, locType, coords?.lat, coords?.lon, oppCity, oppDistrict]);

  if (isOppLoading) {
    return (
        <div className="animate-in fade-in-0 pb-20">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-6 -mt-16">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
  }

  if (!opportunity) {
    notFound();
  }

  // date+saat formatı: önce "yyyy-MM-dd HH:mm", saat yoksa "yyyy-MM-dd" tarihe düşer.
  const safeFormatDateTime = (dateStr?: string): string => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return '—';
    try {
      let d = parse(dateStr, 'yyyy-MM-dd HH:mm', new Date());
      if (isNaN(d.getTime())) {
        d = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (isNaN(d.getTime())) return dateStr;
        return format(d, 'dd MMMM yyyy', { locale: tr });
      }
      return format(d, 'dd MMMM yyyy, HH:mm', { locale: tr });
    } catch {
      return dateStr;
    }
  };

  const daysRemaining = (() => {
    if (!opportunity.dates?.applicationEnd) return -1;
    try {
      let d = parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd HH:mm', new Date());
      if (isNaN(d.getTime())) d = parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd', new Date());
      if (isNaN(d.getTime())) return -1;
      return differenceInDays(d, new Date());
    } catch {
      return -1;
    }
  })();
  const countdownText = daysRemaining > 0 ? `Son ${daysRemaining} Gün` : (daysRemaining === 0 ? 'Son Gün' : 'Süre Doldu');
  const opp = opportunity as Volunteering & { providesCertificate?: boolean; amenities?: { providesCertificate?: boolean }; taskType?: string; commitment?: string };
  const providesCertificate = opp.providesCertificate ?? opp.amenities?.providesCertificate ?? false;
  const taskType = opp.taskType || opp.commitment || '—';
  const isPhysical = locType === 'Saha' || locType === 'Hibrit';

  // Başvuru durumu (events RSVP benzeri) — başvurmuş kullanıcıya yaka kartı / wallet / NFC göster.
  const hasApplied = Boolean(authUser && (myApplications?.length ?? 0) > 0);
  // Başvurunun güncel durumu (Beklemede/Onaylandı/Reddedildi) — liste+detayda gösterilir.
  const applicationStatus = (myApplications && myApplications.length > 0)
    ? (myApplications[0].status || 'Beklemede')
    : null;
  // Wallet / NFC / Yaka Kartı yalnız başvuru ONAYLANINCA aktif.
  const isApproved = applicationStatus === 'Onaylandı';

  // Adres tarifi linki — coordinates varsa lat/lon, yoksa açık adres metni.
  const directionsUrl = (() => {
    if (coords?.lat != null && coords?.lon != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`;
    }
    const addr = [opportunity.location.address, opportunity.location.district, opportunity.location.city].filter(Boolean).join(' ');
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  })();

  const organizerLogo = opportunity.organizerLogoUrl || ngo?.avatarUrl;

  // Sosyal Etki Mali Değeri
  const impactValueTRY = formatTRY(socialImpactValueTRY(opportunity.hours?.total ?? 0));

  // Yaka kartı için kullanıcı bilgisi (events pattern)
  const cardUser = (userData || {
    name: authUser?.displayName || authUser?.email?.split('@')[0] || 'Gönüllü',
    personalInfo: { email: authUser?.email || '', phone: '', social: {} as Record<string, string> },
    volunteerInfo: { education: [] as unknown[] },
  }) as UserType;
  const nameQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(cardUser.name)}`;
  const backQrData = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${cardUser.name}`,
    `TEL;TYPE=CELL:${cardUser.personalInfo?.phone || ''}`,
    `EMAIL:${cardUser.personalInfo?.email || ''}`,
    'END:VCARD',
  ].join('\n');
  const backQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(backQrData)}`;

  const handleDownloadBadgePdf = async () => {
    if (!cardFrontRef.current || !cardBackRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const opts = { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false };
      const frontCanvas = await html2canvas(cardFrontRef.current, opts);
      const backCanvas = await html2canvas(cardBackRef.current, opts);
      const MM = (mm: number) => Math.round((mm / 25.4) * 150);
      const pageW = MM(210);
      const pageH = MM(297);
      const out = document.createElement('canvas');
      out.width = pageW;
      out.height = pageH;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Canvas bağlamı oluşturulamadı.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageW, pageH);
      const cardW = MM(95);
      const cardH = Math.round((cardW * 148) / 105);
      const gap = MM(6);
      const totalW = cardW * 2 + gap;
      const startX = Math.round((pageW - totalW) / 2);
      const startY = MM(16);
      ctx.drawImage(frontCanvas, startX, startY, cardW, cardH);
      ctx.drawImage(backCanvas, startX + cardW + gap, startY, cardW, cardH);
      ctx.fillStyle = '#999999';
      ctx.font = `${MM(3.2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('hangel — gönüllü yaka kartı', pageW / 2, startY + cardH + MM(8));
      const dataUrl = out.toDataURL('image/jpeg', 0.85);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `yaka-karti-${opportunity.id || 'hangel'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'Yaka kartı oluşturulamadı', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAddToWallet = async () => {
    if (!authUser) return;
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/passkit/volunteer/${opportunity.id}`, {
        headers: { authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error('PassKit hazır değil');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.location.href = url;
    } catch (e) {
      toast({ variant: 'destructive', title: 'Apple Wallet hazırlanamadı', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
    }
  };

  const handleNfcRead = async () => {
    try {
      const { readNdefUrl } = await import('@/lib/native-nfc');
      const result = await readNdefUrl();
      if (!result.ok || !result.url) {
        toast({ variant: 'destructive', title: 'NFC okunamadı', description: result.errorMessage || 'Etiket okunamadı.' });
        return;
      }
      toast({ title: 'NFC etiketi okundu', description: result.url });
    } catch (e) {
      toast({ variant: 'destructive', title: 'NFC hatası', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
    }
  };

  const handleApply = () => {
    if (!authUser) {
        toast({ variant: 'destructive', title: "Giriş Yapmalısınız", description: "Başvuru yapmak için lütfen oturum açın." });
        const redirectUrl = `/login/selection?action=login&redirect=${encodeURIComponent(window.location.pathname)}`;
        router.push(redirectUrl);
        return;
    }

    setIsApplying(true);
    const appRef = collection(db, COLLECTIONS.applications);
    const today = new Date().toISOString().split('T')[0];

    // Perform non-blocking write to Firestore
    const createPromise = addDocumentNonBlocking(appRef, {
        userId: authUser.uid,
        userName: authUser.displayName || authUser.email?.split('@')[0] || 'Gönüllü',
        title: opportunity.title,
        type: 'Gönüllülük',
        org: opportunity.organization,
        entityId: opportunity.id,
        date: today,
        status: 'Beklemede',
        location: opportunity.location.city
    });

    // Başvuru sürecini telefon ekranında canlı etkinlik (Live Activity) olarak göster (iOS native; web no-op).
    // Saha/Hibrit gönüllülükte hava durumu + STK logosu da geçilir (best-effort).
    void (async () => {
      let weatherEmoji = ''; let weatherTemp = '';
      const vloc = opportunity.location;
      if (vloc && (vloc.type === 'Saha' || vloc.type === 'Hibrit') && vloc.city) {
        try {
          const qs = vloc.coordinates
            ? `lat=${vloc.coordinates.lat}&lon=${vloc.coordinates.lon}`
            : `city=${encodeURIComponent(vloc.city)}&district=${encodeURIComponent(vloc.district || '')}`;
          const wr = await fetch(`/api/weather?${qs}&days=7`);
          if (wr.ok) {
            const wj = await wr.json() as { days?: Array<{ date: string; emoji: string; tempMax: number }> };
            const dayKey = (opportunity.dates?.eventStart || '').slice(0, 10);
            const day = wj.days?.find(d => d.date === dayKey) || wj.days?.[0];
            if (day) { weatherEmoji = day.emoji || ''; weatherTemp = `${day.tempMax}°`; }
          }
        } catch { /* hava durumu best-effort */ }
      }
      await startVolunteerTaskActivity({
        taskTitle: opportunity.title,
        ngoName: opportunity.organization || '',
        location: opportunity.location?.city || '',
        taskId: opportunity.id,
        weatherEmoji,
        weatherTemp,
        organizerLogoUrl: opportunity.organizerLogoUrl || '',
      });
    })();

    // Başvuru oluşunca 3 tarafa (kullanıcı + STK yöneticisi + süper-admin)
    // fan-out bildirim. Best-effort: hata başvuru akışını bozmaz.
    createPromise
        .then(async (docRef) => {
            if (!docRef) return;
            try {
                const token = await authUser.getIdToken();
                await fetch('/api/volunteer/application-notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ applicationId: docRef.id, stage: 'applied' }),
                });
            } catch (notifyErr) {
                console.error('[volunteering] application-notify failed', notifyErr);
            }
        })
        .catch(() => { /* addDocumentNonBlocking kendi hata kanalını yönetir */ });

    // Simulated UX delay
    setTimeout(() => {
        setIsApplying(false);
        toast({
            title: "Başvurunuz Alındı",
            description: "Gönüllülük başvurunuz başarıyla iletildi. Durumu profilinizden takip edebilirsiniz.",
        });
        router.push('/my-applications');
    }, 1000);
  };

  return (
    <div className="animate-in fade-in-0 bg-background min-h-screen">
        <div className="relative h-48 w-full bg-muted">
            {ngo?.coverPhotoUrl && <Image src={ngo.coverPhotoUrl} alt={`${ngo.name} Cover`} fill className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
            <div className="absolute top-4 left-4 z-10">
              <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full" aria-label="Geri">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-4 right-4 z-10">
                <ShareButtons url={profileUrl} title={`${opportunity.title} - hangel Gönüllülük İlanı`} />
            </div>
        </div>

        <div className="p-4 space-y-6 -mt-16 relative z-10">
            <div className='p-1 bg-background/80 backdrop-blur-xl rounded-2xl'>
                 <h1 className="text-2xl font-bold font-headline text-foreground p-3">{opportunity.title}</h1>
                 <Link href={`/ngos/${opportunity.ngoId}`} className="text-foreground/90 text-base font-medium hover:underline px-3 pb-3 block">{opportunity.organization}</Link>
            </div>

            {authUser && hasProfile && (
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                            <span className="font-bold text-muted-foreground">Profil Uygunluğun</span>
                            <span className={`font-black text-base ${matchTone.text}`}>%{matchPercentage}</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full ${matchTone.bar} rounded-full transition-all duration-700 ease-out`}
                                style={{ width: `${matchPercentage}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4 mt-4">
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="font-bold text-lg text-primary">{opportunity.points}</p>
                            <p className="text-xs text-muted-foreground">Etki Puanı</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded-lg relative">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button type="button" className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-primary" aria-label="Sosyal etki mali değeri nasıl hesaplanır?">
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                                    {socialImpactExplanation()}
                                </PopoverContent>
                            </Popover>
                            <p className="font-bold text-lg text-green-700">{impactValueTRY}</p>
                            <p className="text-xs text-muted-foreground">Sosyal Etki Mali Değeri</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg">Açıklama</CardTitle></CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {opportunity.description}
                    </CardContent>
                </Card>

                {/* Hava durumu — yalnız Saha/Hibrit */}
                {isPhysical && weather && weather.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Hava Durumu</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar">
                                {weather.map((d) => (
                                    <div key={d.date} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-muted/50 min-w-[88px] shrink-0 text-center">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{safeFormatDateTime(d.date).split(',')[0]}</span>
                                        <span className="text-2xl leading-none">{d.emoji}</span>
                                        <span className="text-[11px] font-medium">{d.label}</span>
                                        <span className="text-xs font-bold">{d.tempMax}° / {d.tempMin}°</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                 <Card>
                    <CardHeader><CardTitle className="text-lg">İlan Detayları</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <div className='flex items-center gap-3'><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.location.city}, {opportunity.location.district} ({opportunity.location.type})</span></div>
                        <div className='flex items-center gap-3'><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.commitment} ({taskType})</span></div>
                        <div className='flex items-center gap-3'><Award className="h-4 w-4 text-muted-foreground" /> <span>Sertifika: {providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</span></div>
                        <div className='flex items-center gap-3'><Users className="h-4 w-4 text-muted-foreground" /> <span>Gönüllü Kapasitesi: {opportunity.volunteerCount.needed}{typeof opportunity.volunteerCount.applications === 'number' ? ` (Başvuran: ${opportunity.volunteerCount.applications})` : ''}</span></div>
                    </CardContent>
                </Card>

                {/* Fiziksel (Saha/Hibrit) → tam adres + Adres Tarifi Al */}
                {isPhysical && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Konum</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-3">
                            {opportunity.location.address && (
                                <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /> <span>{opportunity.location.address}</span></div>
                            )}
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" /> <span>{opportunity.location.district}, {opportunity.location.city}</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-fit h-8 rounded-lg text-xs font-bold gap-1.5 border-primary/20 text-primary hover:bg-primary/5" onClick={() => window.open(directionsUrl, '_blank')}>
                                <Map className="h-3.5 w-3.5" /> Adres Tarifi Al
                            </Button>
                        </CardContent>
                    </Card>
                )}

                 <Card>
                    <CardHeader><CardTitle className="text-lg">Tarihler</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className='flex justify-between text-sm gap-3'><span className='text-muted-foreground font-medium'>Başvuru Başlangıç:</span><span className='font-normal text-right'>{safeFormatDateTime(opportunity.dates?.applicationStart)}</span></div>
                        <div className='flex justify-between text-sm gap-3'><span className='text-muted-foreground font-medium'>Başvuru Bitiş:</span><span className='font-normal text-primary text-right'>{safeFormatDateTime(opportunity.dates?.applicationEnd)}</span></div>
                        <div className='flex justify-between text-sm gap-3'><span className='text-muted-foreground font-medium'>Aktivite Başlangıç:</span><span className='font-normal text-right'>{safeFormatDateTime(opportunity.dates?.eventStart)}</span></div>
                        <div className='flex justify-between text-sm gap-3'><span className='text-muted-foreground font-medium'>Aktivite Bitiş:</span><span className='font-normal text-right'>{safeFormatDateTime(opportunity.dates?.eventEnd)}</span></div>
                    </CardContent>
                </Card>

                {/* Katılım Koşulu */}
                {opportunity.participationCondition && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Katılım Koşulu</CardTitle></CardHeader>
                        <CardContent className="text-sm">
                            <div className="flex items-start gap-3"><UserCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span className="text-muted-foreground">{opportunity.participationCondition}</span></div>
                        </CardContent>
                    </Card>
                )}

                {/* Organize eden STK — başlık "Organize Eden: {ad}", tıklanınca profile gider */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Organize Eden:{' '}
                            <Link href={`/ngos/${opportunity.ngoId}`} className="hover:underline text-primary">{ngo?.name || opportunity.organization}</Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ngo && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-4">{ngo.about}</p>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={`/ngos/${ngo.id}`}>Kuruluş Profilini İncele</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Başvuru durumu rozeti — başvuruldu/onaylandı/kabul edilmedi */}
                {applicationStatus && (
                    <div className={cn(
                        'rounded-2xl border p-4 flex items-center gap-3',
                        applicationStatus === 'Onaylandı' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : applicationStatus === 'Reddedildi' ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800',
                    )}>
                        {applicationStatus === 'Onaylandı' ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                            : applicationStatus === 'Reddedildi' ? <XCircle className="h-5 w-5 shrink-0" />
                                : <Clock className="h-5 w-5 shrink-0" />}
                        <div className="min-w-0">
                            <p className="font-bold text-sm leading-tight">
                                {applicationStatus === 'Onaylandı' ? 'Başvurun onaylandı 🎉'
                                    : applicationStatus === 'Reddedildi' ? 'Başvurun kabul edilmedi'
                                        : 'Başvurun alındı'}
                            </p>
                            <p className="text-xs opacity-80">
                                {applicationStatus === 'Onaylandı' ? 'Etkinlik günü yaka kartını hazır bulundur.'
                                    : applicationStatus === 'Reddedildi' ? 'Başka ilanlara başvurmayı deneyebilirsin.'
                                        : 'Kurum başvurunu değerlendiriyor; sonuç bildirilecek.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Başvuru onaylanmış kullanıcıya: Wallet + NFC + Yaka Kartı (yalnız Onaylandı) */}
                {hasApplied && !isApproved && applicationStatus !== 'Reddedildi' && (
                    <p className="text-xs text-muted-foreground px-1">
                        Başvurun onaylanınca yaka kartın, Apple Wallet ve NFC seçeneklerin burada görünecek.
                    </p>
                )}
                {isApproved && (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={handleAddToWallet}
                            className="h-14 rounded-2xl font-black px-4 flex items-center gap-2"
                            aria-label="Apple Wallet'a Ekle"
                            title="Apple Wallet'a Ekle"
                        >
                            🎫 Wallet
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={handleNfcRead}
                            className="h-14 rounded-2xl font-black px-4 flex items-center gap-2"
                            aria-label="NFC Oku"
                            title="NFC Oku"
                        >
                            📲 NFC
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="lg" variant="secondary" className="h-14 rounded-2xl font-black px-4">Yaka Kartı</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-2xl font-black tracking-tight">Gönüllü Yaka Kartın</AlertDialogTitle>
                                    <AlertDialogDescription className="text-base font-medium">
                                        Gönüllülük için QR kodlu yaka kartın oluşturuldu. Sahada kartını hazır bulundur.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="my-6 flex flex-col items-center gap-8">
                                    <div>
                                    <h3 className="font-bold text-center mb-3 text-xs uppercase tracking-widest text-muted-foreground">Kart Ön Yüzü</h3>
                                    <div ref={cardFrontRef} className="w-full max-w-[300px] aspect-[105/148] bg-white rounded-3xl shadow-2xl border flex flex-col justify-between overflow-hidden mx-auto">
                                        <div className="p-4 bg-[#f5f5f7] flex justify-between items-center border-b">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xl font-black text-primary">hangel</span>
                                                {organizerLogo && (
                                                    <Avatar className="h-8 w-8 bg-white border shrink-0">
                                                        <AvatarImage src={organizerLogo} alt={opportunity.organization} className="p-1 object-contain"/>
                                                        <AvatarFallback>{opportunity.organization.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                            <span className="h-8 w-8 rounded-full border-2 border-muted-foreground/25 bg-white shrink-0" aria-hidden />
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col justify-between items-center text-center">
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-foreground leading-tight">{opportunity.title}</p>
                                                <p className="text-xs font-bold text-primary uppercase">{safeFormatDateTime(opportunity.dates?.eventStart)}</p>
                                            </div>
                                            <div className='w-full'>
                                                <Image src={nameQrCodeUrl} alt="İsim QR Kodu" width={100} height={100} className="mx-auto my-4 rounded-2xl border p-1 bg-white shadow-sm" />
                                                <div className="bg-primary text-primary-foreground py-1.5 w-full rounded-lg mb-2">
                                                    <p className="text-sm font-black uppercase tracking-[0.2em]">GÖNÜLLÜ</p>
                                                </div>
                                                <p className="text-xl font-black pt-2 truncate">{cardUser.name}</p>
                                                {cardUser.volunteerInfo?.education?.[0]?.school && (
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 truncate">
                                                        {cardUser.volunteerInfo.education[0].school}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className='bg-[#f5f5f7] p-3 text-[10px] text-muted-foreground border-t text-center font-mono'>
                                            <p>{opportunity.organization}</p>
                                        </div>
                                    </div>
                                    </div>

                                    <div>
                                    <h3 className="font-bold text-center mb-3 text-xs uppercase tracking-widest text-muted-foreground">Kart Arka Yüzü</h3>
                                    <div ref={cardBackRef} className="w-full max-w-[300px] aspect-[105/148] bg-white rounded-3xl shadow-2xl border flex flex-col justify-between overflow-hidden mx-auto">
                                        <div className="p-4 bg-[#f5f5f7] flex justify-between items-center border-b">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xl font-black text-primary">hangel</span>
                                                {organizerLogo && (
                                                    <Avatar className="h-8 w-8 bg-white border shrink-0">
                                                        <AvatarImage src={organizerLogo} alt={opportunity.organization} className="p-1 object-contain"/>
                                                        <AvatarFallback>{opportunity.organization.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                            <span className="h-8 w-8 rounded-full border-2 border-muted-foreground/25 bg-white shrink-0" aria-hidden />
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-6">
                                            <h3 className="text-lg font-black uppercase tracking-widest">İLETİŞİM BİLGİLERİ</h3>
                                            <div className="my-2">
                                                <Image src={backQrCodeUrl} alt="İletişim QR Kodu" width={120} height={120} className="mx-auto rounded-2xl border-2 border-primary/20 p-1 bg-white shadow-sm" />
                                            </div>
                                            <div className="text-left w-full space-y-3">
                                                <div className="flex items-center gap-3"><UserCheck className="h-4 w-4 text-primary" /> <span className="font-bold text-sm">{cardUser.name}</span></div>
                                                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> <span className="text-xs font-bold">{cardUser.personalInfo?.email || ''}</span></div>
                                                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> <span className="text-xs font-bold">{cardUser.personalInfo?.phone || ''}</span></div>
                                            </div>
                                        </div>
                                        <div className='bg-primary/5 p-3 text-[10px] text-primary font-black border-t text-center uppercase tracking-widest'>
                                            <p>Sadece Gönüllülük Alanında Geçerlidir</p>
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
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> JPG hazırlanıyor…</>
                                        ) : (
                                            <><Download className="mr-2 h-4 w-4" /> Yaka Kartını İndir</>
                                        )}
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}

                {/* QR + Paylaş — sayfa altı (üstte de var) */}
                <Card>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <HeartHandshake className="h-4 w-4 text-primary" /> Bu gönüllülük ilanını paylaş
                        </div>
                        <ShareButtons url={profileUrl} title={`${opportunity.title} - hangel Gönüllülük İlanı`} />
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg p-4 border-t mt-auto">
             <Button
                size="lg"
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                disabled={isApplying || daysRemaining < 0}
                onClick={handleApply}
            >
              {isApplying ? <Loader2 className="animate-spin h-5 w-5" /> : daysRemaining < 0 ? 'Başvuru Süresi Doldu' : `${countdownText}, Hemen Başvur`}
            </Button>
        </div>
    </div>
  );
}
