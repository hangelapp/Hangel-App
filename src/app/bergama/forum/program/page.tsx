'use client';

/**
 * /bergama/forum/program — Pergamon Forumu iki günlük program akışı.
 * Gün 1: Geçmiş & Bugün. Gün 2: Gelecek & Eylem. Temsili taslak akış.
 */

import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';
import { MarketingNav, AppleSection, SectionHeading } from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';

type Slot = { time: string; title: string; desc: string; tag?: string };

const GUN1: Slot[] = [
  { time: '09.00', title: 'Kayıt & karşılama kahvesi', desc: 'Katılımcı karşılama, forum çantası ve tanışma.', tag: 'Açılış' },
  { time: '10.00', title: 'Açılış töreni', desc: 'hangel derneği ve Bergama\'dan açılış konuşmaları; forumun çağrısı.', tag: 'Sahne' },
  { time: '10.45', title: 'Ana konuşma: Pergamon\'un mirası', desc: 'Antik bir bilgi başkentinden bugüne ne kaldı? Miras ve kimlik üzerine.', tag: 'Keynote' },
  { time: '11.45', title: 'Panel: Kültürel miras & inovasyon', desc: 'Mirası dondurmadan yaşatmanın yolları; arkeoloji, teknoloji ve turizm.', tag: 'Panel' },
  { time: '13.00', title: 'Öğle & networking', desc: 'Yerel lezzetler eşliğinde serbest ağ kurma.', tag: 'Ara' },
  { time: '14.30', title: 'Atölyeler I', desc: 'Paralel atölyeler: dijital miras, sosyal girişim, kültür fonları.', tag: 'Atölye' },
  { time: '16.00', title: 'Panel: Bugünün sivil toplumu', desc: 'STK\'lar, kooperatifler ve dayanışma ekonomisi bugün nerede?', tag: 'Panel' },
  { time: '18.00', title: 'Akşam: Sahne & buluşma', desc: 'Bergama\'da kültür-sanat programı ve serbest buluşma.', tag: 'Sosyal' },
];

const GUN2: Slot[] = [
  { time: '09.30', title: 'Gün açılışı', desc: 'İkinci günün çağrısı: mirastan geleceğe.', tag: 'Açılış' },
  { time: '10.00', title: 'Ana konuşma: İyiliğin ölçeklenmesi', desc: 'Teknoloji ve topluluk gücüyle sosyal etkiyi büyütmek.', tag: 'Keynote' },
  { time: '11.00', title: 'Panel: Miras temelli kalkınma', desc: 'Şehirler mirasıyla nasıl kalkınır? Sürdürülebilir turizm ve yerel ekonomi.', tag: 'Panel' },
  { time: '12.15', title: 'Genç sesler sahnesi', desc: 'Gençlerin ve öğrencilerin geleceğe dair kısa ilham konuşmaları.', tag: 'Sahne' },
  { time: '13.00', title: 'Öğle & networking', desc: 'Ortak proje masaları; eşleşme oturumları.', tag: 'Ara' },
  { time: '14.30', title: 'Atölyeler II', desc: 'Uygulamalı atölyeler: proje tasarımı, fon bulma, iş birliği kurma.', tag: 'Atölye' },
  { time: '16.00', title: 'Ortak akıl oturumu', desc: 'Katılımcılarla forumun çıktısını birlikte yazıyoruz: Bergama Bildirgesi.', tag: 'Ortak akıl' },
  { time: '17.30', title: 'Kapanış & taahhütler', desc: 'Bergama Bildirgesi\'nin ilanı ve gelecek yılın çağrısı.', tag: 'Kapanış' },
];

function DayColumn({ label, date, theme_, slots }: { label: string; date: string; theme_: string; slots: Slot[] }) {
  const dark = theme_ === 'dark';
  return (
    <div className={dark ? 'rounded-[2rem] bg-black p-6 text-white md:p-8' : 'rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm md:p-8'}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{label}</p>
          <h3 className={dark ? 'mt-1 text-2xl font-bold tracking-tight text-white' : 'mt-1 text-2xl font-bold tracking-tight'}>{date}</h3>
        </div>
        <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <ol className="space-y-4">
        {slots.map((s, i) => (
          <li key={i} className={dark ? 'flex gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0' : 'flex gap-4 border-b border-black/5 pb-4 last:border-0 last:pb-0'}>
            <div className="w-14 shrink-0">
              <span className={dark ? 'inline-flex items-center gap-1 text-sm font-bold tabular-nums text-white' : 'inline-flex items-center gap-1 text-sm font-bold tabular-nums text-[#1d1d1f]'}>
                {s.time}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className={dark ? 'font-bold tracking-tight text-white' : 'font-bold tracking-tight'}>{s.title}</h4>
                {s.tag && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{s.tag}</span>}
              </div>
              <p className={dark ? 'mt-0.5 text-sm leading-relaxed text-white/60' : 'mt-0.5 text-sm leading-relaxed text-muted-foreground'}>{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ForumProgramPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Program" ctaLabel="Kayıt Ol" ctaHref="/bergama/forum/kayit" backLabel="Forum" />

      <AppleSection
        eyebrow="Program"
        title="İki gün, tek bir yolculuk"
        subtitle="Birinci gün mirası ve bugünü, ikinci gün geleceği ve eylemi konuşuyoruz."
        description="Aşağıdaki akış, ilk edisyon için hazırlanan temsili programdır. Kesin saatler, konuşmacı ve atölye başlıkları kayıt açıldıkça güncellenecektir."
        badges={[{ kind: 'hangel', label: 'hangel derneği' }]}
        actions={[{ label: 'Kayıt ol', href: '/bergama/forum/kayit', variant: 'primary' }]}
      />

      {/* KÜNYE */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 text-sm font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Eylül 2026 · 2 gün</span>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Bergama, İzmir</span>
          <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 09.00 – 18.00</span>
        </div>
      </section>

      {/* PROGRAM SÜTUNLARI */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <SectionHeading eyebrow="Akış" title="Günün saatleri" description="Paralel atölyeler ve networking araları; katılımcılar ilgi alanına göre kendi rotasını çizer." />
        <div className="mx-auto grid max-w-5xl gap-6 px-6 lg:grid-cols-2">
          <DayColumn label="1. Gün · Geçmiş & Bugün" date="Miras ve sivil toplum" theme_="light" slots={GUN1} />
          <DayColumn label="2. Gün · Gelecek & Eylem" date="Vizyon ve ortak akıl" theme_="dark" slots={GUN2} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <Ticket className="mx-auto mb-4 h-9 w-9" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Yerini şimdiden ayırt</h2>
          <p className="mt-3 text-base opacity-90">Program güncellendikçe kayıtlı katılımcılara ilk sen haber veriyoruz.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full bg-white px-8 font-bold text-primary hover:bg-white/90"><Link href="/bergama/forum/kayit">Kayıt ol</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-primary"><Link href="/bergama/forum/konusmacilar">Konuşmacılar</Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
