'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Copy, Code2, Rss, Link2, Megaphone, Check, Users, Clock } from "lucide-react";
import React, { useMemo, useEffect, useRef, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Volunteering, Application as UserApplication, NGO } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { VolunteerApplicants } from '@/components/volunteering/volunteer-applicants';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SocialShareButton } from '@/components/ngo-admin/social-share-dialog';
import { EventAttendees } from '@/components/events/event-attendees';
import { EventBadgeCards, EventCertificates } from '@/components/events/event-bulk-docs';
import { VolunteeringCheckinQR } from '@/components/volunteering/volunteering-checkin-qr';
import { RewardManager } from '@/components/rewards/reward-manager';
import { BroadcastMessageButton } from '@/components/messaging/broadcast-message-button';
import { ApplicantProfileDialog } from '@/components/volunteering/applicant-profile-dialog';
import { CheckCircle2 } from 'lucide-react';


// Başvuru çekme + onay/red mantığını tek yerde topla. Hem üstteki ilan
// kartlarının başvuru-sayısı rozetleri hem alttaki başvuru listesi aynı
// veriyi (applications) kullansın diye parent (VolunteerPage) seviyesinde
// çağrılır. Veri yazımı (status update + bildirim + volunteerCount) AYNEN korunur.
const useVolunteerApplications = (opportunities: Volunteering[]) => {
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    const opportunityIds = useMemo(() => opportunities.map(o => o.id), [opportunities]);

    const applicationsQuery = useMemoFirebase(() => {
        if (!db || opportunityIds.length === 0) return null;
        // SADECE bu STK'nın ilanlarına gelen başvuruları çek. Eskiden tüm
        // 'Gönüllülük' başvuruları çekilip client'ta filtreleniyordu — bu hem
        // gizlilik sızıntısıydı (başka STK'ların başvuruları client'a iniyordu)
        // hem de gereksiz okuma. Firestore 'in' en fazla 30 değer alır; tipik
        // STK ilan sayısı bunun çok altında. 30+ ilanı olan nadir durumda
        // ilk 30 ile sorgulanır, kalan client filtresiyle gizlenir.
        const ids = opportunityIds.slice(0, 30);
        return query(collection(db, COLLECTIONS.applications), where('entityId', 'in', ids));
    }, [db, opportunityIds]);

    const { data: allApps, isLoading } = useCollection<UserApplication>(applicationsQuery);

    const applications = useMemo(() => {
        if (!allApps) return [];
        return allApps.filter(app => opportunityIds.includes(app.entityId || ''));
    }, [allApps, opportunityIds]);

    const handleApplication = async (application: UserApplication, decision: 'approved' | 'rejected') => {
        const status = decision === 'approved' ? 'Onaylandı' : 'Reddedildi';
        try {
            // Güvenli rota: ownership doğrulaması + status + in-app bildirim +
            // Gelen Kutusu mesajı + FCM push hepsini sunucu tarafında yapar.
            // Eski client-side raw write (status + notification) bunları atlıyordu.
            const token = await authUser?.getIdToken();
            if (!token) {
                toast({
                    variant: 'destructive',
                    title: 'Oturum gerekli',
                    description: 'Lütfen tekrar giriş yapıp deneyin.',
                });
                return;
            }
            const res = await fetch(`/api/volunteering/applications/${application.id}/${decision === 'approved' ? 'approve' : 'reject'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });
            if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { errorCode?: string };
                const friendly = data.errorCode === 'FORBIDDEN'
                    ? 'Bu başvuruyu güncelleme yetkiniz yok.'
                    : data.errorCode === 'NOT_FOUND'
                        ? 'Başvuru bulunamadı.'
                        : 'Başvuru güncellenirken bir hata oluştu. Lütfen tekrar deneyin.';
                toast({
                    variant: 'destructive',
                    title: 'İşlem başarısız',
                    description: friendly,
                });
                return;
            }

            // volunteerCount.approved bakımı artık SERVER-SIDE yapılıyor
            // (approve/reject route'u Admin SDK ile yeniden hesaplıyor). Eski
            // client-side updateDoc `volunteering` update kuralına (ngoId==auth.uid)
            // takılıp sessizce PERMISSION_DENIED alıyordu; kaldırıldı.

            toast({
                title: `Başvuru ${status}`,
                description: decision === 'approved'
                    ? 'Gönüllü bilgilendirildi.'
                    : 'Başvuru reddedildi ve gönüllü bilgilendirildi.',
            });
        } catch (err) {
            console.error('[ngo-admin/volunteer] handleApplication failed', err);
            toast({
                variant: 'destructive',
                title: 'İşlem başarısız',
                description: 'Başvuru güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
            });
        }
    };

    return { applications, isLoading, handleApplication };
};

// Bir ilana ait başvuru sayıları (rozet + özet için). entityId = ilan id.
type PerListingCounts = { total: number; pending: number; approved: number; rejected: number };
const useApplicationCountsByListing = (applications: UserApplication[]): Record<string, PerListingCounts> => {
    return useMemo(() => {
        const map: Record<string, PerListingCounts> = {};
        for (const a of applications) {
            const key = a.entityId || '';
            if (!key) continue;
            if (!map[key]) map[key] = { total: 0, pending: 0, approved: 0, rejected: 0 };
            map[key].total++;
            if (a.status === 'Onaylandı') map[key].approved++;
            else if (a.status === 'Reddedildi') map[key].rejected++;
            else map[key].pending++;
        }
        return map;
    }, [applications]);
};

// Tek bir ilana ait başvuru listesi — ilan kartının ALTINDA (accordion içinde)
// gösterilir. Onayla/Reddet aksiyonları ve markup ESKİSİYLE birebir aynı; tek
// fark: artık global liste yerine o ilanın (entityId) başvurularını alır.
const ListingApplications = ({
    listingTitle, apps, handleApplication,
}: {
    listingTitle: string;
    apps: UserApplication[];
    handleApplication: (application: UserApplication, decision: 'approved' | 'rejected') => void;
}) => {
    if (apps.length === 0) {
        return <p className="text-center text-muted-foreground text-sm py-4">Bu ilana henüz başvuru yok.</p>;
    }
    return (
        <div className="space-y-3">
            {/* Başvuran listesi: indir / yazdır / paylaş (etkinliklerdeki gibi) */}
            <div className="flex justify-end">
                <VolunteerApplicants
                    title={listingTitle}
                    applicants={apps.map((a) => ({ name: a.userName || 'Gönüllü', status: a.status, date: a.date }))}
                />
            </div>
            {apps.map((app) => (
                <ApplicantRow key={app.id} app={app} listingTitle={listingTitle} handleApplication={handleApplication} />
            ))}
        </div>
    );
};

// Tek başvuran satırı — başvuranın gerçek adını (users/{uid}.name) çeker; başvuru
// kaydındaki userName boş/"Gönüllü" ise bununla doldurur (isim-soyisim gösterimi).
// "Profil" butonu, o ilana dair başvuru detayı + kullanıcının gönüllülük profilini
// gösteren ApplicantProfileDialog'u açar.
const ApplicantRow = ({
    app, listingTitle, handleApplication,
}: {
    app: UserApplication;
    listingTitle: string;
    handleApplication: (application: UserApplication, decision: 'approved' | 'rejected') => void;
}) => {
    const db = useFirestore();
    const userRef = useMemoFirebase(
        () => (db && app.userId ? doc(db, COLLECTIONS.users, app.userId) : null),
        [db, app.userId],
    );
    const { data: userDoc } = useDoc<{ name?: string; username?: string }>(userRef);
    // İsim önceliği: profil adı (isim-soyisim) → başvuru kaydındaki ad → 'Gönüllü'.
    const profileName = (userDoc?.name || '').trim();
    const displayName = profileName || (app.userName && app.userName !== 'Gönüllü' ? app.userName : '') || app.userName || 'Gönüllü';

    return (
        <div className="p-3 border rounded-lg flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 min-w-0">
                <Avatar>
                    <AvatarFallback>{displayName.charAt(0) || 'G'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-semibold text-sm break-words">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{app.date}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 basis-full sm:basis-auto justify-end">
              <ApplicantProfileDialog
                userId={app.userId}
                userName={displayName}
                application={{ status: app.status, date: app.date, title: app.title || listingTitle, rejectionReason: app.rejectionReason }}
              />
              {app.status === 'Onaylandı' ? (
                <Badge className="bg-green-600 hover:bg-green-600 text-white"><Check className="h-3.5 w-3.5 mr-1" /> Onaylandı</Badge>
              ) : app.status === 'Reddedildi' ? (
                <Badge variant="destructive">Reddedildi</Badge>
              ) : (
                <>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Beklemede</Badge>
                  <Button variant="secondary" size="sm" className="flex-1 sm:flex-grow-0 text-green-600 border-green-600 hover:bg-green-100" onClick={() => handleApplication(app, 'approved')}>Onayla</Button>
                  <Button variant="destructive" size="sm" className="flex-1 sm:flex-grow-0" onClick={() => handleApplication(app, 'rejected')}>Reddet</Button>
                </>
              )}
            </div>
        </div>
    );
};


const OpportunityManagementTab = ({ opportunities, isLoading, countsByListing, applications, handleApplication, ngoName, ngoLogoUrl }: { opportunities: Volunteering[], isLoading: boolean, countsByListing: Record<string, PerListingCounts>, applications: UserApplication[], handleApplication: (application: UserApplication, decision: 'approved' | 'rejected') => void, ngoName: string, ngoLogoUrl: string }) => {
    const { toast } = useToast();
    const db = useFirestore();

    // Gönüllülük ilanını "Tamamla" — status='Tamamlandı' + completedAt yazar.
    // Tamamlanan ilan "Tamamlananlar" tab'ına düşer; public sayfadan 24 saat
    // sonra otomatik kaldırılır (volunteering/page.tsx filtresi).
    const handleComplete = async (opp: Volunteering) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.volunteering, opp.id), {
                status: 'Tamamlandı',
                completedAt: serverTimestamp(),
            });
            toast({
                title: 'İlan Tamamlandı',
                description: 'Gönüllülük ilanı tamamlandı olarak işaretlendi. "Tamamlananlar" sekmesinde görebilirsin.',
            });
        } catch (err) {
            console.error('[ngo-admin/volunteer] handleComplete failed', err);
            toast({
                variant: 'destructive',
                title: 'İşlem başarısız',
                description: 'İlan tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.',
            });
        }
    };

    // Başvuruları ait olduğu ilana (entityId === ilan.id) grupla. Her ilan
    // kartının ALTINDAki accordion bölümü kendi başvurularını buradan alır.
    const appsByListing = useMemo(() => {
        const map: Record<string, UserApplication[]> = {};
        for (const a of applications) {
            const key = a.entityId || '';
            if (!key) continue;
            (map[key] ||= []).push(a);
        }
        return map;
    }, [applications]);
    // Herkese açık ilan linki için origin. SSR/ilk render'da window yok → canlı
    // domaine düş (PublishTab ile tutarlı), client'ta gerçek origin'e geçer.
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';

    const handleToggleStatus = async (opp: Volunteering) => {
        const isActive = (opp as Volunteering & { status?: string }).status !== 'Pasif';
        const nextStatus = isActive ? 'Pasif' : 'Aktif';
        try {
            await updateDoc(doc(db, COLLECTIONS.volunteering, opp.id), {
                status: nextStatus,
                ...(isActive ? { deactivatedAt: serverTimestamp() } : { reactivatedAt: serverTimestamp() }),
            });
            toast({
                title: isActive ? 'İlan Pasife Alındı' : 'İlan Yayına Alındı',
                description: isActive
                    ? 'Gönüllülük ilanı yayından kaldırıldı.'
                    : 'Gönüllülük ilanı yeniden yayınlandı.',
            });
        } catch (err) {
            console.error('[ngo-admin/volunteer] handleToggleStatus failed', err);
            toast({
                variant: 'destructive',
                title: 'İşlem başarısız',
                description: 'İlan durumu güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
            });
        }
    };

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;

    return (
        <div className="space-y-4">
            {opportunities.length > 0 ? opportunities.map((opp) => {
              const status = (opp as Volunteering & { status?: string }).status;
              const isPassive = status === 'Pasif';
              // "Beklemede" = ilan süper admin onayı bekliyor. STK bu durumda
              // statusü değiştiremez (rules); yalnızca bilgi rozeti gösterilir.
              const isPending = status === 'Beklemede';
              const lc = countsByListing[opp.id];
              const pendingCount = lc?.pending || 0;
              const totalApps = lc?.total ?? (opp.volunteerCount?.applications || 0);
              const listingApps = appsByListing[opp.id] || [];
              return (
              // Yayındaki (Aktif) ilan renkli/vurgulu; yayında olmayan (Pasif) gri/soluk.
              <Card key={opp.id} className={`relative ${isPassive ? 'opacity-60 grayscale' : 'border-primary/30 ring-1 ring-primary/10'}`}>

                {/* Bildirim rozeti: bekleyen başvuru sayısı (sağ üst köşe, turuncu yuvarlak). */}
                {pendingCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 z-10 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#F4624A] px-2 text-xs font-black text-white shadow-md ring-2 ring-background"
                    title={`${pendingCount} bekleyen başvuru`}
                    aria-label={`${pendingCount} bekleyen başvuru`}
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}

                <CardHeader className='pb-4'>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <p><strong>Durum:</strong>{' '}
                          {isPending ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="h-3.5 w-3.5 mr-1" /> Beklemede</Badge>
                          ) : (
                            <Badge variant={isPassive ? 'secondary' : 'default'}>{isPassive ? 'Pasif' : 'Aktif'}</Badge>
                          )}
                        </p>
                        <p><strong>Başvurular:</strong> {totalApps}{pendingCount > 0 && <span className="text-[#F4624A] font-semibold"> ({pendingCount} bekleyen)</span>}</p>
                        {isPending && (
                          <p className="text-xs text-amber-700 mt-1">Bu ilan süper admin onayı bekliyor. Onaylandığında otomatik yayına alınır.</p>
                        )}
                    </div>
                    {/* İLANIN ALTINDA: o ilana ait başvurular + onayla/reddet aksiyonları,
                        açılır (collapsible) bölüm içinde toplanır. */}
                    <Accordion type="single" collapsible className="border rounded-lg px-3">
                      <AccordionItem value="apps" className="border-b-0">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Başvurular ({listingApps.length})
                            {pendingCount > 0 && (
                              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F4624A] px-1.5 text-[11px] font-bold text-white">{pendingCount}</span>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ListingApplications listingTitle={opp.title} apps={listingApps} handleApplication={handleApplication} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                </CardContent>
                {/* Aksiyonlar — etkinlik yönetimi kartıyla aynı buton seti:
                    Sosyal Medya · Google Tanıt · Kayıt/Check-in QR · Ödül · Katılımcılar
                    · Mesaj Gönder · Yaka Kartları · Sertifikalar · Tamamla + yayın kontrolü. */}
                <CardFooter className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    <SocialShareButton
                        kind="volunteering"
                        item={{
                            title: opp.title,
                            description: opp.description || '',
                            date: opp.dates?.eventStart || '',
                            location: opp.location?.address || '',
                            city: opp.location?.city || '',
                            ngoName: ngoName || opp.organization || '',
                            url: `${origin}/volunteering/${opp.id}`,
                            ngoId: opp.ngoId || '',
                            itemId: opp.id,
                        }}
                    />
                    {/* Google Ad Grants ile ücretsiz tanıtım */}
                    <Button asChild variant="outline" size="sm" className="rounded-xl w-full sm:w-auto border-blue-500/30 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700">
                        <Link href={`/ngo-admin/ads?source=volunteering&listingId=${opp.id}&q=${encodeURIComponent(opp.title || '')}`}>
                            <Megaphone className="h-4 w-4 mr-1.5" /> Google&apos;da Ücretsiz Tanıt
                        </Link>
                    </Button>
                    <VolunteeringCheckinQR oppId={opp.id} logoUrl={ngoLogoUrl} />
                    <RewardManager kind="volunteering" id={opp.id} />
                    <EventAttendees eventId={opp.id} label="Gönüllüler" endpoint={`/api/volunteering/${opp.id}/attendees`} />
                    <BroadcastMessageButton targetId={opp.id} kind="volunteering" title={opp.title} className="rounded-xl w-full sm:w-auto" />
                    <EventBadgeCards eventId={opp.id} eventName={opp.title} ngoName={ngoName} logoUrl={ngoLogoUrl} orgKind="volunteer" attendeesEndpoint={`/api/volunteering/${opp.id}/attendees`} />
                    <EventCertificates eventId={opp.id} eventName={opp.title} ngoName={ngoName} logoUrl={ngoLogoUrl} orgKind="volunteer" attendeesEndpoint={`/api/volunteering/${opp.id}/attendees`} />
                    {/* Süper admin onayı bekleyen (Beklemede) ilanlarda STK statusü
                        değiştiremez → yayınla/pasife al gösterilmez. */}
                    {isPending ? null : isPassive ? (
                        <Button variant="default" size="sm" className="rounded-xl w-full sm:w-auto" onClick={() => handleToggleStatus(opp)}>Yayına Al</Button>
                    ) : (
                        <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto" onClick={() => handleToggleStatus(opp)}>Pasife Al</Button>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl w-full sm:w-auto"
                        onClick={() => handleComplete(opp)}
                        disabled={status === 'Tamamlandı'}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Tamamla
                    </Button>
                </CardFooter>
              </Card>
              );
            }) : <p className="text-center p-8 text-muted-foreground">Aktif ilanınız bulunmuyor.</p>}
        </div>
    );
};


// Tek kod bloğu kartı (iframe/API/RSS) — kopyalanabilir.
const PublishCodeBlock = ({ icon: Icon, title, desc, value, label, onCopy }: {
  icon: React.ElementType; title: string; desc: string; value: string; label: string;
  onCopy: (text: string, label: string) => void;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</CardTitle>
      <CardDescription className="text-xs">{desc}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      <pre className="text-[11px] bg-muted rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono">{value}</pre>
      <Button size="sm" variant="outline" onClick={() => onCopy(value, label)}><Copy className="h-3.5 w-3.5 mr-1.5" /> Kopyala</Button>
    </CardContent>
  </Card>
);

// Web'de Yayınla — STK kendi sitesinde gönüllülük ilanlarını göstersin diye
// iframe / JSON API / RSS kodları (tek ilan veya tümü). Tüm uçlar public + CORS.
const PublishTab = ({ ngoId, opportunities }: { ngoId: string | null; opportunities: Volunteering[] }) => {
  const { toast } = useToast();
  const [selected, setSelected] = React.useState<string>('all');
  if (!ngoId) return <p className="text-center text-muted-foreground p-8">Kurum bulunamadı.</p>;

  const base = 'https://hangel.org';
  const embedUrl = selected === 'all'
    ? `${base}/api/public/volunteering/${ngoId}/embed`
    : `${base}/api/public/volunteering/${ngoId}/embed?listing=${selected}`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" style="border:0;border-radius:16px" loading="lazy" title="Gönüllülük İlanları"></iframe>`;
  const apiUrl = `${base}/api/public/volunteering/${ngoId}`;
  const rssUrl = `${base}/api/public/volunteering/${ngoId}/rss`;

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: `${label} kopyalandı` }); }
    catch { toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Metni elle seçip kopyalayın.' }); }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed">
          Gönüllülük ilanlarını kendi web sitende göster. Aşağıdaki kodları sitene yapıştır — ilanlar otomatik güncellenir. Tek bir ilanı yayınlamak için aşağıdan seç.
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Hangi ilan(lar)?</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full h-11 rounded-xl border bg-card px-3 text-sm"
        >
          <option value="all">Tüm yayındaki ilanlar</option>
          {opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </div>

      <PublishCodeBlock icon={Code2} title="iframe (web sitesine göm)" desc="HTML sayfanın istediğin yerine yapıştır." value={iframeCode} label="iframe kodu" onCopy={copy} />
      <PublishCodeBlock icon={Link2} title="JSON API" desc="Geliştirici için: ilanları JSON olarak çek (CORS açık)." value={apiUrl} label="API adresi" onCopy={copy} />
      <PublishCodeBlock icon={Rss} title="RSS akışı" desc="RSS okuyucu / site beslemesi için." value={rssUrl} label="RSS adresi" onCopy={copy} />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Canlı Önizleme</CardTitle></CardHeader>
        <CardContent>
          <iframe src={embedUrl} className="w-full h-[420px] rounded-xl border" loading="lazy" title="Önizleme" />
        </CardContent>
      </Card>
    </div>
  );
};

const VolunteerPage = () => {
  const db = useFirestore();
  // Aktif kurumu tek kaynaktan (ActiveEntityProvider) çöz. Eski kod
  // `searchParams.get('id') || authUser.uid` kullanıyordu: ?id yoksa kullanıcı
  // uid'sine düşüyor ve yanlış/boş scope üretiyordu. useActiveEntity URL →
  // localStorage → managedNgoId → adminUserId önceliğiyle doğru STK id'sini verir,
  // böylece STK yalnızca KENDİ ilanlarını ve onlara gelen başvuruları görür.
  const { id: activeId, isLoading: entityLoading } = useActiveEntity();
  const { user: authUser } = useUser();

  // ngoId eşleşmesi: doğru STK id'si (activeId) VE — eski hatalı kayıtlar için —
  // admin'in user uid'si. Create form bir dönem ngoId'yi uid'ye düşürdüğü için
  // (bkz #8) o ilanlar uid ile yazılmıştı; ikisini birden sorgulayıp kurtarıyoruz.
  const oppsQuery = useMemoFirebase(() => {
    if (!db || !activeId) return null;
    const ids = Array.from(new Set([activeId, authUser?.uid].filter(Boolean))) as string[];
    return query(collection(db, COLLECTIONS.volunteering), where('ngoId', 'in', ids));
  }, [db, activeId, authUser?.uid]);

  const { data: opportunities, isLoading: oppsLoading } = useCollection<Volunteering>(oppsQuery);
  const isLoading = entityLoading || oppsLoading;

  // Başvuruları + onay/red mantığını tek kaynaktan çek (hem üst ilan rozetleri
  // hem alttaki başvuru listesi aynı veriyi kullanır). Veri yazımı korunur.
  const oppList = useMemo(() => opportunities || [], [opportunities]);
  // Aktif (yayında/pasif) ve tamamlanan ilanları ayır. Tamamlananlar ayrı tab'da
  // arşivlenir; public listeden (volunteering/page.tsx) 24 saat sonra otomatik düşer.
  const activeOpps = useMemo(
    () => oppList.filter((o) => (o as Volunteering & { status?: string }).status !== 'Tamamlandı'),
    [oppList],
  );
  const completedOpps = useMemo(
    () => oppList.filter((o) => (o as Volunteering & { status?: string }).status === 'Tamamlandı'),
    [oppList],
  );
  const { applications, isLoading: appsLoading, handleApplication } = useVolunteerApplications(oppList);
  const countsByListing = useApplicationCountsByListing(applications);

  // Aktif STK doc'u — bozuk ilan self-heal için ad + logo kaynağı.
  const ngoDocRef = useMemoFirebase(() => {
    if (!db || !activeId) return null;
    return doc(db, COLLECTIONS.ngos, activeId);
  }, [db, activeId]);
  const { data: ngoDoc } = useDoc<NGO>(ngoDocRef);

  // Bir kez düzeltilmiş ilan id'lerini tut (oturum içi idempotency; her snapshot
  // güncellemesinde yeniden yazmayı önler).
  const healedRef = useRef<Set<string>>(new Set());

  // SELF-HEAL: eski ilanlar ngoId=admin uid ile yazılmış, organization='Kuruluş'
  // placeholder + organizerLogoUrl boş kalmıştı. Aktif STK bilindiğine göre bunları
  // bir kez düzelt. Sadece gerçekten değişen alanları yaz (gereksiz write yok),
  // undefined yazma yok.
  useEffect(() => {
    if (!db || !activeId || !ngoDoc || !opportunities) return;
    const orgName = ngoDoc.name;
    const orgLogo = ngoDoc.avatarUrl;
    for (const opp of opportunities) {
      if (healedRef.current.has(opp.id)) continue;
      const update: Record<string, string> = {};
      const needsNgoId = opp.ngoId !== activeId;
      const needsOrg = opp.organization === 'Kuruluş';
      if (!needsNgoId && !needsOrg) continue; // düzeltme gerekmeyenlere dokunma
      if (needsNgoId) update.ngoId = activeId;
      if (orgName && (needsOrg || opp.organization === 'Kuruluş' || !opp.organization)) {
        update.organization = orgName;
      }
      if (orgLogo && !opp.organizerLogoUrl) {
        update.organizerLogoUrl = orgLogo;
      }
      if (Object.keys(update).length === 0) continue; // yazılacak (tanımlı) alan yok
      healedRef.current.add(opp.id);
      updateDoc(doc(db, COLLECTIONS.volunteering, opp.id), update).catch((err) => {
        console.error('[ngo-admin/volunteer] self-heal failed', opp.id, err);
        healedRef.current.delete(opp.id); // başarısızsa tekrar denenebilsin
      });
    }
  }, [db, activeId, ngoDoc, opportunities]);

  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h1 className="text-2xl font-bold">Gönüllülük Yönetimi</h1>
            <Button asChild>
              <Link href="/ngo-admin/volunteer/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni İlan Oluştur
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manage">İlanlar & Başvurular</TabsTrigger>
              <TabsTrigger value="completed">Tamamlananlar{completedOpps.length > 0 ? ` (${completedOpps.length})` : ''}</TabsTrigger>
              <TabsTrigger value="publish">Web'de Yayınla</TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-4 space-y-4">
                {/* Her ilan bir başlık kartı; o ilana ait başvurular + onay/red
                    aksiyonları kartın ALTINDA açılır (collapsible) bölümde
                    gruplanır. Üstte toplam başvuru özeti. */}
                <section className="space-y-3">
                    <h2 className="text-lg font-bold px-1">Gönüllülük İlanların</h2>
                    {applications.length > 0 && !appsLoading && (
                      <Card className="bg-muted/40">
                        <CardContent className="p-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          {(() => {
                            let approved = 0, pending = 0, rejected = 0;
                            for (const a of applications) {
                              if (a.status === 'Onaylandı') approved++;
                              else if (a.status === 'Reddedildi') rejected++;
                              else pending++;
                            }
                            return (
                              <>
                                <span className="font-semibold">Toplam başvuru: {applications.length}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-green-600 font-medium">Onaylanan: {approved}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-amber-600 font-medium">Bekleyen: {pending}</span>
                                {rejected > 0 && (
                                  <>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-red-600 font-medium">Reddedilen: {rejected}</span>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    )}
                    <OpportunityManagementTab opportunities={activeOpps} isLoading={isLoading} countsByListing={countsByListing} applications={applications} handleApplication={handleApplication} ngoName={ngoDoc?.name || ''} ngoLogoUrl={ngoDoc?.avatarUrl || ''} />
                </section>
            </TabsContent>
            <TabsContent value="completed" className="mt-4 space-y-4">
                <section className="space-y-3">
                    <h2 className="text-lg font-bold px-1">Tamamlanan İlanlar</h2>
                    <p className="text-xs text-muted-foreground px-1">
                        Tamamlanmış gönüllülük ilanları burada arşivlenir. Public gönüllülük sayfasından tamamlanma anından 24 saat sonra otomatik kaldırılır.
                    </p>
                    <OpportunityManagementTab opportunities={completedOpps} isLoading={isLoading} countsByListing={countsByListing} applications={applications} handleApplication={handleApplication} ngoName={ngoDoc?.name || ''} ngoLogoUrl={ngoDoc?.avatarUrl || ''} />
                </section>
            </TabsContent>
            <TabsContent value="publish" className="mt-4">
                <PublishTab ngoId={activeId} opportunities={oppList} />
            </TabsContent>
          </Tabs>
        </div>
    </Suspense>
  );
};

export default function Page() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <VolunteerPage />
        </Suspense>
    );
}
