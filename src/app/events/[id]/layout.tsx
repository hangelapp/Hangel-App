import type { Metadata } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

// Paylaşım önizlemesi (OG/Twitter) — client `page.tsx` metadata üretemediği için
// server-side burada üretilir. Görsel önceliği: etkinliğe özel logo (eventLogoUrl)
// → afiş (imageUrl) → varsayılan /opengraph-image.png.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const key = decodeURIComponent(id || '');

  try {
    const db = getAdminFirestore();
    // Detay sayfasıyla aynı çözümleme: önce slug, yoksa doc id.
    let data:
      | { name?: string; title?: string; description?: string; imageUrl?: string; eventLogoUrl?: string; organizerLogoUrl?: string }
      | undefined;
    const bySlug = await db
      .collection(COLLECTIONS.events)
      .where('slug', '==', key)
      .limit(1)
      .get();
    if (!bySlug.empty) {
      data = bySlug.docs[0]?.data() as typeof data;
    } else {
      const byId = await db.collection(COLLECTIONS.events).doc(key).get();
      if (byId.exists) data = byId.data() as typeof data;
    }

    if (!data) {
      // Doküman yoksa asgari metadata (kök layout OG'si devreye girer).
      return { metadataBase: new URL(APP_URL) };
    }

    const title = (data.name || data.title || 'Etkinlik').trim();
    const description = (data.description || '').trim().slice(0, 160);
    // Paylaşım önizlemesi görsel önceliği: afiş (büyük, en iyi önizleme) →
    // etkinliğe özel logo → düzenleyen kurumun logosu → varsayılan hangel OG.
    // (Etkinlik logosu yoksa kurum logosuna düşer — kullanıcı kuralı.)
    const image = data.imageUrl || data.eventLogoUrl || data.organizerLogoUrl || '/opengraph-image.png';

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
    // Firestore erişilemezse asgari metadata.
    return { metadataBase: new URL(APP_URL) };
  }
}

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
