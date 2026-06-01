/**
 * Blood emergency match algorithm.
 *
 * Trigger: Firestore onDocumentCreated for emergencyBloodCalls/{id}
 * Region : europe-west1
 *
 * Algorithm:
 *   1. Read emergency call (bloodTypes, coordinates / location).
 *   2. Scan users where personalInfo.canDonateBlood == true.
 *   3. ABO/Rh compatibility check (donor → recipient direction).
 *   4. Haversine distance <= 30 km between user.lastKnownLocation and call coords.
 *   5. lastDonationDate older than 56 days (or absent → eligible).
 *   6. Take the first 50 matches.
 *   7. For each, write a notification doc (type='emergency-blood') — the
 *      existing onNotificationCreated handler delivers FCM push.
 *   8. Update the emergency call doc with matchedDonors = match count.
 *
 * Notes:
 *   - bloodType strings in this project use the format "A Rh+" / "0 Rh-" etc.
 *     (see src/app/api/users/me/blood-feed/route.ts COMPATIBILITY map).
 *   - Donor → Recipient compatibility: a donor of type X can give to a
 *     recipient whose type is in DONOR_TO_RECIPIENTS[X]. We compute this from
 *     the inverse of the recipient-side compatibility map to stay
 *     authoritative with the rest of the codebase.
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const MAX_DISTANCE_KM = 30;
const MAX_MATCHES = 50;
const DONATION_COOLDOWN_DAYS = 56;

/**
 * Recipient → set of donor types that can give to this recipient.
 * Mirrors src/app/api/users/me/blood-feed/route.ts to stay consistent.
 */
const RECIPIENT_TO_DONORS: Record<string, string[]> = {
  'A Rh+': ['A Rh+', 'A Rh-', '0 Rh+', '0 Rh-'],
  'A Rh-': ['A Rh-', '0 Rh-'],
  'B Rh+': ['B Rh+', 'B Rh-', '0 Rh+', '0 Rh-'],
  'B Rh-': ['B Rh-', '0 Rh-'],
  'AB Rh+': ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'],
  'AB Rh-': ['A Rh-', 'B Rh-', 'AB Rh-', '0 Rh-'],
  '0 Rh+': ['0 Rh+', '0 Rh-'],
  '0 Rh-': ['0 Rh-'],
};

/**
 * Haversine distance in kilometres.
 */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface GeoPoint {
  lat: number;
  lng: number;
}

interface EmergencyBloodCall {
  bloodTypes?: string[];
  coordinates?: GeoPoint;
  location?: GeoPoint;
  hospitalName?: string;
  city?: string;
  urgency?: 'critical' | 'high' | 'normal';
  title?: string;
  status?: string;
}

interface FirestoreTimestamp {
  toDate: () => Date;
  toMillis?: () => number;
}

interface UserDoc {
  id?: string;
  name?: string;
  personalInfo?: {
    bloodType?: string;
    canDonateBlood?: boolean;
    lastDonationDate?: string | FirestoreTimestamp;
  };
  lastKnownLocation?: GeoPoint | { latitude?: number; longitude?: number };
}

/**
 * Best-effort conversion of a user.lastKnownLocation value into {lat, lng}.
 * Accepts Firestore GeoPoint-like objects (latitude/longitude) and plain
 * {lat, lng} maps used elsewhere in the codebase.
 */
