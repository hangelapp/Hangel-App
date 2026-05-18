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

function buildGetter(data: unknown) {
    return function get<T = string>(path: string, fallback: T): T {
        if (!data) return fallback;
        const keys = path.split('.');
        let cur: unknown = data;
        for (const k of keys) {
            if (cur == null || typeof cur !== 'object') return fallback;
            cur = (cur as Record<string, unknown>)[k];
        }
        if (cur === undefined || cur === null || cur === '') return fallback;
        return cur as T;
    };
}

type SiteContentDoc = Record<string, unknown> & {
    pages?: Record<string, Record<string, unknown>>;
    projectPages?: Record<string, Record<string, unknown>>;
};

export function useWebContent() {
    const db = useFirestore();
    const ref = useMemoFirebase(() => (db ? doc(db, SETTINGS_DOC, 'webContent') : null), [db]);
    const { data, isLoading } = useDoc<SiteContentDoc>(ref);
    return { data, isLoading, get: buildGetter(data) };
}

/**
 * Belirli bir slug'lı tanıtım/kurumsal sayfa için içeriği döner.
 * /super-admin/web-content "Sayfalar" sekmesinde düzenlenir.
 *
 * Kullanım:
 *   const page = useWebPage('press');
 *   <h1>{page.title || 'Basın Odası'}</h1>
 *   {page.body && <div dangerouslySetInnerHTML={{ __html: page.body }} />}
 */
export function useWebPage(slug: string) {
    const { data, isLoading } = useWebContent();
    const page = (data?.pages?.[slug] || {}) as {
        title?: string;
        subtitle?: string;
        description?: string;
        heroImageUrl?: string;
        body?: string;
    };
    return { ...page, isLoading };
}

export function useAssociationContent() {
    const db = useFirestore();
    const ref = useMemoFirebase(() => (db ? doc(db, SETTINGS_DOC, 'associationContent') : null), [db]);
    const { data, isLoading } = useDoc<SiteContentDoc>(ref);
    return { data, isLoading, get: buildGetter(data) };
}

/**
 * Belirli bir slug'lı dernek proje sayfası içeriğini döner.
 * /super-admin/association-content "Proje Sayfaları" bölümünde düzenlenir.
 *
 * Kullanım:
 *   const project = useAssociationProject('etki-atlasi');
 *   <h1>{project.title || fallback}</h1>
 */
export function useAssociationProject(slug: string) {
    const { data, isLoading } = useAssociationContent();
    const project = (data?.projectPages?.[slug] || {}) as {
        title?: string;
        subtitle?: string;
        description?: string;
        heroImageUrl?: string;
        body?: string;
    };
    return { ...project, isLoading };
}
