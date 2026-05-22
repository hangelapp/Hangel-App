'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Heart,
  ShoppingBag,
  UserCog,
  HeartHandshake,
  HandCoins,
  ShieldCheck,
  Users,
  Sparkles,
  BarChart3,
  Banknote,
  Newspaper,
  Calendar,
  QrCode,
  Clock,
  Settings,
  Inbox,
  Globe,
  Building2,
  GraduationCap,
  LifeBuoy,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ActiveEntityProvider,
  useActiveEntity,
  type EntityKind,
  type ManagedOrg,
} from './active-entity-context';

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

type MenuGroup = {
  title?: string;
  items: MenuItem[];
};

// STK (Dernek / Vakıf / Spor Kulübü / Özel İzinli) menüsü — PDF madde 13.
const NGO_MENU: MenuGroup[] = [
  {
    title: 'Görünürlük & Kurumsal Kimlik',
    items: [
      { href: '/ngo-admin/manage-profile', label: 'Profili Güncelle', icon: UserCog },
      { href: '/ngo-admin/qr', label: 'STK Profil QR Kodu', icon: QrCode },
    ],
  },
  {
    title: 'İletişim & Topluluk',
    items: [
      { href: '/ngo-admin/inbox', label: 'Gelen Kutusu', icon: Inbox },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: Sparkles },
      { href: '/ngo-admin/transparency', label: 'Şeffaflık Endeksi', icon: ShieldCheck },
    ],
  },
  {
    title: 'Finans & Sosyal Etki',
    items: [
      { href: '/ngo-admin/donations', label: 'Bağış Takibi', icon: HandCoins },
      { href: '/ngo-admin/funds', label: 'Hibeler ve Fonlar', icon: Banknote },
    ],
  },
  {
    title: 'Gönüllü ve Gönüllülük Yönetimi',
    items: [
      { href: '/ngo-admin/website', label: 'Web Sitesi Yönetimi', icon: Globe },
      { href: '/ngo-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: HeartHandshake },
      { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: BarChart3 },
    ],
  },
  {
    title: 'Sistem & Destek',
    items: [
      { href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: Users },
      { href: '/ngo-admin/settings', label: 'Panel Ayarları', icon: Settings },
      { href: '/ngo-admin/support', label: 'Destek', icon: LifeBuoy },
    ],
  },
];

// Marka menüsü — PDF madde 13.
const BRAND_MENU: MenuGroup[] = [
  {
    title: 'Görünürlük & Kurumsal Kimlik',
    items: [
      { href: '/ngo-admin/manage-profile', label: 'Profili Güncelle', icon: UserCog },
      { href: '/ngo-admin/qr', label: 'Marka Profil QR Kodu', icon: QrCode },
    ],
  },
  {
    title: 'İletişim & Topluluk',
    items: [
      { href: '/ngo-admin/inbox', label: 'Gelen Kutusu', icon: Inbox },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: Sparkles },
      { href: '/ngo-admin/reports', label: 'Sürdürülebilirlik ve KSS Raporları', icon: Leaf },
    ],
  },
  {
    title: 'Finans & Sosyal Etki',
    items: [
      { href: '/ngo-admin/donations', label: 'Yapılan Bağış Takibi', icon: HandCoins },
      { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: BarChart3 },
    ],
  },
  {
    title: 'Sistem & Destek',
    items: [
      { href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: Users },
      { href: '/ngo-admin/settings', label: 'Panel Ayarları', icon: Settings },
      { href: '/ngo-admin/support', label: 'Destek', icon: LifeBuoy },
    ],
  },
];

// Öğrenci Kulübü menüsü — PDF madde 13.
const CLUB_MENU: MenuGroup[] = [
  {
    title: 'Görünürlük & Kurumsal Kimlik',
    items: [
      { href: '/ngo-admin/manage-profile', label: 'Profili Güncelle', icon: UserCog },
      { href: '/ngo-admin/qr', label: 'Kulüp Profil QR Kodu', icon: QrCode },
    ],
  },
  {
    title: 'İletişim & Topluluk',
    items: [
      { href: '/ngo-admin/inbox', label: 'Gelen Kutusu', icon: Inbox },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: Sparkles },
      { href: '/ngo-admin/events', label: 'Etkinlik Yönetimi', icon: Calendar },
    ],
  },
  {
    title: 'Gönüllü & Analiz',
    items: [
      { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: BarChart3 },
    ],
  },
  {
    title: 'Sistem & Destek',
    items: [
      { href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: Users },
      { href: '/ngo-admin/settings', label: 'Panel Ayarları', icon: Settings },
      { href: '/ngo-admin/support', label: 'Destek', icon: LifeBuoy },
    ],
  },
];

