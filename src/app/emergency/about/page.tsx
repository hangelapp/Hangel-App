'use client';

import React from 'react';
import {
  Siren,
  Droplets,
  MapPin,
  HandHeart,
  Bell,
  SlidersHorizontal,
  HeartPulse,
  Watch,
  ShieldCheck,
  Lock,
  Hospital,
  Award,
  Medal,
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

/* -------------------------------------------------------------------------- */
/*  PDF-5: Anon ziyaretçilere açık tanıtım sayfası.                           */
/*  Acil afet bildirimi + kan ihtiyacı modüllerini Apple kimliğinde anlatır.  */
/*  CTA → /login/selection?action=register. Auth gerektirmez (public).        */
/*  Bu sayfa CMS (useWebPage) kullanmaz — içerik tamamen statik.              */
/* -------------------------------------------------------------------------- */

const JOIN_HREF = '/login/selection?action=register';

/* -------------------------------------------------------------------------- */
/*  İçerik — Türkçe (birincil)                                                */
/* -------------------------------------------------------------------------- */

const TR = {
  navLabel: 'hangel Acil & Kan',
  navCta: 'Sen de katıl',
  back: 'Ana sayfa',

  heroEyebrow: 'hangel Acil & Kan',
  heroTitle: 'Bir hayat, bir bildirim uzağınızda.',
  heroSubtitle: 'Afet anında ve kan ihtiyacında, saniyeler içinde tam konumunuzdaki yüreklere ulaşın.',
  heroDescription:
    'Deprem, sel, yangın ya da acil bir kan çağrısı — hangel, yakınınızdaki binlerce gönüllüye otomatik, anlık bildirim gönderir. Yardım her zaman bir dokunuş kadar yakın.',
  heroCta: 'Nasıl çalıştığını gör',

  // Afet Bildirimi slaytı
  disasterEyebrow: 'Afet Bildirimi',
  disasterTitle: 'Afet vurduğunda, en yakındakiler ilk haberi alır.',
  disasterSubtitle: 'Deprem, sel, yangın ve fırtına için anlık çağrı.',
  disasterDescription:
    'Yetkili bir afet çağrısı oluşturduğunda, akıllı bir geofence yalnızca bölgeye yakın ve bildirim almayı seçmiş kullanıcılara otomatik anlık bildirim ulaştırır. Doğru kişiler, doğru anda, doğru yerde haberdar olur.',

  // Kan Eşleşmesi slaytı
  bloodEyebrow: 'Kan Bağışçı Eşleşmesi',
  bloodTitle: 'Doğru kan grubu, doğru bağışçıya saniyeler içinde ulaşır.',
  bloodSubtitle: 'Akıllı kan grubu uyumu + konuma göre otomatik eşleşme.',
  bloodDescription:
    'Bir kan çağrısı açıldığında hangel, kan grubu uyumlu ve yakındaki bağışçıları otomatik bulur ve onlara bildirim gönderir. Tek bir tüp kanın peşinde dakikalar harcamak yerine, en uygun yürekler anında devreye girer.',

  // Nasıl çalışır ızgarası
  gridEyebrow: 'Nasıl çalışır',
  gridTitle: 'Çağrıdan yardıma, dört basit adımda.',
  gridDescription:
    'Konumunuza ve tercihlerinize göre yalnızca sizi ilgilendiren çağrıları görür, tek dokunuşla yardım edersiniz.',

  compare:
    "Afet ve kan için ayrı ayrı uygulamalar var; hangel ikisini tek dayanışma ağında, konuma ve kan grubuna göre otomatik eşleştirerek birleştirir.",

  // İlk / öncü
  firstEyebrow: 'Türkiye’de bir ilk',
  firstTitle: 'Bir dokunuş. En yakın hastane. Yürekten yüreğe.',
  firstSubtitle: 'Apple Watch, konum ve gönüllü kan ağı — tek deneyimde.',
  firstDescription:
    'Apple Watch ile tek dokunuşta SOS, konum-tabanlı en yakın hastane eşleştirmesi ve gönüllü kan bağışçı ağını tek akışta birleştiren, Türkiye’de öncü bir acil yardım deneyimi. Ayrı ayrı çözümleri beklemek yerine, yardım tek anda harekete geçer.',

  // Güvenlik & teknoloji
  techEyebrow: 'Güvenlik & Teknoloji',
  techTitle: 'Verileriniz ve canınız güvende.',
  techSubtitle: 'KVKK uyumlu, şifreli ve akıllı bir altyapı.',
  techDescription:
    'hangel; konumunuzu ve sağlık tercihlerinizi yalnızca acil eşleşme anında, KVKK uyumlu ve şifreli biçimde işler. Güvenli Google Cloud altyapısı, rol-bazlı yetkilendirme ve anlık bildirimlerle doğru kişi, doğru anda, güvenle devreye girer.',

  techGridEyebrow: 'Güven veren teknoloji',
  techGridTitle: 'Hayat kurtaran teknolojinin arkasındaki güvence.',
  techGridDescription:
    'Wearable entegrasyonundan şifreli veri işlemeye — her katman, hem hızınız hem güvenliğiniz için tasarlandı.',

  // Sertifika & rozetler
  certEyebrow: 'Kazanımlar & Rozetler',
  certTitle: 'Her yardım, gerçek bir iz bırakır.',
  certDescription:
    'Attığınız her adım kayıt altında: gönüllü rozetleri, kan bağışçı kimliği ve “hayat kurtaran” katılım sertifikaları. İyiliğiniz görünür olsun, ilham versin.',

  // Sürekli gelişim
  evolveEyebrow: 'Sürekli gelişiyor',
  evolveNote:
    'hangel Acil & Kan sürekli gelişiyor; yeni entegrasyonlar, daha akıllı eşleşme ve daha hızlı bildirim eklendikçe bu sayfa güncellenir.',

  // Final CTA
  finalEyebrow: 'Hazır mısınız?',
  finalTitle: 'Sen de katıl.',
  finalSubtitle: 'Bir bildirim, bir hayat kurtarabilir.',
  finalDescription:
    'Acil tercihlerinizi belirleyin, konumunuzu paylaşın ve bölgenizdeki binlerce yürekten biri olun. Katılmak ücretsiz, etkisi paha biçilemez.',
  finalCta: 'Sen de katıl',

  footerLabel: 'Acil & Kan',

  features: {
    bloodRequest: {
      title: 'Kan İhtiyacı Bildirimi',
      description:
        'Acil formundan hastane, kan grubu ve konumu girip kendi kan çağrınızı saniyeler içinde açın.',
    },
    locationCalls: {
      title: 'Konum Bazlı Çağrı',
      description:
        'Yalnızca bulunduğunuz bölgenin çağrılarını görün; mesafe filtresiyle gürültü değil, gerçekten yakınınızdaki ihtiyaçlar gelir.',
    },
    helpResponse: {
      title: '"Yardım Edebilirim" Yanıtı',
      description:
        'Bildirime dokunun; hastanenin iletişim ve konum bilgisi doğrudan gelen kutunuza düşsün, yola çıkın.',
    },
    preferences: {
      title: 'Acil Tercihler',
      description:
        'Kan grubunuzu, bağışa uygunluğunuzu ve trombosit ile kök hücre ayarlarınızı belirleyin; eşleşme size göre olsun.',
    },
    push: {
      title: 'Anlık Push (FCM / APNs)',
      description:
        'Tek bir kayıt yazımı, cihazınıza otomatik anlık bildirim tetikler — uygulamayı açık tutmanıza gerek yok.',
    },
  },

  tech: {
    watch: {
      title: 'Apple Watch & HealthKit',
      description:
        'Bileğinizden tek dokunuşla SOS; sağlık verinizle uyumlu, hızlı ve güvenli acil çağrı deneyimi.',
    },
    nearestHospital: {
      title: 'En Yakın Hastane Eşleştirme',
      description:
        'Konumunuza göre en yakın ve uygun hastane anında hesaplanır; kaybedilen her saniye önemlidir.',
    },
    kvkk: {
      title: 'KVKK Uyumlu Veri İşleme',
      description:
        'Konum ve sağlık tercihleriniz yalnızca acil eşleşme anında, mevzuata uygun ve amaçla sınırlı işlenir.',
    },
    encryption: {
      title: 'Şifreli İletişim',
      description:
        'Uçtan uca güvenli bulut ve şifreli iletişim; verileriniz aktarımda ve saklamada korunur.',
    },
    roles: {
      title: 'Rol-Bazlı Yetki',
      description:
        'Yalnızca yetkili çağrı sahibi acil çağrı açabilir; erişim rol-bazlı denetlenir, kötüye kullanım engellenir.',
    },
    cloud: {
      title: 'Güvenli Bulut Altyapısı',
      description:
        'Google Cloud üzerinde ölçeklenen altyapı; en yoğun afet anında bile bildirimler yerine ulaşır.',
    },
  },

  certs: {
    volunteerBadge: {
      title: 'Gönüllü Rozetleri',
      description:
        'Katıldığınız her çağrıyla profilinizde biriken gönüllü rozetleri; dayanışmanızın görünen izi.',
    },
    donorId: {
      title: 'Kan Bağışçı Kimliği',
      description:
        'Kan grubunuz ve uygunluğunuzla dijital bağışçı kimliği; ihtiyaç anında hızlı ve doğru eşleşme.',
    },
    lifeSaver: {
      title: '“Hayat Kurtaran” Sertifikası',
      description:
        'Gerçek bir çağrıya yanıt verdiğinizde kazandığınız katılım sertifikası; iyiliğinizin kanıtı.',
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Content — English (mirror)                                                */
/* -------------------------------------------------------------------------- */

const EN: typeof TR = {
  navLabel: 'hangel Emergency & Blood',
  navCta: 'Join in',
  back: 'Home',

  heroEyebrow: 'hangel Emergency & Blood',
  heroTitle: 'A life, one notification away.',
  heroSubtitle: 'In a disaster or a blood emergency, reach the hearts right at your location in seconds.',
  heroDescription:
    'An earthquake, a flood, a fire or an urgent blood call — hangel automatically sends an instant notification to the thousands of volunteers near you. Help is always a tap away.',
  heroCta: 'See how it works',

  disasterEyebrow: 'Disaster Alert',
  disasterTitle: 'When disaster strikes, those closest hear first.',
  disasterSubtitle: 'Instant calls for earthquake, flood, fire and storm.',
  disasterDescription:
    'When an authorized disaster call is created, a smart geofence delivers an automatic instant notification only to opted-in users near the affected area. The right people are alerted at the right moment, in the right place.',

  bloodEyebrow: 'Blood Donor Matching',
  bloodTitle: 'The right blood type reaches the right donor in seconds.',
  bloodSubtitle: 'Smart blood-type compatibility + automatic location matching.',
  bloodDescription:
    'When a blood call is opened, hangel automatically finds compatible, nearby donors and notifies them. Instead of spending minutes chasing a single unit of blood, the most suitable hearts step in instantly.',

  gridEyebrow: 'How it works',
  gridTitle: 'From a call to help, in four simple steps.',
  gridDescription:
    'You only see the calls that concern you, based on your location and preferences, and you help with a single tap.',

  compare:
    "There are separate apps for disasters and for blood; hangel unites both in a single solidarity network, matching automatically by location and blood type.",

  firstEyebrow: 'A first in Türkiye',
  firstTitle: 'One tap. The nearest hospital. Heart to heart.',
  firstSubtitle: 'Apple Watch, location and a volunteer blood network — in one experience.',
  firstDescription:
    'A pioneering emergency-help experience in Türkiye that unites one-tap SOS from Apple Watch, location-based nearest-hospital matching and a volunteer blood-donor network in a single flow. Instead of waiting on separate solutions, help springs into action in a single moment.',

  techEyebrow: 'Security & Technology',
  techTitle: 'Your data and your life are safe.',
  techSubtitle: 'A KVKK-compliant, encrypted and intelligent infrastructure.',
  techDescription:
    'hangel processes your location and health preferences only at the moment of an emergency match, in a KVKK-compliant and encrypted way. With secure Google Cloud infrastructure, role-based authorization and instant notifications, the right person steps in at the right moment, safely.',

  techGridEyebrow: 'Technology you can trust',
  techGridTitle: 'The assurance behind life-saving technology.',
  techGridDescription:
    'From wearable integration to encrypted data processing — every layer is designed for both your speed and your safety.',

  certEyebrow: 'Achievements & Badges',
  certTitle: 'Every act of help leaves a real mark.',
  certDescription:
    'Every step you take is recorded: volunteer badges, a blood-donor identity and “life saver” participation certificates. Let your good be visible, and inspiring.',

  evolveEyebrow: 'Always evolving',
  evolveNote:
    'hangel Emergency & Blood keeps evolving; this page is updated as new integrations, smarter matching and faster notifications are added.',

  finalEyebrow: 'Ready?',
  finalTitle: 'Join in.',
  finalSubtitle: 'One notification can save a life.',
  finalDescription:
    'Set your emergency preferences, share your location and become one of the thousands of hearts in your area. Joining is free; the impact is priceless.',
  finalCta: 'Join in',

  footerLabel: 'Emergency & Blood',

  features: {
    bloodRequest: {
      title: 'Blood Need Request',
      description:
        'From the emergency form, enter the hospital, blood type and location to open your own blood call in seconds.',
    },
    locationCalls: {
      title: 'Location-Based Calls',
      description:
        'See only the calls in your area; a distance filter brings the needs genuinely near you, not the noise.',
    },
    helpResponse: {
      title: '"I Can Help" Response',
      description:
        'Tap a notification; the hospital contact and location details land straight in your inbox so you can set off.',
    },
    preferences: {
      title: 'Emergency Preferences',
      description:
        'Set your blood type, donation eligibility and platelet and stem-cell options so matching fits you.',
    },
    push: {
      title: 'Instant Push (FCM / APNs)',
      description:
        'A single record write triggers an automatic instant notification to your device — no need to keep the app open.',
    },
  },

  tech: {
    watch: {
      title: 'Apple Watch & HealthKit',
      description:
        'One-tap SOS from your wrist; a fast, secure emergency-call experience aligned with your health data.',
    },
    nearestHospital: {
      title: 'Nearest-Hospital Matching',
      description:
        'The nearest suitable hospital is computed instantly from your location; every second saved matters.',
    },
    kvkk: {
      title: 'KVKK-Compliant Data Processing',
      description:
        'Your location and health preferences are processed only at the moment of an emergency match, compliant and purpose-limited.',
    },
    encryption: {
      title: 'Encrypted Communication',
      description:
        'End-to-end secure cloud and encrypted communication; your data is protected in transit and at rest.',
    },
    roles: {
      title: 'Role-Based Access',
      description:
        'Only an authorized caller can open an emergency call; access is role-based and misuse is prevented.',
    },
    cloud: {
      title: 'Secure Cloud Infrastructure',
      description:
        'Infrastructure that scales on Google Cloud; notifications arrive even in the busiest disaster moments.',
    },
  },

  certs: {
    volunteerBadge: {
      title: 'Volunteer Badges',
      description:
        'Volunteer badges that build up on your profile with every call you answer; the visible trace of your solidarity.',
    },
    donorId: {
      title: 'Blood-Donor Identity',
      description:
        'A digital donor identity with your blood type and eligibility; fast, accurate matching when needed.',
    },
    lifeSaver: {
      title: '“Life Saver” Certificate',
      description:
        'A participation certificate you earn when you respond to a real call; proof of your good.',
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Sayfa                                                                      */
/* -------------------------------------------------------------------------- */

export default function EmergencyAboutPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;

  const features: FeatureItem[] = [
    {
      icon: Droplets,
      title: C.features.bloodRequest.title,
      description: C.features.bloodRequest.description,
    },
    {
      icon: MapPin,
      title: C.features.locationCalls.title,
      description: C.features.locationCalls.description,
    },
    {
      icon: HandHeart,
      title: C.features.helpResponse.title,
      description: C.features.helpResponse.description,
    },
    {
      icon: SlidersHorizontal,
      title: C.features.preferences.title,
      description: C.features.preferences.description,
    },
    {
      icon: Bell,
      title: C.features.push.title,
      description: C.features.push.description,
    },
  ];

  const techFeatures: FeatureItem[] = [
    { icon: Watch, title: C.tech.watch.title, description: C.tech.watch.description, badge: { kind: 'hangel' } },
    { icon: Hospital, title: C.tech.nearestHospital.title, description: C.tech.nearestHospital.description },
    { icon: ShieldCheck, title: C.tech.kvkk.title, description: C.tech.kvkk.description },
    { icon: Lock, title: C.tech.encryption.title, description: C.tech.encryption.description },
    { icon: SlidersHorizontal, title: C.tech.roles.title, description: C.tech.roles.description },
    { icon: Bell, title: C.tech.cloud.title, description: C.tech.cloud.description },
  ];

  const certFeatures: FeatureItem[] = [
    { icon: Medal, title: C.certs.volunteerBadge.title, description: C.certs.volunteerBadge.description },
    { icon: Droplets, title: C.certs.donorId.title, description: C.certs.donorId.description },
    { icon: Award, title: C.certs.lifeSaver.title, description: C.certs.lifeSaver.description, badge: { kind: 'hangel' } },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <MarketingNav label={C.navLabel} ctaLabel={C.navCta} ctaHref={JOIN_HREF} backLabel={C.back} />

      {/* Hero */}
      <AppleSection
        eyebrow={C.heroEyebrow}
        title={C.heroTitle}
        subtitle={C.heroSubtitle}
        description={C.heroDescription}
        actions={[{ label: C.heroCta, href: '#nasil-calisir', variant: 'link' }]}
      >
        <div className="flex justify-center pb-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10">
            <HeartPulse className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
        </div>
      </AppleSection>

      {/* Statement — Afet Bildirimi */}
      <AppleSection
        theme="dark"
        eyebrow={C.disasterEyebrow}
        title={
          <span className="inline-flex flex-col items-center gap-4">
            <Siren className="h-10 w-10 text-primary" aria-hidden="true" />
            {C.disasterTitle}
          </span>
        }
        subtitle={C.disasterSubtitle}
        description={C.disasterDescription}
        badges={[{ kind: 'hangel' }]}
        actions={[{ label: C.navCta, href: JOIN_HREF, variant: 'link' }]}
      />

      {/* Statement — Kan Bağışçı Eşleşmesi */}
      <AppleSection
        eyebrow={C.bloodEyebrow}
        title={
          <span className="inline-flex flex-col items-center gap-4">
            <Droplets className="h-10 w-10 text-primary" aria-hidden="true" />
            {C.bloodTitle}
          </span>
        }
        subtitle={C.bloodSubtitle}
        description={C.bloodDescription}
        badges={[{ kind: 'hangel' }]}
        actions={[{ label: C.navCta, href: JOIN_HREF, variant: 'link' }]}
      />

      {/* Statement — Türkiye'de bir ilk */}
      <AppleSection
        theme="dark"
        eyebrow={C.firstEyebrow}
        title={
          <span className="inline-flex flex-col items-center gap-4">
            <Watch className="h-10 w-10 text-primary" aria-hidden="true" />
            {C.firstTitle}
          </span>
        }
        subtitle={C.firstSubtitle}
        description={C.firstDescription}
        badges={[{ kind: 'hangel' }, { kind: 'yeni' }]}
        actions={[{ label: C.navCta, href: JOIN_HREF, variant: 'link' }]}
      />

      {/* Nasıl çalışır ızgarası */}
      <section id="nasil-calisir" className="bg-muted py-24 border-b border-border">
        <SectionHeading eyebrow={C.gridEyebrow} title={C.gridTitle} description={C.gridDescription} />
        <FeatureGrid items={features} columns={3} />
        <CompareNote>{C.compare}</CompareNote>
      </section>

      {/* Statement — Güvenlik & Teknoloji */}
      <AppleSection
        eyebrow={C.techEyebrow}
        title={
          <span className="inline-flex flex-col items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-primary" aria-hidden="true" />
            {C.techTitle}
          </span>
        }
        subtitle={C.techSubtitle}
        description={C.techDescription}
        badges={[{ kind: 'hangel' }]}
      />

      {/* Güven veren teknoloji ızgarası */}
      <section className="bg-muted py-24 border-b border-border">
        <SectionHeading eyebrow={C.techGridEyebrow} title={C.techGridTitle} description={C.techGridDescription} />
        <FeatureGrid items={techFeatures} columns={3} />
      </section>

      {/* Kazanımlar & rozetler ızgarası */}
      <section className="bg-white py-24 border-b border-border">
        <SectionHeading eyebrow={C.certEyebrow} title={C.certTitle} description={C.certDescription} />
        <FeatureGrid items={certFeatures} columns={3} />
        <CompareNote>{C.evolveNote}</CompareNote>
      </section>

      {/* Final CTA */}
      <AppleSection
        eyebrow={C.finalEyebrow}
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        compact
        actions={[{ label: C.finalCta, href: JOIN_HREF, variant: 'primary' }]}
      />

      <PublicFooter currentPageLabel={C.footerLabel} />
    </div>
  );
}
