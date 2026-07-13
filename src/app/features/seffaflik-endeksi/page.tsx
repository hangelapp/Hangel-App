'use client';

/**
 * /features/seffaflik-endeksi — Şeffaflık Endeksi tanıtım sayfası.
 *
 * İki dilli (TR birincil, EN ayna). Tüm yapı '@/components/marketing/apple-kit'
 * bileşenleriyle kurulur. Marka kuralı: kullanıcıya görünen her yerde küçük
 * harf "hangel".
 */

import React from 'react';
import {
  ShieldCheck,
  Gauge,
  FileCheck2,
  BadgeCheck,
  Eye,
  ScrollText,
  FileBadge,
  TrendingUp,
  Users,
  Landmark,
  Fingerprint,
  Star,
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

const SLUG = 'feature-seffaflik-endeksi';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Özellikler',

  heroEyebrow: 'Şeffaflık Endeksi',
  heroTitle: 'Güven, artık ölçülebilir.',
  heroSubtitle: 'Belgelerinizi yükleyin, 0–100 puanınızı alın, güveninizi herkese kanıtlayın.',
  heroDescription:
    'hangel Şeffaflık Endeksi ile yasal belgelerinizi ve raporlarınızı yükleyin; kurumunuz 0–100 arası bir şeffaflık puanı kazansın. Belgeleriniz doğrulanır, puanınız profilinizde halka açık görünür ve destekçilerinize güveni kanıtlar. Şeffaflık artık bir söz değil, görünür bir puan.',
  heroImage:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Yetenekleri Gör',

  s1Eyebrow: '0–100 Puan',
  s1Title: 'Şeffaflığınız tek bir sayıda görünür olsun.',
  s1Description:
    'Yüklediğiniz belge ve raporlara göre kurumunuz 0 ile 100 arasında bir şeffaflık puanı alır. Bu puan, hesap verebilirliğinizi tek bakışta anlatır; destekçileriniz kime güvendiklerini net biçimde görür. Puanınızı yükselttikçe görünürlüğünüz ve güveniniz artar.',

  s2Eyebrow: 'Belge Doğrulama',
  s2Title: 'Söylemek değil, belgelemek.',
  s2Description:
    'Tüzük, faaliyet raporu, mali tablo ve resmi belgelerinizi güvenle yükleyin. Belgeleriniz doğrulama sürecinden geçer; puanınız gerçek belgelere dayanır. Bu, şeffaflık iddiasını kanıta dönüştürür ve kurumunuzu öne çıkarır.',

  s3Eyebrow: 'Halka Açık Güven',
  s3Title: 'Puanınız profilinizde, herkesin gözü önünde.',
  s3Description:
    'Şeffaflık puanınız ve güven rozetiniz hangel profilinizde halka açık görünür. Bağış yapmadan, gönüllü olmadan ya da iş birliği kurmadan önce herkes kurumunuzun ne kadar şeffaf olduğunu görür. Güven, ilk temasta kurulur.',

  gridEyebrow: 'Yetenekler',
  gridTitle: 'Şeffaflık endeksi modülünün içinde neler var?',
  gridDescription:
    'Belge yüklemeden halka açık rozete kadar, güveni ölçülebilir kılan yayında olan araçlar.',

  compare:
    'Dünyada STK şeffaflık derecelendirmeleri çoğu zaman ücretli, seçici ve parçalıdır. hangel’de bu, Türkiye’ye özel, ücretsiz ve her kuruma açık.',

  techEyebrow: 'Altyapı',
  techTitle: '0–100 puan + belge doğrulama.',
  techDescription:
    'Belge ve raporlara dayalı 0–100 puanlama, resmi belge doğrulama süreci, profilde halka açık güven rozeti ve zaman içinde puan takibi — hepsi tek panelde şeffaf biçimde çalışır.',

  updatesNote: 'hangel geliştikçe bu sayfa güncellenir; yeni şeffaflık yetenekleri geldikçe burada yer alır.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'Şeffaflık puanınızı bugün kazanın.',
  finalSubtitle: 'Başvuru ücretsiz. Belgelerinizi yükleyin, puanınızı görün.',
  finalDescription:
    'Güveni kanıta dönüştürün, destekçilerinizin gözünde öne çıkın. Kurumunuzu bugün kaydedin, şeffaflığınızı görünür kılın.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Tüm Özellikler',

  footerLabel: 'Şeffaflık Endeksi',

  tools: {
    score: { title: '0–100 Şeffaflık Puanı', description: 'Belge ve raporlarınıza göre kurumunuz 0 ile 100 arasında bir şeffaflık puanı kazanır.' },
    upload: { title: 'Belge Yükleme', description: 'Tüzük, faaliyet raporu ve resmi belgelerinizi güvenle yükleyin; puanınızın temeli olsun.' },
    verify: { title: 'Belge Doğrulama', description: 'Belgeleriniz doğrulama sürecinden geçer; puanınız gerçek, kanıtlı belgelere dayanır.' },
    badge: { title: 'Halka Açık Güven Rozeti', description: 'Puanınız ve güven rozetiniz profilinizde herkese açık görünür; ilk bakışta güven verir.' },
    public: { title: 'Profilde Görünürlük', description: 'Şeffaflığınız hangel profilinizde öne çıkar; destekçiler kime güvendiğini net görür.' },
    reports: { title: 'Rapor Yönetimi', description: 'Faaliyet ve mali raporlarınızı düzenli tutun; şeffaflığınızı sürekli güncel gösterin.' },
    financials: { title: 'Mali Şeffaflık', description: 'Mali tablolarınızı paylaşın; kaynaklarınızı nasıl kullandığınızı açık biçimde gösterin.' },
    progress: { title: 'Puan Takibi', description: 'Şeffaflık puanınızın zaman içindeki gelişimini izleyin; her belge sizi ileri taşır.' },
    trust: { title: 'Destekçi Güveni', description: 'Yüksek puan, bağış ve gönüllü kararını kolaylaştırır; güven eyleme dönüşür.' },
    institutional: { title: 'Kurumsal Güvenilirlik', description: 'Şeffaflık puanı, kurumlar ve fon sağlayıcılarla iş birliğinde sizi öne çıkarır.' },
    identity: { title: 'Doğrulanmış Kimlik', description: 'Belge doğrulamasıyla kurumsal kimliğiniz teyit edilir; sahtelik değil, gerçeklik öne çıkar.' },
    reputation: { title: 'İtibar & Görünürlük', description: 'Şeffaf kurumlar hangel’de daha görünürdür; itibarınız destekçi kitlenizi büyütür.' },
  },
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Features',

  heroEyebrow: 'Transparency Index',
  heroTitle: 'Trust, now measurable.',
  heroSubtitle: 'Upload your documents, get your 0–100 score, prove your trust to everyone.',
  heroDescription:
    'With the hangel Transparency Index, upload your legal documents and reports; let your organization earn a transparency score from 0 to 100. Your documents are verified, your score appears publicly on your profile and proves trust to your supporters. Transparency is no longer a promise, but a visible score.',
  heroImage:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'See Capabilities',

  s1Eyebrow: '0–100 Score',
  s1Title: 'Let your transparency show in a single number.',
  s1Description:
    'Based on the documents and reports you upload, your organization gets a transparency score between 0 and 100. This score tells your accountability at a glance; your supporters clearly see who they’re trusting. As you raise your score, your visibility and trust grow.',

  s2Eyebrow: 'Document Verification',
  s2Title: 'Not just saying it — proving it.',
  s2Description:
    'Upload your bylaws, activity report, financial statements and official documents with confidence. Your documents go through a verification process; your score rests on real documents. This turns a claim of transparency into proof and sets your organization apart.',

  s3Eyebrow: 'Public Trust',
  s3Title: 'Your score on your profile, in everyone’s sight.',
  s3Description:
    'Your transparency score and trust badge appear publicly on your hangel profile. Before donating, volunteering or partnering, everyone sees how transparent your organization is. Trust is built at first contact.',

  gridEyebrow: 'Capabilities',
  gridTitle: 'What’s inside the transparency index module?',
  gridDescription:
    'Live tools that make trust measurable, from uploading documents to a public badge.',

  compare:
    'Worldwide, NGO transparency ratings are often paid, selective and fragmented. On hangel, this is tailored to Türkiye, free, and open to every organization.',

  techEyebrow: 'Infrastructure',
  techTitle: 'A 0–100 score + document verification.',
  techDescription:
    'A 0–100 scoring based on documents and reports, an official document verification process, a public trust badge on the profile, and score tracking over time — all working transparently in one panel.',

  updatesNote: 'As hangel evolves, this page is updated; new transparency capabilities appear here as they ship.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Earn your transparency score today.',
  finalSubtitle: 'Applying is free. Upload your documents, see your score.',
  finalDescription:
    'Turn trust into proof and stand out in your supporters’ eyes. Register your organization today and make your transparency visible.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'All Features',

  footerLabel: 'Transparency Index',

  tools: {
    score: { title: '0–100 Transparency Score', description: 'Your organization earns a transparency score between 0 and 100 based on your documents and reports.' },
    upload: { title: 'Document Upload', description: 'Upload your bylaws, activity report and official documents with confidence; the basis of your score.' },
    verify: { title: 'Document Verification', description: 'Your documents go through verification; your score rests on real, proven documents.' },
    badge: { title: 'Public Trust Badge', description: 'Your score and trust badge appear publicly on your profile; they give trust at first sight.' },
    public: { title: 'Profile Visibility', description: 'Your transparency stands out on your hangel profile; supporters clearly see who they trust.' },
    reports: { title: 'Report Management', description: 'Keep your activity and financial reports organized; show your transparency continuously up to date.' },
    financials: { title: 'Financial Transparency', description: 'Share your financial statements; clearly show how you use your resources.' },
    progress: { title: 'Score Tracking', description: 'Track your transparency score’s progress over time; every document moves you forward.' },
    trust: { title: 'Supporter Trust', description: 'A high score eases the decision to donate and volunteer; trust turns into action.' },
    institutional: { title: 'Institutional Credibility', description: 'A transparency score sets you apart when partnering with institutions and funders.' },
    identity: { title: 'Verified Identity', description: 'With document verification, your corporate identity is confirmed; reality, not fakery, stands out.' },
    reputation: { title: 'Reputation & Visibility', description: 'Transparent organizations are more visible on hangel; your reputation grows your supporter base.' },
  },
};

