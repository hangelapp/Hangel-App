"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, HeartHandshake, QrCode, LayoutGrid, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/market", icon: Store, label: "Market" },
  { href: "/timeline", icon: LayoutGrid, label: "Akış" },
  { href: "/qr-payment", icon: QrCode, label: "QR" },
  { href: "/volunteering", icon: HeartHandshake, label: "Gönüllülük" },
  { href: "/profile", icon: UserCircle, label: "Profil" },
];

export default function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid h-12 max-w-md grid-cols-5 border-t bg-background/80 backdrop-blur-xl lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/timeline' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            href={item.href}
            key={item.label}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-1 text-center text-muted-foreground transition-colors hover:text-primary",
              isActive && "text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
