'use client';

/**
 * Cihazlar arası "diğer cihazda aç" — sağ üstteki QR butonu açar.
 *  - Masaüstündeysen: bulunduğun sayfanın QR'ını gösterir → telefon/tablet kamerayla
 *    okutup ORADA açar (devam).
 *  - Telefon/tabletteysen: adresi + "Kopyala" gösterir → bilgisayarında tarayıcıya
 *    yapıştırıp açarsın (kameralı bilgisayar QR'ı da okutabilir).
 * onScan verilirse (telefon), masaüstü GİRİŞ QR'ını okutma seçeneği de sunulur.
 */
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, Copy, Check, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DeviceHandoffDialog({
  open,
  onOpenChange,
  onScan,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onScan?: () => void;
}) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !open) return;
    setUrl(window.location.href);
    const ua = navigator.userAgent || '';
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua) || window.innerWidth < 768);
  }, [open]);

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=1&data=${encodeURIComponent(url)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Bağlantı kopyalandı', description: 'Diğer cihazda tarayıcıya yapıştır.' });
      setTimeout(() => setCopied(false), 2000);
    } catch { /* pano yok — sessiz */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isMobile ? <Monitor className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
          </span>
          <DialogTitle>{isMobile ? 'Bilgisayarda Aç' : 'Telefonda / Tablette Aç'}</DialogTitle>
          <DialogDescription>
            {isMobile
              ? 'Bilgisayarında tarayıcıya bu adresi yaz — hangel açılır. (Kameralı bilgisayar QR’ı da okutabilir.)'
              : 'Telefon/tabletinin kamerasıyla QR’ı okut — hangel orada açılır.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-1">
          {url && (
            <Image src={qr} alt="QR kodu" width={200} height={200} className="rounded-xl bg-white p-2 shadow-sm" />
          )}
          <div className="flex w-full items-center gap-2 rounded-xl border bg-muted/40 p-2">
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{url}</span>
            <Button size="sm" variant="outline" onClick={copy} className="shrink-0 gap-1">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Kopyala
            </Button>
          </div>

          {isMobile && onScan && (
            <button
              onClick={() => { onOpenChange(false); onScan(); }}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              <ScanLine className="h-3.5 w-3.5" /> Bilgisayar girişi için QR okut
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
