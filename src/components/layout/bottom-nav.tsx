"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, HeartHandshake, QrCode, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/market", icon: Store, label: "Market" },
  { href: "/volunteering", icon: HeartHandshake, label: "Gönüllülük" },
  { href: "/qr-payment", icon: QrCode, label: "QR Ödeme" },
  { href: "/timeline", icon: LayoutDashboard, label: "Zaman Tüneli" },
];

export default function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid h-20 max-w-md grid-cols-4 border-t bg-card/80 backdrop-blur-sm">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/timeline' && pathname.startsWith(item.href));
        return (
          <Link
            href={item.href}
            key={item.label}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 text-center text-muted-foreground transition-colors hover:text-primary",
              isActive && "text-primary"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
