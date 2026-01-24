
'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';

export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const isRootNgoAdmin = pathname === '/ngo-admin/dashboard';


  return (
    <div>
        {!isRootNgoAdmin && (
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-4">
                <ArrowLeft className="h-6 w-6" />
            </Button>
        )}
        {children}
    </div>
  );
}
