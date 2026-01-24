
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from './app-shell';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="" style={{}} suppressHydrationWarning>
      <body className="antialiased">
        <AppShell>
            {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
