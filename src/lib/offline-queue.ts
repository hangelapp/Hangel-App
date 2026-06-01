'use client';

/**
 * Offline POST queue.
 *
 * Kullanıcı offline iken yapılan fetch POST/PUT/PATCH/DELETE çağrıları
 * localStorage'a kuyrukta tutulur, online'a dönülünce sırayla replay edilir.
 *
 * Firestore yazımları zaten SDK'nın IndexedDB persistence katmanına düşer
 * (bkz. `src/firebase/index.ts`). Bu kuyruk yalnızca **HTTP API** çağrıları
 * için: payment/donation, n8n webhook, /api/whatsapp/send vb.
 *
 * Kullanım:
 *   import { queueOrFetch } from '@/lib/offline-queue';
 *   const res = await queueOrFetch('/api/contact', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ name, email }),
 *   });
 *
 * Online ise normal fetch yapar. Offline ise:
 *   - request'i kuyruğa ekler
 *   - 202 + `{ queued: true }` synthetic response döner
 *   - `online` event'inde otomatik flush eder
 *
 * Sınırlamalar:
 *   - GET çağrıları kuyruğa ALINMAZ (idempotent — caller cache fallback yapsın).
 *   - Body sadece string/JSON destekli (FormData/Blob için ayrı yol gerek).
 *   - Auth header expire olabilir; replay'de 401 → kuyruktan düşür + toast (caller'a kalmış).
 */

const STORAGE_KEY = 'hangel-offline-queue:v1';
const MAX_QUEUE = 50;

type QueuedRequest = {
    id: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    timestamp: number;
    retries: number;
};

function safeReadQueue(): QueuedRequest[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed as QueuedRequest[];
    } catch {
        return [];
    }
}

function safeWriteQueue(items: QueuedRequest[]): void {
    if (typeof window === 'undefined') return;
    try {
        // Quota / corrupt → sessizce yut, kuyruğu temizle.
        const trimmed = items.slice(-MAX_QUEUE);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    }
}

function genId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}

function isQueueable(method: string | undefined): boolean {
    if (!method) return false;
    const m = method.toUpperCase();
    return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

/**
 * Kuyruğa eklenebilir mi? Body'yi string'e çevirir (yoksa undefined döner — body'siz request).
 */
function normalizeBody(body: BodyInit | null | undefined): string | undefined {
    if (body == null) return undefined;
    if (typeof body === 'string') return body;
    // FormData / Blob / ReadableStream → desteklenmiyor (queueOrFetch caller normal fetch yapmalı).
    return undefined;
}

/**
 * Offline ise kuyruğa yazar, online ise direkt fetch yapar.
 * Synthetic Response döner ki caller uniform işleyebilsin.
 */
export async function queueOrFetch(url: string, init?: RequestInit): Promise<Response> {
    const method = (init?.method || 'GET').toUpperCase();

    // GET veya online → normal fetch
    if (isOnline() || !isQueueable(method)) {
        return fetch(url, init);
    }

    // Body string'e indirgenebilir mi?
    const bodyStr = normalizeBody(init?.body);
    if (init?.body != null && bodyStr == null) {
        // Form/Blob → kuyruğa alamayız, normal fetch dene (offline error'u caller görsün).
        return fetch(url, init);
    }

    // Headers'ı plain record'a çevir
    const headers: Record<string, string> = {};
    if (init?.headers) {
        if (init.headers instanceof Headers) {
            init.headers.forEach((v, k) => { headers[k] = v; });
        } else if (Array.isArray(init.headers)) {
            for (const [k, v] of init.headers) headers[k] = v;
        } else {
            for (const k of Object.keys(init.headers as Record<string, string>)) {
                headers[k] = (init.headers as Record<string, string>)[k];
            }
        }
    }

    const item: QueuedRequest = {
        id: genId(),
        url,
        method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body: bodyStr,
        timestamp: Date.now(),
        retries: 0,
    };

    const queue = safeReadQueue();
    queue.push(item);
    safeWriteQueue(queue);

    return new Response(JSON.stringify({ queued: true, id: item.id }), {
        status: 202,
        headers: { 'Content-Type': 'application/json', 'X-Hangel-Queued': '1' },
    });
}

/**
 * Kuyrukta bekleyen request'leri sırayla replay eder.
 * - 2xx → kuyruktan düş
 * - 401/403 → token expired, kuyruktan düş (caller başka türlü farkına varsın)
 * - 5xx / network error → retries++ (max 3); 3'ten sonra düş
 */
export async function flushOfflineQueue(): Promise<{ flushed: number; failed: number }> {
    if (!isOnline()) return { flushed: 0, failed: 0 };
    const queue = safeReadQueue();
    if (queue.length === 0) return { flushed: 0, failed: 0 };

    let flushed = 0;
    let failed = 0;
    const remaining: QueuedRequest[] = [];

    for (const item of queue) {
        try {
            const res = await fetch(item.url, {
                method: item.method,
                headers: item.headers,
                body: item.body,
            });
            if (res.ok || res.status === 401 || res.status === 403 || res.status === 400) {
                flushed += 1;
                continue;
            }
            // 5xx ve diğerleri → retry
            if (item.retries < 3) {
                remaining.push({ ...item, retries: item.retries + 1 });
            } else {
                failed += 1;
            }
        } catch {
            // Network error → retry
            if (item.retries < 3) {
                remaining.push({ ...item, retries: item.retries + 1 });
            } else {
                failed += 1;
            }
        }
    }

    safeWriteQueue(remaining);
    return { flushed, failed };
}

/**
 * Kuyrukta bekleyen request sayısı (UI gösterimi için).
 */
export function getOfflineQueueSize(): number {
    return safeReadQueue().length;
}

/**
 * Kuyruğu manuel temizle (debug / settings).
 */
export function clearOfflineQueue(): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

let listenerInstalled = false;
/**
 * Tek seferlik global listener'ı kurar. Layout / provider seviyesinde çağrılmalı.
 * `online` event'inde kuyruğu otomatik flush eder.
 */
export function installOfflineQueueListener(): void {
    if (typeof window === 'undefined' || listenerInstalled) return;
    listenerInstalled = true;
    window.addEventListener('online', () => {
        void flushOfflineQueue();
    });
}
