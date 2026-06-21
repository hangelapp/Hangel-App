/**
 * Public certificate verification — `GET /api/certificate/verify?code=XXX`.
 *
 * No auth: anyone holding a hangel certificate code can verify it. The code is a
 * 9-char, "H"-prefixed string (e.g. H7K2QF9XA) that deterministically encodes
 * the issue date, country, and kind (see src/lib/certificate-code.ts).
 *
 * Two-tier verification:
 *  1. DECODE — `decodeCertCode` validates the checksum + unpacks date/kind/country.
 *     This always works offline (no DB) so the endpoint stays useful even when
 *     Firestore is unavailable.
 *  2. ENRICH (best-effort) — if a `certificates` doc carries this exact `code`,
 *     we resolve the holder's display name + subject + organization so the
 *     verification page can show a richer card. Wrapped in try/catch: any failure
 *     falls back to the decode-only result.
 *
 * Privacy: the response ONLY ever exposes safe public fields (holder display
 * name, subject, organization, dates). Email, uid, and raw docs are never sent.
 *
 * Error response shape: `{ errorCode, message }` (only for malformed requests).
 */

import { NextResponse } from 'next/server';
import { decodeCertCode, normalizeCertCode, countryName, type CertKind } from '@/lib/certificate-code';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

type ErrorCode = 'MISSING_CODE';

function errJson(body: { errorCode: ErrorCode; message: string }, status: number) {
  return NextResponse.json(body, { status });
}

interface VerifyResult {
  valid: true;
  found?: boolean;        // kod Luhn-geçerli ama DB'de kayıt var mı
  kind?: CertKind;
  country?: string;
  countryName?: string;
  year?: number;
  activityNo?: number;
  personNo?: number;
  holderName?: string;
  subject?: string;
  organization?: string;
  issuedAt?: string;
}

const TYPE_TO_KIND: Record<string, CertKind> = {
  event: 'event', volunteering: 'volunteer', volunteer: 'volunteer', donation: 'donation', blood: 'blood',
};

/** Firestore Timestamp-ish guard — pulls `toDate()` without an `any` cast. */
function toIsoDate(value: unknown): string | undefined {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawCode = searchParams.get('code');
  if (!rawCode || rawCode.trim().length === 0) {
    return errJson({ errorCode: 'MISSING_CODE', message: 'code sorgu parametresi gereklidir.' }, 400);
  }

  const decoded = decodeCertCode(rawCode);
  if (!decoded.valid) {
    return NextResponse.json({ valid: false });
  }

  // Kod biçim+Luhn geçerli. Yapısal alanlar + sahibi DB'den gelir (found:false = kayıt yok).
  const result: VerifyResult = { valid: true, found: false };
  try {
    const normalizedCode = normalizeCertCode(rawCode);
    const db = getAdminFirestore();
    const snap = await db
      .collection(COLLECTIONS.certificates)
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();

    if (!snap.empty) {
      const data = snap.docs[0].data() as {
        userId?: string; title?: string; eventName?: string; ngoName?: string; type?: string;
        certCountry?: string; certYear?: number; certActivityNo?: number; certPersonNo?: number;
        completedAt?: unknown;
      };
      result.found = true;
      if (data.type && TYPE_TO_KIND[data.type]) result.kind = TYPE_TO_KIND[data.type];
      if (data.certCountry) { result.country = data.certCountry; result.countryName = countryName(data.certCountry); }
      if (typeof data.certYear === 'number') result.year = data.certYear;
      if (typeof data.certActivityNo === 'number') result.activityNo = data.certActivityNo;
      if (typeof data.certPersonNo === 'number') result.personNo = data.certPersonNo;

      const subject = data.title || data.eventName;
      if (subject) result.subject = subject;
      if (data.ngoName) result.organization = data.ngoName;
      const issuedAt = toIsoDate(data.completedAt);
      if (issuedAt) result.issuedAt = issuedAt;

      // Sahibi adı: users/{userId}.name → Auth displayName. E-posta/uid sızdırılmaz.
      if (data.userId) {
        let holderName: string | undefined;
        try {
          const userSnap = await db.collection(COLLECTIONS.users).doc(data.userId).get();
          const name = (userSnap.data() as { name?: string } | undefined)?.name;
          if (name && typeof name === 'string') holderName = name;
        } catch { holderName = undefined; }
        if (!holderName) {
          try {
            const authUser = await getAdminAuth().getUser(data.userId);
            if (authUser.displayName) holderName = authUser.displayName;
          } catch { holderName = undefined; }
        }
        if (holderName) result.holderName = holderName;
      }
    }
  } catch {
    // DB erişilemezse: kod biçim/Luhn geçerli ama detay yok (found:false).
  }

  return NextResponse.json(result);
}
