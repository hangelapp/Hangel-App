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
  Calendar,
  QrCode,
  Clock,
  Settings,
  Database,
  Briefcase,
  Network,
  Inbox,
  Globe,
  MessageSquareText,
  Mail,
  Megaphone,
  Video,
  Palette,
  CreditCard,
  Calculator,
  Phone,
  Building2,
  GraduationCap,
  MapPin,
  LineChart,
  LifeBuoy,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { collection, doc, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

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
    title: 'Görünürlük & Kurumsal Kimlik',
    items: [
      { href: '/ngo-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    title: 'Gönüllü ve Gönüllülük Yönetimi',
    items: [
      { href: '/ngo-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: HeartHandshake },
      { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: BarChart3 },
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
    title: 'Entegrasyon ve Yönetim',
    items: [
      { href: '/ngo-admin/website', label: 'Web Sitesi Yönetimi', icon: Globe },
      { href: '/ngo-admin/sms', label: 'SMS Gönderimi', icon: MessageSquareText, comingSoon: true },
      { href: '/ngo-admin/mail', label: 'Mail Gönderimi', icon: Mail, comingSoon: true },
      { href: '/ngo-admin/ads', label: 'Reklam Yönetimi', icon: Megaphone, comingSoon: true },
      { href: '/ngo-admin/events', label: 'Etkinlik Yönetimi', icon: Calendar, comingSoon: true },
      { href: '/ngo-admin/online-meeting', label: 'Online Eğitim/Toplantı Araçları', icon: Video, comingSoon: true },
      { href: '/ngo-admin/design-tools', label: 'Tasarım Programları', icon: Palette, comingSoon: true },
      { href: '/ngo-admin/payment-systems', label: 'Pos & Ödeme Sistemleri', icon: CreditCard, comingSoon: true },
      { href: '/ngo-admin/marketing', label: 'Pazarlama İletişimi', icon: Megaphone, comingSoon: true },
      { href: '/ngo-admin/accounting', label: 'Ön Muhasebe Yönetimi', icon: Calculator, comingSoon: true },
      { href: '/ngo-admin/crm', label: 'CRM Yönetimi', icon: Database, comingSoon: true },
      { href: '/ngo-admin/virtual-pbx', label: 'Sanal Santral Yönetimi', icon: Phone, comingSoon: true },
      { href: '/ngo-admin/virtual-office', label: 'Sanal ve Fiziki Ofis', icon: Building2, comingSoon: true },
      { href: '/ngo-admin/university-volunteering', label: 'Üniversite Gönüllülük Dersi', icon: GraduationCap, comingSoon: true },
      { href: '/ngo-admin/field-team', label: 'Saha Ekip Yönetimi', icon: MapPin, comingSoon: true },
      { href: '/ngo-admin/dm', label: 'DM Mesajlaşma Yönetimi', icon: MessageSquareText, comingSoon: true },
      { href: '/ngo-admin/ecommerce', label: 'İktisadi İşletme Yönetimi', icon: Briefcase, comingSoon: true },
      { href: '/ngo-admin/hr-integration', label: 'İK Şirketleri Entegrasyonu', icon: Users, comingSoon: true },
      { href: '/ngo-admin/volunteer-portal', label: 'Gönüllülük Portalı Entegrasyonu', icon: Network, comingSoon: true },
      { href: '/ngo-admin/analytics-tools', label: 'Web Analiz Araçları', icon: LineChart, comingSoon: true },
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

const BRAND_MENU: MenuGroup[] = [
  {
    title: 'Görünürlük & Kurumsal Kimlik',
    items: [
      { href: '/ngo-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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

const CLUB_MENU: MenuGroup[] = [
  {
    title: 'Görünürlük & Kurumsal Kimlik',
    items: [
      { href: '/ngo-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    title: 'Entegrasyon ve Yönetim',
    items: [
      { href: '/ngo-admin/website', label: 'Web Sitesi Yönetimi', icon: Globe },
      { href: '/ngo-admin/sms', label: 'SMS Gönderimi', icon: MessageSquareText, comingSoon: true },
      { href: '/ngo-admin/mail', label: 'Mail Gönderimi', icon: Mail, comingSoon: true },
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

function useResolvedEntityKind(): { kind: EntityKind | null; isLoading: boolean } {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // 1) Fast path: users/{uid}.managed*
  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
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
        ? query(collection(firestore, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid, needsFallback],
  );
  const adminBrandsQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid && needsFallback
        ? query(collection(firestore, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid, needsFallback],
  );
  const adminClubsQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid && needsFallback
        ? query(collection(firestore, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid))
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
