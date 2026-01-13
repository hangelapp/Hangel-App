import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/header';
import AppBottomNav from '@/components/layout/bottom-nav';

export const metadata: Metadata = {
  title: 'hangel',
  description: 'Bağış ve gönüllülük odaklı Sosyal Etki Platformu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="" style={{}} suppressHydrationWarning>
      <body className="antialiased">
        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-2xl">
          <AppHeader />
          <main className="flex-1 pt-16 pb-20">{children}</main>
          <AppBottomNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
