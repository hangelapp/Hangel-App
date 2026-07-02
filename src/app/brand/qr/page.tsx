'use client';

/**
 * /brand/qr — hangel branded QR code üreteci + indirme sayfası.
 *
 * Telefon kamerasıyla taratıldığında hangel.org (veya özel URL) açar.
 * Logo center'da, hangel orange + beyaz arka plan. Print + dijital için 5 boyut.
 *
 * Public sayfa — login gerekmez. Marketing materyalleri, basın kiti,
 * etkinlik posterleri, kartvizit, sticker için kullanılır.
 */

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup, RadioGroupItem,
} from '@/components/ui/radio-group';
import { Download, Copy, QrCode, Smartphone, CheckCircle2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HangelLogo } from '@/components/icons';

const SIZES = [
  { label: 'Küçük (kartvizit, 256px)', value: 256 },
  { label: 'Orta (sosyal medya, 512px)', value: 512 },
  { label: 'Büyük (afiş, 1024px)', value: 1024 },
  { label: 'Çok büyük (basın, 2048px)', value: 2048 },
];

export default function BrandQrPage() {
  const { toast } = useToast();
  const [url, setUrl] = useState('https://hangel.org');
  const [size, setSize] = useState(512);
  const [includeLogo, setIncludeLogo] = useState(true);

  const qrSrc = useMemo(() => {
    const params = new URLSearchParams({
      url,
      size: String(size),
      logo: includeLogo ? '1' : '0',
    });
    return `/api/brand/qr?${params.toString()}`;
  }, [url, size, includeLogo]);

  const svgSrc = useMemo(() => {
    const params = new URLSearchParams({ url, size: String(size), logo: includeLogo ? '1' : '0', format: 'svg' });
    return `/api/brand/qr?${params.toString()}`;
  }, [url, size, includeLogo]);

  const copyShareableLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${qrSrc}`);
      toast({ title: 'Kopyalandı', description: 'QR kod linki panoya yapıştırıldı.' });
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı' });
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary/5 to-background py-8 sm:py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline">hangel QR Kod</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Telefon kamerasını bu QR kara tutmak yeterli — hangel.org otomatik açılır.
            Afiş, kartvizit, sticker, sunum kapağı için indir + kullan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol: QR preview */}
          <Card className="rounded-3xl glass-surface border-white/40">
            <CardContent className="pt-6 space-y-4">
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-2xl bg-white p-6 shadow-lg">
                {/* Cache-busting via key on qrSrc — Next/Image unoptimized for dynamic API src */}
                <Image
                  key={qrSrc}
                  src={qrSrc}
                  alt={`hangel.org QR kod — ${size}px`}
                  fill
                  className="object-contain p-4"
                  unoptimized
                  priority
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Önizleme — gerçek dosya {size}×{size}px PNG (logo {includeLogo ? 'dahil' : 'kapalı'})
              </p>
            </CardContent>
          </Card>

          {/* Sağ: Ayarlar */}
          <div className="space-y-4">
            <Card className="rounded-3xl glass-surface border-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ayarlar</CardTitle>
                <CardDescription className="text-xs">
                  URL'yi değiştirebilirsin — örn. bir kampanya sayfasına yönlendir.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-xs font-bold">Hedef URL</Label>
                  <Input
                    id="url"
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://hangel.org"
                    className="h-10 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Boyut</Label>
                  <RadioGroup value={String(size)} onValueChange={v => setSize(parseInt(v, 10))}>
                    {SIZES.map(s => (
                      <div key={s.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={String(s.value)} id={`size-${s.value}`} />
                        <Label htmlFor={`size-${s.value}`} className="text-xs font-medium cursor-pointer flex-1">
                          {s.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <input
                    type="checkbox"
                    id="logo"
                    checked={includeLogo}
                    onChange={e => setIncludeLogo(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <Label htmlFor="logo" className="text-xs font-medium cursor-pointer flex-1">
                    Ortada hangel logosu (önerilen — markaya özel)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* İndirme aksiyonları */}
            <div className="grid grid-cols-1 gap-2">
              <Button asChild size="lg" className="rounded-2xl h-14 font-bold gap-2 shadow-lg shadow-primary/10">
                <a href={`${qrSrc}&download=1`} download={`hangel-qr-${size}.png`}>
                  <Download className="h-5 w-5" /> PNG İndir ({size}px)
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl h-12 font-medium gap-2">
                <a href={svgSrc} download="hangel-qr.svg">
                  <Download className="h-4 w-4" /> SVG İndir (ölçeklenebilir vektör)
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl gap-2" onClick={copyShareableLink}>
                <Copy className="h-3.5 w-3.5" /> QR Link Kopyala
              </Button>
            </div>
          </div>
        </div>

        {/* Kullanım rehberi */}
        <Card className="rounded-3xl glass-surface border-white/40 mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" /> Telefon kamerasıyla nasıl kullanılır?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">iOS Kamera</p>
                  <p className="text-xs">Kamera uygulamasını aç, QR kara tut. Üstte beliren bildirim banner'ına dokun — hangel.org Safari'de açılır.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Android Kamera</p>
                  <p className="text-xs">Google Lens veya kamerayı aç. QR algılanınca "Bağlantıyı Aç" çıkar — dokunarak Chrome'da hangel.org açılır.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kullanım yerleri öneri */}
        <Card className="rounded-3xl glass-surface border-white/40 mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nereye kullanabilirsin?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            {[
              'Etkinlik afişleri', 'Kartvizit arka yüzü', 'Sticker / etiket',
              'STK broşürü', 'Sunum kapağı', 'TV ekranı / dijital tabela',
              'Basın bülteni', 'E-posta imzası', 'Sosyal medya görseli',
            ].map(use => (
              <div key={use} className="px-3 py-2 rounded-lg bg-muted/40 font-medium text-center">{use}</div>
            ))}
          </CardContent>
        </Card>

        {/* Footer — hangel branding */}
        <div className="text-center mt-8 pt-6 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <HangelLogo className="text-sm" href={null} /> · resmi marka asset'i
          <a href="https://hangel.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline ml-2">
            hangel.org <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
