'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ShoppingBag,
  ShieldCheck,
  Lightbulb,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PublicFooter } from '@/components/layout/public-footer';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import type { Event } from '@/lib/types';

const APPLY_URL = 'https://socialbusinessglobal.org';
const SERIES_TAG = 'gelir-modeli-konferansi';

// Firestore'da etkinlik yoksa/yüklenirken gösterilecek poster takvimi (fallback).
const fallbackSchedule = [
  {
    city: 'Ankara',
    date: '17 Haziran Çarşamba',
    time: '14:00',
    venue: 'Ankara Kent Konseyi Opera',
    address: 'Hacı Bayram Mh. Atatürk Bulvarı No:18 Altındağ, Ankara',
  },
  {
    city: 'Antalya, Muratpaşa',
    date: '19 Haziran Cuma',
    time: '14:00',
    venue: 'Abdullah Sevimçok Sivil Toplum ve İnovasyon Merkezi',
    address: 'Doğuyaka Mah. 1219 Sk. No:9 Muratpaşa, Antalya',
  },
  {
    city: 'İstanbul, Kadıköy',
    date: '24 Haziran Çarşamba',
    time: '14:00',
    venue: 'Sanatçı Fabrikası Coffee',
    address: 'Bağdat Cad. No:312 Caddebostan, Kadıköy, İstanbul',
  },
  {
    city: 'İstanbul, Avcılar',
    date: '25 Haziran Perşembe',
    time: '14:00',
    venue: 'Barış Manço Kültür Merkezi Merkez',
    address: 'Merkez, Reşit Paşa Cd. No:63, 34310 Avcılar, İstanbul',
  },
  {
    city: 'Tekirdağ',
    date: '26 Haziran Cuma',
    time: '14:00',
    venue: 'Arsera Cafe & Events',
    address: 'Değirmenaltı, Adnan Karaevli Sk. 28/A Süleymanpaşa, Tekirdağ',
  },
  {
    city: 'Bursa, Nilüfer',
    date: '8 Temmuz',
    time: '14:00',
    venue: 'Nilüfer Belediyesi Kültür Merkezi',
    address: 'Nilüfer, Bursa',
  },
];

// Yakında açılacak şehirler — tarih/yer netleşince Firestore etkinliğine dönüştürülür.
const comingSoonCities = ['Batman', 'Adana', 'Manisa', 'Diyarbakır'];

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

// Ulusal/uluslararası kuruluşların STK'lara verdiği hibe ve destekler + nasıl başvurulur.
const grants = [
  {
    name: 'Google for Nonprofits',
    offer: 'Ad Grants ile aylık 10.000 $ değerinde ücretsiz Google Ads reklam kredisi + ücretsiz Google Workspace ve YouTube ayrıcalıkları.',
    how: 'TechSoup üzerinden kurum doğrulaması yapın, ardından google.com/nonprofits üzerinden başvurun.',
    href: 'https://www.google.com/nonprofits/',
  },
  {
    name: 'Canva for Nonprofits',
    offer: "STK'lara ücretsiz Canva Pro: sınırsız tasarım, marka kiti, ekip çalışması ve premium görsel arşivi.",
    how: 'Kuruluş belgelerinizle canva.com/canva-for-nonprofits sayfasından başvurun; onay genelde birkaç gün sürer.',
    href: 'https://www.canva.com/canva-for-nonprofits/',
  },
  {
    name: 'Help Steps',
    offer: 'Kullanıcıların attığı adımları bağışa dönüştüren mobil platform; STK\'lar kampanya açarak sponsor markalardan fon toplar.',
    how: 'Help Steps STK paneline kayıt olun, kampanyanızı oluşturun ve sponsorlarla eşleşin.',
    href: 'https://helpsteps.com/',
  },
  {
    name: 'hangel',
    offer: 'Alışverişle bağış, şeffaflık endeksi, gönüllülük ve reklam yönetimi — tek panelde, tamamen ücretsiz sürdürülebilir gelir altyapısı.',
    how: 'hangel STK başvurusunu doldurun; kurumunuz onaylandığında panel anında aktifleşir.',
    href: '/ngo-onboarding',
  },
  {
    name: 'Ability Pool',
    offer: 'Pro-bono yetenek havuzu: tasarımcı, yazılımcı, hukukçu ve danışmanların STK projelerine ücretsiz uzman desteği.',
    how: 'Kurumunuzu ve ihtiyaç duyduğunuz yetkinliği tanımlayın; uygun gönüllü uzmanlarla eşleşin.',
    href: 'https://abilitypool.org/',
  },
  {
    name: 'Gönüllüyüz Biz',
    offer: 'Kurumsal gönüllülük programları; şirket çalışanlarını STK projelerine gönüllü ve kaynak olarak yönlendirir.',
    how: 'STK olarak projenizi platforma ekleyin; kurumsal gönüllü ekiplerden destek talep edin.',
    href: 'https://www.gonulluyuzbiz.com/',
  },
];

