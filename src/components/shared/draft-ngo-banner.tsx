'use client';

/**
 * DraftNgoBanner — "taslak" (ön kayıt) STK'sı olan yöneticiye her oturumda çıkan ikaz.
 *
 * Kullanıcının managedNgoId'si bir `status: 'taslak'` STK'ya işaret ediyorsa,
 * "evraklarını tamamla → herkese görünür ol" uyarısı gösterilir. Evrak tamamlanıp
 * statü değişince kendiliğinden kaybolur. (Kapatma yok — amaç sürekli hatırlatma.)
 */

import React from 'react';
import Link from 'next/link';
import { FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export function DraftNgoBanner() {
  const { user } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => (db && user ? doc(db, COLLECTIONS.users, user.uid) : null), [db, user]);
  const { data: userData } = useDoc<{ managedNgoId?: string }>(userRef);
  const managedNgoId = userData?.managedNgoId;

  const ngoRef = useMemoFirebase(() => (db && managedNgoId ? doc(db, COLLECTIONS.ngos, managedNgoId) : null), [db, managedNgoId]);
  const { data: ngo } = useDoc<{ status?: string; name?: string }>(ngoRef);

  if (!ngo || ngo.status !== 'taslak') return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 sm:left-auto sm:right-4 sm:max-w-md"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-2xl backdrop-blur-xl dark:border-amber-800 dark:bg-amber-950/60">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-amber-200/70 p-2 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <FileWarning className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-amber-900 dark:text-amber-200">
              {ngo.name || 'STK’nız'} henüz herkese görünmüyor
            </p>
            <p className="mt-1 text-[12px] leading-snug text-amber-800 dark:text-amber-300/90">
              Kullanıcılarımız STK’nızı, gönüllüleriniz ilanlarınızı göremiyor. <strong>Evraklarınızı tamamlayın</strong> → herkese açılsın.
            </p>
            <Button asChild size="sm" className="mt-3 h-8 rounded-xl bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/ngo-admin/transparency">Evrakları Tamamla</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
