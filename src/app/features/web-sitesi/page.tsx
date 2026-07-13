'use client';

/**
 * /features/web-sitesi — Web Sitesi Yönetimi tanıtım sayfası.
 *
 * İki dilli (TR birincil, EN ayna). Tüm yapı '@/components/marketing/apple-kit'
 * bileşenleriyle kurulur. Marka kuralı: kullanıcıya görünen her yerde küçük
 * harf "hangel".
 */

import React from 'react';
import {
  Globe,
  MousePointerClick,
  Palette,
  Link2,
  Rocket,
  RefreshCw,
  Smartphone,
  Search,
  CalendarDays,
  HandCoins,
  HeartHandshake,
  QrCode,
} from 'lucide-react';
import {
  MarketingNav,
  AppleSection,
  SectionHeading,
  FeatureGrid,
  CompareNote,
  type FeatureItem,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { useTranslation } from '@/components/providers/language-provider';
import { useWebPage } from '@/hooks/use-site-content';

const SLUG = 'feature-web-sitesi';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Özellikler',

  heroEyebrow: 'Web Sitesi Yönetimi',
  heroTitle: 'Kurumsal web siteniz, kod yazmadan yayında.',
  heroSubtitle: 'Markanıza özel, ücretsiz alan adıyla, dakikalar içinde canlı.',
  heroDescription:
    'hangel ile derneğinizin ya da vakfınızın kurumsal web sitesini kod yazmadan kurun. Markanıza özel bir görünüm seçin, içeriğinizi düzenleyin ve ücretsiz alan adıyla ya da kendi alan adınızla tek tıkla yayına alın. Etkinlik, bağış ve gönüllülük içeriğiniz hangel paneliyle bağlı; siteniz siz uğraşmadan güncel kalır.',
  heroImage:
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Yetenekleri Gör',

  s1Eyebrow: 'Kodsuz Kurulum',
  s1Title: 'Geliştiriciye değil, hangel’e ihtiyacınız var.',
  s1Description:
    'Tek satır kod yazmadan profesyonel bir kurumsal site kurun. Bölümleri seçin, metni ve görselleri düzenleyin, logonuzu ve renklerinizi ekleyin. Teknik bilgi gerektirmez; kurumunuzu tanıtan bir site dakikalar içinde hazır olur.',

  s2Eyebrow: 'Alan Adınız Sizin',
  s2Title: 'Ücretsiz alan adı ya da kendi adresiniz.',
  s2Description:
    'Sitenizi hangel’in sunduğu ücretsiz bir alan adıyla anında yayına alın ya da kurumunuza ait alan adını bağlayın. İki durumda da kurumsal, güvenilir ve profesyonel bir adreste yayında olursunuz.',

  s3Eyebrow: 'Her Zaman Güncel',
  s3Title: 'Sitesi kendiliğinden güncellenen bir kurum.',
  s3Description:
    'Etkinlikleriniz, bağış çağrılarınız ve gönüllülük ilanlarınız hangel paneliyle bağlıdır; panelde güncellediğinizde siteniz de güncellenir. Ziyaretçileriniz her zaman en güncel bilgiye ulaşır; siz ayrı ayrı uğraşmazsınız.',

  gridEyebrow: 'Yetenekler',
  gridTitle: 'Web sitesi modülünün içinde neler var?',
  gridDescription:
    'İlk kurulumdan yayına, mobil uyumdan içerik güncellemesine kadar yayında olan araçlar.',

  compare:
    'Dünyada kurumsal site kurmak çoğu zaman ajans, aylık ücret ve teknik bakım demektir. hangel’de bu, kodsuz, ücretsiz alan adıyla ve tek panelde.',

  techEyebrow: 'Altyapı',
  techTitle: 'Kodsuz editör + ücretsiz alan adı.',
  techDescription:
    'Kod gerektirmeyen görsel editör, ücretsiz alan adı ya da kendi alan adınızı bağlama, mobil uyumlu ve arama motorlarına hazır sayfalar, hangel paneline bağlı otomatik güncellenen içerik — hepsi tek panelde.',

  updatesNote: 'hangel geliştikçe bu sayfa güncellenir; yeni web sitesi yetenekleri geldikçe burada yer alır.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'Kurumsal sitenizi bugün yayına alın.',
  finalSubtitle: 'Başvuru ücretsiz. Alan adı dahil, kod gerekmez.',
  finalDescription:
    'Markanıza özel bir kurumsal site, dakikalar içinde ve ücretsiz. Kurumunuzu bugün kaydedin, dijitalde görünür olun.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Tüm Özellikler',

  footerLabel: 'Web Sitesi Yönetimi',

  tools: {
    noCode: { title: 'Kodsuz Editör', description: 'Tek satır kod yazmadan bölümleri seçin, metni ve görselleri düzenleyin; site dakikalar içinde hazır.' },
    branding: { title: 'Markanıza Özel', description: 'Logonuzu, renklerinizi ve kurumsal kimliğinizi ekleyin; siteniz tamamen size benzesin.' },
    freeDomain: { title: 'Ücretsiz Alan Adı', description: 'hangel’in sunduğu ücretsiz alan adıyla sitenizi anında yayına alın; ekstra masraf yok.' },
    ownDomain: { title: 'Kendi Alan Adınız', description: 'Kurumunuza ait alan adını bağlayın; profesyonel ve güvenilir bir adreste yayında olun.' },
    publish: { title: 'Tek Tıkla Yayın', description: 'Düzenlemenizi bitirin, yayınla deyin; siteniz saniyeler içinde canlıya çıkar.' },
    autoUpdate: { title: 'Otomatik Güncel İçerik', description: 'Etkinlik, bağış ve gönüllülük içeriğiniz panelle bağlı; güncellediğinizde site de güncellenir.' },
    responsive: { title: 'Mobil Uyumlu', description: 'Siteniz telefon, tablet ve masaüstünde kusursuz görünür; ziyaretçileriniz her cihazda rahat gezer.' },
    seo: { title: 'Arama Motoruna Hazır', description: 'Sayfalarınız arama motorlarına ve yapay zekâ yanıtlarına uygun; kurumunuz aramada bulunur.' },
    events: { title: 'Etkinlik Bölümü', description: 'Yaklaşan etkinlikleriniz sitenizde otomatik listelenir; ziyaretçiler doğrudan başvurur.' },
    donation: { title: 'Bağış Çağrısı', description: 'Bağış ve destek çağrılarınızı sitenizde öne çıkarın; destekçilerinizi harekete geçirin.' },
    volunteer: { title: 'Gönüllülük İlanları', description: 'Açık gönüllülük ilanlarınız sitenizde görünür; yeni gönüllüler doğrudan başvurur.' },
    qr: { title: 'QR ile Paylaşım', description: 'Sitenizi profil QR kodu ve bağlantıyla her yerden paylaşın; erişimi kolaylaştırın.' },
  },
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Features',

  heroEyebrow: 'Website Management',
  heroTitle: 'Your corporate website, live without writing code.',
  heroSubtitle: 'Brand-specific, with a free domain, live in minutes.',
  heroDescription:
    'With hangel, build your association or foundation’s corporate website without writing code. Choose a brand-specific look, edit your content, and publish in one click with a free domain or your own. Your event, donation and volunteering content is connected to the hangel panel; your site stays up to date without any effort.',
  heroImage:
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'See Capabilities',

  s1Eyebrow: 'No-Code Setup',
  s1Title: 'You don’t need a developer — you need hangel.',
  s1Description:
    'Build a professional corporate site without writing a single line of code. Pick sections, edit text and visuals, add your logo and colors. No technical knowledge required; a site that presents your organization is ready in minutes.',

  s2Eyebrow: 'Your Domain Is Yours',
  s2Title: 'A free domain or your own address.',
  s2Description:
    'Publish your site instantly with a free domain from hangel, or connect your organization’s own domain. Either way, you go live at a corporate, trustworthy and professional address.',

  s3Eyebrow: 'Always Up to Date',
  s3Title: 'An organization whose site updates itself.',
  s3Description:
    'Your events, donation calls and volunteering listings are connected to the hangel panel; when you update in the panel, your site updates too. Your visitors always reach the latest information, without you having to do it twice.',

  gridEyebrow: 'Capabilities',
  gridTitle: 'What’s inside the website module?',
  gridDescription:
    'Live tools from first setup to publishing, mobile responsiveness to content updates.',

  compare:
    'Worldwide, building a corporate site often means an agency, a monthly fee and technical maintenance. On hangel, it’s code-free, with a free domain, and in one panel.',

  techEyebrow: 'Infrastructure',
  techTitle: 'A no-code editor + a free domain.',
  techDescription:
    'A code-free visual editor, a free domain or your own domain connection, mobile-responsive and search-ready pages, and content that auto-updates via the hangel panel — all in one panel.',

  updatesNote: 'As hangel evolves, this page is updated; new website capabilities appear here as they ship.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Publish your corporate site today.',
  finalSubtitle: 'Applying is free. Domain included, no code required.',
  finalDescription:
    'A brand-specific corporate site, in minutes and free. Register your organization today and become visible online.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'All Features',

  footerLabel: 'Website Management',

  tools: {
    noCode: { title: 'No-Code Editor', description: 'Pick sections and edit text and visuals without a line of code; the site is ready in minutes.' },
    branding: { title: 'Brand-Specific', description: 'Add your logo, colors and corporate identity; make the site look entirely like you.' },
    freeDomain: { title: 'Free Domain', description: 'Publish instantly with a free domain from hangel; no extra cost.' },
    ownDomain: { title: 'Your Own Domain', description: 'Connect your organization’s domain; go live at a professional, trustworthy address.' },
    publish: { title: 'One-Click Publish', description: 'Finish editing, hit publish; your site goes live in seconds.' },
    autoUpdate: { title: 'Auto-Updated Content', description: 'Your event, donation and volunteering content is panel-connected; update once, the site follows.' },
    responsive: { title: 'Mobile Responsive', description: 'Your site looks flawless on phone, tablet and desktop; visitors browse comfortably on any device.' },
    seo: { title: 'Search-Ready', description: 'Your pages suit search engines and AI answers; your organization gets found in search.' },
    events: { title: 'Events Section', description: 'Your upcoming events list automatically on your site; visitors apply directly.' },
    donation: { title: 'Donation Call', description: 'Highlight your donation and support calls on your site; move your supporters to act.' },
    volunteer: { title: 'Volunteering Listings', description: 'Your open volunteering listings appear on your site; new volunteers apply directly.' },
    qr: { title: 'Share via QR', description: 'Share your site anywhere with a profile QR code and link; make access effortless.' },
  },
};

