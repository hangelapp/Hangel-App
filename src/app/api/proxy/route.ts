
import { NextResponse } from 'next/server';

/**
 * Next.js Server-side Proxy Route
 * Bypasses CORS by making API calls from the server environment.
 */
export async function POST(request: Request) {
  try {
    const { agency, url, method, headers, body } = await request.json();

    console.log(`[Proxy] Requesting ${agency} at ${url}`);

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
    const text = await response.text();

    return new NextResponse(text, {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("[Proxy Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
