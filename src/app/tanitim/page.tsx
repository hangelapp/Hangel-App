'use client';

/**
 * /tanitim — hangel'in kısa ama etkili genel tanıtımı.
 *
 * Apple-temiz marka kimliği. Bireysel kullanıcı + kurumsal (STK/marka/kulüp)
 * tarafının bugünkü gerçek/canlı özelliklerini özetler, sonunda herkese açık
 * tanıtım/sunum materyallerini MarketingShowcase ile listeler.
 *
 * Koyu tema güvenli: yalnızca semantik token kullanılır.
 */

import React from 'react';
import Link from 'next/link';
import {
  Presentation as PresentationIcon,
  HeartHandshake,
  CalendarDays,
  Droplet,
  ShoppingBag,
  Library,
  Sparkles,
  Building2,
  Phone,
  Megaphone,
  FileBarChart,
  Award,
  ArrowRight,
} from 'lucide-react';
import { PublicFooter } from '@/components/layout/public-footer';
import { MarketingShowcase } from '@/components/marketing/marketing-showcase';

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
};

const INDIVIDUAL: Feature[] = [
  {
    icon: HeartHandshake,
    title: 'Gönüllülük',
    description:
      'Etkinlik ve gönüllülük ilanlarına başvur, QR/NFC ile check-in yap, bittiğinde otomatik sertifikanı ve etki puanını al.',
    href: '/volunteering',
  },
  {
    icon: CalendarDays,
    title: 'Etkinlikler',
    description:
      'Otomatik canlı mod ve geri sayım, takvime ekle (.ics) ve Apple Wallet bileti — etkinlik cebinde.',
    href: '/events',
  },
  {
    icon: Droplet,
    title: 'Acil Kan Bağışı',
    description:
      'Talep oluştur ya da yanıtla, en yakın hastaneyi gör; Apple Watch SOS ile saniyeler içinde haber ver.',
    href: '/emergency',
  },
  {
    icon: ShoppingBag,
    title: 'Ürünleri Keşfet',
    description:
      'Ödeme yok. Bağış hep marka aracılı: tıkla-alışveriş ya da indir-kullan ile bağış oranlı ürünlerden destek ol.',
    href: '/market/discover',
  },
  {
    icon: Library,
    title: 'Veri Kütüphanesi',
    description:
      '200+ kaynak (uluslararası + Türkiye), filtreli. Sahadaki herkes için tek bir bilgi merkezi.',
    href: '/library',
  },
  {
    icon: Sparkles,
    title: 'Etki Hikayem',
    description:
      'Yıllık/aylık Wrapped, günlük seri (streak), Etki Haritan, rozetler ve lider tablosu — emeğin görünür.',
    href: '/etki-hikayem',
  },
];

const CORPORATE: Feature[] = [
  {
    icon: Building2,
    title: 'Ücretsiz Yönetim Paneli',
    description:
      'STK, marka ve kulüpler için tamamen ücretsiz panel: profil, QR, topluluk daveti, ekip ve rol yönetimi.',
    href: '/ngo-admin',
  },
  {
    icon: CalendarDays,
    title: 'Etkinlik & Gönüllülük',
    description:
      'Etkinlik ve gönüllülük ilanı oluştur, katılımcı yönet; otomatik sertifika ve değerlendirme.',
  },
  {
    icon: Phone,
    title: 'Çağrı Merkezi',
    description:
      'Tarayıcıdan WebRTC ile gerçek arama. Kendi santralin, kulaklığını tak ve görüşmeye başla.',
  },
  {
    icon: Megaphone,
    title: 'Reklam Yönetimi',
    description:
      'Google Ad Grants, Meta ve TikTok’u panelden bağla, yayına al. Workspace toplu mail ve SMS/mail kotası dahil.',
  },
  {
    icon: FileBarChart,
    title: 'AI Sürdürülebilirlik Raporu',
    description:
      'Apple standardında rapor + proje yazma asistanı, şeffaflık skoru, CRM, muhasebe ve hak ediş (payout) takibi.',
  },
  {
    icon: Award,
    title: 'Kendi Sitesi & Ürün Feed’i',
    description:
      'Kurumsal site yayını (*.hangel.org.tr) ve ürün feed/PIM — markalar bağış oranıyla ürün listeler.',
  },
];

function FeatureCard({ icon: Icon, title, description, href }: Feature) {
  const inner = (
    <>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
        {title}
        {href && <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden="true" />}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </>
  );
  const base =
    'group block rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md';
  return href ? (
    <Link href={href} className={base}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

export default function TanitimPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 flex flex-col">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-5">
            <PresentationIcon className="h-3.5 w-3.5" /> hangel Tanıtım
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground">
            Umudu Büyütüyoruz 🧡
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            hangel; gönüllülük, etkinlik, acil yardım ve sosyal etki için bütünleşik bir platform.
            Yok öyle yalnız başına mücadele etmek — toplumsal sorunlar için birlikte çalışıyoruz.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/volunteering"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Gönüllülüğü Keşfet <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register-organization"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:bg-muted"
            >
              Kurumunu Ekle
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-16">
        {/* Bireysel kullanıcı */}
        <section>
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Senin İçin</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Tek uygulamada bütün bir sosyal etki ekosistemi.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Gönüllülükten acil kan bağışına, bilgiden etki hikayene kadar; üstelik Apple Watch,
              ana ekran ve kilit ekranı widget’ları, Siri kısayolları ve Live Activity ile her an yanında.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INDIVIDUAL.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* Kurumsal */}
        <section>
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">STK · Marka · Kulüp</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Kurumun için tamamen ücretsiz, eksiksiz bir araç seti.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Etkinlik ve gönüllülükten çağrı merkezine, reklam yönetiminden AI sürdürülebilirlik
              raporuna kadar her şey tek panelde. Kütük/dernek otomatik eşleştirme ve sertifika
              üreteci dahil.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CORPORATE.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* Marka değeri bandı */}
        <section className="rounded-3xl border border-border bg-muted p-8 sm:p-10 text-center">
          <p className="text-lg sm:text-xl font-bold text-foreground leading-relaxed max-w-2xl mx-auto">
            “Yok öyle yalnız başına mücadele etmek.” Toplumsal sorunlar için birlikte çalışıyoruz.
          </p>
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-primary">#wearehangel</p>
        </section>

        {/* Herkese açık tanıtım & sunum materyalleri */}
        <section>
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Materyaller</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Tanıtım ve sunum materyalleri.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Konferans, etkinlik ve toplantılarınızda doğrudan açıp sunabilir veya indirebilirsiniz.
            </p>
          </div>
          <MarketingShowcase />
        </section>
      </main>

      <PublicFooter currentPageLabel="hangel Tanıtım" />
    </div>
  );
}
