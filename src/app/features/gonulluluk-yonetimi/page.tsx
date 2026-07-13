'use client';

/**
 * /features/gonulluluk-yonetimi — Gönüllülük İlan Yönetimi tanıtım sayfası.
 *
 * İki dilli (TR birincil, EN ayna). Tüm yapı '@/components/marketing/apple-kit'
 * bileşenleriyle kurulur. Marka kuralı: kullanıcıya görünen her yerde küçük
 * harf "hangel".
 */

import React from 'react';
import {
  HeartHandshake,
  Percent,
  ListChecks,
  UserCog,
  Timer,
  TrendingUp,
  IdCard,
  FileSpreadsheet,
  Copy,
  MapPinned,
  Award,
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

const SLUG = 'feature-gonulluluk-yonetimi';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Özellikler',

  heroEyebrow: 'Gönüllülük İlan Yönetimi',
  heroTitle: 'Doğru gönüllü, doğru göreve — otomatik olarak.',
  heroSubtitle: 'İlan yayınlayın, uyum eşleştirmesini hangel yapsın, etkiyi rakamla kanıtlayın.',
  heroDescription:
    'hangel ile yetenek bazlı gönüllülük ilanları açın. Her gönüllüye otomatik yüzde uyum eşleştirmesi yapılır; başvuruları tek ekrandan toplu yönetir, koordinatör atar ve gönüllü saatlerini sosyal etkiye dönüştürürsünüz. Emeği görünür, etkiyi ölçülebilir kılın.',
  heroImage:
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Yetenekleri Gör',

  s1Eyebrow: 'Akıllı Eşleştirme',
  s1Title: 'Her başvuruda bir yüzde: kim ne kadar uygun?',
  s1Description:
    'İlanınızda aradığınız yetenekleri belirleyin; hangel her gönüllünün profiliyle karşılaştırıp otomatik bir uyum yüzdesi hesaplar. Yüzlerce başvuru arasından en uygun gönüllüleri bir bakışta görür, saatler yerine saniyeler içinde karar verirsiniz.',

  s2Eyebrow: 'Başvuru Operasyonu',
  s2Title: 'Yüzlerce başvuru, tek ekranda kontrol.',
  s2Description:
    'Onay kutularıyla yüzlerce başvuruyu aynı anda onaylayın ya da reddedin. Her başvuranın tam gönüllü profilini görün, KVKK-uyumlu biçimde telefon veya e-postayla tek dokunuşla ulaşın, ekibinize koordinatör atayın ve listeyi CSV/Excel olarak dışa aktarın.',

  s3Eyebrow: 'Saat & Etki',
  s3Title: 'Gönüllü saatlerini kanıta dönüştürün.',
  s3Description:
    'Gönüllü başına saatleri ve ürettiğiniz sosyal etki değerini (TL) izleyin. SROI-hazır raporlarla bağışçılarınıza, kamuya ve fon sağlayıcılara yarattığınız değeri sayısal olarak gösterin. Başvuru analitiğiyle hangi ilanın işe yaradığını canlı görün.',

  gridEyebrow: 'Yetenekler',
  gridTitle: 'Gönüllülük modülünün içinde neler var?',
  gridDescription:
    'İlan açmaktan etki raporlamaya kadar tüm gönüllü yolculuğu için yayında olan araçlar.',

  compare:
    'Dünyada gönüllü eşleştirme ve etki raporlama araçları çoğu zaman ayrı, karmaşık ve ücretlidir. hangel’de hepsi Türkiye’ye özel, ücretsiz ve tek panelde.',

  techEyebrow: 'Altyapı',
  techTitle: 'Profil verisi, uyum motoru, etki hesabı.',
  techDescription:
    'Yetenek ve ilgi verisinden beslenen yüzde uyum motoru, KVKK-uyumlu iletişim akışı, saat kaydı ve sosyal getiri (SROI) hesabı — hepsi tek panelde birbirine bağlı çalışır.',

  updatesNote: 'hangel geliştikçe bu sayfa güncellenir; yeni gönüllülük yetenekleri geldikçe burada yer alır.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'İlk gönüllülük ilanınızı bugün açın.',
  finalSubtitle: 'Başvuru ücretsiz. Kurulum dakikalar sürer.',
  finalDescription:
    'Yetenek bazlı ilanla doğru gönüllüyü bulun, etkinizi rakamla kanıtlayın. Kurumunuzu bugün kaydedin, gönüllü gücünüzü büyütmeye başlayın.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Tüm Özellikler',

  footerLabel: 'Gönüllülük Yönetimi',

  tools: {
    listing: { title: 'Yetenek Bazlı İlan', description: 'Aradığınız yetenekleri belirterek gönüllülük ilanı açın; ihtiyaca göre kontenjan ve konum tanımlayın.' },
    match: { title: 'Yüzde Uyum Eşleştirme', description: 'hangel her gönüllüye otomatik bir uyum yüzdesi hesaplar; en uygun adayları bir bakışta görürsünüz.' },
    bulkApprove: { title: 'Toplu Onay', description: 'Onay kutularıyla yüzlerce başvuruyu aynı anda onaylayın ya da reddedin; süreç dakikalar yerine saniyeler.' },
    profile: { title: 'Tam Profil & İletişim', description: 'Her başvuranın tam gönüllü profilini görün; telefon veya e-postayla tek dokunuşla, KVKK-uyumlu ulaşın.' },
    coordinator: { title: 'Koordinatör Atama', description: 'Ekip üyelerinize Gönüllü Koordinatörü rolü verin; ilanları ve başvuruları paylaştırarak yükü dağıtın.' },
    hours: { title: 'Saat Takibi', description: 'Gönüllü başına harcanan saatleri kaydedin ve izleyin; katkıyı somut biçimde belgeleyin.' },
    impact: { title: 'Sosyal Etki (SROI)', description: 'Ürettiğiniz sosyal etki değerini (TL) hesaplayın; SROI-hazır raporlarla değeri kanıtlayın.' },
    analytics: { title: 'Başvuru Analitiği', description: 'İlan bazında başvuru grafiği ve dönüşüm mini-grafikleriyle hangi ilanın işe yaradığını canlı görün.' },
    export: { title: 'CSV / Excel Dışa Aktarım', description: 'Başvuranları ve gönüllü listenizi tek tıkla CSV/Excel olarak dışa aktarın; raporlamaya hazır.' },
    duplicate: { title: 'İlan Kopyalama', description: 'Bir gönüllülük ilanını tek dokunuşla çoğaltın; kopyayı düzenleyip anında yayınlayın.' },
    multiLocation: { title: 'Çok Noktalı İlanlar', description: 'Tek gönüllülüğe birden fazla konum ekleyin; her noktanın kendi QR kodu ve başvuru butonu olur.' },
    certificate: { title: 'Sertifika & Rozet', description: 'Gönüllülerinize kurumunuzun logosuyla otomatik katılım sertifikaları ve rozetler üretin; sadakati ödüllendirin.' },
  },
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Features',

  heroEyebrow: 'Volunteer Listing Management',
  heroTitle: 'The right volunteer for the right role — automatically.',
  heroSubtitle: 'Post a listing, let hangel do the matching, prove impact in numbers.',
  heroDescription:
    'With hangel, open skill-based volunteering listings. Each volunteer gets an automatic percentage match; you manage applications in bulk from one screen, assign coordinators and turn volunteer hours into social impact. Make effort visible and impact measurable.',
  heroImage:
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'See Capabilities',

  s1Eyebrow: 'Smart Matching',
  s1Title: 'A percentage on every application: who fits, how much?',
  s1Description:
    'Define the skills you’re looking for in your listing; hangel compares each volunteer’s profile and computes an automatic match percentage. Spot the most suitable volunteers among hundreds of applications at a glance and decide in seconds, not hours.',

  s2Eyebrow: 'Application Operations',
  s2Title: 'Hundreds of applications, controlled from one screen.',
  s2Description:
    'Approve or reject hundreds of applications at once with checkboxes. See each applicant’s full volunteer profile, reach them by phone or email in one tap in a KVKK-compliant way, assign a coordinator from your team, and export the list to CSV/Excel.',

  s3Eyebrow: 'Hours & Impact',
  s3Title: 'Turn volunteer hours into proof.',
  s3Description:
    'Track hours per volunteer and the social impact value (TRY) you generate. With SROI-ready reports, show donors, the public and funders the value you create in numbers. With application analytics, see live which listing is actually working.',

  gridEyebrow: 'Capabilities',
  gridTitle: 'What’s inside the volunteering module?',
  gridDescription:
    'Live tools for the entire volunteer journey, from opening a listing to reporting impact.',

  compare:
    'Worldwide, volunteer matching and impact reporting tools are often separate, complex and paid. On hangel, they are all tailored to Türkiye, free, and in a single panel.',

  techEyebrow: 'Infrastructure',
  techTitle: 'Profile data, a match engine, an impact calculation.',
  techDescription:
    'A percentage match engine fed by skill and interest data, a KVKK-compliant contact flow, hour logging and a social return (SROI) calculation — all working connected in one panel.',

  updatesNote: 'As hangel evolves, this page is updated; new volunteering capabilities appear here as they ship.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Open your first volunteering listing today.',
  finalSubtitle: 'Applying is free. Setup takes minutes.',
  finalDescription:
    'Find the right volunteer with a skill-based listing and prove your impact in numbers. Register your organization today and start growing your volunteer power.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'All Features',

  footerLabel: 'Volunteer Management',

  tools: {
    listing: { title: 'Skill-Based Listing', description: 'Open a volunteering listing by stating the skills you seek; define capacity and location as needed.' },
    match: { title: 'Percentage Match', description: 'hangel computes an automatic match percentage for each volunteer; you see the best candidates at a glance.' },
    bulkApprove: { title: 'Bulk Approval', description: 'Approve or reject hundreds of applications at once with checkboxes; seconds instead of minutes.' },
    profile: { title: 'Full Profile & Contact', description: 'See each applicant’s full volunteer profile; reach them by phone or email in one tap, KVKK-compliant.' },
    coordinator: { title: 'Coordinator Assignment', description: 'Give team members the Volunteer Coordinator role; share out listings and applications to spread the load.' },
    hours: { title: 'Hour Tracking', description: 'Record and track hours spent per volunteer; document the contribution concretely.' },
    impact: { title: 'Social Impact (SROI)', description: 'Calculate the social impact value (TRY) you generate; prove it with SROI-ready reports.' },
    analytics: { title: 'Application Analytics', description: 'See live which listing works with per-listing application charts and conversion mini-charts.' },
    export: { title: 'CSV / Excel Export', description: 'Export applicants and your volunteer list to CSV/Excel in one click; ready for reporting.' },
    duplicate: { title: 'Duplicate Listing', description: 'Duplicate a volunteering listing in one tap; edit and publish the copy instantly.' },
    multiLocation: { title: 'Multi-Location Listings', description: 'Add multiple locations to a single listing; each point gets its own QR code and apply button.' },
    certificate: { title: 'Certificates & Badges', description: 'Generate automatic participation certificates and badges with your logo; reward loyalty.' },
  },
};

