'use client';
import React, { Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  Users,
  ChevronRight,
  ShieldAlert,
  Building2,
  Info,
  Loader2,
  Clock,
  // P2-4: explicit named imports for the closed icon set used by NavLink.
  HandCoins,
  BarChart,
  Bell,
  Briefcase,
  Calculator,
  Calendar,
  CreditCard,
  Database,
  Globe,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  LineChart,
  List,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Network,
  Newspaper,
  Palette,
  PhoneCall,
  QrCode,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  UserCog,
  Video,
  Inbox,
  Send,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// P2-4: keys are PascalCase icon names (matches the kebab→PascalCase derivation
// in NavLink). Closed set built from the unique `icon:` fields in navGroups below.
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HandCoins,
  BarChart,
  Bell,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CreditCard,
  Database,
  DollarSign,
  Globe,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  LineChart,
  List,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Network,
  Newspaper,
  Palette,
  PhoneCall,
  QrCode,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  UserCog,
  Users,
  Video,
  Inbox,
  Send,
  Wallet,
  // WhatsApp İş kart ikonu: lucide'da WhatsApp glyph yok, MessageCircle ile alias.
  WhatsappBusiness: MessageCircle,
};
import { useSearchParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

const iconColorMap: { [key: string]: string } = {
  'user-cog': 'bg-gray-500',
  'heart-handshake': 'bg-red-500',
  'dollar-sign': 'bg-green-600',
  'HandCoins': 'bg-emerald-700',
  newspaper: 'bg-orange-500',
  'bar-chart': 'bg-indigo-500',
  'shield-check': 'bg-green-500',
  'qr-code': 'bg-slate-500',
  'globe': 'bg-cyan-500',
  'message-square': 'bg-blue-400',
  users: 'bg-blue-500',
  bell: 'bg-purple-500',
  settings: 'bg-gray-500',
  'help-circle': 'bg-teal-500',
  sparkles: 'bg-purple-500',
  'trending-up': 'bg-pink-500',
  'mail': 'bg-amber-500',
  'megaphone': 'bg-yellow-500',
  'calendar': 'bg-rose-500',
  'calculator': 'bg-emerald-500',
  'message-circle': 'bg-sky-500',
  'whatsapp-business': 'bg-emerald-500',
  'shopping-cart': 'bg-violet-500',
  'video': 'bg-blue-600',
  'palette': 'bg-pink-500',
  'credit-card': 'bg-emerald-600',
  'target': 'bg-red-600',
  'database': 'bg-indigo-600',
  'phone-call': 'bg-orange-600',
  'list': 'bg-orange-500',
  'building-2': 'bg-slate-600',
  'graduation-cap': 'bg-blue-700',
  'map-pin': 'bg-teal-600',
  'inbox': 'bg-indigo-500',
  'send': 'bg-sky-600',
  'wallet': 'bg-amber-600',
  'briefcase': 'bg-blue-600',
  'network': 'bg-rose-500',
  'line-chart': 'bg-amber-600',
};

const NavLink = ({ href, icon, label, comingSoon, beta }: { href: string, icon: string, label: string, comingSoon?: boolean, beta?: boolean }) => {
  // P2-4: normalize kebab → PascalCase, then look up via explicit iconMap.
  const iconName = icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  const Icon = iconMap[iconName] || Info;
  // comingSoon → ikon da grileşir (görsel olarak pasif).
  const color = comingSoon ? 'bg-gray-300' : (iconColorMap[icon] || 'bg-gray-500');
  const { toast } = useToast();

  const body = (
    <>
      <div className={cn('p-1.5 rounded-lg mr-4', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className={cn('flex-1 font-medium', comingSoon && 'text-muted-foreground')}>{label}</span>
      {comingSoon ? (
        // İnce narçiçeği "Yakında" rozeti.
        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary">
          <Clock className="h-3 w-3" /> Yakında
        </span>
      ) : beta ? (
        <span className="flex items-center gap-1.5 text-xs font-bold lowercase tracking-widest text-blue-600 dark:text-blue-400">
          beta <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </span>
      ) : (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
    </>
  );

  if (comingSoon) {
    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={() => {
          // Tıklanamaz ama tıklayınca bilgilendir; 2 sn sonra kendiliğinden kapanır.
          const { dismiss } = toast({
            title: 'Çok yakında 🧡',
            description: 'Bu özelliği aktif etmek için çok çalışıyoruz; çok yakında yayına alacağız.',
          });
          setTimeout(() => dismiss(), 2000);
        }}
        className="flex items-center p-4 transition-colors w-full text-sm sm:text-base border-b last:border-b-0 text-left opacity-70 cursor-not-allowed"
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={href} className="flex items-center p-4 hover:bg-accent transition-colors w-full text-sm sm:text-base border-b last:border-b-0">
      {body}
    </Link>
  );
}

// Entity-aware nav items. `kinds` field belirler hangi tip kuruluşta görünür.
// `labelByKind` per-kind etiket farkı için (örn. "STK Profil QR Kodu" vs "Marka Profil QR Kodu").
type NavItem = {
    id: string;
    href: string;
    label: string;
    icon: string;
    roles: string[];
    kinds: Array<'ngo' | 'brand' | 'club'>;
    labelByKind?: Partial<Record<'ngo' | 'brand' | 'club', string>>;
    comingSoon?: boolean;
    beta?: boolean;
};

const buildNavGroups = (t: (key: string) => string): { title: string; items: NavItem[] }[] => [
    {
        title: t('ngo_admin_dashboard.groupVisibility'),
        items: [
            { id: 'profile', href: '/ngo-admin/manage-profile', label: t('ngo_admin_dashboard.itemProfile'), icon: 'user-cog', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
            { id: 'qr', href: '/ngo-admin/qr', label: t('ngo_admin_dashboard.itemQr'), icon: 'qr-code', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo', 'brand', 'club'], labelByKind: { ngo: t('ngo_admin_dashboard.itemQrNgo'), brand: t('ngo_admin_dashboard.itemQrBrand'), club: t('ngo_admin_dashboard.itemQrClub') } },
            { id: 'community-invite', href: '/ngo-admin/community-invite', label: 'Topluluğunu Davet Et', icon: 'users', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
        ]
    },
    {
        title: t('ngo_admin_dashboard.groupCommunication'),
        items: [
            { id: 'inbox', href: '/ngo-admin/inbox', label: 'Gelen Kutusu', icon: 'inbox', roles: ['Genel Yönetici', 'Finans Yöneticisi', 'Gönüllü Yöneticisi', 'Mini Blog Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
            { id: 'notifications', href: '/ngo-admin/notifications', label: t('ngo_admin_dashboard.itemNotifications'), icon: 'bell', roles: ['Genel Yönetici', 'Finans Yöneticisi', 'Gönüllü Yöneticisi', 'Mini Blog Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
            { id: 'posts', href: '/ngo-admin/posts', label: t('ngo_admin_dashboard.itemPosts'), icon: 'newspaper', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
            { id: 'impact-story', href: '/ngo-admin/impact-story', label: t('ngo_admin_dashboard.itemImpactStory'), icon: 'sparkles', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
            { id: 'transparency', href: '/ngo-admin/transparency', label: t('ngo_admin_dashboard.itemTransparency'), icon: 'shield-check', roles: ['Genel Yönetici', 'Finans Yöneticisi'], kinds: ['ngo'] },
            { id: 'sustainability', href: '/ngo-admin/sustainability', label: t('ngo_admin_dashboard.itemSustainability'), icon: 'leaf', roles: ['Genel Yönetici', 'Finans Yöneticisi'], kinds: ['brand'] },
        ]
    },
    {
        title: t('ngo_admin_dashboard.groupVolunteer'),
        items: [
            { id: 'volunteer', href: '/ngo-admin/volunteer', label: t('ngo_admin_dashboard.itemVolunteer'), icon: 'heart-handshake', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo'] },
            { id: 'demographics', href: '/ngo-admin/demographics', label: t('ngo_admin_dashboard.itemDemographics'), icon: 'bar-chart', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
        ]
    },
    {
        title: t('ngo_admin_dashboard.groupFinance'),
        items: [
            { id: 'donations', href: '/ngo-admin/donations', label: t('ngo_admin_dashboard.itemDonations'), icon: 'dollar-sign', roles: ['Genel Yönetici', 'Finans Yöneticisi'], kinds: ['ngo', 'brand'], labelByKind: { ngo: t('ngo_admin_dashboard.itemDonations'), brand: t('ngo_admin_dashboard.itemDonationsBrand') } },
            { id: 'funds', href: '/ngo-admin/funds', label: t('ngo_admin_dashboard.itemFunds'), icon: 'HandCoins', roles: ['Genel Yönetici', 'Finans Yöneticisi'], kinds: ['ngo'] },
        ]
    },
    {
        title: t('ngo_admin_dashboard.groupIntegration'),
        items: [
            { id: 'website', href: '/ngo-admin/website', label: t('ngo_admin_dashboard.itemWebsite'), icon: 'globe', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo'] },
            { id: 'ads', href: '/ngo-admin/ads', label: t('ngo_admin_dashboard.itemAds'), icon: 'megaphone', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo'], beta: true },
            { id: 'events', href: '/ngo-admin/events', label: t('ngo_admin_dashboard.itemEvents'), icon: 'calendar', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo', 'club'], comingSoon: false },
            { id: 'messaging', href: '/ngo-admin/messaging', label: 'Toplu Mesaj & Kampanyalar', icon: 'send', roles: ['Genel Yönetici'], kinds: ['ngo'], beta: true },
            { id: 'sms', href: '/ngo-admin/sms', label: t('ngo_admin_dashboard.itemSms'), icon: 'message-square', roles: ['Genel Yönetici'], kinds: ['ngo'], beta: true },
            { id: 'mail', href: '/ngo-admin/mail', label: t('ngo_admin_dashboard.itemMail'), icon: 'mail', roles: ['Genel Yönetici'], kinds: ['ngo'], beta: true },
            { id: 'call-center', href: '/ngo-admin/call-center', label: 'Çağrı Merkezi (Sanal Santral)', icon: 'phone-call', roles: ['Genel Yönetici'], kinds: ['ngo'], beta: true },
            { id: 'whatsapp-business', href: '/ngo-admin/whatsapp-business', label: 'WhatsApp İş', icon: 'whatsapp-business', roles: ['Genel Yönetici'], kinds: ['ngo'], beta: true },
            { id: 'messaging-packages', href: '/ngo-admin/messaging-packages', label: 'Kontör Paketleri', icon: 'wallet', roles: ['Genel Yönetici'], kinds: ['ngo'], beta: true },
            { id: 'dm', href: '/ngo-admin/dm', label: t('ngo_admin_dashboard.itemDm'), icon: 'message-circle', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo'], beta: true },
            { id: 'marketing', href: '/ngo-admin/marketing', label: t('ngo_admin_dashboard.itemMarketing'), icon: 'target', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'online-meeting', href: '/ngo-admin/online-meeting', label: t('ngo_admin_dashboard.itemOnlineMeeting'), icon: 'video', roles: ['Genel Yönetici'], kinds: ['ngo'], comingSoon: true },
            { id: 'design-tools', href: '/ngo-admin/design-tools', label: t('ngo_admin_dashboard.itemDesignTools'), icon: 'palette', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'payment-systems', href: '/ngo-admin/payment-systems', label: t('ngo_admin_dashboard.itemPaymentSystems'), icon: 'credit-card', roles: ['Genel Yönetici', 'Finans Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'accounting', href: '/ngo-admin/accounting', label: t('ngo_admin_dashboard.itemAccounting'), icon: 'calculator', roles: ['Genel Yönetici', 'Finans Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'crm', href: '/ngo-admin/crm', label: t('ngo_admin_dashboard.itemCrm'), icon: 'database', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'ecommerce', href: '/ngo-admin/ecommerce', label: t('ngo_admin_dashboard.itemEcommerce'), icon: 'shopping-cart', roles: ['Genel Yönetici', 'Finans Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'virtual-office', href: '/ngo-admin/virtual-office', label: t('ngo_admin_dashboard.itemVirtualOffice'), icon: 'building-2', roles: ['Genel Yönetici'], kinds: ['ngo'], comingSoon: true },
            { id: 'field-team', href: '/ngo-admin/field-team', label: t('ngo_admin_dashboard.itemFieldTeam'), icon: 'map-pin', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'university-volunteering', href: '/ngo-admin/university-volunteering', label: t('ngo_admin_dashboard.itemUniversityVolunteering'), icon: 'graduation-cap', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'hr-integration', href: '/ngo-admin/hr-integration', label: t('ngo_admin_dashboard.itemHrIntegration'), icon: 'briefcase', roles: ['Genel Yönetici'], kinds: ['ngo'], comingSoon: true },
            { id: 'volunteer-portal', href: '/ngo-admin/volunteer-portal', label: t('ngo_admin_dashboard.itemVolunteerPortal'), icon: 'network', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], kinds: ['ngo'], comingSoon: true },
            { id: 'analytics-tools', href: '/ngo-admin/analytics-tools', label: t('ngo_admin_dashboard.itemAnalyticsTools'), icon: 'line-chart', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], kinds: ['ngo'], comingSoon: true },
        ]
    },
    {
        title: t('ngo_admin_dashboard.groupSystem'),
        items: [
            { id: 'users', href: '/ngo-admin/users', label: t('ngo_admin_dashboard.itemUsers'), icon: 'users', roles: ['Genel Yönetici'], kinds: ['ngo', 'brand', 'club'] },
            { id: 'settings', href: '/ngo-admin/settings', label: t('ngo_admin_dashboard.itemSettings'), icon: 'settings', roles: ['Genel Yönetici'], kinds: ['ngo', 'brand', 'club'] },
            { id: 'support', href: '/ngo-admin/support', label: t('ngo_admin_dashboard.itemSupport'), icon: 'help-circle', roles: ['Genel Yönetici', 'Finans Yöneticisi', 'Gönüllü Yöneticisi', 'Mini Blog Yöneticisi'], kinds: ['ngo', 'brand', 'club'] },
        ]
    }
];

function NgoDashboardPageContent() {
    const searchParams = useSearchParams();
    const entityId = searchParams.get('id');
    const entityType = searchParams.get('type');
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const { t } = useTranslation();

    // Active entity kind hesaplama (URL type → 'ngo'/'brand'/'club')
    const activeKind: 'ngo' | 'brand' | 'club' =
        entityType === 'Marka' ? 'brand' :
        entityType === 'Kulüp' || entityType === 'Öğrenci Kulübü' ? 'club' :
        'ngo';

    // Determine the collection to query based on entity type
    const ngoDocRef = useMemoFirebase(() => {
        if (!entityId) return null;
        if (entityType === 'STK') return doc(firestore, COLLECTIONS.ngos, entityId);
        if (entityType === 'Marka') return doc(firestore, COLLECTIONS.brands, entityId);
        // Clubs live in COLLECTIONS.clubs (matches /admin, super-admin, settings).
        if (entityType === 'Kulüp') return doc(firestore, COLLECTIONS.clubs, entityId);
        // Legacy deep links may still pass 'Öğrenci Kulübü' → studentClubs.
        if (entityType === 'Öğrenci Kulübü') return doc(firestore, COLLECTIONS.studentClubs, entityId);
        return null;
    }, [firestore, entityId, entityType]);

    const { data: activeEntity, isLoading } = useDoc(ngoDocRef);

    // Fallback: try to load the user's own NGO profile if no entity specified
    const userNgoDocRef = useMemoFirebase(() => {
        if (entityId || !authUser?.uid) return null;
        return doc(firestore, COLLECTIONS.ngos, authUser.uid);
    }, [firestore, entityId, authUser?.uid]);

    const { data: userNgoEntity, isLoading: isUserNgoLoading } = useDoc(userNgoDocRef);

    const entity = activeEntity || userNgoEntity;
    const loading = isLoading || isUserNgoLoading;

    const userRole: string = 'Genel Yönetici';

    const filteredGroups = useMemo(() => {
        const navGroups = buildNavGroups(t);
        return navGroups.map(group => ({
            ...group,
            items: group.items
                .filter(item => item.roles.includes(userRole))
                .filter(item => item.kinds.includes(activeKind))
                .map(item => ({
                    ...item,
                    // Per-kind etiket varsa onu kullan (örn. "Marka Profil QR Kodu")
                    label: item.labelByKind?.[activeKind] || item.label,
                })),
        })).filter(group => group.items.length > 0);
    }, [userRole, activeKind, t]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const entityName = entity?.name || t('ngo_admin_dashboard.defaultEntityName');
    const stats = entity?.stats || { totalDonation: 0, volunteers: 0, followers: 0 };
    // Kurumun kendi logosu (otomatik) — avatarUrl/logoUrl.
    const logoUrl = (entity as { avatarUrl?: string; logoUrl?: string } | null | undefined)?.avatarUrl
      || (entity as { logoUrl?: string } | null | undefined)?.logoUrl;
    // Tür-uygun kimlik söylemi — STK / Marka / Kulüp her birine özel.
    const KIND_IDENTITY: Record<'ngo' | 'brand' | 'club', { label: string; subtitle: string }> = {
      ngo: { label: 'Sivil Toplum Kuruluşu', subtitle: 'Şeffaflığını göster, gönüllülerini yönet, bağışlarını takip et.' },
      brand: { label: 'Marka', subtitle: 'Ürünlerini listele, kampanyalarını yönet, sosyal etki ortaklığını büyüt.' },
      club: { label: 'Öğrenci Kulübü', subtitle: 'Etkinliklerini düzenle, üyelerini yönet, kulübünü büyüt.' },
    };
    const identity = KIND_IDENTITY[activeKind];

  return (
    <div className="space-y-6 animate-in fade-in-0 pb-8 px-3 sm:px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center">
                {logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoUrl} alt={entityName} className="h-full w-full object-contain p-1.5" />
                    : <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />}
            </div>
            <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold font-headline">{entityName}</h1>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-primary">{identity.label}</span>
                </div>
                <p className="text-muted-foreground text-sm">{identity.subtitle}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 self-start md:self-center">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">{userRole} {t('ngo_admin_dashboard.rolePermissionSuffix')}</span>
        </div>
      </div>

      {/* Getting Started: yeni NGO admin'lerine 4 kritik adımı net göster.
          Her kart bir admin sayfasına link. */}
      <Card className="shadow-sm overflow-hidden rounded-3xl border-primary/20 bg-primary/5">
        <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('ngo_admin_dashboard.quickStartTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('ngo_admin_dashboard.quickStartSubtitle')}</p>
        </CardHeader>
        <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Link href="/ngo-admin/manage-profile" className="p-3 rounded-xl bg-card hover:bg-accent transition-colors border border-border flex flex-col gap-1.5 min-h-[44px]">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold leading-tight">{t('ngo_admin_dashboard.quickStartProfileTitle')}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{t('ngo_admin_dashboard.quickStartProfileHint')}</span>
                </Link>
                <Link href="/ngo-admin/events" className="p-3 rounded-xl bg-card hover:bg-accent transition-colors border border-border flex flex-col gap-1.5 min-h-[44px]">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold leading-tight">{t('ngo_admin_dashboard.quickStartEventTitle')}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{t('ngo_admin_dashboard.quickStartEventHint')}</span>
                </Link>
                <Link href="/ngo-admin/posts" className="p-3 rounded-xl bg-card hover:bg-accent transition-colors border border-border flex flex-col gap-1.5 min-h-[44px]">
                    <Newspaper className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold leading-tight">{t('ngo_admin_dashboard.quickStartPostTitle')}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{t('ngo_admin_dashboard.quickStartPostHint')}</span>
                </Link>
                <Link href="/ngo-admin/volunteer/new" className="p-3 rounded-xl bg-card hover:bg-accent transition-colors border border-border flex flex-col gap-1.5 min-h-[44px]">
                    <HeartHandshake className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold leading-tight">{t('ngo_admin_dashboard.quickStartVolunteerTitle')}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{t('ngo_admin_dashboard.quickStartVolunteerHint')}</span>
                </Link>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm overflow-hidden rounded-3xl border-border">
        <CardHeader className="border-b border-border bg-muted/30 p-5 sm:p-6">
            <CardTitle className="text-lg">{t('ngo_admin_dashboard.performanceTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {!entity ? (
                <div className="p-6 text-center text-muted-foreground">
                    <p>{t('ngo_admin_dashboard.noEntityTitle')}</p>
                    <p className="text-sm mt-1">{t('ngo_admin_dashboard.noEntityHint')}</p>
                </div>
            ) : (
            <div className="divide-y divide-border">
                {(userRole === 'Finans Yöneticisi' || userRole === 'Genel Yönetici') && (
                    <div className="flex items-center justify-between p-5 sm:p-6 transition-colors hover:bg-accent/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">{t('ngo_admin_dashboard.totalResources')}</p>
                                <p className="text-2xl font-black tracking-tighter">{stats.totalDonation?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0,00 ₺'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {(userRole === 'Gönüllü Yöneticisi' || userRole === 'Genel Yönetici') && (
                    <div className="flex items-center justify-between p-5 sm:p-6 transition-colors hover:bg-accent/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">{t('ngo_admin_dashboard.activeCommunity')}</p>
                                <p className="text-2xl font-black tracking-tighter">+{stats.volunteers?.toLocaleString('tr-TR') || stats.followers?.toLocaleString('tr-TR') || '0'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}
        </CardContent>
      </Card>

        <div className="space-y-6">
            <h2 className="text-xl font-bold font-headline px-1">{t('ngo_admin_dashboard.managementTools')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGroups.map(group => (
                    <Card key={group.title} className="shadow-sm overflow-hidden rounded-3xl border-border">
                        <CardHeader className="bg-muted/20 py-4 px-6 border-b border-border">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{group.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {group.items.map(item => (
                                    <NavLink key={item.id} {...item} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}

function DashboardSuspenseFallback() {
  const { t } = useTranslation();
  return <div>{t('ngo_admin_dashboard.suspenseFallback')}</div>;
}

export default function NgoDashboardPage() {
  return (
    <Suspense fallback={<DashboardSuspenseFallback />}>
      <NgoDashboardPageContent />
    </Suspense>
  );
}
