'use client';

import { useEffect, useRef } from 'react';

/**
 * useFormPersist — form state'ini localStorage'a otomatik yedekler; kullanıcı
 * sayfayı kapatsa/gitse bile geri döndüğünde girdikleri KAYBOLMAZ.
 *
 * Kullanım:
 *   const [formData, setFormData] = useState(initial);
 *   const { clear } = useFormPersist('corporate-register', formData, setFormData);
 *   // Form başarıyla GÖNDERİLİNCE: clear() → taslağı sil.
 *
 * - `key`: benzersiz taslak anahtarı (form başına bir tane).
 * - Sadece client'ta çalışır (SSR-safe: window guard).
 * - `exclude`: yedeklenmesini istemediğin alanlar (örn. dosya/parola).
 * - İlk mount'ta localStorage'da taslak varsa `restore(saved)` ile state'e yükler.
 * - Her değişiklikte (debounce'suz; state referansı değişince) yazar.
 */
export function useFormPersist<T extends Record<string, unknown>>(
  key: string,
  value: T,
  restore: (saved: Partial<T>) => void,
  opts?: { exclude?: (keyof T)[]; enabled?: boolean },
) {
  const storageKey = `hangel:form-draft:${key}`;
  const restoredRef = useRef(false);
  const enabled = opts?.enabled ?? true;

  // 1) İlk mount: kayıtlı taslak varsa geri yükle (bir kez).
  useEffect(() => {
    if (!enabled || restoredRef.current || typeof window === 'undefined') return;
    restoredRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        if (parsed && typeof parsed === 'object') restore(parsed);
      }
    } catch {
      // Bozuk/erişilemez localStorage — sessiz geç.
    }
    // restore fonksiyonu her render'da değişebilir; yalnız mount'ta çalışsın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled]);

  // 2) value değişince yeni taslağı yaz (restore tamamlandıktan sonra).
  useEffect(() => {
    if (!enabled || !restoredRef.current || typeof window === 'undefined') return;
    try {
      const exclude = opts?.exclude ?? [];
      const toSave: Record<string, unknown> = {};
      for (const k of Object.keys(value)) {
        if (!exclude.includes(k as keyof T)) toSave[k] = value[k];
      }
      window.localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // Kota/private-mode — sessiz geç (taslak best-effort).
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, storageKey, enabled]);

  const clear = () => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey);
    } catch { /* sessiz */ }
  };

  return { clear };
}