export default function WebSitesiPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const tools: FeatureItem[] = [
    { icon: MousePointerClick, title: C.tools.noCode.title, description: C.tools.noCode.description, badge: { kind: 'hangel' } },
    { icon: Palette, title: C.tools.branding.title, description: C.tools.branding.description },
    { icon: Globe, title: C.tools.freeDomain.title, description: C.tools.freeDomain.description, badge: { kind: 'hangel' } },
    { icon: Link2, title: C.tools.ownDomain.title, description: C.tools.ownDomain.description },
    { icon: Rocket, title: C.tools.publish.title, description: C.tools.publish.description },
    { icon: RefreshCw, title: C.tools.autoUpdate.title, description: C.tools.autoUpdate.description, badge: { kind: 'hangel' } },
    { icon: Smartphone, title: C.tools.responsive.title, description: C.tools.responsive.description },
    { icon: Search, title: C.tools.seo.title, description: C.tools.seo.description },
    { icon: CalendarDays, title: C.tools.events.title, description: C.tools.events.description },
    { icon: HandCoins, title: C.tools.donation.title, description: C.tools.donation.description },
    { icon: HeartHandshake, title: C.tools.volunteer.title, description: C.tools.volunteer.description },
    { icon: QrCode, title: C.tools.qr.title, description: C.tools.qr.description },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
      <MarketingNav label={C.navLabel} ctaLabel={C.navCta} ctaHref={REGISTER_HREF} backLabel={C.back} />

      <AppleSection
        id="hero"
        eyebrow={C.heroEyebrow}
        title={heroTitle}
        subtitle={heroSubtitle}
        description={heroDescription}
        image={{ url: heroImage, hint: 'website builder laptop screen' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#yetenekler', variant: 'link' },
        ]}
      />

      <AppleSection
        id="kodsuz"
        theme="dark"
        eyebrow={C.s1Eyebrow}
        title={C.s1Title}
        description={C.s1Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2400&auto=format&fit=crop', hint: 'no code website editor' }}
      />

      <AppleSection
        id="alanadi"
        eyebrow={C.s2Eyebrow}
        title={C.s2Title}
        description={C.s2Description}
        image={{ url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?q=80&w=2400&auto=format&fit=crop', hint: 'domain address browser' }}
      />

      <AppleSection
        id="guncel"
        theme="dark"
        eyebrow={C.s3Eyebrow}
        title={C.s3Title}
        description={C.s3Description}
        image={{ url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2400&auto=format&fit=crop', hint: 'connected content dashboard' }}
      />

      <section id="yetenekler" className="bg-[#f5f5f7] py-24 border-b border-black/5">
        <SectionHeading eyebrow={C.gridEyebrow} title={C.gridTitle} description={C.gridDescription} />
        <FeatureGrid items={tools} columns={3} />
        <CompareNote>{C.compare}</CompareNote>
      </section>

      <AppleSection
        id="altyapi"
        compact
        eyebrow={C.techEyebrow}
        title={C.techTitle}
        description={C.techDescription}
      />

      <AppleSection
        id="basla"
        theme="dark"
        eyebrow={C.finalEyebrow}
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        actions={[
          { label: C.finalPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.finalSecondary, href: '/features', variant: 'secondary' },
        ]}
      />

      <p className="bg-black text-center text-xs text-white/40 pb-10 -mt-px">{C.updatesNote}</p>

      <PublicFooter currentPageLabel={C.footerLabel} />
    </div>
  );
}
