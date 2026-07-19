'use client';

/**
 * /bergama/yerleske/katil — Yerleşkeye katılmanın yolları:
 * gönüllü, bağışçı, kurum (STK), destekçi. Her yol için net bir aksiyon.
 */

import {
  HandHeart,
  Users,
  HeartHandshake,
  Building2,
  Sparkles,
  Wrench,
  Mic,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import {
  MarketingNav,
  AppleSection,
  SectionHeading,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';

const YOLLAR = [
  {
    icon: Users,
    title: 'Gönüllü ol',
    text: 'Restorasyon, etkinlik, eğitim ya da topluluk çalışmalarında zamanını paylaş. Her beceri değerli.',
    cta: { label: 'Gönüllülükleri gör', href: '/volunteering' },
    tone: 'light' as const,
  },
  {
    icon: Gift,
    title: 'Bağış yap',
    text: 'Mekânın kurulmasına, programların ücretsiz kalmasına ve mirasın yaşamasına destek ol.',
    cta: { label: 'Bağış yap', href: '/donate' },
    tone: 'primary' as const,
  },
  {
    icon: HeartHandshake,
    title: 'Kurumunla katıl',
    text: 'Derneğin, vakfın ya da kooperatifinle ortak kullanım çatısına dahil ol.',
    cta: { label: 'STK başvurusu', href: '/bergama/yerleske/stk' },
    tone: 'light' as const,
  },
  {
    icon: Building2,
    title: 'Kurumsal destekçi ol',
    text: 'Şirketinle yerleşkeye sponsor ol; sosyal etki raporunu birlikte hazırlayalım.',
    cta: { label: 'Kurumsal iş birliği', href: '/corporate' },
    tone: 'light' as const,
  },
];

const KATKI_TURLERI = [
  { icon: Wrench, title: 'Emek', text: 'Ustalık, tasarım, restorasyon veya lojistik desteği.' },
  { icon: Mic, title: 'Bilgi', text: 'Eğitmenlik, mentorluk, atölye yürütücülüğü.' },
  { icon: Gift, title: 'Kaynak', text: 'Malzeme, ekipman, mobilya ya da nakdi bağış.' },
  { icon: Sparkles, title: 'Ağ', text: 'Kurumsal bağlantı, tanıtım ve iş birliği köprüsü.' },
];

export default function KatilPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Katıl & destek ol" ctaLabel="Bağış Yap" ctaHref="/donate" backLabel="Yerleşke" />

      <AppleSection
        eyebrow="Sen olmadan olmaz"
        title="Yerleşkeye katılmanın birçok yolu var"
        subtitle="Zamanınla, bilginle, kaynağınla ya da kurumunla."
        description="Bu yerleşke, katkı sunan herkesin ortak eseri. Sana en uygun yolu seç; Bergama'da geleceği birlikte kuralım."
        badges={[{ kind: 'hangel', label: 'hangel derneği' }]}
        actions={[
          { label: 'Bağış yap', href: '/donate', variant: 'primary' },
          { label: 'Gönüllü ol', href: '/volunteering', variant: 'link' },
        ]}
      />

      {/* KATILIM YOLLARI */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Katılım yolları" title="Sana en uygun olanı seç" />
        <div className="mx-auto grid max-w-4xl gap-5 px-6 sm:grid-cols-2">
          {YOLLAR.map((y) => {
            const Icon = y.icon;
            const primary = y.tone === 'primary';
            return (
              <div
                key={y.title}
                className={
                  primary
                    ? 'flex flex-col justify-between rounded-3xl bg-primary p-8 text-left text-primary-foreground shadow-lg'
                    : 'flex flex-col justify-between rounded-3xl border border-black/5 bg-white p-8 text-left shadow-sm'
                }
              >
                <div>
                  <div className={primary ? 'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20' : 'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10'}>
                    <Icon className={primary ? 'h-6 w-6 text-white' : 'h-6 w-6 text-primary'} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{y.title}</h3>
                  <p className={primary ? 'mt-2 text-sm leading-relaxed opacity-90' : 'mt-2 text-sm leading-relaxed text-muted-foreground'}>{y.text}</p>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant={primary ? 'secondary' : 'default'}
                  className={primary ? 'mt-6 h-11 rounded-full bg-white font-bold text-primary hover:bg-white/90' : 'mt-6 h-11 rounded-full font-bold'}
                >
                  <Link href={y.cta.href}>{y.cta.label}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* KATKI TÜRLERİ */}
      <AppleSection compact eyebrow="Her katkı sayılır" title="Sadece para değil, her şey işe yarar">
        <div className="mx-auto grid max-w-4xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {KATKI_TURLERI.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.title} className="rounded-3xl border border-black/5 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-bold tracking-tight">{k.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{k.text}</p>
              </div>
            );
          })}
        </div>
      </AppleSection>

      {/* CTA */}
      <section className="bg-black py-16 text-center text-white md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <HandHeart className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Bugün bir adım at</h2>
          <p className="mt-3 text-base text-white/70">Küçük bir katkı bile, Bergama'da kalıcı bir iz bırakır.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold"><Link href="/donate">Bağış yap</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/20 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-black"><Link href="/bergama/forum">Forumu keşfet</Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
