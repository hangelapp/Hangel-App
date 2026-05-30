'use client';

/**
 * Firebase Crashlytics — Capacitor native köprü.
 *
 * Crashlytics SDK Firebase iOS/Android native binary'lerinde çalışır;
 * web tarafında muadili yok (Firebase Error Reporting Cloud Functions
 * üzerinden). Bu yüzden fonksiyonlar Capacitor non-native ortamda no-op.
 *
 * Kullanım:
 *  - Auth bağlanınca `setCrashlyticsUser(uid)` çağrılır (PushNotificationsProvider içinde).
 *  - Beklenmeyen hata: `recordCrashlyticsError(err, context)` ile non-fatal kayıt.
 *  - Kritik kullanıcı yolu işaretleyici: `logCrashlytics('user clicked donate')`.
 */

import { Capacitor } from '@capacitor/core';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

export async function setCrashlyticsUser(uid: string | null): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await FirebaseCrashlytics.setUserId({ userId: uid ?? '' });
  } catch { /* sessiz */ }
}

export async function logCrashlytics(message: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await FirebaseCrashlytics.log({ message });
  } catch { /* sessiz */ }
}

export async function recordCrashlyticsError(err: unknown, context?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const message = err instanceof Error ? err.message : String(err);
    const stacktrace = err instanceof Error && err.stack
      ? err.stack.split('\n').map(line => ({
          fileName: 'app',
          lineNumber: 0,
          methodName: line.trim(),
        }))
      : [];
    await FirebaseCrashlytics.recordException({
      message: context ? `[${context}] ${message}` : message,
      stacktrace,
    });
  } catch { /* sessiz */ }
}
