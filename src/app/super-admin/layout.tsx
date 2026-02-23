'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full">
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-50 backdrop-blur-xl">
            <Button onClick={() => router.push('/admin')} variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link href="/super-admin" className="flex items-center gap-2 font-semibold">
              <span className="text-xl font-bold text-primary">hangel</span>
              <span className="text-foreground">Admin Paneli</span>
            </Link>
            <div className="w-full flex-1" />
            <Link href="/profile">
              <UserAvatar />
            </Link>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
