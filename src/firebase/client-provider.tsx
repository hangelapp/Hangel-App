'use client';

import React, { useEffect, useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { initPerformance } from '@/firebase/performance';
import { initAnalytics } from '@/lib/analytics';
import { initRemoteConfig } from '@/lib/remote-config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    // languageCode='tr' default'u getSdks() içinde set ediliyor (firebase/index.ts).
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  // FEAT-FB-INTEGRATIONS:
  // - Performance Monitoring auto traces (page load, network)
  // - Analytics SDK + auto page_view
  // - Remote Config fetch
  // Hepsi non-blocking — başarısız olursa app etkilenmez.
  useEffect(() => {
    void initPerformance(firebaseServices.firebaseApp);
    void initAnalytics(firebaseServices.firebaseApp);
    void initRemoteConfig(firebaseServices.firebaseApp);
  }, [firebaseServices.firebaseApp]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}