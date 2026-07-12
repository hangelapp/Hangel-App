'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Leaf,
  Recycle,
  Trophy,
  MapPin,
  Users,
  QrCode,
  Award,
  CalendarDays,
  Sparkles,
  HeartHandshake,
  Globe2,
  ShieldCheck,
  Camera,
  Scale,
  Timer,
  ClipboardCheck,
  ChevronRight,
  Mail,
  Flag,
} from 'lucide-react';
import { PublicFooter } from '@/components/layout/public-footer';

// Gönüllülük fırsatının vanity linki — "Gönüllü Ol / Katıl" buradan açılır.
const JOIN_URL = '/worldcleanday';
const CONTACT_EMAIL = 'info@socialbusinessglobal.org';
const EVENT_DATE = '19 Eylül 2026';

// Hero altındaki hızlı istatistik şeridi.
const heroStats = [
  { icon: Flag, value: '81', label: 'İlde eşzamanlı temizlik' },
  { icon: Users, value: '10.000+', label: 'Gönüllü hedefi' },
  { icon: Trophy, value: '1', label: 'Guinness Dünya Rekoru denemesi' },
  { icon: CalendarDays, value: '19 Eyl', label: 'Dünya Temizlik Günü 2026' },
];

// "Neden katılmalıyım?" maddeleri.
const reasons = [
  {
    icon: Leaf,
    title: 'Doğa İçin',
    desc: 'Sokaklarımızı, sahillerimizi ve doğal alanlarımızı bir günde birlikte temizliyoruz. Toplanan her kilo atık, daha yaşanabilir bir Türkiye demek.',
  },
  {
    icon: HeartHandshake,
    title: 'Toplumsal Dayanışma',
    desc: '81 il, tek yürek. Yaş, meslek ve şehir farkı olmadan aynı gün, aynı saatte omuz omuza vererek dayanışmanın gücünü gösteriyoruz.',
  },
  {
    icon: Globe2,
    title: 'Türkiye’yi Dünyaya Tanıtmak',
    desc: 'Bir Guinness Dünya Rekoru ile Türkiye’nin çevre bilincini ve gönüllülük kültürünü tüm dünyaya duyuruyoruz.',
  },
  {
    icon: Award,
    title: 'Dijital Sertifika',
    desc: 'Katılan her gönüllü, rekor denemesine katkısını belgeleyen resmî bir dijital katılım sertifikası kazanır.',
  },
];

// "Nasıl katılırım?" adımları.
const steps = [
  {
    icon: QrCode,
    step: '1',
    title: 'QR ile Kaydol',
    desc: 'Kampanya QR kodunu okut, birkaç saniyede gönüllü kaydını oluştur. Kayıt ücretsizdir.',
  },
  {
    icon: MapPin,
    step: '2',
    title: 'En Yakın Noktada Buluş',
    desc: '19 Eylül 2026 sabahı sana en yakın temizlik noktasında ekibinle buluş.',
  },
  {
    icon: Recycle,
    step: '3',
    title: 'Temizlik Yap',
    desc: 'Belirlenen zaman penceresinde, eldiven ve poşetlerle alanını temizle; topladığın atığı tart ve kaydet.',
  },
  {
    icon: Award,
    step: '4',
    title: 'Dijital Sertifikanı Al',
    desc: 'Check-in’in onaylandığında, rekora katkını gösteren dijital sertifikan e-postana gelir.',
  },
];

// Guinness rekor kurallarının özeti — "şeffaf ve resmî" vurgusu.
const rules = [
  {
    icon: Timer,
    title: 'Eşzamanlı Zaman Penceresi',
    desc: 'Tüm iller aynı gün, önceden ilan edilen ortak zaman aralığında temizliğe başlar.',
  },
  {
    icon: ClipboardCheck,
    title: 'Minimum Temizlik Süresi',
    desc: 'Her gönüllünün, katılımının geçerli sayılması için belirlenen asgari süre boyunca sahada temizlik yapması gerekir.',
  },
  {
    icon: Camera,
    title: 'Bağımsız Gözlem + Foto/Video Kanıt',
    desc: 'Her noktada bağımsız gözlemciler bulunur; katılım foto ve video ile kayıt altına alınır.',
  },
  {
    icon: Scale,
    title: 'Toplanan Atık (kg)',
    desc: 'Toplanan atık tartılır ve raporlanır; sayımlar denetlenebilir biçimde belgelenir.',
  },
];

