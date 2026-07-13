'use client';

/**
 * /features/sanal-santral — Sanal Santral (Çağrı Merkezi) tanıtım sayfası.
 *
 * İki dilli (TR birincil, EN ayna). Tüm yapı '@/components/marketing/apple-kit'
 * bileşenleriyle kurulur. Marka kuralı: kullanıcıya görünen her yerde küçük
 * harf "hangel".
 */

import React from 'react';
import {
  PhoneCall,
  Headphones,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mic,
  StickyNote,
  ListChecks,
  Signal,
  MessageCircle,
  IdCard,
  Users,
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

const SLUG = 'feature-sanal-santral';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Özellikler',

  heroEyebrow: 'Sanal Santral',
  heroTitle: 'Çağrı merkeziniz artık tarayıcınızda.',
  heroSubtitle: 'Donanım yok, kurulum derdi yok. Kulaklığı tak, aramaya başla.',
  heroDescription:
    'hangel Sanal Santral ile ekibiniz doğrudan tarayıcıdan, kulaklıkla arama yapar. Kendi hattınızı bağlayın; gelen ve giden çağrıları tek panelde yönetin, görüşme notu ve sonuç girin, çağrıları kaydedin ve cevapsız aramaları hiç kaçırmayın. Bağış, gönüllü ve destekçi iletişiminiz profesyonel bir çağrı merkezine dönüşür.',
  heroImage:
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Yetenekleri Gör',

  s1Eyebrow: 'Kendi Hattınız',
  s1Title: 'Numaranız sizde kalır, santral hangel’de.',
  s1Description:
    'Var olan kurumsal hattınızı ya da operatör numaranızı hangel’e bağlayın. Aradığınızda karşı tarafta kendi numaranız görünür; kurumsal kimliğiniz korunur. Tarayıcı tabanlı altyapı sayesinde masaüstünde ekstra bir santral cihazına ihtiyaç duymazsınız.',

  s2Eyebrow: 'Her Çağrı Kayıt Altında',
  s2Title: 'Kim aradı, ne konuşuldu, sonuç ne oldu?',
  s2Description:
    'Gelen ve giden her çağrı otomatik listelenir. Görüşme sırasında not alın, çağrının sonucunu etiketleyin ve isterseniz kaydını tutun. Cevapsız aramalar ayrı listelenir; hiçbir destekçiyi ya da gönüllüyü geri dönüşsüz bırakmazsınız.',

  s3Eyebrow: 'İletişimden Çağrıya',
  s3Title: 'WhatsApp’tan başlayan konuşma, çağrıyla tamamlanır.',
  s3Description:
    'İletişim merkeziyle gönüllülerinize hazır WhatsApp şablonlarıyla ulaşın; "Evet" diyenler otomatik çağrı sırasına düşer, "Hayır" diyene randevu kurulur, operatörünüz tek tıkla arar. Başvuran profilinden telefona geçiş tek dokunuş uzağınızda.',

  gridEyebrow: 'Yetenekler',
  gridTitle: 'Sanal santral modülünün içinde neler var?',
  gridDescription:
    'Küçük bir arama ekibinden yoğun bir kampanya gününe kadar her tempoya hazır, yayında olan araçlar.',

  compare:
    'Dünyada bulut çağrı merkezi çözümleri çoğu zaman pahalı, kurulumu zor ve STK’lara uzaktır. hangel’de bu, kendi hattınızla, tarayıcıdan ve ücretsiz.',

  techEyebrow: 'Altyapı',
  techTitle: 'Tarayıcıda çalışan gerçek santral.',
  techDescription:
    'WebRTC tabanlı sesli arama, kendi hattınızı (SIP/operatör) bağlama, çağrı kaydı ve sonuç yönetimi, cevapsız çağrı takibi — hepsi tarayıcıda, ek donanım gerektirmeden çalışır.',

  updatesNote: 'hangel geliştikçe bu sayfa güncellenir; yeni santral yetenekleri geldikçe burada yer alır.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'Çağrı merkezinizi bugün kurun.',
  finalSubtitle: 'Başvuru ücretsiz. Kulaklık dışında donanım gerekmez.',
  finalDescription:
    'Kendi hattınızı bağlayın, ekibinizi tarayıcıdan aramaya başlatın. Kurumunuzu bugün kaydedin, destekçi iletişiminizi profesyonelleştirin.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Tüm Özellikler',

  footerLabel: 'Sanal Santral',

  tools: {
    browser: { title: 'Tarayıcıdan Arama', description: 'Kulaklığı takın, tarayıcıdan arayın. Ekstra santral cihazı ya da yazılım kurulumu gerekmez.' },
    ownLine: { title: 'Kendi Hattını Bağla', description: 'Kurumsal hattınızı ya da operatör numaranızı bağlayın; aradığınızda kendi numaranız görünür.' },
    inbound: { title: 'Gelen Çağrılar', description: 'Gelen aramaları tek panelde karşılayın; arayan bilgisi ve geçmişiyle birlikte görüntüleyin.' },
    outbound: { title: 'Giden Çağrılar', description: 'Listelerden ya da profilden tek tıkla giden arama başlatın; kampanya aramalarını hızlandırın.' },
    missed: { title: 'Cevapsız Takibi', description: 'Cevapsız aramalar ayrı listelenir; geri dönülmesi gerekenleri hiç kaçırmazsınız.' },
    recording: { title: 'Çağrı Kaydı', description: 'İhtiyaç duyduğunuzda görüşmeleri kaydedin; kalite ve eğitim için sonradan dinleyin.' },
    notes: { title: 'Görüşme Notu', description: 'Arama sırasında not alın; her kişinin geçmişini ve konuşulanları tek yerde tutun.' },
    disposition: { title: 'Sonuç Etiketleme', description: 'Her çağrının sonucunu etiketleyin (ulaşıldı, meşgul, randevu vb.); süreçleri ölçün.' },
    quality: { title: 'Bağlantı Kalitesi', description: 'WebRTC tabanlı net ses; bağlantı durumunu görün, aramalarınız kesintisiz sürsün.' },
    contactCenter: { title: 'İletişim Merkezi', description: 'WhatsApp şablonlarıyla ulaşın; "Evet" diyen çağrı sırasına düşer, operatör tek tıkla arar.' },
    fromProfile: { title: 'Profilden Ara', description: 'Başvuran ya da destekçi profilinden telefona tek dokunuşla geçin; numarayı elle girmeyin.' },
    team: { title: 'Ekip & Operatör', description: 'Ekip üyelerine operatör erişimi verin; aramaları paylaştırarak yoğun günleri birlikte yönetin.' },
  },
};

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Features',

  heroEyebrow: 'Virtual PBX',
  heroTitle: 'Your call center now lives in your browser.',
  heroSubtitle: 'No hardware, no setup hassle. Put on the headset, start calling.',
  heroDescription:
    'With hangel Virtual PBX, your team calls right from the browser with a headset. Bring your own line; manage inbound and outbound calls in one panel, add notes and dispositions, record calls, and never miss a missed call. Your donor, volunteer and supporter communication becomes a professional call center.',
  heroImage:
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'See Capabilities',

  s1Eyebrow: 'Your Own Line',
  s1Title: 'Your number stays yours, the PBX lives on hangel.',
  s1Description:
    'Connect your existing corporate line or carrier number to hangel. When you call, your own number shows on the other end; your corporate identity is preserved. Thanks to the browser-based infrastructure, you need no extra PBX device on the desktop.',

  s2Eyebrow: 'Every Call on the Record',
  s2Title: 'Who called, what was said, what was the outcome?',
  s2Description:
    'Every inbound and outbound call is listed automatically. Take notes during the call, tag the outcome, and record it if you wish. Missed calls are listed separately; you leave no supporter or volunteer without a callback.',

  s3Eyebrow: 'From Message to Call',
  s3Title: 'A conversation that starts on WhatsApp finishes on a call.',
  s3Description:
    'With the contact center, reach volunteers using ready WhatsApp templates; "Yes" replies drop into the call queue automatically, "No" replies get a callback appointment, and your operator calls in one click. Going from an applicant profile to the phone is one tap away.',

  gridEyebrow: 'Capabilities',
  gridTitle: 'What’s inside the virtual PBX module?',
  gridDescription:
    'Live tools ready for any pace, from a small calling team to a busy campaign day.',

  compare:
    'Worldwide, cloud call center solutions are often expensive, hard to set up and far from NGOs. On hangel, this runs with your own line, from the browser, and free.',

  techEyebrow: 'Infrastructure',
  techTitle: 'A real PBX that runs in the browser.',
  techDescription:
    'WebRTC-based voice calling, bring-your-own-line (SIP/carrier) connectivity, call recording and disposition management, and missed-call tracking — all in the browser, with no extra hardware.',

  updatesNote: 'As hangel evolves, this page is updated; new PBX capabilities appear here as they ship.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Set up your call center today.',
  finalSubtitle: 'Applying is free. No hardware beyond a headset required.',
  finalDescription:
    'Bring your own line and get your team calling from the browser. Register your organization today and make your supporter communication professional.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'All Features',

  footerLabel: 'Virtual PBX',

  tools: {
    browser: { title: 'Call from Browser', description: 'Put on a headset and call from the browser. No extra PBX device or software installation needed.' },
    ownLine: { title: 'Bring Your Own Line', description: 'Connect your corporate line or carrier number; your own number shows when you call.' },
    inbound: { title: 'Inbound Calls', description: 'Answer incoming calls in one panel; view them with caller info and history.' },
    outbound: { title: 'Outbound Calls', description: 'Start outbound calls in one click from lists or profiles; speed up campaign calling.' },
    missed: { title: 'Missed-Call Tracking', description: 'Missed calls are listed separately; you never miss who needs a callback.' },
    recording: { title: 'Call Recording', description: 'Record conversations when needed; listen back later for quality and training.' },
    notes: { title: 'Call Notes', description: 'Take notes during a call; keep each person’s history and what was said in one place.' },
    disposition: { title: 'Disposition Tagging', description: 'Tag the outcome of each call (reached, busy, appointment, etc.); measure your processes.' },
    quality: { title: 'Connection Quality', description: 'Clear WebRTC-based audio; see connection status so your calls stay uninterrupted.' },
    contactCenter: { title: 'Contact Center', description: 'Reach with WhatsApp templates; "Yes" replies join the call queue, the operator calls in one click.' },
    fromProfile: { title: 'Call from Profile', description: 'Go from an applicant or supporter profile to the phone in one tap; no manual dialing.' },
    team: { title: 'Team & Operators', description: 'Give team members operator access; split calls to manage busy days together.' },
  },
};

