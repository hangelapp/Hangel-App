'use client';

/**
 * /campus-advantages — Üniversite/lise kulüp başkanları için "Daha Fazla Bilgi Al"
 * tanıtım sayfası.
 *
 * Apple marka kimliği, tek aksan rengi narçiçeği (#f34723). Tüm yapı
 * '@/components/marketing/apple-kit' bileşenleriyle kurulur. İçerik iki dilli
 * (TR birincil, EN ayna); rozetler özelliğin gerçek durumunu yansıtır.
 *
 * Yalnızca gerçek, canlı (veya işaretli beta/yakında) özellikler anlatılır.
 */

import React from 'react';
import {
  LayoutGrid,
  CalendarDays,
  BarChart3,
  Megaphone,
  UserPlus,
  Inbox,
  QrCode,
  Globe,
  Eye,
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

const SLUG = 'campus-advantages';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=CLUB';

/* ----------------------------- TR içerik ----------------------------- */

const TR = {
  navLabel: 'hangel Kulüpler',
  navCta: 'Ücretsiz Başla',
  back: 'Ana sayfa',

  heroEyebrow: 'hangel Kulüpler',
  heroTitle: 'Kampüste başlar, dünyayı değiştirir.',
  heroSubtitle: 'Kulübünüzün enerjisini gerçek etkiye dönüştürün.',
  heroDescription:
    'hangel, üniversite ve lise kulüpleri için bütünleşik bir yönetim platformudur. Üyelerinizi, etkinliklerinizi ve etki hikayenizi tek bir panelden yönetin; kampüsteki gücünüzü görünür kılın.',
  heroImage:
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başla',
  heroLink: 'Daha Fazla',

  panelEyebrow: 'Dijital Yönetim Paneli',
  panelTitle: 'Kulübünüzün her şeyi, tek bir yerde.',
  panelDescription:
    'Profil, üyeler, QR, gelen kutusu, bildirimler, gönderiler ve etki hikayeniz; hepsi tek bir panelde. Dağınık tablolar ve grup sohbetleri yerine, kulübünüzü tek ekrandan yönetin.',
  panelImage:
    'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2400&auto=format&fit=crop',

  karneEyebrow: 'Etki Hikayemiz',
  karneTitle: 'Kulübünüzün etkisini anlatan bir karne.',
  karneDescription:
    'Sosyal Etki Karnesi, kulübünüzün hikayesini 7 slaytta anlatır: üye sayısı, etkinlik ve gönderi istatistikleri, gönüllü saatleri. Yaptığınız işi tek bakışta gösterilebilir, paylaşılabilir bir karneye dönüştürün.',
  karneBadge: { kind: 'hangel' as const },

  eventsEyebrow: 'Etkinlik Yönetimi',
  eventsTitle: 'Etkinliğinizi oluşturun, yayınlayın, doldurun.',
  eventsDescription:
    'Kulüp etkinliğinizi dakikalar içinde oluşturup yayınlayın. Kayıt ve RSVP toplayın, kapasite belirleyin; kimlerin geleceğini baştan görün. Söyleşiden atölyeye, her etkinlik tek akışta.',
  eventsBadge: { kind: 'yeni' as const },

  toolsEyebrow: 'Canlı Araçlar',
  toolsTitle: 'Kulübünüzü büyütmek için her şey hazır.',
  toolsDescription:
    'Bugün hesabınızı açtığınızda kullanmaya başlayabileceğiniz, gerçek ve çalışan araçlar.',

  betaSoonEyebrow: 'Yolda',
  betaSoonTitle: 'Daha fazlası geliyor.',
  betaSoonDescription:
    'Bazı özellikler kademeli açılıyor, bazıları yol haritasında. Açık ve dürüst olalım: aşağıdakiler henüz herkes için tam açık değil.',

  compareNote:
    "Kampüs kulüpleri için böyle bütünleşik bir araç seti çoğu yerde yok; hangel'de hepsi tek panelde ve ücretsiz.",

  ctaTitle: 'Kulübünüzün etkisi bugün başlasın.',
  ctaDescription:
    'Birkaç dakikada hesabınızı açın, kulübünüzü dijitalleştirin ve kampüsteki hikayenizi anlatmaya başlayın. Tamamen ücretsiz.',
  ctaPrimary: 'Ücretsiz Başla',

  footerLabel: 'Kulüp Avantajları',

  // Canlı araçlar
  liveDijitalTitle: 'Dijital Yönetim Paneli',
  liveDijitalDesc:
    'Profil, üyeler, QR, gelen kutusu, bildirimler, gönderiler ve etki hikayeniz tek panelde toplanır.',
  liveKarneTitle: 'Sosyal Etki Karnesi',
  liveKarneDesc:
    '7 slaytlık etki karnesi: üye sayısı, etkinlik ve gönderi istatistikleri, gönüllü saatleri.',
  liveEventsTitle: 'Etkinlik Yönetimi',
  liveEventsDesc:
    'Kulüp etkinliği oluşturun ve yayınlayın; kayıt/RSVP toplayın, kapasite belirleyin.',
  liveDemografiTitle: 'Demografi Analizi',
  liveDemografiDesc:
    'Üyelerinizin şehir, okul, yetenek ve ilgi dağılımını görün; kulübünüzün etki puanını izleyin.',
  livePostsTitle: 'Gönderiler',
  livePostsDesc:
    'Haber ve duyurularınızı yayınlayın; gönderileriniz toplulukta görünür hale gelir.',
  liveInviteTitle: 'Topluluğunu Davet Et & Rol Yönetimi',
  liveInviteDesc:
    'Üyelerinizi davet edin, Kulüp Başkanı ve Genel Yönetici gibi rolleri tanımlayın.',
  liveInboxTitle: 'Gelen Kutusu & Bildirim Merkezi',
  liveInboxDesc:
    'Mesajlarınızı ve bildirimlerinizi tek yerden takip edin; hiçbir gelişmeyi kaçırmayın.',
  liveQrTitle: 'Yetkili Yönetimi & Kulüp QR',
  liveQrDesc:
    'Yetkililerinizi yönetin; kulübünüze özel QR kod ile üye kazanın ve profilinizi paylaşın.',

  // Beta / Yakında
  webTitle: 'Ücretsiz Kulüp Web Sitesi',
  webDesc:
    'Markanıza özel, içeriğiniz değiştikçe otomatik güncellenen bir web sitesi. Erişim kademeli olarak açılıyor.',
  webBadge: { kind: 'beta' as const },
  visibilityTitle: 'Görünürlük & Reklam Desteği',
  visibilityDesc:
    'Etkinlik ve gönderilerinizi öne çıkararak daha fazla kişiye ulaşma desteği. Yol haritasında, yakında.',
  visibilityBadge: { kind: 'yakinda' as const },
};

/* ----------------------------- EN içerik ----------------------------- */

const EN: typeof TR = {
  navLabel: 'hangel Clubs',
  navCta: 'Start Free',
  back: 'Home',

  heroEyebrow: 'hangel Clubs',
  heroTitle: 'Starts on campus, changes the world.',
  heroSubtitle: "Turn your club's energy into real impact.",
  heroDescription:
    'hangel is an integrated management platform for university and high-school clubs. Manage your members, events and impact story from a single panel; make your presence on campus visible.',
  heroImage:
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Start Free',
  heroLink: 'Learn More',

  panelEyebrow: 'Digital Management Panel',
  panelTitle: 'Everything about your club, in one place.',
  panelDescription:
    'Profile, members, QR, inbox, notifications, posts and your impact story; all in a single panel. Instead of scattered spreadsheets and group chats, run your club from one screen.',
  panelImage:
    'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2400&auto=format&fit=crop',

  karneEyebrow: 'Our Impact Story',
  karneTitle: "A scorecard that tells your club's impact.",
  karneDescription:
    "The Social Impact Scorecard tells your club's story in 7 slides: member count, event and post statistics, volunteer hours. Turn your work into a shareable scorecard you can show at a glance.",
  karneBadge: { kind: 'hangel' as const },

  eventsEyebrow: 'Event Management',
  eventsTitle: 'Create your event, publish it, fill it up.',
  eventsDescription:
    "Create and publish your club's event in minutes. Collect registrations and RSVPs, set capacity, and see who's coming in advance. From talks to workshops, every event in one flow.",
  eventsBadge: { kind: 'yeni' as const },

  toolsEyebrow: 'Live Tools',
  toolsTitle: 'Everything you need to grow your club.',
  toolsDescription:
    'Real, working tools you can start using the moment you open your account today.',

  betaSoonEyebrow: 'On the Way',
  betaSoonTitle: 'More is coming.',
  betaSoonDescription:
    "Some features are rolling out gradually, others are on the roadmap. Let's be clear and honest: the items below aren't fully open to everyone yet.",

  compareNote:
    "An integrated toolset like this for campus clubs is hard to find anywhere; on hangel it's all in one panel and free.",

  ctaTitle: "Let your club's impact start today.",
  ctaDescription:
    'Open your account in minutes, digitize your club and start telling your story on campus. Completely free.',
  ctaPrimary: 'Start Free',

  footerLabel: 'Club Advantages',

  liveDijitalTitle: 'Digital Management Panel',
  liveDijitalDesc:
    'Profile, members, QR, inbox, notifications, posts and your impact story, gathered in one panel.',
  liveKarneTitle: 'Social Impact Scorecard',
  liveKarneDesc:
    'A 7-slide impact scorecard: member count, event and post statistics, volunteer hours.',
  liveEventsTitle: 'Event Management',
  liveEventsDesc:
    'Create and publish club events; collect registrations/RSVPs and set capacity.',
  liveDemografiTitle: 'Demographic Analysis',
  liveDemografiDesc:
    "See your members' distribution by city, school, talent and interest; track your club's impact score.",
  livePostsTitle: 'Posts',
  livePostsDesc:
    'Publish your news and announcements; your posts become visible across the community.',
  liveInviteTitle: 'Invite Your Community & Role Management',
  liveInviteDesc:
    'Invite your members and define roles such as Club President and General Manager.',
  liveInboxTitle: 'Inbox & Notification Center',
  liveInboxDesc:
    'Track your messages and notifications in one place; never miss an update.',
  liveQrTitle: 'Authority Management & Club QR',
  liveQrDesc:
    'Manage your authorities; gain members and share your profile with a club-specific QR code.',

  webTitle: 'Free Club Website',
  webDesc:
    'A brand-specific website that updates automatically as your content changes. Access is rolling out gradually.',
  webBadge: { kind: 'beta' as const },
  visibilityTitle: 'Visibility & Promotion Support',
  visibilityDesc:
    'Support for reaching more people by featuring your events and posts. On the roadmap, coming soon.',
  visibilityBadge: { kind: 'yakinda' as const },
};

/* ----------------------------- Sayfa ----------------------------- */

export default function CampusAdvantagesPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const liveTools: FeatureItem[] = [
    { icon: LayoutGrid, title: C.liveDijitalTitle, description: C.liveDijitalDesc },
    {
      icon: BarChart3,
      title: C.liveKarneTitle,
      description: C.liveKarneDesc,
      badge: C.karneBadge,
    },
    {
      icon: CalendarDays,
      title: C.liveEventsTitle,
      description: C.liveEventsDesc,
      badge: C.eventsBadge,
    },
    { icon: BarChart3, title: C.liveDemografiTitle, description: C.liveDemografiDesc },
    { icon: Megaphone, title: C.livePostsTitle, description: C.livePostsDesc },
    { icon: UserPlus, title: C.liveInviteTitle, description: C.liveInviteDesc },
    { icon: Inbox, title: C.liveInboxTitle, description: C.liveInboxDesc },
    { icon: QrCode, title: C.liveQrTitle, description: C.liveQrDesc },
  ];

  const soonTools: FeatureItem[] = [
    { icon: Globe, title: C.webTitle, description: C.webDesc, badge: C.webBadge },
    {
      icon: Eye,
      title: C.visibilityTitle,
      description: C.visibilityDesc,
      badge: C.visibilityBadge,
    },
  ];

  return (
    <div className="bg-background font-sans selection:bg-primary/30">
      <MarketingNav
        label={C.navLabel}
        ctaLabel={C.navCta}
        ctaHref={REGISTER_HREF}
        backLabel={C.back}
      />

      {/* Hero */}
      <AppleSection
        eyebrow={C.heroEyebrow}
        title={heroTitle}
        subtitle={heroSubtitle}
        description={heroDescription}
        image={{ url: heroImage, hint: 'campus club students' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#araclar', variant: 'link' },
        ]}
        theme="light"
      />

      {/* Statement: Dijital Yönetim Paneli */}
      <AppleSection
        eyebrow={C.panelEyebrow}
        title={C.panelTitle}
        description={C.panelDescription}
        image={{ url: C.panelImage, hint: 'club dashboard panel' }}
        theme="dark"
      />

      {/* Statement: Etki Karnesi (Sadece hangel'da) */}
      <AppleSection
        eyebrow={C.karneEyebrow}
        title={C.karneTitle}
        description={C.karneDescription}
        badges={[C.karneBadge]}
        theme="light"
      />

      {/* Statement: Etkinlikler (Yeni) */}
      <AppleSection
        eyebrow={C.eventsEyebrow}
        title={C.eventsTitle}
        description={C.eventsDescription}
        badges={[C.eventsBadge]}
        theme="dark"
      />

      {/* Canlı araçlar */}
      <section id="araclar" className="bg-muted pt-20 pb-16 border-b border-border">
        <SectionHeading
          eyebrow={C.toolsEyebrow}
          title={C.toolsTitle}
          description={C.toolsDescription}
        />
        <FeatureGrid items={liveTools} columns={4} />
        <CompareNote>{C.compareNote}</CompareNote>
      </section>

      {/* Beta / Yakında */}
      <section className="bg-background pt-20 pb-16 border-b border-border">
        <SectionHeading
          eyebrow={C.betaSoonEyebrow}
          title={C.betaSoonTitle}
          description={C.betaSoonDescription}
        />
        <FeatureGrid items={soonTools} columns={2} />
      </section>

      {/* Final CTA */}
      <AppleSection
        title={C.ctaTitle}
        description={C.ctaDescription}
        actions={[{ label: C.ctaPrimary, href: REGISTER_HREF, variant: 'primary' }]}
        theme="dark"
      />

      <PublicFooter currentPageLabel={C.footerLabel} />
    </div>
  );
}
