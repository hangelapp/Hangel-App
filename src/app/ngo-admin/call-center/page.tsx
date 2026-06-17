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

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PhoneCall, Clock, ArrowLeft } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { OnboardingWizard } from './_components/OnboardingWizard';
import { CallDashboard } from './_components/CallDashboard';

const NGO_CALL_CENTER = 'ngoCallCenter';

interface NgoCallCenterDoc {
  status?: 'pending' | 'active' | 'suspended' | 'rejected';
  callerIdNumber?: string;
  packageId?: string;
  providerId?: string;
  monthlyMinutesQuota?: number;
  currentMonthUsage?: number;
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

export default function NgoCallCenterPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(
    () => (user ? doc(db, 'users', user.uid) : null),
    [db, user],
  );
  const { data: userDoc, isLoading: userDocLoading } = useDoc<UserDocLite>(userRef);
  const ngoId = userDoc?.managedNgoId ?? null;

  const ccRef = useMemoFirebase(
    () => (ngoId ? doc(db, NGO_CALL_CENTER, ngoId) : null),
    [db, ngoId],
  );
  const { data: ccDoc, isLoading: ccLoading } = useDoc<NgoCallCenterDoc>(ccRef);

  // STK profil doc'u — onboarding'de Kurum Tipi (kilitli) + Kütük No (otomatik) için.
  const ngoRef = useMemoFirebase(
    () => (ngoId ? doc(db, 'ngos', ngoId) : null),
    [db, ngoId],
  );
  const { data: ngoDoc } = useDoc<NgoDocLite>(ngoRef);

  if (isUserLoading || userDocLoading || (ngoId && ccLoading)) {
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

  // Hiç kayıt yok → onboarding wizard.
  if (!ccDoc) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
        <Link href="/ngo-admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Yönetim Paneli
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-emerald-600" /> Çağrı Merkezi Başvurusu
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            STK'nız için sanal santral hizmetini birkaç adımda başlatın.
          </p>
        </div>
        <OnboardingWizard
          ngoId={ngoId}
          ngoName={ngoDoc?.name}
          ngoType={ngoDoc?.type}
          ngoKutukNo={ngoDoc?.kutukNo}
        />
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-4">
        <Link href="/ngo-admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Yönetim Paneli
        </Link>
        <Card className="border-amber-300 bg-amber-50/40">
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Başvurunuz inceleniyor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Başvurunuz alındı ve PBX sağlayıcı firmaya iletildi. Aktivasyon
              tamamlandığında bu sayfa otomatik olarak çağrı paneline dönüşecek.
            </p>
            <ul className="text-muted-foreground text-xs space-y-1 list-disc ml-5">
              <li>Caller ID numarası: {ccDoc.callerIdNumber ?? '—'}</li>
              <li>Paket: {ccDoc.packageId ?? '—'}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-4">
        <Card className="border-rose-300 bg-rose-50/40">
          <CardHeader>
            <CardTitle className="text-base">Başvurunuz reddedildi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              hangel ekibi başvurunuzu reddetti. Lütfen destek ile iletişime geçin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // active veya suspended → dashboard'a düş.
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
          Aktif görüşmeler, kotalar ve geçmiş kayıtlarınız.
        </p>
      </div>
      <CallDashboard ngoId={ngoId} ccDoc={ccDoc} />
    </div>
  );
}
