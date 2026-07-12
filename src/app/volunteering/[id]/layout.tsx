import type { Metadata } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

// Paylaşım önizlemesi (OG/Twitter) — client `page.tsx` metadata üretemediği için
// server-side burada üretilir. Görsel önceliği: ilana özel logo (eventLogoUrl)
// → STK kapak fotoğrafı (coverPhotoUrl) → varsayılan /opengraph-image.png.
// Bu sayede /worldcleanday (→ /volunteering/worldcleanday-2026) önizlemede WCD
// logosunu (yüklendikten sonra) gösterir.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const key = decodeURIComponent(id || '');

  try {
    const db = getAdminFirestore();
    // Detay sayfası ilanı doc id ile çözer.
    const snap = await db.collection(COLLECTIONS.volunteering).doc(key).get();
    if (!snap.exists) {
      return { metadataBase: new URL(APP_URL) };
    }
    const data = snap.data() as {
      title?: string;
      description?: string;
      eventLogoUrl?: string;
      ngoId?: string;
    };

    // İlan logosu yoksa STK kapak fotoğrafına düş (kolayca ulaşılabilirse).
    let image = data.eventLogoUrl || '';
    if (!image && data.ngoId) {
      try {
        const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(data.ngoId).get();
        const ngo = ngoSnap.data() as { coverPhotoUrl?: string } | undefined;
        if (ngo?.coverPhotoUrl) image = ngo.coverPhotoUrl;
      } catch {
        // STK okunamazsa görseli varsayılana bırak.
      }
    }
    if (!image) image = '/opengraph-image.png';

    const title = (data.title || 'Gönüllülük İlanı').trim();
    const description = (data.description || '').trim().slice(0, 160);

    return {
      metadataBase: new URL(APP_URL),
      title,
      description: description || undefined,
      openGraph: {
        title,
        description: description || undefined,
        images: [image],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: description || undefined,
        images: [image],
      },
    };
  } catch {
    return { metadataBase: new URL(APP_URL) };
  }
}

export default function VolunteeringDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
