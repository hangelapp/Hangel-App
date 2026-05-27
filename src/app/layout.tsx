import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from './app-shell';
import { LanguageProvider } from '@/components/providers/language-provider';
import AutoTranslate from '@/components/providers/auto-translate';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PushNotificationsProvider } from '@/components/providers/push-notifications-provider';
import AppBottomNav from '@/components/layout/bottom-nav';
import { RatingPopup } from '@/components/shared/rating-popup';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { AccessibilityApplier } from '@/components/shared/accessibility-applier';
import { ThemeApplier } from '@/components/shared/theme-applier';
import { LocationPermissionPrompt } from '@/components/shared/location-permission-prompt';
import { CookieBanner } from '@/components/shared/cookie-banner';
import { WebVitalsTracker } from '@/components/shared/web-vitals-tracker';

const poppins = Poppins({
  subsets: ['latin'],
  // P3-2: dropped 800 (extrabold) — 0 usages in src. Kept 900 (black) — 371 usages.
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-poppins',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'hangel — Toplumsal Etki Platformu',
    template: '%s · hangel',
  },
  description:
    'STK\'lar, gönüllüler, öğrenci kulüpleri ve markalar için tek platform. Bağış, gönüllülük, sosyal etki.',
  applicationName: 'hangel',
  authors: [{ name: 'hangel' }],
  keywords: ['STK', 'gönüllülük', 'bağış', 'sosyal etki', 'öğrenci kulüpleri', 'hangel'],
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: APP_URL,
    siteName: 'hangel',
    title: 'hangel — Toplumsal Etki Platformu',
    description:
      'STK\'lar, gönüllüler, öğrenci kulüpleri ve markalar için tek platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'hangel — Toplumsal Etki Platformu',
    description: 'STK, gönüllülük ve sosyal etki için tek platform.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'facebook-domain-verification': '0kyl1g9when1n8e7ua1stqwe1n2hyg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d12' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <LanguageProvider>
            <AutoTranslate />
            <ThemeApplier />
            <OfflineBanner />
            <PushNotificationsProvider />
            <AppShell>
                {children}
            </AppShell>
            <AppBottomNav />
            <RatingPopup />
            <AccessibilityApplier />
            <LocationPermissionPrompt />
            <CookieBanner />
            <WebVitalsTracker />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
