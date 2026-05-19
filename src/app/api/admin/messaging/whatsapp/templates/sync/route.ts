/**
 * Meta'dan WhatsApp template'lerini senkronla → whatsappTemplates collection.
 * Süper admin tetikler veya günlük cron.
 */

import { NextResponse } from 'next/server';
import { requireSuperAdmin, type SuperAdminContext } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getWhatsAppProvider } from '@/lib/messaging/providers/whatsapp';
import { logAudit } from '@/lib/messaging/audit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const actor = (auth as { actor: SuperAdminContext }).actor;

  const wabaId = process.env.META_WA_BUSINESS_ACCOUNT_ID;
  if (!wabaId) {
    return NextResponse.json({ error: 'META_WA_BUSINESS_ACCOUNT_ID env eksik' }, { status: 500 });
  }

  try {
    const provider = getWhatsAppProvider();
    if (!provider.syncTemplates) {
      return NextResponse.json({ error: 'Provider syncTemplates desteklemiyor' }, { status: 400 });
    }
    const templates = await provider.syncTemplates(wabaId);

    const db = getAdminFirestore();
    let upserted = 0;
    for (const t of templates) {
      const id = `${t.name}_${t.language}`;
      await db.collection(COLLECTIONS.whatsappTemplates).doc(id).set(
        {
          name: t.name,
          language: t.language,
          category: t.category,
          metaStatus: t.status,
          body: t.body ?? null,
          syncedAt: FieldValue.serverTimestamp(),
          raw: t.raw ?? null,
        },
        { merge: true }
      );
      upserted += 1;
    }

    await logAudit(actor, 'template.updated', { notes: `WA template sync: ${upserted}` });

    return NextResponse.json({ upserted, total: templates.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[wa/templates/sync]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
