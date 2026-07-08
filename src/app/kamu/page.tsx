'use client';

/**
 * /kamu — Kamu İşbirlikleri. Üniversiteler, belediyeler, il/ilçe milli eğitim
 * müdürlükleri ve bakanlıklar için hangel protokolü, kullanım ve avantajlar.
 * Apple/iOS kimliği, tek aksan rengi narçiçeği (#f34723), koyu tema güvenli
 * token'lar. apple-kit bileşenleriyle /corporate ile tutarlı; STK sayfası
 * (/corporate) ayrı kalır — bu sayfa KAMU kurumlarına özeldir.
 */

import {
  Landmark,
  GraduationCap,
  Building2,
  ShieldCheck,
  UsersRound,
  CalendarHeart,
  BarChart3,
  Award,
  FileSignature,
  Globe,
} from 'lucide-react';
import {
  MarketingNav,
  AppleSection,
  SectionHeading,
  FeatureGrid,
  type FeatureItem,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { useTranslation } from '@/components/providers/language-provider';

/** Kamu kurumu iletişim/başvuru — mevcut kurumsal iletişim akışına bağlanır. */
const CONTACT_HREF = '/contact';
const PROTOCOL_HREF = '/contact?subject=kamu-protokol';
const VOLUNTEERING_HREF = '/volunteering';
const EVENTS_HREF = '/events';

const TR = {
  navLabel: 'Kamu İşbirlikleri',
  navCta: 'Protokol Başvurusu',
  back: 'Ana Sayfa',

  heroEyebrow: 'Üniversite · Belediye · Milli Eğitim · Bakanlık',
  heroTitle: 'Kamuyla birlikte, toplum için.',
  heroSubtitle: 'Kurumunuzun sosyal etkisini hangel protokolüyle ölçülebilir kılın.',
  heroDescription:
    'hangel; üniversiteler, belediyeler, il/ilçe milli eğitim müdürlükleri ve bakanlıklar için gönüllülük seferberliği, etkinlik yönetimi, şeffaf raporlama ve vatandaş katılımını tek çatıda toplar. Protokol imzalayın, kurumunuzun tüm sosyal fayda faaliyetlerini ölçülebilir ve raporlanabilir hâle getirin — tamamen ücretsiz. 🧡',
  heroImage:
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop',
  heroCtaPrimary: 'Protokol Başvurusu',
  heroCtaSecondary: 'Nasıl çalışır?',

  protocolEyebrow: 'hangel Protokolü',
  protocolTitle: 'Kurumsal işbirliği, tek imzayla.',
  protocolSubtitle: 'Protokol çerçevesinde kurumunuza özel panel ve raporlama açılır.',
  protocolDescription:
    'hangel Protokolü; kamu kurumunuzun gönüllülük programlarını, öğrenci/personel katılımını, sosyal sorumluluk projelerini ve etkinliklerini hangel altyapısı üzerinden yürütmenizi sağlar. İmzalanan protokol ile kurumunuza özel yönetim paneli, resmi raporlama ve şeffaflık göstergeleri açılır. Kurulum ücreti yok, abonelik yok.',
  protocolImage:
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop',
  protocolBadge: 'Ücretsiz Protokol',

  reachEyebrow: 'Vatandaş & Öğrenci Katılımı',
  reachTitle: 'Toplumu harekete geçirin.',
  reachSubtitle: 'Gönüllülük çağrıları, etkinlikler ve seferberlikler tek panelden.',
  reachDescription:
    'Belediyeniz için mahalle bazlı gönüllülük seferberlikleri, üniversiteniz için öğrenci topluluk etkinlikleri, milli eğitim için okul temelli sosyal projeler — hepsini hangel üzerinden ilan edin, katılımı yönetin, sertifikalandırın.',
  reachImage:
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2069&auto=format&fit=crop',

  reportEyebrow: 'Şeffaf Raporlama',
  reportTitle: 'Etkiyi ölçün, kamuoyuyla paylaşın.',
  reportSubtitle: 'Her faaliyetin katılım, saat ve etki verisi otomatik raporlanır.',
  reportDescription:
    'Kurumunuzun tüm sosyal fayda faaliyetleri — gönüllü saati, katılımcı sayısı, ulaşılan kişi, üretilen değer — otomatik toplanır ve Apple standardında raporlara dönüşür. Sayıştay/denetim ve kamuoyu bilgilendirmesi için şeffaf, indirilebilir çıktılar.',
  reportImage:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',

  gridEyebrow: 'Kamu Kurumlarına Özel',
  gridTitle: 'Kurumunuza ne sunuyoruz?',
  gridDescription:
    'Üniversite, belediye, milli eğitim ve bakanlıklar için hangel altyapısının kamuya açılan yetenekleri.',

  finalEyebrow: 'Başlayalım',
  finalTitle: 'Protokolü birlikte kuralım.',
  finalSubtitle: 'Kurumunuza özel bir görüşme ayarlayalım.',
  finalDescription:
    'hangel Protokolü kapsamında kurumunuza özel panel, eğitim ve destek sağlıyoruz. İletişime geçin, ihtiyaçlarınıza göre birlikte kurgulayalım.',
  finalCtaPrimary: 'Protokol Başvurusu',
  finalCtaSecondary: 'İletişime Geç',

  footer: 'Kamu İşbirlikleri',
};

const EN = {
  navLabel: 'Public Partnerships',
  navCta: 'Apply for Protocol',
  back: 'Home',
  heroEyebrow: 'Universities · Municipalities · Education · Ministries',
  heroTitle: 'With the public sector, for society.',
  heroSubtitle: 'Make your institution’s social impact measurable via the hangel protocol.',
  heroDescription:
    'hangel brings volunteering mobilization, event management, transparent reporting and citizen participation into one place for universities, municipalities, provincial education directorates and ministries. Sign the protocol and make all your social-good activities measurable and reportable — completely free. 🧡',
  heroImage: TR.heroImage,
  heroCtaPrimary: 'Apply for Protocol',
  heroCtaSecondary: 'How it works',
  protocolEyebrow: 'The hangel Protocol',
  protocolTitle: 'Institutional partnership, one signature.',
  protocolSubtitle: 'A dedicated panel and reporting open up under the protocol.',
  protocolDescription:
    'The hangel Protocol lets your public institution run volunteering programs, student/staff participation, CSR projects and events on hangel’s infrastructure. The signed protocol unlocks a dedicated admin panel, official reporting and transparency indicators. No setup fee, no subscription.',
  protocolImage: TR.protocolImage,
  protocolBadge: 'Free Protocol',
  reachEyebrow: 'Citizen & Student Participation',
  reachTitle: 'Mobilize your community.',
  reachSubtitle: 'Volunteering calls, events and campaigns from one panel.',
  reachDescription:
    'Neighborhood-based volunteering drives for your municipality, student club events for your university, school-based social projects for education — publish them all on hangel, manage participation, issue certificates.',
  reachImage: TR.reachImage,
  reportEyebrow: 'Transparent Reporting',
  reportTitle: 'Measure impact, share with the public.',
  reportSubtitle: 'Participation, hours and impact of every activity auto-reported.',
  reportDescription:
    'All your social-good activities — volunteer hours, participants, people reached, value created — are collected automatically and turned into Apple-grade reports. Transparent, downloadable outputs for audit and public disclosure.',
  reportImage: TR.reportImage,
  gridEyebrow: 'Built for Public Institutions',
  gridTitle: 'What we offer your institution',
  gridDescription:
    'The public-facing capabilities of hangel infrastructure for universities, municipalities, education and ministries.',
  finalEyebrow: 'Let’s start',
  finalTitle: 'Let’s build the protocol together.',
  finalSubtitle: 'Let’s arrange a dedicated call for your institution.',
  finalDescription:
    'Under the hangel Protocol we provide a dedicated panel, training and support. Get in touch and let’s tailor it to your needs.',
  finalCtaPrimary: 'Apply for Protocol',
  finalCtaSecondary: 'Contact us',
  footer: 'Public Partnerships',
};

export default function KamuPage() {
  const { language } = useTranslation();
  const en = language === 'en';
  const C = en ? EN : TR;

  const gridFeatures: FeatureItem[] = en
    ? [
        { icon: GraduationCap, title: 'For Universities', description: 'Student club events, volunteering hours, community projects and certificates in one panel.' },
        { icon: Building2, title: 'For Municipalities', description: 'Neighborhood volunteering drives, citizen participation and local social projects.' },
        { icon: Landmark, title: 'For Ministries & Directorates', description: 'Nationwide programs, school-based projects and consolidated impact reporting.' },
        { icon: UsersRound, title: 'Participation Management', description: 'Manage volunteers, staff and students; roles, teams and attendance.', badge: { kind: 'hangel' } },
        { icon: CalendarHeart, title: 'Events & Volunteering', description: 'Live mode, countdown, QR/NFC check-in and evaluation for every activity.' },
        { icon: BarChart3, title: 'Transparent Reports', description: 'Auto-generated impact reports for audit and public disclosure.' },
        { icon: Award, title: 'Certificates', description: 'Automatic, redesigned certificates for participants and volunteers.' },
        { icon: ShieldCheck, title: 'Verified & Transparent', description: 'Official verification badge and a public transparency score.', badge: { kind: 'hangel' } },
        { icon: Globe, title: 'Your Own Portal', description: 'Publish your institution’s own page on a hangel address, ready to share.' },
      ]
    : [
        { icon: GraduationCap, title: 'Üniversiteler İçin', description: 'Öğrenci topluluk etkinlikleri, gönüllülük saatleri, topluluk projeleri ve sertifikalar tek panelde.' },
        { icon: Building2, title: 'Belediyeler İçin', description: 'Mahalle bazlı gönüllülük seferberlikleri, vatandaş katılımı ve yerel sosyal projeler.' },
        { icon: Landmark, title: 'Bakanlık & Müdürlükler İçin', description: 'Ülke geneli programlar, okul temelli projeler ve konsolide etki raporlaması.' },
        { icon: UsersRound, title: 'Katılım Yönetimi', description: 'Gönüllü, personel ve öğrencileri yönetin; rol, ekip ve katılım takibi.', badge: { kind: 'hangel' } },
        { icon: CalendarHeart, title: 'Etkinlik & Gönüllülük', description: 'Her faaliyet için canlı mod, geri sayım, QR/NFC check-in ve değerlendirme.' },
        { icon: BarChart3, title: 'Şeffaf Raporlar', description: 'Denetim ve kamuoyu bilgilendirmesi için otomatik üretilen etki raporları.' },
        { icon: Award, title: 'Sertifikalar', description: 'Katılımcı ve gönüllüler için otomatik, yeniden tasarlanmış sertifikalar.' },
        { icon: ShieldCheck, title: 'Doğrulanmış & Şeffaf', description: 'Resmi doğrulama tiki ve kamuya açık şeffaflık skoru.', badge: { kind: 'hangel' } },
        { icon: Globe, title: 'Kendi Portalınız', description: 'Kurumunuzun kendi sayfasını hangel adresinde yayınlayın; paylaşmaya hazır.' },
      ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <MarketingNav
        label={C.navLabel}
        ctaLabel={C.navCta}
        ctaHref={PROTOCOL_HREF}
        backLabel={C.back}
      />

      {/* Hero — kamu için değer önermesi */}
      <AppleSection
        eyebrow={C.heroEyebrow}
        title={C.heroTitle}
        subtitle={C.heroSubtitle}
        description={C.heroDescription}
        image={{ url: C.heroImage, hint: 'government public institution civic collaboration' }}
        actions={[
          { label: C.heroCtaPrimary, href: PROTOCOL_HREF, variant: 'primary' },
          { label: C.heroCtaSecondary, href: '#protokol', variant: 'link' },
        ]}
      />

      {/* hangel Protokolü */}
      <AppleSection
        id="protokol"
        theme="dark"
        eyebrow={C.protocolEyebrow}
        title={C.protocolTitle}
        subtitle={C.protocolSubtitle}
        description={C.protocolDescription}
        image={{ url: C.protocolImage, hint: 'signing agreement official protocol handshake' }}
        badges={[{ kind: 'hangel', label: C.protocolBadge }]}
        actions={[{ label: C.heroCtaPrimary, href: PROTOCOL_HREF, variant: 'secondary' }]}
      />

      {/* Vatandaş & öğrenci katılımı */}
      <AppleSection
        eyebrow={C.reachEyebrow}
        title={C.reachTitle}
        subtitle={C.reachSubtitle}
        description={C.reachDescription}
        image={{ url: C.reachImage, hint: 'volunteers students community gathering' }}
        actions={[
          { label: en ? 'See volunteering' : 'Gönüllülüğü gör', href: VOLUNTEERING_HREF, variant: 'link' },
          { label: en ? 'See events' : 'Etkinlikleri gör', href: EVENTS_HREF, variant: 'link' },
        ]}
      />

      {/* Şeffaf raporlama */}
      <AppleSection
        theme="dark"
        eyebrow={C.reportEyebrow}
        title={C.reportTitle}
        subtitle={C.reportSubtitle}
        description={C.reportDescription}
        image={{ url: C.reportImage, hint: 'analytics report dashboard transparency data' }}
      />

      {/* Kamu kurumlarına özel yetenekler ızgarası */}
      <AppleSection compact theme="light">
        <SectionHeading
          eyebrow={C.gridEyebrow}
          title={C.gridTitle}
          description={C.gridDescription}
        />
        <FeatureGrid items={gridFeatures} columns={3} />
      </AppleSection>

      {/* Final CTA — protokol başvurusu */}
      <AppleSection
        eyebrow={C.finalEyebrow}
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        actions={[
          { label: C.finalCtaPrimary, href: PROTOCOL_HREF, variant: 'primary' },
          { label: C.finalCtaSecondary, href: CONTACT_HREF, variant: 'secondary' },
        ]}
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <FileSignature className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
        </div>
      </AppleSection>

      <PublicFooter currentPageLabel={C.footer} />
    </div>
  );
}
