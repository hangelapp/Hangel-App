/**
 * /share/impact — Paylaşılan "Etki Kartı" açılış sayfası.
 *
 * Kullanıcı bağışının etki kartını paylaştığında bu sayfanın linki gider.
 * WhatsApp/X gibi yerlerde generateMetadata sayesinde /api/impact-card görseli
 * zengin önizleme olarak çıkar. Sayfa gövdesi de etkiyi gösterir + "Sen de
 * katıl" çağrısı yapar. Tüm veriler URL parametresinden gelir (gizli veri yok).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { impactEquivalent } from '@/lib/impact-equivalents';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

function parse(sp: SP) {
  const amount = Math.max(0, Math.round(Number(one(sp.a)) || 0));
  const ngos = one(sp.n)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const who = one(sp.who).trim().slice(0, 24);
  return { amount, ngos, who };
}

function imageUrl(sp: SP, format: 'og' | 'story') {
  const { amount, ngos, who } = parse(sp);
  const p = new URLSearchParams();
  p.set('a', String(amount));
  if (ngos.length) p.set('n', ngos.join(','));
  if (who) p.set('who', who);
  p.set('f', format);
  return `${APP_URL}/api/impact-card?${p.toString()}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const { amount } = parse(sp);
  const eq = impactEquivalent(amount);
  const title = `₺${amount.toLocaleString('tr-TR')} bağışa dönüştü — hangel`;
  const description = `Bir alışveriş ≈ ${eq.count} ${eq.unit} etti. Sen de hangel'de alışverişini bağışa dönüştür.`;
  const og = imageUrl(sp, 'og');
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/share/impact`,
      siteName: 'hangel',
      images: [{ url: og, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function ImpactSharePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { amount, ngos, who } = parse(sp);
  const eq = impactEquivalent(amount);
  const og = imageUrl(sp, 'og');

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#f34723] via-[#ff7a4d] to-[#ff9a6b] p-6 text-white">
      <div className="text-2xl font-extrabold tracking-tight">hangel</div>

      {/* Etki kartı önizlemesi (görselin kendisi) */}
      <img
        src={og}
        alt={`₺${amount} bağış etki kartı`}
        className="w-full max-w-xl rounded-2xl shadow-2xl"
        width={1200}
        height={630}
      />

      <div className="text-center">
        <p className="text-lg opacity-95">
          {who ? `${who}, bir alışverişini bağışa dönüştürdü` : 'Bir alışveriş bağışa dönüştü'}
        </p>
        <p className="mt-1 text-4xl font-extrabold">₺{amount.toLocaleString('tr-TR')}</p>
        <p className="mt-1 text-base font-semibold opacity-95">≈ {eq.count} {eq.unit} {eq.emoji}</p>
        {ngos.length > 0 && <p className="mt-2 text-sm opacity-90">Destek: {ngos.join('  ·  ')}</p>}
      </div>

      <Link
        href="/market"
        className="rounded-full bg-white px-8 py-3 text-base font-bold text-[#f34723] shadow-lg active:scale-95 transition-transform"
      >
        Sen de katıl — alışverişini bağışa dönüştür
      </Link>
      <p className="text-xs opacity-80">hangel.org</p>
    </div>
  );
}
