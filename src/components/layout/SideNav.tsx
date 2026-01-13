'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { HangelLogo } from '../icons';

interface SideNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SideNavProps {
  items: SideNavItem[];
}

export function SideNav({ items }: SideNavProps) {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center gap-2">
            <HangelLogo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">hangel</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {items.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                    return (
                        <li key={item.label}>
                            <Link
                            href={item.href}
                            className={cn(
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                            )}
                            >
                            <item.icon
                                className={cn(
                                'h-6 w-6 shrink-0',
                                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                                )}
                                aria-hidden="true"
                            />
                            {item.label}
                            </Link>
                        </li>
                    )
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
