'use client';

import React from 'react';
import { PublicFooter } from '@/components/layout/public-footer';
import { Presentation as PresentationIcon } from 'lucide-react';
import { MarketingShowcase } from '@/components/marketing/marketing-showcase';

export default function TanitimPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 flex flex-col">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-5">
            <PresentationIcon className="h-3.5 w-3.5" /> hangel Tanıtım
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground">hangel’i Tanıyın</h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            hangel’in kurumsal sunumu ve tanıtım materyalleri. Konferans, etkinlik ve toplantılarınızda
            görüntüleyin veya indirin.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <MarketingShowcase />
      </main>

      <PublicFooter currentPageLabel="hangel Tanıtım" />
    </div>
  );
}
