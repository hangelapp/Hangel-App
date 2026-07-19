'use client';

/**
 * /bergama — hangel derneğinin Bergama girişimi. İki ana kol:
 *   1) Bergama Sosyal İnovasyon Yerleşkesi (Bedesten dönüşümü — kalıcı mekân)
 *   2) Pergamon İnovasyon Mirası Forumu (yılda bir, uluslararası)
 *
 * hangel apple-kit (MarketingNav/AppleSection/FeatureGrid/SectionHeading) ile
 * site kimliğine (Apple/iOS, narçiçeği #f34723) uyumlu. İçerik inline TR.
 */

import {
  Landmark,
  Sparkles,
  Users,
  Globe2,
  Recycle,
  HandHeart,
  CalendarDays,
  MapPin,
  ArrowRight,
  Building2,
  Lightbulb,
  History,
  Rocket,
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

const YERLESKE_HREF = '/bergama/yerleske';
const FORUM_HREF = '/bergama/forum';

/** İki ana kolu tanıtan büyük seçim kartları. */
function PillarCard({
  eyebrow,
  title,
  description,
  href,
  icon: Icon,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-black/5 bg-white p-8 text-left shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5 md:p-10"
    >
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1d1d1f] md:text-3xl">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MapPin className="h-4 w-4" /> {meta}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
          Keşfet
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

const DEGERLER: FeatureItem[] = [
  {
    icon: Recycle,
    title: 'Kolektif akıl',
    description:
      'Yerleşke tek bir kurumun değil, ortak bir bilincin eseri. Karar, kaynak ve mekân; katılan herkesle birlikte paylaşılıyor.',
  },
  {
    icon: History,
    title: 'Mirası geleceğe taşımak',
    description:
      'Pergamon 2.300 yıl önce dünyanın bilim ve kültür başkentlerindendi. Bu birikimi bugünün sosyal inovasyonuyla buluşturuyoruz.',
  },
  {
    icon: HandHeart,
    title: 'Sivil topluma açık',
    description:
      'Dernekler, vakıflar, kooperatifler ve gönüllüler için ortak bir çatı. Kimse yalnız çalışmasın; herkes aynı masaya otursun.',
  },
];

export default function BergamaPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Bergama · hangel" ctaLabel="Destek Ol" ctaHref="/donate" />

      {/* HERO */}
      <AppleSection
        eyebrow="hangel derneği · Bergama girişimi"
        title="Bergama'da miras, geleceğe ilham oluyor"
        subtitle="İki cesur adım: kalıcı bir sosyal inovasyon yerleşkesi ve dünyaya açılan bir miras forumu."
        description="Pergamon'un binlerce yıllık bilgi, sanat ve dayanışma mirasını; bugünün sivil toplumu, girişimciliği ve kolektif aklıyla yeniden hayata geçiriyoruz. Bu, hangel derneğinin Bergama'ya ve geleceğe verdiği sözdür."
        badges={[{ kind: 'yeni' }, { kind: 'hangel', label: 'hangel derneği' }]}
        actions={[
          { label: 'İki başlığı keşfet', href: '#kollar', variant: 'primary' },
          { label: 'hangel derneği', href: '/about', variant: 'link' },
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
            title="Bergama Sosyal İnovasyon Yerleşkesi"
            description="Tarihi Bergama Bedesteni'ni; STK'ların, girişimcilerin ve gönüllülerin birlikte üretttiği bir sosyal inovasyon ve sivil toplum yerleşkesine dönüştürüyoruz."
            href={YERLESKE_HREF}
            icon={Landmark}
            meta="Bergama Bedesteni"
          />
          <PillarCard
            eyebrow="Yılda bir · uluslararası"
            title="Pergamon İnovasyon Mirası Forumu"
            description="Geçmiş, bugün ve geleceğin konuşulduğu; bilim insanlarını, tasarımcıları ve sivil toplumu Bergama'da buluşturan uluslararası bir forum."
            href={FORUM_HREF}
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

      {/* HANGEL BAĞI */}
      <section className="border-b border-black/5 bg-black py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">hangel derneği faaliyeti</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            İyiliği ölçeklendiren teknolojiyle, taşın hafızasını buluşturuyoruz
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/70 md:text-lg">
            hangel; bağışı, gönüllülüğü ve sivil toplumu tek çatı altında büyüten bir sosyal fayda platformu.
            Bergama girişimi, bu birikimi sahaya taşıyor: dijitalde kurduğumuz dayanışmayı, Bergama'da taşa ve
            insana dokunan kalıcı bir esere dönüştürüyoruz.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold">
              <Link href={YERLESKE_HREF}>Yerleşkeyi keşfet</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/20 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-black"
            >
              <Link href={FORUM_HREF}>Forumu keşfet</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KISA YOLCULUK ŞERİDİ */}
      <AppleSection
        compact
        eyebrow="Yol haritası"
        title="Adım adım, birlikte"
      >
        <div className="mx-auto grid max-w-5xl gap-5 px-6 sm:grid-cols-3">
          {[
            { icon: Building2, step: '01', title: 'Mekânı hazırlıyoruz', text: 'Bergama Bedesteni, koruma-kullanma dengesiyle yerleşkeye dönüştürülüyor.' },
            { icon: Lightbulb, step: '02', title: 'Toplulukla dolduruyoruz', text: 'STK\'lar, girişimciler ve gönüllüler programlarla mekânı canlı tutuyor.' },
            { icon: Rocket, step: '03', title: 'Dünyaya açıyoruz', text: 'Pergamon İnovasyon Mirası Forumu ile üretileni her yıl dünyayla paylaşıyoruz.' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="rounded-3xl border border-black/5 bg-white p-6 text-left shadow-sm">
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
      </AppleSection>

      {/* KAPANIŞ CTA */}
      <section className="bg-primary py-20 text-center text-primary-foreground md:py-28">
        <div className="mx-auto max-w-2xl px-6">
          <CalendarDays className="mx-auto mb-5 h-10 w-10" aria-hidden="true" />
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Bu hikâyenin bir parçası ol</h2>
          <p className="mt-4 text-base leading-relaxed opacity-90 md:text-lg">
            İster mekânı birlikte kuralım, ister foruma katıl. Bergama'da geleceği hep beraber yazıyoruz.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full bg-white px-8 font-bold text-primary hover:bg-white/90">
              <Link href="/bergama/yerleske/katil">Yerleşkeye katıl</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-primary">
              <Link href="/bergama/forum/kayit">Forum kaydı</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm opacity-80">
            <Users className="h-4 w-4" /> hangel derneği · Bergama girişimi
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
