"use client";

import { usePathname } from 'next/navigation';
import { Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noLayoutRoutes = ['/login', '/onboarding'];

  if (noLayoutRoutes.includes(pathname)) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-full flex-col bg-background">
      <Sidebar side="left" collapsible="icon">
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="md:pl-12">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </SidebarInset>
    </div>
  );
}
