/**
 * /app — hangel'in indirme, erişim ve sosyal medya hub'ı.
 *
 * Public sayfa — login gerekmez. QR kod / kartvizit / sosyal medyada
 * "hangel.org.tr/app" linki paylaşıldığında kullanıcı tüm platformları
 * tek sayfada görür ve cihazına uygun olanı indirir.
 *
 * Layout:
 *   - Hero: kısa başlık + altta hangel QR
 *   - Platform kartları (App Store, Google Play, AppGallery, ...)
 *   - Web erişim kartları (Chrome, Safari, Firefox, Edge — PWA install)
 *   - Sosyal medya kanal listesi
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import {
  Apple, Smartphone, Globe, Watch, Monitor, Laptop, Chrome,
  Instagram, Linkedin, Twitter, Youtube, Facebook, MessageCircle,
  Mail, Send, Music2, ExternalLink, QrCode, AtSign,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'hangel\'i indir · App Store, Google Play, AppGallery — hangel.org.tr',
  description: 'hangel mobil uygulamasını iPhone, Android ve Huawei cihazlarına indir. Apple Watch, web ve PWA olarak da kullan. Tüm sosyal medya kanallarımız tek sayfada.',
  openGraph: {
    title: 'hangel — tüm platformlarda yanında',
    description: 'iOS, Android, Watch, web — hangel her cihazda. Sosyal medya kanallarımıza katıl.',
    url: 'https://hangel.org.tr/app',
  },
};

interface PlatformCard {
  name: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  available: boolean;
  iconColor?: string;
}

const STORE_PLATFORMS: PlatformCard[] = [
  {
    name: 'App Store',
    description: 'iPhone & iPad — iOS 15+',
    icon: Apple,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
    available: true,
    iconColor: 'text-foreground',
  },
  {
    name: 'Google Play',
    description: 'Android telefon & tablet — Android 8+',
    icon: Smartphone,
    href: 'https://play.google.com/store/apps/details?id=com.hangel.app',
    available: true,
    iconColor: 'text-emerald-600',
  },
  {
    name: 'AppGallery',
    description: 'Huawei cihazları — EMUI 10+',
    icon: Smartphone,
    href: 'https://appgallery.huawei.com/app/C113000000',
    badge: 'yakında',
    available: false,
    iconColor: 'text-red-600',
  },
  {
    name: 'Apple Watch',
    description: 'iPhone hangel app ile birlikte gelir',
    icon: Watch,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
    badge: 'beta',
    available: true,
    iconColor: 'text-foreground',
  },
  {
    name: 'Mac App',
    description: 'macOS 11+ — Mac Catalyst (iOS app Mac\'te çalışır)',
    icon: Laptop,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
    badge: 'beta',
    available: true,
    iconColor: 'text-foreground',
  },
  {
    name: 'Apple Vision',
    description: 'visionOS — uzamsal arayüz',
    icon: Watch,
    href: '#',
    badge: 'yakında',
    available: false,
    iconColor: 'text-foreground',
  },
  {
    name: 'Microsoft Store',
    description: 'Windows 10/11 — PWA',
    icon: Monitor,
    href: 'https://hangel.org.tr/',
    badge: 'PWA',
    available: true,
    iconColor: 'text-blue-600',
  },
  {
    // Rakuten Cashback benzeri tarayıcı eklentisi — alışverişte otomatik STK desteği.
    // Yayınlanınca: href'e Chrome Web Store linki girilecek, available: true yapılıp
    // 'yakında' badge'i kaldırılacak.
    name: 'Chrome Uzantısı',
    description: 'Chrome / Edge — alışverişte otomatik STK desteği',
    icon: Chrome,
    href: '#',
    badge: 'yakında',
    available: false,
    iconColor: 'text-amber-600',
  },
];

const WEB_PLATFORMS: PlatformCard[] = [
  {
    name: 'hangel.org.tr',
    description: 'Tarayıcıdan tek tıkla — kayıt + giriş',
    icon: Globe,
    href: 'https://hangel.org.tr',
    available: true,
    iconColor: 'text-primary',
  },
  {
    name: 'Chrome',
    description: 'PWA olarak masaüstüne ekle',
    icon: Globe,
    href: 'https://hangel.org.tr',
    badge: 'PWA',
    available: true,
    iconColor: 'text-amber-600',
  },
  {
    name: 'Safari',
    description: 'iOS / macOS — Ana Ekrana Ekle',
    icon: Globe,
    href: 'https://hangel.org.tr',
    badge: 'PWA',
    available: true,
    iconColor: 'text-blue-500',
  },
  {
    name: 'Firefox',
    description: 'Tarayıcı eklentisi olarak',
    icon: Globe,
    href: 'https://hangel.org.tr',
    badge: 'PWA',
    available: true,
    iconColor: 'text-orange-600',
  },
];

interface SocialChannel {
  name: string;
  handle: string;
  href: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

// Tüm sosyal medya hesapları @hangelorg handle'ı ile yayında.
// Tek tutarlı isim — kullanıcı her platformda kolayca bulur, brand tanınırlığı maksimum.
const SOCIAL_HANDLE = 'hangelorg';

const SOCIALS: SocialChannel[] = [
  {
    name: 'Instagram',
    handle: `@${SOCIAL_HANDLE}`,
    href: `https://instagram.com/${SOCIAL_HANDLE}`,
    icon: Instagram,
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-600',
  },
  {
    name: 'LinkedIn',
    handle: `/company/${SOCIAL_HANDLE}`,
    href: `https://linkedin.com/company/${SOCIAL_HANDLE}`,
    icon: Linkedin,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-700',
  },
  {
    name: 'X (Twitter)',
    handle: `@${SOCIAL_HANDLE}`,
    href: `https://x.com/${SOCIAL_HANDLE}`,
    icon: Twitter,
    iconBg: 'bg-foreground/10',
    iconColor: 'text-foreground',
  },
  {
    name: 'YouTube',
    handle: `@${SOCIAL_HANDLE}`,
    href: `https://youtube.com/@${SOCIAL_HANDLE}`,
    icon: Youtube,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600',
  },
  {
    name: 'Facebook',
    handle: `/${SOCIAL_HANDLE}`,
    href: `https://facebook.com/${SOCIAL_HANDLE}`,
    icon: Facebook,
    iconBg: 'bg-blue-600/10',
    iconColor: 'text-blue-700',
  },
  {
    name: 'TikTok',
    handle: `@${SOCIAL_HANDLE}`,
    href: `https://tiktok.com/@${SOCIAL_HANDLE}`,
    icon: Music2,
    iconBg: 'bg-foreground/10',
    iconColor: 'text-foreground',
  },
  {
    name: 'WhatsApp Kanal',
    handle: `@${SOCIAL_HANDLE}`,
    href: 'https://whatsapp.com/channel/0029Va_hangelorg',
    icon: MessageCircle,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    name: 'Telegram',
    handle: `@${SOCIAL_HANDLE}`,
    href: `https://t.me/${SOCIAL_HANDLE}`,
    icon: Send,
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-600',
  },
  {
    name: 'Threads',
    handle: `@${SOCIAL_HANDLE}`,
    href: `https://threads.net/@${SOCIAL_HANDLE}`,
    icon: MessageCircle,
    iconBg: 'bg-foreground/10',
    iconColor: 'text-foreground',
  },
  {
    name: 'Pinterest',
    handle: `/${SOCIAL_HANDLE}`,
    href: `https://pinterest.com/${SOCIAL_HANDLE}`,
    icon: AtSign,
    iconBg: 'bg-red-600/10',
    iconColor: 'text-red-700',
  },
  {
    name: 'Next Sosyal',
    handle: `@${SOCIAL_HANDLE}`,
    href: `https://nextsosyal.com/@${SOCIAL_HANDLE}`,
    icon: AtSign,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600',
  },
  {
    name: 'E-posta',
    handle: 'merhaba@hangel.org',
    href: 'mailto:merhaba@hangel.org',
    icon: Mail,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
];

function PlatformCardItem({ p }: { p: PlatformCard }) {
  const Icon = p.icon;
  const inner = (
    <div className="group flex items-center gap-4 p-4 rounded-3xl glass-surface border border-white/40 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/30">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${p.available ? 'bg-primary/10' : 'bg-muted'}`}>
        <Icon className={`h-6 w-6 ${p.iconColor || 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm sm:text-base truncate">{p.name}</p>
          {p.badge && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              p.badge === 'yakında' ? 'bg-amber-500/15 text-amber-700' :
              p.badge === 'beta' ? 'bg-purple-500/15 text-purple-700' :
              'bg-emerald-500/15 text-emerald-700'
            }`}>
              {p.badge}
            </span>
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{p.description}</p>
      </div>
      {p.available && <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />}
    </div>
  );
  if (!p.available || p.href === '#') {
    return <div className="opacity-60 cursor-not-allowed">{inner}</div>;
  }
  return (
    <a href={p.href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>
  );
}

function SocialItem({ s }: { s: SocialChannel }) {
  const Icon = s.icon;
  return (
    <a
      href={s.href}
      target={s.href.startsWith('mailto:') ? undefined : '_blank'}
      rel={s.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
      className="group flex items-center gap-3 p-3 rounded-2xl glass-surface border border-white/40 transition-all hover:shadow-md hover:scale-[1.02] hover:border-primary/30"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
        <Icon className={`h-5 w-5 ${s.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{s.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{s.handle}</p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
    </a>
  );
}

export default function AppHubPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary/5 via-background to-primary/5">
      <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* ===== HERO ===== */}
        <div className="text-center mb-10 sm:mb-14 space-y-4">
          <div className="inline-flex items-center justify-center mb-2">
            <HangelLogo className="text-4xl sm:text-5xl" href={null} />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline leading-tight">
            hangel her cihazda yanında
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            iOS, Android, Apple Watch, web ve daha fazlası. Cihazına uygun olanı seç,
            hangel'i indir ya da sosyal medyada bizi takip et.
          </p>

          {/* hangel.org.tr/app QR shortcut */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-primary/20 shadow-sm">
            <QrCode className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">QR kodu için</span>
            <Link href="/brand/qr" className="text-xs font-bold text-primary hover:underline">
              /brand/qr
            </Link>
          </div>
        </div>

        {/* ===== APP STORES ===== */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4 px-2">
            Uygulama Mağazaları
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STORE_PLATFORMS.map(p => <PlatformCardItem key={p.name} p={p} />)}
          </div>
        </section>

        {/* ===== WEB / PWA ===== */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4 px-2">
            Web ve PWA
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WEB_PLATFORMS.map(p => <PlatformCardItem key={p.name} p={p} />)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 px-2 leading-relaxed">
            <strong>PWA</strong> nedir? hangel.org.tr'yi tarayıcıdan açtıktan sonra
            "Ana Ekrana Ekle" / "Yükle" seçeneği ile hangel'i bir uygulama gibi kullanabilirsin.
            App Store / Play Store'a girmeden, anında.
          </p>
        </section>

        {/* ===== SOCIALS ===== */}
        <section className="mb-10 sm:mb-12">
          <div className="flex items-end justify-between mb-4 px-2">
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Sosyal Medya ve Kanallar
            </h2>
            <span className="text-[10px] text-muted-foreground">{SOCIALS.length} platform</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SOCIALS.map(s => <SocialItem key={s.name} s={s} />)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 px-2 leading-relaxed">
            Toplumsal etki hikayelerimizi, kan çağrılarını, kampanya duyurularını ve
            STK ortaklıklarını kanallarımızda paylaşıyoruz. Sana en uygun olanı takip et.
          </p>
        </section>

        {/* ===== FOOTER ===== */}
        <div className="pt-8 border-t text-center space-y-2 text-xs text-muted-foreground">
          <HangelLogo className="text-base" href={null} />
          <p>
            <Link href="/" className="hover:text-primary transition-colors">hangel.org.tr</Link>
            {' · '}
            <Link href="/about" className="hover:text-primary transition-colors">hangel hakkında</Link>
            {' · '}
            <Link href="/support" className="hover:text-primary transition-colors">destek</Link>
            {' · '}
            <Link href="/brand/qr" className="hover:text-primary transition-colors">QR kod</Link>
          </p>
          <p className="text-[10px]">
            Bağış, gönüllülük ve kan ihtiyacı eşleştirme için toplumsal etki platformu.
          </p>
        </div>
      </div>
    </div>
  );
}
