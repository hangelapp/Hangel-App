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

      {/* Nasıl çalışır ızgarası */}
      <section id="nasil-calisir" className="bg-muted py-24 border-b border-border">
        <SectionHeading eyebrow={C.gridEyebrow} title={C.gridTitle} description={C.gridDescription} />
        <FeatureGrid items={features} columns={3} />
        <CompareNote>{C.compare}</CompareNote>
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
