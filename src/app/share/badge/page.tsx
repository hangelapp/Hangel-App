/**
 * /share/badge — Paylaşılan rozet açılış sayfası (OG zengin önizleme + CTA).
 * Veriler URL parametresinden gelir (name, sub, area, emoji, who, color).
 */
import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';
type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

function imageUrl(sp: SP, format: 'og' | 'story') {
  const p = new URLSearchParams();
  for (const k of ['name', 'sub', 'area', 'emoji', 'who', 'color']) {
    const val = one(sp[k]);
    if (val) p.set(k, val);
  }
  p.set('f', format);
  return `${APP_URL}/api/badge-card?${p.toString()}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const name = one(sp.name) || 'Rozet';
  const title = `${name} rozetini kazandım — hangel`;
  const description = 'hangel’de gönüllülük ve bağışla rozetler kazan. Sen de katıl.';
  const og = imageUrl(sp, 'og');
  return {
    title,
    description,
    openGraph: { title, description, url: `${APP_URL}/share/badge`, siteName: 'hangel', images: [{ url: og, width: 1200, height: 630 }], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function BadgeSharePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const name = one(sp.name) || 'Rozet';
  const color = /^#[0-9a-fA-F]{6}$/.test(one(sp.color)) ? one(sp.color) : '#E34234';
  const og = imageUrl(sp, 'og');

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 p-6 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
      <div className="text-2xl font-extrabold tracking-tight">hangel</div>
      <img src={og} alt={`${name} rozeti`} className="w-full max-w-xl rounded-2xl shadow-2xl" width={1200} height={630} />
      <Link href="/events" className="rounded-full bg-white px-8 py-3 text-base font-bold shadow-lg active:scale-95 transition-transform" style={{ color }}>
        Sen de rozet kazan — hangel’e katıl
      </Link>
      <p className="text-xs opacity-80">hangel.org</p>
    </div>
  );
}
