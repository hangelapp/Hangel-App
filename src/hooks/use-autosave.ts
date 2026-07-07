'use client';

import { useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Debounce'lu otomatik kayıt. Kullanıcı bir alanı değiştirince change handler
 * `markDirty()` çağırır; state güncellenince efekt son değişiklikten `delayMs`
 * sonra `save`'i çalıştırır. İlk yükleme (Firestore hydration) dirty
 * işaretlenmediği için otomatik kayıt TETİKLEMEZ. Kaydet butonları kalır —
 * bu hook sessiz yedek katmandır.
 */
export function useAutosave(
  save: () => Promise<void>,
  deps: unknown[],
  opts?: { delayMs?: number; enabled?: boolean },
) {
  const { delayMs = 1000, enabled = true } = opts ?? {};
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const markDirty = () => { dirtyRef.current = true; };

  useEffect(() => {
    if (!enabled || !dirtyRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      dirtyRef.current = false;
      setStatus('saving');
      try {
        await saveRef.current();
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, delayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps çağıran belirler (izlenen form state'i)
  }, deps);

  return { status, markDirty };
}
