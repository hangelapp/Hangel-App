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
    <html lang="tr" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
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
