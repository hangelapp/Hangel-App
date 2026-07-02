/**
 * GET /api/badge-card — Rozet paylaşım görseli (PNG).
 *
 * Kullanıcı bir rozetini paylaştığında güzel bir kart üretir: madalyon + rozet
 * adı + seviye/tür + alan. İki biçim: f=og (1200×630), f=story (1080×1920).
 * Parametreler: name, sub(seviye/tür), area, emoji(ops.), who(ops.), color(hex, ops.), f.
 *
 * satori varsayılan fontu ₺/≈/karmaşık glyph'leri içermez → yalnız güvenli
 * karakterler + (varsa) emoji kullanılır; emoji yoksa madalyonda ad baş harfi.
 */
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get('name') || 'Rozet').slice(0, 48);
  const sub = (searchParams.get('sub') || '').slice(0, 32);
  const area = (searchParams.get('area') || '').slice(0, 40);
  const emoji = (searchParams.get('emoji') || '').slice(0, 8);
  const who = (searchParams.get('who') || '').trim().slice(0, 24);
  const color = /^#[0-9a-fA-F]{6}$/.test(searchParams.get('color') || '') ? (searchParams.get('color') as string) : '#E34234';
  const story = searchParams.get('f') === 'story';

  const W = story ? 1080 : 1200;
  const H = story ? 1920 : 630;
  const scale = story ? 1.55 : 1;
  const px = (n: number) => Math.round(n * scale);
  const medallion = emoji || name.charAt(0).toLocaleUpperCase('tr');

  // Renkten yumuşak bir gradient türet (aynı ton, açık→koyu).
  const bg = `linear-gradient(135deg, ${color} 0%, ${color}dd 60%, ${color}bb 100%)`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: px(64), background: bg, color: 'white', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: px(44), fontWeight: 800, letterSpacing: -1 }}>hangel</div>
          <div style={{ display: 'flex', fontSize: px(22), opacity: 0.92 }}>rozet kazandım</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: px(180), height: px(180), borderRadius: px(999),
              background: 'rgba(255,255,255,0.22)', fontSize: px(96), fontWeight: 800, marginBottom: px(28),
            }}
          >
            {medallion}
          </div>
          <div style={{ display: 'flex', fontSize: px(26), opacity: 0.95, marginBottom: px(8) }}>
            {who ? `${who} kazandı` : 'Yeni rozet kazanıldı'}
          </div>
          <div style={{ display: 'flex', fontSize: px(64), fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          {(sub || area) && (
            <div
              style={{
                display: 'flex', alignItems: 'center', marginTop: px(20),
                background: 'rgba(255,255,255,0.2)', borderRadius: px(999),
                padding: `${px(12)}px ${px(28)}px`, fontSize: px(28), fontWeight: 700,
              }}
            >
              {[sub, area].filter(Boolean).join('  ·  ')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: px(26), fontWeight: 700 }}>
          Sen de katıl · hangel.org
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
