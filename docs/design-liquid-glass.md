# Hangel Design System — Liquid Glass (iOS 26)

Bu doküman Hangel'in iOS 26 ("Liquid Glass") design language migrasyonunun
referansıdır. WWDC 2025'te tanıtılan refractive glass yüzeyleri Apple
ekosisteminin (iOS, iPadOS, macOS Sequoia 16) yeni tasarım dilidir. Hangel
Capacitor wrapper iOS uygulama olarak çalıştığı için native estetiğe
yaklaşmak kullanıcı algısında "Apple-grade" hissi yaratır.

## 1. Felsefe

Liquid Glass tek bir kuralla özetlenebilir:

> "Yüzeyler altta kalan içeriği hisseder."

Bu felsefe yedi temel bileşene ayrılır:

| Bileşen | Karşılığı |
|---|---|
| Translucency | Yarı saydam beyaz/siyah tint |
| Backdrop blur | 8 / 20 / 40 px tiered blur |
| Saturate boost | %180 — alttaki rengi canlandır |
| Vibrancy | Brightness 108 % (light) / 115 % (dark) |
| Glass border | 1 px white/8 % veya black/8 % iç çizgi |
| Multi-layer depth | Soft shadow + inset highlight |
| Spring motion | `cubic-bezier(0.32, 0.72, 0, 1)` curve |

## 2. Token mimarisi

Tüm tokenlar `src/app/globals.css` içinde CSS custom property olarak tanımlı
ve `tailwind.config.ts` üzerinden Tailwind utility'lerine maplenir.

### 2.1 CSS variables (light + dark)

```css
/* light */
--glass-bg: rgba(255, 255, 255, 0.65);
--glass-bg-prominent: rgba(255, 255, 255, 0.78);
--glass-bg-thin: rgba(255, 255, 255, 0.45);
--glass-border: rgba(255, 255, 255, 0.5);
--glass-border-inner: rgba(0, 0, 0, 0.08);
--glass-highlight: rgba(255, 255, 255, 0.5);

/* dark */
--glass-bg: rgba(28, 28, 30, 0.65);
--glass-bg-prominent: rgba(28, 28, 30, 0.78);
--glass-bg-thin: rgba(28, 28, 30, 0.45);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-border-inner: rgba(255, 255, 255, 0.06);
--glass-highlight: rgba(255, 255, 255, 0.08);
```

### 2.2 Tailwind utility'leri

| Class | Çıktı |
|---|---|
| `backdrop-blur-glass-1` | 8 px (badge, chip) |
| `backdrop-blur-glass-2` | 20 px (card, popover) |
| `backdrop-blur-glass-3` | 40 px (dialog, sheet) |
| `bg-glass-white-8` | `rgba(255,255,255,0.08)` |
| `bg-glass-black-12` | `rgba(0,0,0,0.12)` |
| `shadow-glass-soft` | Card/popover shadow |
| `shadow-glass-prominent` | Dialog/sheet shadow |
| `ease-spring` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| `ease-spring-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |

### 2.3 Component class'ları

`globals.css` içinde tanımlı 3 ana utility:

- `.glass` — default surface (Card, Popover, Tooltip)
- `.glass-prominent` — high-depth surface (Dialog, Sheet, Bottom Nav, Toast)
- `.glass-thin` — inline surface (Badge, chip, ghost button hover)

Ek yardımcılar:

- `.glass-vibrancy` — extra brightness boost
- `.glass-handle` — bottom sheet tube grip (36×5 px rounded)
- `.glass-scroll` — slim translucent scrollbar

## 3. Component matrisi

| Component | Variant | Glass katmanı |
|---|---|---|
| `Card` | `default` / `glass` | `.glass` + `rounded-3xl` |
| `Card` | `glass-prominent` | `.glass-prominent` |
| `Card` | `solid` | Eski `bg-card` (opak, geçiş yolu) |
| `Button` | `default` (primary) | Brand red + white/15 border |
| `Button` | `secondary` | `.glass-thin` |
| `Button` | `outline` | `.glass-thin` + primary text |
| `Button` | `ghost` | Transparent → glass hover |
| `Dialog` | — | `.glass-prominent` + overlay 40 px blur |
| `Sheet` | — | `.glass-prominent`, bottom: handle |
| `Badge` | `default` | Brand + glass border |
| `Badge` | `glass` | `.glass-thin` |
| `Popover` | — | `.glass` + `rounded-2xl` |
| `Tooltip` | — | `.glass` + `rounded-xl` |
| `Toast` | `default` | `.glass-prominent` + `rounded-2xl` |
| `Header` | — | Adaptive: scroll'da `.glass` aktive olur |
| `BottomNav` | — | `.glass-prominent` |
| `GlassSurface` | `default`/`prominent`/`thin` | Reusable wrapper |

## 4. Brand korunumu

Hangel kırmızısı (`#f34723` light, `#f87158` dark) brand identity'nin
parçasıdır ve glass katmanın **altında** kalır. Primary button, badge,
toast destructive variant'ları brand rengi + glass overlay kombinasyonu
ile render edilir.