export default function WorldCleanupDayPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pb-24 sm:pb-0">
      {/* Mobil sticky katıl CTA — ziyaretçi her zaman görür (dönüşüm) */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-lg px-4 py-3 sm:hidden"
        style={{ paddingBottom: 'calc(0.75rem + var(--sab))' }}
      >
        <Button asChild size="lg" className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20">
          <Link href={JOIN_URL}>Gönüllü Ol / Katıl 🧡</Link>
        </Button>
      </div>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[var(--sat)]">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-muted-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
          </Button>
          <div className="flex items-center gap-4 text-[12px] font-medium text-muted-foreground">
            <span className="hidden sm:inline">Dünya Temizlik Günü 2026</span>
            <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
              <Link href={JOIN_URL}>Gönüllü Ol</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-white pt-[calc(7rem+var(--sat))] pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
            <Leaf className="h-3.5 w-3.5" /> Dünya Temizlik Günü · Gönüllülük Kampanyası
          </span>
          <p className="mt-6 text-lg font-medium text-muted-foreground">Guinness Temizlik Rekoru</p>
          <h1 className="mt-1 text-4xl sm:text-6xl font-black tracking-tighter text-foreground leading-[1.05]">
            Dünya Temizlik Günü<br />Türkiye Tek Yürek
          </h1>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground/5 px-4 py-2 text-base sm:text-lg font-bold text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" /> {EVENT_DATE}
          </p>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            81 ilde eşzamanlı çevre temizliği ile bir <strong className="text-foreground">Guinness Dünya Rekoru</strong> deniyoruz.
            Sen de en yakın noktada bize katıl; birlikte hem doğayı temizleyelim hem de Türkiye’yi dünyaya tanıtalım.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold shadow-xl shadow-primary/20">
              <Link href={JOIN_URL}>
                Gönüllü Ol / Katıl <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 font-bold border-border">
              <Link href="#nasil">Nasıl Katılırım?</Link>
            </Button>
          </div>
        </div>

        {/* Hızlı istatistik şeridi */}
        <div className="mx-auto mt-12 max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {heroStats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-2xl font-black tracking-tight text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ne yapıyoruz? */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Ne Yapıyoruz?
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">81 İl, Tek Gün, Bir Dünya Rekoru</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Uluslararası Sosyal Fayda Derneği</strong> öncülüğünde, 19 Eylül 2026’da Türkiye’nin
              81 ilinde eşzamanlı bir çevre temizliği düzenliyoruz. Amacımız yalnızca sokaklarımızı temizlemek değil;
              aynı zamanda <strong className="text-foreground">dünyanın en çok katılımlı çok-konumlu temizlik etkinliği</strong> unvanını
              Türkiye’ye kazandırmak.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Her il, her ilçe, her mahalle aynı anda sahaya iniyor. QR ile denetlenebilir check-in, bağımsız gözlemciler ve
              foto/video kanıtları sayesinde katılım şeffaf biçimde sayılıyor. Böylece Türkiye, bu alandaki Guinness Dünya
              Rekoru’nu kırmaya çalışıyor.
            </p>
          </div>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                <Trophy className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold">En Çok Katılımlı Temizlik</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Dünyada en çok katılımlı çok-konumlu temizlik rekorunu Türkiye kırmaya çalışıyor. Sen de bu tarihi
                denemenin bir parçası olabilirsin — tek yapman gereken en yakın noktada bize katılmak.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary">Eşzamanlı</span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary">81 İl</span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary">Denetlenebilir</span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary">Resmî</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Neden katılmalıyım? */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Neden Katılmalıyım?</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Çevre, dayanışma ve gurur — bir günde üç şeyi birden başarıyoruz.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {reasons.map((r) => {
              const Icon = r.icon;
              return (
                <Card key={r.title} className="border-none bg-card shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold mb-1.5">{r.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Nasıl katılırım? */}
      <section id="nasil" className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Nasıl Katılırım?</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            4 kolay adımda gönüllü ol, sahaya in, sertifikanı kap.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.step} className="relative border-border">
                <CardContent className="p-6">
                  <span className="absolute right-4 top-4 text-4xl font-black text-primary/10">{s.step}</span>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold shadow-xl shadow-primary/20">
            <Link href={JOIN_URL}>
              Hemen Gönüllü Ol <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Guinness rekoru hakkında */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <Card className="order-2 lg:order-1 border-none bg-card shadow-sm">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-4xl font-black text-primary">~5.000</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-tight">Güncel rekor eşiği (kişi)</p>
                  </div>
                  <div>
                    <p className="text-4xl font-black text-primary">10.000+</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-tight">Türkiye’nin hedefi (kişi)</p>
                  </div>
                </div>
                <div className="mt-6 rounded-xl bg-primary/5 p-4 flex items-start gap-3">
                  <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    QR check-in ile katılım <strong className="text-foreground">denetlenebilir</strong> biçimde sayılır — her gönüllü tek tek doğrulanır.
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Trophy className="h-3.5 w-3.5" /> Guinness Dünya Rekoru
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Rekora Ne Kadar Yakınız?</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu kategorideki güncel rekor eşiği yaklaşık <strong className="text-foreground">5.000 kişi</strong>.
                Hedefimiz ise <strong className="text-foreground">10.000’den fazla gönüllüyü</strong> aynı gün sahaya indirmek —
                yani mevcut rekorun iki katı. QR ile yapılan check-in sayesinde her katılım tek tek doğrulanabildiği için,
                sayımlar Guinness kriterlerine uygun ve denetlenebilir kabul ediliyor.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Kısacası: <strong className="text-foreground">senin bir tıklaman bile rekora sayılıyor.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rekor kuralları (özet) */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Şeffaf ve Resmî
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Rekor Kuralları (Özet)</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Guinness Dünya Rekoru başvurusu net kurallara dayanır. Süreç baştan sona şeffaf ve resmî biçimde belgelenir.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rules.map((r) => {
            const Icon = r.icon;
            return (
              <Card key={r.title} className="border-border">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Kapanış CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Leaf className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Tek Bir Tıkla Tarihe Ortak Ol</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            19 Eylül 2026’da Türkiye tek yürek. Gönüllü ol, en yakın noktada buluş, doğayı temizle ve bir Guinness Dünya Rekoru’na katkını dijital sertifikanla belgele.
          </p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-full px-8 font-bold">
            <Link href={JOIN_URL}>
              Gönüllü Ol / Katıl <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>

          <div className="mt-8 rounded-2xl border border-border bg-card/60 p-5">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" /> Kurumsal katılımcı olmak ister misiniz?
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Kurumunuzla ekip olarak katılmak için bize yazın:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bu proje, <strong className="text-foreground">İç İşleri Bakanlığı Sivil Toplum Kuruluşları Genel Müdürlüğü</strong> tarafından desteklenmektedir.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter currentPageLabel="Dünya Temizlik Günü" />
    </div>
  );
}
