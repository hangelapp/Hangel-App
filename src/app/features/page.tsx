'use client';

/**
 * /features — hangel STK özellik merkezi (hub).
 *
 * Yedi bağımsız özellik tanıtım sayfasına bağlanan iki dilli kart listesi.
 * Tüm yapı '@/components/marketing/apple-kit' bileşenleriyle kurulur.
 * Marka kuralı: kullanıcıya görünen her yerde marka adı küçük harf "hangel".
 */

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  HeartHandshake,
  PhoneCall,
  MessageSquare,
  Globe,
  ShieldCheck,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import {
  MarketingNav,
  AppleSection,
  SectionHeading,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { useTranslation } from '@/components/providers/language-provider';

const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

type Card = {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
};

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Ana sayfa',

  heroEyebrow: 'Özellikler',
  heroTitle: 'Kurumunuzun her işi için tasarlanmış modüller.',
  heroSubtitle: 'Yedi güçlü yetenek, tek panelde, tamamen ücretsiz.',
  heroDescription:
    'hangel; etkinlikten gönüllülüğe, çağrı merkezinden toplu iletişime, web sitesinden şeffaflığa kadar derneğinizin ve vakfınızın tüm operasyonunu tek çatı altında toplar. Her özelliği daha yakından tanıyın.',

  gridEyebrow: 'Yedi Modül',
  gridTitle: 'Hangisini keşfetmek istersiniz?',
  gridDescription:
    'Her modülün kendine ait ayrıntılı sayfası var. Yeteneklerini, altyapısını ve kurumunuza katacaklarını inceleyin.',

  updatesNote: 'hangel geliştikçe bu modüller ve sayfalar sürekli güncellenir.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'Kurumunuzu dakikalar içinde kaydedin.',
  finalSubtitle: 'Başvuru ücretsiz. Kredi kartı gerekmez.',
  finalDescription:
    'Tüm bu modüllere tek bir ücretsiz panelden erişin. Şeffaflığınızı, kaynağınızı ve etkinizi büyütmeye bugün başlayın.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'STK Tanıtımı',

  footerLabel: 'Özellikler',

  cards: [
    { href: '/features/etkinlik-yonetimi', icon: CalendarDays, title: 'Etkinlik Yönetimi', description: 'Kayıt ve RSVP, QR ile giriş, yaka kartı, sertifika, çok noktalı etkinlik ve "selfie ile bul" fotoğraf galerisi.' },
    { href: '/features/gonulluluk-yonetimi', icon: HeartHandshake, title: 'Gönüllülük İlan Yönetimi', description: 'Yetenek bazlı ilanlar, yüzde uyum eşleştirmesi, toplu onay, koordinatör atama ve saat & etki raporu.' },
    { href: '/features/sanal-santral', icon: PhoneCall, title: 'Sanal Santral (Çağrı Merkezi)', description: 'Tarayıcıdan kulaklıkla arama, kendi hattınızı bağlama, çağrı kaydı, görüşme notu ve sonuç takibi.' },
    { href: '/features/toplu-mesajlasma', icon: MessageSquare, title: 'Toplu Mail ve SMS', description: 'Segment veya CSV alıcılara kotalı toplu SMS ve e-posta; değişkenlerle kişiselleştirme ve kontör paketleri.' },
    { href: '/features/web-sitesi', icon: Globe, title: 'Web Sitesi Yönetimi', description: 'Kodsuz, markanıza özel kurumsal web sitesi; ücretsiz alan adı ya da kendi alan adınızla tek tıkla yayında.' },
    { href: '/features/seffaflik-endeksi', icon: ShieldCheck, title: 'Şeffaflık Endeksi', description: 'Belge ve raporlarınızla 0–100 arası şeffaflık puanı; belge doğrulama ve profilinizde halka açık güven rozeti.' },
    { href: '/features/demografi-analizi', icon: BarChart3, title: 'Demografi Analizi', description: 'Destekçi tabanınızın yaş, şehir, meslek ve ilgi dağılımını canlı grafiklerle görün, kararlarınızı veriyle alın.' },
  ] as Card[],
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Home',

  heroEyebrow: 'Features',
  heroTitle: 'Modules designed for every job your organization has.',
  heroSubtitle: 'Seven powerful capabilities, in one panel, completely free.',
  heroDescription:
    'hangel brings your association or foundation’s entire operation under one roof — from events to volunteering, call center to bulk communication, website to transparency. Get to know each feature more closely.',

  gridEyebrow: 'Seven Modules',
  gridTitle: 'Which one would you like to explore?',
  gridDescription:
    'Each module has its own detailed page. Explore its capabilities, its infrastructure, and what it brings to your organization.',

  updatesNote: 'As hangel evolves, these modules and pages are continuously updated.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Register your organization in minutes.',
  finalSubtitle: 'Applying is free. No credit card required.',
  finalDescription:
    'Access all of these modules from a single free panel. Start growing your transparency, resources and impact today.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'NGO Overview',

  footerLabel: 'Features',

  cards: [
    { href: '/features/etkinlik-yonetimi', icon: CalendarDays, title: 'Event Management', description: 'Registration and RSVP, QR check-in, name badges, certificates, multi-location events and a "find by selfie" photo gallery.' },
    { href: '/features/gonulluluk-yonetimi', icon: HeartHandshake, title: 'Volunteer Listing Management', description: 'Skill-based listings, percentage match, bulk approval, coordinator assignment and an hours & impact report.' },
    { href: '/features/sanal-santral', icon: PhoneCall, title: 'Virtual PBX (Call Center)', description: 'Call from your browser with a headset, bring your own line, call recording, notes and disposition tracking.' },
    { href: '/features/toplu-mesajlasma', icon: MessageSquare, title: 'Bulk Mail and SMS', description: 'Quota-based bulk SMS and email to segment or CSV recipients; personalization with variables and credit packages.' },
    { href: '/features/web-sitesi', icon: Globe, title: 'Website Management', description: 'A code-free, brand-specific corporate website; live in one click with a free domain or your own.' },
    { href: '/features/seffaflik-endeksi', icon: ShieldCheck, title: 'Transparency Index', description: 'A 0–100 transparency score from your documents and reports; document verification and a public trust badge on your profile.' },
    { href: '/features/demografi-analizi', icon: BarChart3, title: 'Demographic Analysis', description: 'See your supporter base’s age, city, profession and interest distribution with live charts, and decide with data.' },
  ] as Card[],
};

