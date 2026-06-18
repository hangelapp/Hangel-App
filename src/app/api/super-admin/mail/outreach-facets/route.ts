/**
 * GET /api/super-admin/mail/outreach-facets — outreach datasındaki tür dağılımı.
 *
 * Workspace toplu mail tür seçimi için: hangi tür kaç kayıt, kaçında geçerli e-posta
 * var. Böylece UI yalnız gönderilebilir türleri (e-postalı) gösterir; boş türler
 * (ör. Vakıf/Dernek yüklenmemişse) seçilip "alıcı yok" hatası vermez.
 *
 * Yetki: yalnız super-admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLATFORM_MAIL_ID = '__platform';
const SCAN_LIMIT = 20000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { targetNgoId: PLATFORM_MAIL_ID, allowSuperAdmin: true });
  if ('error' in auth) return auth.error;
  if (!auth.actor.isSuperAdmin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.outreachContacts).limit(SCAN_LIMIT).get();

  const byType = new Map<string, { total: number; withEmail: number }>();
  for (const d of snap.docs) {
    const data = d.data() as { type?: string; email?: string; status?: string };
    if (data.status && data.status !== 'active') continue;
    const type = (data.type ?? 'Diğer').trim() || 'Diğer';
    const entry = byType.get(type) ?? { total: 0, withEmail: 0 };
    entry.total += 1;
    if (EMAIL_RE.test((data.email ?? '').trim())) entry.withEmail += 1;
    byType.set(type, entry);
  }

  const types = [...byType.entries()]
    .map(([type, v]) => ({ type, total: v.total, withEmail: v.withEmail }))
    .filter((t) => t.withEmail > 0)
    .sort((a, b) => b.withEmail - a.withEmail);

  return NextResponse.json({ types, scanned: snap.size, capped: snap.size >= SCAN_LIMIT });
}
