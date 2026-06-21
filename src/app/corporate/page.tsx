'use client';

/**
 * /corporate — Kamu (belediyeler & bakanlıklar) için "Daha Fazla Bilgi Al".
 * Apple kimliği, tek aksan rengi narçiçeği (#f34723). Üniversite & lise
 * ortaklıkları ikincil bölüm. İçerik inline TR/EN; hero CMS (slug='corporate')
 * üzerinden override edilebilir.
 */

import {
  Users,
  ShieldCheck,
  Coins,
  GraduationCap,
  Lock,
  Handshake,
  Map,
  Building2,
  Banknote,
  BarChart3,
  Scale,
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
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

const SLUG = 'corporate';

const REGISTER_HREF = '/login/selection?action=register&type=corporate';
const PARTNERSHIP_HREF = '/contact/municipalities';
const LEGISLATION_HREF = '/hangelassociation/legislation';

const TR = {
  navLabel: 'Kamu Ortaklıkları',
  navCta: 'Daha Fazla Bilgi Al',
  back: 'Ana Sayfa',

  heroEyebrow: 'Kamu için',
  heroTitle: 'Toplumsal projeleri veriyle yönetin.',
  heroSubtitle: 'Gönüllü, şeffaflık ve sosyal etki; kurumunuz için tek panelde.',
  heroDescription:
    'hangel; belediyeler ve bakanlıklar için gönüllü mobilizasyonunu, şeffaf STK iş birliğini ve sosyal etkinin ölçülmesini bir araya getirir. Uzun vadeli, kanıta dayalı bir kamu-STK altyapısı.',
  heroImage:
    'https://images.unsplash.com/photo-1577086664693-894d8405334a?q=80&w=2071&auto=format&fit=crop',
  heroCtaPrimary: 'Daha Fazla Bilgi Al',
  heroCtaSecondary: 'İşbirliği Kur',

  mobEyebrow: 'Gönüllü Mobilizasyonu',
  mobTitle: 'Acil durumda doğru gönüllü, doğru yerde.',
  mobSubtitle: 'Yetenek, uygunluk ve konumla hazır gönüllü ağı.',
  mobDescription:
    'Kayıtlı gönüllüler yetenek, uygunluk ve konum bilgisiyle tutulur. Afet ve acil durumda kurumunuz, bölgedeki gönüllüleri saatler içinde hızlıca seferber edebilir.',
  mobImage:
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop',

  valueEyebrow: 'Şeffaflık & Mali Değer',
  valueTitle: 'Sosyal faydayı sayılarla görün.',
  valueSubtitle: 'Şeffaflık endeksi ve sosyal etkinin mali değeri yan yana.',
  valueDescription:
    'Bölgedeki STK’ların şeffaflık puanıyla güvenilir partnerler seçin. Gönüllü saatlerinin ve bağışların meslek ve göreve göre mali değerini, etki puanıyla birlikte planlamanıza ve bütçenize dahil edin.',
  valueImage:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',

  liveEyebrow: 'Canlı',
  liveTitle: 'Kamu için bugün hazır.',
  liveDescription:
    'Kurumunuzun bugün kullanabileceği, üretimde çalışan kamu yetenekleri.',

  soonEyebrow: 'Yol Haritası',
  soonTitle: 'Yakında planlamayı derinleştiriyoruz.',
  soonDescription:
    'Geliştirme aşamasındaki ya da yönetim panelinde yakında olarak işaretli kamu yetenekleri.',

  legEyebrow: 'Mevzuat Vizyonu',
  legTitle: 'Sosyal Girişimcilik Mevzuatı Taslağı',
  legDescription:
    'TBMM hedefli bir kanun teklifi taslağı üzerinde çalışıyoruz. Vizyonun bir parçası olarak sosyal ihtiyaçların “kırmızı / turuncu / sarı” kodlarla önceliklendirilmesini öneriyoruz. Bu, bir ürün değil; kamu-STK iş birliği için ortak bir çerçeve önerisidir.',
  legCta: 'Mevzuat taslağını incele',

  secEyebrow: 'Üniversite & Lise Ortaklıkları',
  secTitle: 'Kampüsten başlayan gönüllülük.',
  secSubtitle: 'Öğrenci kulüpleri, etkinlik koordinasyonu ve genç gönüllü ağı.',
  secDescription:
    'Üniversite ve liselerle kurulan ortaklıklarla kampüs gönüllülüğünü, kulüpleri ve etkinlikleri tek yerden koordine edin. Kamu projeleriyle genç gönüllüleri buluşturun.',
  secImage:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
  secCtaPrimary: 'Ortaklık başlat',
  secCtaLink: 'Daha Fazla Bilgi Al',

  compare:
    "Kamu için sosyal projeleri veri, gönüllü ve şeffaflıkla aynı yerde yöneten bütünleşik bir kamu-STK altyapısı; Türkiye'ye özel.",

  finalEyebrow: 'İş Birliği',
  finalTitle: 'Kurumunuzla uzun vadeli bir ortaklık kuralım.',
  finalSubtitle: 'Belediye ve bakanlık iş birlikleri için iletişime geçin.',
  finalDescription:
    'Ekibimiz; gönüllü mobilizasyonu, şeffaf STK iş birliği ve sosyal etki planlaması için kurumunuza özel bir başlangıç planı hazırlasın.',
  finalCtaPrimary: 'İşbirliği Kur',
  finalCtaSecondary: 'Kurum kaydı oluştur',

  footer: 'Kamu Ortaklıkları',
};

const EN = {
  navLabel: 'Public Sector Partnerships',
  navCta: 'Learn More',
  back: 'Home',

  heroEyebrow: 'For the public sector',
  heroTitle: 'Run social programs with data.',
  heroSubtitle: 'Volunteers, transparency and social impact — in one panel for your institution.',
  heroDescription:
    'hangel brings together volunteer mobilization, transparent NGO collaboration and impact measurement for municipalities and ministries. A long-term, evidence-based public–NGO infrastructure.',
  heroImage:
    'https://images.unsplash.com/photo-1577086664693-894d8405334a?q=80&w=2071&auto=format&fit=crop',
  heroCtaPrimary: 'Learn More',
  heroCtaSecondary: 'Start a partnership',

  mobEyebrow: 'Volunteer Mobilization',
  mobTitle: 'In an emergency, the right volunteer in the right place.',
  mobSubtitle: 'A ready volunteer network by skill, availability and location.',
  mobDescription:
    'Registered volunteers are kept with their skills, availability and location. In disasters and emergencies, your institution can mobilize volunteers in the region within hours.',
  mobImage:
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop',

  valueEyebrow: 'Transparency & Financial Value',
  valueTitle: 'See social benefit in numbers.',
  valueSubtitle: 'A transparency index and the financial value of impact, side by side.',
  valueDescription:
    'Choose reliable partners using a transparency score for NGOs in your region. Bring the financial value and impact score of volunteer hours and donations — by profession and role — into your planning and budget.',
  valueImage:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',

  liveEyebrow: 'Live',
  liveTitle: 'Ready for the public sector today.',
  liveDescription:
    'Public-sector capabilities running in production that your institution can use today.',

  soonEyebrow: 'Roadmap',
  soonTitle: 'Deeper planning, coming soon.',
  soonDescription:
    'Public-sector capabilities in development or marked as coming soon in the admin panel.',

  legEyebrow: 'Legislative Vision',
  legTitle: 'Social Entrepreneurship Legislation Draft',
  legDescription:
    'We are working on a draft bill aimed at the Turkish Parliament. As part of the vision, we propose prioritizing social needs with “red / orange / yellow” codes. This is not a product; it is a proposed shared framework for public–NGO collaboration.',
  legCta: 'Review the legislation draft',

  secEyebrow: 'University & High School Partnerships',
  secTitle: 'Volunteering that starts on campus.',
  secSubtitle: 'Student clubs, event coordination and a young volunteer network.',
  secDescription:
    'Coordinate campus volunteering, clubs and events from one place through partnerships with universities and high schools. Connect young volunteers with public programs.',
  secImage:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
  secCtaPrimary: 'Start a partnership',
  secCtaLink: 'Learn More',

  compare:
    'An integrated public–NGO infrastructure that manages social programs together with data, volunteers and transparency — built for Türkiye.',

  finalEyebrow: 'Collaboration',
  finalTitle: 'Let’s build a long-term partnership with your institution.',
  finalSubtitle: 'Get in touch for municipality and ministry collaborations.',
  finalDescription:
    'Let our team prepare a tailored starting plan for volunteer mobilization, transparent NGO collaboration and social impact planning for your institution.',
  finalCtaPrimary: 'Start a partnership',
  finalCtaSecondary: 'Create an institution account',

  footer: 'Public Sector Partnerships',
};

export default function CorporateShowcasePage() {
  const { language } = useTranslation();
  const en = language === 'en';
  const C = en ? EN : TR;
  const cms = useWebPage(SLUG);

  const liveFeatures: FeatureItem[] = en
    ? [
        {
          icon: Users,
          title: 'Volunteer Coordination & Emergency Mobilization',
          description:
            'Registered volunteers held with skill, availability and location, so your municipality can mobilize fast in disasters and emergencies.',
          badge: { kind: 'hangel' },
        },
        {
          icon: ShieldCheck,
          title: 'Transparency Index',
          description:
            'A transparency score for NGOs in your region, helping the public sector choose reliable partners.',
        },
        {
          icon: Coins,
          title: 'Financial Value of Social Impact',
          description:
            'Calculates the financial value and impact score of volunteer hours and donations by profession and role — for budgeting and planning.',
          badge: { kind: 'hangel' },
        },
        {
          icon: GraduationCap,
          title: 'Student Clubs & University / High School Partnerships',
          description: 'Campus volunteering and event coordination across universities and high schools.',
        },
        {
          icon: Lock,
          title: 'KVKK-Compliant Volunteer Verification & Data Protection',
          description: 'Secure vetting and data handling for public-sector partnerships.',
        },
        {
          icon: Handshake,
          title: 'Public Collaboration Portal',
          description: 'Start a partnership through a live contact and application form.',
        },
      ]
    : [
        {
          icon: Users,
          title: 'Gönüllülük Koordinasyonu & Acil Mobilizasyon',
          description:
            'Yetenek, uygunluk ve konum bilgisiyle tutulan kayıtlı gönüllüler; afet ve acil durumda belediyeniz için hızlı mobilizasyon.',
          badge: { kind: 'hangel' },
        },
        {
          icon: ShieldCheck,
          title: 'Şeffaflık Endeksi',
          description:
            'Bölgenizdeki STK’ların şeffaflık puanı; kamu için güvenilir partner seçimi.',
        },
        {
          icon: Coins,
          title: 'Sosyal Etkinin Mali Değeri',
          description:
            'Gönüllü saat ve bağışların meslek ve göreve göre mali değeri ve etki puanı; bütçe ve planlama için.',
          badge: { kind: 'hangel' },
        },
        {
          icon: GraduationCap,
          title: 'Öğrenci Kulüpleri & Üniversite / Lise Partnerlikleri',
          description: 'Kampüs gönüllülüğü ve etkinlik koordinasyonu; üniversite ve liselerle.',
        },
        {
          icon: Lock,
          title: 'KVKK Uyumlu Gönüllü Doğrulama & Veri Koruma',
          description: 'Kamu ortaklığı için güvenli vetting ve veri işleme.',
        },
        {
          icon: Handshake,
          title: 'Kamu İşbirlikleri Portalı',
          description: 'Canlı iletişim ve başvuru formuyla ortaklık başlatma.',
        },
      ];

  const soonFeatures: FeatureItem[] = en
    ? [
        {
          icon: Map,
          title: 'Social Impact Atlas',
          description: 'A map of social needs and solutions by city and district.',
          badge: { kind: 'yakinda' },
        },
        {
          icon: Building2,
          title: 'Event & Venue Sharing',
          description: 'Opening municipality and partner venues to clubs and programs.',
          badge: { kind: 'yakinda' },
        },
        {
          icon: Banknote,
          title: 'Grants & Funds',
          description: 'Discovering grants and funds suitable for institutions.',
          badge: { kind: 'yakinda' },
        },
        {
          icon: BarChart3,
          title: 'Demographics & Social Impact Reporting',
          description: 'Demographic and social-impact reporting for public planning.',
          badge: { kind: 'beta' },
        },
      ]
    : [
        {
          icon: Map,
          title: 'Sosyal Etki Atlası',
          description: 'Şehir ve ilçe bazında sosyal ihtiyaç ve çözüm haritası.',
          badge: { kind: 'yakinda' },
        },
        {
          icon: Building2,
          title: 'Etkinlik & Mekan Paylaşımı',
          description: 'Belediye ve iş ortağı mekanlarının kulüplere ve programlara açılması.',
          badge: { kind: 'yakinda' },
        },
        {
          icon: Banknote,
          title: 'Hibeler & Fonlar',
          description: 'Kurumlara uygun hibe ve fon keşfi.',
          badge: { kind: 'yakinda' },
        },
        {
          icon: BarChart3,
          title: 'Demografi & Sosyal Etki Raporlama',
          description: 'Kamu planlaması için demografi ve sosyal etki raporlaması.',
          badge: { kind: 'beta' },
        },
      ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <MarketingNav
        label={C.navLabel}
        ctaLabel={C.navCta}
        ctaHref={REGISTER_HREF}
        backLabel={C.back}
      />

      {/* Hero — kamu için ortaklık */}
      <AppleSection
        eyebrow={C.heroEyebrow}
        title={cms.title || C.heroTitle}
        subtitle={cms.subtitle || C.heroSubtitle}
        description={cms.description || C.heroDescription}
        image={{ url: cms.heroImageUrl || C.heroImage, hint: 'modern city hall public sector' }}
        actions={[
          { label: C.heroCtaPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroCtaSecondary, href: PARTNERSHIP_HREF, variant: 'link' },
        ]}
      />

      {/* Gönüllü mobilizasyonu slaytı */}
      <AppleSection
        theme="dark"
        eyebrow={C.mobEyebrow}
        title={C.mobTitle}
        subtitle={C.mobSubtitle}
        description={C.mobDescription}
        image={{ url: C.mobImage, hint: 'volunteers coordinating emergency response' }}
        badges={[{ kind: 'hangel' }]}
      />

      {/* Şeffaflık & mali değer slaytı */}
      <AppleSection
        eyebrow={C.valueEyebrow}
        title={C.valueTitle}
        subtitle={C.valueSubtitle}
        description={C.valueDescription}
        image={{ url: C.valueImage, hint: 'data dashboard analytics planning' }}
        badges={[{ kind: 'hangel' }]}
      />

      {/* Canlı kamu özellikleri */}
      <AppleSection compact theme="light">
        <SectionHeading
          eyebrow={C.liveEyebrow}
          title={C.liveTitle}
          description={C.liveDescription}
        />
        <FeatureGrid items={liveFeatures} columns={3} />
        <CompareNote>{C.compare}</CompareNote>
      </AppleSection>

      {/* Yakında / Beta */}
      <AppleSection compact theme="dark">
        <SectionHeading
          theme="dark"
          eyebrow={C.soonEyebrow}
          title={C.soonTitle}
          description={C.soonDescription}
        />
        <FeatureGrid items={soonFeatures} columns={2} theme="dark" />
      </AppleSection>

      {/* Mevzuat güven bloğu */}
      <AppleSection
        compact
        eyebrow={C.legEyebrow}
        title={C.legTitle}
        description={C.legDescription}
        actions={[{ label: C.legCta, href: LEGISLATION_HREF, variant: 'link' }]}
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <Scale className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
        </div>
      </AppleSection>

      {/* Üniversite & lise — ikincil bölüm */}
      <AppleSection
        id="universiteler"
        theme="dark"
        eyebrow={C.secEyebrow}
        title={C.secTitle}
        subtitle={C.secSubtitle}
        description={C.secDescription}
        image={{ url: C.secImage, hint: 'university students collaborating' }}
        actions={[
          { label: C.secCtaPrimary, href: PARTNERSHIP_HREF, variant: 'secondary' },
          { label: C.secCtaLink, href: REGISTER_HREF, variant: 'link' },
        ]}
      />

      {/* Final CTA — İşbirliği Kur */}
      <AppleSection
        eyebrow={C.finalEyebrow}
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        actions={[
          { label: C.finalCtaPrimary, href: PARTNERSHIP_HREF, variant: 'primary' },
          { label: C.finalCtaSecondary, href: REGISTER_HREF, variant: 'secondary' },
        ]}
      />

      <PublicFooter currentPageLabel={C.footer} />
    </div>
  );
}
