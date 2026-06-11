import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Android: com.hangel.app | iOS: com.hangel.ios.app (set in Xcode project, Team: NKZNY8NU8S)
  appId: 'com.hangel.app',
  appName: 'hangel',
  webDir: 'out',
  server: {
    url: 'https://hangel.org.tr',
    cleartext: false,
    // Why: Capacitor 8'de default androidScheme 'https' ise WebView kendi origin'ini
    // https://localhost sayar. server.url ile hangel.org.tr'yi yüklerken Service
    // Worker (firebase-messaging-sw.js) + Firebase Auth reCAPTCHA iframe cross-origin
    // olur, eski SW cache APK'ya kilitlenir → açılmama bug'ı. hostname explicit
    // verince WebView origin = https://hangel.org.tr olur, iOS WKWebView ile aynı
    // davranış. (v2.0.4 / vc 28 Android crash root cause).
    hostname: 'hangel.org.tr',
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#f34723',
      showSpinner: false,
    },
    Keyboard: {
      // Why: 'body' resize → fixed header viewport ile birlikte kayıyor.
      // 'native' (iOS) → WebView içinde scroll yapılır, fixed elementler sabit kalır.
      resize: 'native',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      // Why: WebView altına almak yerine üstte conventional bar → fixed header
      // safe-area-inset ile düzgün hesaplanır, hareket etmez.
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
