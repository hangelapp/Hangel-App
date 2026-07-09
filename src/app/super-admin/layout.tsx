
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { AutoBreadcrumb } from '@/components/layout/auto-breadcrumb';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { COLLECTIONS } from '@/firebase/collections';
import { useSuperAdminPermissions, slugFromPath } from '@/hooks/use-super-admin-permissions';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc<User>(userDocRef);

  // Custom claims role — primary signal for super-admin.
  const [claimsRole, setClaimsRole] = useState<string | null>(null);
  useEffect(() => {
    if (!authUser) {
      setClaimsRole(null);
      return;
    }
    let cancelled = false;
    authUser
      .getIdTokenResult()
      .then((res) => {
        if (!cancelled) {
          const role = (res.claims as { role?: unknown }).role;
          setClaimsRole(typeof role === 'string' ? role : null);
        }
      })
      .catch(() => {
        if (!cancelled) setClaimsRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  // P0-4b: claim-only super-admin gate (userData.role fallback removed —
  // claims set + rules deployed 2026-05-18). Tokens auto-refresh hourly.
  const isSuperAdmin = useMemo(() => {
    if (!authUser) return false;
    return claimsRole === 'super-admin';
  }, [authUser, claimsRole]);

  // Granular yetki — kısıtlı super-admin yalnızca izinli sayfaları görür/açar.
  const { slugAllowed, loading: permsLoading } = useSuperAdminPermissions();
  const pageAllowed = slugAllowed(slugFromPath(pathname));

  // While we still don't know who the user is, keep waiting (no admin shell flash).
  const isAuthResolving = isUserLoading || (!!authUser && isUserDocLoading && !userData);

  useEffect(() => {
    if (isAuthResolving) return;

    if (!authUser) {
      const redirectUrl = `/login/selection?action=login&redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
      return;
    }

    if (!isSuperAdmin) {
      router.replace('/market');
      return;
    }

    // Granular yetki: kısıtlı super-admin izinsiz bir alt sayfaya doğrudan
    // gitmeye çalışırsa panel ana sayfasına geri al.
    if (!permsLoading && !pageAllowed) {
      router.replace('/super-admin');
    }
  }, [isAuthResolving, authUser, isSuperAdmin, permsLoading, pageAllowed, pathname, router]);

  const handleBackClick = () => {
    if (pathname === '/super-admin') {
      router.push('/market');
    } else {
      router.push('/super-admin');
    }
  };

  if (isAuthResolving || !authUser || !isSuperAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Yükleniyor" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="flex flex-col">
        <header className="flex min-h-14 items-center gap-4 border-b bg-background/95 px-4 lg:min-h-[60px] lg:px-6 sticky top-0 z-50 backdrop-blur-xl pt-[var(--sat)]">
            <Button onClick={handleBackClick} variant="ghost" size="icon" className="h-9 w-9" aria-label="Geri">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link href="/super-admin" className="flex items-center gap-2 font-semibold">
              <HangelLogo className="text-xl" />
              <span className="text-foreground">Admin Paneli</span>
            </Link>
            <div className="w-full flex-1" />
            <Link href="/profile">
              <UserAvatar />
            </Link>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/30">
          <AutoBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
