/**
 * Client-side log helper. Production'da `error`/`warn` no-op'tur —
 * istemci konsolunu rapor edilen "spam" gürültüsünden temizler.
 *
 * Sunucu kodlarında doğrudan `console.*` kullanmaya devam edin (server
 * console'lar Cloud Logging'e gider, kullanıcıya görünmez). Bu modül
 * `'use client'` dosyalarda yakalanan beklenen hatalar (Firestore listener
 * geçici hatası, kullanıcı iptali, vb.) için tasarlandı.
 *
 * Geliştirici (NODE_ENV !== 'production') ortamında çıktı korunur.
 *
 * Kullanım:
 *   import { clientLogger } from '@/lib/client-logger';
 *   try { ... } catch (e) { clientLogger.error('module/op failed', e); }
 */
const isProd =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

type LogArgs = unknown[];

export const clientLogger = {
  error(...args: LogArgs) {
    if (isProd) return;
     
    console.error(...args);
  },
  warn(...args: LogArgs) {
    if (isProd) return;
     
    console.warn(...args);
  },
  info(...args: LogArgs) {
    if (isProd) return;
     
    console.info(...args);
  },
};
