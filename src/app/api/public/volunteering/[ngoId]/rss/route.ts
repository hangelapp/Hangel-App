/**
 * GET /api/public/volunteering/[ngoId]/rss
 *
 * STK'nın yayındaki gönüllülük ilanlarını RSS 2.0 olarak dışa açar.
 * STK web sitesi/okuyucular bu feed'i takip ederek yeni ilanları alır.
 */
import { fetchActiveVolunteering, escapeXml, PUBLIC_ORIGIN } from '@/lib/public-volunteering';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(_req: Request, { params }: { params: Promise<{ ngoId: string }> }) {
  const { ngoId } = await params;
  if (!ngoId) {
    return new Response('ngoId gerekli', { status: 400 });
  }
  try {
    const { organization, items } = await fetchActiveVolunteering(ngoId);
    const channelTitle = escapeXml(`${organization || 'hangel'} — Gönüllülük İlanları`);
    const channelLink = `${PUBLIC_ORIGIN}/ngos/${ngoId}`;
    const itemsXml = items.map((it) => {
      const desc = escapeXml(`${it.description}${it.city ? ` · ${it.city}` : ''}${it.applicationEnd ? ` · Son başvuru: ${it.applicationEnd}` : ''}`);
      return `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${escapeXml(it.url)}</link>
      <guid isPermaLink="true">${escapeXml(it.url)}</guid>
      <description>${desc}</description>
    </item>`;
    }).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${channelTitle}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(`${organization || 'hangel'} gönüllülük ilanları — hangel`)}</description>
    <language>tr</language>
${itemsXml}
  </channel>
</rss>`;
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Beklenmeyen hata';
    return new Response(message, { status: 500 });
  }
}
