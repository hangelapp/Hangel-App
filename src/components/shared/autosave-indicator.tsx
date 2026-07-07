'use client';

import { Check, Loader2 } from 'lucide-react';
import type { AutosaveStatus } from '@/hooks/use-autosave';

/** Apple tarzı sakin durum rozeti: Kaydediliyor… / ✓ Kaydedildi / hata. */
export function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === 'idle') return null;
  return (
    <span aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      {status === 'saving' && (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Kaydediliyor…</>)}
      {status === 'saved' && (<><Check className="h-3.5 w-3.5 text-emerald-600" /> Kaydedildi</>)}
      {status === 'error' && <span className="text-destructive">Kaydedilemedi — Kaydet&apos;e dokun</span>}
    </span>
  );
}
