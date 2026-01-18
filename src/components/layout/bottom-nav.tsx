"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, HeartHandshake, QrCode, LayoutGrid, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/timeline", icon: LayoutGrid, label: "Akış" },
  { href: "/market", icon: Store, label: "Market" },
  { href: "/qr-payment", icon: QrCode, label: "QR Öde" },
  { href: "/volunteering", icon: HeartHandshake, label: "Gönüllülük" },
  { href: "/profile", icon: UserCircle, label: "Profil" },
];

export default function AppBottomNav() {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  if (isAuthPage) {
    return null;
  }

  // Hide on certain pages to avoid clutter, similar to iOS behavior
  const hiddenOnPages = [
    '/ngo-admin',
    '/admin',
    '/settings',
    '/support',
    '/about',
    '/invite',
    '/my-badges',
    '/my-applications',
    '/my-donations',
  ];

  if (hiddenOnPages.some(p => pathname.startsWith(p))) {
    return null;
  }

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
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
