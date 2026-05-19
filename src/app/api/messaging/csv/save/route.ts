/**
 * CSV save: parsed satırları normalize edip csvUploads'a yazar.
 *
 * Beklenen mapping:
 *   addressColumn: 'sms' için telefon kolonu, 'email' için e-posta kolonu
 *   varsMapping: { ad: 'Name', stk_adi: 'NGO Name' } gibi alan→kolon map'i
 *   marketingConsentColumn: opsiyonel — marketing için "yes/true/1" değeri olan kolon
 */

import { NextResponse } from 'next/server';
import { requireSuperAdmin, type SuperAdminContext } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { parseCsv } from '@/lib/messaging/csv';
import { toE164TR } from '@/lib/messaging/phone';
import { normalizeEmail, isValidEmail } from '@/lib/messaging/email';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface SaveBody {
  name: string;
  content: string;
  channel: 'sms' | 'email';
  addressColumn: string;
  varsMapping?: Record<string, string>;
  marketingConsentColumn?: string;
}

function truthy(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'evet' || s === '1' || s === 'y' || s === 'e';
}

export async function POST(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const actor = (auth as { actor: SuperAdminContext }).actor;

  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.name?.trim() || !body.content || !body.addressColumn || !body.channel) {
    return NextResponse.json({ error: 'name, content, channel, addressColumn gerekli' }, { status: 400 });
  }

  const parsed = parseCsv(body.content);
  if (parsed.rowCount === 0) {
    return NextResponse.json({ error: 'Geçerli satır yok' }, { status: 400 });
  }
  if (!parsed.columns.includes(body.addressColumn)) {
    return NextResponse.json({ error: 'addressColumn CSV içinde yok' }, { status: 400 });
  }

  const rows: Array<{ channelAddress: string; vars: Record<string, string>; consentSnapshot?: { marketing: boolean } }> = [];
  let invalidAddresses = 0;
  const seen = new Set<string>();

  for (const row of parsed.rows) {
    const raw = row[body.addressColumn];
    if (!raw) {
      invalidAddresses += 1;
      continue;
    }
    const addr =
      body.channel === 'sms'
        ? toE164TR(raw)
        : (() => {
            const n = normalizeEmail(raw);
            return n && isValidEmail(n) ? n : null;
          })();

    if (!addr) {
      invalidAddresses += 1;
      continue;
    }
    if (seen.has(addr)) continue;
    seen.add(addr);

    const vars: Record<string, string> = {};
    if (body.varsMapping) {
      for (const [varName, colName] of Object.entries(body.varsMapping)) {
        vars[varName] = (row[colName] ?? '').trim();
      }
    }

    const entry: { channelAddress: string; vars: Record<string, string>; consentSnapshot?: { marketing: boolean } } = {
      channelAddress: addr,
      vars,
    };
    if (body.marketingConsentColumn) {
      entry.consentSnapshot = { marketing: truthy(row[body.marketingConsentColumn]) };
    }
    rows.push(entry);
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Geçerli alıcı kalmadı', invalidAddresses }, { status: 400 });
  }

  const db = getAdminFirestore();
  const docRef = db.collection(COLLECTIONS.csvUploads).doc();
  await docRef.set({
    name: body.name.trim(),
    channel: body.channel,
    rowCount: rows.length,
    invalidAddresses,
    columnsMap: {
      addressColumn: body.addressColumn,
      varsMapping: body.varsMapping ?? {},
      marketingConsentColumn: body.marketingConsentColumn ?? null,
    },
    rows,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
  });

  return NextResponse.json({
    csvUploadId: docRef.id,
    rowCount: rows.length,
    invalidAddresses,
  });
}
