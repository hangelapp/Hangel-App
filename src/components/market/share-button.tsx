'use client';

// PAYLAŞ butonu — ürünü BAĞIŞ vurgulu bir mesajla paylaşır (viral büyüme).
// Mobil/PWA'da native paylaşım (navigator.share); masaüstünde WhatsApp / X /
// Kopyala seçenekli açılır menü. Bağımsızdır (yeni kütüphane yok).

import { useState } from 'react';
import { Share2, MessageCircle, Twitter, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { donationAmountTRY } from '@/lib/market/donation-value';
import type { CanonicalProduct } from '@/lib/feed/types';

export function ShareButton({
  product,
  donationRate,
}: {
  product: CanonicalProduct;
  donationRate: number;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const url = `https://hangel.org/products/${product.id}`;
  const amount = Math.round(donationAmountTRY(product, donationRate));
  const text =
    donationRate > 0
      ? `${product.title} — hangel'de al, tutarın %${donationRate}'i ≈ ${amount} TL bağışa dönüşür 🧡`
      : `${product.title} — hangel'de al, iyiliğe dönüştür 🧡`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;

  // Native paylaşım (mobil/PWA). Kullanıcı iptal ederse (AbortError) sessiz geç.
  const nativeShare = async () => {
    try {
      await navigator.share({ title: product.title, text, url });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Diğer hatalar da sessiz — paylaşım best-effort.
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(text + ' ' + url);
      setCopied(true);
      toast({ title: 'Kopyalandı ✓', description: 'Paylaşım metni panoya kopyalandı.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano erişimi yok — sessiz.
    }
  };

  const hasNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Native paylaşım varsa doğrudan tetikleyen tek buton.
  if (hasNativeShare) {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 gap-2 rounded-2xl font-black"
        onClick={nativeShare}
        aria-label="Paylaş"
      >
        <Share2 className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Paylaş</span>
      </Button>
    );
  }

  // Masaüstü — açılır menü ile WhatsApp / X / Kopyala.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 gap-2 rounded-2xl font-black"
          aria-label="Paylaş"
        >
          <Share2 className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Paylaş</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a href={whatsappHref} target="_blank" rel="noreferrer noopener" className="gap-2">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={twitterHref} target="_blank" rel="noreferrer noopener" className="gap-2">
            <Twitter className="h-4 w-4" aria-hidden="true" />
            X / Twitter
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void copyLink();
          }}
          className="gap-2"
        >
          {copied ? (
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? 'Kopyalandı ✓' : 'Kopyala'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ShareButton;
