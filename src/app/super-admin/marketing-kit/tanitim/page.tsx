'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Globe } from 'lucide-react';
import { MarketingShowcase } from '@/components/marketing/marketing-showcase';

// Super-admin içinde konferans sunum sayfasının (/tanitim) önizlemesi.
// Ziyaretçilerin gördüğü "Herkese açık + Yayında" materyallerin birebir aynısı.
export default function MarketingKitTanitimPreviewPage() {
  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Link href="/super-admin/marketing-kit" className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Tanıtım Araçları
          </Link>
          <h1 className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-2">
            <Globe className="h-7 w-7 text-[#042654]" /> Konferans Sunum Sayfası
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            “Herkese açık” + “Yayında” işaretlediğiniz materyaller — giriş yapmamış ziyaretçilerin de gördüğü
            herkese açık sayfa. Konferanslarda <span className="font-bold">hangel.org/tanitim</span> linkini açın.
          </p>
        </div>
        <Button asChild className="rounded-xl font-bold h-11 px-5 shrink-0">
          <a href="/tanitim" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Canlı sayfayı aç
          </a>
        </Button>
      </div>

      <div className="rounded-2xl border border-[#042654]/20 bg-[#042654]/5 p-4 text-sm font-medium text-[#042654]">
        Bu sayfada görünmeyen bir materyal mi var? Tanıtım Araçları’nda ilgili materyalin hem
        <span className="font-bold"> “Yayında”</span> hem <span className="font-bold">“Herkese açık”</span> anahtarının
        açık olduğundan emin olun.
      </div>

      <MarketingShowcase />
    </div>
  );
}
