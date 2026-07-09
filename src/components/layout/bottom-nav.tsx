"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Calendar, UserCircle, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from 'react';
import { useUser } from "@/firebase";

// Why: kısa label'lar (truncate'i önlemek için max 7 char). Translation key'leri
// karşılığı yoktu, key string'i ham görünüyordu.
// Akış sekmesi kaldırıldı; Etkinlik TÜM kullanıcılarda görünür (eski kulüp
// üyeliği koşulu ve ona bağlı Firestore user-doc sorgusu da kaldırıldı).
const navItems = [
  { href: "/volunteering", icon: HeartHandshake, label: "İmece" },
  { href: "/events", icon: Calendar, label: "Etkinlik" },
  { href: "/market", icon: Store, label: "Market" },
  { href: "/profile", icon: UserCircle, label: "Profil" },
];

export default function AppBottomNav() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Bottom Nav Visibility Rules
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';
  if (isAuthPage || !user) {
    return null;
  }

  // Only show on APP category routes
  const appPaths = [
    '/timeline', '/market', '/volunteering', '/clubs', '/events',
    '/qr-payment', '/emergency', '/leaderboard', '/stories',
    '/invite', '/library', '/profile', '/settings', '/messages'
  ];

  const isAppPath = appPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
  if (!isAppPath) return null;

  // Etkinlik VE gönüllülük detay sayfalarının kendi alt aksiyon barı
  // (Katıl / Hemen Başvur / Yaka Kartı) var; bottom-nav (z-40) onu örtüp
  // butonu tıklanamaz yapmasın diye bu detay sayfalarında gizlenir.
  const isOwnBottomBarDetail = /^\/(events|volunteering)\/[^/]+/.test(pathname);
  if (isOwnBottomBarDetail) return null;

  return (
    // iOS 26 tab-bar: translucent blur material (glass-prominent) + üst hairline.
    // safe-area-inset-bottom nav'ın KENDİSİNE padding olarak verilir → içerik
    // home-indicator'a girmez, dokunma alanı home-indicator üstünde kalır.
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-prominent border-t border-glass-black-8 dark:border-glass-white-8 pb-[var(--sab)]">
      {/* h-16 (64px) content; her sekme min 44x44 Apple dokunma hedefi. */}
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center px-1 pt-1 pb-1 lg:max-w-2xl">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // ≥44x44 Apple dokunma hedefi (min-w + min-h).
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] py-1.5 px-0.5 text-center transition-all duration-200 ease-spring active:scale-[0.96] active:bg-glass-black-5 dark:active:bg-glass-white-8 rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-semibold leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
