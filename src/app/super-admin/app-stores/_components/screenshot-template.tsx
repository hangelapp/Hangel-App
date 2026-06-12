'use client';

/**
 * src/app/super-admin/app-stores/_components/screenshot-template.tsx
 *
 * Deterministik (AI'sız) app-store ekran görüntüsü şablonu.
 *
 * AI text-to-image yerine; gerçek hangel wordmark'ı, doğru Türkçe metin, doğru
 * marka renkleri ve cihaz-class'ına uygun bir CSS cihaz çerçevesi render eder.
 * html2canvas ile tam çözünürlükte PNG yakalanabilir (piksel + metin + marka
 * doğru). Hiçbir şey "uydurulmaz".
 *
 * Renkler `app-store-specs.ts` / `logo-usage` marka esaslarıyla birebir:
 * Mercan #f34723, beyaz, Açık Gri #f1f1f1, Gece Siyahı #1f1f1f, Lacivert #042654.
 *
 * NOT: html2canvas modern CSS renk fonksiyonlarını (oklch vb. — Tailwind v4
 * `--primary` değişkeni) güvenilir yakalamaz. Bu yüzden şablon içinde RENKLER
 * AÇIK HEX olarak verilir; CSS değişkenine bağlı kalınmaz.
 */

import * as React from 'react';
import {
  HandCoins,
  HeartHandshake,
  Droplet,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { type PlatformKey, type FeatureKey, type DeviceSpec } from '@/lib/app-store-specs';

// ── Marka sabitleri (hex — html2canvas güvenli) ──────────────────────────────
const BRAND = {
  coral: '#f34723',
  white: '#ffffff',
  lightGray: '#f1f1f1',
  night: '#1f1f1f',
  navy: '#042654',
} as const;

const SLOGAN = 'Tek uygulama, dört iyilik';

// ── Cihaz sınıfı ─────────────────────────────────────────────────────────────
export type DeviceClass = 'phone' | 'tablet' | 'watch' | 'banner' | 'desktop';

/**
 * Bir platform + cihaz için hangi çerçevenin render edileceğini belirler.
 *
 * Kurallar (sırayla):
 *  - apple-watch platformu ya da cihaz adında 'Watch' geçiyorsa → watch
 *  - mac / microsoft / vision platformları → desktop (pencere çerçevesi)
 *  - cihaz yatay (w > h) — masaüstü dışı kalan tüm yatay pazarlama varlıkları
 *    (Play "Feature graphic" 1024×500, Chrome tile/marquee, vb.) → banner
 *  - 'iPad' / 'tablet' adı geçiyor ya da kısa kenar ≥ 1600 → tablet
 *  - aksi halde → phone
 *
 * NOT: Masaüstü platformları banner'dan ÖNCE elenir; aksi halde 16:10 mac/vision
 * landscape varlıkları yanlışlıkla "banner" olarak sınıflanır.
 */
export function getDeviceClass(platformKey: PlatformKey, device: DeviceSpec): DeviceClass {
  const name = device.device.toLowerCase();
  const { w, h } = device;

  if (platformKey === 'apple-watch' || name.includes('watch')) return 'watch';

  if (platformKey === 'mac-app' || platformKey === 'microsoft-store' || platformKey === 'apple-vision') {
    return 'desktop';
  }

  // Masaüstü olmayan yatay varlıklar → banner (Play Feature graphic, Chrome tile/marquee).
  if (w > h) return 'banner';

  const shortEdge = Math.min(w, h);
  if (name.includes('ipad') || name.includes('tablet') || shortEdge >= 1600) return 'tablet';

  return 'phone';
}

// ── Özellik kutuları (gerçek ikon + gerçek Türkçe etiket) ────────────────────
interface FeatureBox {
  icon: LucideIcon;
  label: string;
}

const FEATURE_BOXES: FeatureBox[] = [
  { icon: HandCoins, label: 'Bağış' },
  { icon: HeartHandshake, label: 'İmece' },
  { icon: Droplet, label: 'Kan Bağışı' },
  { icon: Building2, label: 'STK' },
];

// Seçilen özelliğe göre vurgulanan kutu (highlight) — diğerleri sade kalır.
const FEATURE_HIGHLIGHT: Record<FeatureKey, number> = {
  bagis: 0,
  imece: 1,
  'kan-bagisi': 2,
  'ngo-admin': 3,
  kasa: 3,
  genel: -1,
};

// Özellik bazlı app-ekranı başlığı (gerçek Türkçe metin).
const FEATURE_HEADLINE: Record<FeatureKey, string> = {
  bagis: 'Alışverişini iyiliğe dönüştür',
  imece: 'Zamanını imeceyle paylaş',
  'kan-bagisi': 'Bir damla, bir hayat',
  'ngo-admin': 'STK’nı şeffaf yönet',
  kasa: 'Kasanı şeffaf tut',
  genel: SLOGAN,
};

// Platform "vibe" — abartmadan, arka plan + aksan tonu.
interface PlatformTheme {
  /** App ekranı dışı çerçeve zemini. */
  stageBg: string;
  /** App ekranı içi üst header zemini. */
  headerBg: string;
  headerFg: string;
  accent: string;
}

function platformTheme(platformKey: PlatformKey): PlatformTheme {
  switch (platformKey) {
    case 'app-store':
      // Apple: temiz, açık gri zemin.
      return { stageBg: BRAND.lightGray, headerBg: BRAND.coral, headerFg: BRAND.white, accent: BRAND.coral };
    case 'google-play':
      // Material: yumuşak turuncu zemin.
      return { stageBg: '#fff4f0', headerBg: BRAND.coral, headerFg: BRAND.white, accent: BRAND.coral };
    case 'app-gallery':
      // Huawei: mavi-mor vurgu.
      return { stageBg: '#eef1fb', headerBg: BRAND.navy, headerFg: BRAND.white, accent: BRAND.coral };
    case 'apple-watch':
      // watchOS: koyu zemin.
      return { stageBg: BRAND.night, headerBg: BRAND.night, headerFg: BRAND.white, accent: BRAND.coral };
    case 'mac-app':
      return { stageBg: BRAND.lightGray, headerBg: BRAND.white, headerFg: BRAND.night, accent: BRAND.coral };
    case 'apple-vision':
      // visionOS: derin zemin, cam pencere.
      return { stageBg: '#0b1020', headerBg: BRAND.white, headerFg: BRAND.night, accent: BRAND.coral };
    case 'microsoft-store':
      return { stageBg: '#eef0f3', headerBg: BRAND.navy, headerFg: BRAND.white, accent: BRAND.coral };
    case 'chrome-web-store':
      return { stageBg: BRAND.white, headerBg: BRAND.coral, headerFg: BRAND.white, accent: BRAND.coral };
    default:
      return { stageBg: BRAND.lightGray, headerBg: BRAND.coral, headerFg: BRAND.white, accent: BRAND.coral };
  }
}

// ── hangel app ekranı (telefon/tablet/desktop içinde gösterilen arayüz) ───────
function HangelAppScreen({
  feature,
  theme,
  density,
}: {
  feature: FeatureKey;
  theme: PlatformTheme;
  density: 'phone' | 'tablet' | 'desktop';
}) {
  const highlight = FEATURE_HIGHLIGHT[feature];
  const headline = FEATURE_HEADLINE[feature];

  const pad = density === 'tablet' ? '5%' : density === 'desktop' ? '4%' : '6%';
  const gridCols = density === 'phone' ? 2 : 4;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BRAND.white,
        color: BRAND.night,
        fontFamily: 'Poppins, Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header — marka temalı */}
      <div
        style={{
          background: theme.headerBg,
          color: theme.headerFg,
          padding: `6% ${pad} 7%`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35em',
        }}
      >
        <span style={{ fontSize: '8%', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>
          hangel
        </span>
        <span style={{ fontSize: '3.6%', fontWeight: 600, opacity: 0.92, lineHeight: 1.2 }}>{SLOGAN}</span>
      </div>

      {/* Gövde */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: `7% ${pad} 6%`,
          gap: '4%',
        }}
      >
        <div
          style={{
            fontSize: density === 'phone' ? '6%' : '4.5%',
            fontWeight: 800,
            lineHeight: 1.15,
            color: BRAND.navy,
            letterSpacing: '-0.01em',
          }}
        >
          {headline}
        </div>

        {/* 4 özellik kutusu (ikon + Türkçe etiket) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: '3.5%',
          }}
        >
          {FEATURE_BOXES.map((box, i) => {
            const active = i === highlight;
            const Icon = box.icon;
            return (
              <div
                key={box.label}
                style={{
                  borderRadius: '14%',
                  padding: '8% 4%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5em',
                  background: active ? theme.accent : BRAND.lightGray,
                  color: active ? BRAND.white : BRAND.night,
                  border: active ? 'none' : `1px solid rgba(0,0,0,0.05)`,
                }}
              >
                <Icon
                  style={{
                    width: density === 'phone' ? '34%' : '26%',
                    height: 'auto',
                    color: active ? BRAND.white : theme.accent,
                  }}
                  strokeWidth={2.2}
                />
                <span style={{ fontSize: '3.4%', fontWeight: 700, textAlign: 'center', lineHeight: 1.1 }}>
                  {box.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          style={{
            background: theme.accent,
            color: BRAND.white,
            borderRadius: '999px',
            padding: '4.5% 6%',
            textAlign: 'center',
            fontSize: '4.6%',
            fontWeight: 800,
            letterSpacing: '-0.01em',
          }}
        >
          Hemen İndir
        </div>
      </div>
    </div>
  );
}

// ── Telefon çerçevesi ────────────────────────────────────────────────────────
function PhoneFrame({ feature, theme }: { feature: FeatureKey; theme: PlatformTheme }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.stageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
        boxSizing: 'border-box',
      }}
    >
      {/* Telefon gövdesi */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          aspectRatio: '9 / 19.5',
          background: BRAND.night,
          borderRadius: '13%',
          padding: '2.4%',
          boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
          boxSizing: 'border-box',
        }}
      >
        {/* Ekran */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '11%',
            overflow: 'hidden',
            background: BRAND.white,
          }}
        >
          {/* Dynamic Island / notch */}
          <div
            style={{
              position: 'absolute',
              top: '2.5%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '32%',
              height: '3.2%',
              background: BRAND.night,
              borderRadius: '999px',
              zIndex: 2,
            }}
          />
          <HangelAppScreen feature={feature} theme={theme} density="phone" />
        </div>
      </div>
    </div>
  );
}

