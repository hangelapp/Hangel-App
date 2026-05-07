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

// On iOS WKWebView, window.open is blocked unless called from a synchronous
// user gesture; on native we route through Capacitor's Browser plugin instead,
// which opens SFSafariViewController on iOS and a Chrome Custom Tab on Android.
export function openExternalUrl(url: string): void {
  if (isNativeApp()) {
    void import('@capacitor/browser').then(({ Browser }) =>
      Browser.open({ url })
    );
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
