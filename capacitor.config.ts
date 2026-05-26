import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Android: com.hangel.app | iOS: com.hangel.ios.app (set in Xcode project, Team: NKZNY8NU8S)
  appId: 'com.hangel.app',
  appName: 'Hangel',
  webDir: 'out',
  server: {
    url: 'https://hangel.org.tr',
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
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
