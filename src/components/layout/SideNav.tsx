
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { HangelLogo } from '../icons';
import { UserAvatar } from '../shared/user-avatar';
import { user } from '@/lib/data';
import { Separator } from '../ui/separator';
import type { SideNavItem } from '@/lib/types';

const NavLink = ({ item, pathname }: { item: SideNavItem; pathname: string }) => {
    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/timeline' && item.href !== '/');
    
    // @ts-ignore
    const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;

    return (
        <li>
            <Link
                href={item.href}
                className={cn(
                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                )}
            >
                <Icon
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
}

export function SideNav({ mainItems, navItems, userItems, secondaryItems }: { mainItems: SideNavItem[], navItems: SideNavItem[], userItems: SideNavItem[], secondaryItems: SideNavItem[] }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/onboarding' || pathname === '/';

  if (isAuthPage) {
    return null;
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
      <div className="flex grow flex-col overflow-y-auto bg-card border-r px-4 pb-4">
        <div className="flex h-12 shrink-0 items-center gap-2 px-2">
            <HangelLogo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">hangel</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
                <ul role="list" className="-mx-2 space-y-1">
                    {mainItems.map((item) => (
                       <NavLink key={item.label} item={item} pathname={pathname} />
                    ))}
                </ul>
            </li>
            {navItems && navItems.length > 0 && (
                <li>
                    <ul role="list" className="-mx-2 space-y-1">
                        {navItems.map((item) => (
                        <NavLink key={item.label} item={item} pathname={pathname} />
                        ))}
                    </ul>
                </li>
            )}
            {userItems && userItems.length > 0 && (
                <li>
                    <ul role="list" className="-mx-2 space-y-1">
                        {userItems.map((item) => (
                        <NavLink key={item.label} item={item} pathname={pathname} />
                        ))}
                    </ul>
                </li>
            )}
             <li className="mt-auto">
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {secondaryItems.map((item) => (
                        <NavLink key={item.label} item={item} pathname={pathname} />
                    ))}
                     <li>
                        <Link
                            href="/login"
                            className='group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-destructive hover:bg-destructive/10'
                        >
                            <Icons.LogOut className='h-6 w-6 shrink-0' aria-hidden="true" />
                            Çıkış Yap
                        </Link>
                    </li>
                </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
