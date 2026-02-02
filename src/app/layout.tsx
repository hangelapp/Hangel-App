import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from './app-shell';
import { LanguageProvider } from '@/components/providers/language-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="" suppressHydrationWarning>
      <body className="antialiased">
        <LanguageProvider>
          <AppShell>
              {children}
          </AppShell>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
