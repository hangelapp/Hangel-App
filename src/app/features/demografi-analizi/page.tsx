'use client';

/**
 * /features/demografi-analizi — Demografi Analizi tanıtım sayfası.
 *
 * İki dilli (TR birincil, EN ayna). Tüm yapı '@/components/marketing/apple-kit'
 * bileşenleriyle kurulur. Marka kuralı: kullanıcıya görünen her yerde küçük
 * harf "hangel".
 */

import React from 'react';
import {
  BarChart3,
  PieChart,
  LineChart,
  Users,
  MapPin,
  Briefcase,
  Heart,
  TrendingUp,
  Filter,
  CalendarClock,
  UserCheck,
  ClipboardList,
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

const SLUG = 'feature-demografi-analizi';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Özellikler',

  heroEyebrow: 'Demografi Analizi',
  heroTitle: 'Destekçilerinizi tanıyın, kararlarınızı veriyle alın.',
  heroSubtitle: 'Yaş, şehir, meslek ve ilgi dağılımı — hepsi canlı grafiklerle.',
  heroDescription:
    'hangel Demografi Analizi ile destekçi tabanınızın yaş, şehir, meslek ve ilgi dağılımını canlı grafiklerle görün. Kimlere ulaştığınızı ve kimlere ulaşamadığınızı net biçimde anlayın; kampanyalarınızı doğru kitleye yönlendirin, kaynağınızı verimli kullanın ve etkinizi büyütün.',
  heroImage:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Yetenekleri Gör',

  s1Eyebrow: 'Canlı Grafikler',
  s1Title: 'Tablolar değil, tek bakışta anlaşılan grafikler.',
  s1Description:
    'Karmaşık verilerle boğuşmayın. Destekçi tabanınız; yaş grupları, şehir dağılımı, meslek ve ilgi alanları canlı, güncel grafiklerle önünüze gelir. Panel her yenilendiğinde tablolar da güncellenir; kararlarınız her zaman en taze veriye dayanır.',

  s2Eyebrow: 'Doğru Kitle',
  s2Title: 'Herkese değil, doğru kişilere ulaşın.',
  s2Description:
    'Destekçilerinizin nerede yoğunlaştığını, hangi yaş ve meslek gruplarının size yakın olduğunu görün. Bu içgörülerle toplu mesajlaşma, etkinlik ve gönüllülük çağrılarınızı doğru kitleye yönlendirin; kaynağınızı ziyan etmeden en yüksek etkiyi elde edin.',

  s3Eyebrow: 'Büyüme İçgörüsü',
  s3Title: 'Nerede güçlüsünüz, nerede büyüyebilirsiniz?',
  s3Description:
    'Hangi şehirde güçlü olduğunuzu, hangi grupların size henüz uzak olduğunu görün. Boşlukları fark edin, yeni bölgelere ve topluluklara açılın. Demografi analizi yalnızca bugününüzü değil, büyüme stratejinizi de aydınlatır.',

  gridEyebrow: 'Yetenekler',
  gridTitle: 'Demografi analizi modülünün içinde neler var?',
  gridDescription:
    'Destekçi tabanınızı her açıdan anlamanızı sağlayan, yayında olan canlı analiz araçları.',

  compare:
    'Dünyada gelişmiş kitle analizi araçları çoğu zaman pahalı, ayrı ve teknik ekip ister. hangel’de bu, Türkiye’ye özel, ücretsiz ve tek panelde canlı.',

  techEyebrow: 'Altyapı',
  techTitle: 'Canlı grafikler, gerçek zamanlı veri.',
  techDescription:
    'Yaş, şehir, meslek ve ilgi kırılımlarını gösteren canlı grafikler, panelle senkron güncellenen veri ve diğer modüllere (toplu mesaj, etkinlik, gönüllülük) doğrudan bağlanan içgörüler — hepsi tek panelde çalışır.',

  updatesNote: 'hangel geliştikçe bu sayfa güncellenir; yeni analiz yetenekleri geldikçe burada yer alır.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'Destekçilerinizi bugün tanımaya başlayın.',
  finalSubtitle: 'Başvuru ücretsiz. Grafikleriniz ilk günden canlı.',
  finalDescription:
    'Verinin ışığında karar verin, doğru kitleye ulaşın, etkinizi büyütün. Kurumunuzu bugün kaydedin, destekçi tabanınızı yakından tanıyın.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Tüm Özellikler',

  footerLabel: 'Demografi Analizi',

  tools: {
    age: { title: 'Yaş Dağılımı', description: 'Destekçilerinizin yaş gruplarına göre dağılımını canlı grafiklerle görün; hangi kuşağa yakınsınız?' },
    city: { title: 'Şehir Dağılımı', description: 'Destekçilerinizin coğrafi yoğunluğunu görün; hangi şehirlerde güçlü, nerede zayıfsınız?' },
    profession: { title: 'Meslek Dağılımı', description: 'Destekçi tabanınızın meslek kırılımını inceleyin; yetenek bazlı çağrılarınızı hedefleyin.' },
    interests: { title: 'İlgi Alanları', description: 'Destekçilerinizin ilgilerini görün; içerik ve kampanyalarınızı onların diliyle kurun.' },
    live: { title: 'Canlı Grafikler', description: 'Tüm dağılımlar canlı ve güncel grafiklerle sunulur; panel yenilendikçe tablolar tazelenir.' },
    charts: { title: 'Görsel Panolar', description: 'Pasta, çubuk ve çizgi grafiklerle veri tek bakışta anlaşılır; rapor hazırlamak dakikalar.' },
    trends: { title: 'Zaman İçinde Eğilim', description: 'Destekçi tabanınızın zaman içindeki değişimini izleyin; büyümenizi ve dönüşümünüzü görün.' },
    segment: { title: 'Kitle Segmentleri', description: 'İçgörüleri toplu mesajlaşmaya bağlayın; doğru segmente doğru mesajı gönderin.' },
    targeting: { title: 'Doğru Kitle Hedefleme', description: 'Etkinlik ve gönüllülük çağrılarınızı en uygun demografiye yönlendirin; etkiyi artırın.' },
    growth: { title: 'Büyüme İçgörüsü', description: 'Boşlukları ve fırsatları görün; yeni bölge ve topluluklara açılma stratejinizi kurun.' },
    engagement: { title: 'Katılım Anlayışı', description: 'Hangi grupların daha aktif olduğunu anlayın; kaynağınızı en çok karşılık aldığınız yere ayırın.' },
    reports: { title: 'Rapora Hazır', description: 'Demografik içgörüleri yönetim kurulu ve fon sağlayıcılar için rapora dönüştürün.' },
  },
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Features',

  heroEyebrow: 'Demographic Analysis',
  heroTitle: 'Know your supporters, decide with data.',
  heroSubtitle: 'Age, city, profession and interest distribution — all in live charts.',
  heroDescription:
    'With hangel Demographic Analysis, see your supporter base’s age, city, profession and interest distribution in live charts. Clearly understand who you reach and who you don’t; steer your campaigns to the right audience, use your resources efficiently and grow your impact.',
  heroImage:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'See Capabilities',

  s1Eyebrow: 'Live Charts',
  s1Title: 'Not tables — charts you grasp at a glance.',
  s1Description:
    'Don’t wrestle with complex data. Your supporter base — age groups, city distribution, professions and interests — comes to you in live, up-to-date charts. Every time the panel refreshes, the charts update too; your decisions always rest on the freshest data.',

  s2Eyebrow: 'The Right Audience',
  s2Title: 'Reach the right people, not everyone.',
  s2Description:
    'See where your supporters concentrate and which age and profession groups are close to you. With these insights, steer your bulk messaging, event and volunteering calls to the right audience; achieve the highest impact without wasting your resources.',

  s3Eyebrow: 'Growth Insight',
  s3Title: 'Where are you strong, where can you grow?',
  s3Description:
    'See which city you’re strong in and which groups are still distant. Spot the gaps, open up to new regions and communities. Demographic analysis lights up not just your present, but your growth strategy too.',

  gridEyebrow: 'Capabilities',
  gridTitle: 'What’s inside the demographic analysis module?',
  gridDescription:
    'Live analysis tools that let you understand your supporter base from every angle.',

  compare:
    'Worldwide, advanced audience analysis tools are often expensive, separate and require a technical team. On hangel, this is tailored to Türkiye, free, and live in one panel.',

  techEyebrow: 'Infrastructure',
  techTitle: 'Live charts, real-time data.',
  techDescription:
    'Live charts showing age, city, profession and interest breakdowns, data that updates in sync with the panel, and insights that connect directly to other modules (bulk messaging, events, volunteering) — all in one panel.',

  updatesNote: 'As hangel evolves, this page is updated; new analysis capabilities appear here as they ship.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Start getting to know your supporters today.',
  finalSubtitle: 'Applying is free. Your charts are live from day one.',
  finalDescription:
    'Decide in the light of data, reach the right audience, grow your impact. Register your organization today and get to know your supporter base closely.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'All Features',

  footerLabel: 'Demographic Analysis',

  tools: {
    age: { title: 'Age Distribution', description: 'See your supporters’ distribution by age group in live charts; which generation are you close to?' },
    city: { title: 'City Distribution', description: 'See your supporters’ geographic concentration; where are you strong, where weak?' },
    profession: { title: 'Profession Distribution', description: 'Examine your supporter base’s profession breakdown; target your skill-based calls.' },
    interests: { title: 'Interests', description: 'See your supporters’ interests; build your content and campaigns in their language.' },
    live: { title: 'Live Charts', description: 'All distributions are shown in live, up-to-date charts; as the panel refreshes, so do the charts.' },
    charts: { title: 'Visual Dashboards', description: 'Data is grasped at a glance with pie, bar and line charts; preparing a report takes minutes.' },
    trends: { title: 'Trends Over Time', description: 'Track how your supporter base changes over time; see your growth and transformation.' },
    segment: { title: 'Audience Segments', description: 'Connect insights to bulk messaging; send the right message to the right segment.' },
    targeting: { title: 'Right-Audience Targeting', description: 'Steer your event and volunteering calls to the most suitable demographic; boost impact.' },
    growth: { title: 'Growth Insight', description: 'See gaps and opportunities; build your strategy for opening to new regions and communities.' },
    engagement: { title: 'Engagement Understanding', description: 'Understand which groups are more active; allocate resources where you get the most in return.' },
    reports: { title: 'Report-Ready', description: 'Turn demographic insights into reports for your board and funders.' },
  },
};

