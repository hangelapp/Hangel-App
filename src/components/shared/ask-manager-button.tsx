'use client';

/**
 * "Yöneticiye sor" — etkinliğe katılan / gönüllülüğe onaylanan kullanıcı, ilgili
 * kurumun yöneticisine DM atmak için tıklar. /messages compose'unu `?to=<orgId>`
 * ile açar; compose kurumu önceden seçer (mesaj izin modeli: kullanıcı ilişkili
 * kurumlara mesaj atabilir — bkz. messages/page.tsx allowed recipients + firestore.rules).
 *
 * Etkinlik/gönüllülük sayfasındaki araç ızgarasına (Wallet/NFC/Yaka Kartı yanı)
 * oturması için ikincil ızgara butonu stilinde (dikey ikon + etiket) render eder.
 */
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AskManagerButton({
  orgId,
  subject,
  className,
}: {
  orgId?: string | null;
  subject?: string;
  className?: string;
}) {
  if (!orgId) return null;
  const href = `/messages?to=${encodeURIComponent(orgId)}${subject ? `&subject=${encodeURIComponent(subject)}` : ''}`;
  return (
    <Button asChild size="lg" variant="secondary" className={cn('h-16 rounded-2xl font-semibold flex-col gap-1.5 px-2 min-w-0', className)}>
      <Link href={href} aria-label="Yöneticiye sor" title="Yöneticiye sor">
        <MessageCircle className="h-5 w-5 shrink-0" />
        <span className="text-[11px] text-center leading-tight break-words">Yöneticiye sor</span>
      </Link>
    </Button>
  );
}
