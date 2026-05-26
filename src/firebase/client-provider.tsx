'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    const services = initializeFirebase();
    // Default Firebase Auth dilini Türkçe yap — kullanıcı telefon ülke kodu girince
    // IndividualForm bu değeri override eder (ör. +49 → de). Default 'tr' olduğu için
    // device locale İngilizce de olsa kayıt SMS'leri Türkçe gelir.
    try {
      services.auth.languageCode = 'tr';
    } catch { /* readonly veya init henüz tamamlanmadı */ }
    return services;
  }, []); // Empty dependency array ensures this runs only once on mount

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