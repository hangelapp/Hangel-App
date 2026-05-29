'use client';

/**
 * Kısa profil bağlantısı: hangel.org.tr/s/{code}
 * STK/marka/kulüp dokümanlarında shortLink == code olanı bulur ve profil sayfasına
 * yönlendirir. Kurumlar bu kodu yönetim panelinden (Profili Güncelle) belirler.
 */
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { Loader2 } from 'lucide-react';

export default function ShortLinkRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const code = ((params.code as string) || '').toLowerCase();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!db || !code) return;
    let cancelled = false;
    (async () => {
      const targets: Array<{ col: string; path: (id: string) => string }> = [
        { col: COLLECTIONS.ngos, path: id => `/ngos/${id}` },
        { col: COLLECTIONS.brands, path: id => `/market/${id}` },
        { col: COLLECTIONS.clubs, path: id => `/clubs/profile/${id}` },
      ];
      for (const t of targets) {
        try {
          const snap = await getDocs(query(collection(db, t.col), where('shortLink', '==', code), limit(1)));
          if (!snap.empty) { if (!cancelled) router.replace(t.path(snap.docs[0].id)); return; }
        } catch { /* sıradaki koleksiyona geç */ }
      }
      if (!cancelled) setNotFound(true);
    })();
    return () => { cancelled = true; };
  }, [db, code, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-3 p-6 text-center">
      {notFound ? (
        <>
          <p className="text-muted-foreground">Bu kısa bağlantı bir kuruma ait değil.</p>
          <button onClick={() => router.replace('/')} className="text-primary hover:underline font-medium">Ana sayfaya dön</button>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Yönlendiriliyor…</p>
        </>
      )}
    </div>
  );
}
