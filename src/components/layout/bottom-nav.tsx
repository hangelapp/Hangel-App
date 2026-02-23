
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Calendar, UserCircle, HeartHandshake, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import React, { useState, useEffect } from 'react';
import { useUser } from "@/firebase";

const navItems = [
  { href: "/volunteering", icon: HeartHandshake, label: "nav.volunteering" },
  { href: "/events", icon: Calendar, label: "nav.events" },
  { href: "/market", icon: Store, label: "nav.market" },
  { href: "/timeline", icon: LayoutGrid, label: "nav.timeline" },
  { href: "/profile", icon: UserCircle, label: "nav.profile" },
];

export default function AppBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/70 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2 pb-2 pt-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-1 text-center transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium truncate w-full">
                {isMounted ? t(item.label) : <>&nbsp;</>}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    