'use client';

/**
 * /bergama/forum — Pergamon İnovasyon Mirası Forumu. Yılda bir, uluslararası.
 * Tek detaylı sayfa: tema (geçmiş-bugün-gelecek), program, konuşmacı çerçevesi,
 * manifesto, başvuru formu. Marka/dernek adı geçmez; bağış yok.
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
  Languages,
  Presentation,
  Landmark,
  FlaskConical,
  Palette,
  HeartHandshake,
  GraduationCap,
  Clock,
  ScrollText,
  Quote,
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

const UCLEME: FeatureItem[] = [
  { icon: History, title: 'Geçmiş — Miras', description: 'Pergamon\'un kütüphanesi, parşömeni, tıbbı ve sanatı. İnsanlığa bilgiyi paylaşmayı öğreten bir uygarlığın izleri.' },
  { icon: Lightbulb, title: 'Bugün — İnovasyon', description: 'Sosyal girişimcilik, sivil toplum, kültürel miras teknolojileri ve dayanışma ekonomisi bugün nerede duruyor?' },
  { icon: Rocket, title: 'Gelecek — Vizyon', description: 'Miras temelli kalkınma, sürdürülebilir şehirler ve iyiliğin ölçeklenmesi için önümüzdeki on yılın haritası.' },
];

const NEDEN: FeatureItem[] = [
  { icon: Globe2, title: 'Uluslararası ölçek', description: 'Farklı ülkelerden bilim insanları, tasarımcılar, STK\'lar ve karar vericiler Bergama\'da bir araya gelir.' },
  { icon: Mic2, title: 'Fikir + eylem', description: 'Sadece konuşulmaz; oturumlar somut iş birliklerine, ortak projelere ve taahhütlere dönüşür.' },
  { icon: Languages, title: 'Çift dilli', description: 'Türkçe ve İngilizce eşzamanlı çeviri; forum, yereli küreselle aynı masada buluşturur.' },
  { icon: Presentation, title: 'Yaşayan miras sahnesi', description: 'Oturumlar tarihi dokuda; Bergama\'nın Akropol, Asklepion ve Bedesten atmosferinde gerçekleşir.' },
];

const KONUSMACI_PROFILLER: FeatureItem[] = [
  { icon: Landmark, title: 'Arkeologlar & tarihçiler', description: 'Pergamon ve antik dünya uzmanları; mirasın bugüne söyledikleri.' },
  { icon: FlaskConical, title: 'Bilim insanları', description: 'Kültürel miras teknolojileri, dijital arşivleme ve sürdürülebilirlik araştırmacıları.' },
  { icon: HeartHandshake, title: 'Sivil toplum liderleri', description: 'Dernek, vakıf ve kooperatiflerden sahada etki yaratan isimler.' },
  { icon: Palette, title: 'Tasarımcılar & sanatçılar', description: 'Mirası çağdaş üretime taşıyan tasarımcılar, zanaatkârlar ve sanatçılar.' },
  { icon: Rocket, title: 'Sosyal girişimciler', description: 'İyiliği ölçeklendiren iş modelleri kuran kurucular ve yatırımcılar.' },
  { icon: GraduationCap, title: 'Genç sesler', description: 'Öğrenciler ve genç liderler; geleceğe dair kısa ilham konuşmaları.' },
];

type Slot = { time: string; title: string; tag?: string };
const GUN1: Slot[] = [
  { time: '10.00', title: 'Açılış & ana konuşma: Pergamon\'un mirası', tag: 'Sahne' },
  { time: '11.45', title: 'Panel: Kültürel miras & inovasyon', tag: 'Panel' },
  { time: '14.30', title: 'Atölyeler I: dijital miras, sosyal girişim, fonlar', tag: 'Atölye' },
  { time: '16.00', title: 'Panel: Bugünün sivil toplumu', tag: 'Panel' },
  { time: '18.00', title: 'Akşam: kültür-sanat programı & buluşma', tag: 'Sosyal' },
];
const GUN2: Slot[] = [
  { time: '10.00', title: 'Ana konuşma: İyiliğin ölçeklenmesi', tag: 'Sahne' },
  { time: '11.00', title: 'Panel: Miras temelli kalkınma', tag: 'Panel' },
  { time: '12.15', title: 'Genç sesler sahnesi', tag: 'Sahne' },
  { time: '14.30', title: 'Atölyeler II: proje tasarımı, fon bulma, iş birliği', tag: 'Atölye' },
  { time: '16.00', title: 'Ortak akıl oturumu: Bergama Bildirgesi', tag: 'Ortak akıl' },
  { time: '17.30', title: 'Kapanış & taahhütler', tag: 'Kapanış' },
];

const MANIFESTO = [
  'Miras, müzede değil hayatın içinde yaşamalı.',
  'Bilgi biriktirilmez, paylaşılır; güç bölüşüldükçe büyür.',
  'Sivil toplum yalnız değildir; ortak akıl ortak çözümdür.',
  'Yerel olan, küresele ilham verebilir. Bergama buna örnektir.',
  'Konuşmak yetmez; her forum bir taahhütle, bir eylemle biter.',
];

function DayCol({ label, slots, dark }: { label: string; slots: Slot[]; dark?: boolean }) {
  return (
    <div className={dark ? 'rounded-[2rem] bg-black p-6 text-white md:p-8' : 'rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm md:p-8'}>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{label}</p>
        <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <ol className="space-y-3">
        {slots.map((s, i) => (
          <li key={i} className={`flex gap-3 border-b pb-3 last:border-0 last:pb-0 ${dark ? 'border-white/10' : 'border-black/5'}`}>
            <span className={`w-12 shrink-0 text-sm font-bold tabular-nums ${dark ? 'text-white' : 'text-[#1d1d1f]'}`}>{s.time}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${dark ? 'text-white' : ''}`}>{s.title}</p>
              {s.tag && <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{s.tag}</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ForumPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Pergamon Forumu" ctaLabel="Başvuruda bulun" ctaHref="#basvuru" backLabel="Bergama" />

      {/* HERO — koyu, sahne hissi */}
      <AppleSection
        theme="dark"
        eyebrow="yılda bir · uluslararası"
        title="Pergamon İnovasyon Mirası Forumu"
        subtitle="Geçmiş, bugün ve gelecek; aynı sahnede."
        description="Binlerce yıl önce dünyanın bilgi başkentlerinden biri olan Pergamon'da; mirası, inovasyonu ve sivil toplumu buluşturan uluslararası bir forum. Her yıl Bergama'da, insanlığın ortak geleceğini konuşmak için toplanıyoruz."
        badges={[{ kind: 'yeni' }]}
        actions={[
          { label: 'Başvuruda bulun', href: '#basvuru', variant: 'primary' },
          { label: 'Programı gör', href: '#program', variant: 'secondary' },
        ]}
      />

      {/* KÜNYE */}
      <section className="border-b border-black/5 bg-black py-10 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 text-center md:grid-cols-4">
          {[
            { icon: CalendarDays, label: 'Tarih', value: 'Her yıl Eylül' },
            { icon: MapPin, label: 'Yer', value: 'Bergama, İzmir' },
            { icon: Languages, label: 'Dil', value: 'TR / EN' },
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

      {/* NEDEN */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Neden bu forum" title="Konuşmaktan öte, birlikte üretmek" description="Pergamon Forumu bir konferans değil; bir buluşma, bir tohum, bir ortak akıl atölyesi." />
        <FeatureGrid items={NEDEN} columns={4} />
      </section>

      {/* PROGRAM */}
      <section id="program" className="border-b border-black/5 bg-white py-20 md:py-28">
        <SectionHeading
          eyebrow="Program"
          title="İki gün, tek bir yolculuk"
          description="Birinci gün mirası ve bugünü, ikinci gün geleceği ve eylemi konuşuyoruz. Aşağıdaki akış ilk edisyon için temsilidir; kesin saat ve başlıklar güncellenecektir."
        />
        <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 text-sm font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 09.00 – 18.00</span>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Bergama, İzmir</span>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 px-6 lg:grid-cols-2">
          <DayCol label="1. Gün · Geçmiş & Bugün" slots={GUN1} />
          <DayCol label="2. Gün · Gelecek & Eylem" slots={GUN2} dark />
        </div>
      </section>

      {/* KONUŞMACILAR */}
      <AppleSection
        compact
        eyebrow="Konuşmacılar"
        title="Farklı disiplinler, tek sahne"
        description="Forum; tek bir alanın değil, birbirini besleyen birçok disiplinin sahnesi. İlk edisyonun konuşmacıları açıklandıkça duyurulacak. Aşağıdaki alanlardan sesler davet ediyoruz — önerini veya kendi başvurunu formdan iletebilirsin."
      >
        <FeatureGrid items={KONUSMACI_PROFILLER} columns={3} />
      </AppleSection>

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
          <div className="mt-10 text-center">
            <Quote className="mx-auto mb-4 h-8 w-8 text-primary/40" aria-hidden="true" />
            <p className="mx-auto max-w-xl text-xl font-medium leading-relaxed tracking-tight md:text-2xl">
              "Bir zamanlar dünyaya bilgiyi paylaşmayı öğreten bu şehir; şimdi de iyiliği paylaşmayı öğretsin."
            </p>
          </div>
        </div>
      </section>

      {/* BAŞVURU FORMU */}
      <section id="basvuru" className="bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading
          eyebrow="Kayıt & katıl"
          title="Eylül 2026'da Bergama'da buluşalım"
          description="Katılımcı, konuşmacı, gönüllü ya da kurumunla; ilk Pergamon İnovasyon Mirası Forumu'na başvur. Kayıtlar açıldıkça ve program güncellendikçe ilk sen haberdar ol."
        />
        <div className="px-6">
          <BergamaForm
            kaynak="forum"
            title="Foruma başvur"
            description="Katılım tipini seç, bilgilerini bırak; seninle iletişime geçelim."
            ilgiSecenekleri={['Katılımcı', 'Konuşmacı / öneri', 'Gönüllülük', 'Kurumsal / STK', 'Bireysel destekçi ol']}
          />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
