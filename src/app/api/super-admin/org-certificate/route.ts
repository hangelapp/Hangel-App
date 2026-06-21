/**
 * POST /api/super-admin/org-certificate
 *
 * Süper-admin bir KURUMA (STK / Marka / Öğrenci Kulübü) sertifika verir. Etkinlik
 * sertifikası deseni (api/events/[id]/complete) ile aynı yapısal kod + counter
 * mantığını kullanır, ama alıcı bir kişi değil kurumun kendisidir
 * (`recipientType: 'org'`).
 *
 * Yetki: yalnızca role === 'super-admin'. Değilse 403.
 *
 * Body: { orgId, orgKind: 'ngo'|'brand'|'club', orgName, title, description? }
 *
 * Kod: buildCertCode({ kind: orgKind, country: '90', year, activityNo, personNo: 1 }).
 * Faaliyet no kurum tipine + yıla göre sıralı (counters/cert-act-{kind}-{year}).
 * certId deterministik: `org-{orgKind}-{orgId}-{activityNo}` (Date.now() yok).
 *
 * Dönüş: { ok: true, code }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { buildCertCode } from '@/lib/certificate-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  orgId: z.string().min(1).max(128),
  orgKind: z.enum(['ngo', 'brand', 'club']),
  orgName: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

// Atomik sıralı sayaç (counters/{name}.next) — etkinlik akışıyla aynı helper.
async function nextSeq(db: FirebaseFirestore.Firestore, name: string, start: number): Promise<number> {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data() as { next?: number }).next ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!idToken) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string;
  let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }

  const db = getAdminFirestore();

  // Yetki — yalnız role === 'super-admin' (claim'de yoksa user doc'undan doğrula).
  let isSuperAdmin = role === 'super-admin';
  if (!isSuperAdmin) {
    const snap = await db.collection(COLLECTIONS.users).doc(uid).get();
    if ((snap.data() as { role?: unknown } | undefined)?.role === 'super-admin') isSuperAdmin = true;
  }
  if (!isSuperAdmin) return errJson('forbidden', 'Super-admin yetkisi gerekli.', 403);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return errJson('invalid_body', message, 400);
  }

  const { orgId, orgKind, orgName, title } = body;
  const description = body.description?.trim() ? body.description.trim() : undefined;

  const year = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);

  // Faaliyet no — kurum tipine + yıla göre sıralı. personNo kuruma tek (1).
  const activityNo = await nextSeq(db, `cert-act-${orgKind}-${year}`, 1);
  const personNo = 1;

  const certId = `org-${orgKind}-${orgId}-${activityNo}`;
  const code = buildCertCode({ kind: orgKind, country: '90', year, activityNo, personNo });

  const cert: Record<string, unknown> = {
    id: certId,
    recipientType: 'org',
    orgId,
    orgKind,
    orgName,
    title,
    type: orgKind,
    ngoName: orgName,
    role: 'organization',
    date: today,
    code,
    certCountry: '90',
    certYear: year,
    certActivityNo: activityNo,
    certPersonNo: personNo,
    completedAt: FieldValue.serverTimestamp(),
    issuedBy: uid,
  };
  if (description) cert.description = description;

  try {
    await db.collection(COLLECTIONS.certificates).doc(certId).set(cert);
  } catch (err) {
    console.error('[org-certificate] write failed', err);
    return errJson('write_failed', 'Sertifika kaydedilemedi.', 500);
  }

  return NextResponse.json({ ok: true, code });
}
