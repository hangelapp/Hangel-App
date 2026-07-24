'use client';

/**
 * Sosyal Medya paylaşım butonu + diyaloğu.
 *
 * Etkinlik veya gönüllülük ilanı yönetim panellerinde her kartın yanına konur.
 * Tıklayınca seçili içerik için POST /api/ngo-admin/social-share çağrılır;
 * yapay zeka 5 platforma (X, Instagram, Facebook, LinkedIn, WhatsApp) AYRI
 * paylaşım metni üretir. Her platform için metin + hashtag'ler bir kartta
 * gösterilir; yönetici "Kopyala" ile panoya alır.
 */

import { useState } from 'react';
import { Share2, Copy, Loader2, Sparkles, RefreshCw, Code2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';

// AI flow ile birebir uyumlu (src/ai/flows/social-share-types.ts).
type SocialPlatform = 'x' | 'instagram' | 'facebook' | 'linkedin' | 'whatsapp';
interface SocialPost {
  platform: SocialPlatform;
  text: string;
  hashtags: string[];
}

export interface SocialShareItem {
  title: string;
  description?: string;
  date?: string;
  location?: string;
  city?: string;
  ngoName?: string;
  url?: string;
  /** Web sitesine gömme (iframe) kodu için: kuruluş (STK/kulüp) doc id + içerik id. */
  ngoId?: string;
  itemId?: string;
}

// lucide'de marka ikonu yok → metin etiketi kullanıyoruz.
const PLATFORM_META: Record<SocialPlatform, { label: string; badge: string }> = {
  x: { label: 'X', badge: 'bg-foreground text-background' },
  instagram: { label: 'Instagram', badge: 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white' },
  facebook: { label: 'Facebook', badge: 'bg-[#1877f2] text-white' },
  linkedin: { label: 'LinkedIn', badge: 'bg-[#0a66c2] text-white' },
  whatsapp: { label: 'WhatsApp', badge: 'bg-[#25d366] text-white' },
};

export function SocialShareButton({ kind, item }: { kind: 'event' | 'volunteering'; item: SocialShareItem }) {
  const { user } = useUser();
  const { toast } = useToast();
  const { withEntityHeaders } = useActiveEntity();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Web sitesine gömme (iframe) kodu — yalnız ngoId biliniyorsa. Tek içerik için
  // ?event= / ?listing= parametresi eklenir. Public embed endpoint'i CSP
  // frame-ancestors * ile dış sitede yüklenir.
  const embedBase = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
  const embedUrl = item.ngoId
    ? (kind === 'event'
        ? `${embedBase}/api/public/events/${item.ngoId}/embed${item.itemId ? `?event=${item.itemId}` : ''}`
        : `${embedBase}/api/public/volunteering/${item.ngoId}/embed${item.itemId ? `?listing=${item.itemId}` : ''}`)
    : '';
  const embedCode = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="600" style="border:0;border-radius:16px" loading="lazy" title="${kind === 'event' ? 'Etkinlikler' : 'Gönüllülük İlanları'}"></iframe>`
    : '';
  const copyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      toast({ title: 'Kopyalandı', description: 'iframe kodu panoya kopyalandı. Web sitene yapıştırabilirsin.' });
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Kodu elle seçip kopyalayabilirsin.' });
    }
  };

  const generate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
      return;
    }
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/social-share', withEntityHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ kind, ...item }),
      }));
      const data = (await res.json().catch(() => null)) as { ok?: boolean; posts?: SocialPost[]; message?: string } | null;
      if (!res.ok || !data?.posts) {
        throw new Error(data?.message || 'Paylaşım metni oluşturulamadı.');
      }
      setPosts(data.posts);
      setLoaded(true);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Oluşturulamadı', description: e instanceof Error ? e.message : 'Lütfen tekrar dene.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // İlk açılışta otomatik üret.
    if (next && !loaded && !loading) void generate();
  };

  const copyPost = async (p: SocialPost) => {
    const tags = p.hashtags?.length ? p.hashtags.join(' ') : '';
    // Metinde hashtag zaten geçiyor olabilir; tekrar ekleme (basit kontrol).
    const text = tags && !p.text.includes(tags) && !p.hashtags.every((h) => p.text.includes(h))
      ? `${p.text}\n\n${tags}`
      : p.text;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Kopyalandı', description: `${PLATFORM_META[p.platform].label} metni panoya kopyalandı.` });
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Tarayıcı pano erişimini engelledi; metni elle seçebilirsin.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1.5" /> Sosyal Medya
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Sosyal Medya Paylaşımı
          </DialogTitle>
          <DialogDescription className="text-xs">
            &ldquo;{item.title}&rdquo; için her platforma özel hazır metin. Beğendiğini kopyalayıp paylaş.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">Metinler hazırlanıyor…</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((p) => {
              const meta = PLATFORM_META[p.platform] ?? { label: p.platform, badge: 'bg-muted text-foreground' };
              return (
                <div key={p.platform} className="rounded-2xl border border-border/60 bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => void copyPost(p)}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Kopyala
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{p.text}</p>
                  {p.hashtags?.length > 0 && (
                    <p className="text-xs text-primary break-words">{p.hashtags.join(' ')}</p>
                  )}
                </div>
              );
            })}

            <Button variant="ghost" size="sm" className="w-full" onClick={() => void generate()} disabled={loading}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Yeniden üret
            </Button>
          </div>
        )}

        {!loading && loaded && posts.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p>Metin üretilemedi.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void generate()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Tekrar dene
            </Button>
          </div>
        )}

        {/* Web sitene göm — iframe kodu (ngoId biliniyorsa). En altta, ayrı bölüm. */}
        {embedCode && (
          <div className="mt-4 space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">Web sitene ekle</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  Aşağıdaki kodu web sitene yapıştır — {kind === 'event' ? 'etkinlik' : 'ilan'} otomatik görünür ve güncellenir.
                </p>
              </div>
            </div>
            <pre className="text-[11px] bg-background rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono border">{embedCode}</pre>
            <Button variant="outline" size="sm" onClick={() => void copyEmbed()} className="w-full">
              {embedCopied ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {embedCopied ? 'Kopyalandı' : 'iframe kodunu kopyala'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
