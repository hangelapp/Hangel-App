'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Show back button only on sub-pages
  const showBackButton = pathname !== '/admin';

  return (
    <div className="min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
            {showBackButton && (
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-4 -ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            )}
            {children}
        </div>
    </div>
  );
}
