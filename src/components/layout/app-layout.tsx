"use client";

import AppHeader from "./header";
import AppBottomNav from "./bottom-nav";
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noLayoutRoutes = ['/login', '/onboarding'];

  if (noLayoutRoutes.includes(pathname)) {
    return <>{children}</>;
  }
  
  return (
    <>
      <AppHeader />
      <main className="flex-1 pt-16 pb-20">{children}</main>
      <AppBottomNav />
    </>
  );
}

    