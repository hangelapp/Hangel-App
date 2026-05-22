import { redirect, notFound } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

// Public kütük kısa-link çözümleyici (sunucu bileşeni).
// hangel.org.tr/<kütükNo> bağlantısı bu /k/<kütükNo> rotasına gelir;
// `kutukNo` alanı eşleşen STK'nın profiline (/ngos/<id>) yönlendirir.
// Bilinmeyen kütük → not-found. Admin SDK ile okunduğu için Firestore
// kurallarından bağımsızdır ve istemciye ham veri sızdırmaz.
export default async function KutukShortLinkPage({
  params,
}: {
  params: Promise<{ kutuk: string }>;
}) {
  const { kutuk } = await params;
  const kutukNo = (kutuk ?? '').trim();

  if (!kutukNo) {
    notFound();
  }

  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTIONS.ngos)
    .where('kutukNo', '==', kutukNo)
    .limit(1)
    .get();

  if (snap.empty) {
    notFound();
  }

  redirect(`/ngos/${snap.docs[0].id}`);
}
