'use client';

/**
 * /features/etkinlik-yonetimi — Etkinlik Yönetimi tanıtım sayfası.
 *
 * İki dilli (TR birincil, EN ayna). Tüm yapı '@/components/marketing/apple-kit'
 * bileşenleriyle kurulur. Marka kuralı: kullanıcıya görünen her yerde küçük
 * harf "hangel".
 */

import React from 'react';
import {
  CalendarDays,
  QrCode,
  IdCard,
  Award,
  MapPinned,
  Camera,
  Building2,
  Copy,
  ListChecks,
  Video,
  ScanFace,
  Share2,
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

const SLUG = 'feature-etkinlik-yonetimi';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Özellikler',

  heroEyebrow: 'Etkinlik Yönetimi',
  heroTitle: 'Her etkinlik, ilk davetten sertifikaya kadar tek panelde.',
  heroSubtitle: 'Fiziksel ya da online; kayıt, giriş, katılımcı ve fotoğraf — hepsi kontrol altında.',
  heroDescription:
    'hangel ile etkinliklerinizi dakikalar içinde oluşturun; kayıt ve RSVP toplayın, kapıda QR ile hızlı giriş yapın, yaka kartı ve katılım sertifikası üretin. Çok noktalı etkinlikleri şehir şehir yönetin, kurumsal katılımcıları ağırlayın ve etkinlik fotoğraflarını akıllı galeriyle paylaşın.',
  heroImage:
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Yetenekleri Gör',

  s1Eyebrow: 'Kayıt & Giriş',
  s1Title: 'Kapıda kuyruk yok, elde QR var.',
  s1Description:
    'Katılımcılarınız tek dokunuşla kayıt olur ve RSVP verir. Etkinlik günü herkesin benzersiz QR kodu okutulur; giriş saniyeler sürer, katılım anında kayda geçer. Kim geldi, kim gelmedi — hepsini canlı görürsünüz.',

  s2Eyebrow: 'Belgeler & Kimlik',
  s2Title: 'Yaka kartından sertifikaya, kurumunuzun logosuyla.',
  s2Description:
    'Katılımcılar için otomatik yaka kartları üretin; etkinlik sonrası tek tıkla, kurumunuzun logosunu taşıyan katılım ve başarı sertifikaları oluşturun. Emeğin karşılığı belgeye dönüşür, kurumunuzun profesyonelliği görünür olur.',

  s3Eyebrow: 'Ölçek & Katılım',
  s3Title: 'Tek etkinlik, birçok nokta, birçok kurum.',
  s3Description:
    'Aynı etkinliğe birden fazla konum ekleyin; her noktanın kendi QR kodu ve başvuru butonu olur. Belediye, valilik, marka, üniversite ve diğer STK’lar etkinliğinize kurumsal katılımcı olarak başvurur; onayınızla profilinizde ve etkinlikte yayınlanır.',

  gridEyebrow: 'Yetenekler',
  gridTitle: 'Etkinlik modülünün içinde neler var?',
  gridDescription:
    'Küçük bir buluşmadan şehir şehir yayılan kampanyaya kadar her ölçeğe hazır, yayında olan özellikler.',

  compare:
    'Dünyada etkinlik kayıt, yaka kartı ve check-in araçları çoğu zaman ayrı ayrı ve ücretlidir. hangel’de hepsi Türkiye’ye özel, ücretsiz ve tek panelde.',

  techEyebrow: 'Altyapı',
  techTitle: 'Sahada işleyen teknoloji.',
  techDescription:
    'QR tabanlı hızlı giriş, çok noktalı konum mimarisi, yüz eşleştirmeli fotoğraf galerisi ve otomatik belge üretimi — hepsi mobil ve masaüstünde sorunsuz çalışır.',

  updatesNote: 'hangel geliştikçe bu sayfa güncellenir; yeni etkinlik yetenekleri geldikçe burada yer alır.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'Bir sonraki etkinliğinizi hangel ile kurun.',
  finalSubtitle: 'Başvuru ücretsiz. Kurulum dakikalar sürer.',
  finalDescription:
    'Kayıttan sertifikaya kadar tüm etkinlik akışını tek panelden yönetin. Kurumunuzu bugün kaydedin, ilk etkinliğinizi dakikalar içinde yayına alın.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Tüm Özellikler',

  footerLabel: 'Etkinlik Yönetimi',

  tools: {
    create: { title: 'Fiziksel & Online Etkinlik', description: 'Fiziksel veya online etkinlik oluşturun; tarih, konum ve kontenjanı belirleyin, dakikalar içinde yayına alın.' },
    rsvp: { title: 'Kayıt & RSVP', description: 'Katılımcılardan tek dokunuşla kayıt ve RSVP toplayın; kontenjanı ve katılım durumunu canlı izleyin.' },
    checkin: { title: 'QR ile Giriş', description: 'Her katılımcının benzersiz QR kodunu kapıda okutun; giriş saniyeler sürer, katılım anında kayda geçer.' },
    badge: { title: 'Yaka Kartı', description: 'Katılımcılar için otomatik yaka kartları üretin; isim ve rolüyle baskıya hazır olarak indirin.' },
    certificate: { title: 'Katılım Sertifikası', description: 'Etkinlik sonrası tek tıkla, kurumunuzun logosuyla katılım ve başarı sertifikaları oluşturun.' },
    multiLocation: { title: 'Çok Noktalı Etkinlikler', description: 'Tek etkinliğe birden fazla konum ekleyin; her noktanın kendi QR kodu ve başvuru butonu olur.' },
    corporate: { title: 'Kurumsal Katılımcılar', description: 'Belediye, valilik, marka, üniversite ve STK’lar etkinliğinize kurumsal katılımcı olarak başvurur; onayınızla yayınlanır.' },
    photos: { title: 'Fotoğraf Galerisi', description: 'Etkinlik fotoğraflarını yükleyin, indirin ve paylaşın; QR ile galeriyi katılımcılara anında açın.' },
    faceMatch: { title: '“Selfie ile Bul”', description: 'Katılımcılar bir selfie çeker; yüz eşleştirmesi kendi fotoğraflarını saniyeler içinde bulup önüne getirir.' },
    duplicate: { title: 'İlan Kopyalama', description: 'Bir etkinliği tek dokunuşla çoğaltın; kopyayı düzenleyip anında yayınlayın. Tekrarlayan etkinlikler saniyeler.' },
    bulk: { title: 'Toplu Onay & CSV', description: 'Yüzlerce başvuruyu tek ekranda onaylayın ya da reddedin; katılımcıları CSV/Excel olarak dışa aktarın.' },
    share: { title: 'Paylaşım & Görünürlük', description: 'Etkinliğinizi hangel akışında ve profilinizde yayınlayın; QR ve bağlantıyla her yerden paylaşın.' },
  },
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Features',

  heroEyebrow: 'Event Management',
  heroTitle: 'Every event, from first invite to certificate, in one panel.',
  heroSubtitle: 'Physical or online; registration, check-in, attendees and photos — all under control.',
  heroDescription:
    'With hangel, create your events in minutes; collect registrations and RSVPs, check people in fast with QR at the door, and generate name badges and participation certificates. Manage multi-location events city by city, host corporate participants and share event photos with a smart gallery.',
  heroImage:
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'See Capabilities',

  s1Eyebrow: 'Registration & Check-in',
  s1Title: 'No queue at the door — just a QR in hand.',
  s1Description:
    'Your attendees register and RSVP in one tap. On the day, everyone’s unique QR code is scanned; check-in takes seconds and attendance is recorded instantly. Who showed up and who didn’t — you see it all live.',

  s2Eyebrow: 'Documents & Identity',
  s2Title: 'From name badges to certificates, with your organization’s logo.',
  s2Description:
    'Generate automatic name badges for attendees; after the event, create participation and achievement certificates carrying your organization’s logo in one click. Effort turns into a document, and your professionalism becomes visible.',

  s3Eyebrow: 'Scale & Participation',
  s3Title: 'One event, many locations, many organizations.',
  s3Description:
    'Add multiple locations to the same event; each point gets its own QR code and apply button. Municipalities, governorships, brands, universities and other NGOs apply to your event as corporate participants; once you approve, they appear on your profile and the event.',

  gridEyebrow: 'Capabilities',
  gridTitle: 'What’s inside the event module?',
  gridDescription:
    'Live features ready for any scale — from a small gathering to a campaign spanning city after city.',

  compare:
    'Worldwide, event registration, name badge and check-in tools are usually separate and paid. On hangel, they are all tailored to Türkiye, free, and in a single panel.',

  techEyebrow: 'Infrastructure',
  techTitle: 'Technology that works in the field.',
  techDescription:
    'QR-based fast check-in, a multi-location architecture, a face-matching photo gallery and automatic document generation — all working smoothly on mobile and desktop.',

  updatesNote: 'As hangel evolves, this page is updated; new event capabilities appear here as they ship.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Set up your next event with hangel.',
  finalSubtitle: 'Applying is free. Setup takes minutes.',
  finalDescription:
    'Manage the entire event flow, from registration to certificate, from a single panel. Register your organization today and publish your first event in minutes.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'All Features',

  footerLabel: 'Event Management',

  tools: {
    create: { title: 'Physical & Online Events', description: 'Create a physical or online event; set date, location and capacity, and publish in minutes.' },
    rsvp: { title: 'Registration & RSVP', description: 'Collect one-tap registrations and RSVPs from attendees; watch capacity and attendance live.' },
    checkin: { title: 'QR Check-in', description: 'Scan each attendee’s unique QR at the door; check-in takes seconds and attendance is logged instantly.' },
    badge: { title: 'Name Badges', description: 'Generate automatic name badges for attendees; download print-ready with name and role.' },
    certificate: { title: 'Participation Certificates', description: 'After the event, create participation and achievement certificates with your organization’s logo in one click.' },
    multiLocation: { title: 'Multi-Location Events', description: 'Add multiple locations to a single event; each point gets its own QR code and apply button.' },
    corporate: { title: 'Corporate Participants', description: 'Municipalities, governorships, brands, universities and NGOs apply as corporate participants; published once you approve.' },
    photos: { title: 'Photo Gallery', description: 'Upload, download and share event photos; open the gallery to attendees instantly with a QR code.' },
    faceMatch: { title: '“Find by Selfie”', description: 'Attendees take a selfie; face matching finds their own photos in seconds and brings them right up.' },
    duplicate: { title: 'Duplicate Listing', description: 'Duplicate an event in one tap; edit and publish the copy instantly. Recurring events in seconds.' },
    bulk: { title: 'Bulk Approval & CSV', description: 'Approve or reject hundreds of applications on one screen; export attendees to CSV/Excel.' },
    share: { title: 'Sharing & Visibility', description: 'Publish your event in the hangel feed and on your profile; share it anywhere via QR and link.' },
  },
};

