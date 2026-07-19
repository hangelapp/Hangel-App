'use client';

/**
 * /bergama — Bergama girişimi ana sayfası. İki kol:
 *   1) Sosyal İnovasyon Yerleşkesi (Bedesten dönüşümü — kalıcı mekân)
 *   2) Pergamon İnovasyon Mirası Forumu (yılda bir, uluslararası)
 * Sade yapı: bu sayfa + iki detay sayfası. Marka/dernek adı geçmez.
 */

import {
  Landmark,
  Globe2,
  Recycle,
  History,
  HandHeart,
  MapPin,
  ArrowRight,
  Building2,
  Lightbulb,
  Rocket,
  Play,
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
import { BergamaForm } from '@/components/bergama/bergama-form';

const YERLESKE_HREF = '/bergama/yerleske';
const FORUM_HREF = '/bergama/forum';

function PillarCard({
  eyebrow, title, description, href, sunumHref, icon: Icon, meta,
}: {
  eyebrow: string; title: string; description: string; href: string; sunumHref: string; icon: React.ElementType; meta: string;
}) {
  // Başlığa/karta tıklama → sunumu açar (kullanıcı isteği). Alt kısımda ayrıca
  // "Detay sayfası" linki, gerçek sayfaya götürür.
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-black/5 bg-white p-8 text-left shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5 md:p-10">
      <Link href={sunumHref} className="block" aria-label={`${title} sunumunu izle`}>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1d1d1f] transition-colors group-hover:text-primary md:text-3xl">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition group-hover:shadow-lg">
          <Play className="h-4 w-4 fill-current" /> Sunumu izle
        </span>
      </Link>
      <div className="mt-8 flex items-center justify-between border-t border-black/5 pt-5">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MapPin className="h-4 w-4" /> {meta}
        </span>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          Detay sayfası
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

const DEGERLER: FeatureItem[] = [
  {
    icon: Recycle,
    title: 'Kolektif bilinç',
    description: 'Yerleşke tek bir kurumun değil, ortak bir bilincin eseri. Karar, kaynak ve mekân; katılan herkesle birlikte paylaşılıyor.',
  },
  {
    icon: History,
    title: 'Mirası geleceğe taşımak',
    description: 'Pergamon binlerce yıl önce dünyanın bilim ve kültür başkentlerindendi. Bu birikimi bugünün sosyal inovasyonuyla buluşturuyoruz.',
  },
  {
    icon: HandHeart,
    title: 'Sivil topluma açık',
    description: 'Dernekler, vakıflar, kooperatifler ve gönüllüler için ortak bir çatı. Kimse yalnız çalışmasın; herkes aynı masaya otursun.',
  },
];

export default function BergamaPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Bergama" ctaLabel="Başvuruda bulun" ctaHref="#basvuru" backLabel="Ana sayfa" />

      {/* HERO */}
      <AppleSection
        eyebrow="bergama"
        title="Bergama'da miras, geleceğe ilham oluyor"
        subtitle="Bergama · sosyal inovasyon yerleşkesi ve İnovasyon Forumu"
        description="Pergamon'un binlerce yıllık bilgi, sanat ve dayanışma mirasını; bugünün sivil toplumu olarak, sosyal inovasyon ve kolektif bilinçle yeniden hayata geçiriyoruz. Bu, Bergamalı atalarımız gibi bizlerin de geleceğe mirasıdır."
        badges={[{ kind: 'yeni' }]}
        actions={[
          { label: 'Başvuruda bulun', href: '#basvuru', variant: 'primary' },
          { label: 'İki kolu keşfet', href: '#kollar', variant: 'link' },
        ]}
      />

      {/* İKİ ANA KOL */}
      <section id="kollar" className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Bergama girişimi iki koldan yürür"
          title="Bir mekân, bir buluşma"
          description="Biri her gün yaşayan kalıcı bir yerleşke; diğeri yılda bir dünyayı Bergama'da toplayan bir forum. İkisi birbirini besler."
        />
        <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-2">
          <PillarCard
            eyebrow="Kalıcı mekân"
            title="Sosyal İnovasyon Yerleşkesi"
            description="Tarihi Bergama Bedesteni'ni; STK'ların, girişimcilerin ve gönüllülerin birlikte ürettiği bir sosyal inovasyon ve sivil toplum yerleşkesine dönüştürüyoruz."
            href={YERLESKE_HREF}
            sunumHref={`${YERLESKE_HREF}/sunum`}
            icon={Landmark}
            meta="Bergama Bedesteni"
          />
          <PillarCard
            eyebrow="Yılda bir · uluslararası"
            title="Pergamon İnovasyon Mirası Forumu"
            description="Geçmiş, bugün ve geleceğin konuşulduğu; bilim insanlarını, tasarımcıları ve sivil toplumu Bergama'da buluşturan uluslararası bir forum."
            href={FORUM_HREF}
            sunumHref={`${FORUM_HREF}/sunum`}
            icon={Globe2}
            meta="Bergama · her yıl Eylül"
          />
        </div>
      </section>

      {/* NEDEN BERGAMA */}
      <AppleSection
        compact
        eyebrow="Neden Bergama, neden şimdi"
        title="Çünkü buranın ruhu üretmek"
        description="Bergama; Pergamon Krallığı'ndan bu yana kütüphanesi, parşömeni, Asklepion'u ve Akropol'üyle insanlığa 'bilgiyi paylaşmayı' öğretti. Bugün aynı toprakta, sosyal inovasyonu ve dayanışmayı büyütüyoruz."
      >
        <FeatureGrid items={DEGERLER} columns={3} />
      </AppleSection>

      {/* YOL HARİTASI */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <SectionHeading eyebrow="Yol haritası" title="Adım adım, birlikte" />
        <div className="mx-auto grid max-w-5xl gap-5 px-6 sm:grid-cols-3">
          {[
            { icon: Building2, step: '01', title: 'Mekânı hazırlıyoruz', text: 'Bergama Bedesteni, koruma-kullanma dengesiyle yerleşkeye dönüştürülüyor.' },
            { icon: Lightbulb, step: '02', title: 'Toplulukla dolduruyoruz', text: 'STK\'lar, girişimciler ve gönüllüler programlarla mekânı canlı tutuyor.' },
            { icon: Rocket, step: '03', title: 'Dünyaya açıyoruz', text: 'Pergamon İnovasyon Mirası Forumu ile üretileni her yıl dünyayla paylaşıyoruz.' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="rounded-3xl border border-black/5 bg-[#f5f5f7] p-6 text-left">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-2xl font-bold tabular-nums text-black/10">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* BAŞVURU FORMU */}
      <section id="basvuru" className="bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Katıl"
          title="Bu hikâyenin bir parçası ol"
          description="İster yerleşkede üret, ister foruma katıl. Bergama'da geleceği birlikte yazalım — bilgilerini bırak, seninle iletişime geçelim."
        />
        <div className="px-6">
          <BergamaForm
            kaynak="genel"
            title="Başvuruda bulun"
            description="Bergama girişimine katılmak, katkı sunmak veya bilgi almak için."
            ilgiSecenekleri={['Yerleşke', 'Forum', 'Gönüllülük', 'Kurumsal iş birliği', 'Bireysel destek']}
          />
        </div>
      </section>

      {/* KAPANIŞ — sunumlar */}
      <section className="bg-primary py-16 text-center text-primary-foreground md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Sunumları izle</h2>
          <p className="mt-2 text-sm opacity-90">Her iki başlığın tam sunumunu tam ekran izleyebilirsin.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full bg-white px-7 font-bold text-primary hover:bg-white/90">
              <Link href={`${YERLESKE_HREF}/sunum`}><Play className="mr-2 h-4 w-4 fill-current" /> Yerleşke sunumu</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full bg-white px-7 font-bold text-primary hover:bg-white/90">
              <Link href={`${FORUM_HREF}/sunum`}><Play className="mr-2 h-4 w-4 fill-current" /> Forum sunumu</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
