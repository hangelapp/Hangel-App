/**
 * Append-only audit log yazıcısı.
 * Mutating her API route audit.log(...) çağırmalı.
 * Server-only — getAdminFirestore() üzerinden yazar.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export type AuditAction =
  | 'campaign.created'
  | 'campaign.scheduled'
  | 'campaign.enqueued'
  | 'campaign.sent'
  | 'campaign.cancelled'
  | 'template.created'
  | 'template.updated'
  | 'template.deleted'
  | 'segment.created'
  | 'segment.updated'
  | 'segment.deleted'
  | 'provider.updated'
  | 'consent.imported'
  | 'consent.exported'
  | 'consent.optIn'
  | 'consent.optOut'
  | 'unsubscribe';

export interface AuditActor {
  uid: string;
  email?: string | null;
}

export interface AuditContext {
  ip?: string;
  userAgent?: string;
}

export interface AuditPayload {
  campaignId?: string;
  templateId?: string;
  segmentId?: string;
  channel?: string;
  useCase?: string;
  recipientCount?: number;
  scheduledAt?: Date | null;
  resultCounts?: Record<string, number>;
  diff?: { before?: unknown; after?: unknown };
  notes?: string;
}

export async function logAudit(
  actor: AuditActor,
  action: AuditAction,
  payload: AuditPayload = {},
  context: AuditContext = {}
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTIONS.messagingAuditLogs).add({
    at: FieldValue.serverTimestamp(),
    actorUid: actor.uid,
    actorEmail: actor.email ?? null,
    action,
    payload,
    ip: context.ip ?? null,
    userAgent: context.userAgent ?? null,
  });
}

export function actorFromRequest(req: Request, uid: string, email?: string | null): {
  actor: AuditActor;
  context: AuditContext;
} {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  return { actor: { uid, email }, context: { ip, userAgent } };
}
