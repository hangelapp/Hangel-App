import { NextResponse } from 'next/server';

/**
 * Enhanced Server-side Proxy Route with CORS headers and Auth error logging.
 */
export async function POST(request: Request) {
  try {
    const { agency, url, method, headers, body } = await request.json();

    console.log(`[Proxy] Initiating request for ${agency} at ${url}`);

    const response = await fetch(url, {
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
    
    // Log specific authentication errors to terminal
    if (status === 401 || status === 403) {
        console.error(`\x1b[31m[API AUTH ERROR]\x1b[0m ${agency} returned HTTP ${status}. Check your API Key/Token.`);
    }

    const text = await response.text();

    return new NextResponse(text, {
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
        headers: {
            'Access-Control-Allow-Origin': '*',
        }
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
