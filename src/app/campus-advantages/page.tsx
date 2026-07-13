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
import Link from 'next/link';
import {
  LayoutGrid,
  CalendarDays,
  BarChart3,
  UserPlus,
  QrCode,
  Globe,
  Eye,
  Award,
  HeartHandshake,
  Sparkles,
  Trophy,
  ScanLine,
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
  navLabel: 'hangel Kampüs',
  navCta: 'Ücretsiz Başla',
  back: 'Ana sayfa',

  heroEyebrow: 'hangel Kampüs',
  heroTitle: 'Kampüste başlar, dünyayı değiştirir.',
  heroSubtitle: 'Kulübünün enerjisini gerçek etkiye dönüştür.',
  heroDescription:
    'hangel; öğrenciler ve kampüs kulüpleri için ücretsiz bir etki platformudur. Etkinlik ve gönüllülük ilanları oluştur, QR/NFC ile yoklama al, otomatik sertifika ver, etki puanını biriktir. Yok öyle yalnız başına mücadele etmek — toplumsal sorunlar için birlikte çalışıyoruz. 🧡',
  heroImage:
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başla',
  heroLink: 'Daha Fazla',

  // Bireysel öğrenci değeri (gönüllülük + CV)
  studentEyebrow: 'Öğrenci İçin',
  studentTitle: 'Gönüllülük artık CV’nde sayılıyor.',
  studentDescription:
    'Katıldığın her etkinlik ve gönüllülük ilanı etki puanına dönüşür; QR/NFC ile kampüste check-in yap, bittiğinde otomatik sertifikanı al. Streak (günlük seri), rozetler, Etki Haritan ve lider tablosuyla emeğin görünür olsun — staj ve burs başvurularında anlatacak bir hikayen olsun.',
  studentBadge: { kind: 'hangel' as const },

  panelEyebrow: 'Dijital Yönetim Paneli',
  panelTitle: 'Kulübünün her şeyi, tek bir yerde.',
  panelDescription:
    'Profil, üyeler, QR, gelen kutusu, bildirimler, gönderiler ve etki hikayen; hepsi tek bir panelde ve tamamen ücretsiz. Dağınık tablolar ve grup sohbetleri yerine, kulübünü tek ekrandan yönet.',
  panelImage:
    'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2400&auto=format&fit=crop',

  karneEyebrow: 'Etki Hikayemiz',
  karneTitle: 'Kulübünün etkisini anlatan bir karne.',
  karneDescription:
    'Sosyal Etki Karnesi, kulübünün hikayesini slaytlarla anlatır: üye sayısı, etkinlik ve gönüllülük istatistikleri, gönüllü saatleri. Yaptığınız işi tek bakışta gösterilebilir, paylaşılabilir bir karneye dönüştür.',
  karneBadge: { kind: 'hangel' as const },

  eventsEyebrow: 'Etkinlik & Gönüllülük',
  eventsTitle: 'Oluştur, yayınla, doldur.',
  eventsDescription:
    'Kulüp etkinliğini ve gönüllülük ilanını dakikalar içinde oluşturup yayınla. Başvuru ve katılım topla, kapasite belirle; otomatik canlı mod ve geri sayımla gün gelince akış kendiliğinden başlasın. Katılımcılar takvime ekleyebilir (.ics) ve Apple Wallet biletini cebinde taşıyabilir.',
  eventsBadge: { kind: 'yeni' as const },

  firstsEyebrow: 'Bir İlk',
  firstsTitle: 'Kampüs kulüpleri için Türkiye’de bir ilk.',
  firstsDescription:
    'hangel; öğrenci kulüplerine ücretsiz dijital yönetim ile bir kampüs etki ağını birleştiren Türkiye’deki ilk platformdur. Etkinlik, gönüllülük, QR/NFC yoklama, otomatik sertifika ve etki puanı tek panelde. Kulübün, tüm kampüsün gördüğü canlı bir etki ağının parçası olur — yalnız değil, birlikte.',
  firstsBadge: { kind: 'hangel' as const },

  certEyebrow: 'Sertifika & Rozet',
  certTitle: 'Her katkı, bir belgeyle ödüllensin.',
  certDescription:
    'Etkinlik veya gönüllülük bittiğinde katılımcılar kulübünüzün adıyla otomatik sertifika kazanır — staj ve burs başvurularında gösterilebilir gerçek bir kanıt. Kulübün ise etki puanı biriktikçe rozetler ve Sosyal Etki Karnesiyle görünürlük kazanır. Emek, artık somut bir belgeye dönüşür.',
  certBadge: { kind: 'hangel' as const },

  securityEyebrow: 'Güvenlik & Teknoloji',
  securityTitle: 'Verileriniz güvende.',
  securityDescription:
    'hangel, KVKK-uyumlu veri işleme ilkeleriyle çalışır; kulüp ve üye verileriniz Google Cloud ve Firebase üzerinde şifreli saklanır. Rol-bazlı yetkilendirmeyle Kulüp Başkanı ve Genel Yönetici gibi roller yalnızca kendi kapsamını görür; giriş çift-yönlü doğrulamayla korunur. Güven, altyapının kendisidir.',

  evolveEyebrow: 'Sürekli Gelişim',
  evolveTitle: 'hangel sürekli gelişiyor.',
  evolveDescription:
    'Yeni özellikler siz hiçbir şey yapmadan panelinize düşer — güncelleme, kurulum ya da ek ücret yok. Öğrenci geri bildirimleriyle şekillenen yol haritası her hafta büyür; kulübün her zaman en güncel araçlarla çalışır.',
  evolveBadge: { kind: 'yeni' as const },

  toolsEyebrow: 'Canlı Araçlar',
  toolsTitle: 'Kulübünü büyütmek için her şey hazır.',
  toolsDescription:
    'Bugün hesabını açtığında kullanmaya başlayabileceğin, gerçek ve çalışan araçlar — hepsi ücretsiz.',

  betaSoonEyebrow: 'Yolda',
  betaSoonTitle: 'Daha fazlası geliyor.',
  betaSoonDescription:
    'Bazı özellikler kademeli açılıyor, bazıları yol haritasında. Açık ve dürüst olalım: aşağıdakiler henüz herkes için tam açık değil.',

  compareNote:
    "Kampüs kulüpleri için böyle bütünleşik bir araç seti çoğu yerde yok; hangel'de hepsi tek panelde ve ücretsiz.",

  ctaTitle: 'Kulübünün etkisi bugün başlasın.',
  ctaDescription:
    'Birkaç dakikada hesabını aç, kulübünü dijitalleştir ve kampüsteki hikayeni anlatmaya başla. Tamamen ücretsiz. #wearehangel',
  ctaPrimary: 'Ücretsiz Başla',

  footerLabel: 'Kampüs Avantajları',

  // Canlı araçlar
  liveEventsTitle: 'Etkinlik & Gönüllülük İlanları',
  liveEventsDesc:
    'Etkinlik ve gönüllülük ilanı oluştur, yayınla; başvuru/katılım topla, kapasite belirle. Canlı mod ve geri sayım otomatik.',
  liveCheckinTitle: 'QR / NFC Check-in',
  liveCheckinDesc:
    'Kampüste katılımcıları QR veya NFC ile saniyeler içinde yokla; kimin geldiğini anlık gör.',
  liveCertTitle: 'Otomatik Sertifika & Değerlendirme',
  liveCertDesc:
    'Etkinlik veya gönüllülük bitince katılımcıya otomatik sertifika; katkıyı puanla, geri bildirim topla.',
  liveImpactTitle: 'Etki Puanı & Lider Tablosu',
  liveImpactDesc:
    'Her katılım etki puanına dönüşür; streak, rozet ve lider tablosuyla kulüp topluluğunu canlı tut.',
  liveKarneTitle: 'Sosyal Etki Karnesi',
  liveKarneDesc:
    'Slaytlık etki karnesi: üye sayısı, etkinlik ve gönüllülük istatistikleri, gönüllü saatleri.',
  liveDemografiTitle: 'Demografi & Topluluk Analizi',
  liveDemografiDesc:
    'Üyelerinin şehir, okul, yetenek ve ilgi dağılımını gör; kulübünün etki puanını izle.',
  liveInviteTitle: 'Topluluğunu Davet Et & Rol Yönetimi',
  liveInviteDesc:
    'Üyelerini davet et, Kulüp Başkanı ve Genel Yönetici gibi rolleri tanımla.',
  liveQrTitle: 'Kulüp QR & Profil',
  liveQrDesc:
    'Kulübüne özel QR kod ile üye kazan, profilini paylaş; gelen kutusu ve bildirim merkezini tek yerden takip et.',

  // Beta / Yakında
  webTitle: 'Ücretsiz Kulüp Web Sitesi',
  webDesc:
    'Markana özel, içeriğin değiştikçe otomatik güncellenen bir web sitesi (*.hangel.org). Erişim kademeli olarak açılıyor.',
  webBadge: { kind: 'beta' as const },
  visibilityTitle: 'Görünürlük & Reklam Desteği',
  visibilityDesc:
    'Etkinlik ve gönderilerini öne çıkararak daha fazla kişiye ulaşma desteği. Yol haritasında, yakında.',
  visibilityBadge: { kind: 'yakinda' as const },
};

