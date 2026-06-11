'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  UserCheck,
  Sparkles,
  Award,
  ClipboardCheck,
  TrendingUp,
  HandCoins,
  Building2,
  Landmark,
  ShoppingBag,
  ShieldCheck,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { PublicFooter } from '@/components/layout/public-footer';

const APPLY_URL = 'https://socialbusinessglobal.org';

const events = [
  { city: 'Tekirdağ', date: '13 Haziran Cuma', time: '14:30', venue: 'Tekirdağ' },
  { city: 'Antalya', date: '15 Haziran Pazar', time: '14:30', venue: 'Muratpaşa' },
  { city: 'Ankara', date: '17 Haziran Salı', time: '14:30', venue: 'Ankara Kent Konseyi' },
  { city: 'İstanbul', date: '24 Haziran Salı', time: '14:30', venue: 'Kadıköy' },
  { city: 'İstanbul', date: '25 Haziran Çarşamba', time: '14:30', venue: 'Avcılar' },
  { city: 'Bursa', date: '8 Temmuz Salı', time: '14:30', venue: 'Bursa' },
];

const curriculum = [
  {
    icon: HandCoins,
    title: 'Bağışçı Çeşitlendirme',
    desc: 'Tek kaynağa bağımlılıktan kurtulun. Bireysel, kurumsal ve düzenli bağış modellerini bir arada kurgulayın.',
  },
  {
    icon: Building2,
    title: 'Kurumsal İş Birlikleri',
    desc: 'Markalarla sürdürülebilir sponsorluk ve sosyal sorumluluk protokolleri tasarlayın, doğru teklifi hazırlayın.',
  },
  {
    icon: ShoppingBag,
    title: 'Alışverişle Bağış Modeli',
    desc: 'Destekçilerinizin günlük alışverişini düzenli gelire dönüştüren hangel Bağış ekosistemini öğrenin.',
  },
  {
    icon: Landmark,
    title: 'Hibe ve Fon Yazımı',
    desc: 'Ulusal ve uluslararası fonlara kazandıran proje başvurusu nasıl yazılır, bütçe nasıl kurulur?',
  },
  {
    icon: Lightbulb,
    title: 'Sosyal Girişimcilik',
    desc: 'İktisadi işletme, sosyal girişim ve gelir getirici faaliyetlerle kurumunuzu mali olarak güçlendirin.',
  },
  {
    icon: ShieldCheck,
    title: 'Şeffaflık ve Güven',
    desc: 'Şeffaflık endeksi ve raporlama ile bağışçı güvenini kazanın; güven, en güçlü gelir kaldıracınızdır.',
  },
];

const audience = [
  { icon: Users, title: 'Kimler Katılabilir?', desc: 'Dernek, vakıf ve spor kulüplerinin gönüllü ve yöneticilerine özeldir.' },
  { icon: UserCheck, title: 'Kontenjan', desc: 'Her STK için başkan + 2 kişilik kontenjan planlanmıştır.' },
  { icon: Sparkles, title: 'Genç Yöneticilere Öncelik', desc: 'Genç yöneticilere öncelik verilmesi önemle rica olunur.' },
  { icon: ClipboardCheck, title: 'Katılım Formu', desc: 'Katılım için lütfen başvuru formunu eksiksiz doldurunuz.' },
  { icon: Award, title: 'Sertifikalı', desc: 'Konferans katılımcılarına resmî katılım sertifikası verilir.' },
];

const SupportBadge = () => (
  <p className="text-xs text-muted-foreground leading-relaxed">
    Bu proje, <strong className="text-foreground">İç İşleri Bakanlığı Sivil Toplum Kuruluşları Genel Müdürlüğü</strong> tarafından desteklenmektedir.
  </p>
);

export default function IncomeModelConferencePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-[#1d1d1f]/80">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
          </Button>
          <div className="flex items-center gap-4 text-[12px] font-medium text-[#1d1d1f]/80">
            <span className="hidden sm:inline">Gelir Modeli Konferansları</span>
            <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
              <Link href={APPLY_URL} target="_blank" rel="noopener noreferrer">Başvur</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-white pt-28 pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
            <TrendingUp className="h-3.5 w-3.5" /> Ücretsiz Eğitim Konferansı · Sertifikalı
          </span>
          <p className="mt-6 text-lg font-medium text-muted-foreground">Sivil Toplum Kuruluşlarında</p>
          <h1 className="mt-1 text-4xl sm:text-6xl font-black tracking-tighter text-[#1d1d1f] leading-[1.05]">
            Gelir Modeli Oluşturma<br />ve Sürdürülebilirlik
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            STK&apos;nızın yarınını bugün güvence altına alın. Tek bir bağışa bağlı kalmadan, sürdürülebilir ve çeşitlendirilmiş bir gelir modeli kurmanın yollarını uzmanlarla birlikte keşfedin.
          </p>
          <p className="mt-4 text-lg font-semibold text-primary italic">&ldquo;Yok öyle yalnız başına mücadele etmek!&rdquo;</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold shadow-xl shadow-primary/20">
              <Link href={APPLY_URL} target="_blank" rel="noopener noreferrer">Hemen Başvur</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 font-bold border-black/10">
              <Link href="#takvim">Takvimi Gör</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Takvim */}
      <section id="takvim" className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">6 Şehir, 6 Buluşma</h2>
          <p className="mt-2 text-muted-foreground">Size en yakın şehri seçin, yerinizi ayırtın.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e, i) => (
            <Card key={i} className="border-black/5 hover:border-primary/30 hover:shadow-lg transition-all">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold leading-tight">{e.city}</h3>
                  <p className="text-sm text-muted-foreground">{e.date} · {e.time}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-medium text-primary">
                    <MapPin className="h-3.5 w-3.5" /> {e.venue}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Müfredat */}
      <section className="bg-[#f5f5f7] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Bu Konferansta Ne Öğreneceksiniz?</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Teoriden öteye geçen, hemen uygulanabilir altı başlıkta sürdürülebilir gelir modelinin tüm yapı taşları.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="border-none bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold mb-1.5">{c.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Kimler katılabilir */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Katılım Koşulları</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {audience.map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.title} className="bg-card/60 border-black/5">
                <CardContent className="p-5 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">{a.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Yerinizi Ayırtın</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Kontenjan sınırlıdır. Katılım formunu doldurarak şehir seçiminizi yapın; ekibimiz katılım detaylarını sizinle paylaşsın.
          </p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-full px-8 font-bold">
            <Link href={APPLY_URL} target="_blank" rel="noopener noreferrer">
              Katılım Formunu Doldur <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Detaylı bilgi ve başvuru: <Link href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">socialbusinessglobal.org</Link>
          </p>
          <div className="mt-8 border-t border-black/5 pt-6">
            <SupportBadge />
          </div>
        </div>
      </section>

      <PublicFooter currentPageLabel="Gelir Modeli Konferansları" />
    </div>
  );
}
