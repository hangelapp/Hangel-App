import type { Metadata } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const key = decodeURIComponent(brand || '');
  let name = key;
  try {
    const snap = await getAdminFirestore()
      .collection('products')
      .where('productBrandKey', '==', key)
      .limit(1)
      .get();
    const doc = snap.docs[0]?.data() as { productBrand?: string } | undefined;
    if (doc?.productBrand) name = doc.productBrand;
  } catch {
    // Firestore erişilemezse ham anahtarı isim olarak kullan.
  }
  const description = `${name} markasının tüm ürünleri hangel Market'te — al, iyiliğe dönüştür.`;
  return {
    title: `${name} ürünleri`,
    description,
    openGraph: { title: `${name} — hangel Market`, description },
  };
}

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
