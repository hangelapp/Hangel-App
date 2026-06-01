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

export function ShareButtons({ url, title, buttonClassName }: { url: string; title: string, buttonClassName?: string }) {
  const { toast } = useToast();

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
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
            <Button size="icon" variant="outline" className={cn("rounded-full h-9 w-9", buttonClassName)} aria-label="QR kodunu göster">
                <QrCode className="h-4 w-4" />
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profil QR Kodu</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <Image src={qrCodeUrl} alt="QR Code" width={150} height={150} />
            <p className="mt-4 text-sm text-muted-foreground">{url}</p>
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