/* ----------------------------- EN içerik ----------------------------- */

const EN: typeof TR = {
  navLabel: 'hangel Campus',
  navCta: 'Start Free',
  back: 'Home',

  heroEyebrow: 'hangel Campus',
  heroTitle: 'Starts on campus, changes the world.',
  heroSubtitle: "Turn your club's energy into real impact.",
  heroDescription:
    "hangel is a free impact platform for students and campus clubs. Create event and volunteering listings, take attendance with QR/NFC, issue automatic certificates and earn impact points. You don't have to fight alone — we work together for social causes. 🧡",
  heroImage:
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Start Free',
  heroLink: 'Learn More',

  studentEyebrow: 'For Students',
  studentTitle: 'Volunteering now counts on your CV.',
  studentDescription:
    'Every event and volunteering listing you join turns into impact points; check in on campus with QR/NFC and get your certificate automatically when it ends. With streaks, badges, your Impact Map and the leaderboard, your effort becomes visible — so you have a real story to tell in internship and scholarship applications.',
  studentBadge: { kind: 'hangel' as const },

  panelEyebrow: 'Digital Management Panel',
  panelTitle: 'Everything about your club, in one place.',
  panelDescription:
    'Profile, members, QR, inbox, notifications, posts and your impact story; all in a single panel and completely free. Instead of scattered spreadsheets and group chats, run your club from one screen.',
  panelImage:
    'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2400&auto=format&fit=crop',

  karneEyebrow: 'Our Impact Story',
  karneTitle: "A scorecard that tells your club's impact.",
  karneDescription:
    "The Social Impact Scorecard tells your club's story in slides: member count, event and volunteering statistics, volunteer hours. Turn your work into a shareable scorecard you can show at a glance.",
  karneBadge: { kind: 'hangel' as const },

  eventsEyebrow: 'Events & Volunteering',
  eventsTitle: 'Create, publish, fill it up.',
  eventsDescription:
    'Create and publish your club event or volunteering listing in minutes. Collect applications and attendance, set capacity; with automatic live mode and a countdown, the flow starts on its own when the day arrives. Attendees can add it to their calendar (.ics) and carry an Apple Wallet ticket in their pocket.',
  eventsBadge: { kind: 'yeni' as const },

  firstsEyebrow: 'A First',
  firstsTitle: 'A first in Türkiye for campus clubs.',
  firstsDescription:
    'hangel is the first platform in Türkiye to combine free digital management for student clubs with a campus impact network. Events, volunteering, QR/NFC attendance, automatic certificates and impact points, all in one panel. Your club becomes part of a live impact network the whole campus can see — not alone, but together.',
  firstsBadge: { kind: 'hangel' as const },

  certEyebrow: 'Certificate & Badge',
  certTitle: 'Let every contribution be rewarded with a certificate.',
  certDescription:
    'When an event or volunteering ends, attendees earn an automatic certificate in your club’s name — real proof they can show in internship and scholarship applications. As your club’s impact points build up, it gains visibility with badges and the Social Impact Scorecard. Effort now turns into a concrete document.',
  certBadge: { kind: 'hangel' as const },

  securityEyebrow: 'Security & Technology',
  securityTitle: 'Your data is safe.',
  securityDescription:
    'hangel runs on KVKK-compliant data-processing principles; your club and member data is stored encrypted on Google Cloud and Firebase. With role-based authorization, roles like Club President and General Manager see only their own scope; sign-in is protected by two-factor authentication. Trust is the infrastructure itself.',

  evolveEyebrow: 'Continuous Improvement',
  evolveTitle: 'hangel keeps getting better.',
  evolveDescription:
    'New features land in your panel with nothing for you to do — no updates, no installs, no extra cost. Shaped by student feedback, the roadmap grows every week, so your club always works with the most current tools.',
  evolveBadge: { kind: 'yeni' as const },

  toolsEyebrow: 'Live Tools',
  toolsTitle: 'Everything you need to grow your club.',
  toolsDescription:
    'Real, working tools you can start using the moment you open your account today — all free.',

  betaSoonEyebrow: 'On the Way',
  betaSoonTitle: 'More is coming.',
  betaSoonDescription:
    "Some features are rolling out gradually, others are on the roadmap. Let's be clear and honest: the items below aren't fully open to everyone yet.",

  compareNote:
    "An integrated toolset like this for campus clubs is hard to find anywhere; on hangel it's all in one panel and free.",

  ctaTitle: "Let your club's impact start today.",
  ctaDescription:
    'Open your account in minutes, digitize your club and start telling your story on campus. Completely free. #wearehangel',
  ctaPrimary: 'Start Free',

  footerLabel: 'Campus Advantages',

  liveEventsTitle: 'Event & Volunteering Listings',
  liveEventsDesc:
    'Create and publish events and volunteering listings; collect applications/attendance and set capacity. Live mode and countdown are automatic.',
  liveCheckinTitle: 'QR / NFC Check-in',
  liveCheckinDesc:
    'Take attendance on campus with QR or NFC in seconds; see who showed up in real time.',
  liveCertTitle: 'Automatic Certificate & Evaluation',
  liveCertDesc:
    'When an event or volunteering ends, attendees get an automatic certificate; score the contribution and collect feedback.',
  liveImpactTitle: 'Impact Points & Leaderboard',
  liveImpactDesc:
    'Every participation turns into impact points; keep the club community alive with streaks, badges and a leaderboard.',
  liveKarneTitle: 'Social Impact Scorecard',
  liveKarneDesc:
    'A slide-based impact scorecard: member count, event and volunteering statistics, volunteer hours.',
  liveDemografiTitle: 'Demographics & Community Analysis',
  liveDemografiDesc:
    "See your members' distribution by city, school, talent and interest; track your club's impact score.",
  liveInviteTitle: 'Invite Your Community & Role Management',
  liveInviteDesc:
    'Invite your members and define roles such as Club President and General Manager.',
  liveQrTitle: 'Club QR & Profile',
  liveQrDesc:
    'Gain members with a club-specific QR code and share your profile; track your inbox and notification center in one place.',

  webTitle: 'Free Club Website',
  webDesc:
    'A brand-specific website that updates automatically as your content changes (*.hangel.org). Access is rolling out gradually.',
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
    {
      icon: CalendarDays,
      title: C.liveEventsTitle,
      description: C.liveEventsDesc,
      badge: C.eventsBadge,
    },
    { icon: ScanLine, title: C.liveCheckinTitle, description: C.liveCheckinDesc },
    { icon: Award, title: C.liveCertTitle, description: C.liveCertDesc },
    { icon: Trophy, title: C.liveImpactTitle, description: C.liveImpactDesc },
    {
      icon: BarChart3,
      title: C.liveKarneTitle,
      description: C.liveKarneDesc,
      badge: C.karneBadge,
    },
    { icon: LayoutGrid, title: C.liveDemografiTitle, description: C.liveDemografiDesc },
    { icon: UserPlus, title: C.liveInviteTitle, description: C.liveInviteDesc },
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

      {/* Statement: Öğrenci için — gönüllülük CV değeri */}
      <AppleSection
        eyebrow={C.studentEyebrow}
        title={C.studentTitle}
        description={C.studentDescription}
        badges={[C.studentBadge]}
        actions={[
          { label: 'Gönüllülüğü Keşfet', href: '/volunteering', variant: 'link' },
        ]}
        theme="dark"
      />

      {/* Statement: Dijital Yönetim Paneli */}
      <AppleSection
        eyebrow={C.panelEyebrow}
        title={C.panelTitle}
        description={C.panelDescription}
        image={{ url: C.panelImage, hint: 'club dashboard panel' }}
        theme="light"
      />

      {/* Statement: Etki Karnesi (Sadece hangel'da) */}
      <AppleSection
        eyebrow={C.karneEyebrow}
        title={C.karneTitle}
        description={C.karneDescription}
        badges={[C.karneBadge]}
        theme="dark"
      />

      {/* Statement: Etkinlikler & Gönüllülük (Yeni) */}
      <AppleSection
        eyebrow={C.eventsEyebrow}
        title={C.eventsTitle}
        description={C.eventsDescription}
        badges={[C.eventsBadge]}
        actions={[{ label: 'Etkinlikleri Gör', href: '/events', variant: 'link' }]}
        theme="light"
      />

      {/* Statement: İlkler */}
      <AppleSection
        id="ilkler"
        eyebrow={C.firstsEyebrow}
        title={C.firstsTitle}
        description={C.firstsDescription}
        badges={[C.firstsBadge]}
        image={{ url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2400&auto=format&fit=crop', hint: 'students celebrating graduation together' }}
        theme="dark"
      />

      {/* Statement: Sertifika & Rozet */}
      <AppleSection
        eyebrow={C.certEyebrow}
        title={C.certTitle}
        description={C.certDescription}
        badges={[C.certBadge]}
        image={{ url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=2400&auto=format&fit=crop', hint: 'student holding certificate award' }}
        theme="light"
      />

      {/* Canlı araçlar */}
      <section id="araclar" className="bg-muted pt-20 pb-16 border-b border-border">
        <SectionHeading
          eyebrow={C.toolsEyebrow}
          title={C.toolsTitle}
          description={C.toolsDescription}
        />
        <FeatureGrid items={liveTools} columns={4} />

        {/* Kampüs topluluğu için keşif bağlantıları */}
        <div className="mx-auto max-w-4xl px-6 mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/volunteering"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 min-h-[44px] shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <HeartHandshake className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-foreground">Gönüllülük İlanları</span>
          </Link>
          <Link
            href="/library"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 min-h-[44px] shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-foreground">Veri Kütüphanesi</span>
          </Link>
          <Link
            href="/events"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 min-h-[44px] shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-foreground">Etkinlik Akışı</span>
          </Link>
        </div>

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

      {/* Statement: Güvenlik & Teknoloji */}
      <AppleSection
        id="guvenlik"
        eyebrow={C.securityEyebrow}
        title={C.securityTitle}
        description={C.securityDescription}
        image={{ url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2400&auto=format&fit=crop', hint: 'secure encrypted data infrastructure' }}
        theme="light"
      />

      {/* Statement: Sürekli Gelişim */}
      <AppleSection
        eyebrow={C.evolveEyebrow}
        title={C.evolveTitle}
        description={C.evolveDescription}
        badges={[C.evolveBadge]}
        image={{ url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2400&auto=format&fit=crop', hint: 'students building software growth' }}
        theme="dark"
      />

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
