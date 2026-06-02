/**
 * Hangel telemetry — production'da sessiz, dev'de console.
 *
 * Best-effort akışlarda (welcome mail, opsiyonel push, vb.) yakalanan hatalar
 * için ortak rapor noktası. Akışı kesmez, throw etmez.
 *
 * - Production: Firebase Analytics'e `non_fatal_error` event'i (PII'siz).
 * - Development: `clientLogger.warn` (prod'da sessiz).
 *
 * Kullanım:
 *   try { ... } catch (e) { reportNonFatalError('welcome_send_individual', e); }
 */

import { logRawEvent } from '@/lib/analytics';
import { clientLogger } from '@/lib/client-logger';

const isProd =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

type ExtraParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Hata mesajını PII riski olmayacak şekilde kısaltır. Stack atılır,
 * mesaj 200 char ile clamp edilir.
 */
function shortMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message.slice(0, 200);
    }
    if (typeof error === 'string') return error.slice(0, 200);
    try {
        return JSON.stringify(error).slice(0, 200);
    } catch {
        return 'unknown_error';
    }
}

/**
 * Best-effort error reporter. Throw etmez — caller akışı bozulmaz.
 *
 * @param scope Semantik etiket (snake_case). Örn: 'welcome_send_individual'.
 * @param error Yakalanan exception.
 * @param extra Opsiyonel context (PII içermemeli).
 */
export function reportNonFatalError(
    scope: string,
    error: unknown,
    extra?: ExtraParams,
): void {
    try {
        if (!isProd) {
            clientLogger.warn(`[telemetry] ${scope}`, error, extra);
            return;
        }
        logRawEvent('non_fatal_error', {
            scope,
            message: shortMessage(error),
            ...(extra ?? {}),
        });
    } catch {
        // Telemetry hiçbir koşulda caller'ı patlatmaz.
    }
}