export default function EtkinlikYonetimiPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const tools: FeatureItem[] = [
    { icon: CalendarDays, title: C.tools.create.title, description: C.tools.create.description },
    { icon: ListChecks, title: C.tools.rsvp.title, description: C.tools.rsvp.description },
    { icon: QrCode, title: C.tools.checkin.title, description: C.tools.checkin.description, badge: { kind: 'hangel' } },
    { icon: IdCard, title: C.tools.badge.title, description: C.tools.badge.description },
    { icon: Award, title: C.tools.certificate.title, description: C.tools.certificate.description },
    { icon: MapPinned, title: C.tools.multiLocation.title, description: C.tools.multiLocation.description, badge: { kind: 'yeni' } },
    { icon: Building2, title: C.tools.corporate.title, description: C.tools.corporate.description, badge: { kind: 'yeni' } },
    { icon: Camera, title: C.tools.photos.title, description: C.tools.photos.description },
    { icon: ScanFace, title: C.tools.faceMatch.title, description: C.tools.faceMatch.description, badge: { kind: 'hangel' } },
    { icon: Copy, title: C.tools.duplicate.title, description: C.tools.duplicate.description },
    { icon: Video, title: C.tools.bulk.title, description: C.tools.bulk.description },
    { icon: Share2, title: C.tools.share.title, description: C.tools.share.description },
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
        image={{ url: heroImage, hint: 'conference event audience' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#yetenekler', variant: 'link' },
        ]}
      />

      <AppleSection
        id="kayit"
        theme="dark"
        eyebrow={C.s1Eyebrow}
        title={C.s1Title}
        description={C.s1Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2400&auto=format&fit=crop', hint: 'event check-in qr scanning' }}
      />

      <AppleSection
        id="belgeler"
        eyebrow={C.s2Eyebrow}
        title={C.s2Title}
        description={C.s2Description}
        image={{ url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2400&auto=format&fit=crop', hint: 'certificate award ceremony' }}
      />

      <AppleSection
        id="olcek"
        theme="dark"
        eyebrow={C.s3Eyebrow}
        title={C.s3Title}
        description={C.s3Description}
        image={{ url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2400&auto=format&fit=crop', hint: 'multiple city teams map' }}
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
