'use client';

/**
 * /features/toplu-mesajlasma — Toplu Mail ve SMS tanıtım sayfası.
 *
 * İki dilli (TR birincil, EN ayna). Tüm yapı '@/components/marketing/apple-kit'
 * bileşenleriyle kurulur. Marka kuralı: kullanıcıya görünen her yerde küçük
 * harf "hangel".
 */

import React from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  Users2,
  FileSpreadsheet,
  Variable,
  Wallet,
  Gauge,
  MailCheck,
  Filter,
  Layers,
  Sparkles,
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

const SLUG = 'feature-toplu-mesajlasma';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Özellikler',

  heroEyebrow: 'Toplu Mail ve SMS',
  heroTitle: 'Binlerce destekçiye tek seferde, tek isme yazar gibi.',
  heroSubtitle: 'Kişiselleştirilmiş toplu SMS ve e-posta; kotayla kontrollü, bütçeyle güvende.',
  heroDescription:
    'hangel ile segmentlerinize ya da yüklediğiniz CSV alıcı listesine kotaya dayalı toplu SMS ve e-posta gönderin. Değişkenlerle her mesajı kişiselleştirin; kontör paketleriyle bütçenizi kontrol altında tutun. Kampanya duyurusundan bağış teşekkürüne, gönüllü çağrısından etkinlik hatırlatmasına kadar tüm iletişim tek panelde.',
  heroImage:
    'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Yetenekleri Gör',

  s1Eyebrow: 'İki Kanal, Tek Panel',
  s1Title: 'SMS de e-posta da aynı yerden.',
  s1Description:
    'Kısa ve acil duyurular için SMS, ayrıntılı bültenler için e-posta. İkisini de aynı panelden, aynı alıcı listeleriyle yönetin. Kanal seçin, mesajı yazın, gönderin — kampanyalarınız dağılmadan tek yerde toplanır.',

  s2Eyebrow: 'Doğru Kişi, Doğru Mesaj',
  s2Title: 'Segment ya da CSV: alıcıları siz belirleyin.',
  s2Description:
    'Destekçi tabanınızı segmentlere ayırın ya da hazır bir CSV listesi yükleyin. Değişkenlerle (ad, şehir, ilgi vb.) her mesajı alıcıya özel hâle getirin; toplu bir gönderim bile kişisel bir mesaj gibi okunur.',

  s3Eyebrow: 'Kotalı & Bütçe Dostu',
  s3Title: 'Ne kadar gönderdiğinizi hep bilin.',
  s3Description:
    'Gönderimler kotaya dayalıdır; kontör paketleriyle bütçenizi önceden planlar, sürprizle karşılaşmazsınız. Kalan kotanızı panelden izleyin, ihtiyaç oldukça yükleyin. Küçük bir dernekten büyük bir vakfa kadar herkese uygun.',

  gridEyebrow: 'Yetenekler',
  gridTitle: 'Toplu mesajlaşma modülünün içinde neler var?',
  gridDescription:
    'Tek bir teşekkür mesajından şehir çapında bir kampanyaya kadar her ölçeğe hazır, yayında olan araçlar.',

  compare:
    'Dünyada toplu SMS ve e-posta araçları çoğu zaman ayrı hesaplar, ayrı faturalar ve karmaşık kurulum ister. hangel’de ikisi de tek panelde, kotalı ve sade.',

  techEyebrow: 'Altyapı',
  techTitle: 'Kotalı SMS + SMTP e-posta.',
  techDescription:
    'Kotaya dayalı toplu SMS ve SMTP tabanlı e-posta gönderimi, değişkenli şablon motoru, segment ve CSV alıcı yönetimi, kontör paketi bütçelemesi — hepsi tek panelde birbirine bağlı çalışır.',

  updatesNote: 'hangel geliştikçe bu sayfa güncellenir; yeni gönderim yetenekleri geldikçe burada yer alır.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'İlk toplu gönderiminizi bugün yapın.',
  finalSubtitle: 'Başvuru ücretsiz. Kontör paketleri dahil.',
  finalDescription:
    'Destekçilerinize kişisel dokunuşla, tek panelden ulaşın. Kurumunuzu bugün kaydedin, iletişiminizi güçlendirmeye başlayın.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Tüm Özellikler',

  footerLabel: 'Toplu Mail ve SMS',

  tools: {
    sms: { title: 'Toplu SMS', description: 'Kısa ve acil duyurular için kotaya dayalı toplu SMS gönderin; anında binlerce kişiye ulaşın.' },
    email: { title: 'Toplu E-posta', description: 'Ayrıntılı bülten ve duyurular için SMTP tabanlı toplu e-posta gönderin; kurumsal görünümle.' },
    segments: { title: 'Segment Gönderimi', description: 'Destekçi tabanınızı segmentlere ayırın; yalnızca doğru kitleye gönderin, gürültüyü azaltın.' },
    csv: { title: 'CSV Alıcı Listesi', description: 'Hazır bir alıcı listesini CSV olarak yükleyin; dış listelerinize de tek panelden ulaşın.' },
    variables: { title: 'Değişkenlerle Kişiselleştirme', description: 'Ad, şehir, ilgi gibi değişkenlerle her mesajı alıcıya özel hâle getirin; toplu ama kişisel.' },
    quota: { title: 'Kotalı Gönderim', description: 'Gönderimler kotaya dayalıdır; ne kadar gönderdiğinizi ve kalan kotanızı hep bilirsiniz.' },
    credits: { title: 'Kontör Paketleri', description: 'Kontör paketleriyle bütçenizi önceden planlayın; ihtiyaç oldukça yükleyin, sürprizle karşılaşmayın.' },
    templates: { title: 'Şablon Yönetimi', description: 'Sık kullandığınız mesajları şablon olarak kaydedin; her seferinde sıfırdan yazmayın.' },
    delivery: { title: 'Gönderim Takibi', description: 'Gönderiminizin durumunu panelden izleyin; kimlere ulaştığını takip edin.' },
    filter: { title: 'Alıcı Filtreleme', description: 'Alıcıları ölçütlere göre süzün; kampanyanızı yalnızca ilgili kişilere odaklayın.' },
    campaigns: { title: 'Kampanya Katmanları', description: 'Bağış teşekküründen etkinlik hatırlatmasına farklı kampanyaları tek panelde düzenli tutun.' },
    smart: { title: 'Kişisel Dokunuş', description: 'Toplu bir gönderim bile tek isme yazılmış gibi okunur; iletişiminiz insani ve sıcak kalır.' },
  },
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Features',

  heroEyebrow: 'Bulk Mail and SMS',
  heroTitle: 'Reach thousands at once, as if writing to a single name.',
  heroSubtitle: 'Personalized bulk SMS and email; controlled by quota, safe with budget.',
  heroDescription:
    'With hangel, send quota-based bulk SMS and email to your segments or an uploaded CSV recipient list. Personalize every message with variables; keep your budget under control with credit packages. From campaign announcements to donation thank-yous, volunteer calls to event reminders — all your communication in one panel.',
  heroImage:
    'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'See Capabilities',

  s1Eyebrow: 'Two Channels, One Panel',
  s1Title: 'SMS and email, from the same place.',
  s1Description:
    'SMS for short, urgent announcements; email for detailed newsletters. Manage both from the same panel, with the same recipient lists. Pick a channel, write the message, send — your campaigns stay in one place instead of scattering.',

  s2Eyebrow: 'The Right Person, the Right Message',
  s2Title: 'Segment or CSV: you decide the recipients.',
  s2Description:
    'Split your supporter base into segments or upload a ready CSV list. Personalize every message with variables (name, city, interest, etc.); even a bulk send reads like a personal message.',

  s3Eyebrow: 'Quota-Based & Budget-Friendly',
  s3Title: 'Always know how much you’ve sent.',
  s3Description:
    'Sends are quota-based; with credit packages you plan your budget in advance and face no surprises. Watch your remaining quota from the panel and top up as needed. Suitable for everyone, from a small association to a large foundation.',

  gridEyebrow: 'Capabilities',
  gridTitle: 'What’s inside the bulk messaging module?',
  gridDescription:
    'Live tools ready for any scale, from a single thank-you message to a city-wide campaign.',

  compare:
    'Worldwide, bulk SMS and email tools often require separate accounts, separate bills and complex setup. On hangel, both are in one panel, quota-based and simple.',

  techEyebrow: 'Infrastructure',
  techTitle: 'Quota-based SMS + SMTP email.',
  techDescription:
    'Quota-based bulk SMS and SMTP-based email delivery, a variable template engine, segment and CSV recipient management, and credit-package budgeting — all working connected in one panel.',

  updatesNote: 'As hangel evolves, this page is updated; new delivery capabilities appear here as they ship.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Make your first bulk send today.',
  finalSubtitle: 'Applying is free. Credit packages included.',
  finalDescription:
    'Reach your supporters with a personal touch from a single panel. Register your organization today and start strengthening your communication.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'All Features',

  footerLabel: 'Bulk Mail and SMS',

  tools: {
    sms: { title: 'Bulk SMS', description: 'Send quota-based bulk SMS for short, urgent announcements; reach thousands instantly.' },
    email: { title: 'Bulk Email', description: 'Send SMTP-based bulk email for detailed newsletters and announcements, with a corporate look.' },
    segments: { title: 'Segment Sending', description: 'Split your supporter base into segments; send only to the right audience and cut the noise.' },
    csv: { title: 'CSV Recipient List', description: 'Upload a ready recipient list as CSV; reach your external lists from one panel too.' },
    variables: { title: 'Personalization with Variables', description: 'Make each message specific with variables like name, city, interest; bulk yet personal.' },
    quota: { title: 'Quota-Based Sending', description: 'Sends are quota-based; you always know how much you’ve sent and your remaining quota.' },
    credits: { title: 'Credit Packages', description: 'Plan your budget in advance with credit packages; top up as needed, face no surprises.' },
    templates: { title: 'Template Management', description: 'Save frequently used messages as templates; don’t start from scratch every time.' },
    delivery: { title: 'Delivery Tracking', description: 'Track your send status from the panel; follow who it reached.' },
    filter: { title: 'Recipient Filtering', description: 'Filter recipients by criteria; focus your campaign only on relevant people.' },
    campaigns: { title: 'Campaign Layers', description: 'Keep different campaigns — from donation thank-yous to event reminders — organized in one panel.' },
    smart: { title: 'Personal Touch', description: 'Even a bulk send reads as if written to a single name; your communication stays human and warm.' },
  },
};

