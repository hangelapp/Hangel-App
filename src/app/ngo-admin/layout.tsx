'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  LayoutDashboard,
  UserCog,
  HeartHandshake,
  HandCoins,
  ShieldCheck,
  Users,
  Sparkles,
  BarChart3,
  Banknote,
  Newspaper,
  Store,
  School,
  Calendar,
  QrCode,
  Clock,
  Settings,
  Database,
  Briefcase,
  Network,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { collection, doc, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';

type EntityKind = 'ngo' | 'brand' | 'club';

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

interface UserDocData {
  id: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
}

interface EntityRef {
  id: string;
  adminUserId?: string;
}

const NGO_MENU: MenuGroup[] = [
  {
    items: [
      { href: '/ngo-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/ngo-admin/manage-profile', label: 'Profil Yönetimi', icon: UserCog },
      { href: '/ngo-admin/volunteer', label: 'Gönüllülük İlanları', icon: HeartHandshake },
      { href: '/ngo-admin/donations', label: 'Bağış Takibi', icon: HandCoins },
      { href: '/ngo-admin/transparency', label: 'Şeffaflık Endeksi', icon: ShieldCheck },
      { href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: Users },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: Sparkles },
      { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: BarChart3 },
      { href: '/ngo-admin/funds', label: 'Hibeler ve Fonlar', icon: Banknote },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper },
    ],
  },
  {
    title: 'Entegrasyon ve Yönetim',
    items: [
      { href: '/ngo-admin/hr-integration', label: 'İK Şirketleri Entegrasyonu', icon: Briefcase, comingSoon: true },
      { href: '/ngo-admin/volunteer-portal', label: 'Gönüllülük Portalı Entegrasyonu', icon: Network, comingSoon: true },
      { href: '/ngo-admin/crm', label: 'CRM', icon: Database, comingSoon: true },
      { href: '/ngo-admin/settings', label: 'Sistem Ayarları', icon: Settings, comingSoon: true },
    ],
  },
];

const BRAND_MENU: MenuGroup[] = [
  {
    items: [
      { href: '/ngo-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/ngo-admin/manage-profile', label: 'Marka Profili', icon: Store },
      { href: '/ngo-admin/donations', label: 'Bağış Takibi', icon: HandCoins },
      { href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: Users },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: Sparkles },
      { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: BarChart3 },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper },
    ],
  },
];

const CLUB_MENU: MenuGroup[] = [
  {
    items: [
      { href: '/ngo-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/ngo-admin/manage-profile', label: 'Kulüp Profili', icon: School },
      { href: '/ngo-admin/events', label: 'Etkinlikler', icon: Calendar },
      { href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: Users },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: Sparkles },
      { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: BarChart3 },
      { href: '/ngo-admin/qr', label: 'Profil QR Kodu', icon: QrCode },
    ],
  },
];

function useResolvedEntityKind(): { kind: EntityKind | null; isLoading: boolean } {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // 1) Fast path: users/{uid}.managed*
  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData, isLoading: userDocLoading } = useDoc<UserDocData>(userDocRef);

  // Fast-path resolution from users/{uid}.managed*
  const fastPathKind = useMemo<EntityKind | null>(() => {
    if (userData?.managedNgoId) return 'ngo';
    if (userData?.managedBrandId) return 'brand';
    if (userData?.managedClubId) return 'club';
    return null;
  }, [userData?.managedNgoId, userData?.managedBrandId, userData?.managedClubId]);

  // Only run fallback queries when:
  //   - auth + firestore are ready
  //   - the user doc has loaded
  //   - the fast path did NOT resolve a kind
  // This keeps the listener count at 1 (userDoc) for the common case,
  // and only spins up the 3 adminUserId scans for users without a managed* link.
  const needsFallback = !userDocLoading && !fastPathKind && Boolean(authUser?.uid);

  // 2) Fallback: query each collection by adminUserId (gated)
  const adminNgosQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid && needsFallback
        ? query(collection(firestore, 'ngos'), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid, needsFallback],
  );
  const adminBrandsQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid && needsFallback
        ? query(collection(firestore, 'brands'), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid, needsFallback],
  );
  const adminClubsQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid && needsFallback
        ? query(collection(firestore, 'clubs'), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid, needsFallback],
  );

  const { data: adminNgos, isLoading: ngosLoading } = useCollection<EntityRef>(adminNgosQ);
  const { data: adminBrands, isLoading: brandsLoading } = useCollection<EntityRef>(adminBrandsQ);
  const { data: adminClubs, isLoading: clubsLoading } = useCollection<EntityRef>(adminClubsQ);

  const isLoading = isUserLoading || userDocLoading || ngosLoading || brandsLoading || clubsLoading;

  const kind = useMemo<EntityKind | null>(() => {
    if (fastPathKind) return fastPathKind;
    if (adminNgos && adminNgos.length > 0) return 'ngo';
    if (adminBrands && adminBrands.length > 0) return 'brand';
    if (adminClubs && adminClubs.length > 0) return 'club';
    return null;
  }, [fastPathKind, adminNgos, adminBrands, adminClubs]);

  return { kind, isLoading };
}

function SideMenu({ entityKind }: { entityKind: EntityKind | null }) {
  const pathname = usePathname();
  // Default to NGO menu while resolving or if undetermined
  const groups = entityKind === 'brand' ? BRAND_MENU : entityKind === 'club' ? CLUB_MENU : NGO_MENU;

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-6 space-y-6">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-2">
            {group.title && (
              <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                // Restrict events to clubs only
                if (item.href === '/ngo-admin/events' && entityKind !== 'club') {
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
                    <Link href={item.href} className={baseClasses}>
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

export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { kind } = useResolvedEntityKind();

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
          <SideMenu entityKind={kind} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
