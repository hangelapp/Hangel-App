import './globals.css';
import { Poppins } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from './app-shell';
import { LanguageProvider } from '@/components/providers/language-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import AppBottomNav from '@/components/layout/bottom-nav';
import { RatingPopup } from '@/components/shared/rating-popup';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { AccessibilityApplier } from '@/components/shared/accessibility-applier';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${poppins.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <LanguageProvider>
            <OfflineBanner />
            <AppShell>
                {children}
            </AppShell>
            <AppBottomNav />
            <RatingPopup />
            <AccessibilityApplier />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
