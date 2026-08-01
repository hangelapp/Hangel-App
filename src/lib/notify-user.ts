/**
 * notify-user — unified 3-channel notification helper for hangel.
 *
 * Problem: Across the codebase, notification call-sites tend to write to only
 * ONE of three channels (push, in-app notification list, in-app message inbox).
 * As a result a user gets a push but no badge, or a badge but no inbox entry.
 *
 * Goal: A single helper that always fans out to the right channels in one call.
 *
 *   1. Firestore `notifications` collection  → /notifications page (badge)
 *   2. FCM push (`sendPushToUser`)            → device banner / Live Activity
 *   3. (opt) `messages` collection            → /messages inbox
 *
 * Channels run via Promise.allSettled, so a single channel failure (e.g. user
 * has no FCM token) never blocks the others. Each result is returned per
 * channel so callers can log if they wish.
 *
 * Collections written:
 *   - Top-level `notifications` (NOT users/{uid}/notifications sub-collection).
 *     This matches what /notifications page queries today
 *     (src/app/notifications/page.tsx — `where('userId', '==', authUser.uid)`).
 *   - Top-level `messages` only when `storeAsMessage: true`. Shape matches
 *     existing system messages (see api/notifications/welcome/route.ts).
 *
 * Authorship for system messages: when no `sender` is provided the message
 * inbox entry is written as if sent by `hangel-system` / `hangel Resmi`,
 * the same identity used by welcome + approve/reject routes.
 *
 * Auth model: Admin SDK only — relies on Firestore rules bypass. Must be
 * called from a server route (route.ts / Cloud Function), never from client.
 *
 * Idempotency: NOT enforced here. If the caller is in a retry loop, use a
 * dedupe key in `data` and check before calling.
 */

import { FieldValue } from 'firebase-admin/firestore';

import { COLLECTIONS } from '@/firebase/collections';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { sendPushToUser, type PushSendResult } from '@/lib/push-notifications';

/**
 * Known notification types. Extend as new flows are added — the helper
 * itself does not branch on type, but typed values reduce typos at
 * call-sites and let `getSoundForNotificationType` pick an APNs sound.
 */
export type NotifyUserType =
  | 'application_accepted'
  | 'application_approved' // alias kept for spec parity; treated same as accepted
  | 'application_rejected'
  | 'certificate_ready'
  | 'certificate_issued'
  | 'message'
  | 'welcome'
  | 'event_reminder'
  | 'event_created'
  | 'badge_earned'
  | 'volunteer_task'
  | 'blood_emergency'
  | 'disaster_alert'
  | 'opportunity'
  | (string & {}); // accept any future string without breaking type-check

