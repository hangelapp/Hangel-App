'use client';

import React from 'react';
import {
  PenLine,
  MessagesSquare,
  Globe2,
  Film,
  BookOpen,
  GraduationCap,
  BookMarked,
  FileSpreadsheet,
  Database,
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

const SLUG = 'library';

/* -------------------------------------------------------------------------- */
/*  İçerik — Türkçe (birincil)                                                */
/* -------------------------------------------------------------------------- */

const TR = {
  navLabel: 'hangel Kütüphane',
  navCta: 'Kütüphaneyi Aç',
  back: 'Ana sayfa',

  heroEyebrow: 'hangel Kütüphane',
  heroTitle: 'Bilgi, herkes için.',
  heroSubtitle: 'Sivil topluma özel, Türkçe ve ücretsiz tek bir araştırma çatısı.',
  heroDescription:
    'Küresel etki kaynakları, akademik birikim, kamu verisi ve yapay zeka destekli yazım araçları — fon başvurusundan etki ölçümüne kadar her aşamada yanınızda.',
  heroImage: '/discovery/library.png',
  heroCta: 'Kütüphaneyi keşfet',

  // Statement slaytları
  writerEyebrow: 'AI Proje Yazarı',
  writerTitle: 'Fon başvurunuzun ilk taslağı, dakikalar içinde.',
  writerSubtitle: 'Çok adımlı sihirbaz sizi adım adım yönlendirir.',
  writerDescription:
    'Proje özeti, hedef, kitle, faaliyet ve bütçeyi girersiniz; sihirbaz kurum tipinize göre yapılandırılmış bir fon başvuru taslağı üretir. Boş sayfa korkusu yok; üzerine inşa edeceğiniz sağlam bir çerçeve var.',

  inventoryEyebrow: 'Etki Envanteri',
  inventoryTitle: '300+ küresel sosyal etki kuruluşu, sektöre göre indeksli.',
  inventorySubtitle: 'İlham, ortaklık ve kıyas için tek katalog.',
  inventoryDescription:
    'Dünyanın dört bir yanından sosyal etki kuruluşlarını sektör sektör tarayın. Benzer alanda kimin ne yaptığını görün, modelleri inceleyin, kendi başvurunuza kanıt ve referans toplayın.',

  dataEyebrow: 'Açık Veri',
  dataTitle: 'Kanıtınız hazır kamu verisinde.',
  dataSubtitle: '50+ kamu veri seti, tek kataloğa indekslenmiş.',
  dataDescription:
    'Belediye, bakanlık ve TÜİK gibi kaynaklardan derlenmiş 50+ açık veri setini tek yerden bulun. Başvurunuzdaki ihtiyaç analizini ve etki ölçümünü resmi rakamlarla destekleyin.',

  // Koleksiyon ızgarası
  gridEyebrow: 'Koleksiyon',
  gridTitle: 'Tek panelde eksiksiz bir araştırma kütüphanesi.',
  gridDescription:
    'Yapay zeka araçlarından küresel kataloğa, akademik makalelerden indirilebilir şablonlara — STK çalışmanızın her aşaması için gerçek ve zengin kaynaklar.',

  compare:
    "Bir yanda küresel araştırma veritabanları, bir yanda AI yazı araçları — hangel bunları sivil topluma özel, Türkçe ve ücretsiz tek çatıda birleştirir.",

  finalEyebrow: 'Hazır mısınız?',
  finalTitle: 'Kütüphane sizi bekliyor.',
  finalSubtitle: 'Üyelik gerektirmeden keşfetmeye başlayın.',
  finalDescription:
    'Bir sonraki fon başvurunuz, etki raporunuz ve proje fikriniz için ihtiyacınız olan her şey tek tıkla erişilebilir.',
  finalCta: 'Kütüphaneyi Aç',

  footerLabel: 'Kütüphane',

  features: {
    writer: {
      title: 'AI Proje Yazarı',
      description:
        'Proje özeti, hedef, kitle, faaliyet ve bütçeyi giren çok adımlı sihirbaz; kurum tipinize göre fon başvuru taslağı üretir.',
    },
    assistant: {
      title: 'AI Kütüphane Asistanı',
      description:
        'Kütüphanedeki kaynaklar üzerine sohbet eden asistan; her sayfadan erişilebilen yüzen butonla anında yanınızda.',
    },
    inventory: {
      title: 'Etki Envanteri',
      description:
        'Sektöre göre indekslenmiş 300+ küresel sosyal etki kuruluşu kataloğu; ilham, kıyas ve ortaklık için.',
    },
    films: {
      title: 'Filmler',
      description:
        '500+ film ve belgesel; kategori, dil ve Türkçe altyazıyla, duygu ve aksiyon etiketleriyle düzenli.',
    },
    books: {
      title: 'Kitaplar',
      description:
        '65+ kitap; sosyal girişimcilik, STK liderliği ve etki ölçümü üzerine, Türkçe ve İngilizce.',
    },
    articles: {
      title: 'Akademik Makaleler',
      description: '40+ hakemli makale ve kitap bölümü; çalışmanızı sağlam bir literatüre dayandırın.',
    },
    glossary: {
      title: 'Sözlük',
      description: 'İkili sözlük: hangel Sözlüğü ve Sivil Toplum Sözlüğü ile terimler tek elde.',
    },
    templates: {
      title: 'Şablonlar & Araçlar',
      description: 'İndirilebilir proje, bütçe ve etki ölçüm şablonlarıyla sıfırdan başlamayın.',
    },
    openData: {
      title: 'Veri Kütüphanesi',
      description:
        'Belediye, bakanlık ve TÜİK gibi kaynaklardan 50+ kamu veri seti kataloğu; kanıt-odaklı çalışın.',
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Content — English (mirror)                                                */
/* -------------------------------------------------------------------------- */

const EN: typeof TR = {
  navLabel: 'hangel Library',
  navCta: 'Open the Library',
  back: 'Home',

  heroEyebrow: 'hangel Library',
  heroTitle: 'Knowledge, for everyone.',
  heroSubtitle: 'A single research home for civil society — in Turkish and free.',
  heroDescription:
    'Global impact resources, academic depth, public data and AI-assisted writing tools — by your side at every step, from grant applications to impact measurement.',
  heroImage: '/discovery/library.png',
  heroCta: 'Explore the library',

  writerEyebrow: 'AI Project Writer',
  writerTitle: 'The first draft of your grant application, in minutes.',
  writerSubtitle: 'A multi-step wizard guides you all the way.',
  writerDescription:
    'You enter the project summary, goal, audience, activities and budget; the wizard produces a structured grant application draft tailored to your organization type. No blank-page fear — just a solid framework to build on.',

  inventoryEyebrow: 'Impact Inventory',
  inventoryTitle: '300+ global social-impact organizations, indexed by sector.',
  inventorySubtitle: 'One catalogue for inspiration, partnership and comparison.',
  inventoryDescription:
    'Browse social-impact organizations from around the world, sector by sector. See who is doing what in your field, study their models, and gather evidence and references for your own application.',

  dataEyebrow: 'Open Data',
  dataTitle: 'Your evidence is in public data.',
  dataSubtitle: '50+ public datasets, indexed in one catalogue.',
  dataDescription:
    'Find 50+ open datasets gathered from sources like municipalities, ministries and the national statistics office in one place. Back your needs analysis and impact measurement with official figures.',

  gridEyebrow: 'Collection',
  gridTitle: 'A complete research library in a single panel.',
  gridDescription:
    'From AI tools to a global catalogue, from academic articles to downloadable templates — real, rich resources for every stage of your civil-society work.',

  compare:
    "On one side global research databases, on the other AI writing tools — hangel brings them together under a single roof built for civil society, in Turkish and free.",

  finalEyebrow: 'Ready?',
  finalTitle: 'The library is waiting for you.',
  finalSubtitle: 'Start exploring without signing up.',
  finalDescription:
    'Everything you need for your next grant application, impact report and project idea is a single click away.',
  finalCta: 'Open the Library',

  footerLabel: 'Library',

  features: {
    writer: {
      title: 'AI Project Writer',
      description:
        'A multi-step wizard for project summary, goal, audience, activities and budget that produces a grant application draft tailored to your organization type.',
    },
    assistant: {
      title: 'AI Library Assistant',
      description:
        'An assistant that chats over the library resources, instantly available via a floating button reachable from every page.',
    },
    inventory: {
      title: 'Impact Inventory',
      description:
        'A catalogue of 300+ global social-impact organizations indexed by sector — for inspiration, comparison and partnership.',
    },
    films: {
      title: 'Films',
      description:
        '500+ films and documentaries; organized by category, language and Turkish subtitles, with emotion and action tags.',
    },
    books: {
      title: 'Books',
      description:
        '65+ books on social entrepreneurship, NGO leadership and impact measurement, in Turkish and English.',
    },
    articles: {
      title: 'Academic Articles',
      description: '40+ peer-reviewed articles and book chapters to ground your work in solid literature.',
    },
    glossary: {
      title: 'Glossary',
      description: 'A dual glossary: the hangel Glossary and the Civil Society Glossary, terms in one place.',
    },
    templates: {
      title: 'Templates & Tools',
      description: 'Downloadable project, budget and impact-measurement templates so you never start from scratch.',
    },
    openData: {
      title: 'Data Library',
      description:
        'A catalogue of 50+ public datasets from sources like municipalities, ministries and the national statistics office — work evidence-first.',
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Sayfa                                                                      */
/* -------------------------------------------------------------------------- */

export default function LibraryAboutPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const features: FeatureItem[] = [
    { icon: PenLine, title: C.features.writer.title, description: C.features.writer.description, badge: { kind: 'hangel' } },
    { icon: MessagesSquare, title: C.features.assistant.title, description: C.features.assistant.description, badge: { kind: 'yeni' } },
    { icon: Globe2, title: C.features.inventory.title, description: C.features.inventory.description, badge: { kind: 'hangel' } },
    { icon: Film, title: C.features.films.title, description: C.features.films.description, badge: { kind: 'hangel' } },
    { icon: BookOpen, title: C.features.books.title, description: C.features.books.description },
    { icon: GraduationCap, title: C.features.articles.title, description: C.features.articles.description },
    { icon: BookMarked, title: C.features.glossary.title, description: C.features.glossary.description },
    { icon: FileSpreadsheet, title: C.features.templates.title, description: C.features.templates.description },
    { icon: Database, title: C.features.openData.title, description: C.features.openData.description },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <MarketingNav label={C.navLabel} ctaLabel={C.navCta} ctaHref="/library" backLabel={C.back} />

      {/* Hero */}
      <AppleSection
        eyebrow={C.heroEyebrow}
        title={cms.title || C.heroTitle}
        subtitle={cms.subtitle || C.heroSubtitle}
        description={cms.description || C.heroDescription}
        image={{ url: cms.heroImageUrl || C.heroImage, hint: 'digital and traditional library merging, glowing screens among classic bookshelves' }}
        actions={[{ label: C.heroCta, href: '/library', variant: 'link' }]}
      />

      {/* Statement — AI Proje Yazarı */}
      <AppleSection
        theme="dark"
        eyebrow={C.writerEyebrow}
        title={C.writerTitle}
        subtitle={C.writerSubtitle}
        description={C.writerDescription}
        badges={[{ kind: 'hangel' }]}
        actions={[{ label: C.navCta, href: '/library', variant: 'link' }]}
      />

      {/* Statement — Etki Envanteri 300+ */}
      <AppleSection
        eyebrow={C.inventoryEyebrow}
        title={C.inventoryTitle}
        subtitle={C.inventorySubtitle}
        description={C.inventoryDescription}
        badges={[{ kind: 'hangel' }]}
        actions={[{ label: C.navCta, href: '/library', variant: 'link' }]}
      />

      {/* Statement — Açık Veri */}
      <AppleSection
        theme="dark"
        eyebrow={C.dataEyebrow}
        title={C.dataTitle}
        subtitle={C.dataSubtitle}
        description={C.dataDescription}
        actions={[{ label: C.navCta, href: '/library', variant: 'link' }]}
      />

      {/* Koleksiyon ızgarası */}
      <section className="bg-muted py-24 border-b border-border">
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
        actions={[{ label: C.finalCta, href: '/library', variant: 'primary' }]}
      />

      <PublicFooter currentPageLabel={C.footerLabel} />
    </div>
  );
}
