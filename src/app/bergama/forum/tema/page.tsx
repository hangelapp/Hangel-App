'use client';

/**
 * /bergama/forum/tema — Forumun teması ve manifestosu. "Geçmiş-bugün-gelecek"
 * eksenini derinleştirir; forumun neden var olduğunu anlatan çağrı metni.
 */

import { History, Lightbulb, Rocket, Quote, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { MarketingNav, AppleSection, SectionHeading } from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';

const EKSEN = [
  {
    icon: History,
    donem: 'Geçmiş',
    baslik: 'Bilgiyi paylaşan bir uygarlık',
    metin:
      'Pergamon, 200.000 tomarlık kütüphanesiyle antik dünyanın en büyük bilgi merkezlerinden biriydi. Parşömen burada gelişti; Asklepion\'da şifa, Akropol\'de sanat doğdu. Bergama bize bir şey öğretti: uygarlık, bilgiyi biriktiren değil, paylaşan yerlerde büyür.',
  },
  {
    icon: Lightbulb,
    donem: 'Bugün',
    baslik: 'Dayanışmanın yeni araçları',
    metin:
      'Bugün sosyal fayda; teknolojiyle, sivil toplumla ve kolektif akılla yeniden şekilleniyor. Ama kurumlar çoğu zaman yalnız, kaynaklar dağınık, miras ise vitrinde. Soru şu: Bergama\'nın "paylaşma" mirasını, bugünün araçlarıyla nasıl yeniden kurarız?',
  },
  {
    icon: Rocket,
    donem: 'Gelecek',
    baslik: 'Mirastan doğan bir gelecek',
    metin:
      'Gelecek, geçmişe rağmen değil; geçmişle birlikte kurulur. Miras temelli kalkınma, sürdürülebilir şehirler ve iyiliğin ölçeklenmesi mümkün. Pergamon Forumu, bu geleceği konuşmakla kalmaz; her yıl somut taahhütlerle bir adım daha atar.',
  },
];

const MANIFESTO = [
  'Miras, müzede değil hayatın içinde yaşamalı.',
  'Bilgi biriktirilmez, paylaşılır; güç bölüşüldükçe büyür.',
  'Sivil toplum yalnız değildir; ortak akıl ortak çözümdür.',
  'Yerel olan, küresele ilham verebilir. Bergama buna örnektir.',
  'Konuşmak yetmez; her forum bir taahhütle, bir eylemle biter.',
];

export default function TemaPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Tema & Manifesto" ctaLabel="Kayıt Ol" ctaHref="/bergama/forum/kayit" backLabel="Forum" />

      <AppleSection
        eyebrow="Tema"
        title="Geçmişten güç al, geleceği kur"
        subtitle="Pergamon Forumu'nun kalbindeki fikir."
        description="Her yıl aynı eksende toplanıyoruz: mirası anlamak, bugünü sorgulamak, geleceği tasarlamak. Bu üç zaman, birbirinden kopuk değil; aynı hikâyenin üç perdesi."
        badges={[{ kind: 'hangel', label: 'hangel derneği' }]}
        actions={[{ label: 'Foruma kayıt ol', href: '/bergama/forum/kayit', variant: 'primary' }]}
      />

      {/* EKSEN DERİNLEMESİNE */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Üç zaman, tek çizgi" title="Geçmiş · Bugün · Gelecek" />
        <div className="mx-auto max-w-3xl space-y-6 px-6">
          {EKSEN.map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.donem} className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{e.donem}</p>
                    <h3 className="text-xl font-bold tracking-tight">{e.baslik}</h3>
                  </div>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">{e.metin}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* MANİFESTO */}
      <section className="border-b border-black/5 bg-black py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <ScrollText className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Forum manifestosu</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Neye inanıyoruz?</h2>
          </div>
          <ul className="space-y-4">
            {MANIFESTO.map((m, i) => (
              <li key={i} className="flex items-start gap-4 rounded-3xl bg-white/[0.04] p-5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <p className="text-lg font-medium leading-relaxed">{m}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ALINTI */}
      <AppleSection compact eyebrow="Bergama'nın çağrısı" title="">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <Quote className="mx-auto mb-5 h-10 w-10 text-primary/30" aria-hidden="true" />
          <p className="text-2xl font-medium leading-relaxed tracking-tight text-[#1d1d1f] md:text-3xl">
            "Bir zamanlar dünyaya bilgiyi paylaşmayı öğreten bu şehir; şimdi de iyiliği paylaşmayı öğretsin."
          </p>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-primary">Pergamon İnovasyon Mirası Forumu</p>
        </div>
      </AppleSection>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Bu çağrıya sen de kulak ver</h2>
          <p className="mt-3 text-base opacity-90">Foruma katıl, sahnede yer al ya da gönüllü ol. Bergama'da geleceği birlikte yazalım.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6 h-12 rounded-full bg-white px-8 font-bold text-primary hover:bg-white/90"><Link href="/bergama/forum/kayit">Kayıt ol</Link></Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
