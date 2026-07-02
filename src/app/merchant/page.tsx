'use client';

import React from 'react';
import {
  HeartHandshake,
  LayoutDashboard,
  QrCode,
  PackageSearch,
  Store,
  BarChart3,
  ScanLine,
  Leaf,
  Award,
  Megaphone,
  Mail,
  UsersRound,
  Calculator,
  Globe,
} from 'lucide-react';

import {
  MarketingNav,
  AppleSection,
  FeatureGrid,
  CompareNote,
  type FeatureItem,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

const SLUG = 'merchant';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=BRAND';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop';

interface MerchantContent {
  navLabel: string;
  ctaLabel: string;
  backLabel: string;
  footerLabel: string;

  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroImage: string;

  donationEyebrow: string;
  donationTitle: string;
  donationSubtitle: string;
  donationDescription: string;
  donationBadge: string;

  panelEyebrow: string;
  panelTitle: string;
  panelSubtitle: string;
  panelDescription: string;

  feedEyebrow: string;
  feedTitle: string;
  feedSubtitle: string;
  feedDescription: string;
  feedBadge: string;

  freeEyebrow: string;
  freeTitle: string;
  freeSubtitle: string;
  freeDescription: string;
  freeBadge: string;

  growthEyebrow: string;
  growthTitle: string;
  growthSubtitle: string;
  growthDescription: string;

  toolsEyebrow: string;
  toolsTitle: string;
  toolsDescription: string;

  roadmapEyebrow: string;
  roadmapTitle: string;
  roadmapDescription: string;

  compareNote: React.ReactNode;

  finalTitle: string;
  finalSubtitle: string;
  finalDescription: string;
  finalPrimaryCta: string;

  features: FeatureItem[];
  roadmap: FeatureItem[];
}

const TR: MerchantContent = {
  navLabel: 'hangel Markalar',
  ctaLabel: 'Marka Ol',
  backLabel: 'Ana Sayfa',
  footerLabel: 'Markalar',

  heroEyebrow: 'Markalar için hangel',
  heroTitle: 'Her satış, bir iyilik.',
  heroSubtitle: 'Markanız satar; iyilik büyür.',
  heroDescription:
    'hangel, markanızdan yapılan her alışverişi seçilen bir sivil topluma bağışa dönüştürür. Tek panelde oluşan bağış hacmini ve şeffaf komisyonu görürsünüz. Stok, fiyat ya da müşteri ilişkisi sizde kalır; iyilik tarafını biz taşırız.',
  heroPrimaryCta: 'Daha Fazla Bilgi Al',
  heroSecondaryCta: 'Markanı Ücretsiz Kaydet',
  heroImage: HERO_IMAGE,

  donationEyebrow: 'Alışverişle bağış',
  donationTitle: 'Müşteriniz alışveriş yapar, bir STK kazanır.',
  donationSubtitle: 'Bağış ve kazanç takibi, baştan sona şeffaf.',
  donationDescription:
    'Markanızdan yapılan alışveriş, müşterinin seçtiği sivil topluma bağışa döner. Panelde oluşan bağış hacmini ve buna karşılık gelen şeffaf komisyonu canlı izlersiniz. Gizli kalem yok, sürpriz kesinti yok.',
  donationBadge: 'Sadece hangel’da',

  panelEyebrow: 'Marka paneli',
  panelTitle: 'Markanızı tek panelden yönetin.',
  panelSubtitle: 'Profil, iletişim, finans ve destek bir arada.',
  panelDescription:
    'Marka panelinde profilinizi düzenler, iletişim bilgilerinizi yönetir, finansal hareketleri görür ve destek alırsınız. Etkinizi tek ekrandan, sade ve sakin bir akışla takip edersiniz.',

  feedEyebrow: 'Ürün feed / PIM',
  feedTitle: 'Kataloğunuz hangel pazarında.',
  feedSubtitle: 'GelirOrtakları Go Feed veya Google Merchant XML ile içe aktarın.',
  feedDescription:
    'Var olan ürün kataloğunuzu GelirOrtakları Go Feed ya da Google Merchant XML üzerinden hangel’e aktarın. Ürünleriniz hangel pazarında listelensin, alışverişe açılan her ürün bağışa dönüşsün.',
  feedBadge: 'Yeni',

  freeEyebrow: 'Neden hangel · Ücretsiz',
  freeTitle: 'Marka paneli tamamen ücretsiz.',
  freeSubtitle: 'Kurulum ücreti yok, aylık abonelik yok, gizli kalem yok.',
  freeDescription:
    'Markanızı kaydetmek ve paneli kullanmak ücretsizdir. Reklam yönetimi, CRM, ekip rolleri, toplu mail/SMS ve ürün feed’i; ayrı araçlara bütçe ayırmadan tek panelde açılır. Siz satışa odaklanın, iyilik tarafını biz taşıyalım.',
  freeBadge: 'Ücretsiz',

  growthEyebrow: 'Büyüme araçları',
  growthTitle: 'Reklam, CRM ve ekibiniz tek panelde.',
  growthSubtitle: 'Google · Meta · TikTok reklamları, müşteri ilişkileri ve roller.',
  growthDescription:
    'Google, Meta ve TikTok reklam hesaplarınızı panelden bağlayın; kampanyalarınızı hangel üzerinden yayınlayın. CRM ile müşteri ilişkilerinizi, ekip ve rol yönetimiyle yetkilerinizi, toplu mail/SMS ile iletişiminizi tek yerden yürütün.',

  toolsEyebrow: 'Canlı araçlar',
  toolsTitle: 'Bugünden kullanabileceğiniz her şey.',
  toolsDescription:
    'Markanız kaydolduğu anda aktif olan araçlar. Hepsi tek panelde, hepsi Türkiye’ye özel ve ücretsiz.',

  roadmapEyebrow: 'Yolda olanlar',
  roadmapTitle: 'Yakında ve test aşamasında.',
  roadmapDescription:
    'Altyapısı kurulan, test edilen veya yol haritasında olan özellikler. Dürüst olmak adına bunları “var” demiyoruz; geldikçe panelinize açıyoruz.',

  compareNote: (
    <>
      Dünyada alışverişle bağış toplayan benzer platformlar var; hangel’de bu, Türkiye’ye özel,
      ücretsiz ve şeffaf komisyonuyla tek panelde. Markanız ne sattığını bilir, biz iyiliğin
      nereye gittiğini gösteririz.
    </>
  ),

  finalTitle: 'Markanızı iyiliğin tarafına yazın.',
  finalSubtitle: 'Bilinçli tüketicinin tercih ettiği marka olun.',
  finalDescription:
    'Kayıt ücretsiz, kurulum hızlı. Markanızı bugün kaydedin; ilk satıştan itibaren etkinizi panelde görmeye başlayın.',
  finalPrimaryCta: 'Markanı Ücretsiz Kaydet',

  features: [
    {
      icon: HeartHandshake,
      title: 'Alışverişle Bağış & Kazanç Takibi',
      description:
        'Markanızdan yapılan alışveriş seçilen STK’ya bağışa döner. Oluşan bağış hacmini ve şeffaf komisyonu panelde canlı görürsünüz.',
      badge: { kind: 'hangel' },
    },
    {
      icon: LayoutDashboard,
      title: 'Marka Paneli',
      description:
        'Profil, iletişim, finans ve destek tek panelde. Markanızla ilgili her şeyi sade bir ekrandan yönetin.',
    },
    {
      icon: QrCode,
      title: 'Markalı QR Kod Üretici',
      description:
        'Merkezinde hangel logolu QR kodlarını üretin. 256–2048px aralığında SVG veya PNG olarak indirin.',
    },
    {
      icon: PackageSearch,
      title: 'Ürün Feed / PIM',
      description:
        'GelirOrtakları Go Feed veya Google Merchant XML’den ürün kataloğunuzu içe aktarın; ürünleriniz hangel pazarında listelensin.',
      badge: { kind: 'yeni' },
    },
    {
      icon: Store,
      title: 'Market Listeleme',
      description:
        'Markanız hangel pazarında kategoriye göre, bağış oranıyla birlikte listelenir. Bilinçli tüketici sizi kolayca bulur.',
    },
    {
      icon: Megaphone,
      title: 'Reklam Yönetimi (Google · Meta · TikTok)',
      description:
        'Reklam hesaplarınızı bağlayın; Google, Meta ve TikTok kampanyalarınızı panelden yayınlayıp yönetin.',
    },
    {
      icon: UsersRound,
      title: 'CRM, Ekip & Roller',
      description:
        'Müşteri ilişkilerinizi CRM ile yönetin; ekibinize yetkili kullanıcı ekleyin ve rollerini düzenleyin.',
    },
    {
      icon: Mail,
      title: 'Toplu Mail & SMS',
      description:
        'Workspace toplu mail ve SMS/mail kota sistemiyle iletişiminizi tek panelden, kontrollü biçimde yürütün.',
    },
    {
      icon: Calculator,
      title: 'Muhasebe & Hak Ediş',
      description:
        'Muhasebe entegrasyonu ve hak ediş/ödeme (payout) takibiyle bağış hacminizi baştan sona şeffaf izleyin.',
    },
    {
      icon: BarChart3,
      title: 'Demografi Analizi',
      description:
        'Etkinizin demografik dağılımını inceleyin; markanızın bilinçli tüketiciye ulaşımını panelde görün.',
    },
  ],

  roadmap: [
    {
      icon: ScanLine,
      title: 'QR ile Temassız Ödeme',
      description:
        'Kasada QR ile ödeme ve STK seçimi. Altyapı hazır; markanın kendi kurabileceği self-servis arayüz yolda.',
      badge: { kind: 'beta' },
    },
    {
      icon: Leaf,
      title: 'AI Sürdürülebilirlik & KSS Raporları',
      description:
        'ESG yayını için yapay zekâ destekli sürdürülebilirlik ve kurumsal sosyal sorumluluk raporları. Test aşamasında.',
      badge: { kind: 'beta' },
    },
    {
      icon: Globe,
      title: 'Kurumsal Site Yayını',
      description:
        'Markanızın kendi sitesini *.hangel.org adresinde yayınlama altyapısı kuruluyor.',
      badge: { kind: 'yakinda' },
    },
    {
      icon: Award,
      title: 'Sadakat Programı',
      description:
        'Puan, kademe ve ödül yapısı kuruluyor. Amaç indirim avcılığı değil; bilinçli tüketicinin tercih ettiği marka olmak.',
      badge: { kind: 'yakinda' },
    },
  ],
};

const EN: MerchantContent = {
  navLabel: 'hangel for Brands',
  ctaLabel: 'Become a Brand',
  backLabel: 'Home',
  footerLabel: 'Brands',

  heroEyebrow: 'hangel for brands',
  heroTitle: 'Every sale, a good deed.',
  heroSubtitle: 'Your brand sells; good grows.',
  heroDescription:
    'hangel turns every purchase from your brand into a donation to a chosen nonprofit. You see the donation volume and a transparent commission in a single panel. Stock, pricing and the customer relationship stay with you; we carry the good-deed side.',
  heroPrimaryCta: 'Learn More',
  heroSecondaryCta: 'Register Your Brand Free',
  heroImage: HERO_IMAGE,

  donationEyebrow: 'Donate by shopping',
  donationTitle: 'Your customer shops, a nonprofit wins.',
  donationSubtitle: 'Donation and revenue tracking, transparent end to end.',
  donationDescription:
    'A purchase from your brand becomes a donation to the nonprofit your customer chooses. In the panel you watch the donation volume and the matching transparent commission live. No hidden line items, no surprise deductions.',
  donationBadge: 'Only on hangel',

  panelEyebrow: 'Brand panel',
  panelTitle: 'Run your brand from one panel.',
  panelSubtitle: 'Profile, contact, finance and support together.',
  panelDescription:
    'In the brand panel you edit your profile, manage contact details, view financial activity and get support. Track your impact from one screen, in a clean and calm flow.',

  feedEyebrow: 'Product feed / PIM',
  feedTitle: 'Your catalog on the hangel market.',
  feedSubtitle: 'Import via GelirOrtakları Go Feed or Google Merchant XML.',
  feedDescription:
    'Bring your existing product catalog into hangel via GelirOrtakları Go Feed or Google Merchant XML. Let your products be listed on the hangel market, and let every product opened for purchase turn into a donation.',
  feedBadge: 'New',

  freeEyebrow: 'Why hangel · Free',
  freeTitle: 'The brand panel is completely free.',
  freeSubtitle: 'No setup fee, no monthly subscription, no hidden line items.',
  freeDescription:
    'Registering your brand and using the panel is free. Ad management, CRM, team roles, bulk mail/SMS and the product feed open up in one panel — without budgeting for separate tools. You focus on sales; we carry the good-deed side.',
  freeBadge: 'Free',

  growthEyebrow: 'Growth tools',
  growthTitle: 'Ads, CRM and your team in one panel.',
  growthSubtitle: 'Google · Meta · TikTok ads, customer relations and roles.',
  growthDescription:
    'Connect your Google, Meta and TikTok ad accounts from the panel and publish campaigns through hangel. Run customer relations with the CRM, permissions with team and role management, and communication with bulk mail/SMS — all from one place.',

  toolsEyebrow: 'Live tools',
  toolsTitle: 'Everything you can use today.',
  toolsDescription:
    'Tools that go live the moment your brand registers. All in one panel, all built for Türkiye, all free.',

  roadmapEyebrow: 'On the way',
  roadmapTitle: 'Coming soon and in testing.',
  roadmapDescription:
    'Features being built, tested or on the roadmap. To stay honest we don’t call these “available”; we open them in your panel as they ship.',

  compareNote: (
    <>
      There are similar shop-to-donate platforms around the world; on hangel this is built for
      Türkiye, free and with a transparent commission in a single panel. Your brand knows what it
      sells; we show where the good goes.
    </>
  ),

  finalTitle: 'Put your brand on the side of good.',
  finalSubtitle: 'Be the brand the conscious consumer prefers.',
  finalDescription:
    'Registration is free and setup is fast. Register your brand today and start seeing your impact in the panel from the very first sale.',
  finalPrimaryCta: 'Register Your Brand Free',

  features: [
    {
      icon: HeartHandshake,
      title: 'Shop-to-Donate & Revenue Tracking',
      description:
        'A purchase from your brand becomes a donation to the chosen nonprofit. You see the donation volume and transparent commission live in the panel.',
      badge: { kind: 'hangel' },
    },
    {
      icon: LayoutDashboard,
      title: 'Brand Panel',
      description:
        'Profile, contact, finance and support in one panel. Manage everything about your brand from a single clean screen.',
    },
    {
      icon: QrCode,
      title: 'Branded QR Code Generator',
      description:
        'Generate QR codes with the hangel logo at the center. Download as SVG or PNG, from 256 to 2048px.',
    },
    {
      icon: PackageSearch,
      title: 'Product Feed / PIM',
      description:
        'Import your product catalog from GelirOrtakları Go Feed or Google Merchant XML; your products get listed on the hangel market.',
      badge: { kind: 'yeni' },
    },
    {
      icon: Store,
      title: 'Market Listing',
      description:
        'Your brand is listed by category on the hangel market, together with its donation rate. The conscious consumer finds you easily.',
    },
    {
      icon: Megaphone,
      title: 'Ad Management (Google · Meta · TikTok)',
      description:
        'Connect your ad accounts and publish and manage your Google, Meta and TikTok campaigns from the panel.',
    },
    {
      icon: UsersRound,
      title: 'CRM, Team & Roles',
      description:
        'Manage customer relations with the CRM, add authorized users to your team and manage their roles.',
    },
    {
      icon: Mail,
      title: 'Bulk Mail & SMS',
      description:
        'Run your communication from one panel with Workspace bulk mail and an SMS/mail quota system, in a controlled way.',
    },
    {
      icon: Calculator,
      title: 'Accounting & Payout',
      description:
        'Track your donation volume transparently end to end with accounting integration and payout tracking.',
    },
    {
      icon: BarChart3,
      title: 'Demographics Analysis',
      description:
        'Explore the demographic distribution of your impact and see how your brand reaches the conscious consumer.',
    },
  ],

  roadmap: [
    {
      icon: ScanLine,
      title: 'Contactless QR Payment',
      description:
        'Pay at checkout via QR with nonprofit selection. The infrastructure is ready; a brand self-service interface is on the way.',
      badge: { kind: 'beta' },
    },
    {
      icon: Leaf,
      title: 'AI Sustainability & CSR Reports',
      description:
        'AI-assisted sustainability and corporate social responsibility reports for ESG publishing. In testing.',
      badge: { kind: 'beta' },
    },
    {
      icon: Globe,
      title: 'Corporate Website Publishing',
      description:
        'Infrastructure to publish your brand’s own website on a *.hangel.org address is being built.',
      badge: { kind: 'yakinda' },
    },
    {
      icon: Award,
      title: 'Loyalty Program',
      description:
        'A points, tier and reward structure is being built. The goal isn’t discount hunting; it’s being the brand the conscious consumer prefers.',
      badge: { kind: 'yakinda' },
    },
  ],
};

export default function MerchantAdvantagesPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <MarketingNav
        label={C.navLabel}
        ctaLabel={C.ctaLabel}
        ctaHref={REGISTER_HREF}
        backLabel={C.backLabel}
      />

      {/* Hero — CMS overrides fall back to content */}
      <AppleSection
        eyebrow={C.heroEyebrow}
        title={cms.title || C.heroTitle}
        subtitle={cms.subtitle || C.heroSubtitle}
        description={cms.description || C.heroDescription}
        actions={[
          { label: C.heroSecondaryCta, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroPrimaryCta, href: '#araclar', variant: 'link' },
        ]}
        image={{ url: cms.heroImageUrl || C.heroImage, hint: 'modern minimalist retail store interior' }}
      />

      {/* Statement — shop-to-donate (differentiator) */}
      <AppleSection
        theme="dark"
        eyebrow={C.donationEyebrow}
        title={C.donationTitle}
        subtitle={C.donationSubtitle}
        description={C.donationDescription}
        badges={[{ kind: 'hangel', label: C.donationBadge }]}
        actions={[{ label: C.heroSecondaryCta, href: REGISTER_HREF, variant: 'secondary' }]}
        image={{ url: 'https://images.unsplash.com/photo-1556742049-02e1f6c40b12?q=80&w=2070&auto=format&fit=crop', hint: 'smartphone scanning qr code checkout' }}
      />

      {/* Statement — why hangel / free */}
      <AppleSection
        eyebrow={C.freeEyebrow}
        title={C.freeTitle}
        subtitle={C.freeSubtitle}
        description={C.freeDescription}
        badges={[{ kind: 'hangel', label: C.freeBadge }]}
        actions={[{ label: C.heroSecondaryCta, href: REGISTER_HREF, variant: 'primary' }]}
        image={{ url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2070&auto=format&fit=crop', hint: 'brand team collaborating modern office' }}
      />

      {/* Statement — transparent commission & panel */}
      <AppleSection
        theme="dark"
        eyebrow={C.panelEyebrow}
        title={C.panelTitle}
        subtitle={C.panelSubtitle}
        description={C.panelDescription}
        image={{ url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop', hint: 'sleek minimalist dashboard on tablet screen' }}
      />

      {/* Statement — growth tools (ads, CRM, team) */}
      <AppleSection
        eyebrow={C.growthEyebrow}
        title={C.growthTitle}
        subtitle={C.growthSubtitle}
        description={C.growthDescription}
        image={{ url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop', hint: 'marketing analytics campaign dashboard' }}
      />

      {/* Statement — product feed (new) */}
      <AppleSection
        theme="dark"
        eyebrow={C.feedEyebrow}
        title={C.feedTitle}
        subtitle={C.feedSubtitle}
        description={C.feedDescription}
        badges={[{ kind: 'yeni', label: C.feedBadge }]}
        image={{ url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2070&auto=format&fit=crop', hint: 'organized product catalog on warehouse shelves' }}
      />

      {/* Feature grid — live tools */}
      <AppleSection
        id="araclar"
        theme="light"
        compact
        eyebrow={C.toolsEyebrow}
        title={C.toolsTitle}
        description={C.toolsDescription}
      >
        <FeatureGrid items={C.features} columns={3} />
      </AppleSection>

      {/* Roadmap + compare note */}
      <AppleSection
        theme="light"
        compact
        eyebrow={C.roadmapEyebrow}
        title={C.roadmapTitle}
        description={C.roadmapDescription}
        className="bg-muted"
      >
        <FeatureGrid items={C.roadmap} columns={3} />
        <CompareNote>{C.compareNote}</CompareNote>
      </AppleSection>

      {/* Final CTA */}
      <AppleSection
        theme="dark"
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        actions={[{ label: C.finalPrimaryCta, href: REGISTER_HREF, variant: 'primary' }]}
      />

      <PublicFooter currentPageLabel={C.footerLabel} />
    </div>
  );
}
