/**
 * GET /api/health — App Hosting healthcheck endpoint.
 *
 * Cloud Run periyodik bu endpoint'i ping eder. Cevap vermezse instance
 * unhealthy kabul edilir + restart. Ayrıca external monitoring (UptimeRobot
 * vb.) buradan probe edebilir.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: 'hangel-web',
      ts: Date.now(),
      uptime: Math.round(process.uptime()),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
