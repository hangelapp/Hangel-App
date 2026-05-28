'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore'

// WebChannel/QUIC taşıma katmanı kısıtlı ağlar, VPN ve proxy arkasında sık sık
// "WebChannelConnection RPC 'Listen' stream transport errored" + ERR_QUIC_PROTOCOL_ERROR
// üretir. Auto-detect long-polling, WebChannel başarısız olduğunda long-polling'e
// düşerek bu konsol hatalarını azaltır. İlk init ayarı uygular; tekrar çağrıda
// (zaten başlatılmışsa) initializeFirestore fırlatır → mevcut örneği döndürürüz.
function getFirestoreWithLongPolling(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
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
  const auth = getAuth(firebaseApp);
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