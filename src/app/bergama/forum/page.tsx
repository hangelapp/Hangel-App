'use client';

/**
 * /bergama/forum — Pergamon İnovasyon Mirası Forumu. Yılda bir, uluslararası.
 * Tema: geçmiş, bugün, gelecek. Alt sayfalar: /program, /konusmacilar, /tema, /kayit.
 */

import {
  Globe2,
  History,
  Lightbulb,
  Rocket,
  CalendarDays,
  MapPin,
  Users,
  Mic2,
  Ticket,
  Presentation,
  Languages,
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

/** Foruma kimlik veren "geçmiş-bugün-gelecek" üçlemesi. */
const UCLEME: FeatureItem[] = [
  {
    icon: History,
    title: 'Geçmiş — Miras',
    description: 'Pergamon\'un kütüphanesi, parşömeni, tıbbı ve sanatı. İnsanlığa bilgiyi paylaşmayı öğreten bir uygarlığın izleri.',
  },
  {
    icon: Lightbulb,
    title: 'Bugün — İnovasyon',
    description: 'Sosyal girişimcilik, sivil toplum, kültürel miras teknolojileri ve dayanışma ekonomisi bugün nerede duruyor?',
  },
  {
    icon: Rocket,
    title: 'Gelecek — Vizyon',
    description: 'Miras temelli kalkınma, sürdürülebilir şehirler ve iyiliğin ölçeklenmesi için önümüzdeki on yılın haritası.',
  },
];

const NEDEN: FeatureItem[] = [
  { icon: Globe2, title: 'Uluslararası ölçek', description: 'Farklı ülkelerden bilim insanları, tasarımcılar, STK\'lar ve karar vericiler Bergama\'da bir araya gelir.' },
  { icon: Mic2, title: 'Fikir + eylem', description: 'Sadece konuşulmaz; oturumlar somut iş birliklerine, ortak projelere ve taahhütlere dönüşür.' },
  { icon: Languages, title: 'Çift dilli', description: 'Türkçe ve İngilizce eşzamanlı çeviri; forum, yerelle küreseli aynı masada buluşturur.' },
  { icon: Presentation, title: 'Yaşayan miras sahnesi', description: 'Oturumlar tarihi dokuda; Bergama\'nın Akropol, Asklepion ve Bedesten atmosferinde gerçekleşir.' },
];

export default function ForumPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Pergamon Forumu" ctaLabel="Kayıt Ol" ctaHref="/bergama/forum/kayit" backLabel="Bergama" />

      {/* HERO — koyu tema, forum daha "sahne" hissi versin */}
      <AppleSection
        theme="dark"
        eyebrow="hangel derneği · yılda bir · uluslararası"
        title="Pergamon İnovasyon Mirası Forumu"
        subtitle="Geçmiş, bugün ve gelecek; aynı sahnede."
        description="2.300 yıl önce dünyanın bilgi başkentlerinden biri olan Pergamon'da; mirası, inovasyonu ve sivil toplumu buluşturan uluslararası bir forum. Her yıl Bergama'da, insanlığın ortak geleceğini konuşmak için toplanıyoruz."
        badges={[{ kind: 'yeni' }, { kind: 'hangel', label: 'hangel derneği' }]}
        actions={[
          { label: 'Kayıt ol', href: '/bergama/forum/kayit', variant: 'primary' },
          { label: 'Programı gör', href: '/bergama/forum/program', variant: 'secondary' },
        ]}
      />

      {/* KÜNYE ŞERİDİ */}
      <section className="border-b border-black/5 bg-black py-10 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 text-center md:grid-cols-4">
          {[
            { icon: CalendarDays, label: 'Tarih', value: 'Her yıl Eylül' },
            { icon: MapPin, label: 'Yer', value: 'Bergama, İzmir' },
            { icon: Ticket, label: 'İlk edisyon', value: 'Eylül 2026' },
            { icon: Users, label: 'Kimler', value: 'Herkese açık' },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="flex flex-col items-center">
                <Icon className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wide text-white/50">{k.label}</p>
                <p className="mt-0.5 font-bold">{k.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* GEÇMİŞ-BUGÜN-GELECEK */}
      <AppleSection
        compact
        eyebrow="Forumun ekseni"
        title="Geçmiş · Bugün · Gelecek"
        description="Her forum bu üç zamanı birbirine bağlar: mirastan öğrenir, bugünü sorgular, geleceği tasarlar."
      >
        <FeatureGrid items={UCLEME} columns={3} />
      </AppleSection>

      {/* NEDEN KATILMALI */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Neden bu forum" title="Konuşmaktan öte, birlikte üretmek" description="Pergamon Forumu bir konferans değil; bir buluşma, bir tohum, bir ortak akıl atölyesi." />
        <FeatureGrid items={NEDEN} columns={4} />
      </section>

      {/* ALT SAYFA NAVİGASYONU */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <SectionHeading eyebrow="Daha fazlası" title="Forumu keşfet" />
        <div className="mx-auto grid max-w-4xl gap-4 px-6 sm:grid-cols-2">
          {[
            { href: '/bergama/forum/program', icon: CalendarDays, title: 'Program', text: 'İki günlük akış, oturumlar ve atölyeler.' },
            { href: '/bergama/forum/konusmacilar', icon: Mic2, title: 'Konuşmacılar', text: 'Bilim, tasarım, sivil toplum ve miras alanından sesler.' },
            { href: '/bergama/forum/tema', icon: Lightbulb, title: 'Tema & manifesto', text: 'Geçmiş-bugün-gelecek ekseni ve forumun çağrısı.' },
            { href: '/bergama/forum/kayit', icon: Ticket, title: 'Kayıt', text: 'Katılımcı, konuşmacı veya gönüllü olarak dahil ol.' },
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
      <section className="bg-primary py-20 text-center text-primary-foreground md:py-28">
        <div className="mx-auto max-w-2xl px-6">
          <Globe2 className="mx-auto mb-5 h-10 w-10" aria-hidden="true" />
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Eylül 2026'da Bergama'da buluşalım</h2>
          <p className="mt-4 text-base leading-relaxed opacity-90 md:text-lg">
            İlk Pergamon İnovasyon Mirası Forumu'na kaydını yaptır; erken kayıt fırsatlarından ilk sen haberdar ol.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full bg-white px-8 font-bold text-primary hover:bg-white/90"><Link href="/bergama/forum/kayit">Kayıt ol</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-primary"><Link href="/bergama/forum/tema">Manifestoyu oku</Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