// ── Tablet çerçevesi ─────────────────────────────────────────────────────────
function TabletFrame({ feature, theme }: { feature: FeatureKey; theme: PlatformTheme }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.stageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          aspectRatio: '3 / 4',
          background: BRAND.night,
          borderRadius: '5%',
          padding: '2%',
          boxShadow: '0 30px 80px rgba(0,0,0,0.22)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '3.5%',
            overflow: 'hidden',
            background: BRAND.white,
          }}
        >
          <HangelAppScreen feature={feature} theme={theme} density="tablet" />
        </div>
      </div>
    </div>
  );
}

// ── Saat çerçevesi (KESİNLİKLE telefon değil — yuvarlatılmış-kare watchOS) ────
function WatchFrame({ feature, theme }: { feature: FeatureKey; theme: PlatformTheme }) {
  const highlight = FEATURE_HIGHLIGHT[feature];
  // Saat ekranında en fazla 2 kompakt öğe gösterilir.
  const items = highlight >= 0 ? [FEATURE_BOXES[highlight]] : FEATURE_BOXES.slice(0, 2);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: BRAND.night,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
        boxSizing: 'border-box',
      }}
    >
      {/* Saat gövdesi: yuvarlatılmış kare (Apple Watch), parlak kenarlık */}
      <div
        style={{
          position: 'relative',
          height: '92%',
          aspectRatio: '410 / 502',
          background: '#0a0a0a',
          borderRadius: '30%',
          padding: '5%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          boxSizing: 'border-box',
        }}
      >
        {/* Digital crown (sağ kenar düğmesi) — saat olduğunu netleştirir */}
        <div
          style={{
            position: 'absolute',
            right: '-3%',
            top: '34%',
            width: '4%',
            height: '16%',
            background: '#3a3a3a',
            borderRadius: '999px',
          }}
        />
        {/* Ekran — siyah, kavisli köşeler */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#000000',
            borderRadius: '26%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6%',
            padding: '8%',
            boxSizing: 'border-box',
            fontFamily: 'Poppins, Inter, system-ui, sans-serif',
          }}
        >
          {/* Üstte kompakt saat-tarzı zaman + logo */}
          <span style={{ fontSize: '7%', fontWeight: 700, color: theme.accent }}>09:41</span>
          <span style={{ fontSize: '13%', fontWeight: 900, color: BRAND.white, lineHeight: 1, letterSpacing: '-0.02em' }}>
            hangel
          </span>
          {/* 1-2 kompakt öğe (ikon + etiket) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6%', width: '100%' }}>
            {items.map((box) => {
              const Icon = box.icon;
              return (
                <div
                  key={box.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8%',
                    background: theme.accent,
                    borderRadius: '999px',
                    padding: '5% 8%',
                    color: BRAND.white,
                  }}
                >
                  <Icon style={{ width: '16%', height: 'auto', color: BRAND.white }} strokeWidth={2.4} />
                  <span style={{ fontSize: '8%', fontWeight: 700, lineHeight: 1 }}>{box.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Banner (Play Feature graphic / Chrome marquee — YATAY düzen) ─────────────
function BannerFrame({ feature, theme }: { feature: FeatureKey; theme: PlatformTheme }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'stretch',
        background: theme.stageBg,
        fontFamily: 'Poppins, Inter, system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Sol: büyük hangel logosu + slogan */}
      <div
        style={{
          flex: '0 0 42%',
          background: BRAND.coral,
          color: BRAND.white,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '3%',
          padding: '0 5%',
        }}
      >
        <span style={{ fontSize: '20%', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>hangel</span>
        <span style={{ fontSize: '7%', fontWeight: 600, opacity: 0.95, lineHeight: 1.2 }}>{SLOGAN}</span>
      </div>

      {/* Sağ: 4 mini özellik */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4%',
        }}
      >
        <div style={{ display: 'flex', gap: '4%', width: '100%', justifyContent: 'space-between' }}>
          {FEATURE_BOXES.map((box, i) => {
            const active = i === FEATURE_HIGHLIGHT[feature];
            const Icon = box.icon;
            return (
              <div
                key={box.label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5em',
                  background: active ? theme.accent : BRAND.white,
                  color: active ? BRAND.white : BRAND.night,
                  border: active ? 'none' : '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '12%',
                  padding: '6% 2%',
                }}
              >
                <Icon
                  style={{ width: '34%', height: 'auto', color: active ? BRAND.white : theme.accent }}
                  strokeWidth={2.2}
                />
                <span style={{ fontSize: '7%', fontWeight: 700, lineHeight: 1, textAlign: 'center' }}>{box.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Desktop (mac / windows / vision — pencere çerçevesi) ─────────────────────
function DesktopFrame({
  platformKey,
  feature,
  theme,
}: {
  platformKey: PlatformKey;
  feature: FeatureKey;
  theme: PlatformTheme;
}) {
  // visionOS için cam (glass) pencere hissi, aksi halde opak.
  const glass = platformKey === 'apple-vision';
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.stageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '2.5%',
          overflow: 'hidden',
          background: glass ? 'rgba(255,255,255,0.92)' : BRAND.white,
          boxShadow: '0 30px 90px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          border: glass ? '1px solid rgba(255,255,255,0.4)' : 'none',
        }}
      >
        {/* Pencere başlık çubuğu (trafik ışıkları) */}
        <div
          style={{
            height: '7%',
            minHeight: '7%',
            background: BRAND.lightGray,
            display: 'flex',
            alignItems: 'center',
            gap: '0.8%',
            padding: '0 2%',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <span style={{ width: '1.4%', aspectRatio: '1', borderRadius: '999px', background: '#ff5f57' }} />
          <span style={{ width: '1.4%', aspectRatio: '1', borderRadius: '999px', background: '#febc2e' }} />
          <span style={{ width: '1.4%', aspectRatio: '1', borderRadius: '999px', background: '#28c840' }} />
          <span style={{ marginLeft: '1.5%', fontSize: '2.4%', fontWeight: 700, color: BRAND.night, fontFamily: 'Poppins, Inter, sans-serif' }}>
            hangel
          </span>
        </div>

        {/* İçerik: sidebar + ferah arayüz */}
        <div style={{ flex: 1, display: 'flex', fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}>
          {/* Sidebar */}
          <div
            style={{
              flex: '0 0 22%',
              background: BRAND.coral,
              color: BRAND.white,
              padding: '3% 2.4%',
              display: 'flex',
              flexDirection: 'column',
              gap: '5%',
            }}
          >
            <span style={{ fontSize: '5%', fontWeight: 900, letterSpacing: '-0.02em' }}>hangel</span>
            {FEATURE_BOXES.map((box, i) => {
              const Icon = box.icon;
              const active = i === FEATURE_HIGHLIGHT[feature];
              return (
                <div
                  key={box.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6%',
                    fontSize: '3%',
                    fontWeight: active ? 800 : 600,
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  <Icon style={{ width: '12%', height: 'auto' }} strokeWidth={2.2} />
                  <span>{box.label}</span>
                </div>
              );
            })}
          </div>

          {/* Ana panel */}
          <div style={{ flex: 1, padding: '3.5%', display: 'flex', flexDirection: 'column', gap: '3%' }}>
            <div style={{ fontSize: '4.5%', fontWeight: 800, color: BRAND.navy, letterSpacing: '-0.01em' }}>
              {FEATURE_HEADLINE[feature]}
            </div>
            <div style={{ fontSize: '2.6%', fontWeight: 600, color: '#555' }}>{SLOGAN}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5%', marginTop: '1%' }}>
              {FEATURE_BOXES.map((box, i) => {
                const Icon = box.icon;
                const active = i === FEATURE_HIGHLIGHT[feature];
                return (
                  <div
                    key={box.label}
                    style={{
                      borderRadius: '8%',
                      padding: '8% 4%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5em',
                      background: active ? theme.accent : BRAND.lightGray,
                      color: active ? BRAND.white : BRAND.night,
                    }}
                  >
                    <Icon
                      style={{ width: '30%', height: 'auto', color: active ? BRAND.white : theme.accent }}
                      strokeWidth={2.2}
                    />
                    <span style={{ fontSize: '2.6%', fontWeight: 700 }}>{box.label}</span>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                background: theme.accent,
                color: BRAND.white,
                borderRadius: '999px',
                padding: '1.6% 4%',
                fontSize: '3%',
                fontWeight: 800,
              }}
            >
              Hemen İndir
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ana şablon ───────────────────────────────────────────────────────────────
export interface ScreenshotTemplateProps {
  platformKey: PlatformKey;
  device: DeviceSpec;
  feature: FeatureKey;
  /**
   * Kök kapsayıcının CSS genişliği (px). Önizleme için ~360, export için cihazın
   * tam piksel genişliği (device.w) verilir. Yükseklik device oranından türetilir.
   */
  renderWidth: number;
  /** html2canvas yakalaması için ref. */
  innerRef?: React.Ref<HTMLDivElement>;
}

/**
 * device.w / device.h oranında bir kök kapsayıcı render eder; içine cihaz
 * sınıfına uygun çerçeveyi yerleştirir. renderWidth ile ölçeklenir (önizleme
 * küçük, export tam çözünürlük).
 */
export function ScreenshotTemplate({
  platformKey,
  device,
  feature,
  renderWidth,
  innerRef,
}: ScreenshotTemplateProps) {
  const deviceClass = getDeviceClass(platformKey, device);
  const theme = platformTheme(platformKey);
  const height = Math.round((renderWidth * device.h) / device.w);

  let frame: React.ReactNode;
  switch (deviceClass) {
    case 'watch':
      frame = <WatchFrame feature={feature} theme={theme} />;
      break;
    case 'banner':
      frame = <BannerFrame feature={feature} theme={theme} />;
      break;
    case 'tablet':
      frame = <TabletFrame feature={feature} theme={theme} />;
      break;
    case 'desktop':
      frame = <DesktopFrame platformKey={platformKey} feature={feature} theme={theme} />;
      break;
    case 'phone':
    default:
      frame = <PhoneFrame feature={feature} theme={theme} />;
      break;
  }

  return (
    <div
      ref={innerRef}
      style={{
        width: `${renderWidth}px`,
        height: `${height}px`,
        // Font-size px tabanı ekran yüksekliğine bağlı → tüm `%` font boyutları
        // (HangelAppScreen vb. `fontSize: '8%'`) ölçeklenir.
        fontSize: `${height}px`,
        overflow: 'hidden',
        position: 'relative',
        background: theme.stageBg,
      }}
    >
      {frame}
    </div>
  );
}
