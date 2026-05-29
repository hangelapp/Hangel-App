'use client';

import React, { Suspense } from 'react';
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
  MessageSquare,
  Mail,
  Megaphone,
  Video,
  Palette,
  CreditCard,
  Send,
  Calculator,
  Contact,
  PhoneCall,
  MapPin,
  MessageCircle,
  Store,
  Briefcase,
  Network,
  LineChart,
  Loader2,
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
import { useFirestore } from '@/firebase';
import { collection, query, where, Timestamp, type Query, type DocumentData } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useMenuBadge, type BadgeConfig } from '@/components/shared/use-menu-badge';
import {
  ActiveEntityProvider,
  useActiveEntity,
  type EntityKind,
  type ManagedOrg,
} from './active-entity-context';
import { EntityRouteGuard } from './_components/entity-route-guard';

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
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayemiz', icon: Sparkles },
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
  {
    title: 'Pazarlama & İletişim (Yakında)',
    items: [
      { href: '/ngo-admin/sms', label: 'SMS Gönderimi', icon: MessageSquare, comingSoon: true },
      { href: '/ngo-admin/mail', label: 'Mail Gönderimi', icon: Mail, comingSoon: true },
      { href: '/ngo-admin/dm', label: 'DM Mesajlaşma Yönetimi', icon: MessageCircle, comingSoon: true },
      { href: '/ngo-admin/ads', label: 'Reklam Yönetimi', icon: Megaphone, comingSoon: true },
      { href: '/ngo-admin/marketing', label: 'Pazarlama İletişimi', icon: Send, comingSoon: true },
    ],
  },
  {
    title: 'Operasyon, Finans & Araçlar (Yakında)',
    items: [
      { href: '/ngo-admin/events', label: 'Etkinlik Yönetimi', icon: Calendar, comingSoon: true },
      { href: '/ngo-admin/online-meeting', label: 'Online Eğitim/Toplantı Araçları', icon: Video, comingSoon: true },
      { href: '/ngo-admin/design-tools', label: 'Tasarım Programları', icon: Palette, comingSoon: true },
      { href: '/ngo-admin/accounting', label: 'Ön Muhasebe Yönetimi', icon: Calculator, comingSoon: true },
      { href: '/ngo-admin/payment-systems', label: 'Pos & Ödeme Sistemleri', icon: CreditCard, comingSoon: true },
      { href: '/ngo-admin/ecommerce', label: 'İktisadi İşletme Yönetimi', icon: Store, comingSoon: true },
      { href: '/ngo-admin/crm', label: 'CRM Yönetimi', icon: Contact, comingSoon: true },
      { href: '/ngo-admin/virtual-pbx', label: 'Sanal Santral Yönetimi', icon: PhoneCall, comingSoon: true },
      { href: '/ngo-admin/virtual-office', label: 'Sanal ve Fiziki Ofis', icon: Building2, comingSoon: true },
      { href: '/ngo-admin/field-team', label: 'Saha Ekip Yönetimi', icon: MapPin, comingSoon: true },
      { href: '/ngo-admin/university-volunteering', label: 'Üniversite Gönüllülük Dersi', icon: GraduationCap, comingSoon: true },
      { href: '/ngo-admin/hr-integration', label: 'İK Şirketleri Entegrasyonu', icon: Briefcase, comingSoon: true },
      { href: '/ngo-admin/volunteer-portal', label: 'Gönüllülük Portalı Entegrasyonu', icon: Network, comingSoon: true },
      { href: '/ngo-admin/analytics-tools', label: 'Web Analiz Araçları', icon: LineChart, comingSoon: true },
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
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayemiz', icon: Sparkles },
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
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayemiz', icon: Sparkles },
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

// Entity-scoped menü item — yalnızca bazı href'ler için badge gösterir.
// inbox: bu kuruma yeni gelen mesajlar. donations: bu kuruma yeni bağışlar.
// volunteer: bu kuruma yapılan yeni Beklemede başvurular.
function MenuItemLink({
  item, entityId, active, baseClasses, content, hrefResolved,
}: {
  item: MenuItem;
  entityId: string | null;
  active: boolean;
  baseClasses: string;
  content: React.ReactNode;
  hrefResolved: string;
}) {
  const db = useFirestore();
  void active;
  const badgeConfig = React.useMemo<BadgeConfig>(() => {
    if (!entityId) return { kind: 'custom', build: () => null };
    if (item.href === '/ngo-admin/inbox') {
      return {
        kind: 'custom',
        build: (lastSeen) => {
          if (!db) return null;
          const filters = [where('recipientId', '==', entityId)];
          if (lastSeen) filters.push(where('timestamp', '>', Timestamp.fromDate(lastSeen)));
          return query(collection(db, COLLECTIONS.messages), ...filters) as Query<DocumentData>;
        },
      };
    }
    if (item.href === '/ngo-admin/donations') {
      return {
        kind: 'custom',
        build: (lastSeen) => {
          if (!db) return null;
          const filters = [where('ngoIds', 'array-contains', entityId)];
          if (lastSeen) filters.push(where('createdAt', '>', Timestamp.fromDate(lastSeen)));
          return query(collection(db, COLLECTIONS.donations), ...filters) as Query<DocumentData>;
        },
      };
    }
    if (item.href === '/ngo-admin/volunteer') {
      return {
        kind: 'custom',
        build: (lastSeen) => {
          if (!db) return null;
          // applications.entityId = volunteering opportunity id; ngoId direct
          // değil. Sadeleştirme: applications.org alanı kurum adıyla eşleşir
          // ama ID daha güvenli. Veri ngoId tutmuyorsa 0 döner — kabul edilir.
          const filters = [where('status', '==', 'Beklemede'), where('type', '==', 'Gönüllülük')];
          if (lastSeen) filters.push(where('createdAt', '>', Timestamp.fromDate(lastSeen)));
          // org filter gevşek: tüm Beklemede başvurular sayılır (entity-scope
          // index olmadığı için), gerçek atama sayfada yapılır.
          return query(collection(db, COLLECTIONS.applications), ...filters) as Query<DocumentData>;
        },
      };
    }
    return { kind: 'custom', build: () => null };
  }, [db, entityId, item.href]);
  const badgeKey = `${entityId || 'none'}:${item.href}`;
  const { count, markSeen } = useMenuBadge(db, badgeKey, badgeConfig);
  const showBadge = count > 0;

  if (item.comingSoon) {
    return (
      <button type="button" aria-disabled="true" className={cn(baseClasses, 'w-full text-left cursor-not-allowed')}>
        {content}
      </button>
    );
  }
  return (
    <Link href={hrefResolved} onClick={markSeen} className={baseClasses}>
      {content}
      {showBadge && (
        <Badge className="ml-auto bg-red-600 hover:bg-red-600 text-white font-black text-[9px] px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center rounded-full">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Link>
  );
}

function SideMenu() {
  const pathname = usePathname();
  const { kind: entityKind, withEntityParams, id: entityId } = useActiveEntity();
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

                return (
                  <li key={item.href}>
                    <MenuItemLink
                      item={item}
                      entityId={entityId}
                      active={active}
                      baseClasses={baseClasses}
                      content={content}
                      hrefResolved={withEntityParams(item.href)}
                    />
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

// Aktif yönetilen entity'nin kimliği — her alt panelin başında görünür.
// Avatar + isim + tür rozeti + kamu profili linki. Henüz çözülmediyse
// skeleton placeholder, hiç entity yoksa hiç gösterilmez.
function EntityIdentityBanner() {
  const { id, kind, type, managedList, isLoading } = useActiveEntity();

  if (isLoading) {
    return (
      <div className="mb-6 rounded-2xl border bg-card p-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!id || !kind) return null;

  const current = managedList.find(o => o.id === id && o.kind === kind) || managedList[0];
  if (!current) return null;

  const Icon = KIND_ICON[current.kind];
  const publicHref =
    current.kind === 'ngo' ? `/ngos/profile/${current.id}` :
    current.kind === 'brand' ? `/market/${current.id}` :
    `/clubs/profile/${current.id}`;

  return (
    <div className="mb-6 rounded-2xl border bg-card p-4 flex items-center gap-3 shadow-sm">
      <div className="h-12 w-12 shrink-0 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
        {current.logoUrl ? (
           
          <img src={current.logoUrl} alt={current.name} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-6 w-6 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base sm:text-lg font-black truncate">{current.name}</h2>
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold">
            {type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">Yönetim Paneli</p>
      </div>
      <Button asChild size="sm" variant="ghost" className="shrink-0 text-xs">
        <Link href={publicHref} target="_blank" rel="noopener noreferrer">
          Kamu Profili
        </Link>
      </Button>
    </div>
  );
}

function NgoAdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Show back button on all ngo admin pages, including the dashboard
  const showBackButton = true;

  return (
    <div className="min-h-dvh">
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
          <main className="flex-1 min-w-0">
            <EntityIdentityBanner />
            <EntityRouteGuard>{children}</EntityRouteGuard>
          </main>
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
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <ActiveEntityProvider>
        <NgoAdminLayoutInner>{children}</NgoAdminLayoutInner>
      </ActiveEntityProvider>
    </Suspense>
  );
}
