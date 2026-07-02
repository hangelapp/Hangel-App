/**
 * /api/super-admin/badges — Özel/Dönemsel rozet + puan yönetimi (yalnız süper-admin).
 *
 * GET  → specialBadges tanımlarını listeler.
 * POST { action }:
 *   - 'createDef'  { def }                     → specialBadges/{id} oluştur/güncelle
 *   - 'deleteDef'  { id }                       → tanımı sil
 *   - 'grant'      { badgeId, uid|email|phone } → kullanıcıya özel rozet ver (+bildirim)
 *   - 'awardPoints'{ uid|email|phone, area, points } → alan puanı ekle → rozet yeniden hesap
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { requireSuperAdmin } from '@/lib/messaging/server-auth';
import { COLLECTIONS } from '@/firebase/collections';
import { awardBadgesForUser } from '@/lib/award-badges';
import { notifyUser } from '@/lib/notify-user';
import { SPECIAL_BADGE_STATUSES, type SpecialBadgeDef } from '@/lib/special-badges';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const slug = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.specialBadges).get();
  const defs = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<SpecialBadgeDef, 'id'>) }))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return NextResponse.json({ ok: true, defs });
}

/** target (uid/email/phone) → uid çöz. */
async function resolveUid(db: FirebaseFirestore.Firestore, body: { uid?: string; email?: string; phone?: string }): Promise<string | null> {
  if (body.uid && typeof body.uid === 'string') return body.uid.trim();
  const col = db.collection(COLLECTIONS.users);
  if (body.email) {
    const q = await col.where('email', '==', body.email.trim().toLowerCase()).limit(1).get();
    if (!q.empty) return q.docs[0].id;
  }
  if (body.phone) {
    const q = await col.where('phoneNumber', '==', body.phone.trim()).limit(1).get();
    if (!q.empty) return q.docs[0].id;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const db = getAdminFirestore();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const action = body.action;

  // --- Tanım oluştur/güncelle ---
  if (action === 'createDef') {
    const raw = (body.def ?? {}) as Partial<SpecialBadgeDef>;
    const name = (raw.name || '').toString().trim();
    if (!name) return NextResponse.json({ error: 'Rozet adı gerekli.' }, { status: 400 });
    const status = SPECIAL_BADGE_STATUSES.includes(raw.status as never) ? (raw.status as string) : 'Özel';
    const id = (raw.id && String(raw.id)) || slug(name) || `rozet-${Date.now()}`;
    const def: Record<string, unknown> = {
      name,
      description: (raw.description || '').toString().trim(),
      emoji: (raw.emoji || '🏅').toString().slice(0, 8),
      status,
      colorHex: (raw.colorHex || '').toString().trim() || null,
      startAt: typeof raw.startAt === 'number' ? raw.startAt : null,
      endAt: typeof raw.endAt === 'number' ? raw.endAt : null,
      priority: Number(raw.priority) || 100,
      active: raw.active !== false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: auth.actor.uid,
    };
    const ref = db.collection(COLLECTIONS.specialBadges).doc(id);
    const exists = (await ref.get()).exists;
    if (!exists) def.createdAt = FieldValue.serverTimestamp();
    await ref.set(def, { merge: true });
    return NextResponse.json({ ok: true, id });
  }

  // --- Tanım sil ---
  if (action === 'deleteDef') {
    const id = (body.id || '').toString().trim();
    if (!id) return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });
    await db.collection(COLLECTIONS.specialBadges).doc(id).delete();
    return NextResponse.json({ ok: true });
  }

  // --- Kullanıcıya özel rozet ver ---
  if (action === 'grant') {
    const badgeId = (body.badgeId || '').toString().trim();
    if (!badgeId) return NextResponse.json({ error: 'badgeId gerekli.' }, { status: 400 });
    const uid = await resolveUid(db, body as { uid?: string; email?: string; phone?: string });
    if (!uid) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

    const defSnap = await db.collection(COLLECTIONS.specialBadges).doc(badgeId).get();
    if (!defSnap.exists) return NextResponse.json({ error: 'Rozet tanımı yok.' }, { status: 404 });
    const def = defSnap.data() as SpecialBadgeDef;

    const kind = def.status === 'Dönemsel' ? 'seasonal' : 'special';
    const docId = `special-${badgeId}`;
    await db.collection(COLLECTIONS.users).doc(uid).collection(COLLECTIONS.badges).doc(docId).set({
      badgeId: docId,
      name: def.name,
      description: def.description || '',
      emoji: def.emoji || '🏅',
      status: def.status,
      colorHex: def.colorHex || null,
      priority: Number(def.priority) || 100,
      socialArea: 'Özel',
      kind,
      earnedAt: FieldValue.serverTimestamp(),
      grantedBy: auth.actor.uid,
    }, { merge: true });

    try {
      await notifyUser({
        userId: uid,
        type: 'badge_earned',
        title: `Özel rozet kazandın! ${def.emoji || '🏅'}`,
        body: `"${def.name}" rozeti profiline eklendi. Rozetlerini görüntüle ve paylaş.`,
        link: '/my-badges',
        data: { badgeId: docId, special: true },
        storeAsMessage: true,
        messageSubject: `Özel rozet: ${def.name}`,
        messageContent: def.description || def.name,
      });
    } catch { /* bildirim best-effort */ }
    return NextResponse.json({ ok: true, uid, docId });
  }

  // --- Kullanıcının rozet/puan/sertifika özeti ---
  if (action === 'userInfo') {
    const uid = await resolveUid(db, body as { uid?: string; email?: string; phone?: string });
    if (!uid) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    const userRef = db.collection(COLLECTIONS.users).doc(uid);
    const [uSnap, bSnap, cSnap] = await Promise.all([
      userRef.get(),
      userRef.collection(COLLECTIONS.badges).get(),
      userRef.collection(COLLECTIONS.certificates).get(),
    ]);
    const u = (uSnap.data() ?? {}) as { displayName?: string; email?: string; areaPoints?: Record<string, number> };
    const badges = bSnap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return { id: d.id, name: String(data.name ?? d.id), kind: String(data.kind ?? 'area'), level: String(data.level ?? ''), emoji: String(data.emoji ?? '') };
    });
    return NextResponse.json({
      ok: true,
      uid,
      displayName: u.displayName ?? u.email ?? uid,
      areaPoints: u.areaPoints ?? {},
      badges,
      certificateCount: cSnap.size,
    });
  }

  // --- Kullanıcıya özel puan ekle (alan bazında) ---
  if (action === 'awardPoints') {
    const area = (body.area || '').toString().trim();
    const points = Math.round(Number(body.points) || 0);
    if (!area) return NextResponse.json({ error: 'area (rozet alanı) gerekli.' }, { status: 400 });
    if (!points) return NextResponse.json({ error: 'points (0 olmayan sayı) gerekli.' }, { status: 400 });
    const uid = await resolveUid(db, body as { uid?: string; email?: string; phone?: string });
    if (!uid) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

    await db.collection(COLLECTIONS.users).doc(uid).set(
      { areaPoints: { [area]: FieldValue.increment(points) } },
      { merge: true },
    );
    // Yeni puanla rozet(ler) hak edildiyse düşsün + bildirim gitsin.
    const award = await awardBadgesForUser(db, uid, { notify: true });
    return NextResponse.json({ ok: true, uid, area, points, newBadges: award.newBadges.length });
  }

  return NextResponse.json({ error: 'Bilinmeyen action.' }, { status: 400 });
}