export default function DemografiAnaliziPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const tools: FeatureItem[] = [
    { icon: Users, title: C.tools.age.title, description: C.tools.age.description },
    { icon: MapPin, title: C.tools.city.title, description: C.tools.city.description },
    { icon: Briefcase, title: C.tools.profession.title, description: C.tools.profession.description },
    { icon: Heart, title: C.tools.interests.title, description: C.tools.interests.description },
    { icon: BarChart3, title: C.tools.live.title, description: C.tools.live.description, badge: { kind: 'hangel' } },
    { icon: PieChart, title: C.tools.charts.title, description: C.tools.charts.description },
    { icon: LineChart, title: C.tools.trends.title, description: C.tools.trends.description },
    { icon: Filter, title: C.tools.segment.title, description: C.tools.segment.description },
    { icon: UserCheck, title: C.tools.targeting.title, description: C.tools.targeting.description },
    { icon: TrendingUp, title: C.tools.growth.title, description: C.tools.growth.description },
    { icon: CalendarClock, title: C.tools.engagement.title, description: C.tools.engagement.description },
    { icon: ClipboardList, title: C.tools.reports.title, description: C.tools.reports.description },
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
        image={{ url: heroImage, hint: 'analytics charts dashboard' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#yetenekler', variant: 'link' },
        ]}
      />

      <AppleSection
        id="grafikler"
        theme="dark"
        eyebrow={C.s1Eyebrow}
        title={C.s1Title}
        description={C.s1Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1543286386-2e659306cd6c?q=80&w=2400&auto=format&fit=crop', hint: 'live data charts colorful' }}
      />

      <AppleSection
        id="kitle"
        eyebrow={C.s2Eyebrow}
        title={C.s2Title}
        description={C.s2Description}
        image={{ url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2400&auto=format&fit=crop', hint: 'audience targeting analytics' }}
      />

      <AppleSection
        id="buyume"
        theme="dark"
        eyebrow={C.s3Eyebrow}
        title={C.s3Title}
        description={C.s3Description}
        image={{ url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2400&auto=format&fit=crop', hint: 'growth strategy chart map' }}
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
