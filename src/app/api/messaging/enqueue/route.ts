import { NextResponse } from 'next/server';
import { checkMessagingKey } from '@/lib/messaging/server-auth';
import { enqueueCampaign } from '@/lib/messaging/queue/enqueue';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const unauthorized = checkMessagingKey(req);
  if (unauthorized) return unauthorized;

  let body: { campaignId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const campaignId = body.campaignId;
  if (!campaignId || typeof campaignId !== 'string') {
    return NextResponse.json({ error: 'campaignId gerekli' }, { status: 400 });
  }

  try {
    const result = await enqueueCampaign(campaignId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/messaging/enqueue]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
