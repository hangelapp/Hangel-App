'use client';

/**
 * PersonalizedMaterials — kuruma ÖZEL tanıtım materyalleri (canvas ile üretilir).
 *
 * Her materyal, aktif kurumun KENDİ logosu + KENDİ profil QR'ı + sosyal alanına
 * göre seçilen söylem (çevre/sağlık/çocuk…) ile oluşturulur. Saf canvas kullanılır
 * (SVG-as-img'de web font sorunu olmasın; fillText sayfadaki Poppins'i kullanır).
 * Harici logo same-origin /api/img-proxy üzerinden çekilir → canvas kirlenmez,
 * indirme/paylaşım çalışır.
 *
 * Her kartta: Önizleme + İndir (PNG) + Önizle (yeni sekme) + Paylaş.
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Eye, Share2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { areaSlogan, PERSONALIZED_SPECS, type MaterialSpec } from '@/lib/personalized-materials';

export type PersonalizedOrg = { name: string; logoUrl?: string; socialArea?: string; profileUrl: string };

const BRAND = '#f34723';
const INK = '#1f1f1f';
const GRAY = '#6b7280';
const FONT = "Poppins, -apple-system, system-ui, sans-serif";

function proxied(url?: string): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? `/api/img-proxy?url=${encodeURIComponent(url)}` : url;
}

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function qrDataUri(text: string, size = 640): Promise<string | null> {
  try {
    const QR = (await import('qrcode')).default;
    return await QR.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'H' });
  } catch {
    return null;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > r) { sw = img.height * r; sx = (img.width - sw) / 2; }
  else { sh = img.width / r; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function renderMaterial(
  spec: MaterialSpec,
  org: PersonalizedOrg,
  qr: HTMLImageElement | null,
  logo: HTMLImageElement | null,
): string | null {
  const { w, h } = spec;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { headline, sub } = areaSlogan(org.socialArea);
  const M = Math.round(w * 0.07);
  const contentW = w - M * 2;

  // Zemin
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Üst narçiçeği bant + hangel
  const bandH = Math.round(h * 0.135);
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, w, bandH);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(bandH * 0.42)}px ${FONT}`;
  ctx.fillText('hangel', M, bandH * 0.5);
  ctx.textAlign = 'right';
  ctx.font = `600 ${Math.round(bandH * 0.16)}px ${FONT}`;
  ctx.fillText('iyilik platformu', w - M, bandH * 0.52);

  // Kurum logosu (beyaz yuvarlak plaka) + adı
  const logoBox = Math.round(w * 0.2);
  const logoY = bandH + Math.round(h * 0.035);
  ctx.save();
  roundRect(ctx, M, logoY, logoBox, logoBox, Math.round(logoBox * 0.24));
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fill();
  ctx.restore();
  if (logo) {
    ctx.save();
    const pad = Math.round(logoBox * 0.12);
    roundRect(ctx, M + pad, logoY + pad, logoBox - pad * 2, logoBox - pad * 2, Math.round(logoBox * 0.16));
    ctx.clip();
    drawImageCover(ctx, logo, M + pad, logoY + pad, logoBox - pad * 2, logoBox - pad * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = BRAND;
    ctx.font = `800 ${Math.round(logoBox * 0.4)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((org.name || 'H').charAt(0).toLocaleUpperCase('tr'), M + logoBox / 2, logoY + logoBox / 2);
  }
  // Kurum adı (logonun sağında)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(w * 0.045)}px ${FONT}`;
  const nameLines = wrapLines(ctx, org.name || '', contentW - logoBox - M * 0.5, 2);
  const nameLineH = w * 0.052;
  const nameStartY = logoY + logoBox / 2 - ((nameLines.length - 1) * nameLineH) / 2;
  nameLines.forEach((ln, i) => ctx.fillText(ln, M + logoBox + Math.round(M * 0.5), nameStartY + i * nameLineH));

  // Söylem (başlık)
  let y = logoY + logoBox + Math.round(h * 0.06);
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = `800 ${Math.round(w * 0.082)}px ${FONT}`;
  const hLines = wrapLines(ctx, headline, contentW, 3);
  const hLineH = w * 0.092;
  hLines.forEach((ln) => { ctx.fillText(ln, M, y); y += hLineH; });

  // Alt metin
  y += Math.round(h * 0.008);
  ctx.fillStyle = GRAY;
  ctx.font = `500 ${Math.round(w * 0.037)}px ${FONT}`;
  const sLines = wrapLines(ctx, sub, contentW, 3);
  const sLineH = w * 0.05;
  sLines.forEach((ln) => { ctx.fillText(ln, M, y); y += sLineH; });

  // QR kartı (alt)
  const qrBox = Math.round(w * 0.4);
  const cardPad = Math.round(w * 0.05);
  const cardW = contentW;
  const cardH = qrBox + cardPad * 2;
  const cardX = M;
  const cardY = h - cardH - Math.round(h * 0.06);
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, Math.round(w * 0.045));
  ctx.fillStyle = '#fff5f2';
  ctx.strokeStyle = BRAND;
  ctx.lineWidth = Math.max(2, Math.round(w * 0.004));
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  const qrX = cardX + cardPad;
  const qrY = cardY + cardPad;
  if (qr) {
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 8, qrY - 8, qrBox + 16, qrBox + 16, 12);
    ctx.fill();
    ctx.drawImage(qr, qrX, qrY, qrBox, qrBox);
  }
  // QR yanı metin
  const tx = qrX + qrBox + cardPad;
  const tw = cardX + cardW - cardPad - tx;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = BRAND;
  ctx.font = `800 ${Math.round(w * 0.05)}px ${FONT}`;
  const ctaLines = wrapLines(ctx, 'Okut, alışverişini bağışa çevir', tw, 3);
  let ty = cardY + cardPad + Math.round(w * 0.01);
  const ctaLineH = w * 0.058;
  ctaLines.forEach((ln) => { ctx.fillText(ln, tx, ty); ty += ctaLineH; });
  ctx.fillStyle = INK;
  ctx.font = `600 ${Math.round(w * 0.03)}px ${FONT}`;
  ty += Math.round(w * 0.01);
  const short = org.profileUrl.replace(/^https?:\/\//, '');
  wrapLines(ctx, short, tw, 2).forEach((ln) => { ctx.fillText(ln, tx, ty); ty += w * 0.04; });

  // Footer
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = GRAY;
  ctx.font = `600 ${Math.round(w * 0.028)}px ${FONT}`;
  ctx.fillText(`hangel.org  ·  ${org.name || ''}`.slice(0, 70), w / 2, h - Math.round(h * 0.025));

  return canvas.toDataURL('image/png');
}

function MaterialCard({ spec, org, qr, logo }: { spec: MaterialSpec; org: PersonalizedOrg; qr: HTMLImageElement | null; logo: HTMLImageElement | null }) {
  const { toast } = useToast();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Fontun yüklenmesini bekle (Poppins) — canvas doğru font kullansın.
    (async () => {
      try { await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready; } catch { /* yok */ }
      if (cancelled) return;
      const url = renderMaterial(spec, org, qr, logo);
      if (!cancelled) setDataUrl(url);
    })();
    return () => { cancelled = true; };
  }, [spec, org, qr, logo]);

  const fileBase = `${org.name || 'kurum'}-${spec.key}`.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+/g, '-').slice(0, 60);

  const dataUrlToBlob = async (u: string): Promise<Blob> => (await fetch(u)).blob();

  const handleDownload = async () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${fileBase}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreview = async () => {
    if (!dataUrl) return;
    const blob = await dataUrlToBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    setBusy(true);
    try {
      const blob = await dataUrlToBlob(dataUrl);
      const file = new File([blob], `${fileBase}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { share?: (d: unknown) => Promise<void>; canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: spec.title });
      } else {
        await handleDownload();
        toast({ title: 'Paylaşım desteklenmiyor', description: 'Görsel indirildi; oradan paylaşabilirsiniz.' });
      }
    } catch { /* iptal */ } finally { setBusy(false); }
  };

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden flex flex-col">
      <div className="relative bg-muted/30 flex items-center justify-center p-3" style={{ minHeight: 180 }}>
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={spec.title} className="max-h-64 w-auto rounded-lg shadow-md" />
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col gap-2">
        <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase">Kuruma özel</Badge>
        <h3 className="font-bold text-sm leading-tight">{spec.title}</h3>
        <div className="mt-1 flex items-center gap-1.5">
          <Button className="rounded-xl font-bold flex-1" disabled={!dataUrl} onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> İndir
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl shrink-0" title="Önizle" aria-label="Önizle" disabled={!dataUrl} onClick={handlePreview}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl shrink-0" title="Paylaş" aria-label="Paylaş" disabled={!dataUrl || busy} onClick={handleShare}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PersonalizedMaterials({ org }: { org: PersonalizedOrg }) {
  const [qr, setQr] = useState<HTMLImageElement | null>(null);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [qrUri, logoImg] = await Promise.all([
        qrDataUri(org.profileUrl),
        loadImage(proxied(org.logoUrl)),
      ]);
      const qrImg = qrUri ? await loadImage(qrUri) : null;
      if (cancelled) return;
      setQr(qrImg);
      setLogo(logoImg);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [org.profileUrl, org.logoUrl]);

  const slogan = useMemo(() => areaSlogan(org.socialArea), [org.socialArea]);

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Kuruma Özel Materyaller
        </h2>
        <p className="text-xs text-muted-foreground">
          {org.name} logonuz, profil QR’ınız ve alanınıza uygun söylemle otomatik üretildi
          {org.socialArea ? ` — “${slogan.headline}”` : ''}. İndir, önizle ya da paylaş.
        </p>
      </div>
      {!ready ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Materyaller hazırlanıyor…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONALIZED_SPECS.map((spec) => (
            <MaterialCard key={spec.key} spec={spec} org={org} qr={qr} logo={logo} />
          ))}
        </div>
      )}
    </div>
  );
}
