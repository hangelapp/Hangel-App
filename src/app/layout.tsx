'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/header';
import AppBottomNav from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/SideNav';
import {
  LayoutGrid,
  HeartHandshake,
  Store,
  DollarSign,
  FileText,
  Award,
  Building,
  Users,
  User,
  Settings,
  Info,
  HelpCircle,
  LogOut,
  Mail,
  Send,
} from 'lucide-react';

const mainMenuItems = [
  { href: '/timeline', label: 'Zaman Tüneli', icon: LayoutGrid },
  { href: '/market', label: 'Market', icon: Store },
  { href: '/volunteering', label: 'Gönüllülük', icon: HeartHandshake },
  { href: '/my-donations', label: 'Bağışlarım', icon: DollarSign },
  { href: '/my-applications', label: 'Başvurularım', icon: FileText },
  { href: '/my-badges', label: 'Rozetlerim', icon: Award },
  { href: '/ngos', label: 'STK\'lar', icon: Building },
  { href: '/admin/clubs', label: 'Öğrenci Kulüpleri', icon: Users },
];

const userMenuItems = [
  { href: '/profile', label: 'Profilim', icon: User },
  { href: '/admin', label: 'Yönetim Paneli', icon: LayoutGrid },
  { href: '/invite', label: 'Arkadaş Davet Et', icon: Send },
];

const secondaryMenuItems = [
  { href: '/settings', label: 'Ayarlar', icon: Settings },
  { href: '/about', label: 'Hakkımızda', icon: Info },
  { href: '/support', label: 'Destek', icon: HelpCircle },
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
            <main className="flex-1 pt-16 pb-20 lg:pb-0">{children}</main>
          </div>
          <AppBottomNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
