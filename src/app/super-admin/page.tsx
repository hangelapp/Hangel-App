'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSuperAdminPermissions, slugFromPath } from '@/hooks/use-super-admin-permissions';
// P2-4: closed icon set for superAdminNavItems lookup — replaces `import * as Icons`.
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Building,
  Calendar,
  ChevronRight,
  FileEdit,
  FileText,
  Globe,
  HandCoins,
  HeartHandshake,
  HelpCircle,
  Layers,
  Library,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  Newspaper,
  Presentation,
  School,
  Send,
  Settings,
  Shield,
  Siren,
  Star,
  Store,
  UserCog,
  Users,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Building,
  Calendar,
  FileEdit,
  FileText,
  Globe,
  HandCoins,
  HeartHandshake,
  HelpCircle,
  Layers,
  Library,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  Newspaper,
  Presentation,
  School,
  Send,
  Settings,
  Shield,
  Siren,
  Star,
  Store,
  UserCog,
  Users,
};
import { useFirestore } from '@/firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useMenuBadge, type BadgeConfig } from '@/components/shared/use-menu-badge';

// Hangi menü href'i için hangi koleksiyon + status filtresi badge sayar?
// Yoksa: badge gösterilmez. createdAt > lastSeen (localStorage) filtresi
// useMenuBadge tarafından otomatik uygulanır → ziyaret edince badge sıfırlanır.
const SUPER_ADMIN_BADGE_CONFIG: Record<string, BadgeConfig> = {
    '/super-admin/applications': { kind: 'collection', collectionName: COLLECTIONS.applications, status: 'Beklemede' },
    '/super-admin/emergency': { kind: 'collection', collectionName: COLLECTIONS.emergencyRequests, status: 'pending' },
    '/super-admin/support': { kind: 'collection', collectionName: COLLECTIONS.supportTickets, status: 'open' },
    '/super-admin/donations': { kind: 'collection', collectionName: COLLECTIONS.donations },
    '/super-admin/posts': { kind: 'collection', collectionName: COLLECTIONS.posts },
    '/super-admin/communications': { kind: 'collection', collectionName: COLLECTIONS.messages },
    '/super-admin/users': { kind: 'collection', collectionName: COLLECTIONS.users },
};

const iconColorMap: { [key: string]: string } = {
  'FileText': 'bg-sky-500',
  'FileEdit': 'bg-indigo-500',
  'UserCog': 'bg-purple-500',
  'Building': 'bg-orange-500',
  'Store': 'bg-green-500',
  'School': 'bg-gray-500',
  'HeartHandshake': 'bg-red-500',
  'Newspaper': 'bg-blue-500',
  'Star': 'bg-yellow-500',
  'BarChart3': 'bg-indigo-500',
  'Shield': 'bg-green-600',
  'BookCopy': 'bg-amber-600',
  'Bell': 'bg-teal-500',
  'Settings': 'bg-gray-500',
  'HelpCircle': 'bg-pink-500',
  'LifeBuoy': 'bg-blue-400',
  'Megaphone': 'bg-yellow-500',
  'Presentation': 'bg-[#f34723]',
  'LayoutDashboard': 'bg-blue-500',
  'Inbox': 'bg-cyan-500',
  'Users': 'bg-blue-500',
  'Globe': 'bg-emerald-500',
  'MessageSquare': 'bg-cyan-500',
  'Send': 'bg-violet-500',
  'Layers': 'bg-violet-600',
  'DatabaseZap': 'bg-red-600',
  'Siren': 'bg-red-700',
  'Brain': 'bg-fuchsia-500',
};

