'use client';

/**
 * /ngo-admin/messaging/setup
 *
 * STK yöneticisi için toplu SMS + toplu mail "adım adım kurulum sihirbazı".
 * Santral (call-center) onboarding deseninin SMS/mail karşılığı.
 *
 * Durum `ngoMessagingWallets/{ngoId}.setup` içinde tutulur:
 *   - status 'not_started' veya yok → sihirbaz
 *   - status 'pending'             → bekleme ekranı (wizard içinde)
 *   - status 'active'              → /ngo-admin/sms'e yönlendir (wizard içinde)
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MessagesSquare } from 'lucide-react';
import { useUser } from '@/firebase';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { MessagingSetupWizard } from './_components/MessagingSetupWizard';

type SetupStatus = 'not_started' | 'pending' | 'active';

interface SetupState {
  status: SetupStatus;
  smsSenderId: string | null;
  mailFromName: string | null;
  mailFromEmail: string | null;
  mailDomain: string | null;
  docsKvkk: string | boolean | null;
  docsIys: string | boolean | null;
  docsDilekce: string | boolean | null;
}

export default function MessagingSetupPage() {
  const { user: authUser, isUserLoading } = useUser();
  const { id: ngoId, isLoading: entityLoading, withEntityHeaders } = useActiveEntity();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authUser) return;
      setLoading(true);
      try {
        const token = await authUser.getIdToken();
        const res = await fetch('/api/ngo-admin/messaging/setup', withEntityHeaders({
          headers: { Authorization: `Bearer ${token}` },
        }));
        if (!res.ok) return;
        const data = (await res.json()) as { setup: SetupState };
        if (!cancelled) setSetup(data.setup);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [authUser]);

  if (isUserLoading || entityLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authUser || !ngoId) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Kurulumu açabilmek için bir STK yöneticisi olarak oturum açmalısınız.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <Link href="/ngo-admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Yönetim Paneli
      </Link>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
          <MessagesSquare className="h-6 w-6" style={{ color: '#f34723' }} /> sms ve mail kurulumu
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Toplu sms ve mail gönderimini sağlayıcıyla adım adım kurun, sonra panelleri kullanın.
        </p>
      </div>
      <MessagingSetupWizard
        ngoId={ngoId}
        initialSetup={setup ?? {
          status: 'not_started',
          smsSenderId: null,
          mailFromName: null,
          mailFromEmail: null,
          mailDomain: null,
          docsKvkk: null,
          docsIys: null,
          docsDilekce: null,
        }}
      />
    </div>
  );
}
