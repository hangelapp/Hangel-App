'use client';

import { useEffect, useState } from 'react';
import type { NGO } from '@/lib/types';

type Counts = Record<string, { donors: number; volunteers: number }>;

/**
 * NGO listelerinde "Bağışçı" ve "Gönüllü" rakamlarının gerçek (kullanıcı
 * ilişkisi bazlı) değerleri. /api/ngos/engagement endpoint'i 30s cache'li,
 * client tarafında da 30s polling.
 *
 * Returns: { counts, enrich }. `enrich(ngos)` her NGO'yu real counts ile
 * günceller (sıralama tutarlılığı için kullanılan field set'ini yansıtır).
 */
export function useNgoRealtimeStats() {
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    let active = true;
    const fetchCounts = () => {
      fetch('/api/ngos/engagement')
        .then((r) => r.json())
        .then((d) => { if (active && d?.ok && d.counts) setCounts(d.counts); })
        .catch(() => {});
    };
    fetchCounts();
    const t = setInterval(fetchCounts, 30_000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const enrich = <T extends NGO>(ngos: T[] | null | undefined): T[] => {
    if (!ngos) return [];
    return ngos.map((n) => {
      const rc = counts[n.id];
      if (!rc) return n;
      return {
        ...n,
        stats: { ...(n.stats ?? {}), donors: rc.donors, volunteers: rc.volunteers },
      } as T;
    });
  };

  return { counts, enrich };
}
