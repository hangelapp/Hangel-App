import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/app-layout';

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
      <head />
      <body className="font-body antialiased">
        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-2xl">
          <AppLayout>{children}</AppLayout>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
