'use client';

/**
 * /bergama/yerleske/mekan — Bergama Bedesteni'nin yerleşkeye dönüşümü,
 * mekân planı (alanlar), koruma yaklaşımı ve konum.
 */

import {
  Landmark,
  Presentation,
  Coffee,
  Users,
  BookOpen,
  Palette,
  Warehouse,
  MapPin,
  ShieldCheck,
  Leaf,
  Accessibility,
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

const ALANLAR: FeatureItem[] = [
  { icon: Presentation, title: 'Ortak çalışma salonu', description: 'Esnek, taşınabilir mobilyalarla düzenlenen ana salon. Gün içinde farklı ekiplere ev sahipliği yapar.' },
  { icon: Users, title: 'Toplantı & atölye odaları', description: 'Küçük ekip toplantıları, eğitimler ve yaratıcı atölyeler için 3 ayrı akustik oda.' },
  { icon: BookOpen, title: 'Miras kütüphanesi', description: 'Pergamon\'un kütüphane geleneğine saygı: sivil toplum, tasarım ve yerel tarih kaynakları.' },
  { icon: Palette, title: 'Zanaat & tasarım atölyesi', description: 'Yerel üretim, parşömen kültürü ve çağdaş tasarımın buluştuğu üretim alanı.' },
  { icon: Coffee, title: 'Topluluk kafesi & sergi', description: 'Halka açık, gelirinin bir kısmı yerleşkeye dönen sosyal kafe; duvarlar rotasyonlu sergiye ayrılır.' },
  { icon: Warehouse, title: 'Paylaşımlı depo & lojistik', description: 'STK\'ların malzeme, kumbara ve etkinlik ekipmanını güvenle sakladığı ortak depo.' },
];

const KORUMA: FeatureItem[] = [
  { icon: ShieldCheck, title: 'Koruma önce gelir', description: 'Tüm müdahaleler, ilgili koruma kurulu onayı ve uzman restorasyon rehberliğiyle yapılır; özgün doku korunur.' },
  { icon: Leaf, title: 'Sürdürülebilir dönüşüm', description: 'Enerji verimli aydınlatma, geri dönüştürülmüş mobilya ve düşük etkili yöntemlerle ekolojik bir yenileme.' },
  { icon: Accessibility, title: 'Herkes için erişilebilir', description: 'Engelsiz erişim, açık yönlendirme ve kapsayıcı tasarım; yerleşke ayrım gözetmeden herkese açık.' },
];

export default function MekanPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Mekân & Bedesten" ctaLabel="Katıl" ctaHref="/bergama/yerleske/katil" backLabel="Yerleşke" />

      <AppleSection
        eyebrow="Mekân"
        title="Bergama Bedesteni, yeniden nefes alıyor"
        subtitle="Yüzyılların ticaret hanı, sivil toplumun ortak evine dönüşüyor."
        description="Bedesten; kalın taş duvarları, kubbeli mekânı ve şehrin kalbindeki konumuyla Bergama'nın hafızası. Bu hafızayı silmeden, onu bugünün ihtiyaçlarına açıyoruz: koru-kullan dengesiyle, yaşayan bir yerleşke."
        badges={[{ kind: 'hangel', label: 'hangel derneği' }]}
        actions={[{ label: 'Yerleşkeye katıl', href: '/bergama/yerleske/katil', variant: 'primary' }]}
      />

      {/* ALANLAR */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Mekân planı"
          title="Tek yapıda altı ayrı hayat"
          description="Bedesten'in özgün bölümleri, esnek ve çok amaçlı alanlara dönüştürülüyor. Her metrekare topluluğa hizmet ediyor."
        />
        <FeatureGrid items={ALANLAR} columns={3} />
      </section>

      {/* KORUMA YAKLAŞIMI */}
      <AppleSection
        compact
        eyebrow="Nasıl dönüştürüyoruz"
        title="Tarihe saygı, geleceğe alan"
        description="Bir tarihi yapıyı yeniden işlevlendirmek, ona zarar vermek değil; onu yeniden sevmektir. Üç temel taahhüdümüz var."
      >
        <FeatureGrid items={KORUMA} columns={3} />
      </AppleSection>

      {/* KONUM */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-[2rem] border border-black/5 bg-[#f5f5f7] p-8 md:p-12">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Konum</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight">Bergama Bedesteni</h3>
                  <p className="mt-1 text-muted-foreground">Bergama, İzmir · UNESCO Dünya Mirası kenti</p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Akropol, Asklepion ve Kızıl Avlu ile aynı tarihi dokuda; şehrin merkezinde, toplu taşımayla
                    ulaşılabilir bir noktada. Kesin adres ve ziyaret saatleri, açılış takvimiyle paylaşılacaktır.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <Landmark className="h-4 w-4" /> Açılış: 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-16 text-center text-white md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Mekânın kuruluşunda yer al</h2>
          <p className="mt-3 text-base text-white/70">Restorasyon, tasarım ve açılış sürecine gönüllü ya da destekçi olarak katılabilirsin.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold"><Link href="/bergama/yerleske/katil">Destek ol</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/20 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-black"><Link href="/bergama/yerleske/programlar">Programları gör</Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
