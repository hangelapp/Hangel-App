/**
 * src/lib/santral/audit.ts
 *
 * callAuditLog Firestore yazıcısı. KVKK kritik: her metadata erişimi /
 * mutasyonu loglanır. Recording byte ASLA bu log'a düşmez — sadece event +
 * actor + resource referansı.
 *
 * Pattern: route handler'lar bu helper'ı çağırır; hata fırlatmaz (sessiz
 * yutar) — audit log hatası asıl iş akışını engellemez ama production'da
 * Cloud Logging breadcrumb bırakır.
 */
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const CALL_AUDIT_LOG = 'callAuditLog';

export interface AuditEventInput {
  /** İşlemi yapan kullanıcı uid'i — sistem event'leri için 'system'. */
  actorUid: string;
  /** Kanonik aksiyon adı: 'call.originate' | 'call.webhook.event' | 'numberPool.add' | ... */
  action: string;
  /** İlgili kaynak tipi ('callSessions' | 'santralNumberPool' | 'santralProviders'). */
  resourceType: string;
  /** İlgili kaynak doc id'si veya null (toplu liste sorguları için). */
  resourceId: string | null;
  /** Talep IP'si (request header'dan çıkar). */
  ipAddress?: string | null;
  /** Ek serializable metadata. KVKK: recording URL/byte yazma. */
  details?: Record<string, unknown>;
}

/**
 * callAuditLog'a tek event yaz. Hata fırlatmaz — caller'in kritik path'i bu
 * hata yüzünden patlamasın diye sessiz try/catch.
 */
export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const db = getAdminFirestore();
    await db.collection(CALL_AUDIT_LOG).add({
      actorUid: input.actorUid,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      timestamp: FieldValue.serverTimestamp(),
      ipAddress: input.ipAddress ?? null,
      details: sanitizeDetails(input.details),
    });
  } catch (err) {
    // Production: Cloud Logging breadcrumb. Test: silent.
    // eslint-disable-next-line no-console
    console.warn('[santral/audit] log write failed', err instanceof Error ? err.message : err);
  }
}

/**
 * details içinde gelebilecek hassas alanları temizle. KVKK: recording byte
 * veya URL bu nesnede ASLA olmamalı; defansif olarak filtrele.
 */
function sanitizeDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!details) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    // Blacklist: recording byte / signed URL / authorization header
    if (/recording.*(url|bytes|content|signedUrl)/i.test(k)) continue;
    if (/authorization|cookie|password|secret/i.test(k)) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Request header'dan client IP'sini güvenli çıkar.
 */
export function clientIpFromRequest(req: Request): string | null {
  return (
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    null
  );
}
