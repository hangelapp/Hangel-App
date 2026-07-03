/**
 * POST /api/rewards/raffle — Çekilişi yapar (yalnız organizatör).
 * Body: { kind, id }.
 *
 * Uygun katılımcılar arasından her ödül için kriptografik rastgele N kazanan
 * çeker (bir kişi en fazla bir çekiliş ödülü). Kazananları public
 * eventRewards/{key}/winners altına yazar, her birine kurumdan yanıtlanabilir
 * DM + bildirim gönderir ve konfeti sinyali (celebration) bırakır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { resolveOrganizer, getEligibleParticipants, type Participant } from '@/lib/rewards-server';
import { notifyUser } from '@/lib/notify-user';
import { COLLECTIONS } from '@/firebase/collections';
import { rewardKey, type RewardConfig, type RewardKind } from '@/lib/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickN<T>(pool: T[], n: number): T[] {
  const a = [...pool];
  const out: T[] = [];
  const k = Math.min(Math.max(0, n), a.length);
  for (let i = 0; i < k; i++) out.push(a.splice(randomInt(a.length), 1)[0]);
  return out;
}

export async function POST(req: NextRequest) {
  let body: { kind?: RewardKind; id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }
  const kind = body.kind === 'event' || body.kind === 'volunteering' ? body.kind : null;
  const id = String(body.id || '');
  if (!kind || !id) return NextResponse.json({ error: 'kind ve id gerekli.' }, { status: 400 });

  const { ctx, error } = await resolveOrganizer(req, kind, id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const db = getAdminFirestore();
  const key = rewardKey(kind, id);
  const cfgSnap = await db.collection('rewardConfigs').doc(key).get();
  if (!cfgSnap.exists) return NextResponse.json({ error: 'Ödül yapılandırması yok.' }, { status: 404 });
  const cfg = cfgSnap.data() as RewardConfig;
  if (!cfg.raffle?.enabled || !(cfg.raffle.prizes?.length)) {
    return NextResponse.json({ error: 'Bu kayıtta çekiliş tanımlı değil.' }, { status: 400 });
  }

  // Uygunluk: online → kayıtlı; fiziksel → check-in yapanlar.
  const eligible = await getEligibleParticipants(kind, id, { requireCheckin: !cfg.isOnline });
  if (eligible.length === 0) {
    return NextResponse.json({ error: 'Uygun katılımcı bulunamadı (kayıt/check-in yok).' }, { status: 409 });
  }

  // Çek: kişi başına en fazla bir ödül.
  const pool: Participant[] = [...eligible];
  const drawn: Array<{ p: Participant; prizeName: string }> = [];
  for (const prize of cfg.raffle.prizes) {
    for (const p of pickN(pool, prize.count)) {
      drawn.push({ p, prizeName: prize.name });
      const idx = pool.findIndex((x) => x.uid === p.uid);
      if (idx >= 0) pool.splice(idx, 1);
    }
  }
  if (drawn.length === 0) {
    return NextResponse.json({ error: 'Kazanan çekilemedi.' }, { status: 409 });
  }

  // Kazananları yaz (public) + DM + bildirim + konfeti sinyali.
  const batch = db.batch();
  const nowLabel = 'Çekiliş';
  for (const w of drawn) {
    const wref = db.collection('eventRewards').doc(key).collection('winners').doc();
    batch.set(wref, {
      source: 'raffle',
      uid: w.p.uid,
      name: w.p.name.split(' ')[0], // public'te yalnız ad
      prizeName: w.prizeName,
      wonAt: FieldValue.serverTimestamp(),
    });
    // Konfeti sinyali (kullanıcının cihazında patlar).
    const cref = db.collection(COLLECTIONS.users).doc(w.p.uid).collection('celebrations').doc();
    batch.set(cref, {
      type: 'raffle',
      title: 'Çekilişi kazandın! 🎉',
      message: `${w.prizeName} — ${ctx!.title}`,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  // Kazananlara kurumdan yanıtlanabilir DM + push (adres için).
  await Promise.allSettled(
    drawn.map((w) =>
      notifyUser({
        userId: w.p.uid,
        type: 'reward_win',
        title: `Tebrikler! ${w.prizeName} kazandın 🎉`,
        body: `"${ctx!.title}" ${nowLabel.toLowerCase()}inde ${w.prizeName} kazandın. Ödülünü iletebilmemiz için bu mesajı yanıtlayıp adres/iletişim bilgini paylaş.`,
        link: '/messages',
        data: { rewardKey: key, prizeName: w.prizeName, kind, parentId: id },
        sender: { id: ctx!.organizerId, name: ctx!.ngoName, avatarUrl: ctx!.ngoLogoUrl },
        storeAsMessage: true,
        messageSubject: `🎉 ${w.prizeName} — Ödül Teslimi`,
        messageContent: `Tebrikler! "${ctx!.title}" etkinliğinde ${w.prizeName} kazandın.\n\nÖdülünü sana ulaştırabilmemiz için bu mesajı yanıtlayarak ad-soyad, telefon ve adres bilgini paylaşır mısın? Teşekkürler 🧡`,
      }),
    ),
  );

  return NextResponse.json({
    ok: true,
    winners: drawn.map((w) => ({ uid: w.p.uid, name: w.p.name, prizeName: w.prizeName })),
    eligibleCount: eligible.length,
  });
}