export default function GonullulukYonetimiPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const tools: FeatureItem[] = [
    { icon: HeartHandshake, title: C.tools.listing.title, description: C.tools.listing.description },
    { icon: Percent, title: C.tools.match.title, description: C.tools.match.description, badge: { kind: 'hangel' } },
    { icon: ListChecks, title: C.tools.bulkApprove.title, description: C.tools.bulkApprove.description, badge: { kind: 'yeni' } },
    { icon: IdCard, title: C.tools.profile.title, description: C.tools.profile.description, badge: { kind: 'yeni' } },
    { icon: UserCog, title: C.tools.coordinator.title, description: C.tools.coordinator.description },
    { icon: Timer, title: C.tools.hours.title, description: C.tools.hours.description, badge: { kind: 'yeni' } },
    { icon: TrendingUp, title: C.tools.impact.title, description: C.tools.impact.description, badge: { kind: 'hangel' } },
    { icon: TrendingUp, title: C.tools.analytics.title, description: C.tools.analytics.description, badge: { kind: 'yeni' } },
    { icon: FileSpreadsheet, title: C.tools.export.title, description: C.tools.export.description },
    { icon: Copy, title: C.tools.duplicate.title, description: C.tools.duplicate.description },
    { icon: MapPinned, title: C.tools.multiLocation.title, description: C.tools.multiLocation.description, badge: { kind: 'yeni' } },
    { icon: Award, title: C.tools.certificate.title, description: C.tools.certificate.description, badge: { kind: 'hangel' } },
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
        image={{ url: heroImage, hint: 'volunteers working together' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#yetenekler', variant: 'link' },
        ]}
      />

      <AppleSection
        id="eslestirme"
        theme="dark"
        eyebrow={C.s1Eyebrow}
        title={C.s1Title}
        description={C.s1Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2400&auto=format&fit=crop', hint: 'matching profiles dashboard' }}
      />

      <AppleSection
        id="operasyon"
        eyebrow={C.s2Eyebrow}
        title={C.s2Title}
        description={C.s2Description}
        image={{ url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2400&auto=format&fit=crop', hint: 'team reviewing applications' }}
      />

      <AppleSection
        id="etki"
        theme="dark"
        eyebrow={C.s3Eyebrow}
        title={C.s3Title}
        description={C.s3Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1543286386-2e659306cd6c?q=80&w=2400&auto=format&fit=crop', hint: 'impact report charts' }}
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
