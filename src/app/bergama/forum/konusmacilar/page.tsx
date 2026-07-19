'use client';

/**
 * /bergama/forum/konusmacilar — Forumun konuşmacı çerçevesi. İlk edisyon için
 * gerçek isimler açıklandıkça eklenecek; şimdilik davet edilen profil alanları
 * ve "konuşmacı ol / öner" çağrısı.
 */

import {
  Mic2,
  Landmark,
  FlaskConical,
  Palette,
  HeartHandshake,
  Building2,
  GraduationCap,
  Sparkles,
  UserPlus,
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

const PROFILLER: FeatureItem[] = [
  { icon: Landmark, title: 'Arkeologlar & tarihçiler', description: 'Pergamon ve antik dünya uzmanları; mirasın bugüne söyledikleri.' },
  { icon: FlaskConical, title: 'Bilim insanları', description: 'Kültürel miras teknolojileri, dijital arşivleme ve sürdürülebilirlik araştırmacıları.' },
  { icon: HeartHandshake, title: 'Sivil toplum liderleri', description: 'Dernek, vakıf ve kooperatiflerden sahada etki yaratan isimler.' },
  { icon: Palette, title: 'Tasarımcılar & sanatçılar', description: 'Mirası çağdaş üretime taşıyan tasarımcılar, zanaatkârlar ve sanatçılar.' },
  { icon: Building2, title: 'Sosyal girişimciler', description: 'İyiliği ölçeklendiren iş modelleri kuran kurucular ve yatırımcılar.' },
  { icon: GraduationCap, title: 'Genç sesler', description: 'Öğrenciler ve genç liderler; geleceğe dair kısa ilham konuşmaları.' },
];

export default function KonusmacilarPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Konuşmacılar" ctaLabel="Konuşmacı Ol" ctaHref="/bergama/forum/kayit" backLabel="Forum" />

      <AppleSection
        theme="dark"
        eyebrow="Konuşmacılar"
        title="Farklı disiplinler, tek sahne"
        subtitle="Mirası, bilimi, tasarımı ve sivil toplumu buluşturan sesler."
        description="Pergamon Forumu; tek bir alanın değil, birbirini besleyen birçok disiplinin sahnesi. İlk edisyonun konuşmacıları açıklandıkça burada yer alacak. Sen de sahnede olmak ister misin?"
        badges={[{ kind: 'hangel', label: 'hangel derneği' }]}
        actions={[
          { label: 'Konuşmacı ol / öner', href: '/bergama/forum/kayit', variant: 'primary' },
          { label: 'Programı gör', href: '/bergama/forum/program', variant: 'secondary' },
        ]}
      />

      {/* PROFİLLER */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Kimleri sahnede görmek istiyoruz" title="Davet ettiğimiz sesler" description="Aşağıdaki alanlardan konuşmacılar davet ediyoruz. Uygun bir isim biliyorsan ya da kendin katkı sunmak istersen öner." />
        <FeatureGrid items={PROFILLER} columns={3} />
      </section>

      {/* YER TUTUCU KONUŞMACI KARTLARI */}
      <AppleSection compact eyebrow="Yakında" title="İlk konuşmacılar açıklanıyor">
        <div className="mx-auto grid max-w-4xl gap-5 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-dashed border-black/10 bg-white p-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
                <Mic2 className="h-7 w-7 text-primary/40" aria-hidden="true" />
              </div>
              <p className="font-bold tracking-tight text-[#1d1d1f]/40">Yakında açıklanacak</p>
              <p className="mt-1 text-xs text-muted-foreground">Konuşmacı #{i + 1}</p>
            </div>
          ))}
        </div>
      </AppleSection>

      {/* KONUŞMACI ÇAĞRISI */}
      <section className="bg-black py-20 text-center text-white md:py-28">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <UserPlus className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Açık çağrı</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Sahne senin de olabilir</h2>
          <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
            Bir fikrin, bir hikâyen ya da paylaşacak bir deneyimin mi var? Konuşmacı başvurusu yap; forum ekibi
            seninle iletişime geçsin. Genç sesleri, sahadaki gönüllüleri ve yeni bakış açılarını özellikle bekliyoruz.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 font-bold"><Link href="/bergama/forum/kayit">Konuşmacı başvurusu</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/20 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-black"><Link href="/bergama/forum/tema">Temayı oku</Link></Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/50">
            <Sparkles className="h-4 w-4" /> hangel derneği · Pergamon İnovasyon Mirası Forumu
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
