import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from './app-shell';
import { LanguageProvider } from '@/components/providers/language-provider';
import AutoTranslate from '@/components/providers/auto-translate';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PushNotificationsProvider } from '@/components/providers/push-notifications-provider';
import { SessionTrackerProvider } from '@/components/providers/session-tracker-provider';
import { HangelOrgSchema } from '@/components/seo/json-ld';
import { OpenInAppBanner } from '@/components/shared/open-in-app-banner';
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
  // Apple Smart App Banner — Safari iOS'ta üstte "Open in App" bandı gösterir.
  // App ID: 6664058822 (https://apps.apple.com/in/app/hangel-app/id6664058822)
  appleWebApp: {
    title: 'hangel',
    capable: true,
    statusBarStyle: 'default',
  },
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
    // Apple Smart App Banner — Safari iOS'ta üstte "Open in App" bandı.
    'apple-itunes-app': 'app-id=6664058822',
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
        <HangelOrgSchema />
        <OpenInAppBanner />
        <FirebaseClientProvider>
          <LanguageProvider>
            <AutoTranslate />
            <ThemeApplier />
            <OfflineBanner />
            <PushNotificationsProvider />
            <SessionTrackerProvider />
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
