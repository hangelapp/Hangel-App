'use client';

/**
 * /bergama/yerleske/programlar — Yerleşkenin eğitim, kuluçka, atölye ve
 * topluluk programları + örnek haftalık ritim.
 */

import {
  Rocket,
  Palette,
  Mic,
  Users,
  Laptop,
  Coins,
  Sprout,
  CalendarDays,
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

const EGITIM: FeatureItem[] = [
  { icon: Laptop, title: 'Dijital okuryazarlık', description: 'STK\'lar ve gönüllüler için temel dijital araçlar, sosyal medya ve dijital güvenlik eğitimleri.' },
  { icon: Coins, title: 'Fon bulma & proje yazımı', description: 'Hibe başvurusu, bütçeleme ve raporlama; fikirleri fonlanabilir projelere dönüştürme atölyeleri.' },
  { icon: Users, title: 'Sivil liderlik', description: 'Ekip yönetimi, gönüllü koordinasyonu ve etkili iletişim üzerine uygulamalı programlar.' },
];

const URETIM: FeatureItem[] = [
  { icon: Rocket, title: 'Sosyal girişim kuluçkası', description: '12 haftalık program: mentorluk, ağ, alan ve tohum desteğiyle sosyal girişimleri büyütür.' },
  { icon: Palette, title: 'Zanaat & tasarım atölyeleri', description: 'Yerel zanaatları çağdaş tasarımla buluşturan; parşömen, seramik ve tekstil çalışmaları.' },
  { icon: Sprout, title: 'Miras & sürdürülebilirlik laboratuvarı', description: 'Bergama\'nın kültürel mirasını koruyan, yeşil ve döngüsel çözümler geliştiren açık lab.' },
];

const RITIM = [
  { gun: 'Pazartesi', baslik: 'Açık ofis günü', text: 'STK ve girişimciler için serbest ortak çalışma; birebir mentorluk randevuları.' },
  { gun: 'Salı', baslik: 'Eğitim atölyeleri', text: 'Dijital okuryazarlık, proje yazımı ve liderlik eğitimleri.' },
  { gun: 'Çarşamba', baslik: 'Kuluçka & mentorluk', text: 'Sosyal girişim ekipleriyle çalışma oturumları ve uzman görüşmeleri.' },
  { gun: 'Perşembe', baslik: 'Zanaat & tasarım', text: 'Üretim atölyeleri ve miras çalışmaları; halka açık kısımlar.' },
  { gun: 'Cuma', baslik: 'Topluluk & söyleşi', text: 'Söyleşiler, film gösterimleri ve networking; herkese açık program.' },
  { gun: 'Hafta sonu', baslik: 'Ailelere ve gençlere', text: 'Çocuk atölyeleri, gençlik programları ve sergi açılışları.' },
];

export default function ProgramlarPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Programlar" ctaLabel="Katıl" ctaHref="/bergama/yerleske/katil" backLabel="Yerleşke" />

      <AppleSection
        eyebrow="Programlar"
        title="Mekânı canlı tutan, insanı büyüten programlar"
        subtitle="Öğrenmekten üretmeye, buluşmaktan büyümeye."
        description="Yerleşke, dört duvardan ibaret değil; içini dolduran programlarla anlam kazanıyor. Eğitimler, kuluçka, atölyeler ve topluluk buluşmaları; çoğu ücretsiz ve herkese açık."
        badges={[{ kind: 'hangel', label: 'hangel derneği' }]}
        actions={[{ label: 'Programlara katıl', href: '/bergama/yerleske/katil', variant: 'primary' }]}
      />

      {/* EĞİTİM */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Öğren & gelişir" title="Eğitim & kapasite programları" description="Sivil toplumun gücü bilgiyle artar. Bu eğitimlerin çoğu ücretsiz ve önce Bergamalı kurumlara açık." />
        <FeatureGrid items={EGITIM} columns={3} />
      </section>

      {/* ÜRETİM */}
      <AppleSection compact eyebrow="Üret & büyüt" title="Kuluçka & üretim programları" description="Fikirden etkiye giden yolu birlikte yürüyoruz. Mentorluk, alan ve ağ; hepsi tek çatı altında.">
        <FeatureGrid items={URETIM} columns={3} />
      </AppleSection>

      {/* HAFTALIK RİTİM */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <SectionHeading eyebrow="Örnek haftalık ritim" title="Yerleşkede bir hafta" description="Program, topluluğun ihtiyacına göre şekillenir; aşağıdaki akış temsili bir örnektir." />
        <div className="mx-auto grid max-w-5xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {RITIM.map((r) => (
            <div key={r.gun} className="rounded-3xl border border-black/5 bg-[#f5f5f7] p-6 text-left">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                <CalendarDays className="h-3.5 w-3.5" /> {r.gun}
              </div>
              <h3 className="text-lg font-bold tracking-tight">{r.baslik}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <Mic className="mx-auto mb-4 h-9 w-9" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Bir programı sen de yürütebilirsin</h2>
          <p className="mt-3 text-base opacity-90">Eğitmen, mentor ya da atölye yürütücüsü olarak katkı sunmak istersen kapımız açık.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6 h-12 rounded-full bg-white px-8 font-bold text-primary hover:bg-white/90"><Link href="/bergama/yerleske/katil">Katkı sun</Link></Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
