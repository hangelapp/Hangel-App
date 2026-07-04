import type { Metadata } from 'next';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { ProductDetailClient } from './product-detail-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const snap = await getAdminFirestore().collection('products').doc(id).get();
    if (!snap.exists) return { title: 'Ürün' };
    const product = snap.data() as {
      title?: string;
      description?: string;
      brandName?: string;
      imageLink?: string;
    };
    const title = product.title || 'Ürün';
    const description = (
      product.description ||
      `${product.brandName ?? 'hangel'} — hangel Market'te al, iyiliğe dönüştür.`
    ).slice(0, 160);
    const images = product.imageLink ? [product.imageLink] : undefined;
    return {
      title,
      description,
      openGraph: { title, description, images, type: 'website' },
      twitter: { card: 'summary_large_image', title, description, images },
    };
  } catch {
    return { title: 'Ürün' };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
