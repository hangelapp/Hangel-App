'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Süper admin tarafından düzenlenebilen Firestore site içeriklerini okur.
 * `siteSettings/webContent` ve `siteSettings/associationContent` doc'ları için
 * iki ayrı hook sağlar. Doc yoksa veya alan boşsa, çağrı yerinde verilen
 * fallback string'i döner.
 *
 * Kullanım:
 *   const { get } = useWebContent();
 *   <h1>{get('home.heroTitle', 'yok öyle yalnız başına mücadele etmek.')}</h1>
 *
 *   const { get: aget } = useAssociationContent();
 *   <p>{aget('about.heroDescription', 'Biz, dünyayı...')}</p>
 */

const SETTINGS_DOC = 'siteSettings';

function buildGetter(data: any) {
    return function get<T = string>(path: string, fallback: T): T {
        if (!data) return fallback;
        const keys = path.split('.');
        let cur: any = data;
        for (const k of keys) {
            if (cur == null || typeof cur !== 'object') return fallback;
            cur = cur[k];
        }
        if (cur === undefined || cur === null || cur === '') return fallback;
        return cur as T;
    };
}

export function useWebContent() {
    const db = useFirestore();
    const ref = useMemoFirebase(() => (db ? doc(db, SETTINGS_DOC, 'webContent') : null), [db]);
    const { data, isLoading } = useDoc<any>(ref);
    return { data, isLoading, get: buildGetter(data) };
}

export function useAssociationContent() {
    const db = useFirestore();
    const ref = useMemoFirebase(() => (db ? doc(db, SETTINGS_DOC, 'associationContent') : null), [db]);
    const { data, isLoading } = useDoc<any>(ref);
    return { data, isLoading, get: buildGetter(data) };
}
