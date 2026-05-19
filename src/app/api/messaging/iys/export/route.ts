/**
 * İYS export: Tüm userMarketingConsent kayıtlarını CSV olarak indirir.
 * İYS portalına manuel upload için.
 *
 * Format: Recipient,RecipientType,Type,Source,Status,ConsentDate
 */

import { NextResponse } from 'next/server';
import { requireSuperAdmin, type SuperAdminContext } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { logAudit } from '@/lib/messaging/audit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const maxDuration = 120;

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const actor = (auth as { actor: SuperAdminContext }).actor;

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.userMarketingConsent).get();

  const lines: string[] = ['Recipient,RecipientType,Type,Source,Status,ConsentDate'];

  for (const doc of snap.docs) {
    const data = doc.data() as {
      email?: { enabled?: boolean; updatedAt?: { toDate?: () => Date }; source?: string };
      sms?: { enabled?: boolean; updatedAt?: { toDate?: () => Date }; source?: string };
      channelAddresses?: { email?: string; phone?: string };
    };

    const userSnap = await db.collection(COLLECTIONS.users).doc(doc.id).get();
    const user = userSnap.exists ? (userSnap.data() as { personalInfo?: { email?: string; phone?: string } }) : null;

    const email = data.channelAddresses?.email ?? user?.personalInfo?.email;
    const phone = data.channelAddresses?.phone ?? user?.personalInfo?.phone;

    if (email && data.email !== undefined) {
      const status = data.email.enabled ? 'ONAY' : 'RED';
      const date = data.email.updatedAt?.toDate?.()?.toISOString() ?? '';
      lines.push(
        [csvEscape(email), 'BIREYSEL', 'EPOSTA', 'HS_WEB', status, csvEscape(date)].join(',')
      );
    }
    if (phone && data.sms !== undefined) {
      const status = data.sms.enabled ? 'ONAY' : 'RED';
      const date = data.sms.updatedAt?.toDate?.()?.toISOString() ?? '';
      lines.push(
        [csvEscape(phone), 'BIREYSEL', 'MESAJ', 'HS_WEB', status, csvEscape(date)].join(',')
      );
    }
  }

  await logAudit(actor, 'consent.exported', { recipientCount: lines.length - 1 });

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="iys-export-${Date.now()}.csv"`,
    },
  });
}
