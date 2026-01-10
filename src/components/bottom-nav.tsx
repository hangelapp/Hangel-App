'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, QrCode, HeartHandshake, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/timeline', icon: Home, label: 'Timeline' },
  { href: '/market', icon: Store, label: 'Market' },
  { href: '/qr-payment', icon: QrCode, label: 'QR Ödeme' },
  { href: '/volunteering', icon: HeartHandshake, label: 'Gönüllülük' },
  { href: '/events', icon: Calendar, label: 'Etkinlikler' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t bg-card/95 backdrop-blur-sm">
      <div className="flex h-20 justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/timeline' && pathname.startsWith(item.href));
          return (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 w-1/5 text-center text-muted-foreground hover:text-primary transition-colors',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
