'use client';

/**
 * DetailHero — Etkinlik + Gönüllülük detay sayfaları için ORTAK, Apple/iOS 26
 * kimlikli hero/künye bileşeni.
 *
 * Yapı (tek tasarım dili):
 *   görsel → GÜÇLÜ gradient scrim → KÜNYE overlay
 *   (düzenleyen logo + tür rozeti + tarih/konum + başlık)
 *
 * Tasarım kuralları (globals.css ölçeğine birebir hizalı):
 *   - Başlık responsive: text-2xl sm:text-3xl md:text-4xl, leading-tight, text-balance.
 *   - Künye yazıları ≥12px (text-xs taban; sadece tür rozeti text-[11px]).
 *   - Beyaz metin YALNIZ scrim üstünde + drop-shadow.
 *   - Geri/Paylaş aksiyonları translucent materyal (backdrop-blur), ≥44px dokunma.
 *   - Hardcoded tema rengi YOK — semantik token (bg-muted vb.). Scrim üstü beyaz serbest.
 */

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DetailHeroProps = {
  /** Arka plan görseli (afiş/kapak). Boşsa nötr bir zemin gösterilir. */
  imageUrl?: string;
  /** Görsel alt metni (erişilebilirlik). */
  imageAlt: string;
  /**
   * Görsel en-boy oranı. Etkinlik afişi A4 portre (210/297), gönüllülük
   * kapağı geniş bant → çağıran kendi oranını/yüksekliğini geçer.
   * Verilmezse geniş bant hero (h-[42vh]) kullanılır.
   */
  aspect?: string;
  /** Köşe yarıçapı — büyük hero rounded-3xl (varsayılan) veya köşesiz bant. */
  rounded?: boolean;
  /** `priority` next/image — görünür hero için true. */
  priority?: boolean;
  /** Görsel `sizes` ipucu. */
  sizes?: string;

  /** Tür rozeti (etkinlik kategorisi / gönüllülük türü). */
  typeLabel?: string;
  /** İkincil rozet (kategori vb.) — opsiyonel. */
  secondaryLabel?: string;

  /** Düzenleyen logosu (kare/yuvarlak). */
  organizerLogoUrl?: string;
  /** Düzenleyen adı. */
  organizerName: string;
  /** Düzenleyen profili linki — verilirse ada tıklanır. */
  organizerHref?: string;

  /** Başlık (etkinlik adı / ilan başlığı). */
  title: string;

  /** Tarih metni (ör. "21 Haziran 2026"). */
  dateLabel?: string;
  /** Saat metni (ör. "14:00"). */
  timeLabel?: string;
  /** Konum metni (ör. "Kadıköy, İstanbul" / "Online"). */
  locationLabel?: string;

  /** Sol üst geri aksiyonu. */
  backSlot?: React.ReactNode;
  /** Sağ üst paylaş aksiyonu. */
  shareSlot?: React.ReactNode;
  /**
   * Künyenin EN ALTINA gömülen aksiyon (ör. afiş üzeri Katıl CTA).
   * Gönüllülükte boş bırakılıp CTA gövdede/sticky barda kalabilir.
   */
  ctaSlot?: React.ReactNode;

  className?: string;
};

