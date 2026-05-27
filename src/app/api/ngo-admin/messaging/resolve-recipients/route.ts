/**
 * NGO admin için scoped dry-run.
 * scopedNgoId her zaman actor.ngoId ile override edilir (client tampered değer kabul edilmez).
 */

import { NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { resolveRecipients } from '@/lib/messaging/resolver';
import type { RecipientSourceSpec } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireNgoAdmin(req);
  if (auth.error) return auth.error;
  const actor = auth.actor;

  let body: RecipientSourceSpec;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.channel || !body.useCase) {
    return NextResponse.json({ error: 'channel ve useCase gerekli' }, { status: 400 });
  }

  // GÜVENLİK: scopedNgoId'yi her zaman actor.ngoId ile override et
  body.scopedNgoId = actor.ngoId;

  try {
    const result = await resolveRecipients(body);
    return NextResponse.json({
      summary: result.summary,
      sample: result.sample,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ngo-admin/resolve-recipients]', message);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', error: 'Internal server error' }, { status: 500 });
  }
}
