'use client';

/**
 * /bergama/yerleske — Bergama Sosyal İnovasyon Yerleşkesi (Bedesten dönüşümü).
 * Kalıcı, kolektif kullanılan bir sosyal inovasyon + sivil toplum mekânı.
 * Alt sayfalar: /mekan, /programlar, /stk, /katil.
 */

import {
  Landmark,
  Recycle,
  Users,
  GraduationCap,
  Rocket,
  Handshake,
  Coffee,
  Presentation,
  Building2,
  HeartHandshake,
  Sprout,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  MarketingNav,
  AppleSection,
  SectionHeading,
  FeatureGrid,
  type FeatureItem,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';

const NELER: FeatureItem[] = [
  {
    icon: Presentation,
    title: 'Ortak çalışma & atölye alanları',
    description: 'Esnek masalar, toplantı odaları ve atölyeler. Bir dernek sabah kullanır, bir kooperatif öğleden sonra; mekân hiç boş kalmaz.',
    href: '/bergama/yerleske/mekan',
  },
  {
    icon: GraduationCap,
    title: 'Eğitim & kapasite gelişimi',
    description: 'Sivil topluma yönelik proje yazımı, dijital okuryazarlık, fon bulma ve liderlik eğitimleri — çoğu ücretsiz.',
    href: '/bergama/yerleske/programlar',
  },
  {
    icon: Rocket,
    title: 'Sosyal girişim kuluçkası',
    description: 'Bergama ve çevresinden sosyal girişimlere mentorluk, ağ ve alan desteği. Fikirden etkiye giden yolu kısaltıyoruz.',
    href: '/bergama/yerleske/programlar',
  },
  {
    icon: HeartHandshake,
    title: 'STK ortak kullanım çatısı',
    description: 'Dernek, vakıf ve kooperatifler için paylaşımlı adres, depo, etkinlik alanı ve dijital altyapı.',
    href: '/bergama/yerleske/stk',
  },
  {
    icon: Coffee,
    title: 'Topluluk & buluşma',
    description: 'Halka açık kafe, sergi ve söyleşi alanı. Bergamalı hemşehriler, gönüllüler ve ziyaretçiler burada buluşur.',
    href: '/bergama/yerleske/mekan',
  },
  {
    icon: Sprout,
    title: 'Miras & zanaat çalışmaları',
    description: 'Yerel zanaatları, parşömen kültürünü ve Bergama\'ya özgü üretimi yaşatan çağdaş tasarım atölyeleri.',
    href: '/bergama/yerleske/programlar',
  },
];

const ILKELER: FeatureItem[] = [
  {
    icon: Recycle,
    title: 'Kolektif bilinç',
    description: 'Mekân kimsenin tekelinde değil. Kullanım, bakım ve karar; katılan tüm paydaşlarca ortak yürütülür.',
  },
  {
    icon: Landmark,
    title: 'Koru ve kullan',
    description: 'Tarihi Bedesten\'in dokusuna dokunmadan, onu yaşayan bir mekâna çeviriyoruz. Miras dondurulmaz, yaşatılır.',
  },
  {
    icon: Handshake,
    title: 'Herkese açık, kimseyi dışlamaz',
    description: 'Dil, inanç, siyaset gözetmeksizin; iyilik ve üretim için gelen herkese eşit mesafede bir ortak alan.',
  },
];

export default function YerleskePage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Sosyal İnovasyon Yerleşkesi" ctaLabel="Katıl" ctaHref="/bergama/yerleske/katil" backLabel="Bergama" />

      <AppleSection
        eyebrow="Bergama · kalıcı mekân"
        title="Bergama Sosyal İnovasyon Yerleşkesi"
        subtitle="Tarihi Bedesten'i, sivil toplumun ortak evine dönüştürüyoruz."
        description="Yüzyıllarca ticaretin ve buluşmanın kalbi olan Bergama Bedesteni; şimdi STK'ların, girişimcilerin, gönüllülerin ve öğrencilerin birlikte üretttiği bir sosyal inovasyon yerleşkesine dönüşüyor. Kalıcı, paylaşımlı ve kolektif akılla yönetilen bir mekân."
        badges={[{ kind: 'yeni' }, { kind: 'hangel', label: 'hangel derneği' }]}
        actions={[
          { label: 'Yerleşkeye katıl', href: '/bergama/yerleske/katil', variant: 'primary' },
          { label: 'Mekânı gör', href: '/bergama/yerleske/mekan', variant: 'link' },
        ]}
      />

      {/* NE SUNUYOR */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Yerleşkede neler var"
          title="Tek çatı, çok işlev"
          description="Sabah bir atölye, öğlen bir eğitim, akşam bir söyleşi. Yerleşke gün boyu yaşar ve her paydaşa yer açar."
        />
        <FeatureGrid items={NELER} columns={3} />
      </section>

      {/* İLKELER */}
      <AppleSection
        compact
        eyebrow="Nasıl yönetiliyor"
        title="Kolektif akılla, ortak sorumlulukla"
        description="Bu yerleşke bir kurumun 'sahip olduğu' değil, bir topluluğun 'birlikte yaşattığı' bir mekân. İşleyişimizin üç temel ilkesi var."
      >
        <FeatureGrid items={ILKELER} columns={3} />
      </AppleSection>

      {/* ALT SAYFA NAVİGASYONU */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <SectionHeading eyebrow="Daha derine in" title="Yerleşkeyi keşfet" />
        <div className="mx-auto grid max-w-4xl gap-4 px-6 sm:grid-cols-2">
          {[
            { href: '/bergama/yerleske/mekan', icon: Building2, title: 'Mekân & Bedesten', text: 'Tarihi yapının dönüşümü, alanlar ve konum.' },
            { href: '/bergama/yerleske/programlar', icon: GraduationCap, title: 'Programlar', text: 'Eğitim, kuluçka, atölye ve etkinlik takvimi.' },
            { href: '/bergama/yerleske/stk', icon: HeartHandshake, title: 'STK\'lar için', text: 'Ortak kullanım koşulları ve başvuru.' },
            { href: '/bergama/yerleske/katil', icon: Users, title: 'Katıl & destek ol', text: 'Gönüllü ol, bağış yap veya kurumunla dahil ol.' },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className="group flex items-center gap-4 rounded-3xl border border-black/5 bg-white p-6 text-left shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold tracking-tight group-hover:text-primary transition-colors">{c.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.text}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-20 text-center text-white md:py-28">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Yerleşkenin bir taşı da senin olsun</h2>
          <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
            İster gönüllü ol, ister kurumunla ortak kullanıma katıl. Bergama'nın ortak evini birlikte kuruyoruz.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold">
              <Link href="/bergama/yerleske/katil">Hemen katıl</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/20 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-black">
              <Link href="/bergama/yerleske/stk">STK olarak başvur</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