export default function SeffaflikEndeksiPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const tools: FeatureItem[] = [
    { icon: Gauge, title: C.tools.score.title, description: C.tools.score.description, badge: { kind: 'hangel' } },
    { icon: FileBadge, title: C.tools.upload.title, description: C.tools.upload.description },
    { icon: FileCheck2, title: C.tools.verify.title, description: C.tools.verify.description, badge: { kind: 'hangel' } },
    { icon: BadgeCheck, title: C.tools.badge.title, description: C.tools.badge.description, badge: { kind: 'hangel' } },
    { icon: Eye, title: C.tools.public.title, description: C.tools.public.description },
    { icon: ScrollText, title: C.tools.reports.title, description: C.tools.reports.description },
    { icon: Landmark, title: C.tools.financials.title, description: C.tools.financials.description },
    { icon: TrendingUp, title: C.tools.progress.title, description: C.tools.progress.description },
    { icon: Users, title: C.tools.trust.title, description: C.tools.trust.description },
    { icon: ShieldCheck, title: C.tools.institutional.title, description: C.tools.institutional.description },
    { icon: Fingerprint, title: C.tools.identity.title, description: C.tools.identity.description },
    { icon: Star, title: C.tools.reputation.title, description: C.tools.reputation.description },
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
        badges={[{ kind: 'hangel' }]}
        image={{ url: heroImage, hint: 'transparency reports dashboard' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#yetenekler', variant: 'link' },
        ]}
      />

      <AppleSection
        id="puan"
        theme="dark"
        eyebrow={C.s1Eyebrow}
        title={C.s1Title}
        description={C.s1Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1543286386-2e659306cd6c?q=80&w=2400&auto=format&fit=crop', hint: 'score gauge chart' }}
      />

      <AppleSection
        id="dogrulama"
        eyebrow={C.s2Eyebrow}
        title={C.s2Title}
        description={C.s2Description}
        image={{ url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2400&auto=format&fit=crop', hint: 'documents verification desk' }}
      />

      <AppleSection
        id="halka-acik"
        theme="dark"
        eyebrow={C.s3Eyebrow}
        title={C.s3Title}
        description={C.s3Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2400&auto=format&fit=crop', hint: 'public trust profile badge' }}
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