export default function TopluMesajlasmaPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const tools: FeatureItem[] = [
    { icon: MessageSquare, title: C.tools.sms.title, description: C.tools.sms.description, badge: { kind: 'yeni' } },
    { icon: Mail, title: C.tools.email.title, description: C.tools.email.description, badge: { kind: 'yeni' } },
    { icon: Users2, title: C.tools.segments.title, description: C.tools.segments.description },
    { icon: FileSpreadsheet, title: C.tools.csv.title, description: C.tools.csv.description },
    { icon: Variable, title: C.tools.variables.title, description: C.tools.variables.description, badge: { kind: 'hangel' } },
    { icon: Gauge, title: C.tools.quota.title, description: C.tools.quota.description },
    { icon: Wallet, title: C.tools.credits.title, description: C.tools.credits.description },
    { icon: Layers, title: C.tools.templates.title, description: C.tools.templates.description },
    { icon: MailCheck, title: C.tools.delivery.title, description: C.tools.delivery.description },
    { icon: Filter, title: C.tools.filter.title, description: C.tools.filter.description },
    { icon: Send, title: C.tools.campaigns.title, description: C.tools.campaigns.description },
    { icon: Sparkles, title: C.tools.smart.title, description: C.tools.smart.description },
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
        image={{ url: heroImage, hint: 'messaging campaign dashboard' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#yetenekler', variant: 'link' },
        ]}
      />

      <AppleSection
        id="kanallar"
        theme="dark"
        eyebrow={C.s1Eyebrow}
        title={C.s1Title}
        description={C.s1Description}
        image={{ url: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?q=80&w=2400&auto=format&fit=crop', hint: 'sms and email channels' }}
      />

      <AppleSection
        id="alicilar"
        eyebrow={C.s2Eyebrow}
        title={C.s2Title}
        description={C.s2Description}
        image={{ url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2400&auto=format&fit=crop', hint: 'audience segments data' }}
      />

      <AppleSection
        id="kota"
        theme="dark"
        eyebrow={C.s3Eyebrow}
        title={C.s3Title}
        description={C.s3Description}
        image={{ url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2400&auto=format&fit=crop', hint: 'budget quota tracking' }}
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
