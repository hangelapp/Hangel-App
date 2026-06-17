/**
 * POST /api/super-admin/outreach/create
 *
 * Yeni outreach kontağı oluşturur. Admin SDK ile yazar (Firestore rules
 * bypass) — client SDK doğrudan yazsa rule deploy gerekirdi, bu yol ile
 * deploy'a gerek kalmaz.
 *
 * Body:
 *   {
 *     name: string;
 *     type?: string;
 *     city?: string;
 *     district?: string;
 *     phone?: string;
 *     email?: string;
 *     website?: string;
 *     address?: string;
 *     notes?: string;
 *   }
 *
 * Response: { ok: true, id }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_TYPES = ['Vakıf', 'Dernek', 'SivilToplumMüdürlüğü', 'Federasyon', 'SporKulübü', 'GençlikSporMüdürlüğü', 'MailHizmet', 'Diğer'];

interface Body {
  name?: string;
  type?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  notes?: string;
}

async function isSuperAdmin(req: NextRequest): Promise<{ ok: boolean; uid?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return { ok: false };
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return { ok: true, uid: decoded.uid };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const isSuper = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return { ok: !!isSuper, uid: isSuper ? decoded.uid : undefined };
  } catch { return { ok: false }; }
}

function sanitize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

export async function POST(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }

  const name = sanitize(body.name);
  if (!name) {
    return NextResponse.json({ errorCode: 'NAME_REQUIRED', message: 'Ad zorunlu' }, { status: 400 });
  }

  const type = sanitize(body.type) || 'Diğer';
  const normalizedType = VALID_TYPES.includes(type) ? type : 'Diğer';

  const db = getAdminFirestore();
  const ref = await db.collection(COLLECTIONS.outreachContacts).add({
    name,
    type: normalizedType,
    city: sanitize(body.city),
    district: sanitize(body.district),
    phone: sanitize(body.phone),
    email: sanitize(body.email),
    website: sanitize(body.website),
    address: sanitize(body.address),
    notes: sanitize(body.notes),
    status: 'active',
    source: 'manual',
    createdBy: auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
