import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Android: com.hangel.app | iOS: com.hangel.ios.app (set in Xcode project, Team: NKZNY8NU8S)
  appId: 'com.hangel.app',
  appName: 'hangel',
  webDir: 'out',
  server: {
    // Uzaktan hangel.org yüklenir; WebView origin doğrudan https://hangel.org olur
    // (SW + reCAPTCHA gerçek origin'de düzgün çalışır). DİKKAT: server.hostname'i
    // YAYIN ADRESİYLE AYNI ('hangel.org') yapmak Android'de Capacitor yerel
    // sunucusunun bu host'u yakalayıp boş out/'u sunmasına → BEYAZ EKRAN'a yol açar.
    // Bu yüzden hostname/androidScheme verilmez (vc29 beyaz ekran kök nedeni).
    // 2026-07-01: hangelorg göçü — hangel.org.tr (eski/kapalı) → hangel.org (yeni canlı).
    url: 'https://hangel.org',
    cleartext: false,
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
