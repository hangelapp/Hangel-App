/**
 * GET /api/ngo-admin/documents/list
 *
 * STK'nın `documentArchive` koleksiyonundaki belgelerini döndürür ve her belge
 * için 6 ay tazelik durumunu hesaplar (180 gün eşiği). Onboarding wizard
 * "Belgeler" adımı + diğer yerlerde "geçerli mi / güncellemeli mi" kontrolü
 * için kullanılır.
 *
 * Auth: ngo-admin / super-admin token + managedNgoId.
 * Yanıt:
 *   {
 *     documents: [{
 *       id, docType, fileUrl, year, uploadedAt (ISO),
 *       isFresh (boolean — son 6 ay içinde mi),
 *       daysUntilExpiry (number — taze ise pozitif, bayatladıysa negatif gün sayısı)
 *     }],
 *     freshnessWindowDays: 180
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FRESHNESS_WINDOW_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function authorize(req: NextRequest): Promise<{ uid: string; ngoId: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id header'ıyla gelir (çoklu kurum yöneten
    // kullanıcı için kritik). Caller onu yönetiyorsa (managedNgoId==header) ya da
    // super-admin ise header'daki STK kullanılır; yoksa managedNgoId'ye düşer.
    const __hdrId = (req.headers.get('x-org-id') || '').trim();
    const __hdrKind = (req.headers.get('x-org-kind') || '').trim().toLowerCase();
    const __activeNgoId = (__hdrId && __hdrKind === 'ngo' && (d.role === 'super-admin' || d.managedNgoId === __hdrId))
      ? __hdrId
      : (d.managedNgoId || '');
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId };
  } catch {
    return null;
  }
}

function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    try { return (value as { toDate: () => Date }).toDate().getTime(); } catch { return null; }
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    const s = (value as { _seconds: number })._seconds;
    return typeof s === 'number' ? s * 1000 : null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli' }, { status: 403 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.documentArchive)
    .where('entityId', '==', ctx.ngoId)
    .limit(100)
    .get()
    .catch(() => null);

  const now = Date.now();
  const documents = (snap?.docs ?? []).map((doc) => {
    const d = doc.data() as { docType?: string; fileUrl?: string; year?: string; uploadedAt?: unknown };
    const uploadedMs = toMillis(d.uploadedAt);
    const ageDays = uploadedMs != null ? Math.floor((now - uploadedMs) / MS_PER_DAY) : Number.POSITIVE_INFINITY;
    const daysUntilExpiry = uploadedMs != null ? (FRESHNESS_WINDOW_DAYS - ageDays) : -1;
    return {
      id: doc.id,
      docType: d.docType || '(belirsiz)',
      fileUrl: d.fileUrl || '',
      year: d.year || '',
      uploadedAt: uploadedMs ? new Date(uploadedMs).toISOString() : null,
      isFresh: ageDays <= FRESHNESS_WINDOW_DAYS,
      daysUntilExpiry,
    };
  });

  // Yöneticinin kolayca görmesi için: önce bayatlamış (güncellenmesi gerekli),
  // sonra yakında bayatlayacak, sonra taze; içinde alfabetik docType.
  documents.sort((a, b) => {
    if (a.isFresh !== b.isFresh) return a.isFresh ? 1 : -1;
    if (a.daysUntilExpiry !== b.daysUntilExpiry) return a.daysUntilExpiry - b.daysUntilExpiry;
    return a.docType.localeCompare(b.docType, 'tr');
  });

  return NextResponse.json({ documents, freshnessWindowDays: FRESHNESS_WINDOW_DAYS });
}