- Brand color: `bg-primary` korunur.
- Inner border: `border-white/15` cam etkisi verir.
- Hover shadow: `shadow-glass-prominent` katman dolgunlaşır.

## 5. Erişilebilirlik

- **WCAG AA contrast 4.5:1** — text foreground değişmedi, hala `--foreground`.
- **Touch target ≥ 44 pt** — button `h-11`, bottom nav `min-h-[48px]`.
- **prefers-reduced-transparency** — glass katmanı otomatik opak hale döner
  (`@media` rule globals.css içinde).
- **Mevcut a11y modları** etkilenmedi: `a11y-high-contrast`, `a11y-reduce-motion`,
  `a11y-large-targets` Liquid Glass üstünde de çalışır.

## 6. Performans

`backdrop-filter` GPU-pahalı. Aşağıdaki kurallara uy:

1. **Sadece major surface'ler**: Card, Dialog, Sheet, Bottom Nav, Header, Popover.
2. **Scroll list item'lar glass değil** — yoksa scroll FPS düşer.
3. **Stacking limit**: aynı anda 3'ten fazla glass katman üst üste binmemeli.
4. **Native iOS** Capacitor WebView Safari 17+ — `backdrop-filter` native destek.

## 7. Spring motion

Tüm interactive transitions `ease-spring` kullanır:

```css
transition-duration: 200ms;
transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
```

Active state: `active:scale-[0.96]` (button, link, tab). Bu Apple haptic
geri bildiriminin görsel karşılığıdır.

## 8. GlassSurface wrapper

Card anatomisi gerektirmeyen yerlerde `<GlassSurface>` kullan:

```tsx
import { GlassSurface } from '@/components/ui/glass-surface';

<GlassSurface variant="prominent" as="section" className="p-6">
  <h2>Hero başlık</h2>
</GlassSurface>
```

Prop'lar:

- `variant`: `default | prominent | thin`
- `radius`: `none | sm | md | lg | full`
- `shadow`: `none | soft | prominent`
- `as`: HTML element (default `div`)

## 9. Geriye dönük uyumluluk

| Kaygı | Çözüm |
|---|---|
| `<Card>` çağrıları | Aynı API — sadece varyant eklendi; eski opak yüzey isteyen `variant="solid"` kullanır |
| `<Button variant="ghost">` | Aynı, sadece hover'da glass tile geliyor — davranış değişmedi |
| `<Sheet side="bottom">` | Otomatik glass handle ekleniyor — yeni feature, breaking değil |
| Custom className override | `cn()` merge edildiği için tüm override'lar çalışır |

## 10. Migration checklist

Yeni page/component yazan ajanlar için:

- [ ] `<Card>` kullanırken solid yüzey gerekmiyorsa default'u bırak (`.glass`).
- [ ] `bg-white` veya `bg-card` hard-code etme — `Card` veya `GlassSurface`
      kullan.
- [ ] Scroll list item'larda glass yüzey kullanma (performans).
- [ ] Modal kullanırken `<Dialog>` (zaten glass) — manuel overlay yazma.
- [ ] Brand rengini glass altında bırak (primary button pattern'i ile).
- [ ] `prefers-reduced-transparency` test et — DevTools > Rendering panel.

## Referans

- WWDC 2025 — *Design with Liquid Glass*
- Apple HIG — *Materials* (https://developer.apple.com/design/human-interface-guidelines/materials)
- iOS 26 Notification Center, macOS Sequoia Control Center, Safari Glassy Tabs
