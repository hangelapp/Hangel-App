/**
 * NGO admin: kendi cüzdan + sender + quota özeti.
 */

import { NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getWallet } from '@/lib/messaging/wallet';
import { getPricing } from '@/lib/messaging/pricing';
import { getAdminFirestore } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireNgoAdmin(req);
  if (auth.error) return auth.error;
  const actor = auth.actor;

  const wallet = await getWallet(actor.ngoId);
  const pricing = await getPricing();

  const db = getAdminFirestore();
  const sendersSnap = await db.collection('ngoSenders').doc(actor.ngoId).collection('senders').get();
  const senders = sendersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return NextResponse.json({
    ngoId: actor.ngoId,
    wallet: {
      balance: wallet.balance,
      reserved: wallet.reserved,
      freeQuotaUsed: wallet.freeQuotaUsed,
      currency: wallet.currency,
      lowBalanceThreshold: wallet.lowBalanceThreshold,
    },
    freeQuota: pricing.freeQuota,
    senders,
  });
}
