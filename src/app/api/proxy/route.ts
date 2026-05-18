import { NextResponse } from 'next/server';

/**
 * Gelişmiş Sunucu Proxy: CORS engellerini aşar ve ajans özel başlıklarını yönetir.
 */
export async function POST(request: Request) {
  try {
    const { agency, url, method, headers, body } = await request.json();

    const response = await fetch(url, {
      method: method || 'GET',
      headers: {
        ...headers,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });

    const status = response.status;
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[Proxy Error Detail] ${agency}: ${status} - ${responseText.slice(0, 500)}`);
    }

    return new NextResponse(responseText, {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Proxy Fatal Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
