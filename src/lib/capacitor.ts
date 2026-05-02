'use client';

/**
 * Capacitor platform detection utilities.
 * Used to conditionally render native-specific UI or behavior.
 */

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).Capacitor?.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform()) return 'web';
  return cap.getPlatform();
}

/**
 * Opens an external URL safely using Capacitor Browser on native
 * or window.open on web.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isNativeApp()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } catch (error) {
      console.error('Capacitor Browser error:', error);
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
    return;
  }
  
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
