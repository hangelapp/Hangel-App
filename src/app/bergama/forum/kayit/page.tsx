'use client';

/**
 * /bergama/forum/kayit — Forum kayıt sayfası. Katılım tipleri (katılımcı,
 * konuşmacı, gönüllü, kurumsal), bilet notu ve SSS. Kayıt açılınca gerçek
 * form/CTA bağlanır; şimdilik ilgi toplama ve yönlendirme.
 */

import {
  Ticket,
  Mic2,
  Users,
  Building2,
  CalendarDays,
  MapPin,
  Languages,
  BadgeCheck,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { MarketingNav, AppleSection, SectionHeading } from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';

const TIPLER = [
  {
    icon: Users,
    title: 'Katılımcı',
    text: 'İki gün boyunca tüm oturum, panel ve atölyelere erişim; networking ve forum çantası.',
    fiyat: 'Erken kayıt: ücretsiz kontenjan',
    cta: { label: 'Katılımcı ol', href: '/register' },
    primary: false,
  },
  {
    icon: Mic2,
    title: 'Konuşmacı',
    text: 'Sahnede yer almak, atölye yürütmek veya genç sesler bölümünde konuşmak için başvur.',
    fiyat: 'Başvuruyla · davetli',
    cta: { label: 'Konuşmacı başvurusu', href: '/register' },
    primary: true,
  },
  {
    icon: Building2,
    title: 'Kurumsal / STK',
    text: 'Kurumunla stant, sponsorluk veya toplu katılım. Sosyal etki raporunu birlikte hazırlayalım.',
    fiyat: 'İş birliğine göre',
    cta: { label: 'Kurumsal iş birliği', href: '/corporate' },
    primary: false,
  },
  {
    icon: Users,
    title: 'Gönüllü',
    text: 'Forumun kurulmasına, karşılamaya ve saha koordinasyonuna gönüllü olarak destek ol.',
    fiyat: 'Ücretsiz · sertifikalı',
    cta: { label: 'Gönüllü ol', href: '/volunteering' },
    primary: false,
  },
];

const SSS = [
  { q: 'Forum ne zaman ve nerede?', a: 'İlk edisyon Eylül 2026\'da Bergama, İzmir\'de yapılacak. Kesin tarih ve mekân, kayıt açıldığında kayıtlı katılımcılara duyurulur.' },
  { q: 'Katılım ücretli mi?', a: 'Erken kayıt için ücretsiz kontenjan ayrılacak. Ek imkânlar (atölye paketleri, konaklama vb.) için ayrıntılar kayıt sayfasında paylaşılacak.' },
  { q: 'Forum hangi dilde?', a: 'Türkçe ve İngilizce eşzamanlı çeviri sağlanacaktır. Oturumlar her iki dilde takip edilebilir.' },
  { q: 'Konuşmacı olabilir miyim?', a: 'Evet. Konuşmacı ve atölye yürütücüsü başvurularına açığız; genç sesleri ve sahadaki gönüllüleri özellikle bekliyoruz.' },
  { q: 'Bergama\'ya nasıl gelirim?', a: 'Bergama, İzmir\'e karayoluyla yaklaşık 1,5 saat mesafede. Ulaşım ve konaklama önerileri kayıt sonrası paylaşılacaktır.' },
];

export default function ForumKayitPage() {
  return (
    <div className="bg-white">
      <MarketingNav label="Kayıt" ctaLabel="Kayıt Ol" ctaHref="/register" backLabel="Forum" />

      <AppleSection
        eyebrow="Kayıt"
        title="Pergamon Forumu'na katıl"
        subtitle="Katılımcı, konuşmacı, gönüllü ya da kurumunla."
        description="İlk edisyon için kayıtlar yakında açılıyor. Sana uygun katılım tipini seç; erken kayıt fırsatları ve program güncellemelerinden ilk sen haberdar ol."
        badges={[{ kind: 'yeni' }, { kind: 'hangel', label: 'hangel derneği' }]}
        actions={[{ label: 'Hesap oluştur & kayıt ol', href: '/register', variant: 'primary' }]}
      />

      {/* KÜNYE */}
      <section className="border-b border-black/5 bg-black py-8 text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 text-sm font-medium text-white/80">
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Eylül 2026</span>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Bergama, İzmir</span>
          <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4 text-primary" /> TR / EN</span>
          <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Katılım sertifikası</span>
        </div>
      </section>

      {/* KATILIM TİPLERİ */}
      <section className="border-b border-black/5 bg-[#f5f5f7] py-20 md:py-28">
        <SectionHeading eyebrow="Katılım tipleri" title="Nasıl katılmak istersin?" />
        <div className="mx-auto grid max-w-5xl gap-5 px-6 sm:grid-cols-2">
          {TIPLER.map((t) => {
            const Icon = t.icon;
            const primary = t.primary;
            return (
              <div
                key={t.title}
                className={primary ? 'flex flex-col justify-between rounded-3xl bg-primary p-8 text-left text-primary-foreground shadow-lg' : 'flex flex-col justify-between rounded-3xl border border-black/5 bg-white p-8 text-left shadow-sm'}
              >
                <div>
                  <div className={primary ? 'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20' : 'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10'}>
                    <Icon className={primary ? 'h-6 w-6 text-white' : 'h-6 w-6 text-primary'} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{t.title}</h3>
                  <p className={primary ? 'mt-2 text-sm leading-relaxed opacity-90' : 'mt-2 text-sm leading-relaxed text-muted-foreground'}>{t.text}</p>
                  <p className={primary ? 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold' : 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary'}>
                    <Ticket className="h-3.5 w-3.5" /> {t.fiyat}
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant={primary ? 'secondary' : 'default'}
                  className={primary ? 'mt-6 h-11 rounded-full bg-white font-bold text-primary hover:bg-white/90' : 'mt-6 h-11 rounded-full font-bold'}
                >
                  <Link href={t.cta.href}>{t.cta.label}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SSS */}
      <section className="border-b border-black/5 bg-white py-20 md:py-28">
        <SectionHeading eyebrow="Sık sorulanlar" title="Merak edilenler" />
        <div className="mx-auto max-w-3xl space-y-3 px-6">
          {SSS.map((s, i) => (
            <details key={i} className="group rounded-2xl border border-black/5 bg-[#f5f5f7] p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-bold tracking-tight text-[#1d1d1f]">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {s.q}
                </span>
                <span className="shrink-0 text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 pl-6 text-sm leading-relaxed text-muted-foreground">{s.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <Ticket className="mx-auto mb-4 h-9 w-9" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Yerini şimdiden ayırt</h2>
          <p className="mt-3 text-base opacity-90">hangel hesabınla kayıt ol; kayıtlar açılınca ve program güncellenince ilk sen haberdar ol.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full bg-white px-8 font-bold text-primary hover:bg-white/90"><Link href="/register">Kayıt ol</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-transparent px-6 font-bold text-white hover:bg-white hover:text-primary"><Link href="/bergama/forum/program">Programı gör</Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
