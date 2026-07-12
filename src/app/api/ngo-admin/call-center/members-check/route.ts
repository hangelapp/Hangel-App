/**
 * POST /api/ngo-admin/call-center/members-check
 *
 * Bir kişi listesindeki telefonlardan hangisi hangel üyesine (users) ait?
 * UI kişileri yükledikten sonra telefonları toplu gönderir; üye olanların
 * telefonlarını (normalize) set olarak alır ve listede küçük bir "hangel üyesi"
 * ikonu gösterir.
 *
 * Body: { phones: string[] }  (en fazla 200)
 * Yanıt: { members: string[] } — üye olan telefonlar (gönderilen haliyle eşleşir)
 * KVKK: yalnız üye OLUP OLMADIĞI bilgisi döner; kullanıcı verisi sızmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { phoneMatchCandidates } from '@/lib/phone-normalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PHONES = 200;
const IN_CHUNK = 30; // Firestore 'in' limiti

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  let body: { phones?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const phones = Array.isArray(body.phones)
    ? body.phones.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).slice(0, MAX_PHONES)
    : [];
  if (phones.length === 0) return NextResponse.json({ members: [] });

  // Her gönderilen telefon için normalize adaylarını çıkar; aday→orijinal eşlemesi tut.
  const candidateToOriginal = new Map<string, string>();
  const allCandidates = new Set<string>();
  for (const original of phones) {
    for (const cand of phoneMatchCandidates(original, '+90')) {
      allCandidates.add(cand);
      if (!candidateToOriginal.has(cand)) candidateToOriginal.set(cand, original);
    }
  }

  const db = getAdminFirestore();
  const memberOriginals = new Set<string>();

  // Adayları 30'luk gruplarla hem 'phone' hem 'personalInfo.phone' üstünde ara.
  for (const group of chunk([...allCandidates], IN_CHUNK)) {
    const [byPhone, byPersonal] = await Promise.all([
      db.collection(COLLECTIONS.users).where('phone', 'in', group).select('phone').get().catch(() => null),
      db.collection(COLLECTIONS.users).where('personalInfo.phone', 'in', group).select('personalInfo.phone').get().catch(() => null),
    ]);
    const markHit = (val: unknown) => {
      if (typeof val === 'string' && candidateToOriginal.has(val)) {
        memberOriginals.add(candidateToOriginal.get(val)!);
      }
    };
    if (byPhone) for (const d of byPhone.docs) markHit((d.data() as { phone?: string }).phone);
    if (byPersonal) for (const d of byPersonal.docs) markHit((d.data() as { personalInfo?: { phone?: string } }).personalInfo?.phone);
  }

  return NextResponse.json({ members: [...memberOriginals] });
}
