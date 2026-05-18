import { NextResponse } from 'next/server';
import { checkMessagingKey } from '@/lib/messaging/server-auth';
import { reclaimExpiredLeases } from '@/lib/messaging/queue/reclaim';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const unauthorized = checkMessagingKey(req);
  if (unauthorized) return unauthorized;

  try {
    const result = await reclaimExpiredLeases();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/messaging/worker/reclaim]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
