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
import { Loader2, PhoneCall, Clock, ArrowLeft, FileText, Lock, CheckCircle2, Settings, MessageCircle, ListChecks } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { OnboardingWizard } from './_components/OnboardingWizard';
import { CallDashboard } from './_components/CallDashboard';
import { CallCenterSettings } from './_components/CallCenterSettings';
import { CommunicationHub } from './_components/CommunicationHub';
import { CallLists } from './_components/CallLists';
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
          <PhoneCall className="h-6 w-6 text-emerald-600" /> Çağrı Merkezi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          STK'nız için sanal santral — başvuru, çağrı paneli ve ayarlar.
        </p>
      </div>

      <Tabs value={tab ?? defaultTab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="basvuru" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Başvuru
            {isApproved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          </TabsTrigger>
          <TabsTrigger value="callcenter" className="flex items-center gap-1.5">
            <PhoneCall className="h-4 w-4" /> Çağrı Merkezi
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="listeler" className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> Arama Listeleri
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="iletisim" className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" /> İletişim Merkezi
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="ayarlar" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" /> Ayarlar
            {!isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
        </TabsList>

        {/* Sekme 1 — Başvuru */}
        <TabsContent value="basvuru" className="mt-4">
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
        </TabsContent>

        {/* Sekme 2 — Çağrı Merkezi (yalnızca onaylı STK) */}
        <TabsContent value="callcenter" className="mt-4">
          {isApproved && ccDoc ? (
            <CallDashboard ngoId={ngoId} ccDoc={ccDoc} />
          ) : (
            <LockedNotice title="Çağrı Merkezi kilitli" status={status} />
          )}
        </TabsContent>

        {/* Sekme 3 — Arama Listeleri (yalnızca onaylı STK) */}
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

        {/* Sekme 5 — Ayarlar (yalnızca onaylı STK) */}
        <TabsContent value="ayarlar" className="mt-4">
          {isApproved && ccDoc ? (
            <CallCenterSettings ngoId={ngoId} ccDoc={ccDoc} />
          ) : (
            <LockedNotice title="Ayarlar kilitli" status={status} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
