/**
 * GET /api/impact-card — Etki Kartı görseli (PNG) üretir.
 *
 * Kullanıcı bir alışverişini bağışa dönüştürdüğünde paylaşabileceği güzel bir
 * kart: büyük tutar + "≈ X öğün" etki karşılığı + desteklenen STK'lar + hangel
 * markası. İki biçim:
 *   f=og    → 1200×630  (WhatsApp/X link önizlemesi için)
 *   f=story → 1080×1920 (Instagram/WhatsApp story olarak paylaşmak için)
 *
 * Parametreler: a=tutar(₺), n=stk isimleri(virgülle), who=isim(ops.), f=biçim.
 * Gizli veri yok — yalnızca kullanıcının paylaşmayı seçtiği kendi etkisi.
 */
import { ImageResponse } from 'next/og';
import { impactEquivalent } from '@/lib/impact-equivalents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amount = Math.max(0, Math.round(Number(searchParams.get('a')) || 0));
  const ngos = (searchParams.get('n') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const who = (searchParams.get('who') || '').trim().slice(0, 24);
  const story = searchParams.get('f') === 'story';

  const eq = impactEquivalent(amount);
  const fmtAmount = amount.toLocaleString('tr-TR');
  const W = story ? 1080 : 1200;
  const H = story ? 1920 : 630;
  const scale = story ? 1.55 : 1;
  const px = (n: number) => Math.round(n * scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: px(64),
          background: 'linear-gradient(135deg, #f34723 0%, #ff7a4d 55%, #ff9a6b 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Üst: logo + slogan */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: px(44), fontWeight: 800, letterSpacing: -1 }}>hangel</div>
          <div style={{ display: 'flex', fontSize: px(22), opacity: 0.92 }}>alışverişini bağışa dönüştür</div>
        </div>

        {/* Orta: tutar + etki karşılığı */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: px(30), fontWeight: 600, opacity: 0.95, marginBottom: px(10) }}>
            {who ? `${who}, bir alışverişini bağışa dönüştürdü` : 'Bir alışveriş bağışa dönüştü'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: px(20) }}>
            <div style={{ display: 'flex', fontSize: px(140), fontWeight: 800, lineHeight: 1 }}>₺{fmtAmount}</div>
            <div style={{ display: 'flex', fontSize: px(34), fontWeight: 600, opacity: 0.9, paddingBottom: px(18), marginLeft: px(14) }}>
              bağış
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.20)',
              borderRadius: px(999),
              padding: `${px(14)}px ${px(30)}px`,
              fontSize: px(40),
              fontWeight: 700,
            }}
          >
            ≈ {eq.count} {eq.unit} {eq.emoji}
          </div>
          {ngos.length > 0 && (
            <div style={{ display: 'flex', fontSize: px(24), opacity: 0.92, marginTop: px(22) }}>
              Destek: {ngos.join('  ·  ')}
            </div>
          )}
        </div>

        {/* Alt: davet */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: px(26) }}>
          <div style={{ display: 'flex', fontWeight: 700 }}>Sen de katıl → hangel.org</div>
          <div style={{ display: 'flex' }}>🧡</div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
