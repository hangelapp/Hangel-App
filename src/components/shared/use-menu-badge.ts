'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, Timestamp, type Firestore, type Query, type DocumentData } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

const LS_PREFIX = 'hangel-menu-seen-v1:';

export type BadgeConfig =
  | {
      kind: 'collection';
      collectionName: string;
      // Optional status filter (e.g., 'Beklemede')
      status?: string;
      // Optional second status filter (any of these matches)
      statusIn?: string[];
      // Field name for the "new since" timestamp filter (default: 'createdAt')
      timestampField?: string;
    }
  | {
      kind: 'custom';
      // Custom Firestore query builder. Receives lastSeen Date or null and
      // returns the query to count. Return null to disable badge.
      build: (lastSeen: Date | null) => Query<DocumentData> | null;
    };

function getLastSeen(menuKey: string): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(LS_PREFIX + menuKey);
    if (!v) return null;
    const ts = parseInt(v, 10);
    return Number.isFinite(ts) ? new Date(ts) : null;
  } catch {
    return null;
  }
}

function setLastSeen(menuKey: string, when: Date = new Date()): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_PREFIX + menuKey, String(when.getTime()));
  } catch {
    /* quota or privacy mode — ignore */
  }
}

/**
 * Returns the badge count for a menu item + a clear function.
 *
 * - Reads `lastSeen` for this menuKey from localStorage.
 * - Counts items in the configured collection where `createdAt > lastSeen`
 *   (and any status filter). If `lastSeen` is null, counts all matching items.
 * - `markSeen` updates lastSeen to now and resets badge to 0.
 *
 * Re-runs the count on mount + when `version` changes (caller can bump it to
 * force refresh after acting).
 */
export function useMenuBadge(
  db: Firestore | null,
  menuKey: string,
  config: BadgeConfig,
  version: number = 0,
): { count: number; markSeen: () => void } {
  const [count, setCount] = useState<number>(0);
  const [seenVersion, setSeenVersion] = useState(0);

  useEffect(() => {
    if (!db) return;
    const lastSeen = getLastSeen(menuKey);
    let cancelled = false;

    const build = (): Query<DocumentData> | null => {
      if (config.kind === 'custom') return config.build(lastSeen) as Query<DocumentData> | null;
      const colRef = collection(db, config.collectionName);
      const filters = [];
      if (config.status) filters.push(where('status', '==', config.status));
      if (config.statusIn && config.statusIn.length > 0) filters.push(where('status', 'in', config.statusIn));
      if (lastSeen) {
        const ts = Timestamp.fromDate(lastSeen);
        filters.push(where(config.timestampField || 'createdAt', '>', ts));
      }
      return filters.length > 0 ? query(colRef, ...filters) : query(colRef);
    };

    (async () => {
      try {
        const q = build();
        if (!q) { setCount(0); return; }
        const snap = await getCountFromServer(q);
        if (!cancelled) setCount(snap.data().count);
      } catch (err) {
        // Sessizce yut — badge eksikliği uygulamayı kırmaz, sadece sayı 0 gösterilir.
        if (!cancelled) {
          setCount(0);
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[useMenuBadge] count failed for ${menuKey}:`, err);
          }
        }
      }
    })();

    return () => { cancelled = true; };
  }, [db, menuKey, version, seenVersion, config]);

  const markSeen = useCallback(() => {
    setLastSeen(menuKey, new Date());
    setCount(0);
    setSeenVersion(v => v + 1);
  }, [menuKey]);

  return { count, markSeen };
}

// COLLECTIONS re-export for callers
export { COLLECTIONS };