export default function FeaturesHubPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
      <MarketingNav
        label={C.navLabel}
        ctaLabel={C.navCta}
        ctaHref={REGISTER_HREF}
        backLabel={C.back}
      />

      <AppleSection
        id="hero"
        eyebrow={C.heroEyebrow}
        title={C.heroTitle}
        subtitle={C.heroSubtitle}
        description={C.heroDescription}
        actions={[
          { label: C.navCta, href: REGISTER_HREF, variant: 'primary' },
          { label: C.finalSecondary, href: '/ngo-onboarding', variant: 'link' },
        ]}
      />

      <section id="moduller" className="bg-[#f5f5f7] py-24 border-b border-black/5">
        <SectionHeading
          eyebrow={C.gridEyebrow}
          title={C.gridTitle}
          description={C.gridDescription}
        />
        <div className="mx-auto max-w-6xl px-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {C.cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-3xl p-6 text-left border bg-white border-black/5 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold mb-1.5 tracking-tight text-[#1d1d1f]">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
              </Link>
            );
          })}
        </div>
        <p className="mx-auto max-w-3xl px-6 mt-10 text-center text-xs text-muted-foreground">{C.updatesNote}</p>
      </section>

      <AppleSection
        id="basla"
        theme="dark"
        eyebrow={C.finalEyebrow}
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        actions={[
          { label: C.finalPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.finalSecondary, href: '/ngo-onboarding', variant: 'secondary' },
        ]}
      />

      <PublicFooter currentPageLabel={C.footerLabel} />
    </div>
  );
}
