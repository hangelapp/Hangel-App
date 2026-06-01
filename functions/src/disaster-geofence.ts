/**
 * Disaster alert geofence Cloud Function.
 *
 * Firestore trigger: `disasterAlerts/{id}` onCreate.
 *
 * Akış:
 *  1. Yeni afet/acil çağrı doc'u yazıldığında alert.coordinates okunur.
 *  2. users koleksiyonu taranır; her kullanıcının lastKnownLocation alanı
 *     50 km (veya alert.affectedRadiusKm) yarıçap içinde mi kontrol edilir
 *     (Haversine formülü ile).
 *  3. Match eden her kullanıcı için `notifications/{auto}` doc'u yazılır.
 *  4. Mevcut `onNotificationCreated` trigger'ı (index.ts) bu doc'tan FCM
 *     push gönderir — ekstra push logic burada yok.
 *
 * Push payload:
 *  - data.type = 'disaster_alert'           (iOS Time Sensitive request için)
 *  - data.disasterAlertId = alertId
 *  - data.severity = 'critical' | 'high' | 'normal'
 *  - data.distanceKm = mesafe (string, native parse eder)
 *  - data.link = '/alerts'                  (kullanıcı açtığında alerts page'e)
 *
 * Trigger gönüllü "opt-in" honor eder: user.preferences.disasterAlerts === true
 * olmayanlara notification yazılmaz.
 *
 * Maliyet notu: users koleksiyonu büyüdükçe full scan pahalı olabilir. Şu an
 * MVP — geo-shard / GeoFire index'ine geçmeden önce metric'leri izle.
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

interface Coordinates {
  lat: number;
  lng: number;
}

interface DisasterAlertDoc {
  title?: string;
  description?: string;
  type?: 'earthquake' | 'flood' | 'fire' | 'storm' | 'other';
  severity?: 'critical' | 'high' | 'normal';
  coordinates?: Coordinates;
  affectedRadiusKm?: number;
  location?: string;
  status?: string;
}

interface UserDoc {
  lastKnownLocation?: Coordinates & { updatedAt?: { toMillis: () => number } };
  preferences?: {
    disasterAlerts?: boolean;
  };
  fullName?: string;
  name?: string;
}

const DEFAULT_RADIUS_KM = 50;
const EARTH_RADIUS_KM = 6371;

/** Haversine distance between two lat/lng pairs (kilometers). */
function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const onDisasterAlertCreated = onDocumentCreated(
  {
    document: 'disasterAlerts/{alertId}',
    region: 'us-central1',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn('[disaster-geofence] no snapshot data');
      return;
    }

    const alert = snap.data() as DisasterAlertDoc;
    const alertId = event.params.alertId;

    if (!alert.coordinates || typeof alert.coordinates.lat !== 'number' || typeof alert.coordinates.lng !== 'number') {
      logger.warn(`[disaster-geofence] alert ${alertId} has no coordinates; skip`);
      return;
    }

    // İptal/pasif alert'ler için bildirim üretme
    if (alert.status === 'cancelled' || alert.status === 'resolved') {
      logger.info(`[disaster-geofence] alert ${alertId} status=${alert.status}; skip`);
      return;
    }

    const radiusKm = Math.max(
      DEFAULT_RADIUS_KM,
      typeof alert.affectedRadiusKm === 'number' && alert.affectedRadiusKm > 0
        ? alert.affectedRadiusKm
        : 0,
    );

    const db = getFirestore();

    // Tüm kullanıcıları çek ve client-side haversine ile filtrele.
    // (Firestore'da geo-query native yok; affectedRadiusKm tipik 50-200 km
    // olduğundan tam tarama kaçınılmaz. Bounding box optimizasyonu için
    // geohash index'ine geçilebilir — şu an MVP.)
    const usersSnap = await db.collection('users').get();

    if (usersSnap.empty) {
      logger.info('[disaster-geofence] no users in collection');
      return;
    }

    const notificationsCol = db.collection('notifications');
    const batch = db.batch();
    let matchCount = 0;
    let scanned = 0;

    for (const userDoc of usersSnap.docs) {
      scanned++;
      const user = userDoc.data() as UserDoc;

      // Opt-in zorunlu
      if (user.preferences?.disasterAlerts !== true) continue;
      if (!user.lastKnownLocation) continue;
      if (
        typeof user.lastKnownLocation.lat !== 'number' ||
        typeof user.lastKnownLocation.lng !== 'number'
      ) continue;

      const dist = haversineDistanceKm(alert.coordinates, {
        lat: user.lastKnownLocation.lat,
        lng: user.lastKnownLocation.lng,
      });

      if (dist > radiusKm) continue;

      matchCount++;
      const notifRef = notificationsCol.doc();
      const distanceKmRounded = Math.round(dist * 10) / 10;

      batch.set(notifRef, {
        userId: userDoc.id,
        title: alert.title ?? 'Afet Uyarısı',
        body:
          alert.description ??
          `Konumunuza ${distanceKmRounded} km mesafede ${alert.severity ?? 'acil'} durum.`,
        type: 'disaster_alert',
        severity: alert.severity ?? 'normal',
        createdAt: FieldValue.serverTimestamp(),
        read: false,
        data: {
          disasterAlertId: alertId,
          severity: alert.severity ?? 'normal',
          alertType: alert.type ?? 'other',
          distanceKm: String(distanceKmRounded),
          location: alert.location ?? '',
          // iOS native push handler bu flag'i okuyup
          // interruptionLevel = 'timeSensitive' set eder
          timeSensitive: 'true',
          link: '/alerts',
          clickAction: '/alerts',
        },
      });

      // Firestore batch limit 500
      if (matchCount % 450 === 0) {
        await batch.commit();
        logger.info(`[disaster-geofence] partial commit @ ${matchCount}`);
      }
    }

    if (matchCount % 450 !== 0) {
      await batch.commit();
    }

    logger.info(
      `[disaster-geofence] alert=${alertId} scanned=${scanned} matched=${matchCount} radiusKm=${radiusKm}`,
    );

    // Audit info on the alert doc (best-effort)
    await snap.ref
      .update({
        geofence: {
          processedAt: FieldValue.serverTimestamp(),
          scanned,
          matched: matchCount,
          radiusKm,
        },
      })
      .catch((err) => logger.warn('[disaster-geofence] audit update failed', err));
  },
);
