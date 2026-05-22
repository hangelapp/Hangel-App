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
};
import { useSearchParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/firebase/collections';

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
  'shopping-cart': 'bg-violet-500',
  'video': 'bg-blue-600',
  'palette': 'bg-pink-500',
  'credit-card': 'bg-emerald-600',
  'target': 'bg-red-600',
  'database': 'bg-indigo-600',
  'phone-call': 'bg-orange-600',
  'building-2': 'bg-slate-600',
  'graduation-cap': 'bg-blue-700',
  'map-pin': 'bg-teal-600',
  'briefcase': 'bg-blue-600',
  'network': 'bg-rose-500',
  'line-chart': 'bg-amber-600',
};

const NavLink = ({ href, icon, label, comingSoon }: { href: string, icon: string, label: string, comingSoon?: boolean }) => {
  // P2-4: normalize kebab → PascalCase, then look up via explicit iconMap.
  const iconName = icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  const Icon = iconMap[iconName] || Info;
  const color = iconColorMap[icon] || 'bg-gray-500';
  const { toast } = useToast();

  const body = (
    <>
      <div className={cn('p-1.5 rounded-lg mr-4', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      {comingSoon ? (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Clock className="h-3 w-3" /> Yakında
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
        onClick={() => toast({
          title: `${label} — Yol Haritasında`,
          description: `Bu modül için harici servis sağlayıcı entegrasyonu (örn. SMS/mail/CRM/video toplantı/POS sağlayıcısı) gereklidir. Geliştirme önceliklendirildiğinde panelinizden duyurulacaktır. Bu sürede süreçleri manuel olarak yönetebilir veya destek ekibimizle iletişime geçebilirsiniz.`,
        })}
        className="flex items-center p-4 hover:bg-accent transition-colors w-full text-sm sm:text-base border-b last:border-b-0 text-left opacity-80"
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

const navGroups = [
    {
        title: "Görünürlük & Kurumsal Kimlik",
        items: [
            { id: 'profile', href: '/ngo-admin/manage-profile', label: 'Profili Güncelle', icon: 'user-cog', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
            { id: 'qr', href: '/ngo-admin/qr', label: 'STK Profil QR Kodu', icon: 'qr-code', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
        ]
    },
    {
        title: "İletişim & Topluluk",
        items: [
            { id: 'notifications', href: '/ngo-admin/notifications', label: 'Gelen Kutusu', icon: 'bell', roles: ['Genel Yönetici', 'Finans Yöneticisi', 'Gönüllü Yöneticisi', 'Mini Blog Yöneticisi'] },
            { id: 'posts', href: '/ngo-admin/posts', label: 'Gönderiler', icon: 'newspaper', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
            { id: 'impact-story', href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: 'sparkles', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'] },
            { id: 'transparency', href: '/ngo-admin/transparency', label: 'Şeffaflık Endeksi', icon: 'shield-check', roles: ['Genel Yönetici', 'Finans Yöneticisi'] },
        ]
    },
    {
        title: "Gönüllü ve Gönüllülük Yönetimi",
        items: [
            { id: 'volunteer', href: '/ngo-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: 'heart-handshake', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'] },
            { id: 'demographics', href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: 'bar-chart', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'] },
        ]
    },
    {
        title: "Finans & Sosyal Etki",
        items: [
            { id: 'donations', href: '/ngo-admin/donations', label: 'Bağış Takibi', icon: 'dollar-sign', roles: ['Genel Yönetici', 'Finans Yöneticisi'] },
            { id: 'funds', href: '/ngo-admin/funds', label: 'Hibeler ve Fonlar', icon: 'HandCoins', roles: ['Genel Yönetici', 'Finans Yöneticisi'] },
        ]
    },
    {
        title: "Entegrasyon ve Yönetim",
        items: [
            { id: 'website', href: '/ngo-admin/website', label: 'Web Sitesi Yönetimi', icon: 'globe', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
            { id: 'sms', href: '/ngo-admin/sms', label: 'SMS Gönderimi', icon: 'message-square', roles: ['Genel Yönetici'], comingSoon: true },
            { id: 'mail', href: '/ngo-admin/mail', label: 'Mail Gönderimi', icon: 'mail', roles: ['Genel Yönetici'], comingSoon: true },
            { id: 'ads', href: '/ngo-admin/ads', label: 'Reklam Yönetimi', icon: 'megaphone', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], comingSoon: true },
            { id: 'events', href: '/ngo-admin/events', label: 'Etkinlik Yönetimi', icon: 'calendar', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], comingSoon: true },
            { id: 'online-meeting', href: '/ngo-admin/online-meeting', label: 'Online Eğitim/Toplantı Araçları', icon: 'video', roles: ['Genel Yönetici'], comingSoon: true },
            { id: 'design-tools', href: '/ngo-admin/design-tools', label: 'Tasarım Programları', icon: 'palette', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], comingSoon: true },
            { id: 'payment-systems', href: '/ngo-admin/payment-systems', label: 'Pos & Ödeme Sistemleri', icon: 'credit-card', roles: ['Genel Yönetici', 'Finans Yöneticisi'], comingSoon: true },
            { id: 'marketing', href: '/ngo-admin/marketing', label: 'Pazarlama İletişimi', icon: 'target', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], comingSoon: true },
            { id: 'accounting', href: '/ngo-admin/accounting', label: 'Ön Muhasebe Yönetimi', icon: 'calculator', roles: ['Genel Yönetici', 'Finans Yöneticisi'], comingSoon: true },
            { id: 'crm', href: '/ngo-admin/crm', label: 'CRM Yönetimi', icon: 'database', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], comingSoon: true },
            { id: 'virtual-pbx', href: '/ngo-admin/virtual-pbx', label: 'Sanal Santral Yönetimi', icon: 'phone-call', roles: ['Genel Yönetici'], comingSoon: true },
            { id: 'virtual-office', href: '/ngo-admin/virtual-office', label: 'Sanal ve Fiziki Ofis', icon: 'building-2', roles: ['Genel Yönetici'], comingSoon: true },
            { id: 'university-volunteering', href: '/ngo-admin/university-volunteering', label: 'Üniversite Gönüllülük Dersi', icon: 'graduation-cap', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], comingSoon: true },
            { id: 'field-team', href: '/ngo-admin/field-team', label: 'Saha Ekip Yönetimi', icon: 'map-pin', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], comingSoon: true },
            { id: 'dm', href: '/ngo-admin/dm', label: 'DM Mesajlaşma Yönetimi', icon: 'message-circle', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], comingSoon: true },
            { id: 'ecommerce', href: '/ngo-admin/ecommerce', label: 'İktisadi İşletme Yönetimi', icon: 'shopping-cart', roles: ['Genel Yönetici', 'Finans Yöneticisi'], comingSoon: true },
            { id: 'hr-integration', href: '/ngo-admin/hr-integration', label: 'İK Şirketleri Entegrasyonu', icon: 'briefcase', roles: ['Genel Yönetici'], comingSoon: true },
            { id: 'volunteer-portal', href: '/ngo-admin/volunteer-portal', label: 'Gönüllülük Portalı Entegrasyonu', icon: 'network', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'], comingSoon: true },
            { id: 'analytics-tools', href: '/ngo-admin/analytics-tools', label: 'Web Analiz Araçları', icon: 'line-chart', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'], comingSoon: true },
        ]
    },
    {
        title: "Sistem & Destek",
        items: [
            { id: 'users', href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: 'users', roles: ['Genel Yönetici'] },
            { id: 'settings', href: '/ngo-admin/settings', label: 'Panel Ayarları', icon: 'settings', roles: ['Genel Yönetici'] },
            { id: 'support', href: '/ngo-admin/support', label: 'Destek', icon: 'help-circle', roles: ['Genel Yönetici', 'Finans Yöneticisi', 'Gönüllü Yöneticisi', 'Mini Blog Yöneticisi'] },
        ]
    }
];

function NgoDashboardPageContent() {
    const searchParams = useSearchParams();
    const entityId = searchParams.get('id');
    const entityType = searchParams.get('type');
    const firestore = useFirestore();
    const { user: authUser } = useUser();

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
        return navGroups.map(group => ({
            ...group,
            items: group.items.filter(item => item.roles.includes(userRole))
        })).filter(group => group.items.length > 0);
    }, [userRole]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const entityName = entity?.name || 'Kuruluşunuz';
    const stats = entity?.stats || { totalDonation: 0, volunteers: 0, followers: 0 };

  return (
    <div className="space-y-6 animate-in fade-in-0 pb-8 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-black/5">
                <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold font-headline">{entityName}</h1>
                <p className="text-muted-foreground text-sm">Kurumsal Yönetim Paneli</p>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 self-start md:self-center">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">{userRole} Yetkisi</span>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden rounded-[2rem] border-black/5">
        <CardHeader className="border-b border-black/5 bg-muted/30 p-6">
            <CardTitle className="text-lg">Kurumsal Performans Özeti</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {!entity ? (
                <div className="p-6 text-center text-muted-foreground">
                    <p>Henüz kuruluş verisi bulunamadı.</p>
                    <p className="text-sm mt-1">Profilinizi oluşturduğunuzda performans verileri burada görünecektir.</p>
                </div>
            ) : (
            <div className="divide-y divide-black/5">
                {(userRole === 'Finans Yöneticisi' || userRole === 'Genel Yönetici') && (
                    <div className="flex items-center justify-between p-6 transition-colors hover:bg-accent/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Toplam Kaynak</p>
                                <p className="text-2xl font-black tracking-tighter">{stats.totalDonation?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0,00 ₺'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {(userRole === 'Gönüllü Yöneticisi' || userRole === 'Genel Yönetici') && (
                    <div className="flex items-center justify-between p-6 transition-colors hover:bg-accent/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-green-900/30 rounded-2xl">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Aktif Topluluk</p>
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
            <h2 className="text-xl font-bold font-headline px-1">Yönetim Araçları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGroups.map(group => (
                    <Card key={group.title} className="shadow-sm overflow-hidden rounded-[2rem] border-black/5">
                        <CardHeader className="bg-muted/20 py-4 px-6 border-b border-black/5">
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

export default function NgoDashboardPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <NgoDashboardPageContent />
    </Suspense>
  );
}
