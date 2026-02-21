import './globals.css';
import { Poppins } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from './app-shell';
import { LanguageProvider } from '@/components/providers/language-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import AppBottomNav from '@/components/layout/bottom-nav';

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
      <body className="font-sans antialiased pb-24 lg:pb-0">
        <FirebaseClientProvider>
          <LanguageProvider>
            <AppShell>
                {children}
            </AppShell>
            <AppBottomNav />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