const KIND_ICON: Record<EntityKind, LucideIcon> = {
  ngo: Heart,
  brand: ShoppingBag,
  club: GraduationCap,
};

const KIND_LABEL: Record<EntityKind, string> = {
  ngo: 'STK',
  brand: 'Marka',
  club: 'Kulüp',
};

// Org switcher: only rendered when the user manages 2+ orgs. Selecting an org
// updates the active context (localStorage + state) and navigates to its dashboard.
function OrgSwitcher() {
  const router = useRouter();
  const { id: activeId, kind: activeKind, managedList, setActive } = useActiveEntity();

  if (managedList.length < 2) return null;

  const current: ManagedOrg | undefined =
    managedList.find((o) => o.id === activeId && o.kind === activeKind) || managedList[0];
  const CurrentIcon = current ? KIND_ICON[current.kind] : Building2;

  const handleSelect = (org: ManagedOrg) => {
    setActive({ id: org.id, type: org.type });
    router.push(`/ngo-admin/dashboard?id=${encodeURIComponent(org.id)}&type=${encodeURIComponent(org.type)}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="mb-4 h-auto w-full justify-between gap-2 rounded-2xl px-3 py-2.5 text-left"
          aria-label="Yönetilen varlığı değiştir"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CurrentIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{current?.name ?? 'Varlık Seç'}</span>
              {current && (
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {KIND_LABEL[current.kind]}
                </span>
              )}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Yönetilen Varlıklar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {managedList.map((org) => {
          const Icon = KIND_ICON[org.kind];
          const isActive = current?.id === org.id && current?.kind === org.kind;
          return (
            <DropdownMenuItem
              key={`${org.kind}:${org.id}`}
              onSelect={() => handleSelect(org)}
              className="gap-2"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold">{org.name}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {KIND_LABEL[org.kind]}
                </span>
              </span>
              {isActive && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SideMenu() {
  const pathname = usePathname();
  const { kind: entityKind, withEntityParams } = useActiveEntity();
  // Default to NGO menu while resolving or if undetermined
  const groups = entityKind === 'brand' ? BRAND_MENU : entityKind === 'club' ? CLUB_MENU : NGO_MENU;

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-6 space-y-6">
        <OrgSwitcher />
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-2">
            {group.title && (
              <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                // Restrict the active events link to clubs only (disabled "Yakında" items still render)
                if (item.href === '/ngo-admin/events' && !item.comingSoon && entityKind !== 'club') {
                  return null;
                }
                const Icon = item.icon;
                const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                const baseClasses = cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-accent',
                  item.comingSoon && !active && 'opacity-70',
                );
                const content = (
                  <>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.comingSoon && (
                      <Badge
                        variant="secondary"
                        className="ml-auto gap-1 px-1.5 py-0 text-[9px] font-bold uppercase tracking-widest"
                      >
                        <Clock className="h-2.5 w-2.5" /> Yakında
                      </Badge>
                    )}
                  </>
                );

                if (item.comingSoon) {
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        aria-disabled="true"
                        className={cn(baseClasses, 'w-full text-left cursor-not-allowed')}
                      >
                        {content}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link href={withEntityParams(item.href)} className={baseClasses}>
                      {content}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function NgoAdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Show back button on all ngo admin pages, including the dashboard
  const showBackButton = true;

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        {showBackButton && (
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="mb-4 -ml-2"
            aria-label="Geri"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <div className="flex gap-6">
          <SideMenu />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ActiveEntityProvider>
      <NgoAdminLayoutInner>{children}</NgoAdminLayoutInner>
    </ActiveEntityProvider>
  );
}
