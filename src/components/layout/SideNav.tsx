'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  Info,
  LayoutGrid,
  Store,
  Building,
  Users,
  Calendar,
  Library,
  DollarSign,
  FileText,
  Award,
  MessageSquare,
  BarChart,
  Send,
  Shield,
  Settings,
  Globe,
  Zap,
  HeartHandshake,
  CircleHelp,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import type { SideNavItem } from '@/lib/types';
import { HangelLogo } from '@/components/icons';

// P2-4: mirrors src/app/app-shell.tsx iconMap. Closed set from the
// group1Items..group4Items nav config in app-shell. If a new nav icon is added
// there, also add it here (and to iconColorMap below if a color is wanted).
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-grid': LayoutGrid,
  store: Store,
  building: Building,
  users: Users,
  calendar: Calendar,
  library: Library,
  'dollar-sign': DollarSign,
  'file-text': FileText,
  award: Award,
  'message-square': MessageSquare,
  'bar-chart': BarChart,
  send: Send,
  shield: Shield,
  settings: Settings,
  info: Info,
  globe: Globe,
  zap: Zap,
  HeartHandshake: HeartHandshake,
  'circle-help': CircleHelp,
  'message-circle': MessageCircle,
  smartphone: Smartphone,
};

const iconColorMap: { [key: string]: string } = {
  store: 'bg-green-500',
  building: 'bg-orange-500',
  users: 'bg-blue-500',
  'dollar-sign': 'bg-green-600',
  'file-text': 'bg-sky-500',
  award: 'bg-amber-500',
  'message-square': 'bg-blue-400',
  'bar-chart': 'bg-indigo-500',
  send: 'bg-cyan-500',
  sparkles: 'bg-purple-500',
  library: 'bg-amber-700',
  'layout-grid': 'bg-slate-500',
  shield: 'bg-red-600',
  settings: 'bg-gray-500',
  info: 'bg-blue-400',
  zap: 'bg-yellow-500',
  'HeartHandshake': 'bg-rose-500',
  'circle-help': 'bg-teal-500',
  'message-circle': 'bg-emerald-500',
  smartphone: 'bg-violet-500',
};

const NavLink = ({ item, isLast }: { item: SideNavItem; isLast: boolean }) => {
    // P2-4: lookup via explicit iconMap; falls back to Info if a new nav icon
    // is added in app-shell without registering it here.
    const Icon = iconMap[item.icon] || Info;
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
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
        </li>
    );
};

interface SideNavProps {
  mainItems: SideNavItem[];
  navItems: SideNavItem[];
  userItems: SideNavItem[];
  secondaryItems: SideNavItem[];
}

export function SideNav({ mainItems, navItems, userItems, secondaryItems }: SideNavProps) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  if (isAuthPage) return null;

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 border-r border-border bg-secondary/50">
      <div className="flex grow flex-col overflow-y-auto px-4 pb-4 pt-8">
        <div className="h-12 mb-8 px-2">
          <Link href="/home">
            <HangelLogo className="text-2xl" href={null} />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col space-y-4">
            <ul className="bg-card rounded-xl border overflow-hidden">
                {mainItems.map((item, i) => <NavLink key={i} item={item} isLast={i === mainItems.length - 1} />)}
            </ul>
            <ul className="bg-card rounded-xl border overflow-hidden">
                {navItems.map((item, i) => <NavLink key={i} item={item} isLast={i === navItems.length - 1} />)}
            </ul>
            <ul className="bg-card rounded-xl border overflow-hidden">
                {userItems.map((item, i) => <NavLink key={i} item={item} isLast={i === userItems.length - 1} />)}
            </ul>
            <div className="mt-auto">
                <ul className="bg-card rounded-xl border overflow-hidden">
                    {secondaryItems.map((item, i) => <NavLink key={i} item={item} isLast={i === secondaryItems.length - 1} />)}
                </ul>
            </div>
        </nav>
      </div>
    </div>
  );
}
