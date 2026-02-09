import { NextResponse } from 'next/server';

/**
 * Enhanced Server-side Proxy Route with detailed error logging and no-cache settings.
 */
export async function POST(request: Request) {
  try {
    const { agency, url, method, headers, body } = await request.json();

    // Ensure URL has protocol
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;

    console.log(`[Proxy] Requesting ${agency} via Server: ${finalUrl}`);

    const response = await fetch(finalUrl, {
      method: method || 'GET',
      headers: {
        ...headers,
        'Origin': 'https://hangel.org',
        'Referer': 'https://hangel.org',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });

    const status = response.status;
    const responseText = await response.text();

    if (!response.ok) {
        console.error(`\x1b[31m[API ERROR]\x1b[0m ${agency} returned HTTP ${status}. Message: ${responseText}`);
    } else {
        console.log(`\x1b[32m[API SUCCESS]\x1b[0m ${agency} returned HTTP ${status}`);
    }

    return new NextResponse(responseText, {
      status: status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, api-key'
      }
    });
  } catch (error: any) {
    console.error("\x1b[31m[Proxy Fatal Error]:\x1b[0m", error.message);
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
