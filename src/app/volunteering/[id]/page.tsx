'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, CalendarPlus, MapPin, Award, Loader2, Users, UserCheck, Map, Download, Info, HeartHandshake, CheckCircle2, XCircle, Clock, Wallet, Nfc, Star, IdCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openExternalUrl } from '@/lib/capacitor';
import { DualCountdown } from '@/components/events/event-countdown';
import { RewardBanner } from '@/components/rewards/reward-banner';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import { DistanceBadge } from '@/components/shared/distance-badge';
import { AskManagerButton } from '@/components/shared/ask-manager-button';
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
import { Progress } from '@/components/ui/progress';
import { EvaluationDialog } from '@/components/shared/evaluation-dialog';
import { questionsForDirection } from '@/lib/evaluations';
import Image from 'next/image';
import { differenceInDays, format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, updateDoc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Volunteering, NGO, User as UserType } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTIONS } from '@/firebase/collections';
import { scoreMatch, type MatchingUserProfile } from '@/lib/volunteer-matching';
import { useVerifiedAction } from '@/hooks/use-verified-action';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { startVolunteerTaskActivity } from '@/lib/native-live-activity';
import { celebrate } from '@/lib/celebrate';
import { socialImpactValueTRY, formatTRY, socialImpactExplanation } from '@/lib/social-impact';
import { DetailHero } from '@/components/detail/detail-hero';
import { DetailStickyBar } from '@/components/detail/detail-body';

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
  const requireVerifiedEmail = useVerifiedAction();
  const requireAuth = useRequireAuth();
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

  // Tamamlama kaydı — kullanıcının bu göreve dair onaylı (ngoApproved) tamamlaması var mı.
  // Varsa gönüllü → STK değerlendirme akışı açılabilir.
  const myCompletionsQuery = useMemoFirebase(() => {
    if (!db || !authUser || !id) return null;
    return query(
      collection(db, COLLECTIONS.volunteerCompletions),
      where('userId', '==', authUser.uid),
      where('taskId', '==', id),
    );
  }, [db, authUser, id]);
  const { data: myCompletions } = useCollection<{ id: string; ngoId?: string; ngoApproved?: boolean; status?: string }>(myCompletionsQuery);

  // Değerlendirme (gönüllü → STK) dialog durumu.
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isEvalSubmitting, setIsEvalSubmitting] = useState(false);

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
    ? { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' }
    : matchPercentage >= 50
      ? { text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' }
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
  // Güvenli location objesi — render'da doğrudan oppLoc.X okunursa
  // (location undefined/string ise) TypeError → sayfa açılmıyordu.
  const oppLoc = (opportunity && typeof opportunity.location === 'object' && opportunity.location !== null
    ? opportunity.location
    : {}) as { type?: string; coordinates?: { lat: number; lon: number }; address?: string; city?: string; district?: string };
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
            <Skeleton className="h-[42vh] min-h-[320px] w-full rounded-none" />
            <div className="mx-auto max-w-5xl px-5 md:px-8 pt-10 space-y-8">
                <Skeleton className="h-10 w-2/3 rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-44 w-full rounded-2xl" />
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

  // Tarih + ayrı saat alanını birleştirip "dd MMMM yyyy, HH:mm" üretir.
  // Saat boş/geçersizse yalnız tarih döner ("dd MMMM yyyy").
  const formatDateWithTime = (dateStr?: string, timeStr?: string): string => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return '—';
    try {
      const dateOnly = parse(dateStr.slice(0, 10), 'yyyy-MM-dd', new Date());
      if (isNaN(dateOnly.getTime())) return safeFormatDateTime(dateStr);
      const t = (timeStr || '').trim();
      if (t && /^\d{1,2}:\d{2}$/.test(t)) {
        const combined = parse(`${dateStr.slice(0, 10)} ${t}`, 'yyyy-MM-dd HH:mm', new Date());
        if (!isNaN(combined.getTime())) return format(combined, 'dd MMMM yyyy, HH:mm', { locale: tr });
      }
      // Saat ayrı alanda yoksa dateStr içinde gömülü olabilir (örn. "yyyy-MM-dd HH:mm").
      return safeFormatDateTime(dateStr);
    } catch {
      return safeFormatDateTime(dateStr);
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
  const opp = opportunity as Volunteering & {
    providesCertificate?: boolean;
    amenities?: { providesCertificate?: boolean };
    taskType?: string;
    commitment?: string;
    dates?: Volunteering['dates'] & {
      applicationStartTime?: string;
      applicationEndTime?: string;
      eventStartTime?: string;
      eventEndTime?: string;
    };
    volunteerCount?: Volunteering['volunteerCount'] & { approved?: number };
  };
  const providesCertificate = opp.providesCertificate ?? opp.amenities?.providesCertificate ?? false;
  const taskType = opp.taskType || opp.commitment || '—';
  const isPhysical = locType === 'Saha' || locType === 'Hibrit';

  // Organize eden STK adı — ngo adı öncelikli, yoksa ilan placeholder'ı.
  const organizerName = ngo?.name || opportunity.organization;
  // Yaka kartı logosu yoksa STK adının baş harfleri (ilk iki kelimeden).
  const organizerInitials = (organizerName || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || 'STK';

  // Gönüllü sayıları: İhtiyaç / Başvuran / Onaylanan.
  const neededCount = opp.volunteerCount?.needed ?? 0;
  const applicationsCount = opp.volunteerCount?.applications ?? 0;
  const approvedCount = opp.volunteerCount?.approved ?? 0;

  // Başvuru durumu (events RSVP benzeri) — başvurmuş kullanıcıya yaka kartı / wallet / NFC göster.
  const hasApplied = Boolean(authUser && (myApplications?.length ?? 0) > 0);
  // Başvurunun güncel durumu (Beklemede/Onaylandı/Reddedildi) — liste+detayda gösterilir.
  const applicationStatus = (myApplications && myApplications.length > 0)
    ? (myApplications[0].status || 'Beklemede')
    : null;
  // Wallet / NFC / Yaka Kartı yalnız başvuru ONAYLANINCA aktif.
  const isApproved = applicationStatus === 'Onaylandı';

  // Onaylı tamamlama kaydı (volunteerCompletions, ngoApproved=true) → gönüllü STK'yı değerlendirebilir.
  const approvedCompletion = (myCompletions ?? []).find(
    (c) => c.ngoApproved === true || c.status === 'approved',
  ) || null;

  // Adres tarifi linki — coordinates varsa lat/lon, yoksa açık adres metni.
  const directionsUrl = (() => {
    if (coords?.lat != null && coords?.lon != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`;
    }
    const addr = [oppLoc.address, oppLoc.district, oppLoc.city].filter(Boolean).join(' ');
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  })();

  const organizerLogo = opportunity.organizerLogoUrl || ngo?.avatarUrl;

  // ── DetailHero künye verileri — etkinlik künyesiyle aynı dil ──
  // Tür rozeti: görev tipi (taskType) > commitment; ikincil rozet: konum türü.
  const heroTypeLabel = opp.taskType || opportunity.commitment || 'Gönüllülük';
  // Aktivite başlangıç tarih/saat (varsa) künyede gösterilir; yoksa başvuru bitişine düşme YOK (hero sade kalır).
  const heroDateTime = formatDateWithTime(opp.dates?.eventStart, opp.dates?.eventStartTime);
  const heroDateLabel = heroDateTime !== '—' ? heroDateTime.split(',')[0] : undefined;
  const heroTimeLabel = heroDateTime !== '—' ? (heroDateTime.split(',')[1]?.trim() || undefined) : undefined;
  const heroLocationLabel = locType === 'Online'
    ? 'Online'
    : [oppLoc.district, oppLoc.city].filter(Boolean).join(', ') || undefined;

  // Sosyal Etki Mali Değeri
  const impactValueTRY = formatTRY(socialImpactValueTRY(opportunity.hours?.total ?? 0));

  // Yaka kartı için kullanıcı bilgisi (events pattern)
  const cardUser = (userData || {
    name: authUser?.displayName || authUser?.email?.split('@')[0] || 'Gönüllü',
    personalInfo: { email: authUser?.email || '', phone: '', social: {} as Record<string, string> },
    volunteerInfo: { education: [] as unknown[] },
  }) as UserType;
  const nameQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(cardUser.name)}`;
  // Doğum tarihi — kartta GÖSTERİLMEZ; yalnız arka QR (vCard BDAY) içinde kodlanır.
  const cardBirthRaw = (cardUser.personalInfo as { birthDate?: string } | undefined)?.birthDate || '';
  // hangel profil linki — kartta gösterilmez; yalnız arka QR (vCard URL) içinde.
  const profileUrlForCard = authUser?.uid ? `hangel.org/profile/${authUser.uid}` : '';
  // Arka QR = vCard: tel + mail + doğum + profil URL kodlu (metin olarak gösterilmez).
  const backQrData = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${cardUser.name}`,
    `TEL;TYPE=CELL:${cardUser.personalInfo?.phone || ''}`,
    `EMAIL:${cardUser.personalInfo?.email || ''}`,
    cardBirthRaw ? `BDAY:${cardBirthRaw}` : '',
    profileUrlForCard ? `URL:https://${profileUrlForCard}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\n');
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
      // Passport (çalışan) ile aynı yol: ?token= query + openExternalUrl
      // (sistem tarayıcısı → .pkpass → Apple Wallet "Ekle" sayfası).
      const idToken = await authUser.getIdToken();
      const url = new URL(`/api/passkit/volunteer/${opportunity.id}?token=${encodeURIComponent(idToken)}`, window.location.origin).toString();
      await openExternalUrl(url);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Apple Wallet açılamadı', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
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

  // Takvime ekle — /ics endpoint'ini sistem tarayıcısında açar (.ics → takvim uygulaması).
  const handleAddToCalendar = async () => {
    try {
      const url = new URL(`/api/volunteering/${opportunity.id}/ics`, window.location.origin).toString();
      await openExternalUrl(url);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Takvime eklenemedi', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
    }
  };

  // Gönüllü → STK değerlendirmesi gönder (10 soru, 1-5). refId = tamamlama kaydı id'si.
  const handleSubmitEvaluation = async (answers: Record<string, number>, comment?: string) => {
    if (!authUser || !approvedCompletion) return;
    setIsEvalSubmitting(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/evaluations/volunteer-to-ngo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          kind: 'volunteer',
          refId: approvedCompletion.id,
          ngoId: approvedCompletion.ngoId || opportunity.ngoId,
          answers,
          comment,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(e?.message || 'Değerlendirme gönderilemedi.');
      }
      setIsEvalOpen(false);
      // Kutlama: gönüllülük değerlendirmesi tamamlandı — konfeti + native haptik + bant.
      celebrate({ title: 'Değerlendirmen alındı 🧡', message: 'Birlikte umudu büyütüyoruz' });
      toast({ title: 'Değerlendirmen alındı 🧡', description: 'Geri bildirimin için teşekkürler.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
    } finally {
      setIsEvalSubmitting(false);
    }
  };

  const handleApply = () => {
    // ADIM 7 — Misafir/Keşfet: anonim kullanıcı eylem anında giriş'e davet edilir
    // (sayfa bloklanmaz). useVerifiedAction'dan ÖNCE çağrılır.
    if (!requireAuth({ title: 'Başvuru için giriş yap', description: 'Gönüllülük başvurusu yapmak için giriş yap ya da hemen kayıt ol.' })) return;
    if (!authUser) return; // requireAuth zaten yönlendirdi; TS daraltması için.

    // Hassas eylem kapısı: gönüllülük başvurusu için e-posta doğrulaması iste
    // (yalnız e-posta/password ile kayıt olanlar; telefon/WhatsApp etkilenmez).
    if (!requireVerifiedEmail()) return;

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
        location: oppLoc.city
    });

    // İlanın başvuran sayacını atomik olarak artır (best-effort; hata başvuru akışını bozmaz).
    void updateDoc(doc(db, COLLECTIONS.volunteering, opportunity.id), {
        'volunteerCount.applications': increment(1),
    }).catch(() => { /* sayaç best-effort */ });

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
      // Aktivite başlangıç/bitiş epoch — LA'da başlamadan önce geri sayım, sırasında akış-line.
      const dts = opportunity.dates as { eventStart?: string; eventStartTime?: string; eventEnd?: string; eventEndTime?: string } | undefined;
      const toEpoch = (d?: string, t?: string): number => {
        if (!d) return 0;
        const base = d.slice(0, 10);
        const s = t ? `${base} ${t}` : base;
        const dt = parse(s, t ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd', new Date());
        return isNaN(dt.getTime()) ? 0 : dt.getTime();
      };
      await startVolunteerTaskActivity({
        taskTitle: opportunity.title,
        ngoName: opportunity.organization || '',
        location: opportunity.location?.city || '',
        taskId: opportunity.id,
        weatherEmoji,
        weatherTemp,
        // İlan doc'unda logo yoksa NGO avatarına düş → Live Activity'de org logosu hep görünür.
        organizerLogoUrl: organizerLogo || '',
        activityStartEpoch: toEpoch(dts?.eventStart, dts?.eventStartTime),
        activityEndEpoch: toEpoch(dts?.eventEnd, dts?.eventEndTime),
      });
    })();

    // Gerçek yazımı BEKLE — başarı toast'ı + yönlendirme yalnızca yazma çözülünce
    // (eskiden setTimeout(1000) ile yazımdan bağımsız "başarılı" gösteriliyordu).
    // addDocumentNonBlocking hata olursa undefined'e çözülür (errorEmitter'a da iter).
    (async () => {
        try {
            const docRef = await createPromise;
            if (!docRef) {
                // Yazım başarısız (izin/ağ) — kullanıcıya dürüst geri bildirim.
                toast({ variant: 'destructive', title: 'Başvuru gönderilemedi', description: 'Lütfen tekrar dene.' });
                return;
            }

            // Başvuru oluşunca 3 tarafa (kullanıcı + STK yöneticisi + süper-admin)
            // fan-out bildirim. Best-effort: hata başvuru akışını bozmaz.
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

            toast({
                title: 'Başvurunuz Alındı',
                description: 'Gönüllülük başvurunuz başarıyla iletildi. Durumu profilinizden takip edebilirsiniz.',
            });
            router.push('/my-applications');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Başvuru gönderilemedi', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
        } finally {
            setIsApplying(false);
        }
    })();
  };

  return (
    <div className="animate-in fade-in-0 bg-background min-h-screen">
        {/* ── HERO — ORTAK DetailHero: künye (tür rozeti + tarih/konum + başlık) ── */}
        <DetailHero
            imageUrl={ngo?.coverPhotoUrl}
            imageAlt={`${organizerName} — ${opportunity.title}`}
            rounded={false}
            priority
            sizes="100vw"
            typeLabel={heroTypeLabel}
            secondaryLabel={locType}
            organizerLogoUrl={organizerLogo}
            organizerName={organizerName}
            organizerHref={`/ngos/${opportunity.ngoId}`}
            title={opportunity.title}
            dateLabel={heroDateLabel}
            timeLabel={heroTimeLabel}
            locationLabel={heroLocationLabel}
            backSlot={
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full backdrop-blur-md h-11 w-11" aria-label="Geri">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            }
            shareSlot={
                <ShareButtons url={profileUrl} title={`${opportunity.title} - hangel Gönüllülük İlanı`} buttonClassName="text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full backdrop-blur-md h-11 w-11" />
            }
        />

        {/* ── GÖVDE — ferah, iki kolonlu (web) / tek kolon (mobil) ── */}
        <div className="mx-auto max-w-5xl px-5 md:px-8 pt-10 md:pt-14 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-12 gap-y-12 items-start">

                {/* ───── SOL KOLON: özet + içerik ───── */}
                <div className="space-y-12 min-w-0">

                    {/* Profil uygunluğu — dolan progress bar */}
                    {authUser && hasProfile && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-semibold text-muted-foreground tracking-tight">Profil uygunluğun: %{matchPercentage}</span>
                                <span className={`text-2xl font-bold tracking-tight ${matchTone.text}`}>%{matchPercentage}</span>
                            </div>
                            <Progress value={matchPercentage} className="h-2 rounded-full" />
                        </div>
                    )}

                    {/* Açıklama — büyük, okunur özet */}
                    <section className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Genel bakış</h2>
                        <p className="text-lg leading-relaxed text-foreground/85 whitespace-pre-line">
                            {opportunity.description}
                        </p>
                        <RewardBanner kind="volunteering" id={id} />
                    </section>

                    {/* Etki metrikleri — sade, kenarlıksız, ferah ızgara */}
                    <section className="grid grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
                        <div className="relative bg-card p-6">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button type="button" className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors" aria-label="Etki puanı nasıl hesaplanır?">
                                        <Info className="h-4 w-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                                    Etki Puanı, iş kaleminin saatlik puanı × tahmini gönüllü saati ile hesaplanır; gönüllülüğün sembolik etki skorudur.
                                </PopoverContent>
                            </Popover>
                            <p className="text-3xl md:text-4xl font-bold tracking-tight text-primary">{opportunity.points}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Etki Puanı</p>
                        </div>
                        <div className="relative bg-card p-6">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button type="button" className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors" aria-label="Sosyal etki mali değeri nasıl hesaplanır?">
                                        <Info className="h-4 w-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                                    {socialImpactExplanation()}
                                </PopoverContent>
                            </Popover>
                            <p className="text-3xl md:text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{impactValueTRY}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Sosyal Etki Mali Değeri</p>
                        </div>
                    </section>

                    {/* Hava durumu — yalnız Saha/Hibrit */}
                    {isPhysical && weather && weather.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Hava durumu</h2>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))]">
                                {weather.map((d) => (
                                    <div key={d.date} className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-2xl border border-border bg-card min-w-[96px] shrink-0 text-center">
                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{safeFormatDateTime(d.date).split(',')[0]}</span>
                                        <span className="text-3xl leading-none">{d.emoji}</span>
                                        <span className="text-xs text-muted-foreground">{d.label}</span>
                                        <span className="text-sm font-semibold tracking-tight">{d.tempMax}° / {d.tempMin}°</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* İlan detayları — düzenli, kenarlıkla ayrılmış satırlar */}
                    <section className="space-y-5">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">İlan detayları</h2>
                        <dl className="divide-y divide-border border-t border-b border-border">
                            <div className="flex items-center gap-4 py-4">
                                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                                <dt className="sr-only">Konum</dt>
                                <dd className="text-base text-foreground">{oppLoc.city}, {oppLoc.district} ({oppLoc.type})</dd>
                            </div>
                            <div className="flex items-center gap-4 py-4">
                                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                                <dt className="sr-only">Süre / Görev</dt>
                                <dd className="text-base text-foreground">{opportunity.commitment} ({taskType})</dd>
                            </div>
                            <div className="flex items-center gap-4 py-4">
                                <Award className="h-5 w-5 text-muted-foreground shrink-0" />
                                <dt className="sr-only">Sertifika</dt>
                                <dd className="text-base text-foreground">Sertifika: {providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</dd>
                            </div>
                            <div className="flex items-start gap-4 py-4">
                                <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <dd className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-base">
                                    <span><span className="text-muted-foreground">İhtiyaç</span> <span className="font-semibold">{neededCount}</span></span>
                                    <span><span className="text-muted-foreground">Başvuran</span> <span className="font-semibold">{applicationsCount}</span></span>
                                    <span><span className="text-muted-foreground">Onaylanan</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{approvedCount}</span></span>
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* Tarihler — düzenli liste */}
                    <section className="space-y-5">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Tarihler</h2>
                        {/* Düzenleyen kurum logosu + başlamasına → başlayınca bitişe akan geri sayım */}
                        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
                            <Avatar className="h-14 w-14 border border-border bg-white shrink-0">
                                {organizerLogo && <AvatarImage src={organizerLogo} alt={organizerName} className="object-contain p-1.5" />}
                                <AvatarFallback className="text-sm font-bold text-primary">{organizerInitials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-2">
                                <p className="text-sm font-semibold tracking-tight text-foreground break-words">{organizerName}</p>
                                <DualCountdown start={opp.dates?.eventStart} startTime={opp.dates?.eventStartTime} end={opp.dates?.eventEnd} endTime={opp.dates?.eventEndTime} />
                            </div>
                        </div>
                        <dl className="divide-y divide-border border-t border-b border-border">
                            <div className="flex justify-between items-baseline gap-4 py-4">
                                <dt className="text-base text-muted-foreground">Başvuru başlangıç</dt>
                                <dd className="text-base font-medium text-right tracking-tight">{formatDateWithTime(opp.dates?.applicationStart, opp.dates?.applicationStartTime)}</dd>
                            </div>
                            <div className="flex justify-between items-baseline gap-4 py-4">
                                <dt className="text-base text-muted-foreground">Başvuru bitiş</dt>
                                <dd className="text-base font-semibold text-primary text-right tracking-tight">{formatDateWithTime(opp.dates?.applicationEnd, opp.dates?.applicationEndTime)}</dd>
                            </div>
                            <div className="flex justify-between items-baseline gap-4 py-4">
                                <dt className="text-base text-muted-foreground">Aktivite başlangıç</dt>
                                <dd className="text-base font-medium text-right tracking-tight">{formatDateWithTime(opp.dates?.eventStart, opp.dates?.eventStartTime)}</dd>
                            </div>
                            <div className="flex justify-between items-baseline gap-4 py-4">
                                <dt className="text-base text-muted-foreground">Aktivite bitiş</dt>
                                <dd className="text-base font-medium text-right tracking-tight">{formatDateWithTime(opp.dates?.eventEnd, opp.dates?.eventEndTime)}</dd>
                            </div>
                        </dl>
                    </section>

                    {/* Katılım Koşulu */}
                    {opportunity.participationCondition && (
                        <section className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Katılım koşulu</h2>
                            <div className="flex items-start gap-4">
                                <UserCheck className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <p className="text-lg leading-relaxed text-muted-foreground">{opportunity.participationCondition}</p>
                            </div>
                        </section>
                    )}

                    {/* Başvuru durumu rozeti — başvuruldu/onaylandı/kabul edilmedi */}
                    {applicationStatus && (
                        <div className={cn(
                            'rounded-2xl border p-5 flex items-center gap-4',
                            applicationStatus === 'Onaylandı' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                : applicationStatus === 'Reddedildi' ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
                        )}>
                            {applicationStatus === 'Onaylandı' ? <CheckCircle2 className="h-6 w-6 shrink-0" />
                                : applicationStatus === 'Reddedildi' ? <XCircle className="h-6 w-6 shrink-0" />
                                    : <Clock className="h-6 w-6 shrink-0" />}
                            <div className="min-w-0">
                                <p className="font-semibold text-base leading-tight tracking-tight">
                                    {applicationStatus === 'Onaylandı' ? 'Başvurun onaylandı 🎉'
                                        : applicationStatus === 'Reddedildi' ? 'Başvurun kabul edilmedi'
                                            : 'Başvurun alındı'}
                                </p>
                                <p className="text-sm opacity-80 mt-0.5">
                                    {applicationStatus === 'Onaylandı' ? 'Etkinlik günü yaka kartını hazır bulundur.'
                                        : applicationStatus === 'Reddedildi' ? 'Başka ilanlara başvurmayı deneyebilirsin.'
                                            : 'Kurum başvurunu değerlendiriyor; sonuç bildirilecek.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Başvuru onaylanmış kullanıcıya: Wallet + NFC + Yaka Kartı (yalnız Onaylandı) */}
                    {hasApplied && !isApproved && applicationStatus !== 'Reddedildi' && (
                        <p className="text-sm text-muted-foreground">
                            Başvurun onaylanınca yaka kartın, Apple Wallet ve NFC seçeneklerin burada görünecek.
                        </p>
                    )}
                    {isApproved && (
                        <section className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Onaylı gönüllü araçların</h2>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                        <AskManagerButton orgId={opportunity.ngoId} subject={`${opportunity.title} — gönüllülük hakkında`} />
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={handleAddToWallet}
                            className="h-16 rounded-2xl font-semibold flex-col gap-1.5 px-2 min-w-0"
                            aria-label="Apple Wallet'a Ekle"
                            title="Apple Wallet'a Ekle"
                        >
                            <Wallet className="h-5 w-5 shrink-0" />
                            <span className="text-[11px] text-center leading-tight break-words">Wallet</span>
                        </Button>
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={handleNfcRead}
                            className="h-16 rounded-2xl font-semibold flex-col gap-1.5 px-2 min-w-0"
                            aria-label="NFC Oku"
                            title="NFC Oku"
                        >
                            <Nfc className="h-5 w-5 shrink-0" />
                            <span className="text-[11px] text-center leading-tight break-words">NFC oku</span>
                        </Button>
                        {/* Takvime ekle — NFC yanında, onaylı kullanıcıya kalıcı buton */}
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={handleAddToCalendar}
                            className="h-16 rounded-2xl font-semibold flex-col gap-1.5 px-2 min-w-0"
                            aria-label="Takvime ekle"
                            title="Takvime ekle"
                        >
                            <CalendarPlus className="h-5 w-5 shrink-0" />
                            <span className="text-[11px] text-center leading-tight break-words">Takvime ekle</span>
                        </Button>
                        {approvedCompletion && (
                            <Button
                                size="lg"
                                variant="secondary"
                                onClick={() => setIsEvalOpen(true)}
                                className="h-16 rounded-2xl font-semibold flex-col gap-1.5 px-2 min-w-0"
                                aria-label="STK'yı değerlendir"
                                title="STK'yı değerlendir"
                            >
                                <Star className="h-5 w-5 shrink-0" />
                                <span className="text-[11px] text-center leading-tight break-words">Değerlendir</span>
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="lg" className="h-16 rounded-2xl font-semibold flex-col gap-1.5 px-2 min-w-0 col-span-1">
                                    <IdCard className="h-5 w-5 shrink-0" />
                                    <span className="text-[11px] text-center leading-tight break-words">Yaka kartı</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-2xl font-black tracking-tight">Gönüllü Yaka Kartın</AlertDialogTitle>
                                    <AlertDialogDescription className="text-base font-medium">
                                        Gönüllülük için QR kodlu yaka kartın oluşturuldu. Sahada kartını hazır bulundur.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="my-6 flex flex-col items-center gap-8">
                                    <div>
                                    <h3 className="font-bold text-center mb-3 text-xs uppercase tracking-widest text-muted-foreground">Kart Ön Yüzü</h3>
                                    <div ref={cardFrontRef} className="w-full max-w-[300px] aspect-[105/148] bg-white rounded-3xl shadow-2xl border border-black/5 flex flex-col overflow-hidden mx-auto">
                                        {/* Üst: ince turuncu vurgu şeridi + hangel markası + rol etiketi */}
                                        <div className="relative shrink-0">
                                            <div className="h-1.5 w-full bg-primary" />
                                            <div className="px-6 pt-5 pb-1 flex items-center justify-between">
                                                <span className="text-base font-black tracking-tight text-foreground">hangel</span>
                                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-primary">Gönüllü</span>
                                            </div>
                                        </div>
                                        {/* Orta: en belirgin öğe — gönüllünün adı; altında faaliyet adı */}
                                        <div className="px-6 flex-1 flex flex-col justify-center min-h-0">
                                            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{taskType || 'Gönüllü'}</p>
                                            <p className="mt-2 text-[28px] font-black leading-[1] tracking-tight text-foreground break-words">{cardUser.name}</p>
                                            <div className="mt-3 h-px w-10 bg-primary" />
                                            <p className="mt-3 text-[12px] font-bold leading-snug text-foreground/90 line-clamp-2">{opportunity.title}</p>
                                        </div>
                                        {/* Faaliyet bilgileri: tarih/saat + konum */}
                                        <div className="px-6 pb-3 pt-2 shrink-0 space-y-1.5">
                                            <div className="flex items-start gap-2">
                                                <Clock className="h-3 w-3 text-primary mt-px shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold leading-tight text-foreground/90 truncate">{formatDateWithTime(opp.dates?.eventStart, opp.dates?.eventStartTime)}</p>
                                                    {opp.dates?.eventEnd && <p className="text-[9px] font-medium leading-tight text-muted-foreground truncate">Bitiş: {formatDateWithTime(opp.dates?.eventEnd, opp.dates?.eventEndTime)}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-3 w-3 text-primary mt-px shrink-0" />
                                                <p className="text-[10px] font-medium leading-tight text-foreground/90 line-clamp-2">
                                                    {locType === 'Online'
                                                        ? 'Uzaktan / Online'
                                                        : [oppLoc.address, [oppLoc.district, oppLoc.city].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Alt: organizatör logo/ad + QR */}
                                        <div className="px-6 pb-5 pt-3 flex items-end justify-between gap-3 shrink-0 border-t border-black/5">
                                            <div className="min-w-0">
                                                <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Düzenleyen</p>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8 bg-white border shrink-0">
                                                        {organizerLogo && <AvatarImage src={organizerLogo} alt={organizerName} className="p-0.5 object-contain" />}
                                                        <AvatarFallback className="text-[10px] font-black text-primary">{organizerInitials}</AvatarFallback>
                                                    </Avatar>
                                                    <p className="text-[11px] font-bold text-foreground/80 break-words min-w-0">{organizerName}</p>
                                                </div>
                                            </div>
                                            <Image src={nameQrCodeUrl} alt="Doğrulama QR Kodu" width={60} height={60} className="rounded-lg bg-white shrink-0" />
                                        </div>
                                    </div>
                                    </div>

                                    <div>
                                    <h3 className="font-bold text-center mb-3 text-xs uppercase tracking-widest text-muted-foreground">Kart Arka Yüzü</h3>
                                    <div ref={cardBackRef} className="w-full max-w-[300px] aspect-[105/148] bg-white rounded-3xl shadow-2xl border border-black/5 flex flex-col overflow-hidden mx-auto">
                                        <div className="relative shrink-0">
                                            <div className="h-1.5 w-full bg-primary" />
                                            <div className="px-6 pt-5 pb-1 flex items-center justify-between">
                                                <span className="text-base font-black tracking-tight text-foreground">hangel</span>
                                                <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Doğrulama</span>
                                            </div>
                                        </div>
                                        {/* Orta: net QR — doğrulama */}
                                        <div className="px-6 pt-4 flex flex-col items-center text-center shrink-0">
                                            <div className="rounded-2xl bg-white p-2 ring-1 ring-black/5">
                                                <Image src={backQrCodeUrl} alt="Doğrulama QR Kodu" width={104} height={104} className="rounded-lg" />
                                            </div>
                                            <p className="mt-2.5 text-[10px] font-bold text-foreground/90">Sahada karekodu okutun</p>
                                        </div>
                                        {/* Faaliyet detayı: tarih/saat + konum (arka yüz) */}
                                        <div className="px-6 pt-3 flex-1 min-h-0 flex flex-col justify-center space-y-2.5">
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-primary mt-px shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tarih & Saat</p>
                                                    <p className="text-[10px] font-bold leading-tight text-foreground/90">{formatDateWithTime(opp.dates?.eventStart, opp.dates?.eventStartTime)}</p>
                                                    {opp.dates?.eventEnd && <p className="text-[9px] font-medium leading-tight text-muted-foreground">Bitiş: {formatDateWithTime(opp.dates?.eventEnd, opp.dates?.eventEndTime)}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-primary mt-px shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Konum</p>
                                                    <p className="text-[10px] font-medium leading-tight text-foreground/90 line-clamp-3">
                                                        {locType === 'Online'
                                                            ? 'Uzaktan / Online gönüllülük'
                                                            : [oppLoc.address, [oppLoc.district, oppLoc.city].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-6 pb-5 pt-3 shrink-0 flex items-center justify-between gap-2 border-t border-black/5">
                                            <p className="text-[10px] font-bold text-foreground/70 break-words min-w-0">{cardUser.name}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-primary shrink-0">Gönüllülük</p>
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
                    </section>
                )}

                {/* Tamamlanmış görev için STK değerlendirme (başvuru durumu Onaylandı değilse de göster) */}
                {approvedCompletion && !isApproved && (
                    <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => setIsEvalOpen(true)}
                        className="h-14 rounded-2xl font-semibold px-6 flex items-center gap-2 w-full sm:w-auto"
                        aria-label="STK'yı değerlendir"
                        title="STK'yı değerlendir"
                    >
                        <Star className="h-5 w-5" /> STK'yı değerlendir
                    </Button>
                )}

                {/* Gönüllü → STK değerlendirme dialog'u (10 soru, 1-5) */}
                {approvedCompletion && (
                    <EvaluationDialog
                        open={isEvalOpen}
                        onOpenChange={setIsEvalOpen}
                        title="STK ve faaliyeti değerlendir"
                        description="Deneyimini 10 soruda puanla. Geri bildirimin STK'ya yardımcı olur."
                        questions={[...questionsForDirection('volunteer_to_ngo')]}
                        withComment
                        submitting={isEvalSubmitting}
                        onSubmit={handleSubmitEvaluation}
                    />
                )}

                </div>

                {/* ───── SAĞ KOLON (web sidebar / mobil alt) — konum, STK, paylaş ───── */}
                <aside className="space-y-10 lg:sticky lg:top-8">

                    {/* Konum — fiziksel (Saha/Hibrit) → tam adres + mesafe + Adres Tarifi Al */}
                    {isPhysical && (
                        <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Konum</h2>
                            <div className="space-y-2.5 text-base">
                                {oppLoc.address && (
                                    <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" /> <span className="text-foreground leading-snug">{oppLoc.address}</span></div>
                                )}
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <MapPin className="h-5 w-5 shrink-0" /> <span>{oppLoc.district}, {oppLoc.city}</span>
                                </div>
                            </div>
                            {/* Adres altı mesafe: izin verene km · dk; vermeyene "Konumumu kullan" metin butonu (DistanceBadge içinde) */}
                            <div className="pl-8">
                                <DistanceBadge target={coords ? { lat: coords.lat, lon: coords.lon } : null} />
                            </div>
                            <Button variant="outline" size="sm" className="w-full h-11 rounded-2xl text-sm font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={() => window.open(directionsUrl, '_blank')}>
                                <Map className="h-4 w-4" /> Adres tarifi al
                            </Button>
                        </section>
                    )}

                    {/* Organize eden STK */}
                    <section className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Organize eden</p>
                        <Link href={`/ngos/${opportunity.ngoId}`} className="flex items-center gap-3 group">
                            <Avatar className="h-12 w-12 border border-border bg-card shrink-0">
                                {organizerLogo && <AvatarImage src={organizerLogo} alt={organizerName} className="object-contain p-1" />}
                                <AvatarFallback className="text-sm font-bold text-primary">{organizerInitials}</AvatarFallback>
                            </Avatar>
                            <span className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">{ngo?.name || opportunity.organization}</span>
                        </Link>
                        {ngo && (
                            <>
                                <p className="text-base leading-relaxed text-muted-foreground line-clamp-4">{ngo.about}</p>
                                <Button asChild variant="secondary" className="w-full rounded-full h-11 font-semibold">
                                    <Link href={`/ngos/${ngo.id}`}>Kuruluş Profilini İncele</Link>
                                </Button>
                            </>
                        )}
                    </section>

                    {/* Paylaş */}
                    <section className="space-y-4 pt-2 border-t border-border">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-2">
                            <HeartHandshake className="h-4 w-4 text-primary" /> Bu ilanı paylaş
                        </div>
                        <ShareButtons url={profileUrl} title={`${opportunity.title} - hangel Gönüllülük İlanı`} />
                    </section>
                </aside>
            </div>
        </div>

        {/* Alt sabit nav bu sayfada artık GİZLİ (bottom-nav: events|volunteering detay),
            o yüzden CTA barı varsayılan dibe oturur — workaround'a gerek kalmadı. */}
        <DetailStickyBar>
             {applicationStatus === 'Beklemede' ? (
                <div className="w-full h-14 rounded-full flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-base font-semibold px-4 text-center">
                    <Clock className="h-5 w-5 shrink-0" /> Başvurun alındı, onay bekliyorsunuz
                </div>
             ) : applicationStatus === 'Onaylandı' ? (
                <div className="w-full h-14 rounded-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-base font-semibold px-4 text-center">
                    <CheckCircle2 className="h-5 w-5 shrink-0" /> Başvurunuz onaylandı
                </div>
             ) : applicationStatus === 'Reddedildi' ? (
                <div className="w-full h-14 rounded-full flex items-center justify-center gap-2 bg-muted border border-border text-muted-foreground text-base font-semibold px-4 text-center">
                    <XCircle className="h-5 w-5 shrink-0" /> Başvurun bu sefer onaylanmadı
                </div>
             ) : (
                <Button
                    size="lg"
                    className="w-full h-14 rounded-full text-lg font-semibold tracking-tight shadow-lg shadow-primary/20"
                    disabled={isApplying || daysRemaining < 0}
                    onClick={handleApply}
                >
                  {isApplying ? <Loader2 className="animate-spin h-5 w-5" /> : daysRemaining < 0 ? 'Başvuru Süresi Doldu' : `${countdownText}, Hemen Başvur`}
                </Button>
             )}
        </DetailStickyBar>
    </div>
  );
}
