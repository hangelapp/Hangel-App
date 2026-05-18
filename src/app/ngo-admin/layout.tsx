'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Show back button on all ngo admin pages, including the dashboard
  const showBackButton = true;

  return (
    <div className="min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
            {showBackButton && (
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-4 -ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            )}
            {children}
        </div>
    </div>
  );
}
