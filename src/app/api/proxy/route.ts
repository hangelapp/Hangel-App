import { NextResponse } from 'next/server';

/**
 * ZORUNLU DEBUG PROXY: Terminale detaylı log basar ve CORS engellerini aşar.
 */
export async function POST(request: Request) {
  try {
    const { agency, url, method, headers, body } = await request.json();

    // URL Doğrulaması
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;

    // Gelir Ortakları için sadece x-api-key başlığını gönder, diğerlerini temizle
    const isGO = agency === 'Gelir Ortakları';
    const finalHeaders: Record<string, string> = isGO 
      ? { ...headers } 
      : {
          ...headers,
          'Origin': 'https://hangel.org',
          'Referer': 'https://hangel.org',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

    const response = await fetch(finalUrl, {
      method: method || 'GET',
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });

    const status = response.status;
    const responseText = await response.text();

    // ZORUNLU LOG SİSTEMİ (Terminalde görünecek)
    console.log(`[Proxy Log] Agency: ${agency}, Status: ${status}, Message: ${responseText.slice(0, 300)}...`);

    if (!response.ok) {
        console.error(`[Proxy Error Body] ${agency}: ${responseText}`);
    }

    return new NextResponse(responseText, {
      status: status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error("[Proxy Fatal Error]:", error.message);
    return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, api-key',
        }
    });
}
