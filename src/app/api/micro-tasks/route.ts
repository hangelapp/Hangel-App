/**
 * Mikro Gönüllülük görev listesi — Faz 3.
 *
 * 5-30 dakikalık kısa görevler. STK admin veya super-admin oluşturur,
 * kullanıcılar listeyi konuma/kategoriye göre filtreleyip kabul eder.
 *
 * GET  — aktif görevleri listele (opsiyonel: lat/lng/radiusKm + kategori filtresi)
 * POST — yeni görev (auth: STK admin veya super-admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

const CATEGORIES = ['environment', 'elderly', 'animals', 'children', 'health', 'education', 'other'] as const;

const PostBodySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(800),
  estimatedMinutes: z.number().int().positive().max(120),
  category: z.enum(CATEGORIES),
  ngoId: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radiusKm: z.number().positive().max(50).default(5),
    cityLabel: z.string().optional(),
  }).optional(),
  reward: z.object({
    points: z.number().int().positive().default(10),
    badgeId: z.string().optional(),
  }).optional(),
});

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6_371;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sa = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const radiusKm = Number(searchParams.get('radiusKm') || '10');
  const category = searchParams.get('category');

  const db = getAdminFirestore();
  let query = db.collection(COLLECTIONS.microTasks).where('active', '==', true).limit(200);
  if (category && CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    query = query.where('category', '==', category);
  }

  const snap = await query.get();
  let tasks = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title as string,
      description: data.description as string,
      estimatedMinutes: data.estimatedMinutes as number,
      category: data.category as string,
      ngoId: (data.ngoId as string | undefined) ?? null,
      location: data.location as { latitude: number; longitude: number; radiusKm: number; cityLabel?: string } | undefined,
      reward: data.reward as { points: number; badgeId?: string } | undefined,
      createdAt: (data.createdAt?.toDate?.() ?? null) as Date | null,
    };
  });

  // Konum filtresi (varsa)
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    tasks = tasks
      .map(t => {
        if (!t.location) return { task: t, distanceKm: Infinity };
        const d = haversineKm({ latitude: lat, longitude: lng }, { latitude: t.location.latitude, longitude: t.location.longitude });
        return { task: t, distanceKm: d };
      })
      .filter(x => x.distanceKm <= radiusKm + (x.task.location?.radiusKm ?? 0))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map(x => ({ ...x.task, distanceKm: Math.round(x.distanceKm * 10) / 10 }));
  }

  return NextResponse.json({ ok: true, tasks });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 });
  }
  let uid: string;
  let isSuperAdmin = false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    uid = decoded.uid;
    isSuperAdmin = decoded.superadmin === true;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
  }

  let body: z.infer<typeof PostBodySchema>;
  try {
    body = PostBodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  // Yetki: super-admin veya STK admin (kendi ngoId'sine)
  if (!isSuperAdmin) {
    const userDoc = await getAdminFirestore().collection(COLLECTIONS.users).doc(uid).get();
    const managedNgoId = userDoc.data()?.managedNgoId as string | undefined;
    if (!managedNgoId) {
      return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Mikro görev oluşturma yetkin yok.' }, { status: 403 });
    }
    if (body.ngoId && body.ngoId !== managedNgoId) {
      return NextResponse.json({ errorCode: 'WRONG_NGO', message: 'Kendi STK\'nızdan başkasına görev oluşturamazsınız.' }, { status: 403 });
    }
    body.ngoId = managedNgoId;
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.microTasks).doc();
  await ref.set({
    title: body.title,
    description: body.description,
    estimatedMinutes: body.estimatedMinutes,
    category: body.category,
    ngoId: body.ngoId ?? null,
    location: body.location ?? null,
    reward: body.reward ?? { points: 10 },
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
