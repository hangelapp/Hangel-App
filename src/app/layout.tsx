
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/header';
import AppBottomNav from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem } from '@/lib/types';


const group1Items: SideNavItem[] = [
  { href: '/market', label: 'Markalar', icon: 'store' },
  { href: '/ngos', label: 'STK\'lar', icon: 'building' },
  { href: '/admin/clubs', label: 'Öğrenci Kulüpleri', icon: 'users' },
];

const group2Items: SideNavItem[] = [
    { href: '/my-donations', label: 'Bağışlarım', icon: 'dollar-sign' },
    { href: '/my-applications', label: 'Başvurularım', icon: 'file-text' },
    { href: '/my-badges', label: 'Rozetler ve Sertifikalar', icon: 'award' },
];

const group3Items: SideNavItem[] = [
    { href: '/leaderboard', label: 'Liderlik Tablosu', icon: 'bar-chart-3' },
    { href: '/invite', label: 'Arkadaş Davet Et', icon: 'send' },
    { href: '/impact-story', label: 'Etki Hikayem', icon: 'sparkles' },
    { href: '/library', label: 'Kütüphane', icon: 'library' },
];

const group4Items: SideNavItem[] = [
  { href: '/admin', label: 'Yönetim Paneli', icon: 'layout-grid' },
  { href: '/settings', label: 'Ayarlar', icon: 'settings' },
  { href: '/about', label: 'Hakkımızda', icon: 'info' },
  { href: '/merchant', label: 'Üye İşyeri', icon: 'zap' },
  { href: '/support', label: 'Destek', icon: 'help-circle' },
];


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="" style={{}} suppressHydrationWarning>
      <body className="antialiased">
        <div className="relative mx-auto flex min-h-screen w-full flex-col bg-background">
          <SideNav 
            mainItems={group1Items} 
            navItems={group2Items}
            userItems={group3Items}
            secondaryItems={group4Items}
          />
          <div className="lg:pl-64 flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 pt-12 pb-24 lg:pb-8">{children}</main>
          </div>
          <AppBottomNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
