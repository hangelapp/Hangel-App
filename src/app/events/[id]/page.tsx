'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, limit, documentId } from 'firebase/firestore';
import type { Event as EventType, NGO, StudentClub, User as UserType } from '@/lib/types';
import { startEventCountdownActivity } from '@/lib/native-live-activity';
import { EventCountdown } from '@/components/events/event-countdown';
import { getUserEventRole, roleLabelTr } from '@/lib/event-roles';
import { LiveEventSection } from '@/components/events/live-event-section';
import { EventEvaluateButton } from '@/components/events/event-evaluate-button';
import { EventCheckinScanButton } from '@/components/events/event-checkin-scan-button';
import { EventPhotosDialog } from '@/components/events/event-photos-dialog';
import { EventPoints } from '@/components/events/event-points';
import { EventParticipants } from '@/components/events/event-participants';
import { RewardBanner } from '@/components/rewards/reward-banner';
import { ExamEntry } from '@/components/exam/exam-entry';
import { openExternalUrl } from '@/lib/capacitor';
import { ToastAction } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Tag, Download, CheckCircle, Building, Languages, UserCheck, Clock, ChevronRight, Map, Mic2 } from 'lucide-react';
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
import { DistanceBadge } from '@/components/shared/distance-badge';
import { AskManagerButton } from '@/components/shared/ask-manager-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { COLLECTIONS } from '@/firebase/collections';
import { eventPhase, eventStart, eventEnd } from '@/lib/event-time';
import { DetailHero } from '@/components/detail/detail-hero';
import { downloadDataUrlSmart } from '@/lib/native-file';

