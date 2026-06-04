'use client';

/**
 * ContractActions — Yazdır (print → A4 friendly), Paylaş (Web Share API fallback
 * clipboard) ve Dil seçici (header'da küçük dropdown). Settings ve public viewer
 * arasında paylaşılır.
 */

import { useEffect, useState } from 'react';
import { Printer, Share2, Languages, Check, Link as LinkIcon, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useTranslation, languages } from '@/components/providers/language-provider';
import type { Language } from '@/lib/translations';

interface ContractActionsProps {
  title: string;
  /** Paylaşımda kullanılacak kısa metin (örn. "hangel — Kullanıcı Sözleşmesi"). */
  shareText?: string;
  /** Dil seçici göster — public/admin için opsiyonel. */
  showLanguagePicker?: boolean;
}

export function ContractActions({
  title,
  shareText,
  showLanguagePicker = true,
}: ContractActionsProps) {
  const { toast } = useToast();
  const { language, changeLanguage } = useTranslation();
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') setShareUrl(window.location.href);
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleShare = async () => {
    const data = {
      title: `hangel — ${title}`,
      text: shareText || title,
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return;
      } catch {
        // user cancelled or unsupported — fall through to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Bağlantı kopyalandı', description: shareUrl });
        return;
      } catch {
        // ignore
      }
    }
    toast({ variant: 'destructive', title: 'Paylaşılamadı', description: 'Tarayıcı desteklemiyor.' });
  };

  return (
    <div className="flex items-center gap-1.5 print:hidden">
      {showLanguagePicker && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5" aria-label="Dil seç">
              <Languages className="h-4 w-4" />
              <span className="text-xs uppercase font-medium">{language}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {languages.map(l => (
              <DropdownMenuItem
                key={l.value}
                onSelect={() => changeLanguage(l.value as Language)}
                className="justify-between"
              >
                <span>{l.label}</span>
                {language === l.value && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label="Paylaş"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label="Yazdır"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );
}
