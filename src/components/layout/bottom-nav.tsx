"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Calendar, UserCircle, HeartHandshake, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from 'react';
import { useUser } from "@/firebase";

// Why: kısa label'lar (truncate'i önlemek için max 7 char). Translation key'leri
// karşılığı yoktu, key string'i ham görünüyordu.
const navItems = [
  { href: "/volunteering", icon: HeartHandshake, label: "İmece" },
  { href: "/events", icon: Calendar, label: "Etkinlik" },
  { href: "/market", icon: Store, label: "Market" },
  { href: "/timeline", icon: LayoutGrid, label: "Akış" },
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

  // Etkinlik detay sayfasının kendi alt aksiyon barı (Katıl / Yaka Kartı) var;
  // bottom-nav (z-40) onu örtmesin diye detay sayfasında gizlenir.
  const isEventDetail = /^\/events\/[^/]+/.test(pathname);
  if (isEventDetail) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-prominent border-t border-glass-black-8 dark:border-glass-white-8 pb-[env(safe-area-inset-bottom)]">
      {/* Why: h-16 (64px) - pt-1 (4px) - pb-2 (8px) = 52px content area > 44px Apple touch target.
          Her Link tap area en az 44x44 — accessibility-friendly.
          Glass: iOS 26 dock pattern'i — alttaki sayfa içeriği refractive sızar. */}
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1 pb-2 pt-1 lg:max-w-2xl">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                // min-h-[48px] = Apple touch target — small icon ile birlikte
                "flex flex-col items-center justify-center gap-0.5 min-h-[48px] py-1.5 px-0.5 text-center transition-all duration-200 ease-spring active:scale-[0.96] active:bg-glass-black-5 dark:active:bg-glass-white-8 rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}