export function DetailHero({
  imageUrl,
  imageAlt,
  aspect,
  rounded = true,
  priority = true,
  sizes = '(max-width: 1024px) 100vw, 460px',
  typeLabel,
  secondaryLabel,
  organizerLogoUrl,
  organizerName,
  organizerHref,
  title,
  dateLabel,
  timeLabel,
  locationLabel,
  backSlot,
  shareSlot,
  ctaSlot,
  className,
}: DetailHeroProps) {
  // Kapak görseli yoksa "hangel" yazan placeholder yerine sade nötr gradient (Apple-temiz).
  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  // Oran verildiyse aspect kutusu; verilmediyse geniş bant (responsive yükseklik).
  const frameSizing = aspect
    ? { className: 'w-full', style: { aspectRatio: aspect } }
    : { className: 'h-[42vh] min-h-[320px] max-h-[520px] w-full', style: undefined };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        rounded ? 'rounded-3xl shadow-glass-prominent border border-border/60' : '',
        frameSizing.className,
        className,
      )}
      style={frameSizing.style}
    >
      {hasImage ? (
        <>
          {/*
            ARKA PLAN — aynı görselin bulanık/büyütülmüş object-cover kopyası.
            Portre afiş/A4 dikey gibi çerçeveye oturmayan görsellerde yanları
            siyah bar yerine görselin KENDİ renkleriyle yumuşakça doldurur
            (Apple Photos / Music'in off-ratio artwork tekniği).
          */}
          <Image
            src={imageUrl as string}
            alt=""
            aria-hidden
            fill
            className="scale-110 object-cover opacity-60 blur-2xl"
            priority={priority}
            sizes={sizes}
          />
          {/* Bulanık zemin üstüne hafif koyu tint — kontrastı toparlar. */}
          <div className="pointer-events-none absolute inset-0 bg-black/25" />

          {/*
            ÖN PLAN — afişin tamamı: object-contain ile hiç kırpılmadan,
            ortalanmış. Köşelere değmemesi için hafif iç boşluk (çerçeve hissi).
          */}
          <Image
            src={imageUrl as string}
            alt={imageAlt}
            fill
            className="object-contain p-1.5 sm:p-2"
            priority={priority}
            sizes={sizes}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-primary/10" />
      )}

      {/*
        GÜÇLÜ gradient scrim — beyaz künye okunabilirliği için.
        object-contain ile afiş alta kadar inmeyebilir; alttaki künye metni
        (başlık/tarih/konum) açık renkli afiş + bulanık zemin üzerinde de
        okunur kalsın diye alt scrim güçlendirildi:
        from-black/90 → via-black/45 → to-transparent.
      */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
      />

      {/*
        Üst aksiyon barı — geri (sol) + paylaş (sağ) TEK satırda, viewport'a
        güvenli yaslı. shareSlot birden çok buton (QR + Paylaş) içerdiğinden,
        dar ekranda (≤390px) sağ kenardan taşıp kırpılıyordu → satırı
        justify-between + min-w-0 ile sınırla, paylaş grubunu sona hizala.
      */}
      {(backSlot || shareSlot) && (
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
          <div className="pointer-events-auto shrink-0">{backSlot}</div>
          {shareSlot && (
            <div className="pointer-events-auto flex min-w-0 shrink flex-wrap justify-end gap-2">
              {shareSlot}
            </div>
          )}
        </div>
      )}

      {/* KÜNYE overlay — afişin altına yaslı; beyaz metin + drop-shadow */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-5 text-white sm:p-7">
        {(typeLabel || secondaryLabel) && (
          <div className="flex flex-wrap gap-2">
            {typeLabel && (
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                {typeLabel}
              </span>
            )}
            {secondaryLabel && (
              <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                {secondaryLabel}
              </span>
            )}
          </div>
        )}

        <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight drop-shadow-md sm:text-3xl md:text-4xl">
          {title}
        </h1>

        <OrganizerRow
          logoUrl={organizerLogoUrl}
          name={organizerName}
          href={organizerHref}
        />

        {(dateLabel || timeLabel || locationLabel) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-white/90 drop-shadow sm:text-sm">
            {dateLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0" />
                {dateLabel}
              </span>
            )}
            {timeLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {timeLabel}
              </span>
            )}
            {locationLabel && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {locationLabel}
              </span>
            )}
          </div>
        )}

        {ctaSlot && <div className="mt-1">{ctaSlot}</div>}
      </div>
    </div>
  );
}

function OrganizerRow({
  logoUrl,
  name,
  href,
}: {
  logoUrl?: string;
  name: string;
  href?: string;
}) {
  const inner = (
    <>
      {logoUrl && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white">
          {/* Organizatör logosu rastgele harici host olabilir → next/image whitelist'ine
              takılmamak için <img>. Küçük dekoratif logo; optimize gerekmez. */}
          <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
        </span>
      )}
      <span className="min-w-0 break-words text-sm font-semibold text-white drop-shadow-sm sm:text-base">
        {name}
      </span>
    </>
  );

  if (href && href !== '#') {
    return (
      <Link
        href={href}
        className="inline-flex max-w-full min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90"
      >
        {inner}
      </Link>
    );
  }

  return <div className="inline-flex max-w-full min-w-0 items-center gap-2.5">{inner}</div>;
}