const audience = [
  { icon: Users, title: 'Kimler Katılabilir?', desc: 'Dernek, vakıf ve spor kulüplerinin gönüllü ve yöneticilerine özeldir.' },
  { icon: UserCheck, title: 'Kontenjan', desc: 'Her STK için başkan + 2 kişilik kontenjan planlanmıştır.' },
  { icon: Sparkles, title: 'Genç Yöneticilere Öncelik', desc: 'Genç yöneticilere öncelik verilmesi önemle rica olunur.' },
  { icon: ClipboardCheck, title: 'Kayıt', desc: 'Katılmak istediğiniz şehri seçip giriş yaparak kaydınızı oluşturun.' },
  { icon: Award, title: 'Sertifikalı', desc: 'Konferans katılımcılarına resmî katılım sertifikası verilir.' },
];

const SupportBadge = () => (
  <p className="text-xs text-muted-foreground leading-relaxed">
    Bu proje, <strong className="text-foreground">İç İşleri Bakanlığı Sivil Toplum Kuruluşları Genel Müdürlüğü</strong> tarafından desteklenmektedir.
  </p>
);

// Etkinlik kartı — etkinlik sayfasındaki gibi; tıklanınca /events/[slug] kayıt akışına gider.
function EventCard({ ev }: { ev: Event & { id: string } }) {
  const href = `/events/${ev.slug || ev.id}`;
  const capacityLabel = ev.capacity?.max ? `${ev.capacity.current ?? 0}/${ev.capacity.max} kayıt` : 'Kontenjan açık';
  return (
    <Link href={href} className="group block focus:outline-none">
      <Card className="overflow-hidden flex flex-col h-full border-border hover:border-primary/30 hover:shadow-lg transition-all rounded-2xl">
        <div className="relative aspect-[16/10] w-full bg-muted">
          {ev.imageUrl ? (
            <Image src={ev.imageUrl} alt={ev.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={ev.imageHint || 'konferans'} />
          ) : null}
          <div className="absolute top-2 left-2">
            <Badge className="bg-white/90 text-primary border-none font-bold text-[10px] uppercase tracking-wider">{ev.type || 'Konferans'}</Badge>
          </div>
        </div>
        <CardContent className="p-4 flex flex-col gap-1">
          <h3 className="text-lg font-bold leading-tight">{ev.location?.city || ev.name}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> {ev.date} · {ev.time || '14:00'}
          </p>
          <p className="flex items-center gap-1 text-sm font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" /> {ev.location?.district || ev.location?.city}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{capacityLabel}</span>
            <span className="text-sm font-semibold text-primary flex items-center group-hover:underline">
              Kayıt Ol <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function IncomeModelConferencePage() {
  const router = useRouter();
  const db = useFirestore();

  // Reklam dönüşüm izleme: UTM/gclid yakala → sessionStorage (kayıt sırasında atfedilebilir).
  // useSearchParams yerine window.location (Next 15 Suspense gereksinimi olmasın).
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];
      const attr: Record<string, string> = {};
      for (const k of keys) { const v = p.get(k); if (v) attr[k] = v; }
      if (Object.keys(attr).length > 0) {
        attr.page = 'gelir-modeli-konferanslari';
        attr.landedAt = new Date().toISOString();
        sessionStorage.setItem('hangel_ad_attribution', JSON.stringify(attr));
      }
    } catch { /* sessionStorage erişilemezse sessizce geç */ }
  }, []);

  const eventsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.events), where('tags', 'array-contains', SERIES_TAG)) : null),
    [db],
  );
  const { data: liveEventsRaw, isLoading } = useCollection<Event>(eventsQuery);

  const liveEvents = useMemo(() => {
    const list = (liveEventsRaw || []) as (Event & { id: string; status?: string })[];
    return [...list]
      .filter((e) => e.status === 'Yayında' || !e.status)
      .sort((a, b) => (a.startDate || a.date || '').localeCompare(b.startDate || b.date || ''));
  }, [liveEventsRaw]);

  const eventCount = (liveEvents.length || fallbackSchedule.length) + comingSoonCities.length;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pb-24 sm:pb-0">
      {/* Mobil sticky kayıt CTA — reklamdan gelen ziyaretçi her zaman görür (dönüşüm) */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-lg px-4 py-3 sm:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <Button asChild size="lg" className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20">
          <Link href="#takvim">Şehrini Seç, Ücretsiz Kayıt Ol 🧡</Link>
        </Button>
      </div>
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-muted-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
          </Button>
          <div className="flex items-center gap-4 text-[12px] font-medium text-muted-foreground">
            <span className="hidden sm:inline">Gelir Modeli Konferansları</span>
            <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
              <Link href="#takvim">Etkinliği Seç, Katıl</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-white pt-[calc(7rem+env(safe-area-inset-top))] pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Link
            href="/gelir-modeli-konferanslari/sunum"
            className="group inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 active:scale-95"
            title="Konferans sunumunu aç"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Ücretsiz Eğitim Konferansı · Sertifikalı
            <span className="ml-0.5 inline-flex items-center gap-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide group-hover:bg-primary/30">▶ Sunum</span>
          </Link>
          <p className="mt-6 text-lg font-medium text-muted-foreground">Sivil Toplum Kuruluşlarında</p>
          <h1 className="mt-1 text-4xl sm:text-6xl font-black tracking-tighter text-foreground leading-[1.05]">
            Gelir Modeli Oluşturma<br />ve Sürdürülebilirlik
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            STK&apos;nızın yarınını bugün güvence altına alın. Tek bir bağışa bağlı kalmadan, sürdürülebilir ve çeşitlendirilmiş bir gelir modeli kurmanın yollarını uzmanlarla birlikte keşfedin.
          </p>
          <p className="mt-4 text-lg font-semibold text-primary italic">&ldquo;Yok öyle yalnız başına mücadele etmek!&rdquo;</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold shadow-xl shadow-primary/20">
              <Link href="#takvim">Şehrini Seç, Kayıt Ol</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 font-bold border-border">
              <Link href={APPLY_URL} target="_blank" rel="noopener noreferrer">Başvuru Formu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Takvim — canlı etkinlik kartları */}
      <section id="takvim" className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Şehrini Seç, Yerini Ayırt</h2>
          <p className="mt-2 text-muted-foreground">
            {eventCount} şehir · {eventCount} etkinlik. Bir karta dokunup giriş yaparak kaydını oluştur — yakında yeni şehirler eklenecek.
          </p>
        </div>

        {liveEvents.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {liveEvents.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {fallbackSchedule.map((e, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold leading-tight">{e.city}</h3>
                    <p className="text-sm text-muted-foreground">{e.date} · {e.time}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium text-primary">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {e.venue}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.address}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {isLoading && <p className="col-span-full text-center text-sm text-muted-foreground">Etkinlikler yükleniyor…</p>}
          </div>
        )}

        {/* Yakında açılacak şehirler — tarih/yer netleşince etkinliğe dönüşür. */}
        <div className="mt-8">
          <h3 className="px-1 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Yakında Açılacak Şehirler</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comingSoonCities.map((city) => (
              <Card key={city} className="border-dashed border-primary/30 bg-primary/[0.02]">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold leading-tight">{city}</h4>
                    <p className="text-sm font-semibold text-primary">Yakında</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Tarih ve yer yakında açıklanacak</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Müfredat */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Bu Konferansta Ne Öğreneceksiniz?</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Teoriden öteye geçen, hemen uygulanabilir başlıklarda sürdürülebilir gelir modelinin yapı taşları.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="border-none bg-card shadow-sm">
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

          {/* Hibe ve Destekler — "Ne Öğreneceksiniz?" ile aynı zemin; eğitim içeriği */}
          <div className="mt-16 pt-12 border-t border-border">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Hibe ve Destekler: Nereye, Nasıl Başvurulur?</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Ulusal ve uluslararası kuruluşlar STK&apos;lara ücretsiz araç, fon ve uzman desteği sunar. İşte başlıca kapılar ve başvuru yolları.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grants.map((g) => {
            const external = g.href.startsWith('http');
            return (
              <Card key={g.name} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-lg font-bold mb-2">{g.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{g.offer}</p>
                  <div className="mt-3 rounded-xl bg-primary/5 p-3">
                    <p className="text-xs font-semibold text-primary mb-0.5">Nasıl başvurulur?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{g.how}</p>
                  </div>
                  <Link
                    href={g.href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    {external ? 'Başvuru sayfası' : 'hangel başvurusu'} {external ? <ExternalLink className="h-3.5 w-3.5" /> : <ChevronRight className="h-4 w-4" />}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
            </div>
          </div>
        </div>
      </section>

      {/* Katılım koşulları */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Katılım Koşulları</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {audience.map((a) => {
              const Icon = a.icon;
              return (
                <Card key={a.title} className="bg-card border-border">
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
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Yerinizi Ayırtın</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Kontenjan sınırlıdır. Şehrinizi seçip giriş yaparak kaydınızı oluşturun; katılım detaylarını sizinle paylaşalım.
          </p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-full px-8 font-bold">
            <Link href="#takvim">
              Şehrini Seç, Kayıt Ol <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Detaylı bilgi: <Link href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">socialbusinessglobal.org</Link>
          </p>
          <div className="mt-8 border-t border-border pt-6">
            <SupportBadge />
          </div>
        </div>
      </section>

      <PublicFooter currentPageLabel="Gelir Modeli Konferansları" />
    </div>
  );
}
