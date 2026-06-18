import { NextResponse } from 'next/server';
import { checkMessagingKey } from '@/lib/messaging/server-auth';
import { workerTick } from '@/lib/messaging/queue/worker';
import { reclaimExpiredLeases } from '@/lib/messaging/queue/reclaim';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const unauthorized = checkMessagingKey(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const batch = Number(url.searchParams.get('batch') ?? '50');

  try {
    // Cron yalnız /schedule + /run çağırıyor; takılı-leased job'ları burada geri al
    // ki çökmüş bir tick kuyruğu tıkamasın (best-effort, tick'i bloklamaz).
    const reclaimed = await reclaimExpiredLeases().catch(() => ({ reclaimed: 0 }));
    const result = await workerTick({ batch: Number.isFinite(batch) && batch > 0 ? batch : 50 });
    return NextResponse.json({ ...result, reclaimed: reclaimed.reclaimed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/messaging/worker/run]', message);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', error: 'Internal server error' }, { status: 500 });
  }
}
