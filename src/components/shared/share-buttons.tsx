"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, QrCode, Link as LinkIcon, Mail, Send, MessageSquare } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EVENTS, logHangelEvent } from "@/lib/analytics";
import { agencyShortCode } from "@/lib/agency-label";

export function ShareButtons({
  url,
  title,
  qrTitle,
  buttonClassName,
  agency,
}: {
  url: string;
  title: string;
  /**
   * QR önizleme modalının başlığı. Verilmezse `title`'dan akıllı bir başlık
   * türetilir (ör. "Etkinlik QR Kodu — {ad}"); çağıran tarafın değişmesi
   * gerekmez. Bağlamı netleştirmek için çağıran açıkça da geçebilir.
   */
  qrTitle?: string;
  buttonClassName?: string;
  /**
   * Markanın affiliate ajansı (ör. "Affocean"). Verilirse QR modalının en altına
   * linkin altına kısa ajans kodu rozeti basılır (AFF/GELİR/ACT/hangel). Marka
   * dışı kullanımlarda (etkinlik/gönüllülük) geçilmez → rozet görünmez.
   */
  agency?: string | null;
}) {
  const { toast } = useToast();

  // QR'ın NEYİN QR'ı olduğunu göster. Çağıran açık `qrTitle` geçmediyse,
  // mevcut `title`'ı bağlamla birleştir; en azından "QR Kodu" + içerik adı.
  const resolvedQrTitle = qrTitle?.trim()
    ? qrTitle
    : title?.trim()
      ? `QR Kodu — ${title}`
      : 'QR Kodu';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Kopyalandı!",
      description: "Profil linki panoya kopyalandı.",
    });
    // Analytics: paylaş kanalı segmentasyonu.
    logHangelEvent(EVENTS.share_app, { channel: 'copy_link' });
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Dialog>
        <DialogTrigger asChild>
            <Button size="icon" variant="outline" className={cn("rounded-full h-9 w-9", buttonClassName)} aria-label="QR kodunu göster">
                <QrCode className="h-4 w-4" />
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          {/* pr-8: başlık, sağ üstteki absolute X kapatma butonunun altına
              kaymasın diye boşluk bırak (mobil hizalama bozukluğu fix). */}
          <DialogHeader className="text-left">
            <DialogTitle className="pr-8 break-words">{resolvedQrTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-3 py-2 text-center">
            <Image src={qrCodeUrl} alt="QR kodu" width={150} height={150} className="rounded-xl bg-white p-2" />
            <p className="max-w-full break-all text-sm text-muted-foreground">{url}</p>
            {agency ? (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-muted-foreground">
                {agencyShortCode(agency)}
              </span>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="icon" variant="outline" className={cn("rounded-full h-9 w-9", buttonClassName)} aria-label="Paylaş">
            <Share2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paylaş</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button variant="outline" onClick={copyToClipboard} className="justify-start">
              <LinkIcon className="mr-2 h-4 w-4" />
              Linki Kopyala
            </Button>
            <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} onClick={() => logHangelEvent(EVENTS.share_app, { channel: 'email' })}>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                E-posta ile Paylaş
              </Button>
            </a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" onClick={() => logHangelEvent(EVENTS.share_app, { channel: 'telegram' })}>
              <Button variant="outline" className="w-full justify-start">
                <Send className="mr-2 h-4 w-4" />
                Telegram ile Paylaş
              </Button>
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`} target="_blank" rel="noopener noreferrer" onClick={() => logHangelEvent(EVENTS.share_app, { channel: 'whatsapp' })}>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp ile Paylaş
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
