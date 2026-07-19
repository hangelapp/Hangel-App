'use client';

/**
 * /bergama/yerleske/stk — STK/dernek/vakıf/kooperatifler için ortak kullanım:
 * ne sunuyoruz, koşullar, başvuru adımları.
 */

import {
  HeartHandshake,
  MapPin,
  Warehouse,
  CalendarDays,
  Wifi,
  Users,
  FileCheck2,
  Handshake,
  Building2,
  CheckCircle2,
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

const SUNULAN: FeatureItem[] = [
  { icon: MapPin, title: 'Paylaşımlı adres & masa', description: 'Kayıtlı bir çalışma adresi ve rezerve edilebilir masalar; küçük ekipler için ideal.' },
  { icon: CalendarDays, title: 'Etkinlik & toplantı alanı', description: 'Genel kurul, eğitim ve etkinlikleriniz için önceden rezervasyonla salon kullanımı.' },
  { icon: Warehouse, title: 'Ortak depo', description: 'Malzeme, kumbara ve ekipmanınız için güvenli, paylaşımlı saklama alanı.' },
  { icon: Wifi, title: 'Dijital altyapı', description: 'İnternet, sunum ekipmanı ve hangel dijital araçlarına (panel, çağrı merkezi, CRM) erişim.' },
  { icon: Users, title: 'Ortak gönüllü havuzu', description: 'Yerleşkedeki gönüllü ağından yararlanma ve ortak çağrı yapabilme imkânı.' },
  { icon: Handshake, title: 'İş birliği & görünürlük', description: 'Diğer kurumlarla ortak proje, ortak fon başvurusu ve yerleşke iletişiminde yer alma.' },
];

const KOSULLAR = [
  'Yasal olarak kurulmuş dernek, vakıf, kooperatif veya sosyal girişim olmak.',
  'Kâr amacı gütmeyen, kamu yararına ya da sosyal fayda odaklı faaliyet yürütmek.',
  'Kolektif kullanım ilkelerine ve ortak yaşam kurallarına uymayı kabul etmek.',
  'Mekânı adil paylaşmak: rezervasyonlara ve diğer kurumların kullanım haklarına saygı.',
  'Şeffaflık: yerleşkede yürütülen faaliyetleri hangel ortak takvimiyle paylaşmak.',
];

const ADIMLAR = [
  { step: '01', title: 'Ön başvuru', text: 'Kurumunuzu ve ihtiyacınızı kısaca anlattığınız başvuru formunu doldurun.' },
  { step: '02', title: 'Tanışma görüşmesi', text: 'Yerleşke ekibiyle ihtiyaçlarınızı, kullanım biçiminizi ve beklentileri konuşalım.' },
  { step: '03', title: 'Ortak kullanım protokolü', text: 'Karşılıklı hak ve sorumlulukları belirleyen basit bir mutabakat imzalanır.' },
  { step: '04', title: 'Yerleşkeye taşın', text: 'Adresinizi tanımlayın, takvimde yerinizi alın ve üretmeye başlayın.' },
];

export default function StkPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="STK'lar için" ctaLabel="Başvur" ctaHref="/bergama/yerleske/katil" backLabel="Yerleşke" />

      <AppleSection
        eyebrow="Sivil toplum için"
        title="Kurumunun Bergama'da bir evi olsun"
        subtitle="Dernek, vakıf, kooperatif ve sosyal girişimler için ortak kullanım çatısı."
        description="Kira, aidat ve altyapı derdi olmadan; adres, alan, depo ve dijital araçları paylaşarak faaliyetlerinizi büyütün. Yerleşke, tek başına ayakta durmaya çalışan kurumları ortak bir güce dönüştürür."
        badges={[{ kind: 'hangel', label: 'hangel derneği' }]}
        actions={[
          { label: 'STK başvurusu yap', href: '/bergama/yerleske/katil', variant: 'primary' },
          { label: 'Kurumsal olanaklar', href: '/corporate', variant: 'link' },
        ]}
      />

      {/* SUNULAN */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Ne sunuyoruz" title="Ortak kullanımın avantajları" description="Tek bir kurumun tek başına karşılayamayacağını, birlikte karşılanabilir kılıyoruz." />
        <FeatureGrid items={SUNULAN} columns={3} />
      </section>

      {/* KOŞULLAR + ADIMLAR */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-2">
          {/* Koşullar */}
          <div className="rounded-[2rem] border border-black/5 bg-[#f5f5f7] p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <FileCheck2 className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Kimler başvurabilir?</h3>
            </div>
            <ul className="space-y-3">
              {KOSULLAR.map((k, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-[#1d1d1f]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Adımlar */}
          <div className="rounded-[2rem] border border-black/5 bg-black p-8 text-white">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Başvuru nasıl işler?</h3>
            </div>
            <ol className="space-y-4">
              {ADIMLAR.map((a) => (
                <li key={a.step} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{a.step}</span>
                  <div>
                    <h4 className="font-bold tracking-tight">{a.title}</h4>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/60">{a.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <HeartHandshake className="mx-auto mb-4 h-9 w-9" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Kurumunla yerleşkeye katıl</h2>
          <p className="mt-3 text-base opacity-90">Ön başvurunu birkaç dakikada tamamla; tanışma görüşmesi için seninle iletişime geçelim.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6 h-12 rounded-full bg-white px-8 font-bold text-primary hover:bg-white/90"><Link href="/bergama/yerleske/katil">Başvuruyu başlat</Link></Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
