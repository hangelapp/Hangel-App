import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// STK'nın yayınlanmış sitesi (`{slug}.hangel.org`) tamamen standalone render
// edilir: global app shell, SideNav, header, bottom-nav YOK. app-shell.tsx
// `/ngo-sites` prefix'ini chrome'suz geçer; bu minimal layout sadece bölümü
// işaretler ve robots'u açık tutar (STK siteleri indekslenebilir).
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function NgoSitesLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
