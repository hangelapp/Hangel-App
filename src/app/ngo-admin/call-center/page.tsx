'use client';

/**
 * /ngo-admin/call-center
 *
 * STK çağrı merkezi (sanal santral) ana sayfası. Üç olası state:
 *   - ngoCallCenter doc yok                → OnboardingWizard
 *   - ngoCallCenter.status === 'pending'   → bekleme ekranı
 *   - ngoCallCenter.status === 'active'    → CallDashboard
 *
 * KVKK: STK = Veri Sorumlusu. Recording link sadece kendi tenant'ı için
 * görüntülenir (super-admin'e gösterilmez).
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PhoneCall, Clock, ArrowLeft, FileText, Lock, CheckCircle2, Settings, MessageCircle, ListChecks, Calendar, HeartHandshake, MoreHorizontal, ChevronDown, Mic, Target, BarChart3, TrendingUp, Sun, MonitorPlay } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { OnboardingWizard } from './_components/OnboardingWizard';
import { CallDashboard } from './_components/CallDashboard';
import { CallCenterSettings } from './_components/CallCenterSettings';
import { CallFlowSettings } from './_components/CallFlowSettings';
import { BlocklistSettings } from './_components/BlocklistSettings';
import { NotificationBell } from './_components/NotificationBell';
import { AgentStatsPanel } from './_components/AgentStatsPanel';
import { PipelineBoard } from './_components/PipelineBoard';
import { MyDayPanel } from './_components/MyDayPanel';
import { Wallboard } from './_components/Wallboard';
import { SantralIntro } from './_components/SantralIntro';
import { CommunicationHub } from './_components/CommunicationHub';
import { CallLists } from './_components/CallLists';
import { ParticipantsPanel } from './_components/ParticipantsPanel';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';

export interface CallCenterExtension {
  ext: string;
  label: string;
  assignedToUid?: string | null;
  assignedToName?: string | null;
  assignedToPhone?: string | null;
}

export interface CallCenterSettingsData {
  recordingEnabled?: boolean;
  kvkkAnnouncement?: boolean;
  callerIdNumber?: string;
  inboundAgentUid?: string | null;
  inboundAgentName?: string | null;
}

interface NgoCallCenterDoc {
  status?: 'pending' | 'active' | 'suspended' | 'rejected';
  callerIdNumber?: string;
  packageId?: string;
  providerId?: string;
  monthlyMinutesQuota?: number;
  currentMonthUsage?: number;
  extensions?: CallCenterExtension[];
  settings?: CallCenterSettingsData;
}

interface UserDocLite {
  managedNgoId?: string;
  role?: string;
}

interface NgoDocLite {
  name?: string;
  type?: 'Dernek' | 'Vakıf' | 'Spor Kulübü' | 'Özel İzinli';
  kutukNo?: string;
}

// Onaylı değilken kilit kartı — Çağrı Merkezi + Ayarlar sekmeleri için.
function LockedNotice({ title, status }: { title: string; status?: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center gap-2">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          {status === 'pending'
            ? 'Başvurunuz inceleniyor. Onaylandığında bu bölüm açılır.'
            : status === 'rejected'
              ? 'Başvurunuz reddedildi. Lütfen destek ile iletişime geçin.'
              : 'Bu bölümü kullanmak için önce "Başvuru" sekmesinden çağrı merkezi başvurunuzu tamamlayın ve onay alın.'}
        </p>
      </CardContent>
    </Card>
  );
}

export default function NgoCallCenterPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  // Kontrollü sekme — İletişim Merkezi hub'ı CTA'larından Çağrı Merkezi'ne geçebilsin.
  const [tab, setTab] = useState<string | null>(null);

  const userRef = useMemoFirebase(
    () => (user ? doc(db, 'users', user.uid) : null),
    [db, user],
  );
  const { data: userDoc, isLoading: userDocLoading } = useDoc<UserDocLite>(userRef);
  // Aktif entity (üst switcher: ?id=&type=STK). Super-admin başka STK'ya bakınca
  // doğru ngoId buradan gelir; düz ngo-admin'de managedNgoId'ye düşer.
  const { id: activeEntityId, kind: activeEntityKind, isLoading: entityLoading } = useActiveEntity();
  const ngoId = (activeEntityKind === 'ngo' ? activeEntityId : null) ?? userDoc?.managedNgoId ?? null;

  // ngoCallCenter durumu — client Firestore read rule'una takıldığı için server
  // API'sinden (Admin SDK) okunur; rules deploy gerekmeden sekme gating'i çalışır.
  const [ccDoc, setCcDoc] = useState<NgoCallCenterDoc | null>(null);
  const [ccLoading, setCcLoading] = useState(true);
  // Kurulum yapılmamışken: önce tanıtım vitrini, "Hemen başla" ile sihirbaza geç.
  const [showWizard, setShowWizard] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      if (!user || !ngoId) { if (!cancelled) setCcLoading(false); return; }
      if (!cancelled) setCcLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/ngo-admin/call-center/status?ngoId=${encodeURIComponent(ngoId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) setCcDoc(res.ok && data.ok ? (data.callCenter ?? null) : null);
      } catch {
        if (!cancelled) setCcDoc(null);
      } finally {
        if (!cancelled) setCcLoading(false);
      }
    }
    void loadStatus();
    return () => { cancelled = true; };
  }, [user, ngoId]);

  // STK profil doc'u — onboarding'de Kurum Tipi (kilitli) + Kütük No (otomatik) için.
  const ngoRef = useMemoFirebase(
    () => (ngoId ? doc(db, 'ngos', ngoId) : null),
    [db, ngoId],
  );
  const { data: ngoDoc } = useDoc<NgoDocLite>(ngoRef);

  if (isUserLoading || userDocLoading || entityLoading || (ngoId && ccLoading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Oturum açın.</p>
      </div>
    );
  }

  if (!ngoId) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Yetki gerekli</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Çağrı merkezini açabilmek için bir STK yöneticisi olmalısınız.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = ccDoc?.status;
  const isApproved = status === 'active' || status === 'suspended';
  const defaultTab = isApproved ? 'callcenter' : 'basvuru';

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-4">
      <Link href="/ngo-admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Yönetim Paneli
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-emerald-600" /> Çağrı Merkezi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            STK'nız için sanal santral — başvuru, çağrı paneli ve ayarlar.
          </p>
        </div>
        {isApproved && <NotificationBell />}
      </div>

      <Tabs value={tab ?? defaultTab} onValueChange={setTab} className="w-full">
        {/* Sekme çubuğu dar ekranda yatay kaydırılır (taşma kesilmez). */}
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          <TabsTrigger value="basvuru" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Başvuru
            {isApproved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          </TabsTrigger>
          <TabsTrigger value="callcenter" className="flex items-center gap-1.5">
            <PhoneCall className="h-4 w-4" /> Çağrı Merkezi
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          {/* Arama Listeleri ve hemen ALTINDA katılımcı sekmeleri (istenen sıra) */}
          <TabsTrigger value="listeler" className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> Arama Listeleri
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="etkinlik-katilimcilari" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Etkinlik Katılımcıları
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="gonullu-katilimcilari" className="flex items-center gap-1.5">
            <HeartHandshake className="h-4 w-4" /> Gönüllü Katılımcıları
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>

          {/* "Diğer" açılır menüsü — İletişim Merkezi + ileride eklenecek sekmeler
              buraya toplanır (sekme çubuğu kalabalıklaşmasın). Seçilince ilgili
              TabsContent açılır; aktif alt-sekme menü etiketinde gösterilir. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[on=true]:bg-background data-[on=true]:text-foreground data-[on=true]:shadow-sm"
                data-on={['iletisim', 'performans', 'huni', 'bugun', 'wallboard'].includes(tab ?? '') ? 'true' : undefined}
              >
                <MoreHorizontal className="h-4 w-4" /> Diğer
                {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTab('bugun')} disabled={!isApproved}>
                <Sun className="mr-2 h-4 w-4" /> Bugünkü İşim
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTab('iletisim')}>
                <MessageCircle className="mr-2 h-4 w-4" /> İletişim Merkezi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTab('huni')} disabled={!isApproved}>
                <TrendingUp className="mr-2 h-4 w-4" /> Bağış Hunisi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTab('performans')} disabled={!isApproved}>
                <BarChart3 className="mr-2 h-4 w-4" /> Temsilci Performansı
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTab('wallboard')} disabled={!isApproved}>
                <MonitorPlay className="mr-2 h-4 w-4" /> Süpervizör Panosu
              </DropdownMenuItem>
              {/* Yazılı olan ama panele bağlı olmayan sayfalar buradan erişilir. */}
              <DropdownMenuItem asChild disabled={!isApproved}>
                <Link href="/ngo-admin/call-center/recordings">
                  <Mic className="mr-2 h-4 w-4" /> Çağrı Geçmişi & Kayıtlar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!isApproved}>
                <Link href="/ngo-admin/call-center/queue">
                  <Target className="mr-2 h-4 w-4" /> Arama Sırası (Cevapsız / Geri Ara)
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TabsTrigger value="ayarlar" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" /> Ayarlar
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Sekme 1 — Başvuru: kurulum yoksa önce tanıtım vitrini, sonra sihirbaz */}
        <TabsContent value="basvuru" className="mt-4">
          {!ccDoc && !showWizard ? (
            <div className="max-w-4xl">
              <SantralIntro onStart={() => setShowWizard(true)} />
            </div>
          ) : (
          <div className="max-w-3xl space-y-4">
            {!ccDoc && (
              <OnboardingWizard
                ngoId={ngoId}
                ngoName={ngoDoc?.name}
                ngoType={ngoDoc?.type}
                ngoKutukNo={ngoDoc?.kutukNo}
              />
            )}
            {status === 'pending' && (
              <Card className="border-amber-300 bg-amber-50/40">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Başvurunuz inceleniyor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Başvurunuz alındı ve PBX sağlayıcı firmaya iletildi. Onaylandığında Çağrı Merkezi ve Ayarlar sekmeleri açılır.</p>
                  <ul className="text-muted-foreground text-xs space-y-1 list-disc ml-5">
                    <li>Caller ID numarası: {ccDoc?.callerIdNumber ?? '—'}</li>
                    <li>Paket: {ccDoc?.packageId ?? '—'}</li>
                  </ul>
                </CardContent>
              </Card>
            )}
            {status === 'rejected' && (
              <Card className="border-rose-300 bg-rose-50/40">
                <CardHeader><CardTitle className="text-base">Başvurunuz reddedildi</CardTitle></CardHeader>
                <CardContent><p className="text-sm">hangel ekibi başvurunuzu reddetti. Lütfen destek ile iletişime geçin.</p></CardContent>
              </Card>
            )}
            {isApproved && (
              <Card className="border-emerald-300 bg-emerald-50/40">
                <CardHeader className="flex flex-row items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base">Başvurunuz onaylandı 🧡</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Çağrı merkeziniz aktif. "Çağrı Merkezi" sekmesinden arama yapabilir, "Ayarlar"dan dahili numaraları yönetebilirsiniz.</p>
                  <ul className="text-muted-foreground text-xs space-y-1 list-disc ml-5">
                    <li>Caller ID numarası: {ccDoc?.callerIdNumber ?? '—'}</li>
                    <li>Paket: {ccDoc?.packageId ?? '—'}</li>
                    <li>Durum: {status === 'suspended' ? 'Askıda' : 'Aktif'}</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
          )}
        </TabsContent>

        {/* Sekme 2 — Çağrı Merkezi (yalnızca onaylı STK) */}
        <TabsContent value="callcenter" className="mt-4">
          {isApproved && ccDoc ? (
            <CallDashboard ngoId={ngoId} ccDoc={ccDoc} />
          ) : (
            <LockedNotice title="Çağrı Merkezi kilitli" status={status} />
          )}
        </TabsContent>

        {/* Etkinlik Katılımcıları — RSVP'lerden senkron; tek-tuş arama + not */}
        <TabsContent value="etkinlik-katilimcilari" className="mt-4">
          {isApproved && ccDoc ? (
            <ParticipantsPanel source="event" />
          ) : (
            <LockedNotice title="Etkinlik Katılımcıları kilitli" status={status} />
          )}
        </TabsContent>

        {/* Gönüllü Katılımcıları — gönüllü başvurularından senkron */}
        <TabsContent value="gonullu-katilimcilari" className="mt-4">
          {isApproved && ccDoc ? (
            <ParticipantsPanel source="volunteer" />
          ) : (
            <LockedNotice title="Gönüllü Katılımcıları kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme — Arama Listeleri (yalnızca onaylı STK) */}
        <TabsContent value="listeler" className="mt-4">
          {isApproved && ccDoc ? (
            <CallLists ngoId={ngoId} />
          ) : (
            <LockedNotice title="Arama Listeleri kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme 4 — İletişim Merkezi (WhatsApp'tan çağrıya akış; yalnızca onaylı STK) */}
        <TabsContent value="iletisim" className="mt-4">
          {isApproved && ccDoc ? (
            <CommunicationHub ccDoc={ccDoc} onGoToCallCenter={() => setTab('callcenter')} />
          ) : (
            <LockedNotice title="İletişim Merkezi kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme 4d — Bugünkü İşim ("Diğer" menüsünden; yalnızca onaylı STK) */}
        <TabsContent value="bugun" className="mt-4">
          {isApproved && ccDoc ? (
            <MyDayPanel />
          ) : (
            <LockedNotice title="Bugünkü İşim kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme 4e — Süpervizör Panosu ("Diğer" menüsünden; yalnızca onaylı STK) */}
        <TabsContent value="wallboard" className="mt-4">
          {isApproved && ccDoc ? (
            <Wallboard />
          ) : (
            <LockedNotice title="Süpervizör Panosu kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme 4c — Bağış Hunisi ("Diğer" menüsünden; yalnızca onaylı STK) */}
        <TabsContent value="huni" className="mt-4">
          {isApproved && ccDoc ? (
            <PipelineBoard />
          ) : (
            <LockedNotice title="Bağış Hunisi kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme 4b — Temsilci Performansı ("Diğer" menüsünden; yalnızca onaylı STK) */}
        <TabsContent value="performans" className="mt-4">
          {isApproved && ccDoc ? (
            <AgentStatsPanel />
          ) : (
            <LockedNotice title="Temsilci Performansı kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme 5 — Ayarlar (yalnızca onaylı STK): dahili/kayıt ayarları + çağrı akışı */}
        <TabsContent value="ayarlar" className="mt-4">
          {isApproved && ccDoc ? (
            <div className="space-y-8">
              <CallCenterSettings ngoId={ngoId} ccDoc={ccDoc} />
              <div className="border-t border-border pt-6">
                <CallFlowSettings />
              </div>
              <div className="border-t border-border pt-6">
                <BlocklistSettings />
              </div>
            </div>
          ) : (
            <LockedNotice title="Ayarlar kilitli" status={status} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
