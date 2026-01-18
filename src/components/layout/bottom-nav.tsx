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
        const isQrButton = item.label === "QR";

        if (isQrButton) {
          return (
            <Link href={item.href} key={item.label} className="relative flex flex-col items-center justify-center text-center">
              <div className={cn(
                "absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-primary shadow-lg transition-transform hover:scale-105",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}>
                <Icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className={cn(
                "absolute bottom-0.5 text-[10px] font-medium",
                 isActive ? 'text-primary' : 'text-muted-foreground'
              )}>{item.label}</span>
            </Link>
          );
        }

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