function readUserCoords(loc: UserDoc['lastKnownLocation']): GeoPoint | null {
  if (!loc) return null;
  if ('lat' in loc && 'lng' in loc) {
    const lat = typeof loc.lat === 'number' ? loc.lat : NaN;
    const lng = typeof loc.lng === 'number' ? loc.lng : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  if ('latitude' in loc && 'longitude' in loc) {
    const lat = typeof loc.latitude === 'number' ? loc.latitude : NaN;
    const lng = typeof loc.longitude === 'number' ? loc.longitude : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

function readCallCoords(call: EmergencyBloodCall): GeoPoint | null {
  return readUserCoords(call.coordinates ?? call.location ?? undefined);
}

/**
 * Days since last donation. Returns Infinity if never donated / unknown.
 */
function daysSinceLastDonation(value: string | FirestoreTimestamp | undefined): number {
  if (!value) return Infinity;
  let date: Date | null = null;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    date = value.toDate();
  }
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Build the set of acceptable donor blood types for this call.
 * If the call lists multiple recipient blood types, we take the union of
 * compatible donor types across all of them.
 */
function buildAcceptedDonorSet(recipientTypes: string[] | undefined): Set<string> | null {
  if (!recipientTypes || recipientTypes.length === 0) return null;
  const set = new Set<string>();
  for (const r of recipientTypes) {
    const donors = RECIPIENT_TO_DONORS[r];
    if (donors) for (const d of donors) set.add(d);
  }
  return set.size > 0 ? set : null;
}

export const onEmergencyBloodCallCreated = onDocumentCreated(
  {
    document: 'emergencyBloodCalls/{callId}',
    region: REGION,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const callId = event.params.callId;
    const call = snap.data() as EmergencyBloodCall;

    const callCoords = readCallCoords(call);
    if (!callCoords) {
      logger.warn(`[blood-match] ${callId} has no usable coordinates, skipping`);
      return;
    }

    const acceptedDonors = buildAcceptedDonorSet(call.bloodTypes);

    const db = getFirestore();

    // Pull eligible donors. We cannot do a geo-query in Firestore directly, so
    // filter by canDonateBlood == true server-side and apply the Haversine in
    // memory. 30 km is small enough that 1 query usually suffices for most
    // markets; if the donor pool grows past ~10k, switch to GeoFirestore.
    const candidatesSnap = await db
      .collection('users')
      .where('personalInfo.canDonateBlood', '==', true)
      .get();

    interface Match {
      uid: string;
      distance: number;
      name: string;
    }
    const matches: Match[] = [];

    for (const userDoc of candidatesSnap.docs) {
      const user = userDoc.data() as UserDoc;
      const personal = user.personalInfo;
      if (!personal) continue;

      // ABO/Rh compatibility
      if (acceptedDonors && personal.bloodType) {
        if (!acceptedDonors.has(personal.bloodType)) continue;
      } else if (acceptedDonors) {
        // call requires specific types but donor has none recorded
        continue;
      }

      // Cooldown
      const daysAgo = daysSinceLastDonation(personal.lastDonationDate);
      if (daysAgo <= DONATION_COOLDOWN_DAYS) continue;

      // Distance
      const donorCoords = readUserCoords(user.lastKnownLocation);
      if (!donorCoords) continue;
      const d = distanceKm(callCoords.lat, callCoords.lng, donorCoords.lat, donorCoords.lng);
      if (d > MAX_DISTANCE_KM) continue;

      matches.push({
        uid: userDoc.id,
        distance: Math.round(d * 10) / 10,
        name: user.name ?? 'Bağışçı',
      });
    }

    // Closest first (clinically and UX best)
    matches.sort((a, b) => a.distance - b.distance);
    const selected = matches.slice(0, MAX_MATCHES);

    if (selected.length === 0) {
      await snap.ref.update({
        matchedDonors: 0,
        matchedAt: FieldValue.serverTimestamp(),
      }).catch((e) => logger.warn('[blood-match] update zero match failed', e));
      logger.info(`[blood-match] ${callId}: no eligible donors`);
      return;
    }

    const title = call.title || 'Acil kan ihtiyacı';
    const bloodTypeList = (call.bloodTypes ?? []).join(', ') || 'Belirsiz';
    const hospital = call.hospitalName ?? '';
    const city = call.city ?? '';

    // Write notification docs in batches of 500 (Firestore batch cap).
    const writer = db.bulkWriter();
    for (const m of selected) {
      const notifRef = db.collection('notifications').doc();
      const bodyParts: string[] = [];
      bodyParts.push(`${bloodTypeList} kanına ihtiyaç var`);
      if (hospital) bodyParts.push(hospital);
      if (city) bodyParts.push(city);
      bodyParts.push(`${m.distance} km uzakta`);

      writer.set(notifRef, {
        userId: m.uid,
        title,
        body: bodyParts.join(' · '),
        type: 'emergency-blood',
        data: {
          type: 'emergency-blood',
          requestId: callId,
          hospitalName: hospital,
          city,
          bloodType: bloodTypeList,
          distance: `${m.distance} km`,
          link: '/emergency',
        },
        read: false,
        pushSent: false,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'emergency-system',
      });
    }
    await writer.close();

    await snap.ref.update({
      matchedDonors: selected.length,
      matchedAt: FieldValue.serverTimestamp(),
    }).catch((e) => logger.warn('[blood-match] update match count failed', e));

    logger.info(`[blood-match] ${callId}: matched ${selected.length} donors`);
  },
);
