'use client';

/**
 * STK admin (veya süper-admin) gate'i — kütüphane gibi STK admin'e özel bölümlerin
 * koşullu render'ında kullanılır. app-shell.tsx'teki isNgoAdmin mantığının
 * standalone karşılığıdır: claim role 'super-admin' veya users/{uid}.role 'ngo-admin'.
 *
 * Kullanım:
 *   const { isNgoAdmin, isLoading } = useIsNgoAdmin();
 *   if (!isNgoAdmin) return null;
 */

import { useEffect, useMemo, useState } from 'react';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

export function useIsNgoAdmin(): { isNgoAdmin: boolean; isLoading: boolean } {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(
    () => (user && db ? doc(db, COLLECTIONS.users, user.uid) : null),
    [db, user],
  );
  const { data: userData, isLoading: userDataLoading } = useDoc<{
    role?: 'super-admin' | 'ngo-admin' | 'user';
    managedNgoId?: string;
  }>(userRef);

  const [claimsRole, setClaimsRole] = useState<string | null>(null);
  const [claimsResolved, setClaimsResolved] = useState(false);

  useEffect(() => {
    if (!user) {
      setClaimsRole(null);
      setClaimsResolved(true);
      return;
    }
    let cancelled = false;
    setClaimsResolved(false);
    user
      .getIdTokenResult()
      .then(res => {
        if (cancelled) return;
        const role = (res.claims as { role?: unknown }).role;
        setClaimsRole(typeof role === 'string' ? role : null);
        setClaimsResolved(true);
      })
      .catch(() => {
        if (!cancelled) {
          setClaimsRole(null);
          setClaimsResolved(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isNgoAdmin = useMemo(() => {
    if (!user) return false;
    if (claimsRole === 'super-admin' || claimsRole === 'ngo-admin') return true;
    if (userData?.role === 'ngo-admin' || userData?.role === 'super-admin') return true;
    if (typeof userData?.managedNgoId === 'string' && userData.managedNgoId.length > 0) return true;
    return false;
  }, [user, claimsRole, userData]);

  const isLoading = isUserLoading || userDataLoading || !claimsResolved;
  return { isNgoAdmin, isLoading };
}