type WeatherDay = { date: string; tempMax: number; tempMin: number; label: string; emoji: string };

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
  // Fotoğraf merkezi dialog'u — ?photos=1 ile otomatik açılır (QR/link/admin paneli).
  const [photosOpen, setPhotosOpen] = useState(false);
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  // Hava durumu (fiziksel etkinlikte aktivite günleri) + adres geocode sonucu (mesafe + hava için).
  const [weather, setWeather] = useState<WeatherDay[] | null>(null);
  const [geocoded, setGeocoded] = useState<{ lat: number; lon: number } | null>(null);

  const handleDownloadBadgePdf = async () => {
    if (!cardFrontRef.current || !cardBackRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const { default: html2canvas } = await import('html2canvas');

      // Düşük MB + hızlı indirme: scale 2 (3 yerine) → ~2x daha az piksel, baskı için yeterli netlik.
      const opts = { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false };
      const frontCanvas = await html2canvas(cardFrontRef.current, opts);
      const backCanvas = await html2canvas(cardBackRef.current, opts);

      // A4 portre @ 150 DPI: 210×297mm → 1240×1754px (200 DPI'dan ~%44 daha az piksel → küçük JPG)
      const MM = (mm: number) => Math.round((mm / 25.4) * 150);
      const pageW = MM(210); // 1240
      const pageH = MM(297); // 1754

      const out = document.createElement('canvas');
      out.width = pageW;
      out.height = pageH;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Canvas bağlamı oluşturulamadı.');

      // Beyaz arka plan
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageW, pageH);

      // İki kart A6 oranında (105/148), yan yana A5 alanında, A4 ortasında.
      const cardW = MM(95); // ~95mm kart genişliği
      const cardH = Math.round((cardW * 148) / 105);
      const gap = MM(6);
      const totalW = cardW * 2 + gap;
      const startX = Math.round((pageW - totalW) / 2);
      // Üste hizala (ortaya değil): üstten 16mm boşluk → kartlar sayfanın üstünde.
      const startY = MM(16);

      ctx.drawImage(frontCanvas, startX, startY, cardW, cardH);
      ctx.drawImage(backCanvas, startX + cardW + gap, startY, cardW, cardH);

      // Kartların hemen altına küçük gri etiket (kartlarla birlikte üstte).
      ctx.fillStyle = '#999999';
      ctx.font = `${MM(3.2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('hangel — etkinlik yaka kartı', pageW / 2, startY + cardH + MM(8));

      // JPEG 0.85 (0.92 yerine) → görsel kalite korunur, dosya boyutu küçülür.
      const dataUrl = out.toDataURL('image/jpeg', 0.85);
      // <a download> native WebView'de sessiz no-op — tek kapı: downloadDataUrlSmart.
      await downloadDataUrlSmart(dataUrl, `yaka-karti-${event?.id || 'hangel'}.jpg`, {
        title: 'hangel yaka kartı',
        dialogTitle: 'Yaka kartını kaydet veya paylaş',
      });
    } catch (err) {
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'Yaka kartı oluşturulamadı', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
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

  // Etkinlik ekibi (konuşmacı/sanatçı/moderatör) — hangel üyesi contributor'ların
  // fotoğrafı için userId'leri TEK query ile users koleksiyonundan çek (döngüde hook yok).
  const contributorUids = useMemoFirebase(() => {
    const uids = (event?.contributors ?? [])
      .map((c) => c?.userId)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
    return Array.from(new Set(uids)).slice(0, 30);
  }, [event?.contributors]);

  const contributorUsersQuery = useMemoFirebase(() => {
    if (!db || contributorUids.length === 0) return null;
    return query(collection(db, COLLECTIONS.users), where(documentId(), 'in', contributorUids));
  }, [db, contributorUids]);
  const { data: contributorUsers } = useCollection<UserType>(contributorUsersQuery);

  // FEAT-EVENT-RSVP — subscribe to user's own RSVP doc.
  const resolvedEventId = (eventsBySlug && eventsBySlug[0]?.id) || eventById?.id || null;
  const rsvpDocRef = useMemoFirebase(() => {
    if (!db || !authUser?.uid || !resolvedEventId) return null;
    return doc(db, COLLECTIONS.events, resolvedEventId, COLLECTIONS.eventRsvps, authUser.uid);
  }, [db, authUser?.uid, resolvedEventId]);
  const { data: rsvpData } = useDoc<{ status?: 'going' | 'cancelled' }>(rsvpDocRef);
  const isGoing = rsvpData?.status === 'going';
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);

  // Bu etkinlik için kullanıcının katılım sertifikası — Tamamla akışı
  // users/{uid}/certificates/evt-{eventId}-{uid} yazar. Kod varsa "Sertifika"
  // butonu doğrudan doğrulama sayfasına (/c/{code}) gider, yoksa /my-badges.
  const eventCertRef = useMemoFirebase(() => {
    if (!db || !authUser?.uid || !resolvedEventId) return null;
    return doc(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.certificates, `evt-${resolvedEventId}-${authUser.uid}`);
  }, [db, authUser?.uid, resolvedEventId]);
  const { data: eventCert } = useDoc<{ code?: string }>(eventCertRef);
  const eventCertCode = typeof eventCert?.code === 'string' && eventCert.code ? eventCert.code : null;

  // Yönetici = super-admin VEYA yönettiği kuruluş/kulüp etkinliğin organizatörü.
  // managedNgoId/managedClubId User tipinde tanımlı değil → yerelde cast et.
  const eventOrganizerId = (event as { organizerId?: string } | null)?.organizerId;
  const ud = userData as (typeof userData & { managedNgoId?: string; managedClubId?: string }) | null;
  const isManager = !!ud && (
    ud.role === 'super-admin' ||
    (!!eventOrganizerId && (ud.managedNgoId === eventOrganizerId || ud.managedClubId === eventOrganizerId))
  );

  // Kilit ekranı canlı etkinliği (iOS Live Activity) — hem RSVP anında hem
  // etkinlik günü sayfa açılışında (aşağıdaki effect) başlatılır. iOS,
  // activity'leri ~8-12 saat sonra kendiliğinden sonlandırdığı için YALNIZ
  // "Katıl" anında başlatmak, erken katılanlarda etkinlik günü kilit ekranında
  // hiçbir şey göstermiyordu. Native plugin aynı etkinlik için tekilleştirme
  // yapmadığından localStorage guard'ı 12 saat içinde ikinci bir activity
  // açılmasını (kilit ekranında çift kart) önler. Web/Android'de no-op.
  const launchLiveActivity = async () => {
    if (!event || !resolvedEventId) return;
    const guardKey = `hangel:liveActivity:${resolvedEventId}`;
    try {
      const last = Number(localStorage.getItem(guardKey) || 0);
      if (Date.now() - last < 12 * 3600_000) return;
    } catch { /* yok say */ }
    // Başlangıç + bitiş tarihini epoch'a çevir → widget'ta otomatik geri sayım
    // (başlamadan önce) ve etkinlik akış-line'ı (sırasında). Push gerekmez.
    const toEpoch = (s?: string): number => {
      if (!s) return 0;
      let d = parse(s, 'yyyy-MM-dd HH:mm', new Date());
      if (isNaN(d.getTime())) d = parse(s, 'yyyy-MM-dd', new Date());
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    const eventStartEpoch = toEpoch(event.startDate);
    const eventEndEpoch = toEpoch(event.endDate);
    // Live Activity, katılım anından etkinlik BİTENE kadar kilit ekranında kalır
    // (kullanıcı tercihi: "açtığı günden itibaren kalsın"). Uzak tarihte bile geri
    // sayım gösterilir. TEK kısıt: bitmiş etkinlikte ya da geçerli tarih yoksa gösterme.
    {
      const nowMs = Date.now();
      const noValidDate = !eventStartEpoch && !eventEndEpoch;
      const alreadyEnded = eventEndEpoch > 0 && eventEndEpoch < nowMs;
      if (noValidDate || alreadyEnded) return;
    }
    const _role = getUserEventRole(event.contributors, authUser?.uid);
    const _roleLabel = _role === 'participant'
      ? 'Katılımcı'
      : (roleLabelTr(_role).charAt(0) + roleLabelTr(_role).slice(1).toLocaleLowerCase('tr'));
    // Fiziksel etkinlikte hava durumu — Live Activity başlığında gösterilir (best-effort).
    let weatherEmoji = ''; let weatherTemp = '';
    const _loc = typeof event.location === 'string' ? null : event.location;
    if (_loc && _loc.type === 'Fiziksel' && _loc.city) {
      try {
        const wr = await fetch(`/api/weather?city=${encodeURIComponent(_loc.city)}&district=${encodeURIComponent(_loc.district || '')}&days=7`);
        if (wr.ok) {
          const wj = await wr.json() as { days?: Array<{ date: string; emoji: string; tempMax: number }> };
          const dayKey = (event.startDate || '').slice(0, 10);
          const day = wj.days?.find(d => d.date === dayKey) || wj.days?.[0];
          if (day) { weatherEmoji = day.emoji || ''; weatherTemp = `${day.tempMax}°`; }
        }
      } catch { /* hava durumu best-effort */ }
    }
    const activityId = await startEventCountdownActivity({
      eventTitle: event.name || 'Etkinlik',
      location: typeof event.location === 'string'
        ? event.location
        : (event.location?.address || event.location?.city || ''),
      eventId: resolvedEventId,
      eventStartEpoch,
      eventEndEpoch,
      statusLabel: _roleLabel,
      weatherEmoji,
      weatherTemp,
      organizerLogoUrl: event.organizerLogoUrl || '',
    });
    if (activityId) {
      try { localStorage.setItem(guardKey, String(Date.now())); } catch { /* yok say */ }
    }
  };

  const submitRsvp = async (action: 'going' | 'cancel') => {
    // ADIM 7 — Misafir/Keşfet: anonim kullanıcı eylem anında giriş'e davet edilir.
    // BUGFIX 2026-06-19: anonim kullanıcı "Katıl"a basıp giriş yapınca /events
    // sayfasına geri dönüyor ama RSVP tamamlanmıyordu (51 yeni kullanıcı / 13 kayıt).
    // Niyeti sakla → dönüşte (aşağıdaki effect) otomatik RSVP tamamlanır.
    if (action === 'going' && !authUser && resolvedEventId && typeof window !== 'undefined') {
      try { sessionStorage.setItem('hangel:pendingRsvp', resolvedEventId); } catch { /* yok say */ }
    }
    if (!requireAuth({ title: 'Etkinliğe katılmak için giriş yap', description: 'Etkinliğe katılmak için giriş yap ya da hemen kayıt ol.' })) return;
    if (!authUser || !resolvedEventId) return; // requireAuth yönlendirdi; TS daraltması için.
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
        description: data.status === 'going' ? 'Etkinliğe katılıyorsun. Takvimine ekle 👇' : 'RSVP iptal edildi.',
        action: data.status === 'going' && resolvedEventId
          ? <ToastAction altText="Takvime ekle" onClick={() => openExternalUrl(new URL(`/api/events/${resolvedEventId}/ics`, window.location.origin).toString())}>📅 Ekle</ToastAction>
          : undefined,
      });
      // Katılımda telefon ekranında canlı etkinlik (Live Activity) başlat (iOS native; web no-op).
      if (data.status === 'going') {
        void launchLiveActivity();
      }
    } catch (err) {
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'Kayıt başarısız', description: e?.message || 'Beklenmeyen hata.' });
    } finally {
      setIsRsvpLoading(false);
    }
  };

  // BUGFIX 2026-06-19: giriş sonrası /events sayfasına dönüldüğünde, "Katıl"
  // niyeti varsa RSVP'yi otomatik tamamla. (Aksi halde giriş yapanlar RSVP'siz kalıyordu.)
  const autoRsvpRef = useRef(false);
  useEffect(() => {
    if (autoRsvpRef.current || !authUser || !resolvedEventId || isGoing) return;
    let pending: string | null = null;
    try { pending = sessionStorage.getItem('hangel:pendingRsvp'); } catch { /* yok say */ }
    if (pending !== resolvedEventId) return;
    autoRsvpRef.current = true;
    try { sessionStorage.removeItem('hangel:pendingRsvp'); } catch { /* yok say */ }
    void submitRsvp('going');
    // submitRsvp kasıtlı bağımlılık dışı (her render'da yeniden oluşur; ref guard tek sefer garantiler).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, resolvedEventId, isGoing]);

  // Etkinlik günü: "going" katılımcı sayfayı açınca kilit ekranı canlı
  // etkinliğini (yeniden) başlat — RSVP anında açılan activity iOS tarafından
  // saatler içinde sonlandırıldığından erken katılanlarda etkinlik günü
  // görünmüyordu. Pencere: başlangıçtan 12 saat öncesi → bitiş.
  const liveActivityRef = useRef(false);
  useEffect(() => {
    if (liveActivityRef.current || !isGoing || !authUser || !event || !resolvedEventId) return;
    const startMs = eventStart(event)?.getTime();
    if (!startMs) return;
    const endMs = eventEnd(event)?.getTime() ?? startMs + 3 * 3600_000;
    const now = Date.now();
    if (now < startMs - 12 * 3600_000 || now > endMs) return;
    liveActivityRef.current = true;
    void launchLiveActivity();
    // launchLiveActivity kasıtlı bağımlılık dışı (her render'da yeniden oluşur; ref guard tek sefer garantiler).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoing, authUser, event, resolvedEventId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && event) {
      setProfileUrl(`${window.location.origin}/events/${event.slug || slug}`);
    }
  }, [event, slug]);

  // ?photos=1 → fotoğraf merkezini otomatik aç. NOT: useSearchParams() Next 15'te
  // Suspense gerektirip prod'da sayfayı bozuyordu → window.location.search ile oku.
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('photos') === '1') {
      setPhotosOpen(true);
    }
  }, []);

  // Mesafe + hava durumu için koordinat: kayıtta coordinates yoksa adresi BİR KEZ geocode et.
  // event.location string ya da undefined olabilir (online/eski kayıtlar) → GÜVENLİ obje.
  // Render'da `evLoc.X` doğrudan okunursa TypeError → sayfa açılmıyordu; tüm
  // erişimler bu güvenli `evLoc` üzerinden yapılır.
  const evLoc = (event && typeof event.location === 'object' && event.location !== null
    ? event.location
    : {}) as { type?: string; coordinates?: { lat: number; lon: number }; address?: string; city?: string; district?: string };
  const evLocType = evLoc.type;
  const evCoords = evLoc.coordinates;
  const evAddress = evLoc.address;
  const evCity = evLoc.city;
  const evDistrict = evLoc.district;
  useEffect(() => {
    if (evLocType !== 'Fiziksel' || evCoords) return;
    const q = [evAddress, evDistrict, evCity].filter(Boolean).join(', ').trim();
    if (!q) return;
    let active = true;
    fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((j: { lat?: number; lon?: number } | null) => {
        if (active && j && typeof j.lat === 'number' && typeof j.lon === 'number') {
          setGeocoded({ lat: j.lat, lon: j.lon });
        }
      })
      .catch(() => { /* geocode best-effort; sessiz başarısız */ });
    return () => { active = false; };
  }, [evLocType, evCoords, evAddress, evCity, evDistrict]);

  // Hava durumu — yalnız fiziksel etkinlikte; coordinates varsa lat/lon, yoksa city/district (geocode'a takılmadan).
  useEffect(() => {
    if (evLocType !== 'Fiziksel') { setWeather(null); return; }
    let active = true;
    const params = new URLSearchParams({ days: '3' });
    const lat = evCoords?.lat ?? geocoded?.lat;
    const lon = evCoords?.lon ?? geocoded?.lon;
    if (lat != null && lon != null) {
      params.set('lat', String(lat));
      params.set('lon', String(lon));
    } else if (evCity) {
      params.set('city', evCity);
      if (evDistrict) params.set('district', evDistrict);
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
  }, [evLocType, evCoords?.lat, evCoords?.lon, geocoded?.lat, geocoded?.lon, evCity, evDistrict]);

  if (isEventLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!event) {
    notFound();
  }

  const organizerEntity = (orgNgo && orgNgo[0]) || (orgClub && orgClub[0]) || null;
  const organizerCategory = (organizerEntity as (NGO | StudentClub) & { category?: string })?.category;
  // Önce kayıt anında saklanan organizerLogoUrl; yoksa eşleşen kurum dokümanının avatarı.
  const organizerLogo = (event as { organizerLogoUrl?: string; organizerAvatarUrl?: string }).organizerLogoUrl
    || organizerEntity?.avatarUrl
    || (event as { organizerAvatarUrl?: string }).organizerAvatarUrl;

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

  // Doğum tarihi — kartta GÖSTERİLMEZ; yalnız arka QR (vCard BDAY) içinde kodlanır.
  const cardBirthRaw = (user.personalInfo as { birthDate?: string } | undefined)?.birthDate || '';
  // hangel profil linki — kartta gösterilmez; yalnız arka QR (vCard URL) içinde.
  const profileUrlForCard = authUser?.uid ? `hangel.org/profile/${authUser.uid}` : '';

  const socialLinks = [];
    if (user.personalInfo?.social?.linkedin) socialLinks.push(`URL;TYPE=linkedin:https://linkedin.com/in/${user.personalInfo.social.linkedin}`);

  // Arka QR = vCard: tel + mail + doğum + profil URL (metin gösterilmez, QR'da).
  const backQrData = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${user.name}`,
    `TEL;TYPE=CELL:${user.personalInfo?.phone || ''}`,
    `EMAIL:${user.personalInfo?.email || ''}`,
    cardBirthRaw ? `BDAY:${cardBirthRaw}` : '',
    profileUrlForCard ? `URL:https://${profileUrlForCard}` : '',
    ...socialLinks,
    'END:VCARD'
  ].filter(Boolean).join('\n');

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

  // Mesafe rozeti hedefi: önce kayıtlı coordinates, yoksa adresten geocode edilen konum.
  const distanceTarget = evLoc.coordinates
    ? { lat: evLoc.coordinates.lat, lon: evLoc.coordinates.lon }
    : geocoded;

  // Etkinlik bitti mi? completed=true VEYA bitiş zamanı geçti → yeni RSVP kapanır.
  const isEventFinished = event.completed === true || eventPhase(event) === 'ended';
  // Kapasite doldu mu? (max>0 ve current>=max) — dolunca kayıt kapanır (bekleme listesi yok).
  const isEventFull = !!event.capacity && event.capacity.max > 0 && (event.capacity.current ?? 0) >= event.capacity.max;
  const rsvpClosed = isEventFinished || isEventFull;

  // Etkinlik ekibi — userId → User eşlemesi (fotoğraf için).
  // NOT: `Map` adı lucide-react'ten import edildiği için global Map constructor gölgeleniyor → düz Record kullan.
  const contributors = event.contributors ?? [];
  const contributorUserById: Record<string, UserType> = {};
  for (const u of contributorUsers ?? []) {
    contributorUserById[u.id] = u;
  }
  const getInitials = (name: string) =>
    (name || '')
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toLocaleUpperCase('tr') || '?';

  return (
    <div className="animate-in fade-in-0 w-full pb-8">
      {/* ===== Apple.com tarzı iki kolonlu detay: SOLDA afiş (sticky), SAĞDA bilgiler ===== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-8 lg:gap-16 items-start">

          {/* ───────── SOL KOLON: Afiş hero — ORTAK DetailHero + CTA overlay ───────── */}
          <div className="lg:sticky lg:top-8">
            <div className="relative">
              <DetailHero
                imageUrl={safeImageUrl}
                imageAlt={event.name}
                aspect="210 / 297"
                rounded
                priority
                sizes="(max-width: 1024px) 100vw, 460px"
                typeLabel={event.type}
                secondaryLabel={organizerCategory}
                organizerLogoUrl={organizerLogo}
                organizerName={event.organizer}
                organizerHref={organizerLink}
                title={event.name}
                dateLabel={formatDateTime(event.startDate).split(',')[0]}
                timeLabel={formatDateTime(event.startDate).split(',')[1]?.trim() || undefined}
                locationLabel={evLoc.type === 'Online' ? 'Online' : `${evLoc.district}, ${evLoc.city}`}
                backSlot={
                  <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-full bg-white/80 backdrop-blur-md text-foreground hover:bg-white shadow-md h-11 w-11" aria-label="Geri">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                }
                shareSlot={
                  <ShareButtons url={profileUrl} title={`${event.name} — hangel etkinliği`} buttonClassName="rounded-full bg-white/80 backdrop-blur-md text-foreground hover:bg-white shadow-md h-11 w-11" />
                }
                ctaSlot={
                  <Button
                    size="lg"
                    disabled={isRsvpLoading || (!isGoing && rsvpClosed)}
                    onClick={() => submitRsvp(isGoing ? 'cancel' : 'going')}
                    variant={isGoing ? 'outline' : 'default'}
                    className={isGoing
                      ? 'w-full h-12 rounded-2xl text-base sm:text-lg font-black bg-white/10 text-white border-white/40 hover:bg-white/20 backdrop-blur-sm'
                      : 'w-full h-12 rounded-2xl text-base sm:text-lg font-black shadow-xl shadow-black/30'}
                  >
                    {isRsvpLoading
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : (isGoing ? 'Katıldın ✓ — Vazgeç' : (isEventFinished ? 'Etkinlik bitti' : (isEventFull ? 'Kontenjan doldu' : 'Etkinliğe Katıl')))}
                  </Button>
                }
              />

              {/* Geri sayım — afişin hemen altında, görünür kalır */}
              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <EventCountdown event={event} className="text-base" />
              </div>
            </div>
          </div>

          {/* ───────── SAĞ KOLON: Ek bilgiler + içerik ───────── */}
          <div className="space-y-8 sm:space-y-10">

            {/* Quick info chips — kapasite / dil / sertifika (tarih-saat-konum afiş overlay'inde) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {event.capacity?.max > 0 && (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3.5 py-2 rounded-full bg-muted">
                  <Users className="h-3.5 w-3.5" />
                  {event.capacity.current}/{event.capacity.max}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3.5 py-2 rounded-full bg-muted">
                <Languages className="h-3.5 w-3.5" />
                {event.language}
              </div>
              {event.providesCertificate && (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3.5 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Sertifika
                </div>
              )}
            </div>

            {/* Canlı etkinlik modu — geri sayım / Canlı Başlat-Bitir / konuşmacıya canlı puan */}
            {resolvedEventId && (
              <div className="mt-4">
                <LiveEventSection
                  eventId={resolvedEventId}
                  event={{ ...event, organizer: event.organizer, organizerLogoUrl: organizerLogo, eventLogoUrl: event.eventLogoUrl, slug: event.slug }}
                  isGoing={isGoing}
                  isManager={isManager}
                  authUser={authUser ?? null}
                  weather={weather && weather.length > 0 ? { emoji: weather[0].emoji, tempMax: weather[0].tempMax, tempMin: weather[0].tempMin, label: weather[0].label } : null}
                />
              </div>
            )}

            {/* İçerik: tabs + kapasite + aksiyonlar */}
            <div className="space-y-8">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 rounded-2xl glass-surface border border-white/40 p-1">
                        <TabsTrigger value="details" className="min-w-0 truncate rounded-xl px-2 text-xs font-bold sm:px-3 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Etkinlik Detayları</TabsTrigger>
                        <TabsTrigger value="organization" className="min-w-0 truncate rounded-xl px-2 text-xs font-bold sm:px-3 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Kuruluş Hakkında</TabsTrigger>
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
                                        <span>{evLoc.type === 'Online' ? 'Online' : `${evLoc.address}`}</span>
                                        {evLoc.type !== 'Online' && (
                                            <Button variant="outline" size="sm" className="w-fit h-10 rounded-xl text-xs font-bold gap-1.5 border-primary/20 text-primary hover:bg-primary/5" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evLoc.address + ' ' + evLoc.district + ' ' + evLoc.city)}`, '_blank')}>
                                                <Map className="h-3 w-3" /> Adres Tarifi Al
                                            </Button>
                                        )}
                                        {evLoc.type !== 'Online' && (
                                            <DistanceBadge target={distanceTarget} />
                                        )}
                                    </div>
                                </InfoRow>
                                {/* Hava durumu — yalnız fiziksel etkinlikte; adresin hemen altında */}
                                {evLoc.type !== 'Online' && weather && weather.length > 0 && (
                                    <div className="py-4 px-4 sm:px-6">
                                        <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Hava durumu</p>
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 pl-[max(1rem,var(--sal))] pr-[max(1rem,var(--sar))]">
                                            {weather.map((d) => (
                                                <div key={d.date} className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border border-border bg-card min-w-[88px] shrink-0 text-center">
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{formatDateTime(d.date).split(',')[0]}</span>
                                                    <span className="text-2xl leading-none">{d.emoji}</span>
                                                    <span className="text-xs text-muted-foreground">{d.label}</span>
                                                    <span className="text-sm font-semibold tracking-tight">{d.tempMax}° / {d.tempMin}°</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <InfoRow icon={Languages} label="Dil">
                                    <Link href={`/events?tag=${encodeURIComponent(event.language)}`}>
                                        <Badge variant="secondary" className="font-bold hover:bg-primary/10 transition-colors">{event.language}</Badge>
                                    </Link>
                                </InfoRow>
                                <InfoRow icon={Users} label="Kapasite">{event.capacity?.current ?? 0} / {event.capacity?.max ?? 0}</InfoRow>
                                <InfoRow icon={UserCheck} label="Katılım Koşulu">{event.participationCondition}</InfoRow>
                                <InfoRow icon={CheckCircle} label="Sertifika">{event.providesCertificate ? `Veriliyor (${evLoc.type}, ${event.language})` : 'Verilmiyor'}</InfoRow>
                                
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
                                    <div className="flex flex-wrap gap-2">
                                        {evLoc.district && <Link href={`/events?tag=${encodeURIComponent(evLoc.district)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 font-bold">{evLoc.district}</Badge></Link>}
                                        {evLoc.city && <Link href={`/events?tag=${encodeURIComponent(evLoc.city)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 font-bold">{evLoc.city}</Badge></Link>}
                                    </div>
                                </InfoRow>
                            </CardContent>
                        </Card>

                        {/* Çok noktalı etkinlik — tüm katılım noktaları (tek konumlu etkinlikte gizli) */}
                        <EventPoints event={event} />

                        <Card className="glass-surface rounded-3xl border-white/40 shadow-sm">
                            <CardHeader>
                                <CardTitle>Açıklama</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground/85 leading-relaxed font-medium">{event.description}</p>
                            </CardContent>
                        </Card>

                        <RewardBanner kind="event" id={event.id} />
                        <ExamEntry eventId={event.id} />

                        {Array.isArray(event.agenda) && event.agenda.length > 0 && (
                        <Card className="glass-surface rounded-3xl border-white/40 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Etkinlik Programı
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ol className="relative">
                                    {event.agenda.map((item, i) => (
                                        <li key={`${item.time}-${i}`} className="flex items-start gap-4 py-4 px-4 sm:px-6 border-t first:border-t-0">
                                            {/* Saat rozeti — sabit genişlik, tabular hizalı */}
                                            <span className="shrink-0 inline-flex min-w-[3.5rem] items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-black tabular-nums text-primary">
                                                {item.time || '—'}
                                            </span>
                                            <p className="flex-1 min-w-0 pt-0.5 font-semibold text-foreground break-words leading-snug">
                                                {item.title}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                        )}

                        {contributors.length > 0 && (
                        <Card className="glass-surface rounded-3xl border-white/40 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-3">
                                    <Mic2 className="h-5 w-5 text-primary" />
                                    Etkinlik Ekibi / Konuşmacılar &amp; Sanatçılar
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y p-0">
                                {contributors.map((c, i) => {
                                    const u = c.userId ? contributorUserById[c.userId] : undefined;
                                    const photo = u?.avatarUrl;
                                    return (
                                        <div key={c.userId || `${c.name}-${i}`} className="flex items-center gap-4 py-4 px-4 sm:px-6">
                                            <Avatar className="h-12 w-12 shrink-0 border">
                                                {photo && <AvatarImage src={photo} alt={c.name} className="object-cover" />}
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(c.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-foreground break-words">{c.name}</p>
                                                {c.title && (
                                                    <p className="text-xs text-muted-foreground font-medium truncate">{c.title}</p>
                                                )}
                                            </div>
                                            <Badge variant="secondary" className="shrink-0 text-xs font-bold uppercase tracking-wider">
                                                {roleLabelTr(c.role)}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                        )}

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

                {/* Aksiyon butonları — sağ kolon içinde. Tutarlı boy (h-14) + rounded-2xl + eşit padding. */}
                <div className="space-y-3 pt-1 pb-2">
            {/* Birincil eylem: tam genişlik, öne çıkar */}
            {isGoing ? (
              event.completed ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                >
                  <Link href="/my-badges">Sertifikan 🎓</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  disabled={isRsvpLoading}
                  onClick={() => submitRsvp('cancel')}
                  className="w-full h-14 rounded-2xl text-lg font-black"
                >
                  {isRsvpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Katıldın ✓ — vazgeç'}
                </Button>
              )
            ) : (
              <Button
                size="lg"
                disabled={isRsvpLoading || rsvpClosed}
                onClick={() => submitRsvp('going')}
                className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
              >
                {isRsvpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isEventFinished ? 'Etkinlik bitti' : (isEventFull ? 'Kontenjan doldu' : 'Etkinliğe Katıl'))}
              </Button>
            )}

            {/* İkincil eylem ızgarası — tüm butonlar AYNI boy/padding/rounded; tutarlı ızgara */}
            {isGoing && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-0">
                <AskManagerButton orgId={eventOrganizerId} subject={`${event?.name || 'Etkinlik'} hakkında`} className="h-14 text-xs font-black" />
                {/* Yaka Kartı */}
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="lg" variant="secondary" className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words">🪪 Yaka Kartı</Button>
                </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl">
                <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black tracking-tight">Kaydınız Alındı!</AlertDialogTitle>
                <AlertDialogDescription className="text-base font-medium">
                    Etkinlik için QR kodlu yaka kartınız oluşturuldu. Giriş için kartınızı hazır bulundurun.
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
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-primary">{roleLabelTr(getUserEventRole(event?.contributors, authUser?.uid))}</span>
                            </div>
                        </div>
                        {/* Orta: en belirgin öğe — kişinin adı; altında etkinlik adı */}
                        <div className="px-6 flex-1 flex flex-col justify-center min-h-0">
                            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Katılımcı</p>
                            <p className="mt-2 text-[28px] font-black leading-[1] tracking-tight text-foreground break-words">{user.name}</p>
                            <div className="mt-3 h-px w-10 bg-primary" />
                            <p className="mt-3 text-[12px] font-bold leading-snug text-foreground/90 line-clamp-2">{event.name}</p>
                        </div>
                        {/* Faaliyet bilgileri: tarih/saat + konum */}
                        <div className="px-6 pb-3 pt-2 shrink-0 space-y-1.5">
                            <div className="flex items-start gap-2">
                                <Clock className="h-3 w-3 text-primary mt-px shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold leading-tight text-foreground/90 truncate">{formatDateTime(event.startDate)}</p>
                                    {event.endDate && <p className="text-[9px] font-medium leading-tight text-muted-foreground truncate">Bitiş: {formatDateTime(event.endDate)}</p>}
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-3 w-3 text-primary mt-px shrink-0" />
                                <p className="text-[10px] font-medium leading-tight text-foreground/90 line-clamp-2">
                                    {evLoc.type === 'Online'
                                        ? 'Online'
                                        : [evLoc.address, [evLoc.district, evLoc.city].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}
                                </p>
                            </div>
                        </div>
                        {/* Alt: organizatör logo/ad + QR */}
                        <div className="px-6 pb-5 pt-3 flex items-end justify-between gap-3 shrink-0 border-t border-black/5">
                            <div className="min-w-0">
                                <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Düzenleyen</p>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 bg-white border shrink-0">
                                        {organizerLogo && <AvatarImage src={organizerLogo} alt={event.organizer} className="p-0.5 object-contain"/>}
                                        <AvatarFallback className="text-[10px] font-black text-primary">{event.organizer.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-[11px] font-bold text-foreground/80 break-words min-w-0">{event.organizer}</p>
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
                            <p className="mt-2.5 text-[10px] font-bold text-foreground/90">Giriş için karekodu okutun</p>
                        </div>
                        {/* Faaliyet detayı: tarih/saat + konum (arka yüz) */}
                        <div className="px-6 pt-3 flex-1 min-h-0 flex flex-col justify-center space-y-2.5">
                            <div className="flex items-start gap-2">
                                <Calendar className="h-3.5 w-3.5 text-primary mt-px shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tarih & Saat</p>
                                    <p className="text-[10px] font-bold leading-tight text-foreground/90">{formatDateTime(event.startDate)}</p>
                                    {event.endDate && <p className="text-[9px] font-medium leading-tight text-muted-foreground">Bitiş: {formatDateTime(event.endDate)}</p>}
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-3.5 w-3.5 text-primary mt-px shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Konum</p>
                                    <p className="text-[10px] font-medium leading-tight text-foreground/90 line-clamp-3">
                                        {evLoc.type === 'Online'
                                            ? 'Online etkinlik'
                                            : [evLoc.address, [evLoc.district, evLoc.city].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-5 pt-3 shrink-0 flex items-center justify-between gap-2 border-t border-black/5">
                            <p className="text-[10px] font-bold text-foreground/70 break-words min-w-0">{user.name}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-primary shrink-0">{eventHashtag}</p>
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

                {/* Apple Wallet */}
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={async () => {
                    if (!authUser) return;
                    try {
                      // Passport (çalışan) ile aynı yol: ?token= query + openExternalUrl
                      // (sistem tarayıcısı → .pkpass → Apple Wallet "Ekle" sayfası).
                      const idToken = await authUser.getIdToken();
                      const url = new URL(`/api/passkit/event/${resolvedEventId}?token=${encodeURIComponent(idToken)}`, window.location.origin).toString();
                      await openExternalUrl(url);
                    } catch (e) {
                      toast({ variant: 'destructive', title: 'Apple Wallet açılamadı', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
                    }
                  }}
                  className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words"
                  aria-label="Apple Wallet'a Ekle"
                  title="Apple Wallet'a Ekle"
                >
                  🎫 Wallet
                </Button>

                {/* Takvime ekle — NFC'nin yanında; .ics dosyasını sistem tarayıcısında aç */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (!resolvedEventId) return;
                    const url = new URL(`/api/events/${resolvedEventId}/ics`, window.location.origin).toString();
                    void openExternalUrl(url);
                  }}
                  className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words"
                  aria-label="Takvime ekle"
                  title="Takvime ekle"
                >
                  📅 Takvime ekle
                </Button>

                {/* NFC ile Check-in */}
                {!event.completed && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={async () => {
                    if (!authUser) return;
                    try {
                      const { readNdefUrl } = await import('@/lib/native-nfc');
                      const result = await readNdefUrl();
                      if (!result.ok || !result.url) {
                        toast({ variant: 'destructive', title: 'NFC okunamadı', description: result.errorMessage || 'Etiket okunamadı.' });
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
                      toast(data.already
                        ? { title: 'Zaten check-in yapılmış ✓' }
                        : { title: 'Check-in başarılı 🎉', description: 'Etkinliğe giriş kaydın alındı.' });
                    } catch (e) {
                      toast({ variant: 'destructive', title: 'NFC hatası', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
                    }
                  }}
                  className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words"
                  aria-label="NFC ile Check-in"
                  title="NFC ile Check-in"
                >
                  📲 NFC
                </Button>
                )}

                {/* QR ile Check-in — kamera açılıp kapıdaki check-in QR'ını okur. */}
                {!event.completed && (
                  <EventCheckinScanButton
                    eventId={resolvedEventId || ''}
                    className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words"
                  />
                )}

                {/* Etkinlik bittiyse: sertifika + değerlendir */}
                {isEventFinished && (
                  <>
                    <Button size="lg" variant="outline" className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words" asChild>
                      <Link href={eventCertCode ? `/c/${eventCertCode}` : '/my-badges'}>🎓 Sertifika</Link>
                    </Button>
                    <EventEvaluateButton eventId={resolvedEventId || ''} eventName={event.name} authUser={authUser ?? null} className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words" />
                  </>
                )}
              </div>
            )}

            {/* Fotoğraflar — herkese açık (isGoing gerekmez); foto merkezi dialog'unu açar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-0 pt-1">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setPhotosOpen(true)}
                className="h-14 w-full min-w-0 rounded-2xl text-xs font-black flex items-center justify-center text-center gap-1 px-1 break-words"
                aria-label="Etkinlik Fotoğrafları"
                title="Etkinlik Fotoğrafları"
              >
                📷 Fotoğraflar
              </Button>
            </div>

            {/* Paylaşım — ayrı satır, ferah */}
            <div className="pt-1">
              <ShareButtons url={profileUrl} title={`${event.name} - hangel Etkinliği`} />
            </div>

            {/* Katılımcılar — kurumsal/özel katılımcılar (türe göre gruplu), en altta */}
            <EventParticipants event={event} />

            {/* Foto merkezi dialog'u — ?photos=1 ve 📷 Fotoğraflar butonu bunu açar */}
            {resolvedEventId && (
              <EventPhotosDialog
                eventId={resolvedEventId}
                eventName={event.name}
                open={photosOpen}
                onOpenChange={setPhotosOpen}
              />
            )}
                </div>{/* end aksiyon butonları */}
            </div>{/* end içerik wrapper (tabs + kapasite + aksiyon) */}
          </div>{/* end SAĞ KOLON */}

        </div>{/* end grid */}
      </div>{/* end max-w-6xl wrapper */}
    </div>
  );


}
