/**
 * GET /api/public/events/[organizerId]/embed
 *
 * Kuruluşun (STK/kulüp) yayındaki etkinliklerini, dış sitelere <iframe> ile
 * gömülebilen tam bağımsız HTML olarak döner (uygulama chrome'u yok). `?event=ID`
 * ile tek etkinlik gömülebilir. `Content-Security-Policy: frame-ancestors *` ile
 * global X-Frame-Options bu yanıtta geçersiz kılınır (spec: frame-ancestors önceliklidir).
 */
import { fetchActiveEvents, escapeXml, PUBLIC_ORIGIN } from '@/lib/public-events';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(req: Request, { params }: { params: Promise<{ organizerId: string }> }) {
  const { organizerId } = await params;
  if (!organizerId) return new Response('organizerId gerekli', { status: 400 });
  const url = new URL(req.url);
  const onlyId = url.searchParams.get('event') || undefined;

  try {
    const { organization, items } = await fetchActiveEvents(organizerId, onlyId);
    const cards = items.length === 0
      ? `<p class="empty">Şu an yayında etkinlik yok.</p>`
      : items.map((it) => `
        <a class="card" href="${escapeXml(it.url)}" target="_blank" rel="noopener">
          <div class="card-h">
            ${it.logoUrl ? `<img class="logo" src="${escapeXml(it.logoUrl)}" alt="" loading="lazy" />` : `<div class="logo ph"></div>`}
            <div class="card-meta">
              <div class="org">${escapeXml(it.organizer || organization)}</div>
              <div class="title">${escapeXml(it.title)}</div>
            </div>
          </div>
          ${it.description ? `<p class="desc">${escapeXml(it.description.slice(0, 140))}${it.description.length > 140 ? '…' : ''}</p>` : ''}
          <div class="tags">
            ${it.date ? `<span class="tag">🗓 ${escapeXml(it.date)}</span>` : ''}
            ${it.city ? `<span class="tag">📍 ${escapeXml(it.city)}${it.district ? ' / ' + escapeXml(it.district) : ''}</span>` : ''}
            ${it.locationType ? `<span class="tag">${escapeXml(it.locationType)}</span>` : ''}
          </div>
          <span class="cta">Detay →</span>
        </a>`).join('');

    const html = `<!doctype html><html lang="tr"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeXml(organization || 'hangel')} — Etkinlikler</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f5f7;color:#1d1d1f;padding:14px}
  .head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .brand{font-weight:800;color:#f34723;font-size:18px}
  .head .sub{font-size:11px;color:#86868b;font-weight:600}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .card{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid #e5e5ea;border-radius:18px;padding:14px;text-decoration:none;color:inherit;transition:box-shadow .15s,transform .15s}
  .card:hover{box-shadow:0 8px 24px -10px rgba(0,0,0,.18);transform:translateY(-2px);border-color:#f3472333}
  .card-h{display:flex;align-items:center;gap:10px}
  .logo{width:38px;height:38px;border-radius:10px;object-fit:contain;background:#fff;border:1px solid #eee;flex:0 0 auto}
  .logo.ph{background:#f0f0f3}
  .org{font-size:11px;color:#86868b;font-weight:600;line-height:1.2}
  .title{font-size:14px;font-weight:700;line-height:1.25}
  .desc{font-size:12px;color:#3a3a3c;line-height:1.45}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}
  .tag{font-size:10px;font-weight:600;background:#f0f0f3;color:#48484a;border-radius:999px;padding:3px 8px}
  .cta{font-size:12px;font-weight:800;color:#f34723;margin-top:4px}
  .empty{color:#86868b;font-size:13px;padding:24px;text-align:center}
  .foot{margin-top:14px;text-align:center;font-size:10px;color:#a1a1a6}
  .foot a{color:#f34723;text-decoration:none;font-weight:700}
</style></head><body>
  <div class="head">
    <span class="brand">hangel</span>
    <span class="sub">${escapeXml(organization || '')} · Etkinlikler</span>
  </div>
  <div class="grid">${cards}</div>
  <div class="foot">Bu liste <a href="${PUBLIC_ORIGIN}" target="_blank" rel="noopener">hangel</a> ile sağlanır.</div>
</body></html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': 'frame-ancestors *',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Beklenmeyen hata';
    return new Response(message, { status: 500 });
  }
}
