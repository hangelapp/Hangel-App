"use client";

// hangel A6 yaka kartı önizleme + indir + paylaş kartı.
// Why:
// - Tek satırda 3 aksiyon (Önizle / İndir / Paylaş) — kart altına yapışır.
// - Önizleme: PDF'i blob'dan object URL'e çevirip <iframe> içinde göster.
//   Native uygulamada iframe rendering sorunlu olabilir → "yeni sekmede aç" fallback.
// - İndir: Web → <a download>; Native → Capacitor Filesystem + Share.
// - Paylaş: Native → @capacitor/share; Web → navigator.share || WhatsApp/Email fallback.

import { useCallback, useEffect, useState } from "react";
import { Download, Eye, Loader2, Share2, ExternalLink, MessageSquare, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/capacitor";
import { saveAndShareFileNative } from "@/lib/native-file";
import {
  badgeFileName,
  certificateUrl,
  generateVolunteerBadgePDF,
  type BadgeInput,
} from "@/lib/badge-generator";

export type BadgeCardPreviewProps = {
  certificate: BadgeInput["certificate"];
  user: BadgeInput["user"];
  ngo: BadgeInput["ngo"];
  className?: string;
};

export function BadgeCardPreview({
  certificate,
  user,
  ngo,
  className,
}: BadgeCardPreviewProps) {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<null | "preview" | "download" | "share">(null);

  // Object URL temizleme — bellek sızıntısı engeli.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const buildBlob = useCallback(async (): Promise<Blob> => {
    return generateVolunteerBadgePDF(certificate, user, ngo);
  }, [certificate, user, ngo]);

  const handlePreview = async () => {
    try {
      setLoading("preview");
      const blob = await buildBlob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (err) {
      toast({
        title: "Önizleme hatası",
        description: (err as Error).message || "Yaka kartı oluşturulamadı.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading("download");
      const blob = await buildBlob();
      const filename = badgeFileName(certificate);

      if (isNativeApp()) {
        // Native: Cache'e yaz + paylaşım sayfası (Documents Android 11+'ta
        // yazılamaz, ayrıntı: src/lib/native-file.ts)
        await saveAndShareFileNative(blob, filename, {
          title: "hangel yaka kartı",
          text: certificate.title,
          dialogTitle: "Yaka kartını paylaş",
        });
      } else {
        // Web: <a download>
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "İndirildi",
        description: "Yaka kartı PDF olarak hazır.",
      });
    } catch (err) {
      toast({
        title: "İndirme hatası",
        description: (err as Error).message || "Yaka kartı indirilemedi.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleShare = async () => {
    const url = certificateUrl(certificate);
    const text = `${certificate.title} — hangel gönüllülük sertifikam`;

    if (isNativeApp()) {
      try {
        setLoading("share");
        const blob = await buildBlob();
        const filename = badgeFileName(certificate);
        await saveAndShareFileNative(blob, filename, {
          title: "hangel yaka kartı",
          text,
          dialogTitle: "Yaka kartını paylaş",
        });
      } catch (err) {
        toast({
          title: "Paylaşma hatası",
          description: (err as Error).message || "Yaka kartı paylaşılamadı.",
          variant: "destructive",
        });
      } finally {
        setLoading(null);
      }
      return;
    }

    // Web: navigator.share varsa onu kullan, yoksa fallback dialog
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        setLoading("share");
        await navigator.share({ title: "hangel yaka kartı", text, url });
        setLoading(null);
        return;
      } catch {
        // Kullanıcı iptal etti veya desteklenmedi — fallback'e geç
        setLoading(null);
      }
    }
    setShareOpen(true);
  };

  const shareUrl = certificateUrl(certificate);
  const shareText = `${certificate.title} — hangel gönüllülük sertifikam`;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={loading !== null}
        >
          {loading === "preview" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          Önizle
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleDownload}
          disabled={loading !== null}
        >
          {loading === "download" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          İndir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={loading !== null}
        >
          {loading === "share" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          Paylaş
        </Button>
      </div>

      {/* Önizleme dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yaka kartı önizleme</DialogTitle>
          </DialogHeader>
          <div className="aspect-[105/148] w-full overflow-hidden rounded-md border bg-muted">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title="hangel yaka kartı önizleme"
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {previewUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Yeni sekmede aç
                </a>
              </Button>
            ) : null}
            <Button size="sm" onClick={handleDownload} disabled={loading !== null}>
              <Download className="mr-2 h-4 w-4" /> İndir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paylaşım fallback dialog (web — navigator.share yok ise) */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yaka kartını paylaş</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp ile paylaş
              </Button>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(
                `${shareText}\n\n${shareUrl}`,
              )}`}
              className="block"
            >
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                E-posta ile paylaş
              </Button>
            </a>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: "Link kopyalandı", description: shareUrl });
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Linki kopyala
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
