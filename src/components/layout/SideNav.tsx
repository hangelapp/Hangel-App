'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import type { SideNavItem } from '@/lib/types';
import { HangelLogo } from '@/components/icons';

const iconColorMap: { [key: string]: string } = {
  store: 'bg-green-500',
  building: 'bg-orange-500',
  users: 'bg-blue-500',
  'dollar-sign': 'bg-green-600',
  'file-text': 'bg-sky-500',
  award: 'bg-amber-500',
  'message-square': 'bg-blue-400',
  'bar-chart-3': 'bg-indigo-500',
  send: 'bg-cyan-500',
  sparkles: 'bg-purple-500',
  library: 'bg-amber-700',
  'layout-grid': 'bg-slate-500',
  shield: 'bg-red-600',
  settings: 'bg-gray-500',
  info: 'bg-blue-400',
  zap: 'bg-yellow-500',
  'HeartHandshake': 'bg-rose-500',
  'help-circle': 'bg-teal-500',
};

const NavLink = ({ item, isLast }: { item: SideNavItem; isLast: boolean }) => {
    const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') as keyof typeof Icons] || Icons.HelpCircle;
    const color = iconColorMap[item.icon] || 'bg-gray-500';

    return (
        <li className={cn(!isLast && 'border-b')}>
            <Link href={item.href} className='group flex items-center justify-between p-3 hover:bg-accent/50 transition-colors'>
                <div className="flex items-center gap-4">
                    <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', color)}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className='text-sm font-medium text-foreground'>{item.label}</span>
                </div>
                <Icons.ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
        </li>
    );
};

export function SideNav({ mainItems, navItems, userItems, secondaryItems }: any) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  if (isAuthPage) return null;

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 border-r bg-secondary/50">
      <div className="flex grow flex-col overflow-y-auto px-4 pb-4 pt-8">
        <div className="h-12 mb-8 px-2">
          <Link href="/login">
            <HangelLogo className="text-2xl" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col space-y-4">
            <ul className="bg-card rounded-xl border overflow-hidden">
                {mainItems.map((item: any, i: number) => <NavLink key={i} item={item} isLast={i === mainItems.length - 1} />)}
            </ul>
            <ul className="bg-card rounded-xl border overflow-hidden">
                {navItems.map((item: any, i: number) => <NavLink key={i} item={item} isLast={i === navItems.length - 1} />)}
            </ul>
            <ul className="bg-card rounded-xl border overflow-hidden">
                {userItems.map((item: any, i: number) => <NavLink key={i} item={item} isLast={i === userItems.length - 1} />)}
            </ul>
            <div className="mt-auto">
                <ul className="bg-card rounded-xl border overflow-hidden">
                    {secondaryItems.map((item: any, i: number) => <NavLink key={i} item={item} isLast={i === secondaryItems.length - 1} />)}
                </ul>
            </div>
        </nav>
      </div>
    </div>
  );
}
