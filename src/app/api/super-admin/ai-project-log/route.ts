/**
 * GET /api/super-admin/ai-project-log
 *
 * Proje yazma asistanıyla üretilen son projeleri (aiProjectLog) süper-admin'e döner —
 * "kim, hangi kuruma, ne zaman" denetimi. Admin SDK okur (client Firestore rule gerekmez).
 * Yetki: requireSuperAdmin (Bearer idToken + super-admin claim).
 */
import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection(COLLECTIONS.aiProjectLog)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const items = snap.docs.map((d) => {
      const x = d.data();
      const created = x.createdAt as { toMillis?: () => number } | number | undefined;
      const createdAt =
        created && typeof created === 'object' && typeof created.toMillis === 'function'
          ? created.toMillis()
          : typeof created === 'number'
            ? created
            : null;
      return {
        id: d.id,
        userName: typeof x.userName === 'string' ? x.userName : 'Bilinmeyen',
        ngoName: typeof x.ngoName === 'string' ? x.ngoName : null,
        institution: typeof x.institution === 'string' ? x.institution : '',
        title: typeof x.title === 'string' ? x.title : '',
        sectionsFilled: Array.isArray(x.sectionsFilled) ? x.sectionsFilled : [],
        proposalLength: typeof x.proposalLength === 'number' ? x.proposalLength : 0,
        createdAt,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error('ai-project-log error', e);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: 'Proje logu alınamadı.' },
      { status: 500 },
    );
  }
}