const superAdminNavSections = [
    {
        title: 'İçerik & Web',
        items: [
            { href: '/super-admin/web-content', label: 'WEB İçerik Yönetimi', icon: 'FileEdit', description: 'Genel bilgilendirme ve kurumsal portal sayfalarını yönet.' },
            { href: '/super-admin/association-content', label: 'Dernek Web Sitesi Yönetimi', icon: 'Globe', description: 'Dernek sayfalarının içeriklerini yönet.' },
            { href: '/super-admin/contracts', label: 'Sözleşmeler ve Politikalar', icon: 'FileText', description: 'Kullanıcı sözleşmesi, KVKK, gizlilik ve diğer hukuki metinleri düzenle veya yeni sözleşme ekle.' },
            { href: '/super-admin/pages', label: 'İçerik Sayfaları (Basın/Etkinlik vb.)', icon: 'Newspaper', description: 'Basın, etkinlik, kariyer gibi sayfaları oluştur ve düzenle.' },
            { href: '/super-admin/marketing-kit', label: 'Tanıtım Araçları', icon: 'Presentation', description: 'hangel tanıtım materyalleri: sunum, sosyal medya seti, döner kart, mağaza ekipmanı, A5 kart, örümcek stand. STK/marka/kulüp panellerine onayla.' },
            { href: '/super-admin/conference-deck', label: 'Konferans Sunumu (Düzenle)', icon: 'Presentation', description: 'Gelir Modeli Konferansları sunumunu düzenle — slayt ekle/sil/sırala, metinleri değiştir; canlı sunum anında güncellenir.' },
        ],
    },
    {
        title: 'Üyeler & Kurumlar',
        items: [
            { href: '/super-admin/applications', label: 'Başvuru Yönetimi', icon: 'FileText', description: 'STK, marka ve kulüp başvurularını yönet.' },
            { href: '/super-admin/users', label: 'Kullanıcı Yönetimi', icon: 'UserCog', description: 'Platformdaki kullanıcıları görüntüle ve yönet.' },
            { href: '/super-admin/ngos', label: 'STK Yönetimi', icon: 'Building', description: 'Platformdaki STK\'ları görüntüle ve yönet.' },
            { href: '/super-admin/brands', label: 'Marka Yönetimi', icon: 'Store', description: 'Platformdaki markaları görüntüle ve yönet.' },
            { href: '/super-admin/feed', label: 'Ürün Feed & Listeleme', icon: 'Library', description: 'Marka feed\'lerinden ürünleri çek (ingest) ve markaların marka/ürün listeleme modunu yönet.' },
            { href: '/super-admin/clubs', label: 'Kulüp Yönetimi', icon: 'School', description: 'Öğrenci kulüplerini görüntüle ve yönet.' },
        ],
    },
    {
        title: 'Faaliyet & İçerik Akışı',
        items: [
            { href: '/super-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: 'HeartHandshake', description: 'Gönüllülük ilanlarını onayla ve yönet.' },
            { href: '/super-admin/events', label: 'Etkinlik Yönetimi', icon: 'Calendar', description: 'Öğrenci kulüplerinin oluşturduğu etkinlikleri onayla veya reddet.' },
            { href: '/super-admin/posts', label: 'Gönderi Yönetimi', icon: 'Newspaper', description: 'Tüm gönderileri denetle ve yönet.' },
            { href: '/super-admin/surveys', label: 'Anket & Değerlendirmeler', icon: 'Star', description: 'Kullanıcı keşif anketleri ve uygulama değerlendirmelerini görüntüle.' },
        ],
    },
    {
        title: 'Finans & Sosyal Etki',
        items: [
            { href: '/super-admin/donations', label: 'Bağış Yönetimi', icon: 'HandCoins', description: 'Tüm bağış işlemlerini ve STK hak edişlerini yönetin.' },
            { href: '/super-admin/funds', label: 'Fon & Hibe Programları', icon: 'HandCoins', description: 'STK\'ların başvurabileceği hibe programlarını ve fon kaynaklarını yönetin.' },
            { href: '/super-admin/ngo-ads', label: 'STK Reklam Yönetimi', icon: 'Megaphone', description: 'STK\'ların Google Ad Grants (ayda 10.000$) ve sonraki platform reklam hesaplarını yönet — ajans paneli.' },
            { href: '/super-admin/transparency', label: 'Şeffaflık Yönetimi', icon: 'Shield', description: 'Yüklenen belgeleri kontrol et ve onayla.' },
        ],
    },
    {
        title: 'İletişim & Bildirim',
        items: [
            { href: '/super-admin/notifications', label: 'Bildirim Merkezi', icon: 'Bell', description: 'Platform genelinde süper-admine düşen bildirimleri görüntüle ve okundu işaretle.' },
            { href: '/super-admin/communications', label: 'DM & Uygulama-İçi Bildirim', icon: 'MessageSquare', description: 'Kullanıcılara uygulama-içi direkt mesaj ve anlık bildirim gönder.' },
            { href: '/super-admin/messaging', label: 'Toplu SMS & E-Posta', icon: 'Send', description: 'Kampanya, şablon, segment ve gönderim analitikleri.' },
            { href: '/super-admin/messaging-quota', label: 'SMS/Mail Kota', icon: 'Layers', description: 'Bayilik havuzu, STK kota tahsisi, kontör paketleri ve bekleyen siparişler.' },
            { href: '/super-admin/emergency', label: 'Acil Durum Yönetimi', icon: 'Siren', description: 'Acil kan talebi ve afet bildirimlerini yönet, hedef bildirimler gönder.' },
            { href: '/super-admin/hospitals', label: 'Hastane Yönetimi', icon: 'Building', description: 'OSM ve Sağlık Bakanlığı hastane kayıtlarını düzenle, eksik adres/il/ilçe alanlarını tamamla.' },
            { href: '/super-admin/ads', label: 'Reklam Yönetimi', icon: 'Megaphone', description: 'Platform içi reklamları yönet.' },
            { href: '/super-admin/public-relations', label: 'Kamu İlişkileri', icon: 'Users', description: 'Kurumsal işbirliği taleplerini yönet.' },
        ],
    },
    {
        title: 'Zeka & Analiz',
        items: [
            { href: '/super-admin/library', label: 'Kütüphane Yönetimi', icon: 'Library', description: 'Veri kütüphanesi, akademik makaleler, rehberler ve sözlük terimlerini yönet; bölümler ve içerikler ekle/düzenle.' },
            { href: '/super-admin/ai-management', label: 'Yapay Zeka Yönetimi', icon: 'Brain', description: 'Kütüphane AI Asistanı ve Proje Yazma Asistanı yapay zekalarını eğit ve yönet.' },
            { href: '/super-admin/data-enrichment', label: 'Veri Zenginleştirme', icon: 'Sparkles', description: 'STK ve marka profillerini resmi web siteleri, kütük, AI fact-check ve ticari kaynaklardan teyitli bilgilerle otomatik tamamla.' },
            { href: '/super-admin/analytics', label: 'İstatistik, Analizler & Demografi', icon: 'BarChart3', description: 'Platformun genel metrikleri ve STK bazında destekçi demografi profili (yaş, cinsiyet, konum, meslek, ilgi alanları) birleşik panelde.' },
            { href: '/super-admin/activity', label: 'Aktiviteler & İşlem Logu', icon: 'Activity', description: 'Platform genelinde tüm aktivite ve sistem işlemlerinin merkezi listesi.' },
            { href: '/super-admin/onboarding-funnel', label: 'Onboarding Funnel', icon: 'Layers', description: 'Kayıt sonrası kullanıcıların onboarding adımlarındaki ilerleme ve terk (drop-off) oranlarını gör.' },
        ],
    },
    {
        title: 'Sistem & Destek',
        items: [
            { href: '/super-admin/set-superadmin', label: 'SUPERADMIN Ayarı', icon: 'Shield', description: '5384009090 numaralı kullanıcıyı SUPERADMIN olarak ayarla.' },
            { href: '/super-admin/settings', label: 'Panel Ayarları', icon: 'Settings', description: 'Platformun genel ayarlarını yönet.' },
            { href: '/super-admin/support', label: 'Destek Talepleri', icon: 'HelpCircle', description: 'Kullanıcılardan gelen destek taleplerini yönet.' },
            { href: '/super-admin/help', label: 'Yardım Merkezi', icon: 'LifeBuoy', description: 'Admin paneli kullanımı hakkında bilgi al.' },
        ],
    },
];

// Tek menü satırı — opsiyonel olarak useMenuBadge çağırır. Hook'lar koşullu
// çalıştırılamadığı için her item ayrı bir component'te.
function SuperAdminMenuItem({ href, label, description, Icon, color, badgeConfig }: {
    href: string;
    label: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
    badgeConfig?: BadgeConfig;
}) {
    const db = useFirestore();
    const fallback = React.useMemo<BadgeConfig>(() => ({ kind: 'custom', build: () => null }), []);
    const { count, markSeen } = useMenuBadge(db, href, badgeConfig || fallback);
    const showBadge = !!badgeConfig && count > 0;

    return (
        <Link href={href} onClick={markSeen} className="block hover:bg-muted/30 transition-all group">
            <div className="flex items-center p-6">
                <div className={cn("h-12 w-12 flex items-center justify-center mr-6 rounded-2xl shadow-sm transition-transform group-hover:scale-110", color)}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-lg text-[#1d1d1f] group-hover:text-primary transition-colors">{label}</p>
                        {showBadge && (
                            <Badge className="bg-red-600 hover:bg-red-600 text-white font-black text-[10px] px-2 py-0 h-5 min-w-[20px] flex items-center justify-center rounded-full">
                                {count > 99 ? '99+' : count}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium leading-tight">{description}</p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
            </div>
        </Link>
    );
}

export default function SuperAdminDashboard() {
  const db = useFirestore();

  // P2-8e: Replaced 4 full-collection useCollection listeners (users, ngos, brands,
  // applications) with one-shot getCountFromServer aggregates. The dashboard only
  // renders counts — no list iteration / sort / filter beyond `status == 'Beklemede'`.
  // Aggregate cost: 1 read per 1000 docs vs. full doc downloads + live re-renders on
  // every write. Trade-off: counts no longer auto-refresh (acceptable for an ops panel
  // re-opened per session).
  const [counts, setCounts] = React.useState<{
    users: number | null;
    ngos: number | null;
    brands: number | null;
    pendingApps: number | null;
  }>({ users: null, ngos: null, brands: null, pendingApps: null });
  const [countsLoading, setCountsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!db) return;
    let cancelled = false;
    (async () => {
      try {
        const [usersSnap, ngosSnap, brandsSnap, pendingAppsSnap] = await Promise.all([
          getCountFromServer(collection(db, COLLECTIONS.users)),
          getCountFromServer(collection(db, COLLECTIONS.ngos)),
          getCountFromServer(collection(db, COLLECTIONS.brands)),
          getCountFromServer(
            query(collection(db, COLLECTIONS.applications), where('status', '==', 'Beklemede'))
          ),
        ]);
        if (cancelled) return;
        setCounts({
          users: usersSnap.data().count,
          ngos: ngosSnap.data().count,
          brands: brandsSnap.data().count,
          pendingApps: pendingAppsSnap.data().count,
        });
      } catch (err) {
        if (!cancelled) console.error('[super-admin] count aggregate failed', err);
      } finally {
        if (!cancelled) setCountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  const usersLoading = countsLoading;
  const ngosLoading = countsLoading;
  const brandsLoading = countsLoading;
  const appsLoading = countsLoading;
  const pendingAppsCount = counts.pendingApps ?? 0;

  // Granular yetki: kısıtlı super-admin yalnızca izinli modülleri görür.
  const { slugAllowed } = useSuperAdminPermissions();
  const visibleSections = superAdminNavSections
    .map((s) => ({ ...s, items: s.items.filter((it) => slugAllowed(slugFromPath(it.href))) }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Admin Paneli</h1>
            <p className="text-muted-foreground text-sm font-medium">Platform sağlığı ve operasyonel denetim merkezi.</p>
        </div>
        <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200 font-bold flex items-center gap-1.5 px-3 py-1">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> CANLI VERİ AKIŞI
        </Badge>
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Kullanıcılar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{usersLoading ? '...' : (counts.users ?? 0)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Aktif kayıtlı üye</p>
            </CardContent>
          </Card>
          
          <Link href="/super-admin/applications" className="block group">
            <Card className={cn(
                "rounded-2xl border-black/5 shadow-sm transition-all",
                pendingAppsCount > 0 ? "bg-primary/5 border-primary/20 hover:bg-primary/10" : "hover:shadow-md"
            )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-xs font-black uppercase tracking-widest", pendingAppsCount > 0 ? "text-primary" : "text-muted-foreground")}>Onay Bekleyenler</CardTitle>
                <FileText className={cn("h-4 w-4", pendingAppsCount > 0 ? "text-primary" : "text-muted-foreground")} />
                </CardHeader>
                <CardContent>
                <div className={cn("text-3xl font-black tracking-tighter", pendingAppsCount > 0 && "text-primary")}>{appsLoading ? '...' : pendingAppsCount}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Yeni kurumsal başvuru</p>
                </CardContent>
            </Card>
          </Link>

          <Card className="rounded-2xl border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aktif STK</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{ngosLoading ? '...' : (counts.ngos ?? 0)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Bağışçı kabul eden dernekler</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aktif Marka</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{brandsLoading ? '...' : (counts.brands ?? 0)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">İş ortağı işletmeler</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl rounded-[2.5rem] border-black/5 overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 p-8 border-b">
                <CardTitle className="text-xl font-bold">Yönetim Araçları</CardTitle>
                <CardDescription>Platformun teknik ve içerik operasyonlarını buradan yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {visibleSections.map(section => (
                    <div key={section.title}>
                        <div className="px-6 pt-6 pb-2 bg-muted/20 border-b border-black/5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{section.title}</p>
                        </div>
                        <div className="divide-y border-black/5">
                            {section.items.map(item => {
                                const Icon = iconMap[item.icon] || HelpCircle;
                                const color = iconColorMap[item.icon as keyof typeof iconColorMap] || 'bg-gray-500';
                                const badgeCfg = SUPER_ADMIN_BADGE_CONFIG[item.href];
                                return (
                                    <SuperAdminMenuItem
                                        key={item.href}
                                        href={item.href}
                                        label={item.label}
                                        description={item.description}
                                        Icon={Icon}
                                        color={color}
                                        badgeConfig={badgeCfg}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
