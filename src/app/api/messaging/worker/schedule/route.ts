import { NextResponse } from 'next/server';
import { checkMessagingKey } from '@/lib/messaging/server-auth';
import { promoteScheduledCampaigns } from '@/lib/messaging/queue/schedule';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const unauthorized = checkMessagingKey(req);
  if (unauthorized) return unauthorized;

  try {
    const result = await promoteScheduledCampaigns();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/messaging/worker/schedule]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
