'use client';

/**
 * /bergama/yerleske — Sosyal İnovasyon Yerleşkesi (Bergama Bedesteni dönüşümü).
 * Tek detaylı sayfa: mekân, programlar, STK ortak kullanım, koruma, başvuru formu.
 * Marka/dernek adı geçmez; bağış yok.
 */

import {
  Landmark,
  Recycle,
  GraduationCap,
  Rocket,
  Handshake,
  Coffee,
  Presentation,
  HeartHandshake,
  Sprout,
  Warehouse,
  BookOpen,
  Palette,
  Wifi,
  ShieldCheck,
  Leaf,
  Accessibility,
  MapPin,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import {
  MarketingNav,
  AppleSection,
  SectionHeading,
  FeatureGrid,
  type FeatureItem,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { BergamaForm } from '@/components/bergama/bergama-form';

const NELER: FeatureItem[] = [
  { icon: Presentation, title: 'Ortak çalışma & atölye alanları', description: 'Esnek masalar, toplantı odaları ve atölyeler. Bir dernek sabah kullanır, bir kooperatif öğleden sonra; mekân hiç boş kalmaz.' },
  { icon: GraduationCap, title: 'Eğitim & kapasite gelişimi', description: 'Proje yazımı, dijital okuryazarlık, fon bulma ve liderlik eğitimleri — çoğu ücretsiz.' },
  { icon: Rocket, title: 'Sosyal girişim kuluçkası', description: 'Bergama ve çevresinden sosyal girişimlere mentorluk, ağ ve alan desteği. Fikirden etkiye giden yolu kısaltıyoruz.' },
  { icon: HeartHandshake, title: 'STK ortak kullanım çatısı', description: 'Dernek, vakıf ve kooperatifler için paylaşımlı adres, depo, etkinlik alanı ve dijital altyapı.' },
  { icon: Coffee, title: 'Topluluk & buluşma', description: 'Halka açık kafe, sergi ve söyleşi alanı. Bergamalı hemşehriler, gönüllüler ve ziyaretçiler burada buluşur.' },
  { icon: Sprout, title: 'Miras & zanaat çalışmaları', description: 'Yerel zanaatları, parşömen kültürünü ve Bergama\'ya özgü üretimi yaşatan çağdaş tasarım atölyeleri.' },
];

const ALANLAR: FeatureItem[] = [
  { icon: Presentation, title: 'Ortak çalışma salonu', description: 'Esnek, taşınabilir mobilyalarla düzenlenen ana salon; gün içinde farklı ekiplere ev sahipliği yapar.' },
  { icon: BookOpen, title: 'Miras kütüphanesi', description: 'Pergamon\'un kütüphane geleneğine saygı: sivil toplum, tasarım ve yerel tarih kaynakları.' },
  { icon: Palette, title: 'Zanaat & tasarım atölyesi', description: 'Yerel üretim, parşömen kültürü ve çağdaş tasarımın buluştuğu üretim alanı.' },
  { icon: Warehouse, title: 'Paylaşımlı depo & lojistik', description: 'STK\'ların malzeme, kumbara ve etkinlik ekipmanını güvenle sakladığı ortak depo.' },
  { icon: Wifi, title: 'Dijital altyapı', description: 'İnternet, sunum ekipmanı ve dijital araçlara erişim; küçük ekipler için hazır ofis.' },
  { icon: Coffee, title: 'Topluluk kafesi & sergi', description: 'Halka açık sosyal kafe; duvarlar rotasyonlu sergiye ayrılır.' },
];

const ILKELER: FeatureItem[] = [
  { icon: Recycle, title: 'Kolektif bilinç', description: 'Mekân kimsenin tekelinde değil. Kullanım, bakım ve karar; katılan tüm paydaşlarca ortak yürütülür.' },
  { icon: Landmark, title: 'Koru ve kullan', description: 'Tarihi Bedesten\'in dokusuna dokunmadan onu yaşayan bir mekâna çeviriyoruz. Miras dondurulmaz, yaşatılır.' },
  { icon: Handshake, title: 'Herkese açık', description: 'Dil, inanç, siyaset gözetmeksizin; iyilik ve üretim için gelen herkese eşit mesafede bir ortak alan.' },
];

const KORUMA: FeatureItem[] = [
  { icon: ShieldCheck, title: 'Koruma önce gelir', description: 'Tüm müdahaleler ilgili koruma kurulu onayı ve uzman restorasyon rehberliğiyle yapılır; özgün doku korunur.' },
  { icon: Leaf, title: 'Sürdürülebilir dönüşüm', description: 'Enerji verimli aydınlatma, geri dönüştürülmüş mobilya ve düşük etkili yöntemlerle ekolojik bir yenileme.' },
  { icon: Accessibility, title: 'Herkes için erişilebilir', description: 'Engelsiz erişim, açık yönlendirme ve kapsayıcı tasarım; yerleşke ayrım gözetmeden herkese açık.' },
];

const STK_KOSULLAR = [
  'Yasal olarak kurulmuş dernek, vakıf, kooperatif veya sosyal girişim olmak.',
  'Kâr amacı gütmeyen, kamu yararına ya da sosyal fayda odaklı faaliyet yürütmek.',
  'Kolektif kullanım ilkelerine ve ortak yaşam kurallarına uymayı kabul etmek.',
  'Mekânı adil paylaşmak: rezervasyonlara ve diğer kurumların kullanım haklarına saygı.',
];

const RITIM = [
  { gun: 'Pazartesi', text: 'Açık ofis: serbest ortak çalışma + birebir mentorluk.' },
  { gun: 'Salı', text: 'Eğitim atölyeleri: proje yazımı, dijital okuryazarlık, liderlik.' },
  { gun: 'Çarşamba', text: 'Kuluçka & mentorluk: sosyal girişim ekipleriyle çalışma.' },
  { gun: 'Perşembe', text: 'Zanaat & tasarım; halka açık üretim atölyeleri.' },
  { gun: 'Cuma', text: 'Topluluk: söyleşi, gösterim, networking — herkese açık.' },
  { gun: 'Hafta sonu', text: 'Çocuk atölyeleri, gençlik programları, sergi açılışları.' },
];

export default function YerleskePage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Sosyal İnovasyon Yerleşkesi" ctaLabel="Başvuruda bulun" ctaHref="#basvuru" backLabel="Bergama" />

      {/* HERO */}
      <AppleSection
        eyebrow="Bergama · kalıcı mekân"
        title="Sosyal İnovasyon Yerleşkesi"
        subtitle="Tarihi Bergama Bedesteni'ni, sivil toplumun ortak evine dönüştürüyoruz."
        description="Yüzyıllarca ticaretin ve buluşmanın kalbi olan Bergama Bedesteni; şimdi STK'ların, girişimcilerin, gönüllülerin ve öğrencilerin birlikte ürettiği bir sosyal inovasyon yerleşkesine dönüşüyor. Kalıcı, paylaşımlı ve kolektif akılla yönetilen bir mekân."
        badges={[{ kind: 'yeni' }]}
        actions={[
          { label: 'Sunumu izle', href: '/bergama/yerleske/sunum', variant: 'primary' },
          { label: 'Başvuruda bulun', href: '#basvuru', variant: 'link' },
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

      {/* MEKÂN & ALANLAR */}
      <AppleSection
        compact
        eyebrow="Mekân planı"
        title="Bedesten, yeniden nefes alıyor"
        description="Bedesten'in özgün bölümleri; esnek, çok amaçlı ve topluluğa hizmet eden alanlara dönüştürülüyor."
      >
        <FeatureGrid items={ALANLAR} columns={3} />
      </AppleSection>

      {/* İLKELER */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Nasıl yönetiliyor"
          title="Kolektif akılla, ortak sorumlulukla"
          description="Bu yerleşke bir kurumun 'sahip olduğu' değil, bir topluluğun 'birlikte yaşattığı' bir mekân."
        />
        <FeatureGrid items={ILKELER} columns={3} />
      </section>

      {/* HAFTALIK RİTİM */}
      <AppleSection compact eyebrow="Örnek haftalık ritim" title="Yerleşkede bir hafta">
        <div className="mx-auto grid max-w-5xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {RITIM.map((r) => (
            <div key={r.gun} className="rounded-3xl border border-black/5 bg-white p-6 text-left shadow-sm">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                <CalendarDays className="h-3.5 w-3.5" /> {r.gun}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </AppleSection>

      {/* KORUMA */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Nasıl dönüştürüyoruz"
          title="Tarihe saygı, geleceğe alan"
          description="Bir tarihi yapıyı yeniden işlevlendirmek, ona zarar vermek değil; onu yeniden sevmektir."
        />
        <FeatureGrid items={KORUMA} columns={3} />
      </section>

      {/* STK ORTAK KULLANIM + KONUM */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-black/5 bg-[#f5f5f7] p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <HeartHandshake className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">STK'lar için ortak kullanım</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Kira, aidat ve altyapı derdi olmadan; adres, alan, depo ve dijital araçları paylaşarak faaliyetlerinizi büyütün.
              Başvurabilmek için:
            </p>
            <ul className="space-y-3">
              {STK_KOSULLAR.map((k, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-[#1d1d1f]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-black p-8 text-white">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Konum</h3>
            </div>
            <p className="text-lg font-bold">Bergama Bedesteni</p>
            <p className="mt-1 text-sm text-white/60">Bergama, İzmir · UNESCO Dünya Mirası kenti</p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Akropol, Asklepion ve Kızıl Avlu ile aynı tarihi dokuda; şehrin merkezinde, toplu taşımayla ulaşılabilir bir noktada.
              Kesin adres ve ziyaret saatleri açılış takvimiyle paylaşılacaktır.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
              <Landmark className="h-4 w-4 text-primary" /> Açılış hedefi: 2026
            </div>
          </div>
        </div>
      </section>

      {/* BAŞVURU FORMU */}
      <section id="basvuru" className="bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Katıl"
          title="Yerleşkenin bir taşı da senin olsun"
          description="Gönüllü ol, kurumunla ortak kullanıma katıl ya da bireysel destekçi ol. Bergama'nın ortak evini birlikte kuruyoruz."
        />
        <div className="px-6">
          <BergamaForm
            kaynak="yerleske"
            title="Yerleşkeye başvur"
            description="Ortak kullanım, gönüllülük veya bireysel destek için bilgilerini bırak."
            ilgiSecenekleri={['STK / kurum ortak kullanım', 'Gönüllülük', 'Eğitmen / mentor', 'Bireysel destekçi ol']}
          />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
