/**
 * Gönüllü Kariyer Karnesi — Faz 3.
 *
 * LinkedIn-tarzı kariyer karnesi: yetkinlikler, tamamlanan görevler, eğitimler,
 * sertifikalar, liderlik deneyimleri. Kullanıcının kendisi update eder (self-
 * reported), diğer gönüllüler yetkinlik endorse eder, STK'lar onaylar.
 *
 * GET   — kariyer karnesini oku (alt-koleksiyonlardan birleştirilmiş + cache)
 * PATCH — yetkinlik / leadership / eğitim güncelle
 *
 * Body (PATCH):
 * {
 *   competencies?: { [name: string]: 'beginner'|'intermediate'|'advanced'|'expert' },
 *   trainings?: Array<{ title: string; provider?: string; year?: number; certificateUrl?: string }>,
 *   leadershipExperiences?: Array<{ title: string; org?: string; startYear?: number; endYear?: number; description?: string }>,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const COMPETENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

interface Training { title: string; provider?: string; year?: number; certificateUrl?: string; }
interface Leadership { title: string; org?: string; startYear?: number; endYear?: number; description?: string; }
interface CompletedTask { id: string; title: string; ngoName?: string; completedAt?: string | null; hours?: number; }
interface CertificateEntry { id: string; title: string; issuedBy?: string; issuedAt?: string | null; }

interface CareerData {
  competencies: Record<string, typeof COMPETENCY_LEVELS[number]>;
  endorsements: Record<string, number>;            // {competencyName: count}
  completedTasks: CompletedTask[];
  trainings: Training[];
  certificates: CertificateEntry[];
  leadershipExperiences: Leadership[];
  lastUpdatedAt: string;
}

const PatchBodySchema = z.object({
  competencies: z.record(z.string().min(1).max(64), z.enum(COMPETENCY_LEVELS)).optional(),
  trainings: z.array(z.object({
    title: z.string().min(1).max(160),
    provider: z.string().max(120).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    certificateUrl: z.string().url().optional(),
  })).max(50).optional(),
  leadershipExperiences: z.array(z.object({
    title: z.string().min(1).max(120),
    org: z.string().max(120).optional(),
    startYear: z.number().int().min(1900).max(2100).optional(),
    endYear: z.number().int().min(1900).max(2100).optional(),
    description: z.string().max(800).optional(),
  })).max(30).optional(),
});

async function buildCareer(uid: string): Promise<CareerData> {
  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.users).doc(uid);

  const [userSnap, pastVol, certs] = await Promise.all([
    userRef.get(),
    userRef.collection(COLLECTIONS.pastVolunteering).orderBy('completedAt', 'desc').limit(50).get().catch(() => null),
    userRef.collection(COLLECTIONS.certificates).get().catch(() => null),
  ]);

  const user = userSnap.data() ?? {};
  const existingCareer = (user.career ?? {}) as Partial<CareerData>;

  const completedTasks: CompletedTask[] = (pastVol?.docs ?? []).map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: typeof data.title === 'string' ? data.title : (typeof data.taskTitle === 'string' ? data.taskTitle : d.id),
      ngoName: typeof data.ngoName === 'string' ? data.ngoName : undefined,
      completedAt: (data.completedAt as Timestamp | undefined)?.toDate?.().toISOString() ?? null,
      hours: typeof data.hours === 'number' ? data.hours : undefined,
    };
  });

  const certificates: CertificateEntry[] = (certs?.docs ?? []).map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: typeof data.title === 'string' ? data.title : (typeof data.name === 'string' ? data.name : d.id),
      issuedBy: typeof data.issuedBy === 'string' ? data.issuedBy : undefined,
      issuedAt: (data.issuedAt as Timestamp | undefined)?.toDate?.().toISOString() ?? null,
    };
  });

  return {
    competencies: existingCareer.competencies ?? {},
    endorsements: existingCareer.endorsements ?? {},
    completedTasks,
    trainings: existingCareer.trainings ?? [],
    certificates,
    leadershipExperiences: existingCareer.leadershipExperiences ?? [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

async function verifyAuth(req: NextRequest): Promise<{ uid: string } | { error: NextResponse }> {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 }) };
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(h.slice('Bearer '.length).trim());
    return { uid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 }) };
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await verifyAuth(req);
  if ('error' in auth) return auth.error;
  try {
    const career = await buildCareer(auth.uid);
    return NextResponse.json({ ok: true, career });
  } catch (e) {
    return NextResponse.json({
      errorCode: 'BUILD_FAILED',
      message: e instanceof Error ? e.message : 'Hesaplanamadı.',
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await verifyAuth(req);
  if ('error' in auth) return auth.error;

  let body: z.infer<typeof PatchBodySchema>;
  try {
    body = PatchBodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.users).doc(auth.uid);
  const partial: Record<string, unknown> = {};
  if (body.competencies) partial['career.competencies'] = body.competencies;
  if (body.trainings) partial['career.trainings'] = body.trainings;
  if (body.leadershipExperiences) partial['career.leadershipExperiences'] = body.leadershipExperiences;
  partial['career.lastUpdatedAt'] = FieldValue.serverTimestamp();

  await userRef.set(partial, { merge: true });
  return NextResponse.json({ ok: true });
}
