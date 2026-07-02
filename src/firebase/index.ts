'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

// WebChannel/QUIC taşıma katmanı kısıtlı ağlar, VPN ve proxy arkasında sık sık
// "WebChannelConnection RPC 'Listen' stream transport errored" + ERR_QUIC_PROTOCOL_ERROR
// üretir. Auto-detect long-polling, WebChannel başarısız olduğunda long-polling'e
// düşerek bu konsol hatalarını azaltır.
//
// FEAT-OFFLINE: persistentLocalCache + persistentMultipleTabManager ile
// IndexedDB persistence açılır — offline iken son okunan dokümanlar cache'ten
// servis edilir, write'lar online'a dönülünce otomatik sync edilir. Multi-tab
// manager aynı domain'de birden fazla sekme açık olduğunda quota lock'tan
// kaçınır (eski enableIndexedDbPersistence single-tab idi → "failed-precondition"
// hatası verirdi). İlk init ayarı uygular; tekrar çağrıda mevcut örneği döndürürüz.
function getFirestoreWithLongPolling(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // initializeFirestore zaten çağrıldıysa veya IndexedDB kullanılamıyorsa
    // (Safari private mode, very old browser, server-side render) düşülen path.
    return getFirestore(app);
  }
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Explicitly use the config object to avoid 404s from automatic initialization attempts
    // in workstation and studio environments.
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // OTURUM KALICILIĞI — DAYANIKLI zincir: IndexedDB önce, sonra localStorage,
  // sonra bellek. Neden: eski `setPersistence(browserLocalPersistence)` yalnız
  // localStorage'a yazıyordu; iOS Safari/WKWebView/PWA ve ITP'de localStorage
  // kapanınca/7 günde silinip kullanıcıyı ATIYORDU. IndexedDB çok daha dayanıklı
  // (uygulama/tarayıcı kapansa bile kalır). Ayrıca fire-and-forget setPersistence
  // race'i kalktı — persistence artık init anında SENKRON kurulur. Kullanıcı
  // AÇIKÇA çıkış yapmadıkça oturum açık kalır.
  // initializeAuth yalnız ilk çağrıda çalışır; tekrarda/SSR'da getAuth'a düşer.
  let auth: Auth;
  if (typeof window === 'undefined') {
    auth = getAuth(firebaseApp);
  } else {
    try {
      auth = initializeAuth(firebaseApp, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
      });
    } catch {
      // Zaten initialize edilmiş (aynı app'te ikinci getSdks) → mevcut örneği al.
      auth = getAuth(firebaseApp);
    }
  }
  // Default Firebase Auth dilini TR yap — cihaz English bile olsa SMS TR template kullanır.
  // Phone form çağrısı sırasında IndividualForm ülke koduna göre override eder.
  try {
    auth.languageCode = 'tr';
  } catch {
    /* readonly veya init incomplete */
  }
  return {
    firebaseApp,
    auth,
    firestore: getFirestoreWithLongPolling(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';