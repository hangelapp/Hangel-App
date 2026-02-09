import { NextResponse } from 'next/server';

/**
 * Gelişmiş Sunucu Proxy: CORS engellerini aşar ve ajans özel başlıklarını yönetir.
 * ReklamAction ve Gelir Ortakları için Bearer token desteği eklenmiştir.
 */
export async function POST(request: Request) {
  try {
    const { agency, url, method, headers, body } = await request.json();

    const finalUrl = url.startsWith('http') ? url : `https://${url}`;

    // Ajans bazlı header yönetimi
    const finalHeaders: Record<string, string> = {
      ...headers,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Python örneklerindeki Bearer Token yapısı aktarımı
    if (headers?.Authorization) {
        finalHeaders['Authorization'] = headers.Authorization;
    }

    const response = await fetch(finalUrl, {
      method: method || 'GET',
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });

    const status = response.status;
    const responseText = await response.text();

    console.log(`[Proxy Log] Agency: ${agency}, Status: ${status}`);

    if (!response.ok) {
      console.error(`[Proxy Error Detail] ${agency}: ${status} - ${responseText.slice(0, 500)}`);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
