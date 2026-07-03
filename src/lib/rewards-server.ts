/**
 * Ödül/Çekiliş/Quiz — sunucu yardımcıları (yalnız Admin SDK; API route'larından).
 *   - resolveOrganizer: token → etkinlik/gönüllülük sahibi mi? + kurum bilgisi.
 *   - getEligibleParticipants: uygunluk (fiziksel→check-in, online→kayıtlı) + isimler.
 */
import type { NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { RewardKind } from '@/lib/rewards';

export interface OrganizerCtx {
  uid: string;
  kind: RewardKind;
  parentId: string;
  organizerId: string;
  ngoName: string;
  ngoLogoUrl?: string;
  title: string;
  /** Dialog için en iyi tahmin; yetkili değer kayıtlı config.isOnline'dır. */
  guessOnline: boolean;
}

export interface Participant {
  uid: string;
  name: string;
}

function bearer(req: NextRequest): string {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

export async function resolveOrganizer(
  req: NextRequest,
  kind: RewardKind,
  id: string,
): Promise<{ ctx?: OrganizerCtx; error?: { status: number; message: string } }> {
  const token = bearer(req);
  if (!token) return { error: { status: 401, message: 'Giriş gerekli.' } };

  let uid: string;
  let role: string | undefined;
  try {
    const dec = (await getAdminAuth().verifyIdToken(token)) as { uid: string; role?: string };
    uid = dec.uid;
    role = dec.role;
  } catch {
    return { error: { status: 401, message: 'Geçersiz oturum.' } };
  }

  const db = getAdminFirestore();
  const col = kind === 'event' ? COLLECTIONS.events : COLLECTIONS.volunteering;
  const snap = await db.collection(col).doc(id).get();
  if (!snap.exists) return { error: { status: 404, message: 'Kayıt bulunamadı.' } };
  const data = snap.data() as Record<string, unknown>;

  const organizerId = String((kind === 'event' ? data.organizerId : data.ngoId) || '');
  const isSuper = role === 'super-admin';
  let allowed = isSuper || (!!organizerId && uid === organizerId);
  if (!allowed) {
    const uSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const u = (uSnap.data() ?? {}) as { managedNgoId?: string; managedClubId?: string; role?: string };
    allowed = u.managedNgoId === organizerId || u.managedClubId === organizerId || u.role === 'super-admin';
  }
  if (!allowed) return { error: { status: 403, message: 'Bu kaydın sahibi değilsin.' } };

  // Kurum adı/logo — parent doc'ta yoksa organizer entity'den çöz.
  let ngoName = String(data.ngoName || data.organizerName || '');
  let ngoLogoUrl = (data.ngoLogoUrl || data.organizerLogoUrl) as string | undefined;
  if (!ngoName && organizerId) {
    for (const c of [COLLECTIONS.ngos, COLLECTIONS.clubs]) {
      const eSnap = await db.collection(c).doc(organizerId).get();
      if (eSnap.exists) {
        const e = eSnap.data() as { name?: string; logoUrl?: string; avatarUrl?: string };
        ngoName = e.name || ngoName;
        ngoLogoUrl = ngoLogoUrl || e.logoUrl || e.avatarUrl;
        break;
      }
    }
  }

  const title = String(data.name || data.title || '');
  const loc = (data.location as { type?: string; online?: boolean; address?: string; city?: string } | undefined) || {};
  const guessOnline = !!(
    data.isOnline || data.online || data.isRemote || data.remote ||
    data.eventType === 'online' || data.format === 'online' ||
    loc.type === 'online' || loc.online === true
  );

  return {
    ctx: { uid, kind, parentId: id, organizerId, ngoName: ngoName || 'hangel', ngoLogoUrl, title, guessOnline },
  };
}

/** Kullanıcı adlarını toplu getir (winner/isim gösterimi için). */
async function fetchNames(uids: string[]): Promise<Record<string, string>> {
  const db = getAdminFirestore();
  const out: Record<string, string> = {};
  const uniq = Array.from(new Set(uids)).filter(Boolean);
  for (let i = 0; i < uniq.length; i += 300) {
    const batch = uniq.slice(i, i + 300);
    const refs = batch.map((u) => db.collection(COLLECTIONS.users).doc(u));
    const snaps = await db.getAll(...refs);
    for (const s of snaps) {
      const d = (s.data() ?? {}) as { displayName?: string; name?: string };
      out[s.id] = d.displayName || d.name || 'hangel gönüllüsü';
    }
  }
  return out;
}

/**
 * Uygun katılımcılar:
 *   - event + requireCheckin → check-in yapanlar (checkins).
 *   - event + !requireCheckin → kayıtlı ("going" rsvp).
 *   - volunteering → onaylı başvuranlar (applications, status 'Onaylandı').
 */
export async function getEligibleParticipants(
  kind: RewardKind,
  id: string,
  opts: { requireCheckin: boolean },
): Promise<Participant[]> {
  const db = getAdminFirestore();
  const uids: string[] = [];

  if (kind === 'event') {
    if (opts.requireCheckin) {
      const snap = await db.collection(COLLECTIONS.events).doc(id).collection('checkins').get();
      for (const d of snap.docs) uids.push(d.id);
    } else {
      const snap = await db.collection(COLLECTIONS.events).doc(id).collection('rsvps').where('status', '==', 'going').get();
      for (const d of snap.docs) uids.push(d.id);
    }
  } else {
    const snap = await db
      .collection(COLLECTIONS.applications)
      .where('entityId', '==', id)
      .where('status', '==', 'Onaylandı')
      .get();
    for (const d of snap.docs) {
      const a = d.data() as { userId?: string; type?: string };
      if (a.userId && (!a.type || a.type === 'Gönüllülük')) uids.push(a.userId);
    }
  }

  const names = await fetchNames(uids);
  const seen = new Set<string>();
  const out: Participant[] = [];
  for (const u of uids) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push({ uid: u, name: names[u] || 'hangel gönüllüsü' });
  }
  return out;
}
