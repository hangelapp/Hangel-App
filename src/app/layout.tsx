
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/header';
import AppBottomNav from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem } from '@/lib/types';


const mainMenuItems: SideNavItem[] = [
  { href: '/market', label: 'Markalar', icon: 'store' },
  { href: '/volunteering', label: 'Gönüllülük', icon: 'heart-handshake' },
  { href: '/ngos', label: 'STK\'lar', icon: 'building' },
  { href: '/admin/clubs', label: 'Öğrenci Kulüpleri', icon: 'users' },
  { href: '/my-donations', label: 'Bağışlarım', icon: 'dollar-sign' },
  { href: '/my-applications', label: 'Başvurularım', icon: 'file-text' },
  { href: '/my-badges', label: 'Rozetler', icon: 'award' },
];

const userMenuItems: SideNavItem[] = [
  { href: '/admin', label: 'Yönetim Paneli', icon: 'layout-grid' },
  { href: '/invite', label: 'Arkadaş Davet Et', icon: 'send' },
];

const secondaryMenuItems: SideNavItem[] = [
  { href: '/settings', label: 'Ayarlar', icon: 'settings' },
  { href: '/about', label: 'Hakkımızda', icon: 'info' },
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
            mainItems={mainMenuItems} 
            userItems={userMenuItems}
            secondaryItems={secondaryMenuItems}
          />
          <div className="lg:pl-64 flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 pt-12 pb-12 lg:pb-0">{children}</main>
          </div>
          <AppBottomNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