export default function SanalSantralPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const tools: FeatureItem[] = [
    { icon: Headphones, title: C.tools.browser.title, description: C.tools.browser.description, badge: { kind: 'hangel' } },
    { icon: PhoneCall, title: C.tools.ownLine.title, description: C.tools.ownLine.description, badge: { kind: 'hangel' } },
    { icon: PhoneIncoming, title: C.tools.inbound.title, description: C.tools.inbound.description },
    { icon: PhoneOutgoing, title: C.tools.outbound.title, description: C.tools.outbound.description },
    { icon: PhoneMissed, title: C.tools.missed.title, description: C.tools.missed.description },
    { icon: Mic, title: C.tools.recording.title, description: C.tools.recording.description },
    { icon: StickyNote, title: C.tools.notes.title, description: C.tools.notes.description },
    { icon: ListChecks, title: C.tools.disposition.title, description: C.tools.disposition.description },
    { icon: Signal, title: C.tools.quality.title, description: C.tools.quality.description },
    { icon: MessageCircle, title: C.tools.contactCenter.title, description: C.tools.contactCenter.description, badge: { kind: 'beta' } },
    { icon: IdCard, title: C.tools.fromProfile.title, description: C.tools.fromProfile.description },
    { icon: Users, title: C.tools.team.title, description: C.tools.team.description },
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
        image={{ url: heroImage, hint: 'call center headset operator' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#yetenekler', variant: 'link' },
        ]}
      />

      <AppleSection
        id="hattiniz"
        theme="dark"
        eyebrow={C.s1Eyebrow}
        title={C.s1Title}
        description={C.s1Description}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=2400&auto=format&fit=crop', hint: 'connecting phone line dashboard' }}
      />

      <AppleSection
        id="kayit"
        eyebrow={C.s2Eyebrow}
        title={C.s2Title}
        description={C.s2Description}
        image={{ url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2400&auto=format&fit=crop', hint: 'call log dashboard notes' }}
      />

      <AppleSection
        id="iletisim"
        theme="dark"
        eyebrow={C.s3Eyebrow}
        title={C.s3Title}
        description={C.s3Description}
        badges={[{ kind: 'beta' }]}
        image={{ url: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?q=80&w=2400&auto=format&fit=crop', hint: 'whatsapp to call flow' }}
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