export interface NotifyUserSender {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface NotifyUserArgs {
  userId: string;
  type: NotifyUserType;
  title: string;
  body: string;
  /** Deep link / route opened when push tapped (also stored on notification doc). */
  link?: string;
  /** Arbitrary structured payload kept on both notification + push.data. */
  data?: Record<string, unknown>;
  /** Optional sender. Defaults to hangel system identity. */
  sender?: NotifyUserSender;
  /** When true, also writes a row in `messages` for the inbox. */
  storeAsMessage?: boolean;
  /** Optional subject for the messages inbox row (defaults to `title`). */
  messageSubject?: string;
  /** Optional content for the messages inbox row (defaults to `body`). */
  messageContent?: string;
  /** Optional meta blob stored on the messages doc (e.g. ids for cross-link). */
  messageMeta?: Record<string, unknown>;
}

export interface NotifyUserResult {
  ok: boolean;
  notificationId: string | null;
  messageId: string | null;
  push: PushSendResult | null;
  errors: {
    notification?: string;
    message?: string;
    push?: string;
  };
}

const HANGEL_SYSTEM_UID = 'hangel-system';
const HANGEL_SYSTEM_NAME = 'hangel Resmi';

// Bildirim tipini kullanıcı ayar kategorisine eşler (settings/notifications sayfası
// `${kategori}-push` anahtarlarını `users/{uid}.notificationSettings`'e yazar).
// Eşlemesi olmayan tipler (welcome, application_*, blood_emergency, disaster_alert
// gibi kritik/işlemsel) DAİMA gönderilir — bunlar kapatılamaz.
// ⚠️ 2026-07: Bu ayarlar UI'da vardı ama gönderim yolunda HİÇ okunmuyordu; push
// bildirim okunma oranı %7 idi. Artık kullanıcının kapattığı kategori push almaz.
const TYPE_TO_PREF_CATEGORY: Record<string, string> = {
  badge_earned: 'new-badge',
  event_reminder: 'event-reminder',
  event_created: 'event-reminder',
  opportunity: 'new-opportunity',
  volunteer_task: 'new-opportunity',
  'onboarding-nudge': 'announcements',
  announcement: 'announcements',
  impact_report: 'impact-report',
  social: 'social',
};

/**
 * Kullanıcı bu bildirim TİPİ için PUSH almak istiyor mu?
 * - Kategori eşlemesi yoksa (kritik/işlemsel) → true (her zaman gönder).
 * - Eşleme varsa notificationSettings'teki `${kategori}-push` değerine bak
 *   (kayıt yoksa/okunamazsa varsayılan true — mevcut davranışı bozmadan).
 */
async function pushAllowedForUser(
  db: FirebaseFirestore.Firestore,
  userId: string,
  type: string,
): Promise<boolean> {
  const category = TYPE_TO_PREF_CATEGORY[type];
  if (!category) return true; // eşlemesiz tip = kritik, her zaman push
  try {
    const snap = await db.collection(COLLECTIONS.users).doc(userId).get();
    const settings = (snap.data()?.notificationSettings ?? {}) as Record<string, boolean>;
    const key = `${category}-push`;
    // Açıkça false ise atla; değilse (true veya tanımsız) gönder.
    return settings[key] !== false;
  } catch {
    return true; // ayar okunamazsa engelleme
  }
}

/**
 * Convert an arbitrary `data` record into the string-only map FCM requires
 * for `data` payloads. Non-string values are JSON-encoded; nullish dropped.
 */
function toPushData(
  data: Record<string, unknown> | undefined,
  extra: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...extra };
  if (!data) return out;
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

/**
 * Fan out a single notification to up to 3 channels:
 *   1. `notifications` collection (always)
 *   2. `messages` collection (only when storeAsMessage)
 *   3. FCM push (always; soft-fails if no tokens)
 *
 * Never throws — channel errors are captured in the returned result.
 */
export async function notifyUser(args: NotifyUserArgs): Promise<NotifyUserResult> {
  const {
    userId,
    type,
    title,
    body,
    link,
    data,
    sender,
    storeAsMessage,
    messageSubject,
    messageContent,
    messageMeta,
  } = args;

  if (!userId) {
    return {
      ok: false,
      notificationId: null,
      messageId: null,
      push: null,
      errors: { notification: 'userId required' },
    };
  }

  const db = getAdminFirestore();
  const createdBy = sender?.id ?? HANGEL_SYSTEM_UID;
  const senderName = sender?.name ?? HANGEL_SYSTEM_NAME;
  const senderAvatar = sender?.avatarUrl ?? '';

  // Channel 1 — in-app notifications (badge on /notifications)
  const notificationPromise = (async () => {
    const ref = db.collection(COLLECTIONS.notifications).doc();
    await ref.set({
      userId,
      type,
      title,
      body: body.slice(0, 200),
      ...(link ? { link } : {}),
      ...(data ? { data } : {}),
      read: false,
      pushSent: true, // inline push below — prevents Cloud Function double-send
      createdAt: FieldValue.serverTimestamp(),
      createdBy,
    });
    return ref.id;
  })();

  // Channel 2 — messages inbox (only if requested)
  const messagePromise = storeAsMessage
    ? (async () => {
        const ref = db.collection(COLLECTIONS.messages).doc();
        await ref.set({
          sender: {
            id: createdBy,
            name: senderName,
            avatarUrl: senderAvatar,
          },
          senderId: createdBy,
          senderType: sender ? 'user' : 'system',
          recipient: { id: userId, name: '', avatarUrl: '' },
          recipientId: userId,
          subject: messageSubject ?? title,
          content: messageContent ?? body,
          timestamp: FieldValue.serverTimestamp(),
          status: 'sent',
          ...(messageMeta || link
            ? { meta: { kind: type, ...(link ? { link } : {}), ...(messageMeta ?? {}) } }
            : {}),
        });
        return ref.id;
      })()
    : Promise.resolve<string | null>(null);

  // Channel 3 — FCM push (best-effort; no tokens = success with 0 sent).
  // Kullanıcı bu bildirim kategorisi için push'u KAPATTIYSA atla (in-app
  // notification yine yazılır — sadece cihaz banner'ı gönderilmez).
  const pushPromise = (async (): Promise<PushSendResult> => {
    const allowed = await pushAllowedForUser(db, userId, String(type));
    if (!allowed) {
      return { ok: true, successCount: 0, failureCount: 0, removedTokens: [], skippedByPreference: true };
    }
    return sendPushToUser(userId, {
      title,
      body,
      clickAction: link,
      data: toPushData(data, { type: String(type) }),
    });
  })();

  const [notifRes, msgRes, pushRes] = await Promise.allSettled([
    notificationPromise,
    messagePromise,
    pushPromise,
  ]);

  const errors: NotifyUserResult['errors'] = {};
  let notificationId: string | null = null;
  let messageId: string | null = null;
  let push: PushSendResult | null = null;

  if (notifRes.status === 'fulfilled') {
    notificationId = notifRes.value;
  } else {
    errors.notification = notifRes.reason instanceof Error ? notifRes.reason.message : String(notifRes.reason);
    console.warn('[notifyUser] notifications channel failed', { userId, type, error: errors.notification });
  }

  if (msgRes.status === 'fulfilled') {
    messageId = msgRes.value;
  } else {
    errors.message = msgRes.reason instanceof Error ? msgRes.reason.message : String(msgRes.reason);
    console.warn('[notifyUser] messages channel failed', { userId, type, error: errors.message });
  }

  if (pushRes.status === 'fulfilled') {
    push = pushRes.value;
    if (!push.ok && push.errorMessages?.length) {
      errors.push = push.errorMessages.join('; ');
    }
  } else {
    errors.push = pushRes.reason instanceof Error ? pushRes.reason.message : String(pushRes.reason);
    console.warn('[notifyUser] push channel failed', { userId, type, error: errors.push });
  }

  // ok = at least the persistent (notification) channel succeeded.
  // Push failures are tolerable (user may have no device token); message
  // failures are tolerable when storeAsMessage was opt-in.
  const ok = notificationId !== null;

  return { ok, notificationId, messageId, push, errors };
}
