'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
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
  Bell,
  Globe,
  Building2,
  GraduationCap,
  LifeBuoy,
  Leaf,
  MessageSquare,
  Mail,
  Megaphone,
  Presentation,
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
  Wallet,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, Timestamp, type Query, type DocumentData } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { roleTitleHasScope, type NgoScope } from '@/lib/ngo-admin/role-scopes';
import { useMenuBadge, type BadgeConfig } from '@/components/shared/use-menu-badge';
import { useToast } from '@/hooks/use-toast';
import {
  ActiveEntityProvider,
  useActiveEntity,
  entityTypeLabel,
  type EntityKind,
  type ManagedOrg,
} from './active-entity-context';
import { EntityRouteGuard } from './_components/entity-route-guard';

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  /** "beta" rozeti — aktif/tıklanabilir ama erken erişim olarak işaretli. */
  beta?: boolean;
  /** Rol-bazlı kısıtlama: tanımlıysa yalnız bu kapsama yetkili roller görür
   *  (Genel Yönetici / sahip / süper-admin her zaman görür). Tanımsız = herkese açık. */
  scope?: NgoScope;
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
      { href: '/ngo-admin/community-invite', label: 'Topluluğunu Davet Et', icon: Users },
      { href: '/ngo-admin/marketing-kit', label: 'Tanıtım Araçları', icon: Presentation },
    ],
  },
  {
    title: 'İletişim & Topluluk',
    items: [
      { href: '/ngo-admin/inbox', label: 'Gelen Kutusu', icon: Inbox },
      { href: '/ngo-admin/notifications', label: 'Bildirim Merkezi', icon: Bell },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper, scope: 'posts' },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayemiz', icon: Sparkles },
      { href: '/ngo-admin/certificates', label: 'Sertifikalarımız', icon: Award },
      { href: '/ngo-admin/transparency', label: 'Şeffaflık Endeksi', icon: ShieldCheck },
    ],
  },
  {
    title: 'Finans & Sosyal Etki',
    items: [
      { href: '/ngo-admin/donations', label: 'Bağış Takibi', icon: HandCoins, scope: 'finance' },
      { href: '/ngo-admin/funds', label: 'Hibeler ve Fonlar', icon: Banknote, scope: 'finance' },
    ],
  },
  {
    title: 'Gönüllü ve Gönüllülük Yönetimi',
    items: [
      { href: '/ngo-admin/website', label: 'Web Sitesi Yönetimi', icon: Globe },
      { href: '/ngo-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: HeartHandshake, scope: 'volunteer' },
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
    title: 'Pazarlama & İletişim',
    // Ana iletişim başlıkları önce: Reklam, Çağrı Merkezi, SMS, Mail, Toplu Mesaj,
    // WhatsApp. Çağrı Merkezi'nin ALT özellikleri (Kişi Rehberi, Arama Sırası)
    // menüden çıkarıldı — Çağrı Merkezi sayfası içindeki sekmelerden erişilir.
    items: [
      { href: '/ngo-admin/ads', label: 'Reklam Yönetimi', icon: Megaphone, scope: 'ads', beta: true },
      { href: '/ngo-admin/call-center', label: 'Çağrı Merkezi (Sanal Santral)', icon: PhoneCall, beta: true },
      { href: '/ngo-admin/sms', label: 'SMS Gönderimi', icon: MessageSquare, beta: true },
      { href: '/ngo-admin/mail', label: 'Mail Gönderimi', icon: Mail, beta: true },
      { href: '/ngo-admin/messaging', label: 'Toplu Mesaj & Kampanyalar', icon: Send, beta: true },
      { href: '/ngo-admin/whatsapp-business', label: 'WhatsApp İş', icon: MessageCircle, beta: true },
      { href: '/ngo-admin/messaging-packages', label: 'Kontör Paketleri', icon: Wallet, beta: true },
      { href: '/ngo-admin/dm', label: 'DM Mesajlaşma Yönetimi', icon: MessageCircle, comingSoon: true },
      { href: '/ngo-admin/marketing', label: 'Pazarlama İletişimi', icon: Megaphone, comingSoon: true },
    ],
  },
  {
    title: 'Operasyon, Finans & Araçlar',
    items: [
      // Etkinlik Yönetimi STK'lara açıldı (2026-06-18) — kulüplerle aynı akış.
      { href: '/ngo-admin/events', label: 'Etkinlik Yönetimi', icon: Calendar },
      { href: '/ngo-admin/online-meeting', label: 'Online Eğitim/Toplantı Araçları', icon: Video, comingSoon: true },
      { href: '/ngo-admin/design-tools', label: 'Tasarım Programları', icon: Palette, comingSoon: true },
      { href: '/ngo-admin/accounting', label: 'Ön Muhasebe Yönetimi', icon: Calculator, comingSoon: true },
      { href: '/ngo-admin/payment-systems', label: 'Pos & Ödeme Sistemleri', icon: CreditCard, comingSoon: true },
      { href: '/ngo-admin/ecommerce', label: 'İktisadi İşletme Yönetimi', icon: Store, comingSoon: true },
      { href: '/ngo-admin/crm', label: 'CRM Yönetimi', icon: Contact, comingSoon: true },
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
      { href: '/ngo-admin/community-invite', label: 'Topluluğunu Davet Et', icon: Users },
      { href: '/ngo-admin/marketing-kit', label: 'Tanıtım Araçları', icon: Presentation },
    ],
  },
  {
    title: 'İletişim & Topluluk',
    items: [
      { href: '/ngo-admin/inbox', label: 'Gelen Kutusu', icon: Inbox },
      { href: '/ngo-admin/notifications', label: 'Bildirim Merkezi', icon: Bell },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper, scope: 'posts' },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayemiz', icon: Sparkles },
      { href: '/ngo-admin/certificates', label: 'Sertifikalarımız', icon: Award },
      { href: '/ngo-admin/reports', label: 'Sürdürülebilirlik ve KSS Raporları', icon: Leaf },
    ],
  },
  {
    title: 'Finans & Sosyal Etki',
    items: [
      { href: '/ngo-admin/donations', label: 'Yapılan Bağış Takibi', icon: HandCoins },
      { href: '/ngo-admin/brand-earnings', label: 'Bağış Kazançları', icon: Banknote },
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
      { href: '/ngo-admin/community-invite', label: 'Topluluğunu Davet Et', icon: Users },
      { href: '/ngo-admin/marketing-kit', label: 'Tanıtım Araçları', icon: Presentation },
    ],
  },
  {
    title: 'İletişim & Topluluk',
    items: [
      { href: '/ngo-admin/inbox', label: 'Gelen Kutusu', icon: Inbox },
      { href: '/ngo-admin/notifications', label: 'Bildirim Merkezi', icon: Bell },
      { href: '/ngo-admin/posts', label: 'Gönderiler', icon: Newspaper, scope: 'posts' },
      { href: '/ngo-admin/impact-story', label: 'Etki Hikayemiz', icon: Sparkles },
      { href: '/ngo-admin/certificates', label: 'Sertifikalarımız', icon: Award },
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
              <span className="break-words text-sm font-bold">{current?.name ?? 'Varlık Seç'}</span>
              {current && (
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
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
                <span className="break-words text-sm font-bold">{org.name}</span>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
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
  item, entityId, active, baseClasses, content, hrefResolved, onNavigate,
}: {
  item: MenuItem;
  entityId: string | null;
  active: boolean;
  baseClasses: string;
  content: React.ReactNode;
  hrefResolved: string;
  onNavigate?: () => void;
}) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  void active;

  // Gönüllülük rozeti entity-scope'tur: bu STK'nın ilanlarına gelen BEKLEMEDE
  // başvuru sayısını gösterir. Önce bu kurumun ilan id'lerini çek (volunteer
  // page.tsx ile aynı sorgu: ngoId in [activeId, admin uid] — eski uid-yazılmış
  // ilanları da kapsar). Sorgu YALNIZ volunteer item'ı için kurulur; diğer
  // item'larda null döner → gereksiz okuma yok.
  const isVolunteerItem = item.href === '/ngo-admin/volunteer';
  const oppsQuery = useMemoFirebase(() => {
    if (!db || !entityId || !isVolunteerItem) return null;
    const ids = Array.from(new Set([entityId, user?.uid].filter(Boolean))) as string[];
    return query(collection(db, COLLECTIONS.volunteering), where('ngoId', 'in', ids));
  }, [db, entityId, isVolunteerItem, user?.uid]);
  const { data: opportunities } = useCollection<{ id: string }>(oppsQuery);
  // Firestore 'in' en fazla 30 değer alır; volunteer page ile aynı sınır.
  const opportunityIds = React.useMemo(
    () => (opportunities ?? []).map((o) => o.id).slice(0, 30),
    [opportunities],
  );

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
        build: () => {
          if (!db || opportunityIds.length === 0) return null;
          // Entity-scope: SADECE bu STK'nın ilanlarına (entityId = ilan id)
          // gelen BEKLEMEDE başvuruları say. volunteer/page.tsx ile birebir aynı
          // scope — başka STK'ların başvuruları sızdırılmaz, gereksiz okuma yok.
          // 'in' filtresi + status: composite ihtiyaçsız (eşitlik + eşitlik).
          return query(
            collection(db, COLLECTIONS.applications),
            where('entityId', 'in', opportunityIds),
            where('status', '==', 'Beklemede'),
          ) as Query<DocumentData>;
        },
      };
    }
    if (item.href === '/ngo-admin/notifications') {
      return {
        kind: 'custom',
        build: (lastSeen) => {
          if (!db) return null;
          // Bu kuruma düşen yeni bildirimler (son görülmeden sonra). Girince sıfırlanır.
          const filters = [where('userId', '==', entityId)];
          if (lastSeen) filters.push(where('createdAt', '>', Timestamp.fromDate(lastSeen)));
          return query(collection(db, COLLECTIONS.notifications), ...filters) as Query<DocumentData>;
        },
      };
    }
    return { kind: 'custom', build: () => null };
  }, [db, entityId, item.href, opportunityIds]);
  const badgeKey = `${entityId || 'none'}:${item.href}`;
  const { count, markSeen } = useMenuBadge(db, badgeKey, badgeConfig);
  const showBadge = count > 0;

  if (item.comingSoon) {
    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={() => {
          // Tıklanamaz ama tıklayınca bilgilendir: 2 sn sonra kendiliğinden kapanır.
          const { dismiss } = toast({
            title: 'Çok yakında 🧡',
            description: 'Bu özelliği aktif etmek için çok çalışıyoruz; çok yakında yayına alacağız.',
          });
          setTimeout(() => dismiss(), 2000);
        }}
        className={cn(baseClasses, 'w-full text-left cursor-not-allowed text-muted-foreground hover:bg-transparent')}
      >
        {content}
      </button>
    );
  }
  return (
    <Link href={hrefResolved} onClick={() => { markSeen(); onNavigate?.(); }} className={baseClasses}>
      {content}
      {showBadge && (
        <Badge className="ml-auto bg-red-600 hover:bg-red-600 text-white font-black text-[11px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center rounded-full">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Link>
  );
}

// Nav gövdesi — hem masaüstü kenar çubuğunda hem mobil drawer'da kullanılır.
// onNavigate: mobil drawer'da bir öğeye tıklayınca drawer'ı kapatmak için.
function SideMenuBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { kind: entityKind, subType, withEntityParams, id: entityId } = useActiveEntity();
  // Mevcut kullanıcının rol başlığı (rol-bazlı nav kısıtlaması için).
  const { user } = useUser();
  const db = useFirestore();
  const userRef = useMemoFirebase(() => (user ? doc(db, COLLECTIONS.users, user.uid) : null), [db, user]);
  const { data: userDoc } = useDoc<{ roleTitle?: string | null }>(userRef);
  const roleTitle = userDoc?.roleTitle ?? null;
  // Default to NGO menu while resolving or if undetermined
  const groups = entityKind === 'brand' ? BRAND_MENU : entityKind === 'club' ? CLUB_MENU : NGO_MENU;

  return (
    <nav className="space-y-6">
      <OrgSwitcher />
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-2">
          {group.title && (
            <h3 className="px-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
              {group.title}
            </h3>
          )}
          <ul className="space-y-1">
            {/* Aktif öğeler üstte, 'Yakında' (comingSoon) etiketliler altta.
                Array.sort stabil olduğu için her grupta orijinal sıra korunur,
                yalnız comingSoon'lar sona kayar. */}
            {[...group.items]
              .sort((a, b) => Number(Boolean(a.comingSoon)) - Number(Boolean(b.comingSoon)))
              .map((item) => {
              // Etkinlik Yönetimi: STK (dernek/vakıf/spor kulübü) + öğrenci kulübü açıp yönetir;
              // yalnızca markada gizli (marka etkinlik düzenlemez).
              if (item.href === '/ngo-admin/events' && !item.comingSoon && entityKind === 'brand') {
                return null;
              }
              // Rol-bazlı kısıtlama: dar başlıklı yetkili kapsamı dışındaki modülü görmez.
              if (item.scope && !roleTitleHasScope(roleTitle, item.scope)) {
                return null;
              }
              const Icon = item.icon;
              // QR etiketi tipe göre: "Dernek/Vakıf/Spor Kulübü/Marka/Öğrenci Kulübü Profil QR Kodu".
              const displayLabel = item.href === '/ngo-admin/qr'
                ? `${entityTypeLabel(entityKind, subType)} Profil QR Kodu`
                : item.label;
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              const baseClasses = cn(
                'flex items-center gap-3 rounded-2xl px-3 min-h-[44px] py-2.5 text-sm font-bold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-accent',
                item.comingSoon && !active && 'opacity-70',
              );
              const content = (
                <>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{displayLabel}</span>
                  {item.comingSoon && (
                    <Badge
                      className="ml-auto gap-1 px-1.5 py-0 text-xs font-bold uppercase tracking-widest border-transparent bg-primary/15 text-primary hover:bg-primary/15"
                    >
                      <Clock className="h-2.5 w-2.5" /> Yakında
                    </Badge>
                  )}
                  {item.beta && !item.comingSoon && (
                    <Badge
                      className="ml-auto px-1.5 py-0 text-xs font-bold lowercase tracking-widest border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15"
                    >
                      beta
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
                    onNavigate={onNavigate}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// Masaüstü kalıcı kenar çubuğu (lg ve üstü). Mobilde drawer kullanılır.
function SideMenu() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-6">
        <SideMenuBody />
      </div>
    </aside>
  );
}

// Aktif yönetilen entity'nin kimliği — her alt panelin başında görünür.
function NgoAdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Show back button on all ngo admin pages, including the dashboard
  const showBackButton = true;

  // İkincil sol menü ARTIK HER SAYFADA GİZLİ. Tüm yönetim navigasyonu tek
  // kaynaktan — Dashboard'daki "Yönetim Araçları" kart menüsünden — yürür.
  // Böylece dış global menü + ikincil menü çakışması ("iki menü kafa karıştırıyor")
  // ortadan kalkar; her admin sayfası sade kalır (yalnız içerik + geri butonu).
  const hideSideMenu = true;

  return (
    <div className="min-h-dvh">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-1">
          {showBackButton && (
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="-ml-2"
              aria-label="Geri"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          {/* Mobil menü tetikleyici — masaüstündeki kalıcı kenar çubuğu yerine
              lg altında drawer açar. Menüsü gizli sayfalarda (dashboard/landing)
              gösterilmez; oralarda zaten kart navigasyonu var. */}
          {!hideSideMenu && (
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-2 rounded-xl"
                  aria-label="Menüyü aç"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-xs font-bold">Menü</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto p-4 pt-12">
                <SideMenuBody onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
        </div>
        <div className="flex gap-6">
          {!hideSideMenu && <SideMenu />}
          <main className="flex-1 min-w-0">
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
