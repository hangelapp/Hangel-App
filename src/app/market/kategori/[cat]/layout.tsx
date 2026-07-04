import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cat: string }>;
}): Promise<Metadata> {
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat || '');
  const description = `${cat} kategorisindeki ürünler hangel Market'te — al, iyiliğe dönüştür.`;
  return {
    title: `${cat} ürünleri`,
    description,
    openGraph: { title: `${cat} — hangel Market`, description },
  };
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
